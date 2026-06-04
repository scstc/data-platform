import type React from 'react';
import { PlaceholderPage } from '@/components';

const Quality: React.FC = () => {
  return (
    <PlaceholderPage
      title="质量评估"
      requirementIds={[6]}
      requirements={[
        '支持利用大模型（自定义提示词等）、内置算子或自定义算子，对所有数据类型进行评估打分，可查看每条数据的得分详情。',
        '可生成质量分析报告，数据质量评估报告需支持可视化展示。',
        '支持一键删除低质数据（根据得分，用户可配置阈值），并存储为新数据集或新版本。',
      ]}
      docHint="规划与方案细节参见知识库文档 docs/data-engineering/03-数据质量评估.md。"
    />
  );
};

export default Quality;
