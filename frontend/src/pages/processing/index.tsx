import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProDescriptions,
  ProFormDependency,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { Button, Drawer, message, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useRef, useState } from 'react';
import {
  createJob,
  getDataset,
  listDatasets,
  listJobs,
  listOperators,
} from '@/services/data-platform';

const STATE_META: Record<
  DataPlatform.Job['state'],
  { text: string; color: string }
> = {
  pending: { text: '待运行', color: 'default' },
  running: { text: '运行中', color: 'processing' },
  success: { text: '成功', color: 'success' },
  failed: { text: '失败', color: 'error' },
};

const renderOutput = (o?: DataPlatform.IngestOutput) =>
  o
    ? `${o.datasetName}（${o.rows ?? '-'} 行 · ${o.datasetId} v${o.versionNo}）`
    : '-';

const Processing: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [currentJob, setCurrentJob] = useState<DataPlatform.Job>();
  // 算子名 → 算子（用于按所选算子渲染参数表单）
  const [opMap, setOpMap] = useState<Record<string, DataPlatform.Operator>>({});

  const renderParamField = (
    opName: string,
    opLabel: string,
    p: DataPlatform.OperatorParam,
  ) => {
    const common = {
      key: `${opName}.${p.name}`,
      name: ['params', opName, p.name],
      label: `${opLabel} · ${p.label}`,
      initialValue: p.default,
    };
    if (p.type === 'select') {
      return (
        <ProFormSelect
          {...common}
          options={(p.options ?? []).map((v) => ({ label: v, value: v }))}
        />
      );
    }
    if (p.type === 'number') {
      return <ProFormDigit {...common} />;
    }
    return <ProFormText {...common} />;
  };

  const columns: ProColumns<DataPlatform.Job>[] = [
    {
      title: '任务名',
      dataIndex: 'name',
      render: (dom, record) => (
        <a
          onClick={(e) => {
            e.preventDefault();
            setCurrentJob(record);
            setDetailOpen(true);
          }}
        >
          {dom}
        </a>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      render: (_, r) => <Tag>{r.type}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'state',
      render: (_, r) => {
        const m = STATE_META[r.state];
        return <Tag color={m.color}>{m.text}</Tag>;
      },
    },
    {
      title: '产物数据集',
      dataIndex: 'output',
      render: (_, r) => renderOutput(r.output),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      render: (_, r) => dayjs(r.createdAt).format('YYYY-MM-DD HH:mm:ss'),
    },
  ];

  return (
    <PageContainer>
      <ProTable<DataPlatform.Job>
        headerTitle="数据加工任务"
        actionRef={actionRef}
        rowKey="id"
        search={false}
        options={{ reload: true }}
        request={async (params) => {
          const res = await listJobs({
            current: params.current,
            pageSize: params.pageSize,
          });
          return { data: res.data, total: res.total, success: res.success };
        }}
        columns={columns}
        toolBarRender={() => [
          <ModalForm<{
            name: string;
            datasetId: string;
            versionId: string;
            operators: string[];
            params?: Record<string, Record<string, unknown>>;
          }>
            key="create"
            title="新建加工任务"
            width={560}
            trigger={<Button type="primary">新建加工</Button>}
            modalProps={{ destroyOnHidden: true }}
            onFinish={async (values) => {
              const operators = (values.operators ?? []).map((name) => ({
                name,
                params: values.params?.[name],
              }));
              const hide = message.loading('加工执行中（dj-process）…', 0);
              try {
                const res = await createJob({
                  name: values.name,
                  type: 'clean',
                  datasetVersionId: values.versionId,
                  operators,
                });
                hide();
                if (res?.data?.state === 'success') {
                  const o = res.data.output;
                  message.success(
                    `加工成功，产出 ${o?.datasetName} v${o?.versionNo}（${o?.rows} 行）`,
                  );
                } else {
                  message.error(`加工失败：${res?.data?.error ?? '未知错误'}`);
                }
                actionRef.current?.reload();
                return true;
              } catch {
                hide();
                message.error('请求失败，请重试');
                return false;
              }
            }}
          >
            <ProFormText
              name="name"
              label="任务名"
              placeholder="请输入任务名称"
              rules={[{ required: true, message: '请输入任务名称' }]}
            />
            <ProFormSelect
              name="datasetId"
              label="数据集"
              placeholder="选择要加工的数据集"
              rules={[{ required: true, message: '请选择数据集' }]}
              request={async () => {
                const res = await listDatasets({ pageSize: 100 });
                return res.data.map((d) => ({ label: d.name, value: d.id }));
              }}
            />
            <ProFormDependency name={['datasetId']}>
              {({ datasetId }) => (
                <ProFormSelect
                  name="versionId"
                  label="版本"
                  placeholder="选择数据集版本"
                  rules={[{ required: true, message: '请选择版本' }]}
                  params={{ datasetId }}
                  request={async () => {
                    if (!datasetId) return [];
                    const res = await getDataset(datasetId);
                    return (res.data?.versions ?? []).map((v) => ({
                      label: `v${v.versionNo}（${v.rows ?? '-'} 行）`,
                      value: v.id,
                    }));
                  }}
                />
              )}
            </ProFormDependency>
            <ProFormSelect
              name="operators"
              label="算子编排"
              mode="multiple"
              placeholder="按顺序选择算子（清洗/过滤）"
              tooltip="算子按选择顺序依次执行，产出为该数据集的新版本"
              rules={[{ required: true, message: '请至少选择一个算子' }]}
              request={async () => {
                const res = await listOperators();
                const ops = res.data ?? [];
                setOpMap(Object.fromEntries(ops.map((o) => [o.name, o])));
                return ops.map((o) => ({
                  label: `${o.label}（${o.category}）`,
                  value: o.name,
                }));
              }}
            />
            <ProFormDependency name={['operators']}>
              {({ operators }) => {
                const selected = (operators ?? []) as string[];
                const fields = selected
                  .filter((n) => (opMap[n]?.params?.length ?? 0) > 0)
                  .flatMap((n) =>
                    opMap[n].params.map((p) =>
                      renderParamField(n, opMap[n].label, p),
                    ),
                  );
                return fields.length ? <>{fields}</> : null;
              }}
            </ProFormDependency>
          </ModalForm>,
        ]}
      />

      <Drawer
        width={640}
        open={detailOpen}
        title={currentJob?.name}
        onClose={() => {
          setDetailOpen(false);
          setCurrentJob(undefined);
        }}
      >
        {currentJob && (
          <>
            <ProDescriptions<DataPlatform.Job>
              column={1}
              dataSource={currentJob}
              columns={[
                { title: '任务名', dataIndex: 'name' },
                { title: '类型', dataIndex: 'type' },
                {
                  title: '状态',
                  dataIndex: 'state',
                  render: (_, r) => {
                    const m = STATE_META[r.state];
                    return <Tag color={m.color}>{m.text}</Tag>;
                  },
                },
                {
                  title: '产物数据集',
                  dataIndex: 'output',
                  render: (_, r) => renderOutput(r.output),
                },
                {
                  title: '创建时间',
                  dataIndex: 'createdAt',
                  valueType: 'dateTime',
                },
                {
                  title: '错误',
                  dataIndex: 'error',
                  render: (_, r) =>
                    r.error ? (
                      <Typography.Text type="danger">{r.error}</Typography.Text>
                    ) : (
                      '-'
                    ),
                },
              ]}
            />
            {currentJob.configYaml && (
              <>
                <Typography.Title level={5} style={{ marginTop: 16 }}>
                  算子配置（生成的 data-juicer YAML）
                </Typography.Title>
                <Typography.Paragraph>
                  <pre
                    style={{
                      background: 'var(--ant-color-fill-quaternary, #f5f5f5)',
                      padding: 12,
                      borderRadius: 6,
                      overflow: 'auto',
                      fontSize: 12,
                    }}
                  >
                    {currentJob.configYaml}
                  </pre>
                </Typography.Paragraph>
              </>
            )}
          </>
        )}
      </Drawer>
    </PageContainer>
  );
};

export default Processing;
