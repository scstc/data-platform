"""采集任务路由：/ingest-tasks 系列端点与进度状态机。

状态机要点：
- create        → status=pending、progress=0、logs=["[INFO] 任务已创建"]，
                  datasource_name 从数据源表冗余（数据源不存在 → 404）。
- GET detail    → 若 running：progress += 20；满 100 转 success 并补"任务完成"日志。
- rerun         → 重置为 running、progress=0、last_run_at=now、追加日志。
- stop          → 转 failed、追加"[WARN] 任务被手动停止"。
- delete        → 删除记录。

单对象响应统一 {data:{...}, success:true}；未命中 404 + {success:false, message:str}。
"""

from __future__ import annotations

import secrets
from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response, status
from fastapi.responses import JSONResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.models.datasource import DataSource
from app.models.ingest_task import IngestTask
from app.schemas.common import CamelModel, PageResponse
from app.schemas.ingest_task import IngestTaskCreate, IngestTaskRead

router = APIRouter(tags=["ingest-tasks"])

SessionDep = Annotated[AsyncSession, Depends(get_session)]

PROGRESS_STEP = 20
PROGRESS_DONE = 100


class IngestTaskItemResponse(CamelModel):
    """单个采集任务响应：{data:{...}, success:true}。"""

    data: IngestTaskRead
    success: bool = True


def _new_task_id() -> str:
    """生成 "task-" + 6 位 hex 主键。"""
    return f"task-{secrets.token_hex(3)}"


def _now() -> datetime:
    """当前 UTC 时间（naive，与 last_run_at 列 TIMESTAMP WITHOUT TIME ZONE 对齐）。"""
    return datetime.now(UTC).replace(tzinfo=None)


def _not_found() -> JSONResponse:
    """统一 404：{success:false, message:str}。"""
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"success": False, "message": "任务不存在"},
    )


def _item(task: IngestTask) -> dict:
    """把 ORM 任务序列化为 camelCase 单对象响应体。"""
    return IngestTaskItemResponse(data=IngestTaskRead.model_validate(task)).model_dump(
        by_alias=True, mode="json"
    )


@router.get("/ingest-tasks", response_model=PageResponse[IngestTaskRead])
async def list_ingest_tasks(
    session: SessionDep,
    current: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, alias="pageSize")] = 10,
    name: Annotated[str | None, Query()] = None,
    status_: Annotated[str | None, Query(alias="status")] = None,
) -> PageResponse[IngestTaskRead]:
    """分页列出采集任务，支持 name 模糊、status 精确筛选。"""
    stmt = select(IngestTask)
    count_stmt = select(func.count()).select_from(IngestTask)
    if name:
        stmt = stmt.where(IngestTask.name.ilike(f"%{name}%"))
        count_stmt = count_stmt.where(IngestTask.name.ilike(f"%{name}%"))
    if status_:
        stmt = stmt.where(IngestTask.status == status_)
        count_stmt = count_stmt.where(IngestTask.status == status_)

    total = await session.scalar(count_stmt) or 0
    offset = (current - 1) * page_size
    stmt = stmt.order_by(IngestTask.created_at.desc()).offset(offset).limit(page_size)
    rows = (await session.scalars(stmt)).all()
    return PageResponse[IngestTaskRead](
        data=[IngestTaskRead.model_validate(r) for r in rows],
        total=total,
    )


@router.post("/ingest-tasks")
async def create_ingest_task(
    payload: IngestTaskCreate,
    session: SessionDep,
) -> Response:
    """新建采集任务：校验数据源存在并冗余其名称，初始 pending/0。"""
    datasource = await session.get(DataSource, payload.datasource_id)
    if datasource is None:
        return _not_found()

    task = IngestTask(
        id=_new_task_id(),
        name=payload.name,
        datasource_id=payload.datasource_id,
        datasource_name=datasource.name,
        schedule=payload.schedule.model_dump(),
        status="pending",
        progress=0,
        logs=["[INFO] 任务已创建"],
    )
    session.add(task)
    await session.commit()
    await session.refresh(task)
    return JSONResponse(content=_item(task))


@router.get("/ingest-tasks/{task_id}")
async def get_ingest_task(
    task_id: str,
    session: SessionDep,
) -> Response:
    """获取任务详情；running 状态每次访问推进进度 +20，满 100 转 success。"""
    task = await session.get(IngestTask, task_id)
    if task is None:
        return _not_found()

    if task.status == "running":
        task.progress = min(PROGRESS_DONE, task.progress + PROGRESS_STEP)
        task.logs = [*task.logs, f"[INFO] 进度推进至 {task.progress}%"]
        if task.progress >= PROGRESS_DONE:
            task.progress = PROGRESS_DONE
            task.status = "success"
            task.logs = [*task.logs, "[INFO] 任务完成"]
        await session.commit()
        await session.refresh(task)
    return JSONResponse(content=_item(task))


@router.post("/ingest-tasks/{task_id}/rerun")
async def rerun_ingest_task(
    task_id: str,
    session: SessionDep,
) -> Response:
    """重跑：重置为 running、progress=0、刷新 last_run_at 并追加日志。"""
    task = await session.get(IngestTask, task_id)
    if task is None:
        return _not_found()

    task.status = "running"
    task.progress = 0
    task.last_run_at = _now()
    task.logs = [*task.logs, "[INFO] 任务重跑，进度重置为 0"]
    await session.commit()
    await session.refresh(task)
    return JSONResponse(content=_item(task))


@router.post("/ingest-tasks/{task_id}/stop")
async def stop_ingest_task(
    task_id: str,
    session: SessionDep,
) -> Response:
    """停止：转 failed 并追加手动停止日志。"""
    task = await session.get(IngestTask, task_id)
    if task is None:
        return _not_found()

    task.status = "failed"
    task.last_run_at = _now()
    task.logs = [*task.logs, "[WARN] 任务被手动停止"]
    await session.commit()
    await session.refresh(task)
    return JSONResponse(content=_item(task))


@router.delete("/ingest-tasks/{task_id}")
async def delete_ingest_task(
    task_id: str,
    session: SessionDep,
) -> Response:
    """删除采集任务。"""
    task = await session.get(IngestTask, task_id)
    if task is None:
        return _not_found()

    await session.delete(task)
    await session.commit()
    return JSONResponse(content={"success": True})
