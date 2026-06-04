# 后端项目设计：ai-data-platform backend

> 状态：已批准（2026-06-04）。决策记录：目录=`backend/`；DB=仓库内 docker compose 专属 PostgreSQL 16（端口 55433）；AI=双模式（启发式兜底 + OpenAI 兼容 LLM 可插拔）；方案=分层单体 FastAPI。

## 技术栈

Python 3.12 + uv · FastAPI + Pydantic v2 · SQLAlchemy 2.0 async + asyncpg · Alembic · pytest + httpx · ruff。服务端口 **8002**（8000=dj-api，8001=前端，8501=dj-web，8765=dashboard）。

## 数据库

`backend/compose.yml`：`postgres:16-alpine`，容器名 `adp-postgres`，端口 **55433**（避开本机已有 55432），volume 持久化 + healthcheck。配置走 `.env`（pydantic-settings，提供 `.env.example`：`DATABASE_URL=postgresql+asyncpg://adp:adp_dev_pw@127.0.0.1:55433/adp`）。

## 目录结构

```
backend/
├── compose.yml / pyproject.toml / .env.example / README.md
├── alembic/                       # 迁移（初始迁移含三张表）
├── app/
│   ├── main.py                    # FastAPI 入口 + CORS(8001) + 路由装配
│   ├── core/{config,db}.py        # 配置 / async session
│   ├── models/                    # DataSource / IngestTask / UploadRecord
│   ├── schemas/                   # Pydantic，与 frontend/src/services/data-platform/typings.d.ts 一一对应
│   ├── api/v1/{datasources,ingest_tasks,uploads,ai}.py
│   └── services/ai/{base,heuristic,llm}.py
├── var/uploads/                   # 上传文件落盘（gitignore）
└── tests/
```

## API 契约（= 前端已定契约，前端零改动可切换）

- `GET/POST /api/v1/datasources`、`PUT/DELETE /api/v1/datasources/{id}`、`POST /api/v1/datasources/test`
- `GET/POST /api/v1/ingest-tasks`、`GET/DELETE /api/v1/ingest-tasks/{id}`、`POST .../{id}/rerun`、`POST .../{id}/stop`
- `GET /api/v1/uploads`、`POST /api/v1/upload`（multipart；文件存 `var/uploads/`，元数据进 PG）
- `POST /api/v1/ai/{infer-schema,generate-task,qa}`
- 分页响应 `{data,total,success}`；单对象 `{data,success}`。字段名/枚举值与前端 TS 类型完全一致（camelCase，经 Pydantic alias 输出）
- 任务进度首期沿用 mock 语义：查询时按时间推进模拟（running 每次查询 +20 至 success），真实采集执行留待对接 data-juicer

## AI 双模式

`AIProvider` 抽象（infer_schema / generate_task / qa）：

- `HeuristicProvider`（默认）：JSON/JSONL/CSV/TSV 启发式解析、中文关键词→cron/数据源类型、固定问答——前端 mock 逻辑后端化，零外部依赖
- `OpenAICompatProvider`：读 `OPENAI_BASE_URL/OPENAI_API_KEY/OPENAI_MODEL`，配置存在即自动启用；LLM 失败时回退启发式

## 前端对接

`frontend/config/proxy.ts` 增加 dev 代理项指向 8002；前端 `MOCK=none` 启动即切真实后端，页面代码零改动。

## 测试与验收

- pytest：三资源 CRUD 流程、分页筛选、任务状态机、启发式 AI 单测；集成测试连 compose PG（`adp_test` 库，conftest 建表）
- 验收：`docker compose up` + `alembic upgrade head` + uvicorn 起 8002 → `/docs` 可见 → curl 冒烟 → 前端切真实后端完成数据源新建闭环
- 配套 `/adp-server` slash command（compose up + 装依赖 + 起服务 + 端口探测）
