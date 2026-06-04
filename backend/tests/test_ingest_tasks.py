"""采集任务路由测试：完整状态机走查 + 列表筛选。

状态机走查链路：
create(pending) → rerun(running) → 连续 GET 推进至 success → stop(failed) → delete。
另覆盖：数据源不存在 → 404、单条 404、列表 name/status 筛选。

数据源通过 session_factory 直接落库，避免依赖 datasources 路由。
"""

from __future__ import annotations

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.models.datasource import DataSource


async def _seed_datasource(
    session_factory: async_sessionmaker,
    ds_id: str = "ds-aaa111",
    name: str = "测试对象存储",
) -> DataSource:
    """直接落库一个数据源，供采集任务引用。"""
    async with session_factory() as session:
        ds = DataSource(
            id=ds_id,
            name=name,
            type="s3",
            status="connected",
            config={"bucket": "b"},
            creator="admin",
        )
        session.add(ds)
        await session.commit()
        await session.refresh(ds)
        return ds


async def _create_task(
    client: AsyncClient, datasource_id: str, name: str = "每日同步任务"
) -> dict:
    """创建任务并返回 data 部分。"""
    resp = await client.post(
        "/api/v1/ingest-tasks",
        json={
            "name": name,
            "datasourceId": datasource_id,
            "schedule": {"mode": "cron", "cron": "0 2 * * *"},
        },
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["success"] is True
    return body["data"]


@pytest.mark.asyncio
async def test_create_validates_datasource_exists(client: AsyncClient) -> None:
    """数据源不存在时创建返回 404 + {success:false, message}。"""
    resp = await client.post(
        "/api/v1/ingest-tasks",
        json={
            "name": "孤儿任务",
            "datasourceId": "ds-nope00",
            "schedule": {"mode": "once"},
        },
    )
    assert resp.status_code == 404
    body = resp.json()
    assert body["success"] is False
    assert isinstance(body["message"], str)


@pytest.mark.asyncio
async def test_create_sets_pending_and_redundant_name(
    client: AsyncClient, session_factory: async_sessionmaker
) -> None:
    """创建成功：初始 pending/0、日志为创建提示、冗余数据源名称、id 前缀正确。"""
    ds = await _seed_datasource(session_factory)
    data = await _create_task(client, ds.id)

    assert data["id"].startswith("task-")
    assert data["status"] == "pending"
    assert data["progress"] == 0
    assert data["datasourceId"] == ds.id
    assert data["datasourceName"] == ds.name  # 冗余自数据源表
    assert data["logs"] == ["[INFO] 任务已创建"]
    assert data["lastRunAt"] is None
    # schedule 透传且为 camelCase 结构
    assert data["schedule"] == {"mode": "cron", "cron": "0 2 * * *"}


@pytest.mark.asyncio
async def test_full_state_machine(
    client: AsyncClient, session_factory: async_sessionmaker
) -> None:
    """走查：create→rerun→连续 GET 推进到 success→stop→delete。"""
    ds = await _seed_datasource(session_factory)
    task = await _create_task(client, ds.id)
    task_id = task["id"]

    # 1) pending 任务 GET 不推进进度
    resp = await client.get(f"/api/v1/ingest-tasks/{task_id}")
    assert resp.status_code == 200
    assert resp.json()["data"]["progress"] == 0
    assert resp.json()["data"]["status"] == "pending"

    # 2) rerun → running、progress 重置 0、last_run_at 落值
    resp = await client.post(f"/api/v1/ingest-tasks/{task_id}/rerun")
    assert resp.status_code == 200
    rerun = resp.json()["data"]
    assert rerun["status"] == "running"
    assert rerun["progress"] == 0
    assert rerun["lastRunAt"] is not None

    # 3) 连续 GET：每次 +20，第 5 次到 100 转 success
    expected = [20, 40, 60, 80, 100]
    for step in expected:
        resp = await client.get(f"/api/v1/ingest-tasks/{task_id}")
        data = resp.json()["data"]
        assert data["progress"] == step
        if step < 100:
            assert data["status"] == "running"
        else:
            assert data["status"] == "success"
            assert "[INFO] 任务完成" in data["logs"]

    # 4) success 后再 GET 不再推进
    resp = await client.get(f"/api/v1/ingest-tasks/{task_id}")
    data = resp.json()["data"]
    assert data["progress"] == 100
    assert data["status"] == "success"

    # 5) stop → failed、追加手动停止日志
    resp = await client.post(f"/api/v1/ingest-tasks/{task_id}/stop")
    assert resp.status_code == 200
    stopped = resp.json()["data"]
    assert stopped["status"] == "failed"
    assert "[WARN] 任务被手动停止" in stopped["logs"]

    # 6) delete → success:true，再 GET 404
    resp = await client.delete(f"/api/v1/ingest-tasks/{task_id}")
    assert resp.status_code == 200
    assert resp.json()["success"] is True

    resp = await client.get(f"/api/v1/ingest-tasks/{task_id}")
    assert resp.status_code == 404
    assert resp.json()["success"] is False


@pytest.mark.asyncio
async def test_rerun_from_success_resets_to_running(
    client: AsyncClient, session_factory: async_sessionmaker
) -> None:
    """已完成任务 rerun 后应回到 running/0，可再次被 GET 推进。"""
    ds = await _seed_datasource(session_factory)
    task = await _create_task(client, ds.id)
    task_id = task["id"]

    await client.post(f"/api/v1/ingest-tasks/{task_id}/rerun")
    for _ in range(5):
        await client.get(f"/api/v1/ingest-tasks/{task_id}")
    resp = await client.get(f"/api/v1/ingest-tasks/{task_id}")
    assert resp.json()["data"]["status"] == "success"

    resp = await client.post(f"/api/v1/ingest-tasks/{task_id}/rerun")
    again = resp.json()["data"]
    assert again["status"] == "running"
    assert again["progress"] == 0

    resp = await client.get(f"/api/v1/ingest-tasks/{task_id}")
    assert resp.json()["data"]["progress"] == 20


@pytest.mark.asyncio
async def test_action_endpoints_404_when_missing(client: AsyncClient) -> None:
    """rerun/stop/delete 命中不存在的任务均 404 + {success:false}。"""
    for method, path in (
        ("post", "/api/v1/ingest-tasks/task-zzzzzz/rerun"),
        ("post", "/api/v1/ingest-tasks/task-zzzzzz/stop"),
        ("delete", "/api/v1/ingest-tasks/task-zzzzzz"),
    ):
        resp = await getattr(client, method)(path)
        assert resp.status_code == 404, (method, path)
        assert resp.json()["success"] is False


@pytest.mark.asyncio
async def test_list_pagination_and_filters(
    client: AsyncClient, session_factory: async_sessionmaker
) -> None:
    """列表分页响应形状、name 模糊与 status 精确筛选。"""
    ds = await _seed_datasource(session_factory)
    # 造 3 个任务：两个含「同步」，一个含「导出」
    t_sync_a = await _create_task(client, ds.id, name="对象存储同步")
    await _create_task(client, ds.id, name="日志增量同步")
    await _create_task(client, ds.id, name="全量导出")

    # 全量列表：分页响应形状
    resp = await client.get("/api/v1/ingest-tasks?current=1&pageSize=10")
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert body["total"] == 3
    assert len(body["data"]) == 3

    # name 模糊筛选
    resp = await client.get("/api/v1/ingest-tasks", params={"name": "同步"})
    body = resp.json()
    assert body["total"] == 2
    assert all("同步" in item["name"] for item in body["data"])

    # status 精确筛选：把其中一个推进到 running，再按 status=running 过滤
    await client.post(f"/api/v1/ingest-tasks/{t_sync_a['id']}/rerun")
    resp = await client.get("/api/v1/ingest-tasks", params={"status": "running"})
    body = resp.json()
    assert body["total"] == 1
    assert body["data"][0]["id"] == t_sync_a["id"]
    assert body["data"][0]["status"] == "running"

    # 分页：pageSize=2 → 第一页 2 条，total 仍为 3
    resp = await client.get("/api/v1/ingest-tasks?current=1&pageSize=2")
    body = resp.json()
    assert body["total"] == 3
    assert len(body["data"]) == 2
