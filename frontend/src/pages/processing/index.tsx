import type React from 'react';
import { PlaceholderPage } from '@/components';

const Processing: React.FC = () => {
  return (
    <PlaceholderPage
      title="数据加工"
      requirementIds={[7, 8, 9]}
      requirements={[
        '数据清洗：支持通过大模型、内置算子或自定义算子对数据进行过滤清洗；内置算子应包含移除不可见字符、规范化空格、去除乱码、繁体转简体、去除网页标识符、去除表情、数据去重等；支持对清洗结果进行预览，根据预览确定是否采纳并持久化存储。',
        '数据合成与增强：支持利用大模型等技术、内置算子或自定义算子自动生成数据、对已有数据进行增强、进行数据蒸馏；支持对合成、增强、蒸馏结果进行预览与持久化存储，可区分原始数据与合成数据。',
        '数据处理：支持利用大模型、内置算子、自定义算子对原始数据加工生成新数据集，新数据集支持预览与持久化存储；内置算子应包含 COT 数据生成、QA 对抽取等。',
      ]}
      docHint="规划与方案细节参见知识库文档 docs/data-engineering/02-数据清洗与去重.md 与 docs/data-engineering/04-数据合成与增强.md。"
    />
  );
};

export default Processing;
