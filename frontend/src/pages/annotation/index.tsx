import type React from 'react';
import { PlaceholderPage } from '@/components';

const Annotation: React.FC = () => {
  return (
    <PlaceholderPage
      title="数据标注"
      requirementIds={[12]}
      requirements={[
        '支持单人标注。',
        '支持智能标注与智能审核、人工审核。',
        '支持多人标注与多人审核，支持自动分配任务与人工分配任务，支持配置交叉比例。',
        '支持查看标注进度、标注结果，标注结果自动生成可视化报告。',
      ]}
      docHint="规划与方案细节参见知识库文档 docs/data-engineering/06-数据标注与数据集管理.md。"
    />
  );
};

export default Annotation;
