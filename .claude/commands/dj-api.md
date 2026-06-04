---
description: 启动 data-juicer HTTP API 服务（FastAPI/uvicorn，端口 8000）——把全部公开方法暴露为 REST 接口
---

# /dj-api — 启动 data-juicer API 服务

`service.py` 会自动扫描 `data_juicer` 包，把公开方法（run / process / compute_stats…）注册成约 1000 个 HTTP 接口。文档：`data-juicer/docs/DJ_service.md`。

## 前置

`data-juicer/.venv` 必须存在，没有先跑 `/dj-demo` 的第一步（`uv sync --python 3.11`）。

## 执行步骤

```bash
cd data-juicer
uv run --with uvicorn --with fastapi python -m uvicorn service:app --port 8000
```

**坑**：不要直接 `uv run uvicorn service:app`——uvicorn/fastapi 是 lazy 依赖、不在项目 venv 里，`uv run` 会回退到系统的 uvicorn（另一个 Python 环境），报 `ModuleNotFoundError: No module named 'loguru'`。必须用 `--with uvicorn --with fastapi` 叠加到项目环境上。

用 Bash 工具的 run_in_background 启动，然后等端口就绪：

```bash
until curl -sf -o /dev/null http://127.0.0.1:8000/docs; do sleep 2; done; echo up
```

就绪后告知用户：

```
Swagger 文档: http://127.0.0.1:8000/docs
```

## 验证

```bash
curl -s http://127.0.0.1:8000/openapi.json | python3 -c "import json,sys; print('接口数:', len(json.load(sys.stdin)['paths']))"
```

预期接口数 900+。停止：kill 对应后台任务。
