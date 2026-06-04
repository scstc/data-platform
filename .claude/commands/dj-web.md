---
description: 启动 data-juicer Web UI（streamlit，端口 8501）——网页里配流水线、分析数据、看过滤效果
---

# /dj-web — 启动 data-juicer Web 界面

日常调配方的主要方式：网页上传/粘贴 YAML 配置 → Parse Cfg → 分析或处理 → 页面看结果图表。

## 前置

`data-juicer/.venv` 必须存在，没有先跑 `/dj-demo` 的第一步（`uv sync --python 3.11`）。

## 执行步骤

```bash
cd data-juicer
uv run streamlit run app.py --server.headless true --server.port 8501
```

用 Bash 工具的 run_in_background 启动，然后等端口就绪：

```bash
until curl -sf -o /dev/null http://127.0.0.1:8501/; do sleep 1; done; echo up
```

就绪后告知用户访问：

```
http://127.0.0.1:8501/
```

## 使用要点

- 界面流程：Configuration 区填配置（默认预填 `demos/process_simple/process.yaml`）→ **Parse Cfg** → **Start to analyze original data**（每个 filter 算子的统计分析）或 **Start to process data**（执行流水线）
- 结果在下方折叠面板：Data Analysis Results / Effect of Filter OPs / Diversity
- 适合小样本调配方；大批量生产用 CLI（`dj-process`）或 Ray 跑同一份 YAML
- 停止：kill 对应后台任务
