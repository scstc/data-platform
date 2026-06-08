/** 数据源类型 / 数据库品牌的中文映射与选项常量 */

/** 数据源类型 → 中文名 + Tag 颜色 */
export const TYPE_META: Record<
  DataPlatform.DataSourceType,
  { label: string; color: string }
> = {
  s3: { label: 'S3 对象存储', color: 'geekblue' },
  hdfs: { label: 'HDFS', color: 'cyan' },
  database: { label: '数据库', color: 'purple' },
  api: { label: 'API 推送', color: 'gold' },
};

/** 数据库品牌 → 中文名 */
export const DB_KIND_LABEL: Record<DataPlatform.DbKind, string> = {
  postgresql: 'PostgreSQL',
  dameng: '达梦 DM',
  goldendb: 'GoldenDB',
  kingbase: '人大金仓 KingbaseES',
  gaussdb: '华为 GaussDB',
  hologres: '阿里 Hologres',
  sequoiadb: '巨杉 SequoiaDB',
  hive: 'Apache Hive',
  doris: 'Apache Doris',
};

/** 数据库品牌下拉选项 */
export const DB_KIND_OPTIONS = (
  Object.keys(DB_KIND_LABEL) as DataPlatform.DbKind[]
).map((value) => ({ value, label: DB_KIND_LABEL[value] }));

/** 状态 → Badge 文案与状态色 */
export const STATUS_META: Record<
  DataPlatform.DataSource['status'],
  { label: string; status: 'success' | 'error' | 'default' }
> = {
  connected: { label: '已连接', status: 'success' },
  failed: { label: '失败', status: 'error' },
  pending: { label: '待验证', status: 'default' },
};

/** 新建向导四张类型卡片 */
export const TYPE_CARDS: {
  type: DataPlatform.DataSourceType;
  title: string;
  desc: string;
}[] = [
  {
    type: 's3',
    title: 'S3 兼容对象存储',
    desc: '对接 AWS S3 / MinIO 等对象存储桶',
  },
  { type: 'hdfs', title: 'HDFS', desc: '对接 Hadoop 分布式文件系统' },
  {
    type: 'database',
    title: '数据库直连',
    desc: '达梦 / Hive / Doris 等 8 种数据库',
  },
  { type: 'api', title: 'API 推送', desc: '由外部系统主动推送数据到平台' },
];
