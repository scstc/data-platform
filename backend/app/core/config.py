"""应用配置：基于 pydantic-settings，从环境变量 / .env 读取。"""

from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """全局配置项。"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # 数据库连接串（async 驱动）
    database_url: str = "postgresql+asyncpg://adp:adp_dev_pw@127.0.0.1:55433/adp"

    # OpenAI 兼容 LLM 配置（均可空；配置齐全时上层可启用 LLM 模式）
    openai_base_url: str | None = None
    openai_api_key: str | None = None
    openai_model: str = "gpt-4o-mini"

    # 上传文件落盘目录
    upload_dir: str = (
        "/Users/enjoy/ai-project/ai-data-platform/backend/var/uploads"
    )

    # 数据集受管存储目录(落地产物 jsonl,按 <dataset_id>/v<n>/data.jsonl 组织)
    datasets_dir: str = (
        "/Users/enjoy/ai-project/ai-data-platform/backend/var/datasets"
    )

    # data-juicer 加工引擎:dj-process 可执行文件(子进程调用)
    dj_process_bin: str = (
        "/Users/enjoy/ai-project/ai-data-platform/data-juicer/.venv/bin/dj-process"
    )
    # 单 job 内并行度(传给 dj-process 的 np)
    engine_np: int = 2
    # 多 job 并发上限(信号量,避免单机被打爆)
    engine_concurrency: int = 3

    # 允许的跨域来源（前端 dev server）
    cors_origins: list[str] = [
        "http://localhost:8001",
        "http://127.0.0.1:8001",
    ]


settings = Settings()
