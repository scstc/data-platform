---
description: 初始化 ai-data-platform 工作区——clone data-juicer 子仓库到当前目录并配置 upstream 远程。仅首次或需要重建工作区时使用。
---

# /adp-init — ai-data-platform 工作区初始化

克隆父仓库后，在父仓库根目录下运行本命令，将 data-juicer 子仓库 clone 到工作区对应目录，并配置好上游同步远程。

## 工作目录

必须在父仓库根目录（`ai-data-platform/`）下运行。

## 仓库关系（背景）

详见 README.md「仓库关系」「分支策略」两节：

- `data-juicer/` 是独立 Git 仓库（`scstc/data-juicer`），已被父仓库 `.gitignore` 排除
- 它 fork 自阿里上游 `datajuicer/data-juicer`；`main` 是上游镜像（只 fast-forward，不直接提交），日常开发在 `dev`，生产版在 `prod`

## 执行步骤

### 第一步：确认当前目录

```bash
pwd                                  # 应显示 .../ai-data-platform
git rev-parse --is-inside-work-tree  # 应为 true
```

### 第二步：clone data-juicer（dev 分支）

```bash
if [ -d data-juicer ]; then
  echo "[skip] data-juicer/ 已存在"
else
  git clone -b dev git@github.com:scstc/data-juicer.git
  # 无 SSH key 的环境(如 codespace)改用 https:
  # git clone -b dev https://github.com/scstc/data-juicer.git
fi
```

### 第三步：配置 upstream 远程（上游同步用）

```bash
cd data-juicer
git remote get-url upstream 2>/dev/null \
  || git remote add upstream https://github.com/datajuicer/data-juicer.git
git remote -v   # 应有 origin(scstc) + upstream(datajuicer) 两个远程
cd ..
```

### 第四步（可选）：安装 data-juicer 开发环境

仅在需要本地运行/调试时执行：

```bash
pip install -e ./data-juicer
command -v dj-process && echo OK
```

## 约束

- **仅在父仓库根目录执行**，不代替子仓库内部的 git 日常操作。
- 已存在的 `data-juicer/` 目录会被跳过（不强制更新），如需重建先手动 `rm -rf data-juicer`。
- 不要向 data-juicer 的 `main` 直接提交——它是上游镜像，开发走 `dev`（见 README 分支策略）。
- codespace 环境无需本命令——devcontainer 的 `postCreateCommand`（`.devcontainer/setup.sh`）已自动完成等价初始化。
