"""上传记录相关 schema，对照 frontend typings.d.ts 的 UploadRecord。"""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from app.schemas.common import CamelModel


class UploadRecordRead(CamelModel):
    """上传记录读模型（响应）。"""

    id: str
    filename: str
    size: int
    format: str
    status: Literal["done", "error"]
    uploaded_at: datetime
