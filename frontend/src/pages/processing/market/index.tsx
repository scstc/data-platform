import { StarFilled } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history, useModel } from '@umijs/max';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Divider,
  Drawer,
  Empty,
  Input,
  Menu,
  message,
  Pagination,
  Row,
  Space,
  Spin,
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';
import {
  getOperatorCatalogMeta,
  listOperatorCatalog,
} from '@/services/data-platform';

const { Paragraph, Text } = Typography;

/** 可运行状态 → 单一状态信号(一个圆点 + 文案,避免多标签堆叠) */
const RUNNABLE_BADGE: Record<
  DataPlatform.CatalogOperator['runnable'],
  { status: 'success' | 'warning' | 'default'; text: string }
> = {
  ready: { status: 'success', text: '可运行' },
  needs_api: { status: 'warning', text: '需配置 LLM' },
  needs_media: { status: 'default', text: '需媒体数据' },
  needs_compute: { status: 'default', text: '需要算力' },
};

const RESOURCE_LABEL: Record<string, string> = {
  cpu: 'CPU',
  api_llm: 'LLM API',
  hf_model: 'HF 模型',
  gpu: 'GPU',
  vllm: 'vLLM',
};

const PARAM_COLUMNS = [
  { title: '参数', dataIndex: 'name', width: 160 },
  { title: '类型', dataIndex: 'type', width: 150, ellipsis: true },
  { title: '默认值', dataIndex: 'default', width: 120, ellipsis: true },
  { title: '说明', dataIndex: 'desc', ellipsis: true },
];

/** 一行 muted 元信息:资源类 + 模态 */
const metaLine = (op: DataPlatform.CatalogOperator) =>
  [RESOURCE_LABEL[op.resourceClass] ?? op.resourceClass, ...(op.modality ?? [])]
    .filter(Boolean)
    .join(' · ');

const Market: React.FC = () => {
  const { ops: cart, add, clear } = useModel('opCart');

  const [meta, setMeta] = useState<DataPlatform.OperatorCatalogMeta>();
  const [scenario, setScenario] = useState<string>();
  const [keyword, setKeyword] = useState<string>();
  const [onlyReady, setOnlyReady] = useState(false);
  const [onlyRecommend, setOnlyRecommend] = useState(true);
  const [current, setCurrent] = useState(1);
  const pageSize = 24;

  const [data, setData] = useState<DataPlatform.CatalogOperator[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<DataPlatform.CatalogOperator>();

  useEffect(() => {
    getOperatorCatalogMeta().then((r) => setMeta(r.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    listOperatorCatalog({
      scenario,
      keyword,
      runnable: onlyReady ? 'ready' : undefined,
      recommend: onlyRecommend || undefined,
      current,
      pageSize,
    })
      .then((r) => {
        setData(r.data);
        setTotal(r.total);
      })
      .finally(() => setLoading(false));
  }, [scenario, keyword, onlyReady, onlyRecommend, current]);

  const menuItems = useMemo(() => {
    const groups = Object.entries(meta?.byScenario ?? {}).sort(
      (a, b) => b[1] - a[1],
    );
    return [
      { key: 'all', label: `全部　${meta?.total ?? ''}` },
      ...groups.map(([name, count]) => ({
        key: name,
        label: `${name}　${count}`,
      })),
    ];
  }, [meta]);

  const onAdd = (op: DataPlatform.CatalogOperator) => {
    add(op.name);
    message.success(`已加入「${op.zhLabel}」`);
  };

  return (
    <PageContainer
      content={
        meta
          ? `共 ${meta.total} 个算子 · ${meta.byRunnable.ready ?? 0} 个现在可运行 · ${meta.recommended} 个推荐`
          : ' '
      }
      footer={
        cart.length
          ? [
              <Space key="cart">
                <Text type="secondary">已选 {cart.length} 个算子</Text>
                <Button onClick={clear}>清空</Button>
                <Button
                  type="primary"
                  onClick={() => history.push('/processing/jobs')}
                >
                  去新建加工任务
                </Button>
              </Space>,
            ]
          : undefined
      }
    >
      <Row gutter={16}>
        {/* 左:场景分面(用 inline Menu,与平台左导航统一) */}
        <Col xs={24} md={6} lg={5} xl={4}>
          <Card styles={{ body: { padding: 0 } }}>
            <Menu
              mode="inline"
              selectedKeys={[scenario ?? 'all']}
              items={menuItems}
              style={{ borderInlineEnd: 'none' }}
              onClick={({ key }) => {
                setScenario(key === 'all' ? undefined : key);
                setCurrent(1);
              }}
            />
          </Card>
        </Col>

        {/* 右:工具栏 + 卡片栅格 */}
        <Col xs={24} md={18} lg={19} xl={20}>
          <Card>
            <Space
              style={{
                marginBottom: 16,
                width: '100%',
                justifyContent: 'space-between',
              }}
              wrap
            >
              <Input.Search
                allowClear
                placeholder="搜索算子名 / 中文说明"
                style={{ width: 280 }}
                onSearch={(v) => {
                  setKeyword(v || undefined);
                  setCurrent(1);
                }}
              />
              <Space size="large">
                <Space size={6}>
                  <Switch
                    size="small"
                    checked={onlyReady}
                    onChange={(v) => {
                      setOnlyReady(v);
                      setCurrent(1);
                    }}
                  />
                  <Text type="secondary">只看可运行</Text>
                </Space>
                <Space size={6}>
                  <Switch
                    size="small"
                    checked={onlyRecommend}
                    onChange={(v) => {
                      setOnlyRecommend(v);
                      setCurrent(1);
                    }}
                  />
                  <Text type="secondary">仅推荐</Text>
                </Space>
              </Space>
            </Space>

            {!loading && data.length === 0 ? (
              <Empty
                description="没有符合条件的算子"
                style={{ padding: '48px 0' }}
              />
            ) : (
              <Spin spinning={loading}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: 16,
                  }}
                >
                  {data.map((op) => {
                    const badge = RUNNABLE_BADGE[op.runnable];
                    const inCart = cart.includes(op.name);
                    return (
                      <Card
                        key={op.name}
                        hoverable
                        variant="outlined"
                        styles={{
                          body: {
                            padding: 16,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                          },
                        }}
                        style={{ height: '100%' }}
                        onClick={() => setDetail(op)}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <Text strong ellipsis style={{ flex: 1 }}>
                            {op.zhLabel}
                          </Text>
                          {op.recommend && (
                            <StarFilled
                              style={{ color: '#faad14', fontSize: 12 }}
                            />
                          )}
                        </div>
                        <Text
                          type="secondary"
                          ellipsis
                          style={{ fontFamily: 'monospace', fontSize: 12 }}
                        >
                          {op.name}
                        </Text>
                        <Paragraph
                          type="secondary"
                          ellipsis={{
                            rows: 2,
                            tooltip: op.zhUsageTip || op.summaryZh,
                          }}
                          style={{
                            margin: '10px 0 6px',
                            minHeight: 40,
                            fontSize: 13,
                          }}
                        >
                          {op.zhUsageTip || op.summaryZh}
                        </Paragraph>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {metaLine(op)}
                        </Text>
                        <Divider
                          style={{ marginBlock: 12, marginTop: 'auto' }}
                        />
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Badge
                            status={badge.status}
                            text={
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {badge.text}
                              </Text>
                            }
                          />
                          <Button
                            size="small"
                            type="primary"
                            disabled={op.runnable !== 'ready' || inCart}
                            onClick={(e) => {
                              e.stopPropagation();
                              onAdd(op);
                            }}
                          >
                            {inCart ? '已加入' : '加入'}
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
                {total > pageSize && (
                  <div style={{ marginTop: 16, textAlign: 'center' }}>
                    <Pagination
                      current={current}
                      pageSize={pageSize}
                      total={total}
                      showSizeChanger={false}
                      onChange={setCurrent}
                    />
                  </div>
                )}
              </Spin>
            )}
          </Card>
        </Col>
      </Row>

      <Drawer
        width={680}
        open={!!detail}
        title={detail && `${detail.zhLabel} · ${detail.name}`}
        onClose={() => setDetail(undefined)}
        extra={
          detail &&
          detail.runnable === 'ready' && (
            <Button
              type="primary"
              disabled={cart.includes(detail.name)}
              onClick={() => onAdd(detail)}
            >
              {cart.includes(detail.name) ? '已加入' : '加入加工任务'}
            </Button>
          )
        }
      >
        {detail && (
          <>
            <Space wrap style={{ marginBottom: 16 }}>
              <Tag>{detail.category}</Tag>
              {(detail.modality ?? []).map((m) => (
                <Tag key={m}>{m}</Tag>
              ))}
              <Tag>
                {RESOURCE_LABEL[detail.resourceClass] ?? detail.resourceClass}
              </Tag>
              <Badge
                status={RUNNABLE_BADGE[detail.runnable].status}
                text={RUNNABLE_BADGE[detail.runnable].text}
              />
            </Space>
            {detail.zhUsageTip && (
              <Alert
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
                title="何时使用"
                description={detail.zhUsageTip}
              />
            )}
            <Paragraph>{detail.descZh || detail.summaryZh}</Paragraph>
            {detail.descEn && (
              <Paragraph type="secondary" style={{ fontSize: 12 }}>
                {detail.descEn}
              </Paragraph>
            )}
            <Typography.Title level={5} style={{ marginTop: 16 }}>
              参数
            </Typography.Title>
            {detail.params?.length ? (
              <Table
                size="small"
                rowKey="name"
                pagination={false}
                dataSource={detail.params}
                columns={PARAM_COLUMNS}
              />
            ) : (
              <Text type="secondary">无参数</Text>
            )}
            {detail.example && (
              <>
                <Typography.Title level={5} style={{ marginTop: 16 }}>
                  用法示例
                </Typography.Title>
                <pre
                  style={{
                    background: 'var(--ant-color-fill-quaternary, #f5f5f5)',
                    padding: 12,
                    borderRadius: 6,
                    overflow: 'auto',
                    fontSize: 12,
                  }}
                >
                  {detail.example}
                </pre>
              </>
            )}
            {detail.runnable !== 'ready' && (
              <Alert
                type="warning"
                showIcon
                style={{ marginTop: 16 }}
                title={
                  detail.runnable === 'needs_api'
                    ? '该算子需要 LLM API:在后端 .env 配置 OPENAI_* 后可用。'
                    : detail.runnable === 'needs_compute'
                      ? '该算子需要 GPU / HuggingFace 模型 / vLLM,当前环境暂不可执行。'
                      : '该算子处理图像/音视频,当前受管数据集为文本,暂不适用。'
                }
              />
            )}
          </>
        )}
      </Drawer>
    </PageContainer>
  );
};

export default Market;
