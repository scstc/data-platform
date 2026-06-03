# data-platform

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

GitHub:`github.com/modelscope/data-juicer`
