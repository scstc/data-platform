"""采集任务 ORM 模型。"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import Integer, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class IngestTask(Base):
    """采集任务：从数据源拉取数据，带调度与进度状态机。"""

    __tablename__ = "ingest_tasks"

    # 主键形如 "task-" + 6 位 hex
    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    datasource_id: Mapped[str] = mapped_column(String, nullable=False)
    datasource_name: Mapped[str] = mapped_column(String, nullable=False)
    # 调度配置：{mode:'once'|'cron', cron?:str}
    schedule: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    # 状态：pending | running | success | failed
    status: Mapped[str] = mapped_column(String, nullable=False)
    progress: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    # 日志列表 list[str]
    logs: Mapped[list[str]] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), nullable=False
    )
    last_run_at: Mapped[datetime | None] = mapped_column(nullable=True)
