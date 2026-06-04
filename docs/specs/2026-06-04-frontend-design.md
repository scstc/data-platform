# 前端项目设计：ai-data-platform frontend

> 状态：已批准（2026-06-04）。决策记录：首期范围=平台壳+数据接入深做；AI=页面集成 LLM 智能接入（mock）；数据=Mock 为主；目录=`frontend/`；脚手架=官方 Pro v6 模板精简改造。

## 技术栈

Ant Design Pro V6 官方模板：React 19 + antd 6（cssVar）+ @umijs/max 4 + utoopack（Turbopack 系 Rust 构建引擎）+ Tailwind v4/antd-style + Biome + React Query + TypeScript 6。包管理 pnpm。

创建方式（官方无 create 命令）：`git clone --depth=1 ant-design/ant-design-pro frontend` → 删 `.git` 纳入父仓库 → `pnpm install` → `pnpm run simple` 精简模板。

来源：[Pro v6.0.0 Release](https://github.com/ant-design/ant-design-pro/issues/11734)

## 信息架构：20 项需求 → 路由

```
/ingest                数据接入 ★深做（需求1-3）
  /ingest/datasources    数据源管理（S3/HDFS/数据库/API 四类，分步新建向导+测试连接）
  /ingest/tasks          采集任务（列表/创建/详情，状态流转可重跑停止）
  /ingest/upload         本地上传（拖拽批量，11 种格式白名单）
  /ingest/assistant      LLM 智能接入助手（Ant Design X）
/security /quality /processing /tasks /lineage /annotation   —— 占位（需求4-12）
/datasets/list /datasets/presets                              —— 占位（需求13-20）
```

占位页 = 统一 `PlaceholderPage` 组件：需求项原文 + `docs/data-engineering/` 知识库链接，作为需求到实现的活地图。

## LLM 智能接入助手（mock 先行）

1. 粘贴样本识别：`POST /api/ai/infer-schema` → 格式/字段/类型表格 → 一键生成接入配置
2. 自然语言建任务：`POST /api/ai/generate-task` → 结构化任务配置预填表单
3. 接入答疑：知识库固定问答

UI：Ant Design X（Bubble/Sender/ThoughtChain），参考模板自带 AI Assistant 页。接口签名按真实后端设计，后续把 mock 换成真实 LLM 服务即可。

## Mock 与数据流

- `mock/` 按资源拆文件（datasource/task/upload/ai），REST 风格，带内存态（新建可见、任务状态随时间推进）
- `src/services/` 集中 TS 类型（DataSource/IngestTask/InferredSchema），页面与 mock 共用
- 错误统一 `requestErrorConfig`

## 验收标准

1. `pnpm build`（utoopack）零错误；Biome lint 通过
2. 冒烟：路由可达 + 四个深做页面核心交互走通
3. 人工验收：`/adp-web` 启动后浏览器实测截图确认

## 工程约定

- `frontend/` 是父仓库普通目录（非子仓库），自带 `.gitignore` 覆盖 node_modules/dist
- 新增 `/adp-web` slash command：装依赖 + 起 dev + 端口探测报 URL
