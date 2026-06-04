import { PageContainer, ProCard } from '@ant-design/pro-components';
import { List, Result, Tag, Typography } from 'antd';
import type React from 'react';

const { Paragraph, Text } = Typography;

export interface PlaceholderPageProps {
  /** 页面标题（同时作为 PageContainer 标题） */
  title: string;
  /** 对应原始需求项编号，用于在列表前标注 */
  requirementIds: number[];
  /** 对应原始需求项中文原文摘要，逐条展示 */
  requirements: string[];
  /** 知识库文档提示文案（指向 docs/data-engineering/ 对应篇目，纯文案不跳转） */
  docHint?: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  requirementIds,
  requirements,
  docHint,
}) => {
  return (
    <PageContainer title={title}>
      <ProCard direction="column" gutter={[0, 16]}>
        <Result
          status="info"
          title="该功能模块规划中"
          subTitle="此页面为占位页，对应需求尚未实现。以下为该模块需要落地的原始需求项。"
        />
        <ProCard
          title="对应原始需求"
          type="inner"
          extra={
            requirementIds.length > 0 ? (
              <Text type="secondary">{`需求项 ${requirementIds.join('、')}`}</Text>
            ) : undefined
          }
        >
          <List
            dataSource={requirements}
            renderItem={(item, index) => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    <Tag color="blue">{requirementIds[index] ?? index + 1}</Tag>
                  }
                  description={item}
                />
              </List.Item>
            )}
          />
        </ProCard>
        {docHint ? (
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            {docHint}
          </Paragraph>
        ) : null}
      </ProCard>
    </PageContainer>
  );
};

export default PlaceholderPage;
