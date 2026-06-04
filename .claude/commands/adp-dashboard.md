---
description: 启动 data-juicer 知识图谱 dashboard（直接启动 Vite 服务，输出带 token 的访问 URL）
---

# /adp-dashboard — 启动 data-juicer 知识图谱 Dashboard

直接启动 understand-anything 的 dashboard 服务，图谱数据固定指向本仓库的 `data-juicer/`。

## 前置条件

`data-juicer/.understand-anything/knowledge-graph.json` 存在；没有则先
`cd data-juicer` 运行 `/understand --language zh` 生成。

## 执行步骤

### 第一步：定位插件目录（取已安装的最新版本）

```bash
PLUGIN_ROOT=$(ls -d ~/.claude/plugins/cache/understand-anything/understand-anything/*/ | sort -V | tail -1)
DASH="$PLUGIN_ROOT/packages/dashboard"
```

### 第二步：首次（或插件升级后）构建

依赖和构建产物已存在时整步跳过：

```bash
if [ ! -d "$DASH/node_modules" ] || [ ! -d "$PLUGIN_ROOT/packages/core/dist" ]; then
  (cd "$DASH" && pnpm install)
  (cd "$PLUGIN_ROOT" && pnpm --filter @understand-anything/core build)
fi
```

### 第三步：后台启动 Vite

```bash
cd "$DASH" && GRAPH_DIR=<父仓库根目录绝对路径>/data-juicer npx vite --host 127.0.0.1
```

用 Bash 工具的 run_in_background 运行，然后从输出里抓取这一行：

```
🔑  Dashboard URL: http://127.0.0.1:<PORT>?token=<TOKEN>
```

## 汇报要求

- 把**完整 URL（含 `?token=`）**给用户——没有 token 会被访问门拦住
- 说明服务在后台运行；停止方式：kill 对应后台任务

## 注意

- 端口默认 5173，被占用时 Vite 自动递增，以实际输出为准
- 图谱数据基于上次 `/understand` 分析时的 commit，代码更新后需增量重跑再看
