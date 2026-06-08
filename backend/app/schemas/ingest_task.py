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


class IngestExtract(CamelModel):
    """采集对象（extract spec）：拉什么。

    mode=table 用 tables（勾选的表名列表，每张表各产一个数据集，支持 schema.table）；
    mode=sql 用 sql（单条查询语句，产一个数据集）。
    """

    mode: Literal["table", "sql"]
    tables: list[str] | None = None
    sql: str | None = None


class IngestTaskRead(CamelModel):
    """采集任务读模型（响应）。"""

    id: str
    name: str
    datasource_id: str
    datasource_name: str
    schedule: IngestSchedule
    extract: IngestExtract | None = None
    status: IngestTaskStatus
    progress: int
    created_at: datetime
    last_run_at: datetime | None = None
    logs: list[str] | None = None
    # 产物概要列表（仅详情接口填充）：每项 {datasetId, datasetName, versionId, versionNo, rows}
    output: list[dict[str, Any]] | None = None


class IngestTaskCreate(CamelModel):
    """新建采集任务入参。"""

    name: str
    datasource_id: str
    schedule: IngestSchedule
    extract: IngestExtract | None = None
