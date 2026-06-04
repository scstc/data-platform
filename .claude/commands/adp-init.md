---
description: 初始化 ai-data-platform 工作区——clone data-juicer 子仓库到当前目录。仅首次或需要重建工作区时使用。
---

# /adp-init — ai-data-platform 工作区初始化

克隆父仓库后，在父仓库根目录下运行本命令，将 data-juicer 子仓库 clone 到工作区对应目录。

## 工作目录

必须在父仓库根目录（`ai-data-platform/`）下运行。

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
  # 无 SSH key 的环境改用 https:
  # git clone -b dev https://github.com/scstc/data-juicer.git
fi
```

## 约束

- **仅在父仓库根目录执行**，不代替子仓库内部的 git 日常操作。
- 已存在的 `data-juicer/` 目录会被跳过（不强制更新），如需重建先手动 `rm -rf data-juicer`。
- `data-juicer/` 是独立仓库（fork 自阿里上游），已被父仓库 `.gitignore` 排除；分支策略见 README.md——`main` 是上游镜像，开发走 `dev`。
- 依赖安装、上游同步等不在本命令范围，按需手动执行。
