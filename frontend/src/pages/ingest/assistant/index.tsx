import {
  BulbOutlined,
  DatabaseOutlined,
  RobotOutlined,
  ScheduleOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { PageContainer, ProDescriptions } from '@ant-design/pro-components';
import { Bubble, Sender } from '@ant-design/x';
import {
  Alert,
  Avatar,
  Button,
  Empty,
  Modal,
  message,
  Segmented,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import React, { useMemo, useRef, useState } from 'react';
import { aiQa, generateTask, inferSchema } from '@/services/data-platform';
import { useStyles } from './style';

type Mode = 'schema' | 'task' | 'qa';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  loading?: boolean;
};

const MODE_META: Record<
  Mode,
  { label: string; icon: React.ReactNode; placeholder: string; intro: string }
> = {
  schema: {
    label: '样本识别',
    icon: <DatabaseOutlined />,
    placeholder:
      '粘贴一段样本数据（JSON / JSONL / CSV / TSV / 文本），回车识别…',
    intro: '粘贴样本数据，AI 自动识别格式、字段结构并给出接入建议。',
  },
  task: {
    label: '生成任务',
    icon: <ScheduleOutlined />,
    placeholder:
      '用自然语言描述采集需求，例如「每天凌晨从对象存储增量同步语料」…',
    intro: '用自然语言描述采集需求，AI 自动生成采集任务配置。',
  },
  qa: {
    label: '接入答疑',
    icon: <BulbOutlined />,
    placeholder: '输入你的问题，例如「支持哪些数据源」「cron 怎么配」…',
    intro: '关于数据接入的任何问题，都可以在这里提问。',
  },
};

const USER_AVATAR = <Avatar icon={<UserOutlined />} />;
const AI_AVATAR = (
  <Avatar style={{ background: '#1677ff' }} icon={<RobotOutlined />} />
);

const schemaFieldColumns = [
  { title: '字段', dataIndex: 'name', key: 'name' },
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
    render: (t: string) => <Tag color="blue">{t}</Tag>,
  },
  {
    title: '示例',
    dataIndex: 'example',
    key: 'example',
    ellipsis: true,
    render: (e: string) => (
      <Typography.Text code copyable={!!e}>
        {e || '—'}
      </Typography.Text>
    ),
  },
  {
    title: '可空',
    dataIndex: 'nullable',
    key: 'nullable',
    width: 72,
    render: (n: boolean) =>
      n ? <Tag>可空</Tag> : <Tag color="green">非空</Tag>,
  },
];

const AssistantPage: React.FC = () => {
  const { styles } = useStyles();
  const [messageApi, contextHolder] = message.useMessage();

  const [mode, setMode] = useState<Mode>('schema');
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  // 每个模式各自维护一份对话历史
  const [history, setHistory] = useState<Record<Mode, ChatMessage[]>>({
    schema: [],
    task: [],
    qa: [],
  });

  // 右侧结果面板：样本识别 / 生成任务的结构化结果
  const [schemaResult, setSchemaResult] =
    useState<DataPlatform.InferredSchema | null>(null);
  const [taskResult, setTaskResult] =
    useState<DataPlatform.GeneratedTaskConfig | null>(null);
  const [configModalOpen, setConfigModalOpen] = useState(false);

  const idCounter = useRef(0);
  const nextId = () => `msg-${++idCounter.current}`;

  const messages = history[mode];

  const appendMessage = (m: Mode, msg: ChatMessage) => {
    setHistory((prev) => ({ ...prev, [m]: [...prev[m], msg] }));
  };

  const updateMessage = (m: Mode, id: string, patch: Partial<ChatMessage>) => {
    setHistory((prev) => ({
      ...prev,
      [m]: prev[m].map((msg) => (msg.id === id ? { ...msg, ...patch } : msg)),
    }));
  };

  const handleSubmit = async (raw: string) => {
    const text = raw.trim();
    if (!text || loading) return;

    const current = mode;
    setInputValue('');
    appendMessage(current, {
      id: nextId(),
      role: 'user',
      content: text,
    });

    const placeholderId = nextId();
    appendMessage(current, {
      id: placeholderId,
      role: 'assistant',
      content: '',
      loading: true,
    });
    setLoading(true);

    try {
      if (current === 'schema') {
        const res = await inferSchema({ sample: text });
        const data = res.data;
        setSchemaResult(data);
        updateMessage(current, placeholderId, {
          loading: false,
          content: `已识别为 ${data.format}（置信度 ${(data.confidence * 100).toFixed(0)}%），共 ${data.fields.length} 个字段，详情见右侧面板。`,
        });
      } else if (current === 'task') {
        const res = await generateTask({ prompt: text });
        const data = res.data;
        setTaskResult(data);
        updateMessage(current, placeholderId, {
          loading: false,
          content: `已生成采集任务「${data.name}」，配置详情见右侧面板。`,
        });
      } else {
        const res = await aiQa({ question: text });
        updateMessage(current, placeholderId, {
          loading: false,
          content: res.data.answer,
        });
      }
    } catch {
      updateMessage(current, placeholderId, {
        loading: false,
        content: '抱歉，请求出错了，请稍后重试。',
      });
      messageApi.error('请求失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = (value: string | number) => {
    setMode(value as Mode);
    setInputValue('');
  };

  const bubbles = useMemo(
    () =>
      messages.map((msg) => {
        const isUser = msg.role === 'user';
        return (
          <Bubble
            key={msg.id}
            placement={isUser ? 'end' : 'start'}
            avatar={isUser ? USER_AVATAR : AI_AVATAR}
            loading={msg.loading}
            variant={isUser ? 'filled' : 'outlined'}
            content={msg.content}
          />
        );
      }),
    [messages],
  );

  const renderResultPanel = () => {
    if (mode === 'schema') {
      if (!schemaResult) {
        return (
          <div className={styles.resultEmpty}>
            <Empty description="粘贴样本后，识别结果将展示在这里" />
          </div>
        );
      }
      return (
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          <Space size="large" wrap>
            <Statistic title="识别格式" value={schemaResult.format} />
            <Statistic
              title="置信度"
              value={schemaResult.confidence * 100}
              precision={0}
              suffix="%"
            />
            <Statistic title="字段数" value={schemaResult.fields.length} />
          </Space>
          <Table<DataPlatform.SchemaField>
            size="small"
            rowKey="name"
            pagination={false}
            columns={schemaFieldColumns}
            dataSource={schemaResult.fields}
          />
          <Alert
            type="info"
            showIcon
            title="接入建议"
            description={schemaResult.suggestion}
          />
          <Button
            type="primary"
            disabled={!schemaResult.recommendedConfig}
            onClick={() => setConfigModalOpen(true)}
          >
            应用为数据源配置
          </Button>
        </Space>
      );
    }

    if (mode === 'task') {
      if (!taskResult) {
        return (
          <div className={styles.resultEmpty}>
            <Empty description="描述需求后，生成的任务配置将展示在这里" />
          </div>
        );
      }
      return (
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          <ProDescriptions<DataPlatform.GeneratedTaskConfig>
            column={1}
            title="生成的采集任务配置"
            dataSource={taskResult}
            columns={[
              { title: '任务名称', dataIndex: 'name' },
              { title: '数据源类型', dataIndex: 'datasourceType' },
              {
                title: '调度方式',
                dataIndex: ['schedule', 'mode'],
                render: (_, record) =>
                  record.schedule.mode === 'cron'
                    ? `cron 周期（${record.schedule.cron}）`
                    : '单次执行',
              },
              {
                title: '配置',
                dataIndex: 'config',
                render: (_, record) => (
                  <Typography.Text code>
                    {JSON.stringify(record.config)}
                  </Typography.Text>
                ),
              },
            ]}
          />
          <Alert
            type="info"
            showIcon
            title="解析说明"
            description={taskResult.explanation}
          />
          <Button
            type="primary"
            onClick={() =>
              messageApi.info('请前往「采集任务」页，按此配置新建任务。')
            }
          >
            去创建
          </Button>
        </Space>
      );
    }

    return (
      <div className={styles.resultEmpty}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="接入答疑模式下，回答直接显示在左侧对话区"
        />
      </div>
    );
  };

  return (
    <PageContainer
      content="LLM 智能接入助手：样本识别、任务生成与接入答疑，加速数据接入。"
      extra={
        <Segmented<Mode>
          value={mode}
          onChange={handleModeChange}
          options={(Object.keys(MODE_META) as Mode[]).map((key) => ({
            label: MODE_META[key].label,
            value: key,
            icon: MODE_META[key].icon,
          }))}
        />
      }
    >
      {contextHolder}
      <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 260px)' }}>
        {/* 左：对话区（60%） */}
        <div className={styles.chatPanel} style={{ flex: '0 0 60%' }}>
          {messages.length === 0 ? (
            <div className={styles.emptyHint}>
              <div className={styles.emptyIcon}>{MODE_META[mode].icon}</div>
              <Typography.Title level={5} style={{ margin: 0 }}>
                {MODE_META[mode].label}
              </Typography.Title>
              <Typography.Text type="secondary">
                {MODE_META[mode].intro}
              </Typography.Text>
            </div>
          ) : (
            <div className={styles.messages}>{bubbles}</div>
          )}
          <div className={styles.senderWrap}>
            <Sender
              value={inputValue}
              onChange={setInputValue}
              loading={loading}
              onSubmit={handleSubmit}
              placeholder={MODE_META[mode].placeholder}
              autoSize={{ minRows: mode === 'schema' ? 3 : 1, maxRows: 8 }}
            />
          </div>
        </div>

        {/* 右：结果面板（40%） */}
        <div
          className={styles.resultPanel}
          style={{ flex: '0 0 calc(40% - 16px)' }}
        >
          {renderResultPanel()}
        </div>
      </div>

      <Modal
        title="推荐数据源配置"
        open={configModalOpen}
        onCancel={() => setConfigModalOpen(false)}
        onOk={() => setConfigModalOpen(false)}
        okText="我知道了"
        cancelButtonProps={{ style: { display: 'none' } }}
      >
        <Alert
          type="success"
          showIcon
          style={{ marginBottom: 12 }}
          title="可将以下推荐配置复制到「数据源管理」页新建数据源。"
        />
        <Typography.Paragraph>
          <pre
            style={{
              margin: 0,
              padding: 12,
              borderRadius: 6,
              background: 'rgba(0,0,0,0.04)',
              fontSize: 13,
              overflow: 'auto',
            }}
          >
            {JSON.stringify(schemaResult?.recommendedConfig ?? {}, null, 2)}
          </pre>
        </Typography.Paragraph>
      </Modal>
    </PageContainer>
  );
};

export default AssistantPage;
