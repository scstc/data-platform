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

    # 允许的跨域来源（前端 dev server）
    cors_origins: list[str] = [
        "http://localhost:8001",
        "http://127.0.0.1:8001",
    ]


settings = Settings()
