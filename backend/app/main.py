"""FastAPI 应用入口：CORS、路由装配与健康检查。"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import compat
from app.api.v1 import ai, datasets, datasources, ingest_tasks, uploads
from app.core.config import settings


def create_app() -> FastAPI:
    """构建并返回 FastAPI 应用实例。"""
    app = FastAPI(title="AI 数据平台 API")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(datasources.router, prefix="/api/v1")
    app.include_router(datasets.router, prefix="/api/v1")
    app.include_router(ingest_tasks.router, prefix="/api/v1")
    app.include_router(uploads.router, prefix="/api/v1")
    app.include_router(ai.router, prefix="/api/v1")
    app.include_router(compat.router, prefix="/api")

    @app.get("/healthz")
    async def healthz() -> dict[str, str]:
        """健康检查。"""
        return {"status": "ok"}

    return app


app = create_app()
