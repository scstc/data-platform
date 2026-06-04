"""上传记录 ORM 模型。"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import BigInteger, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class UploadRecord(Base):
    """上传文件的元数据记录。"""

    __tablename__ = "upload_records"

    # 主键形如 "up-" + 6 位 hex
    id: Mapped[str] = mapped_column(String, primary_key=True)
    filename: Mapped[str] = mapped_column(String, nullable=False)
    # 文件字节大小
    size: Mapped[int] = mapped_column(BigInteger, nullable=False)
    format: Mapped[str] = mapped_column(String, nullable=False)
    # 状态：done | error
    status: Mapped[str] = mapped_column(String, nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), nullable=False
    )
