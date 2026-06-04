import { InboxOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { UploadProps } from 'antd';
import { message, Space, Tag, Typography, Upload } from 'antd';
import { useRef } from 'react';
import { listUploads, uploadFile } from '@/services/data-platform';
import {
  ACCEPT,
  ALLOWED_EXTENSIONS,
  formatFileSize,
  isAllowedExtension,
  MAX_FILE_SIZE,
} from './utils';

const { Dragger } = Upload;
const { Paragraph, Text } = Typography;

const UploadPage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  /** 上传前校验：扩展名白名单 + 单文件 ≤200MB；不合法则 message.error 并拒绝 */
  const beforeUpload: NonNullable<UploadProps['beforeUpload']> = (file) => {
    if (!isAllowedExtension(file.name)) {
      messageApi.error(
        `不支持的文件格式：${file.name}，仅支持 ${ALLOWED_EXTENSIONS.join('、')}`,
      );
      return Upload.LIST_IGNORE;
    }
    if (file.size > MAX_FILE_SIZE) {
      messageApi.error(`文件 ${file.name} 超过 200MB 大小限制`);
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  /** 用项目 request 走 /api/v1/upload，成功后刷新上传记录表 */
  const customRequest: NonNullable<UploadProps['customRequest']> = async (
    options,
  ) => {
    const { file, onSuccess, onError } = options;
    const formData = new FormData();
    formData.append('file', file as File);
    try {
      const res = await uploadFile(formData);
      onSuccess?.(res);
      messageApi.success(`${(file as File).name} 上传成功`);
      actionRef.current?.reload();
    } catch (err) {
      onError?.(err as Error);
      messageApi.error(`${(file as File).name} 上传失败`);
    }
  };

  const columns: ProColumns<DataPlatform.UploadRecord>[] = [
    {
      title: '文件名',
      dataIndex: 'filename',
      ellipsis: true,
    },
    {
      title: '格式',
      dataIndex: 'format',
      width: 100,
      render: (_, record) => <Tag color="blue">{record.format}</Tag>,
    },
    {
      title: '大小',
      dataIndex: 'size',
      width: 120,
      render: (_, record) => formatFileSize(record.size),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      valueEnum: {
        done: { text: '成功', status: 'Success' },
        error: { text: '失败', status: 'Error' },
      },
    },
    {
      title: '上传时间',
      dataIndex: 'uploadedAt',
      width: 180,
      valueType: 'dateTime',
    },
  ];

  return (
    <PageContainer>
      {contextHolder}
      <Dragger
        name="file"
        multiple
        accept={ACCEPT}
        beforeUpload={beforeUpload}
        customRequest={customRequest}
        showUploadList
        style={{ marginBottom: 16 }}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
        <p className="ant-upload-hint">支持多文件上传，单个文件不超过 200MB</p>
      </Dragger>

      <Paragraph style={{ marginBottom: 24 }}>
        <Text type="secondary">支持的文件格式：</Text>
        <Space size={[4, 8]} wrap style={{ marginTop: 8 }}>
          {ALLOWED_EXTENSIONS.map((ext) => (
            <Tag key={ext}>.{ext}</Tag>
          ))}
        </Space>
      </Paragraph>

      <ProTable<DataPlatform.UploadRecord, DataPlatform.UploadListParams>
        headerTitle="上传记录"
        actionRef={actionRef}
        rowKey="id"
        search={false}
        columns={columns}
        request={async (params) => {
          const { current, pageSize } = params;
          const res = await listUploads({ current, pageSize });
          return {
            data: res.data,
            total: res.total,
            success: res.success,
          };
        }}
      />
    </PageContainer>
  );
};

export default UploadPage;
