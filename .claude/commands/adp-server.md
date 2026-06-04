---
description: 启动 ai-data-platform 后端（FastAPI + PostgreSQL，端口 18003）——前端契约的真实实现
---

# /adp-server — 启动数据平台后端

`backend/` 是 FastAPI + SQLAlchemy async + PostgreSQL 项目，实现前端 `data-platform` 服务层的全部契约（数据源/采集任务/上传 + AI 三接口）。设计文档：`docs/specs/2026-06-04-backend-design.md`。

## 执行步骤

### 第一步：起 PostgreSQL（容器已在则跳过）

```bash
cd backend
docker compose up -d && docker compose ps --format "{{.Name}} {{.Status}}"
```

PG 16 跑在 **55433** 端口（容器 `adp-postgres`，库/用户/密码 = adp/adp/adp_dev_pw）。

### 第二步：装依赖 + 迁移

```bash
[ -d .venv ] || uv sync
uv run alembic upgrade head
```

### 第三步：启动服务（端口 18003）

```bash
uv run uvicorn app.main:app --port 18003
```

用 run_in_background 启动，然后探测：

```bash
until curl -sf http://127.0.0.1:18003/healthz; do sleep 1; done; echo up
```

### 第四步：告知用户

```
API:     http://127.0.0.1:18003/api/v1/
Swagger: http://127.0.0.1:18003/docs
```

## AI 双模式

默认启发式实现（零外部依赖）。要切真实 LLM，在 `backend/.env` 配：

```
OPENAI_BASE_URL=...
OPENAI_API_KEY=...
OPENAI_MODEL=...
```

配置存在即自动启用，LLM 失败自动回退启发式。

## 前端切换真实后端

```bash
cd frontend && PORT=8001 MOCK=none npm run dev
```

`MOCK=none` 时全部 `/api` 经 proxy 转发到 18003（见 `frontend/config/proxy.ts`）；日常 `npm run start` 仍走 mock，互不影响。

## 注意

- **坑：docker context**。`docker context show` 如果不是本地（如 `remote-119`），compose 起的 PG 在**远端主机**上，`127.0.0.1:55433` 不通——在 `backend/.env` 里把 `DATABASE_URL` 的 host 改成远端 IP（如 `10.60.1.119`），跑测试同理设 `TEST_DATABASE_URL`。提交的默认值保持 127.0.0.1 不要改
- 测试：`uv run pytest`（用同一 PG 实例的 `adp_test` 库）；lint：`uv run ruff check .`
- 停止：kill uvicorn 后台任务；`docker compose down`（数据在 volume 里不丢）
