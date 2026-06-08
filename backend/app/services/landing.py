"""接入落地契约:把任意来源规范化为 DJ 可读的 jsonl,落地为受管 DatasetVersion。

这是 M0 地基的"输入前提":任何连接器(上传 / S3 / HDFS / DB)最终都调用本服务,
产出 `origin=managed` 的不可变版本。当前实现首个连接器——本地上传。
首次落地无 Job,故 `produced_by_job_id` 为空(模型允许)。
"""

from __future__ import annotations

import csv
import io
import json
import secrets
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.dataset import Dataset
from app.models.dataset_version import DatasetVersion

# 当前可直接落地的源格式;PDF/PPT/DOC/Office/HTML 的文档解析留到 #3
LANDABLE_FORMATS = {"jsonl", "json", "csv", "tsv", "txt"}


class LandingError(ValueError):
    """落地失败的基类。"""


class UnsupportedFormatError(LandingError):
    """源格式当前不支持直接落地(如 PDF/Office,见 #3 文档解析)。"""


class ParseError(LandingError):
    """源文件内容无法按其格式解析。"""


def _new_dataset_id() -> str:
    """形如 ``dset-`` + 6 位 hex。"""
    return f"dset-{secrets.token_hex(3)}"


def _new_version_id() -> str:
    """形如 ``dsv-`` + 6 位 hex。"""
    return f"dsv-{secrets.token_hex(3)}"


def normalize_to_records(content: bytes, fmt: str) -> list[dict]:
    """把源文件字节按格式规范化为记录列表(每条 → jsonl 一行)。

    - jsonl:逐行 JSON
    - json :顶层 list → 每元素一条;顶层 object → 单条
    - csv/tsv:表头为字段名,每行一条
    - txt :每非空行 → {"text": 行}
    其余格式抛 UnsupportedFormatError。解析失败抛 ParseError。
    """
    fmt = fmt.lower()
    if fmt not in LANDABLE_FORMATS:
        raise UnsupportedFormatError(fmt)
    try:
        text = content.decode("utf-8")
        if fmt == "jsonl":
            return [json.loads(ln) for ln in text.splitlines() if ln.strip()]
        if fmt == "json":
            data = json.loads(text)
            if isinstance(data, list):
                return [d if isinstance(d, dict) else {"value": d} for d in data]
            return [data]
        if fmt in ("csv", "tsv"):
            delimiter = "," if fmt == "csv" else "\t"
            reader = csv.DictReader(io.StringIO(text), delimiter=delimiter)
            return [dict(row) for row in reader]
        # txt
        return [{"text": ln} for ln in text.splitlines() if ln.strip()]
    except (json.JSONDecodeError, UnicodeDecodeError, csv.Error) as exc:
        raise ParseError(str(exc)) from exc


async def land_records(
    session: AsyncSession,
    records: list[dict],
    *,
    dataset_name: str,
    data_type: str | None = None,
    description: str | None = None,
    note: str | None = None,
    produced_by_job_id: str | None = None,
    creator: str = "admin",
) -> tuple[Dataset, DatasetVersion]:
    """统一落地出口:把规范化记录写 jsonl → 建 Dataset(v1) + DatasetVersion。

    所有连接器(上传 / 采集 / ...)最终都汇到这里。`produced_by_job_id` 记录
    产出者(上传为空;采集传任务 id),即血缘上游。非 JSON 原生类型(datetime/
    Decimal 等)经 `default=str` 兜底为字符串。
    """
    dataset = Dataset(
        id=_new_dataset_id(),
        name=dataset_name or "未命名数据集",
        description=description,
        data_type=data_type,
        owner=creator,
        creator=creator,
    )
    session.add(dataset)

    out_dir = Path(settings.datasets_dir) / dataset.id / "v1"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "data.jsonl"
    with out_path.open("w", encoding="utf-8") as fp:
        for rec in records:
            fp.write(json.dumps(rec, ensure_ascii=False, default=str) + "\n")

    version = DatasetVersion(
        id=_new_version_id(),
        dataset_id=dataset.id,
        version_no=1,
        storage_uri=str(out_path),
        format="jsonl",
        rows=len(records),
        size=out_path.stat().st_size,
        origin="managed",
        produced_by_job_id=produced_by_job_id,
        note=note,
    )
    session.add(version)
    await session.commit()
    await session.refresh(dataset)
    await session.refresh(version)
    return dataset, version


async def land_upload(
    session: AsyncSession,
    *,
    content: bytes,
    filename: str,
    source_format: str,
    dataset_name: str | None = None,
    data_type: str | None = None,
    description: str | None = None,
    creator: str = "admin",
) -> tuple[Dataset, DatasetVersion]:
    """本地上传连接器:规范化 → 落地。解析失败抛 LandingError,不留脏对象。"""
    records = normalize_to_records(content, source_format)
    return await land_records(
        session,
        records,
        dataset_name=dataset_name or Path(filename).stem or "未命名数据集",
        data_type=data_type,
        description=description,
        note=f"本地上传落地:{filename}",
        creator=creator,
    )
