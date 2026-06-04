import type React from 'react';
import { PlaceholderPage } from '@/components';

const DatasetsPresets: React.FC = () => {
  return (
    <PlaceholderPage
      title="预置数据集"
      requirementIds={[20]}
      requirements={[
        '平台内置数据集：适配于银行业场景，每个数据集的数量应不低于 2000 条。',
      ]}
      docHint="规划与方案细节参见知识库文档 docs/data-engineering/06-数据标注与数据集管理.md。"
    />
  );
};

export default DatasetsPresets;
