import type React from 'react';
import { PlaceholderPage } from '@/components';

const DataTasks: React.FC = () => {
  return (
    <PlaceholderPage
      title="数据任务"
      requirementIds={[10]}
      requirements={[
        '有任务广场，可查看数据处理、分析类的任务列表以及任务详情。',
        '任务支持重跑、停止、删除操作。',
        '支持通过 ID、任务名称等信息进行检索。',
        '支持拖拉拽方式编排算子流程，可一键执行完整的数据清洗、加工等工作。',
      ]}
      docHint="规划与方案细节参见知识库文档 docs/data-engineering/01-生命周期总览.md。"
    />
  );
};

export default DataTasks;
