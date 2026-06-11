"""ingest folded into jobs: jobs.ingest_task_id + migrate ingest_runs

Revision ID: 0005_ingest_jobs
Revises: 0004_ingest_runs
Create Date: 2026-06-11

ingest_task 收编进通用 job(03 §6 决策落地):
- jobs 加 ingest_task_id 列(type=ingest 时回指采集任务配置);
- 历史 ingest_runs 平移为 jobs(type=ingest),id 原样保留;
- 采集产物版本的 produced_by_job_id 原指 task.id,按运行记录的 outputs
  重指到对应 run(无法归属的保持原值,仍可经 task 反查);
- ingest_runs 表退役。
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0005_ingest_jobs"
down_revision: str | None = "0004_ingest_runs"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "jobs", sa.Column("ingest_task_id", sa.String(), nullable=True)
    )
    op.create_index("ix_jobs_ingest_task_id", "jobs", ["ingest_task_id"])

    # 历史运行记录 → jobs(type=ingest);任务名冗余进 job.name,失败原因进 error
    op.execute(
        """
        INSERT INTO jobs (id, name, type, ingest_task_id, state, progress,
                          error, created_by, created_at, started_at, finished_at)
        SELECT r.id,
               COALESCE(t.name, r.task_id),
               'ingest',
               r.task_id,
               r.status,
               CASE WHEN r.status = 'success' THEN 100 ELSE 0 END,
               r.error,
               'admin',
               r.started_at,
               r.started_at,
               r.finished_at
        FROM ingest_runs r
        LEFT JOIN ingest_tasks t ON t.id = r.task_id
        """
    )
    # 产物血缘:produced_by_job_id 从 task.id 重指到具体 run
    # (run.outputs 形如 [{"versionId": ...}, ...])
    op.execute(
        """
        UPDATE dataset_versions v
        SET produced_by_job_id = r.id
        FROM ingest_runs r, jsonb_array_elements(r.outputs) AS o
        WHERE r.outputs IS NOT NULL
          AND o->>'versionId' = v.id
        """
    )

    # 兜底:更早期(0004 之前)无运行记录可归属的版本仍指向 task.id——
    # 每个涉及的 task 造一条确定性 id 的"历史采集"job 收拢,避免血缘悬空
    op.execute(
        """
        INSERT INTO jobs (id, name, type, ingest_task_id, state, progress,
                          created_by, created_at, started_at, finished_at)
        SELECT 'job-hist-' || substr(md5(v.produced_by_job_id), 1, 6),
               COALESCE(t.name, v.produced_by_job_id) || ' - 历史采集',
               'ingest',
               v.produced_by_job_id,
               'success',
               100,
               'admin',
               min(v.created_at),
               min(v.created_at),
               max(v.created_at)
        FROM dataset_versions v
        LEFT JOIN ingest_tasks t ON t.id = v.produced_by_job_id
        WHERE v.produced_by_job_id LIKE 'task-%'
        GROUP BY v.produced_by_job_id, t.name
        """
    )
    op.execute(
        """
        UPDATE dataset_versions
        SET produced_by_job_id =
            'job-hist-' || substr(md5(produced_by_job_id), 1, 6)
        WHERE produced_by_job_id LIKE 'task-%'
        """
    )

    op.drop_index("ix_ingest_runs_task_id", table_name="ingest_runs")
    op.drop_table("ingest_runs")


def downgrade() -> None:
    raise NotImplementedError(
        "0005 为单向迁移:ingest_runs 已并入 jobs,血缘已重指,不支持回退"
    )
