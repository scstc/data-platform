---
description: 启动 data-juicer 知识图谱 dashboard（understand-anything 插件的薄包装，自动指向 data-juicer/ 目录）
---

# /adp-dashboard — 启动 data-juicer 知识图谱 Dashboard

本命令是 understand-anything 插件 `/understand-dashboard` 的项目级包装：图谱数据在
`data-juicer/.understand-anything/`（子仓库目录），而会话通常在父仓库根目录打开，
直接跑插件命令会找错路径——本命令固定指向正确目录。

## 前置条件

- understand-anything 插件已启用（本仓库 `.claude/settings.json` 已声明，首次会提示信任）
- `data-juicer/.understand-anything/knowledge-graph.json` 存在；没有则先：
  `cd data-juicer` 后运行 `/understand --language zh`

## 执行

调用 Skill `understand-anything:understand-dashboard`，参数传 data-juicer 的**绝对路径**：

```
<父仓库根目录>/data-juicer
```

插件会自行完成：定位插件 root → pnpm install/构建（首次）→ 后台启动 Vite →
输出带 token 的访问 URL。

## 汇报要求

- 必须把**完整 URL（含 `?token=` 参数）**给用户——没有 token 会被访问门拦住
- 说明服务在后台运行，以及如何停止（kill 对应后台任务）

## 注意

- 端口默认 5173，被占用时 Vite 自动递增，以实际输出为准
- 图谱数据基于上次 `/understand` 分析时的 commit，代码更新后需增量重跑再看
