---
description: 安装 data-juicer 运行环境并跑通最简 CLI 示例（dj-process 语言过滤 demo）
---

# /dj-demo — data-juicer 环境安装 + 最简示例验证

首次使用或验证环境时执行。在 `data-juicer/` 目录内操作（没有该目录先跑 `/adp-init`）。

## 执行步骤

### 第一步：安装环境（已有 .venv 则跳过安装）

```bash
cd data-juicer
[ -d .venv ] || uv sync --python 3.11
```

**必须指定 `--python 3.11`**（Docker 镜像同款版本；本机过新的 Python 如 3.14 会有依赖装不上）。依赖较多（约 380MB），用 Bash 工具的 run_in_background 跑。

### 第二步：跑最简示例

```bash
uv run dj-process --config demos/process_simple/process.yaml
```

也放后台跑。首次运行会额外下载 fasttext 语言模型并由 lazy loader 运行时安装 torch，约 1~2 分钟；之后再跑秒级完成。

### 第三步：验证结果

```bash
find outputs/demo-process -name "demo-processed.jsonl" -exec cat {} \;
```

**预期**：输入 6 条中英法混合样本，`language_id_score_filter(lang=zh, min_score=0.8)` 过滤后只剩 2 条中文（"你好，请问你是谁" / "欢迎来到阿里巴巴！"）。

## 注意

- `outputs/` 是运行产物，不要提交
- 跑其他配方：`uv run dj-process --config <你的配置.yaml>`，配方示例见 `demos/` 各子目录
