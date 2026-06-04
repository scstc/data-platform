---
description: 启动 ai-data-platform 前端（Ant Design Pro v6，端口 8001）——数据平台管理界面
---

# /adp-web — 启动数据平台前端

`frontend/` 是 Ant Design Pro v6 项目（React 19 + antd 6 + Umi Max 4 + utoopack），平台壳 + 数据接入模块（数据源管理/采集任务/本地上传/LLM 智能接入助手），数据走本地 mock。

## 执行步骤

### 第一步：装依赖（已有 node_modules 则跳过）

```bash
cd frontend
[ -d node_modules ] || npm ci --no-audit --no-fund
```

依赖较多，用 Bash 工具的 run_in_background 跑。

### 第二步：启动 dev server（端口 8001，避开 dj-api 的 8000）

```bash
PORT=8001 npm run start
```

**坑**：必须用 `start` 不能用 `dev`——模板的 `dev` 脚本带 `MOCK=none`（禁用 mock），所有 `/api/*` 会落到 SPA HTML 兜底，页面拿不到数据。

后台启动，然后等端口就绪：

```bash
until curl -sf -o /dev/null http://127.0.0.1:8001/; do sleep 2; done; echo up
```

### 第三步：告知用户

```
http://127.0.0.1:8001/
登录（mock）：admin / ant.design
```

## 注意

- mock 数据在 `frontend/mock/`，带内存态——新建数据源/任务在列表实时可见，重启后复位
- 生产构建：`npm run build`（utoopack）；类型检查 `npm run tsc`；lint `npm run biome:lint`
- 停止：kill 对应后台任务
