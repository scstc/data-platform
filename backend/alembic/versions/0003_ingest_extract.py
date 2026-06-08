"""ingest task extract spec: add ingest_tasks.extract

Revision ID: 0003_ingest_extract
Revises: 0002_core_model
Create Date: 2026-06-08

采集任务补"采集对象"(extract spec):{mode:'table',table} 或 {mode:'sql',sql}。
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0003_ingest_extract"
down_revision: str | None = "0002_core_model"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "ingest_tasks",
        sa.Column("extract", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("ingest_tasks", "extract")
