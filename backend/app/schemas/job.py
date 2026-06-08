"""加工任务(Job)相关 schema。"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from app.schemas.common import CamelModel


class OperatorSpec(CamelModel):
    """编排里的一个算子:名称 + 参数。"""

    name: str
    params: dict[str, Any] | None = None


class JobCreate(CamelModel):
    """新建加工任务入参:对某个数据集版本跑一串算子。"""

    name: str
    type: str = "clean"
    dataset_version_id: str
    operators: list[OperatorSpec]


class JobRead(CamelModel):
    """加工任务读模型。"""

    id: str
    name: str
    type: str
    state: str
    progress: int
    error: str | None = None
    config_yaml: str | None = None
    created_at: datetime
    started_at: datetime | None = None
    finished_at: datetime | None = None
    # 产物概要：{datasetId, datasetName, versionId, versionNo, rows}
    output: dict[str, Any] | None = None
