#!/usr/bin/env bash
# Codespace 初始化:复刻本地布局(data-juicer 嵌套克隆)+ 安装 Claude Code
set -euo pipefail

# 1. 克隆 data-juicer 到主仓库内(已被 .gitignore 排除,与本地布局一致)
if [ ! -d data-juicer ]; then
  git clone --branch dev https://github.com/scstc/data-juicer.git
fi

# 2. 配置上游远程(main 分支 fast-forward 同步阿里上游用)
git -C data-juicer remote get-url upstream >/dev/null 2>&1 \
  || git -C data-juicer remote add upstream https://github.com/datajuicer/data-juicer.git

# 3. 安装 data-juicer
pip install -e ./data-juicer

# 4. 安装 Claude Code CLI
npm install -g @anthropic-ai/claude-code

echo "=== setup done ==="
