// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 获取数据源列表 GET /api/v1/datasources */
export async function listDataSources(
  params?: DataPlatform.DataSourceListParams,
  options?: { [key: string]: any },
) {
  return request<DataPlatform.PageResult<DataPlatform.DataSource>>('/api/v1/datasources', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 新建数据源 POST /api/v1/datasources */
export async function createDataSource(
  body: DataPlatform.DataSourceCreate,
  options?: { [key: string]: any },
) {
  return request<{ data: DataPlatform.DataSource; success: boolean }>('/api/v1/datasources', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 更新数据源 PUT /api/v1/datasources/:id */
export async function updateDataSource(
  id: string,
  body: DataPlatform.DataSourceUpdate,
  options?: { [key: string]: any },
) {
  return request<{ data: DataPlatform.DataSource; success: boolean }>(
    `/api/v1/datasources/${id}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      data: body,
      ...(options || {}),
    },
  );
}

/** 删除数据源 DELETE /api/v1/datasources/:id */
export async function deleteDataSource(id: string, options?: { [key: string]: any }) {
  return request<{ success: boolean }>(`/api/v1/datasources/${id}`, {
    method: 'DELETE',
    ...(options || {}),
  });
}

/** 测试数据源连接 POST /api/v1/datasources/test */
export async function testDataSource(
  body: DataPlatform.TestConnectionParams,
  options?: { [key: string]: any },
) {
  return request<DataPlatform.TestConnectionResult>('/api/v1/datasources/test', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 列出数据源库内的表 GET /api/v1/datasources/{id}/tables（仅 PostgreSQL） */
export async function listDatasourceTables(
  id: string,
  options?: { [key: string]: any },
) {
  return request<{ data: string[]; success: boolean }>(
    `/api/v1/datasources/${id}/tables`,
    {
      method: 'GET',
      ...(options || {}),
    },
  );
}

/** 获取采集任务列表 GET /api/v1/ingest-tasks */
export async function listIngestTasks(
  params?: DataPlatform.IngestTaskListParams,
  options?: { [key: string]: any },
) {
  return request<DataPlatform.PageResult<DataPlatform.IngestTask>>('/api/v1/ingest-tasks', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 新建采集任务 POST /api/v1/ingest-tasks */
export async function createIngestTask(
  body: DataPlatform.IngestTaskCreate,
  options?: { [key: string]: any },
) {
  return request<{ data: DataPlatform.IngestTask; success: boolean }>('/api/v1/ingest-tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取单个采集任务（每次 GET 会推进 running 任务进度）GET /api/v1/ingest-tasks/:id */
export async function getIngestTask(id: string, options?: { [key: string]: any }) {
  return request<{ data: DataPlatform.IngestTask; success: boolean }>(
    `/api/v1/ingest-tasks/${id}`,
    {
      method: 'GET',
      ...(options || {}),
    },
  );
}

/** 重跑采集任务 POST /api/v1/ingest-tasks/:id/rerun */
export async function rerunIngestTask(id: string, options?: { [key: string]: any }) {
  return request<{ data: DataPlatform.IngestTask; success: boolean }>(
    `/api/v1/ingest-tasks/${id}/rerun`,
    {
      method: 'POST',
      ...(options || {}),
    },
  );
}

/** 停止采集任务 POST /api/v1/ingest-tasks/:id/stop */
export async function stopIngestTask(id: string, options?: { [key: string]: any }) {
  return request<{ data: DataPlatform.IngestTask; success: boolean }>(
    `/api/v1/ingest-tasks/${id}/stop`,
    {
      method: 'POST',
      ...(options || {}),
    },
  );
}

/** 删除采集任务 DELETE /api/v1/ingest-tasks/:id */
export async function deleteIngestTask(id: string, options?: { [key: string]: any }) {
  return request<{ success: boolean }>(`/api/v1/ingest-tasks/${id}`, {
    method: 'DELETE',
    ...(options || {}),
  });
}

/** 获取上传记录列表 GET /api/v1/uploads */
export async function listUploads(
  params?: DataPlatform.UploadListParams,
  options?: { [key: string]: any },
) {
  return request<DataPlatform.PageResult<DataPlatform.UploadRecord>>('/api/v1/uploads', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 上传文件 POST /api/v1/upload */
export async function uploadFile(body: FormData, options?: { [key: string]: any }) {
  return request<DataPlatform.UploadResult>('/api/v1/upload', {
    method: 'POST',
    data: body,
    requestType: 'form',
    ...(options || {}),
  });
}

/** AI 推断 schema POST /api/v1/ai/infer-schema */
export async function inferSchema(
  body: { sample: string },
  options?: { [key: string]: any },
) {
  return request<DataPlatform.InferSchemaResult>('/api/v1/ai/infer-schema', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** AI 生成采集任务 POST /api/v1/ai/generate-task */
export async function generateTask(
  body: { prompt: string },
  options?: { [key: string]: any },
) {
  return request<DataPlatform.GenerateTaskResult>('/api/v1/ai/generate-task', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** AI 问答 POST /api/v1/ai/qa */
export async function aiQa(body: { question: string }, options?: { [key: string]: any }) {
  return request<DataPlatform.QaResult>('/api/v1/ai/qa', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
