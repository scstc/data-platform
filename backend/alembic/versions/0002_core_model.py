"""core model: datasets / dataset_versions / jobs / job_inputs

Revision ID: 0002_core_model
Revises: 0001_initial
Create Date: 2026-06-08

M0 地基:Dataset / DatasetVersion / Job / JobInput 四张核心表
(领域模型见 docs/plan/03-架构设计.md §1)。
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0002_core_model"
down_revision: str | None = "0001_initial"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "datasets",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.String(), nullable=True),
        sa.Column("data_type", sa.String(), nullable=True),
        sa.Column("sensitivity_level", sa.String(), nullable=True),
        sa.Column("business_category", sa.String(), nullable=True),
        sa.Column("owner", sa.String(), nullable=False),
        sa.Column("creator", sa.String(), nullable=False),
        sa.Column("last_modifier", sa.String(), nullable=True),
        sa.Column("valid_until", sa.DateTime(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "dataset_versions",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("dataset_id", sa.String(), nullable=False),
        sa.Column("version_no", sa.Integer(), nullable=False),
        sa.Column("storage_uri", sa.String(), nullable=False),
        sa.Column("stats_uri", sa.String(), nullable=True),
        sa.Column("format", sa.String(), nullable=False),
        sa.Column("rows", sa.BigInteger(), nullable=True),
        sa.Column("size", sa.BigInteger(), nullable=True),
        sa.Column("origin", sa.String(), nullable=False),
        sa.Column("produced_by_job_id", sa.String(), nullable=True),
        sa.Column("note", sa.String(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("dataset_id", "version_no", name="uq_dataset_version_no"),
    )
    op.create_index(
        "ix_dataset_versions_dataset_id", "dataset_versions", ["dataset_id"]
    )
    op.create_index(
        "ix_dataset_versions_produced_by", "dataset_versions", ["produced_by_job_id"]
    )

    op.create_table(
        "jobs",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("state", sa.String(), nullable=False),
        sa.Column("config_yaml", sa.Text(), nullable=True),
        sa.Column("progress", sa.Integer(), nullable=False),
        sa.Column("logs_uri", sa.String(), nullable=True),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("created_by", sa.String(), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("started_at", sa.DateTime(), nullable=True),
        sa.Column("finished_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "job_inputs",
        sa.Column("job_id", sa.String(), nullable=False),
        sa.Column("dataset_version_id", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("job_id", "dataset_version_id"),
    )
    op.create_index(
        "ix_job_inputs_version", "job_inputs", ["dataset_version_id"]
    )


def downgrade() -> None:
    op.drop_index("ix_job_inputs_version", table_name="job_inputs")
    op.drop_table("job_inputs")
    op.drop_table("jobs")
    op.drop_index("ix_dataset_versions_produced_by", table_name="dataset_versions")
    op.drop_index("ix_dataset_versions_dataset_id", table_name="dataset_versions")
    op.drop_table("dataset_versions")
    op.drop_table("datasets")
