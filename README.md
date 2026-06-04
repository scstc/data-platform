# ai-data-platform

## 仓库关系

本项目涉及两个**相互独立的 Git 仓库**:

| 仓库 | 远端 | 说明 |
|------|------|------|
| `ai-data-platform` | `scstc/ai-data-platform` | 主项目仓库(本仓库) |
| `data-juicer` | `scstc/data-juicer` | 派生(fork)自阿里的 [`datajuicer/data-juicer`](https://github.com/datajuicer/data-juicer) |

`data-juicer` 被克隆在本仓库的 `data-juicer/` 目录下,但已通过 `.gitignore` 排除,**不纳入 `ai-data-platform` 的版本管理**——它是一个独立维护的 Git 仓库。

## 分支策略

两个仓库统一采用 `main` / `dev` / `prod` 三分支模型,但语义略有不同:

### ai-data-platform(自有项目)

| 分支 | 用途 |
|------|------|
| `main` | 稳定主干 |
| `dev` | 日常开发 |
| `prod` | 生产部署版 |

### data-juicer(阿里上游的 fork)

| 分支 | 用途 |
|------|------|
| `main` | **阿里上游(`datajuicer/data-juicer`)的镜像**,只做 fast-forward 同步,不直接提交 |
| `dev` | 在上游基础上的二次开发 / 定制 |
| `prod` | 经 `dev` 验证后合入的生产部署版 |

> ⚠️ 注意:data-juicer 的 `main` 代表**阿里上游镜像**而非「本地稳定版」,本地稳定版在 `prod`。保持 `main` 干净(无本地提交),上游同步才能始终是无冲突的快进合并。

## Data-Juicer 简介

Data-Juicer 是阿里巴巴开源的一个面向大模型(LLM)的数据处理系统,主要用于多模态数据的清洗、处理和分析。

### 定位

为大语言模型和多模态模型提供一站式数据处理,覆盖预训练、微调、RAG 等场景的数据准备需求。

### 算子(Operators)体系

内置 100+ 可组合的算子,分为几类:

- **Formatter**:格式转换
- **Mapper**:数据编辑/转换,如文本清洗、去除 HTML 标签
- **Filter**:按规则过滤样本,如长度、语言、困惑度
- **Deduplicator**:去重,支持 MinHash、SimHash 等
- **Selector**:数据选择

### 多模态支持

文本、图像、音频、视频等都能处理,适合训练多模态大模型。

### 配置驱动

通过 YAML 配置文件编排处理流水线,可视化工具(DJ-Cockpit / Insight)帮助分析数据质量。

### 扩展能力

支持分布式处理(Ray),能处理 TB 级数据;还提供数据沙盒(Sandbox)做数据配方实验。

### 生态

与 Megatron、DeepSpeed 等训练框架以及 HuggingFace 数据集兼容。

GitHub:`github.com/datajuicer/data-juicer`
