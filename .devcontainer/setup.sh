#!/usr/bin/env bash
# Codespace 初始化:复刻本地布局(data-juicer 嵌套克隆)+ 安装 Claude Code
set -euo pipefail

# 1. 克隆 data-juicer 到主仓库内(已被 .gitignore 排除,与本地布局一致)
if [ ! -d data-juicer ]; then
  git clone --branch dev https://github.com/scstc/data-juicer.git
fi

# 2. 安装 uv(data-juicer 依赖管理用,项目依赖按需手动 uv sync)
pip install uv

# 3. 安装 Claude Code CLI
npm install -g @anthropic-ai/claude-code

echo "=== setup done ==="
