import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  PageContainer,
  ProDescriptions,
  ProTable,
} from '@ant-design/pro-components';
import type { TableColumnsType } from 'antd';
import { Drawer, Empty, Spin, Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useRef, useState } from 'react';
import {
  getDataset,
  listDatasets,
  previewDatasetVersion,
} from '@/services/data-platform';

/** 字节数转人类可读 */
const fmtSize = (n?: number) => {
  if (!n && n !== 0) return '-';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
};

/** 单元格值渲染：对象转 JSON，其余转字符串 */
const cellText = (v: unknown) =>
  v === null || v === undefined
    ? ''
    : typeof v === 'object'
      ? JSON.stringify(v)
      : String(v);

const DatasetsList: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<DataPlatform.DatasetDetail>();
  const [activeVersion, setActiveVersion] = useState<string>();
  const [preview, setPreview] = useState<DataPlatform.DatasetPreview>();
  const [previewLoading, setPreviewLoading] = useState(false);

  const loadPreview = async (versionId: string) => {
    setActiveVersion(versionId);
    setPreviewLoading(true);
    try {
      const res = await previewDatasetVersion(versionId, { limit: 50 });
      setPreview(res);
    } finally {
      setPreviewLoading(false);
    }
  };

  const openDetail = async (id: string) => {
    const res = await getDataset(id);
    if (res?.success) {
      setDetail(res.data);
      setDetailOpen(true);
      const latest = res.data.versions[res.data.versions.length - 1];
      setPreview(undefined);
      setActiveVersion(undefined);
      if (latest) await loadPreview(latest.id);
    }
  };

  const columns: ProColumns<DataPlatform.Dataset>[] = [
    {
      title: '名称',
      dataIndex: 'name',
      render: (dom, record) => (
        <a
          onClick={(e) => {
            e.preventDefault();
            openDetail(record.id);
          }}
        >
          {dom}
        </a>
      ),
    },
    {
      title: '类型',
      dataIndex: 'dataType',
      search: false,
      render: (_, r) => (r.dataType ? <Tag>{r.dataType}</Tag> : '-'),
    },
    { title: '描述', dataIndex: 'description', search: false, ellipsis: true },
    { title: '创建人', dataIndex: 'creator', search: false },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      search: false,
      render: (_, r) => dayjs(r.createdAt).format('YYYY-MM-DD HH:mm:ss'),
    },
  ];

  const versionColumns: TableColumnsType<DataPlatform.DatasetVersion> = [
    { title: '版本', dataIndex: 'versionNo', render: (_, v) => `v${v.versionNo}` },
    { title: '行数', dataIndex: 'rows', render: (_, v) => v.rows ?? '-' },
    { title: '大小', dataIndex: 'size', render: (_, v) => fmtSize(v.size) },
    {
      title: '来源',
      dataIndex: 'origin',
      render: (_, v) => (
        <Tag color={v.origin === 'managed' ? 'green' : 'gold'}>{v.origin}</Tag>
      ),
    },
    {
      title: '操作',
      render: (_, v) => (
        <a
          onClick={() => loadPreview(v.id)}
          style={{
            fontWeight: activeVersion === v.id ? 600 : undefined,
          }}
        >
          预览
        </a>
      ),
    },
  ];

  const previewColumns = (preview?.columns ?? []).map((c) => ({
    title: c,
    dataIndex: c,
    key: c,
    ellipsis: true,
    render: (v: unknown) => cellText(v),
  }));

  return (
    <PageContainer>
      <ProTable<DataPlatform.Dataset>
        headerTitle="数据集仓库"
        actionRef={actionRef}
        rowKey="id"
        search={false}
        options={{ reload: true }}
        request={async (params) => {
          const res = await listDatasets({
            current: params.current,
            pageSize: params.pageSize,
          });
          return { data: res.data, total: res.total, success: res.success };
        }}
        columns={columns}
      />

      <Drawer
        width={900}
        open={detailOpen}
        title={detail?.name}
        onClose={() => {
          setDetailOpen(false);
          setDetail(undefined);
          setPreview(undefined);
          setActiveVersion(undefined);
        }}
      >
        {detail && (
          <>
            <ProDescriptions<DataPlatform.DatasetDetail>
              column={2}
              dataSource={detail}
              columns={[
                { title: 'ID', dataIndex: 'id' },
                { title: '名称', dataIndex: 'name' },
                {
                  title: '类型',
                  dataIndex: 'dataType',
                  render: (_, r) => r.dataType ?? '-',
                },
                {
                  title: '分级',
                  dataIndex: 'sensitivityLevel',
                  render: (_, r) => r.sensitivityLevel ?? '-',
                },
                {
                  title: '分类',
                  dataIndex: 'businessCategory',
                  render: (_, r) => r.businessCategory ?? '-',
                },
                { title: '归属', dataIndex: 'owner' },
                { title: '创建人', dataIndex: 'creator' },
                {
                  title: '最后变更人',
                  dataIndex: 'lastModifier',
                  render: (_, r) => r.lastModifier ?? '-',
                },
                {
                  title: '创建时间',
                  dataIndex: 'createdAt',
                  valueType: 'dateTime',
                },
                {
                  title: '描述',
                  dataIndex: 'description',
                  span: 2,
                  render: (_, r) => r.description ?? '-',
                },
              ]}
            />

            <Typography.Title level={5} style={{ marginTop: 16 }}>
              版本
            </Typography.Title>
            <Table<DataPlatform.DatasetVersion>
              rowKey="id"
              size="small"
              pagination={false}
              dataSource={detail.versions}
              columns={versionColumns}
            />

            <Typography.Title level={5} style={{ marginTop: 16 }}>
              数据预览{preview ? `（共 ${preview.total} 行，前 50 行）` : ''}
            </Typography.Title>
            <Spin spinning={previewLoading}>
              {preview && preview.data.length > 0 ? (
                <Table
                  rowKey={(_, i) => String(i)}
                  size="small"
                  scroll={{ x: 'max-content' }}
                  pagination={{ pageSize: 10 }}
                  dataSource={preview.data}
                  columns={previewColumns}
                />
              ) : (
                <Empty
                  description={preview?.message ?? '暂无数据'}
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </Spin>
          </>
        )}
      </Drawer>
    </PageContainer>
  );
};

export default DatasetsList;
