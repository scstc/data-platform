import type React from 'react';
import { PlaceholderPage } from '@/components';

const Security: React.FC = () => {
  return (
    <PlaceholderPage
      title="数据安全"
      requirementIds={[4, 5]}
      requirements={[
        '数据内容安全：支持利用大模型等技术对数据内容进行审核（黄赌毒政恐），避免数据投毒，支持自定义规则和敏感数据，并可对有毒内容进行打标或直接删除（需要有记录）。',
        '数据访问安全：具有严格的数据权限管理，无越权访问风险。',
      ]}
      docHint="规划与方案细节参见知识库文档 docs/data-engineering/05-数据安全与合规.md。"
    />
  );
};

export default Security;
