# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 仓库关系（最重要）

本工作区包含两个**相互独立的 Git 仓库**，git 操作必须分别在各自目录执行：

| 仓库 | 路径 | 远端 | 说明 |
|------|------|------|------|
| ai-data-platform | `.`（本仓库） | `scstc/ai-data-platform` | 主项目：文档、dashboard 静态产物、工作区脚手架 |
| data-juicer | `data-juicer/` | `scstc/data-juicer` | fork 自阿里 `datajuicer/data-juicer`，已被本仓库 `.gitignore` 排除 |

两仓库均为 `main` / `dev` / `prod` 三分支模型，日常开发都在 `dev`。

> ⚠️ data-juicer 的 `main` 是**阿里上游镜像**（只做 fast-forward 同步，绝不直接提交），本地稳定版在 `prod`。开发提交一律走 `dev`。

## 优先用知识图谱了解代码

了解 data-juicer 代码结构时，**优先查阅已生成的知识图谱**，而不是直接大范围读源码：

- 数据位置：`data-juicer/.understand-anything/knowledge-graph.json`（2,749 节点 / 6,551 边，覆盖 1,204 个文件，含 layers 分层与 tour 导览）
- 节点类型：file / class / function / service / pipeline / config / document，每个节点带 `summary` 摘要
- 交互问答：用 `understand-anything:understand-chat` skill 基于图谱提问
- 可视化：运行 `/adp-dashboard` 启动本地静态 dashboard（`http://127.0.0.1:8765/`）
- 图谱对应 `meta.json` 里记录的 commit；代码大幅更新后需在 `data-juicer/` 内重跑 `/understand` 刷新

具体某个文件/函数的精确实现仍以源码为准，图谱用于快速定位和把握架构。

## 常用命令（项目 slash commands）

| 命令 | 用途 |
|------|------|
| `/adp-init` | 首次初始化工作区：clone data-juicer（dev 分支）到 `data-juicer/` |
| `/adp-dashboard` | 同步最新图谱数据到 `dashboard/` 并后台启动 `python3 -m http.server 8765` |

dashboard 是纯静态产物（demo 模式，无访问控制），随仓库提交。重建产物的流程见 `.claude/commands/adp-dashboard.md`。

## GitHub Pages 发布

`dashboard/`（understand-anything 知识图谱 dashboard）通过 `.github/workflows/understand-anything-pages.yml` 自动发布到 GitHub Pages（`https://scstc.github.io/ai-data-platform/`）：

- 触发条件：push 到 `dev` 且改动涉及 `dashboard/**`（也支持手动 workflow_dispatch）
- CI **不做构建**，直接把 `dashboard/` 目录作为 artifact 部署——构建在本地完成后提交
- Pages 部署在 `/ai-data-platform/` 子路径下，因此静态产物有两个硬性要求（改 dashboard 构建时勿破坏）：
  1. Vite 构建必须用**相对路径** base（否则资源 404）
  2. demo 模式加载图谱数据（knowledge-graph.json 等）必须用**相对 URL**
- workflow 用的 actions 版本（checkout@v6 / configure-pages@v6 / upload-pages-artifact@v5 / deploy-pages@v5）均原生 node24，升级时别降回 node20 的旧版

## data-juicer 架构速览

面向 LLM 的多模态数据处理系统，核心是**算子（Operator）体系**——100+ 可组合算子，按 YAML 配置编排成流水线：

- **Formatter** 格式转换 / **Mapper** 数据编辑 / **Filter** 规则过滤 / **Deduplicator** 去重（MinHash、SimHash）/ **Selector** 数据选择
- 算子代码在 `data-juicer/data_juicer/ops/` 下按类型分目录
- 支持 Ray 分布式、数据沙盒（Sandbox）、HuggingFace 数据集
- 详细介绍见本仓库 `README.md` 与 `data-juicer/README_ZH.md`

data-juicer 内部的构建/测试遵循其自身仓库的约定（pyproject.toml + tests/），在 `data-juicer/` 目录内操作。

## 文档约定

新增文档放 `docs/` 并在 `docs/README.md` 的索引表中登记。
