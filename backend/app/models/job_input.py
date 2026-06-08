"""任务输入 ORM 模型(Job ↔ DatasetVersion 多对多,血缘的边)。"""

from __future__ import annotations

from sqlalchemy import Index, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class JobInput(Base):
    """一个 Job 消费的输入版本;多条即多输入。

    与 DatasetVersion.produced_by_job_id 一起构成血缘图(#11):
    版本 ← 产出它的 job ← 该 job 消费的输入版本,可递归回溯。
    """

    __tablename__ = "job_inputs"

    __table_args__ = (
        # 反向血缘:按输入版本查它喂给了哪些 job
        Index("ix_job_inputs_version", "dataset_version_id"),
    )

    # 联合主键:一个 job 对同一版本只记一次
    job_id: Mapped[str] = mapped_column(String, primary_key=True)
    dataset_version_id: Mapped[str] = mapped_column(String, primary_key=True)
