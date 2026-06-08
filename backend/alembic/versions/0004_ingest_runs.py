"""ingest run history: ingest_tasks.run_count + ingest_runs table

Revision ID: 0004_ingest_runs
Revises: 0003_ingest_extract
Create Date: 2026-06-08

采集任务运行记录:任务加 run_count 计数;新增 ingest_runs 保存每次运行明细。
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0004_ingest_runs"
down_revision: str | None = "0003_ingest_extract"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "ingest_tasks",
        sa.Column(
            "run_count", sa.Integer(), nullable=False, server_default="0"
        ),
    )
    op.create_table(
        "ingest_runs",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("task_id", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("rows", sa.Integer(), nullable=False),
        sa.Column("dataset_count", sa.Integer(), nullable=False),
        sa.Column("outputs", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("started_at", sa.DateTime(), nullable=False),
        sa.Column("finished_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_ingest_runs_task_id", "ingest_runs", ["task_id"])


def downgrade() -> None:
    op.drop_index("ix_ingest_runs_task_id", table_name="ingest_runs")
    op.drop_table("ingest_runs")
    op.drop_column("ingest_tasks", "run_count")
