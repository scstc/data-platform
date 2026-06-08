"""采集运行记录 ORM 模型(每次运行一条明细)。"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class IngestRun(Base):
    """采集任务的一次运行:状态、拉取行数、产出数据集、起止时间。"""

    __tablename__ = "ingest_runs"

    # 主键形如 "run-" + 6 位 hex
    id: Mapped[str] = mapped_column(String, primary_key=True)
    task_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    # 状态：success | failed
    status: Mapped[str] = mapped_column(String, nullable=False)
    # 本次拉取总行数 / 产出数据集个数
    rows: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    dataset_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    # 产出概要列表：[{datasetId, datasetName, versionId, versionNo, rows}]
    outputs: Mapped[list[dict[str, Any]] | None] = mapped_column(JSONB, nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime] = mapped_column(nullable=False)
    finished_at: Mapped[datetime | None] = mapped_column(nullable=True)
