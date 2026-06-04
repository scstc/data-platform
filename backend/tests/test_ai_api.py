"""AI 路由 HTTP 层测试（默认启发式 provider，零外部依赖）。

覆盖三端点的契约形状与启发式行为：
- infer-schema：JSONL 样本 → format=application/x-ndjson、fields 非空且字段名正确
- generate-task：中文 prompt → cron 与数据源类型正确
- qa：命中固定问答（数据源类型）

所有响应都断言 ``{data, success}`` 包装与 camelCase 字段名（契约硬要求）。
"""

from __future__ import annotations

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


# ---------------------------------------------------------------------------
# infer-schema
# ---------------------------------------------------------------------------
async def test_infer_schema_jsonl(client: AsyncClient) -> None:
    """JSONL 样本应识别为 ndjson，fields 含全部字段且类型正确。"""
    sample = (
        '{"id": 1, "name": "Alice", "active": true}\n'
        '{"id": 2, "name": "Bob", "active": false}\n'
        '{"id": 3, "name": "Cara", "active": true}'
    )
    resp = await client.post("/api/v1/ai/infer-schema", json={"sample": sample})

    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True

    data = body["data"]
    # JSONL 的契约 format
    assert data["format"] == "application/x-ndjson"
    assert isinstance(data["confidence"], (int, float))

    fields = data["fields"]
    assert len(fields) >= 1  # fields 非空
    by_name = {f["name"]: f for f in fields}
    assert {"id", "name", "active"} <= set(by_name)
    assert by_name["id"]["type"] == "integer"
    assert by_name["name"]["type"] == "string"
    assert by_name["active"]["type"] == "boolean"

    # camelCase 字段名（recommendedConfig 而非 recommended_config）
    assert "recommendedConfig" in data
    assert data["recommendedConfig"]["format"] == "jsonl"
    # 单字段必须存在且为契约约定的 key
    for f in fields:
        assert set(f) == {"name", "type", "example", "nullable"}


async def test_infer_schema_plaintext_fallback(client: AsyncClient) -> None:
    """无结构样本回退纯文本单字段 text。"""
    resp = await client.post(
        "/api/v1/ai/infer-schema", json={"sample": "这是一段没有结构的纯文本"}
    )
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["format"] == "text/plain"
    assert data["fields"][0]["name"] == "text"
    assert data["fields"][0]["type"] == "string"


# ---------------------------------------------------------------------------
# generate-task
# ---------------------------------------------------------------------------
async def test_generate_task_daily_database(client: AsyncClient) -> None:
    """中文 prompt：每天凌晨 2 点 + 达梦数据库 → cron 与类型正确。"""
    resp = await client.post(
        "/api/v1/ai/generate-task",
        json={"prompt": "每天凌晨2点从达梦数据库采集用户表"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True

    data = body["data"]
    # camelCase：datasourceType
    assert data["datasourceType"] == "database"
    assert data["schedule"]["mode"] == "cron"
    assert data["schedule"]["cron"] == "0 2 * * *"
    assert data["config"]["dbKind"] == "dameng"
    assert isinstance(data["name"], str) and data["name"]
    assert isinstance(data["explanation"], str) and data["explanation"]


async def test_generate_task_hourly_s3(client: AsyncClient) -> None:
    """每小时 + 对象存储 → 每小时 cron，类型 s3。"""
    resp = await client.post(
        "/api/v1/ai/generate-task",
        json={"prompt": "每小时从S3对象存储同步一次数据"},
    )
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["datasourceType"] == "s3"
    assert data["schedule"] == {"mode": "cron", "cron": "0 * * * *"}


async def test_generate_task_once_default_api(client: AsyncClient) -> None:
    """无周期/数据源关键词 → 单次执行，默认 api。"""
    resp = await client.post(
        "/api/v1/ai/generate-task", json={"prompt": "随便采集点东西"}
    )
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["schedule"]["mode"] == "once"
    assert data["datasourceType"] == "api"


# ---------------------------------------------------------------------------
# qa
# ---------------------------------------------------------------------------
async def test_qa_hits_fixed_answer(client: AsyncClient) -> None:
    """命中「支持哪些数据源」固定问答，答案提到 4 类数据源。"""
    resp = await client.post(
        "/api/v1/ai/qa", json={"question": "平台支持哪些数据源？"}
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    answer = body["data"]["answer"]
    assert isinstance(answer, str) and answer
    # 命中固定问答而非兜底（兜底语含「抱歉」）
    assert "抱歉" not in answer
    assert "数据源" in answer


async def test_qa_fallback(client: AsyncClient) -> None:
    """未命中任何关键词 → 兜底引导语。"""
    resp = await client.post(
        "/api/v1/ai/qa", json={"question": "今天天气怎么样"}
    )
    assert resp.status_code == 200
    answer = resp.json()["data"]["answer"]
    assert "抱歉" in answer
