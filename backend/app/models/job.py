"""任务 ORM 模型(唯一改动数据的执行单元)。"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class Job(Base):
    """通用任务:读入版本、跑 data-juicer、产出新版本。

    `type` + `config_yaml` 做特化;ingest/clean/quality/synth/process/safety/annotate
    共用此表与状态机。承载 #6–#10;后续 ingest_task 收编进此表(type=ingest)。
    """

    __tablename__ = "jobs"

    # 主键形如 "job-" + 6 位 hex
    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    # 类型:ingest | clean | quality | synth | process | safety | annotate
    type: Mapped[str] = mapped_column(String, nullable=False)
    # 状态机:pending | running | success | failed | cancelled
    state: Mapped[str] = mapped_column(String, nullable=False, default="pending")
    # data-juicer recipe(由 YAML 生成器产出);可空(草稿/排队中)
    config_yaml: Mapped[str | None] = mapped_column(Text, nullable=True)
    # 进度 0~100
    progress: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    # 日志路径(目录/文件);产出版本经 DatasetVersion.produced_by_job_id 反查
    logs_uri: Mapped[str | None] = mapped_column(String, nullable=True)
    # 失败原因
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[str] = mapped_column(String, nullable=False, default="admin")
    created_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), nullable=False
    )
    started_at: Mapped[datetime | None] = mapped_column(nullable=True)
    finished_at: Mapped[datetime | None] = mapped_column(nullable=True)
