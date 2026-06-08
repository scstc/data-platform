"""加工引擎:把算子编排生成 data-juicer YAML → 子进程跑 dj-process → 产出新版本。

设计见 docs/plan/02(集成)与 03(模型)。后端(py3.12)通过子进程调用
data-juicer venv(py3.11)的 dj-process,进程隔离、规避版本冲突。
多 job 并发由信号量限流;单 job 内并行由 np 控制。
"""

from __future__ import annotations

import asyncio
import secrets
from pathlib import Path
from typing import Any

import yaml
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.dataset_version import DatasetVersion
from app.models.job_input import JobInput

# 多 job 并发上限
_semaphore = asyncio.Semaphore(settings.engine_concurrency)


class EngineError(RuntimeError):
    """加工执行失败(dj-process 非零退出 / 无产物)。"""


def _new_version_id() -> str:
    return f"dsv-{secrets.token_hex(3)}"


def build_config(
    *,
    project_name: str,
    input_path: str,
    output_path: str,
    operators: list[dict[str, Any]],
) -> dict[str, Any]:
    """把算子编排序列化为 data-juicer 合法配置(dict)。

    operators: [{name, params}]; 无参算子 process 项值为 None(DJ 接受)。
    """
    process: list[dict[str, Any]] = []
    for op in operators:
        params = op.get("params") or {}
        process.append({op["name"]: (params or None)})
    return {
        "project_name": project_name,
        "dataset_path": input_path,
        "np": settings.engine_np,
        "export_path": output_path,
        "process": process,
    }


async def _run_dj(yaml_path: Path) -> tuple[int, str]:
    """异步起 dj-process 子进程,返回 (退出码, 合并日志)。"""
    proc = await asyncio.create_subprocess_exec(
        settings.dj_process_bin,
        "--config",
        str(yaml_path),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.STDOUT,
    )
    out, _ = await proc.communicate()
    return proc.returncode or 0, out.decode("utf-8", "replace")


async def run_process_job(
    session: AsyncSession,
    *,
    job_id: str,
    input_version: DatasetVersion,
    operators: list[dict[str, Any]],
) -> tuple[DatasetVersion, str, str]:
    """对一个输入版本跑算子流水线 → 在同一数据集下产出新版本。

    返回 (新版本, 生成的 yaml 文本, 运行日志路径)。失败抛 EngineError。
    """
    dataset_id = input_version.dataset_id
    max_vno = await session.scalar(
        select(func.max(DatasetVersion.version_no)).where(
            DatasetVersion.dataset_id == dataset_id
        )
    )
    new_vno = (max_vno or 0) + 1
    out_dir = Path(settings.datasets_dir) / dataset_id / f"v{new_vno}"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "data.jsonl"
    yaml_path = out_dir / "job.yaml"
    log_path = out_dir / "run.log"

    cfg = build_config(
        project_name=job_id,
        input_path=input_version.storage_uri,
        output_path=str(out_path),
        operators=operators,
    )
    yaml_text = yaml.safe_dump(cfg, allow_unicode=True, sort_keys=False)
    yaml_path.write_text(yaml_text, encoding="utf-8")

    async with _semaphore:
        code, log = await _run_dj(yaml_path)
    log_path.write_text(log, encoding="utf-8")

    if code != 0 or not out_path.exists():
        tail = "\n".join(log.strip().splitlines()[-8:])
        raise EngineError(f"dj-process 退出码 {code}\n{tail}")

    rows = sum(1 for line in out_path.open(encoding="utf-8") if line.strip())
    stats_path = out_dir / "data_stats.jsonl"
    version = DatasetVersion(
        id=_new_version_id(),
        dataset_id=dataset_id,
        version_no=new_vno,
        storage_uri=str(out_path),
        stats_uri=str(stats_path) if stats_path.exists() else None,
        format="jsonl",
        rows=rows,
        size=out_path.stat().st_size,
        origin="managed",
        produced_by_job_id=job_id,
        note=f"加工产出(来自 v{input_version.version_no})",
    )
    session.add(version)
    session.add(JobInput(job_id=job_id, dataset_version_id=input_version.id))
    await session.commit()
    await session.refresh(version)
    return version, yaml_text, str(log_path)
