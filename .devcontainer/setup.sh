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

# 4. 跳过 Claude Code 首跑 onboarding(否则交互式启动会无视
#    CLAUDE_CODE_OAUTH_TOKEN 强制走登录流程)
[ -f ~/.claude.json ] || echo '{"hasCompletedOnboarding": true}' > ~/.claude.json

# 5. zsh 设为默认 shell(镜像自带 zsh + oh-my-zsh),启用命令自动建议
sudo chsh -s /usr/bin/zsh "$(whoami)"
ZSH_CUSTOM=~/.oh-my-zsh/custom
[ -d "$ZSH_CUSTOM/plugins/zsh-autosuggestions" ] \
  || git clone --depth 1 https://github.com/zsh-users/zsh-autosuggestions "$ZSH_CUSTOM/plugins/zsh-autosuggestions"
sed -i 's/^plugins=(git)$/plugins=(git zsh-autosuggestions)/' ~/.zshrc

echo "=== setup done ==="
