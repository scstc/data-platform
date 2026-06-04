"""AI 双模式服务层。

对外暴露 AIProvider 抽象与 get_ai_provider 工厂：
- 同时配置了 openai_base_url 与 openai_api_key → OpenAICompatProvider（内置启发式兜底）
- 否则 → HeuristicProvider（纯本地，零外部依赖）

工厂从传入的 settings 对象读取以下属性（鸭子类型，不直接 import app.core.config，
以免与并行开发的配置模块耦合）：openai_base_url / openai_api_key / openai_model。
"""

from __future__ import annotations

from typing import Any

from app.services.ai.base import AIProvider
from app.services.ai.heuristic import HeuristicProvider
from app.services.ai.llm import OpenAICompatProvider

__all__ = [
    "AIProvider",
    "HeuristicProvider",
    "OpenAICompatProvider",
    "get_ai_provider",
]


def get_ai_provider(settings: Any) -> AIProvider:
    """根据配置选择 AI 提供者。

    openai_base_url 与 openai_api_key 都已配置时启用 LLM（失败自动回退启发式），
    否则使用启发式提供者。
    """
    base_url = getattr(settings, "openai_base_url", None)
    api_key = getattr(settings, "openai_api_key", None)
    model = getattr(settings, "openai_model", None) or "gpt-4o-mini"

    if base_url and api_key:
        return OpenAICompatProvider(
            base_url=base_url,
            api_key=api_key,
            model=model,
            heuristic=HeuristicProvider(),
        )
    return HeuristicProvider()
