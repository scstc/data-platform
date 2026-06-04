import dayjs from 'dayjs';
import type { Request, Response } from 'express';

/**
 * 数据平台 mock —— 带内存态
 * 所有增删改查真实操作内存数组，重启 dev server 后重置为预置数据。
 * 契约见 src/services/data-platform/typings.d.ts。
 */

const now = () => dayjs().format('YYYY-MM-DD HH:mm:ss');
const ago = (hours: number) => dayjs().subtract(hours, 'hour').format('YYYY-MM-DD HH:mm:ss');
const randId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

// ---------------------------------------------------------------------------
// 预置内存数据
// ---------------------------------------------------------------------------

let dataSources: DataPlatform.DataSource[] = [
  {
    id: 'ds-s3-01',
    name: '生产对象存储',
    type: 's3',
    status: 'connected',
    config: {
      endpoint: 's3.cn-north-1.amazonaws.com.cn',
      bucket: 'prod-data-lake',
      accessKey: 'AKIA****EXAMPLE',
      secretKey: '****',
      region: 'cn-north-1',
    },
    description: '生产环境主数据湖，存放原始语料',
    creator: '孙朋',
    createdAt: ago(240),
    updatedAt: ago(12),
  },
  {
    id: 'ds-hdfs-01',
    name: '离线计算 HDFS',
    type: 'hdfs',
    status: 'connected',
    config: {
      nameNode: 'hdfs://namenode.internal:8020',
      path: '/user/data-platform/raw',
      user: 'hadoop',
    },
    description: '离线数仓 HDFS 集群',
    creator: '孙朋',
    createdAt: ago(200),
    updatedAt: ago(48),
  },
  {
    id: 'ds-db-dameng',
    name: '达梦业务库',
    type: 'database',
    dbKind: 'dameng',
    status: 'connected',
    config: {
      host: '10.60.1.30',
      port: 5236,
      database: 'BIZ',
      username: 'SYSDBA',
      password: '****',
    },
    description: '核心业务系统达梦数据库',
    creator: '李雷',
    createdAt: ago(180),
    updatedAt: ago(24),
  },
  {
    id: 'ds-db-hive',
    name: 'Hive 数仓',
    type: 'database',
    dbKind: 'hive',
    status: 'pending',
    config: {
      host: '10.60.1.40',
      port: 10000,
      database: 'ods',
      username: 'hive',
      password: '****',
    },
    description: 'Hive 离线数仓，待联通验证',
    creator: '李雷',
    createdAt: ago(96),
    updatedAt: ago(2),
  },
  {
    id: 'ds-db-doris',
    name: 'Doris 实时分析',
    type: 'database',
    dbKind: 'doris',
    status: 'connected',
    config: {
      host: '10.60.1.50',
      port: 9030,
      database: 'analytics',
      username: 'root',
      password: '****',
    },
    description: 'Doris MPP 实时分析库',
    creator: '韩梅梅',
    createdAt: ago(150),
    updatedAt: ago(6),
  },
  {
    id: 'ds-db-kingbase',
    name: '人大金仓库',
    type: 'database',
    dbKind: 'kingbase',
    status: 'failed',
    config: {
      host: '10.60.1.60',
      port: 54321,
      database: 'kingbase',
      username: 'system',
      password: '',
    },
    description: '人大金仓 KingbaseES，连接失败（缺密码）',
    creator: '韩梅梅',
    createdAt: ago(120),
    updatedAt: ago(1),
  },
  {
    id: 'ds-db-gaussdb',
    name: 'GaussDB 客户库',
    type: 'database',
    dbKind: 'gaussdb',
    status: 'connected',
    config: {
      host: '10.60.1.70',
      port: 8000,
      database: 'customer',
      username: 'gauss',
      password: '****',
    },
    description: '华为 GaussDB 客户主数据',
    creator: '孙朋',
    createdAt: ago(72),
    updatedAt: ago(3),
  },
  {
    id: 'ds-api-01',
    name: '外部行情 API',
    type: 'api',
    status: 'connected',
    config: {
      url: 'https://api.market.example.com/v1/quotes',
      method: 'GET',
      authType: 'bearer',
      token: '****',
    },
    description: '第三方行情数据 REST 接口',
    creator: '李雷',
    createdAt: ago(60),
    updatedAt: ago(4),
  },
];

let ingestTasks: DataPlatform.IngestTask[] = [
  {
    id: 'task-01',
    name: '对象存储语料每日同步',
    datasourceId: 'ds-s3-01',
    datasourceName: '生产对象存储',
    schedule: { mode: 'cron', cron: '0 2 * * *' },
    status: 'success',
    progress: 100,
    createdAt: ago(240),
    lastRunAt: ago(10),
    logs: ['[INFO] 任务启动', '[INFO] 拉取对象 1280 个', '[INFO] 同步完成，耗时 312s'],
  },
  {
    id: 'task-02',
    name: 'HDFS 原始日志增量采集',
    datasourceId: 'ds-hdfs-01',
    datasourceName: '离线计算 HDFS',
    schedule: { mode: 'cron', cron: '0 */6 * * *' },
    status: 'running',
    progress: 40,
    createdAt: ago(48),
    lastRunAt: ago(1),
    logs: ['[INFO] 任务启动', '[INFO] 扫描分区 /raw/dt=2026-06-04', '[INFO] 已处理 40%'],
  },
  {
    id: 'task-03',
    name: '达梦业务表全量导出',
    datasourceId: 'ds-db-dameng',
    datasourceName: '达梦业务库',
    schedule: { mode: 'once' },
    status: 'running',
    progress: 80,
    createdAt: ago(24),
    lastRunAt: ago(1),
    logs: ['[INFO] 任务启动', '[INFO] 导出表 t_order', '[INFO] 已处理 80%'],
  },
  {
    id: 'task-04',
    name: 'Doris 指标回灌',
    datasourceId: 'ds-db-doris',
    datasourceName: 'Doris 实时分析',
    schedule: { mode: 'cron', cron: '*/30 * * * *' },
    status: 'pending',
    progress: 0,
    createdAt: ago(12),
    logs: ['[INFO] 任务已创建，等待调度'],
  },
  {
    id: 'task-05',
    name: 'Hive 维表同步',
    datasourceId: 'ds-db-hive',
    datasourceName: 'Hive 数仓',
    schedule: { mode: 'cron', cron: '0 1 * * 1' },
    status: 'failed',
    progress: 65,
    createdAt: ago(72),
    lastRunAt: ago(20),
    logs: ['[INFO] 任务启动', '[ERROR] 连接 Hive 超时', '[ERROR] 任务失败'],
  },
  {
    id: 'task-06',
    name: '外部行情 API 拉取',
    datasourceId: 'ds-api-01',
    datasourceName: '外部行情 API',
    schedule: { mode: 'cron', cron: '0 9 * * 1-5' },
    status: 'success',
    progress: 100,
    createdAt: ago(60),
    lastRunAt: ago(5),
    logs: ['[INFO] 任务启动', '[INFO] 请求 API 成功', '[INFO] 写入 4200 条记录'],
  },
  {
    id: 'task-07',
    name: 'GaussDB 客户主数据采集',
    datasourceId: 'ds-db-gaussdb',
    datasourceName: 'GaussDB 客户库',
    schedule: { mode: 'once' },
    status: 'success',
    progress: 100,
    createdAt: ago(70),
    lastRunAt: ago(68),
    logs: ['[INFO] 任务启动', '[INFO] 采集完成'],
  },
  {
    id: 'task-08',
    name: '对象存储历史归档回补',
    datasourceId: 'ds-s3-01',
    datasourceName: '生产对象存储',
    schedule: { mode: 'once' },
    status: 'running',
    progress: 20,
    createdAt: ago(6),
    lastRunAt: ago(1),
    logs: ['[INFO] 任务启动', '[INFO] 回补 2025 年归档', '[INFO] 已处理 20%'],
  },
  {
    id: 'task-09',
    name: 'Kingbase 连接探活采集',
    datasourceId: 'ds-db-kingbase',
    datasourceName: '人大金仓库',
    schedule: { mode: 'cron', cron: '0 0 * * *' },
    status: 'pending',
    progress: 0,
    createdAt: ago(120),
    logs: ['[INFO] 任务已创建，等待数据源联通'],
  },
  {
    id: 'task-10',
    name: 'HDFS 周度全量校验',
    datasourceId: 'ds-hdfs-01',
    datasourceName: '离线计算 HDFS',
    schedule: { mode: 'cron', cron: '0 3 * * 0' },
    status: 'failed',
    progress: 30,
    createdAt: ago(168),
    lastRunAt: ago(160),
    logs: ['[INFO] 任务启动', '[ERROR] 校验失败：分区缺失', '[ERROR] 任务失败'],
  },
];

let uploads: DataPlatform.UploadRecord[] = [
  {
    id: 'up-01',
    filename: 'corpus_zh.jsonl',
    size: 18_874_368,
    format: 'jsonl',
    status: 'done',
    uploadedAt: ago(30),
  },
  {
    id: 'up-02',
    filename: 'users_sample.csv',
    size: 524_288,
    format: 'csv',
    status: 'done',
    uploadedAt: ago(26),
  },
  {
    id: 'up-03',
    filename: 'events.tsv',
    size: 2_097_152,
    format: 'tsv',
    status: 'done',
    uploadedAt: ago(20),
  },
  {
    id: 'up-04',
    filename: 'config.json',
    size: 4096,
    format: 'json',
    status: 'done',
    uploadedAt: ago(14),
  },
  {
    id: 'up-05',
    filename: 'broken_dump.parquet',
    size: 0,
    format: 'parquet',
    status: 'error',
    uploadedAt: ago(8),
  },
  {
    id: 'up-06',
    filename: 'notes.txt',
    size: 12_288,
    format: 'txt',
    status: 'done',
    uploadedAt: ago(2),
  },
];

// ---------------------------------------------------------------------------
// 通用分页
// ---------------------------------------------------------------------------

function paginate<T>(list: T[], current = 1, pageSize = 10) {
  const c = Number(current) || 1;
  const ps = Number(pageSize) || 10;
  const data = list.slice((c - 1) * ps, c * ps);
  return { data, total: list.length, success: true };
}

// ---------------------------------------------------------------------------
// 数据源 CRUD
// ---------------------------------------------------------------------------

/** 校验数据源 config 是否填齐必要字段 */
function configIsValid(
  type: DataPlatform.DataSourceType,
  config: Record<string, any> = {},
): boolean {
  const has = (k: string) => config[k] != null && `${config[k]}`.trim() !== '';
  switch (type) {
    case 's3':
      return has('endpoint') && has('bucket') && has('accessKey') && has('secretKey');
    case 'hdfs':
      return has('nameNode') && has('path');
    case 'database':
      return has('host') && has('port') && has('database') && has('username') && has('password');
    case 'api':
      return has('url');
    default:
      return false;
  }
}

// ---------------------------------------------------------------------------
// AI：schema 推断（轻量启发式）
// ---------------------------------------------------------------------------

function jsType(v: any): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  const t = typeof v;
  if (t === 'number') return Number.isInteger(v) ? 'integer' : 'float';
  if (t === 'object') return 'object';
  if (t === 'string') {
    if (/^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2}(:\d{2})?)?/.test(v)) return 'datetime';
    if (/^-?\d+$/.test(v)) return 'integer';
    if (/^-?\d*\.\d+$/.test(v)) return 'float';
    if (/^(true|false)$/i.test(v)) return 'boolean';
    return 'string';
  }
  return t;
}

function fieldsFromObjects(rows: Record<string, any>[]): DataPlatform.SchemaField[] {
  const names: string[] = [];
  for (const row of rows) {
    for (const k of Object.keys(row)) if (!names.includes(k)) names.push(k);
  }
  return names.map((name) => {
    let example = '';
    let nullable = false;
    let type = 'string';
    for (const row of rows) {
      const v = row[name];
      if (v == null || v === '') {
        nullable = true;
        continue;
      }
      if (example === '') {
        example = typeof v === 'object' ? JSON.stringify(v) : `${v}`;
        type = jsType(v);
      }
    }
    if (rows.some((r) => !(name in r))) nullable = true;
    return { name, type, example, nullable };
  });
}

function inferSchemaFromSample(sampleRaw: string): DataPlatform.InferredSchema {
  const sample = (sampleRaw || '').trim();
  const rand = (min: number, max: number) =>
    Math.round((min + Math.random() * (max - min)) * 100) / 100;

  // 1) 纯 JSON（对象或数组）
  try {
    const parsed = JSON.parse(sample);
    const rows = Array.isArray(parsed) ? parsed : [parsed];
    const objRows = rows.filter((r) => r && typeof r === 'object' && !Array.isArray(r));
    if (objRows.length > 0) {
      return {
        format: 'application/json',
        confidence: rand(0.9, 0.98),
        fields: fieldsFromObjects(objRows),
        suggestion:
          '检测到标准 JSON 结构，建议以「文件上传 / 对象存储」方式接入，格式选择 json；如为数组建议逐元素拆分为记录。',
        recommendedConfig: { format: 'json', encoding: 'utf-8' },
      };
    }
  } catch {
    /* 非纯 JSON，继续尝试 JSONL */
  }

  // 2) JSONL（逐行 JSON 对象）
  const lines = sample.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length > 0) {
    const objRows: Record<string, any>[] = [];
    let okLines = 0;
    for (const line of lines) {
      try {
        const o = JSON.parse(line.trim());
        if (o && typeof o === 'object' && !Array.isArray(o)) {
          objRows.push(o);
          okLines += 1;
        }
      } catch {
        /* 行不是 JSON */
      }
    }
    if (okLines >= Math.max(1, Math.ceil(lines.length * 0.6)) && objRows.length > 0) {
      return {
        format: 'application/x-ndjson',
        confidence: rand(0.88, 0.97),
        fields: fieldsFromObjects(objRows),
        suggestion:
          '检测到 JSON Lines（每行一个 JSON 对象），建议以「文件上传」方式接入，格式选择 jsonl，适合大规模语料流式处理。',
        recommendedConfig: { format: 'jsonl', encoding: 'utf-8' },
      };
    }
  }

  // 3) CSV / TSV（按分隔符探测表头）
  if (lines.length >= 1) {
    const header = lines[0];
    const tabCount = (header.match(/\t/g) || []).length;
    const commaCount = (header.match(/,/g) || []).length;
    const useTab = tabCount > 0 && tabCount >= commaCount;
    const delimiter = useTab ? '\t' : ',';
    const cols = header.split(delimiter).map((c) => c.trim());
    if (cols.length >= 2) {
      const dataRows = lines.slice(1).map((l) => l.split(delimiter).map((c) => c.trim()));
      const fields: DataPlatform.SchemaField[] = cols.map((name, idx) => {
        let example = '';
        let nullable = false;
        let type = 'string';
        for (const r of dataRows) {
          const v = r[idx];
          if (v == null || v === '') {
            nullable = true;
            continue;
          }
          if (example === '') {
            example = v;
            type = jsType(v);
          }
        }
        if (dataRows.length === 0) example = '';
        return { name: name || `col_${idx + 1}`, type, example, nullable };
      });
      const fmt = useTab ? 'text/tab-separated-values' : 'text/csv';
      return {
        format: fmt,
        confidence: rand(0.85, 0.94),
        fields,
        suggestion: useTab
          ? '检测到制表符分隔（TSV）表格，建议以「文件上传」方式接入，格式选择 tsv，首行作为表头。'
          : '检测到逗号分隔（CSV）表格，建议以「文件上传」方式接入，格式选择 csv，首行作为表头。',
        recommendedConfig: {
          format: useTab ? 'tsv' : 'csv',
          delimiter,
          hasHeader: true,
          encoding: 'utf-8',
        },
      };
    }
  }

  // 4) 兜底：纯文本单字段
  return {
    format: 'text/plain',
    confidence: 0.85,
    fields: [
      {
        name: 'text',
        type: 'string',
        example: sample.slice(0, 60),
        nullable: false,
      },
    ],
    suggestion:
      '未识别出结构化格式，按纯文本处理，建议以「文件上传」方式接入，格式选择 text，每行作为一条文本记录。',
    recommendedConfig: { format: 'text', encoding: 'utf-8' },
  };
}

// ---------------------------------------------------------------------------
// AI：采集任务生成（中文关键词启发式）
// ---------------------------------------------------------------------------

function generateTaskFromPrompt(promptRaw: string): DataPlatform.GeneratedTaskConfig {
  const prompt = (promptRaw || '').trim();
  const p = prompt.toLowerCase();
  const reasons: string[] = [];

  // 调度解析
  let schedule: DataPlatform.IngestSchedule = { mode: 'once' };
  const hourMatch = prompt.match(/(凌晨|早上|上午|下午|晚上)?\s*(\d{1,2})\s*[点时:]/);
  if (/每小时|每个小时|hourly/.test(prompt)) {
    schedule = { mode: 'cron', cron: '0 * * * *' };
    reasons.push('包含「每小时」→ 生成每小时整点 cron `0 * * * *`');
  } else if (/每周|每星期|weekly/.test(prompt)) {
    const cronH = hourMatch ? Number(hourMatch[2]) : 1;
    schedule = { mode: 'cron', cron: `0 ${cronH} * * 1` };
    reasons.push(`包含「每周」→ 生成每周一 ${cronH} 点 cron \`0 ${cronH} * * 1\``);
  } else if (/每天|每日|凌晨|daily/.test(prompt)) {
    const cronH = hourMatch ? Number(hourMatch[2]) : /凌晨/.test(prompt) ? 2 : 0;
    schedule = { mode: 'cron', cron: `0 ${cronH} * * *` };
    reasons.push(`包含「每天/凌晨」→ 生成每天 ${cronH} 点 cron \`0 ${cronH} * * *\``);
  } else {
    reasons.push('未识别到周期关键词 → 调度方式为「单次执行」');
  }

  // 数据源类型解析
  let datasourceType: DataPlatform.DataSourceType = 'api';
  if (/s3|oss|对象存储|对象存储桶|bucket/.test(p) || /对象存储/.test(prompt)) {
    datasourceType = 's3';
    reasons.push('包含「S3/OSS/对象存储」→ 数据源类型 s3');
  } else if (/hdfs/.test(p)) {
    datasourceType = 'hdfs';
    reasons.push('包含「HDFS」→ 数据源类型 hdfs');
  } else if (/数据库|database|达梦|dameng|hive|doris|kingbase|金仓|gaussdb|goldendb|hologres|sequoiadb|表|sql/.test(prompt + p)) {
    datasourceType = 'database';
    reasons.push('包含「数据库/达梦/hive 等」→ 数据源类型 database');
  } else if (/api|接口|http|rest/.test(p)) {
    datasourceType = 'api';
    reasons.push('包含「API/接口」→ 数据源类型 api');
  } else {
    reasons.push('未识别到数据源关键词 → 默认数据源类型 api');
  }

  // 名称摘要：取前 20 字
  const name = (prompt.replace(/\s+/g, '').slice(0, 20) || '新建采集任务') + '采集任务';

  const config: Record<string, any> = { datasourceType };
  if (datasourceType === 'database') {
    const kindMap: Record<string, DataPlatform.DbKind> = {
      达梦: 'dameng',
      dameng: 'dameng',
      hive: 'hive',
      doris: 'doris',
      金仓: 'kingbase',
      kingbase: 'kingbase',
      gaussdb: 'gaussdb',
      goldendb: 'goldendb',
      hologres: 'hologres',
      sequoiadb: 'sequoiadb',
    };
    for (const [kw, kind] of Object.entries(kindMap)) {
      if (prompt.includes(kw) || p.includes(kw)) {
        config.dbKind = kind;
        reasons.push(`识别到数据库品牌「${kw}」→ dbKind ${kind}`);
        break;
      }
    }
  }

  return {
    name,
    datasourceType,
    schedule,
    config,
    explanation: `根据描述「${prompt}」的关键词解析：${reasons.join('；')}。`,
  };
}

// ---------------------------------------------------------------------------
// AI：固定问答
// ---------------------------------------------------------------------------

const qaPairs: { keywords: string[]; answer: string }[] = [
  {
    keywords: ['哪些数据源', '支持的数据源', '数据源类型', '支持什么数据源'],
    answer:
      '平台支持 4 类数据源：对象存储（S3/OSS）、HDFS、数据库、HTTP API。其中数据库支持达梦、GoldenDB、人大金仓、GaussDB、Hologres、SequoiaDB、Hive、Doris 共 8 种国产/主流数据库。',
  },
  {
    keywords: ['哪些格式', '支持的格式', '文件格式', '支持什么格式'],
    answer:
      '上传文件支持 JSON、JSONL（JSON Lines）、CSV、TSV、纯文本（text）等格式。上传后可用「AI 推断 Schema」自动识别字段名、类型与接入建议。',
  },
  {
    keywords: ['如何建采集任务', '怎么建采集任务', '创建采集任务', '新建采集任务', '采集任务怎么'],
    answer:
      '先在「数据源管理」中创建并测试连接一个数据源，再到「采集任务」点击新建，选择该数据源、配置调度方式（单次或 cron 周期），保存后任务即进入待调度状态。也可用「AI 生成任务」直接用自然语言描述生成配置。',
  },
  {
    keywords: ['如何建数据源', '怎么建数据源', '创建数据源', '新建数据源', '添加数据源'],
    answer:
      '进入「数据源管理」，点击新建，选择类型（S3/HDFS/数据库/API），填写连接配置后点「测试连接」，连通后保存即可。数据库类型需额外选择具体品牌（如达梦、Hive）。',
  },
  {
    keywords: ['cron', '定时', '调度', '周期', '每天', '怎么定时'],
    answer:
      '采集任务调度支持「单次」和「cron 周期」两种。cron 表达式为标准 5 段格式（分 时 日 月 周），例如每天凌晨 2 点为 `0 2 * * *`。用「AI 生成任务」时输入「每天凌晨」等描述会自动生成对应 cron。',
  },
  {
    keywords: ['测试连接', '连接失败', '连不上', '连接不上', '为什么失败'],
    answer:
      '测试连接会校验关键配置是否填齐：S3 需 endpoint/bucket/accessKey/secretKey，HDFS 需 nameNode/path，数据库需 host/port/database/username/password，API 需 url。任一必填项缺失都会返回连接失败，请补全后重试。',
  },
];

function answerQuestion(questionRaw: string): string {
  const q = (questionRaw || '').toLowerCase();
  for (const pair of qaPairs) {
    if (pair.keywords.some((k) => q.includes(k.toLowerCase()))) {
      return pair.answer;
    }
  }
  return '抱歉，暂时无法直接回答该问题。你可以咨询：支持哪些数据源 / 支持哪些文件格式 / 如何新建数据源 / 如何创建采集任务 / cron 定时怎么配 / 测试连接为什么失败。';
}

// ---------------------------------------------------------------------------
// 路由处理
// ---------------------------------------------------------------------------

export default {
  // ---- 数据源 ----
  'GET /api/v1/datasources': (req: Request, res: Response) => {
    const { current = 1, pageSize = 10, name, type } = req.query as Record<string, any>;
    let list = [...dataSources];
    if (name) list = list.filter((d) => d.name.includes(String(name)));
    if (type) list = list.filter((d) => d.type === type);
    res.json(paginate(list, current, pageSize));
  },

  'POST /api/v1/datasources': (req: Request, res: Response) => {
    const body = (req.body || {}) as DataPlatform.DataSourceCreate;
    const valid = configIsValid(body.type, body.config);
    const item: DataPlatform.DataSource = {
      id: randId('ds'),
      name: body.name,
      type: body.type,
      dbKind: body.dbKind,
      status: valid ? 'connected' : 'pending',
      config: body.config || {},
      description: body.description,
      creator: '孙朋',
      createdAt: now(),
      updatedAt: now(),
    };
    dataSources.unshift(item);
    res.json({ data: item, success: true });
  },

  'PUT /api/v1/datasources/:id': (req: Request, res: Response) => {
    const { id } = req.params;
    const body = (req.body || {}) as DataPlatform.DataSourceUpdate;
    let updated: DataPlatform.DataSource | undefined;
    dataSources = dataSources.map((d) => {
      if (d.id !== id) return d;
      updated = {
        ...d,
        ...body,
        config: body.config ?? d.config,
        updatedAt: now(),
      };
      return updated;
    });
    if (!updated) {
      res.status(404).json({ success: false, errorMessage: '数据源不存在' });
      return;
    }
    res.json({ data: updated, success: true });
  },

  'DELETE /api/v1/datasources/:id': (req: Request, res: Response) => {
    const { id } = req.params;
    const before = dataSources.length;
    dataSources = dataSources.filter((d) => d.id !== id);
    res.json({ success: dataSources.length < before });
  },

  'POST /api/v1/datasources/test': (req: Request, res: Response) => {
    const body = (req.body || {}) as DataPlatform.TestConnectionParams;
    const ok = configIsValid(body.type, body.config);
    const latencyMs = Math.floor(20 + Math.random() * 180);
    res.json({
      success: ok,
      latencyMs,
      message: ok
        ? `连接成功，往返延迟 ${latencyMs}ms`
        : '连接失败：必要的连接配置缺失，请检查并补全后重试',
    });
  },

  // ---- 采集任务 ----
  'GET /api/v1/ingest-tasks': (req: Request, res: Response) => {
    const { current = 1, pageSize = 10, name, status } = req.query as Record<string, any>;
    let list = [...ingestTasks];
    if (name) list = list.filter((t) => t.name.includes(String(name)));
    if (status) list = list.filter((t) => t.status === status);
    res.json(paginate(list, current, pageSize));
  },

  'POST /api/v1/ingest-tasks': (req: Request, res: Response) => {
    const body = (req.body || {}) as DataPlatform.IngestTaskCreate;
    const ds = dataSources.find((d) => d.id === body.datasourceId);
    const item: DataPlatform.IngestTask = {
      id: randId('task'),
      name: body.name,
      datasourceId: body.datasourceId,
      datasourceName: ds ? ds.name : '未知数据源',
      schedule: body.schedule || { mode: 'once' },
      status: 'pending',
      progress: 0,
      createdAt: now(),
      logs: ['[INFO] 任务已创建，等待调度'],
    };
    ingestTasks.unshift(item);
    res.json({ data: item, success: true });
  },

  // 每次 GET 推进 running 任务进度 +20，到 100 转 success
  'GET /api/v1/ingest-tasks/:id': (req: Request, res: Response) => {
    const { id } = req.params;
    const task = ingestTasks.find((t) => t.id === id);
    if (!task) {
      res.status(404).json({ success: false, errorMessage: '任务不存在' });
      return;
    }
    if (task.status === 'running') {
      task.progress = Math.min(100, task.progress + 20);
      task.lastRunAt = now();
      task.logs = [...(task.logs || []), `[INFO] 进度推进至 ${task.progress}%`];
      if (task.progress >= 100) {
        task.status = 'success';
        task.logs.push('[INFO] 任务完成');
      }
    }
    res.json({ data: task, success: true });
  },

  // 重跑：重置为 running / 0
  'POST /api/v1/ingest-tasks/:id/rerun': (req: Request, res: Response) => {
    const { id } = req.params;
    const task = ingestTasks.find((t) => t.id === id);
    if (!task) {
      res.status(404).json({ success: false, errorMessage: '任务不存在' });
      return;
    }
    task.status = 'running';
    task.progress = 0;
    task.lastRunAt = now();
    task.logs = ['[INFO] 任务重跑，进度重置为 0'];
    res.json({ data: task, success: true });
  },

  // 停止：转 failed
  'POST /api/v1/ingest-tasks/:id/stop': (req: Request, res: Response) => {
    const { id } = req.params;
    const task = ingestTasks.find((t) => t.id === id);
    if (!task) {
      res.status(404).json({ success: false, errorMessage: '任务不存在' });
      return;
    }
    task.status = 'failed';
    task.lastRunAt = now();
    task.logs = [...(task.logs || []), '[WARN] 任务被手动停止'];
    res.json({ data: task, success: true });
  },

  'DELETE /api/v1/ingest-tasks/:id': (req: Request, res: Response) => {
    const { id } = req.params;
    const before = ingestTasks.length;
    ingestTasks = ingestTasks.filter((t) => t.id !== id);
    res.json({ success: ingestTasks.length < before });
  },

  // ---- 上传 ----
  'GET /api/v1/uploads': (req: Request, res: Response) => {
    const { current = 1, pageSize = 10 } = req.query as Record<string, any>;
    res.json(paginate([...uploads], current, pageSize));
  },

  'POST /api/v1/upload': (req: Request, res: Response) => {
    // mock 环境无法真正解析 multipart，从 body/headers 尽力取文件信息
    const body = (req.body || {}) as Record<string, any>;
    const filename = body.filename || body.name || `upload_${Date.now()}.dat`;
    const dot = String(filename).lastIndexOf('.');
    const format = dot >= 0 ? String(filename).slice(dot + 1).toLowerCase() : 'dat';
    const size = Number(body.size) || Math.floor(1024 + Math.random() * 5_000_000);
    const record: DataPlatform.UploadRecord = {
      id: randId('up'),
      filename: String(filename),
      size,
      format,
      status: size > 0 ? 'done' : 'error',
      uploadedAt: now(),
    };
    uploads.unshift(record);
    res.json({ data: record, success: true });
  },

  // ---- AI ----
  'POST /api/v1/ai/infer-schema': (req: Request, res: Response) => {
    const { sample = '' } = (req.body || {}) as { sample?: string };
    res.json({ data: inferSchemaFromSample(sample), success: true });
  },

  'POST /api/v1/ai/generate-task': (req: Request, res: Response) => {
    const { prompt = '' } = (req.body || {}) as { prompt?: string };
    res.json({ data: generateTaskFromPrompt(prompt), success: true });
  },

  'POST /api/v1/ai/qa': (req: Request, res: Response) => {
    const { question = '' } = (req.body || {}) as { question?: string };
    res.json({ data: { answer: answerQuestion(question) }, success: true });
  },
};
