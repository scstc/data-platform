---
description: 启动 data-juicer 知识图谱 dashboard（静态版，python 即可服务，无需插件/node）
---

# /adp-dashboard — 启动 data-juicer 知识图谱 Dashboard

dashboard 是纯静态产物（demo 模式构建，无 token 门），已提交在仓库 `dashboard/` 目录。
查看者只需要 python，**不需要** understand-anything 插件、node 或构建步骤。

## 执行步骤

### 第一步：同步最新图谱数据（有就覆盖，保证看到的是最新分析）

```bash
for f in knowledge-graph.json domain-graph.json meta.json config.json; do
  [ -f "data-juicer/.understand-anything/$f" ] && cp "data-juicer/.understand-anything/$f" dashboard/
done
```

### 第二步：后台启动静态服务并告知 URL

```bash
cd dashboard && python3 -m http.server 8765
```

用 Bash 工具的 run_in_background 运行，然后告知用户访问：

```
http://127.0.0.1:8765/
```

无 token，打开即看。停止方式：kill 对应后台任务。

## 重建静态产物（仅维护者，插件升级后才需要）

`dashboard/` 缺失或想吃到插件新版 UI 时重建，需要插件缓存 + pnpm：

```bash
PLUGIN_ROOT=$(ls -d ~/.claude/plugins/cache/understand-anything/understand-anything/*/ | sort -V | tail -1)
DASH="$PLUGIN_ROOT/packages/dashboard"
[ -d "$DASH/node_modules" ] || (cd "$DASH" && pnpm install)
[ -d "$PLUGIN_ROOT/packages/core/dist" ] || (cd "$PLUGIN_ROOT" && pnpm --filter @understand-anything/core build)
(cd "$DASH" && VITE_DEMO_MODE=true npx vite build --outDir <父仓库绝对路径>/dashboard --emptyOutDir)
```

重建后重新执行第一步同步数据，并把 `dashboard/` 提交进仓库。

## 注意

- demo 模式**没有访问控制**，拿到 URL 即可查看——内网/本机使用没问题，别部署到公网敏感场景
- 图谱数据基于上次 `/understand` 分析时的 commit；代码更新后在 `data-juicer/` 重跑 `/understand` 再执行本命令即可
