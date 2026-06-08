"""数据集路由:上传落地 POST /datasets/upload、列表 GET /datasets、详情 GET /datasets/{id}。"""

from __future__ import annotations

from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile
from fastapi.responses import JSONResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.models.dataset import Dataset
from app.models.dataset_version import DatasetVersion
from app.schemas.common import CamelModel, PageResponse
from app.schemas.dataset import DatasetDetailRead, DatasetRead, DatasetVersionRead
from app.services.landing import LandingError, UnsupportedFormatError, land_upload

router = APIRouter(tags=["datasets"])

# 依赖别名(与其他路由同款,规避 ruff B008)
SessionDep = Annotated[AsyncSession, Depends(get_session)]
UploadFileDep = Annotated[UploadFile, File(...)]
NameForm = Annotated[str | None, Form()]
DataTypeForm = Annotated[str | None, Form()]
DescForm = Annotated[str | None, Form()]


class DatasetResult(CamelModel):
    """单个数据集详情响应:{data:DatasetDetail, success:true}。"""

    data: DatasetDetailRead
    success: bool = True


def _file_ext(filename: str) -> str:
    """取扩展名(小写、不含点);无扩展名返回空串。"""
    suffix = Path(filename).suffix
    return suffix[1:].lower() if suffix else ""


def _to_detail(
    dataset: Dataset, versions: list[DatasetVersion]
) -> DatasetDetailRead:
    """组装数据集详情(元信息 + 版本列表)。"""
    detail = DatasetDetailRead.model_validate(dataset)
    detail.versions = [DatasetVersionRead.model_validate(v) for v in versions]
    return detail


@router.post("/datasets/upload")
async def upload_as_dataset(
    file: UploadFileDep,
    session: SessionDep,
    name: NameForm = None,
    data_type: DataTypeForm = None,
    description: DescForm = None,
) -> JSONResponse:
    """本地上传连接器:文件 → 规范化 jsonl → 受管 Dataset(v1) + DatasetVersion。"""
    filename = file.filename or ""
    fmt = _file_ext(filename)
    content = await file.read()
    try:
        dataset, version = await land_upload(
            session,
            content=content,
            filename=filename,
            source_format=fmt,
            dataset_name=name,
            data_type=data_type,
            description=description,
        )
    except UnsupportedFormatError:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": f"格式 .{fmt} 暂不支持直接落地"
                "(PDF/Office/HTML 文档解析见 #3);当前支持 jsonl/json/csv/tsv/txt",
            },
        )
    except LandingError as exc:
        return JSONResponse(
            status_code=400,
            content={"success": False, "message": f"解析失败:{exc}"},
        )

    payload = DatasetResult(data=_to_detail(dataset, [version]))
    return JSONResponse(content=payload.model_dump(by_alias=True, mode="json"))


@router.get("/datasets", response_model=PageResponse[DatasetRead])
async def list_datasets(
    session: SessionDep,
    current: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, alias="pageSize"),
) -> PageResponse[DatasetRead]:
    """分页查询数据集,按创建时间倒序。"""
    total = await session.scalar(select(func.count()).select_from(Dataset))
    offset = (current - 1) * page_size
    rows = (
        await session.scalars(
            select(Dataset)
            .order_by(Dataset.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )
    ).all()
    data = [DatasetRead.model_validate(r) for r in rows]
    return PageResponse[DatasetRead](data=data, total=total or 0)


@router.get("/datasets/{dataset_id}")
async def get_dataset(dataset_id: str, session: SessionDep) -> JSONResponse:
    """数据集详情:元信息 + 版本列表(按版本号升序)。"""
    dataset = await session.get(Dataset, dataset_id)
    if dataset is None:
        return JSONResponse(
            status_code=404,
            content={"success": False, "message": "数据集不存在"},
        )
    versions = (
        await session.scalars(
            select(DatasetVersion)
            .where(DatasetVersion.dataset_id == dataset_id)
            .order_by(DatasetVersion.version_no)
        )
    ).all()
    payload = DatasetResult(data=_to_detail(dataset, list(versions)))
    return JSONResponse(content=payload.model_dump(by_alias=True, mode="json"))
