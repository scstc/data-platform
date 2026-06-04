// @ts-ignore
/* eslint-disable */

declare namespace DataPlatform {
  /** 数据源类型 */
  type DataSourceType = 's3' | 'hdfs' | 'database' | 'api';

  /** 数据库类型（当 DataSourceType 为 database 时使用） */
  type DbKind =
    | 'dameng'
    | 'goldendb'
    | 'kingbase'
    | 'gaussdb'
    | 'hologres'
    | 'sequoiadb'
    | 'hive'
    | 'doris';

  /** 数据源 */
  type DataSource = {
    id: string;
    name: string;
    type: DataSourceType;
    dbKind?: DbKind;
    status: 'connected' | 'failed' | 'pending';
    config: Record<string, any>;
    description?: string;
    creator: string;
    createdAt: string;
    updatedAt: string;
  };

  /** 采集任务调度 */
  type IngestSchedule = {
    mode: 'once' | 'cron';
    cron?: string;
  };

  /** 采集任务 */
  type IngestTask = {
    id: string;
    name: string;
    datasourceId: string;
    datasourceName: string;
    schedule: IngestSchedule;
    status: 'pending' | 'running' | 'success' | 'failed';
    progress: number;
    createdAt: string;
    lastRunAt?: string;
    logs?: string[];
  };

  /** 上传记录 */
  type UploadRecord = {
    id: string;
    filename: string;
    size: number;
    format: string;
    status: 'done' | 'error';
    uploadedAt: string;
  };

  /** 推断出的字段 */
  type SchemaField = {
    name: string;
    type: string;
    example: string;
    nullable: boolean;
  };

  /** 推断出的 schema */
  type InferredSchema = {
    format: string;
    confidence: number;
    fields: SchemaField[];
    suggestion: string;
    recommendedConfig?: Record<string, any>;
  };

  /** AI 生成的采集任务配置 */
  type GeneratedTaskConfig = {
    name: string;
    datasourceType: DataSourceType;
    schedule: IngestSchedule;
    config: Record<string, any>;
    explanation: string;
  };

  /** 分页查询通用响应 */
  type PageResult<T> = {
    data: T[];
    total: number;
    success: boolean;
  };

  /** 数据源列表查询参数 */
  type DataSourceListParams = {
    current?: number;
    pageSize?: number;
    name?: string;
    type?: DataSourceType;
  };

  /** 采集任务列表查询参数 */
  type IngestTaskListParams = {
    current?: number;
    pageSize?: number;
    name?: string;
    status?: IngestTask['status'];
  };

  /** 上传记录列表查询参数 */
  type UploadListParams = {
    current?: number;
    pageSize?: number;
  };

  /** 新建数据源入参 */
  type DataSourceCreate = {
    name: string;
    type: DataSourceType;
    dbKind?: DbKind;
    config: Record<string, any>;
    description?: string;
  };

  /** 更新数据源入参 */
  type DataSourceUpdate = Partial<DataSourceCreate> & {
    status?: DataSource['status'];
  };

  /** 测试连接入参 */
  type TestConnectionParams = {
    type: DataSourceType;
    dbKind?: DbKind;
    config: Record<string, any>;
  };

  /** 测试连接结果 */
  type TestConnectionResult = {
    success: boolean;
    latencyMs: number;
    message: string;
  };

  /** 新建采集任务入参 */
  type IngestTaskCreate = {
    name: string;
    datasourceId: string;
    schedule: IngestSchedule;
  };

  /** 单个上传记录响应 */
  type UploadResult = {
    data: UploadRecord;
    success: boolean;
  };

  /** 推断 schema 响应 */
  type InferSchemaResult = {
    data: InferredSchema;
    success: boolean;
  };

  /** 生成采集任务响应 */
  type GenerateTaskResult = {
    data: GeneratedTaskConfig;
    success: boolean;
  };

  /** AI 问答响应 */
  type QaResult = {
    data: { answer: string };
    success: boolean;
  };
}
