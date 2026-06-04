"""采集任务相关 schema，对照 frontend typings.d.ts 的 IngestTask 系列类型。"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from app.schemas.common import CamelModel

IngestTaskStatus = Literal["pending", "running", "success", "failed"]


class IngestSchedule(CamelModel):
    """调度配置。"""

    mode: Literal["once", "cron"]
    cron: str | None = None


class IngestTaskRead(CamelModel):
    """采集任务读模型（响应）。"""

    id: str
    name: str
    datasource_id: str
    datasource_name: str
    schedule: IngestSchedule
    status: IngestTaskStatus
    progress: int
    created_at: datetime
    last_run_at: datetime | None = None
    logs: list[str] | None = None


class IngestTaskCreate(CamelModel):
    """新建采集任务入参。

    filters 为前端可选透传字段，契约实体中无对应列，此处仅接受不持久化。
    """

    name: str
    datasource_id: str
    schedule: IngestSchedule
    filters: dict[str, Any] | None = None
