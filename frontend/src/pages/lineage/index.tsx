import type React from 'react';
import { PlaceholderPage } from '@/components';

const Lineage: React.FC = () => {
  return (
    <PlaceholderPage
      title="数据血缘"
      requirementIds={[11]}
      requirements={[
        '可查看数据集的来源任务，以及任务所涉及的所有资产信息，保证数据集可溯源、可复现。',
      ]}
      docHint="规划与方案细节参见知识库文档 docs/data-engineering/01-生命周期总览.md。"
    />
  );
};

export default Lineage;
