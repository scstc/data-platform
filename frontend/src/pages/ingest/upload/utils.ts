/** 本地上传页专用：允许上传的文件扩展名白名单（需求 1.2 + 需求 3，共 11 种） */
export const ALLOWED_EXTENSIONS = [
  'txt',
  'pdf',
  'ppt',
  'pptx',
  'doc',
  'docx',
  'xlsx',
  'xls',
  'csv',
  'tsv',
  'html',
  'jsonl',
] as const;

/** Upload accept 属性值（带点号，逗号分隔） */
export const ACCEPT = ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(',');

/** 单文件大小上限：200MB */
export const MAX_FILE_SIZE = 200 * 1024 * 1024;

/** 从文件名取小写扩展名（无扩展名返回空串） */
export const getExtension = (filename: string): string => {
  const dotIndex = filename.lastIndexOf('.');
  if (dotIndex < 0 || dotIndex === filename.length - 1) return '';
  return filename.slice(dotIndex + 1).toLowerCase();
};

/** 判断扩展名是否在白名单内 */
export const isAllowedExtension = (filename: string): boolean =>
  (ALLOWED_EXTENSIONS as readonly string[]).includes(getExtension(filename));

/** 把字节数格式化为人类友好的文件大小（B / KB / MB / GB） */
export const formatFileSize = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes < 0) return '-';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const fixed = value >= 100 || Number.isInteger(value) ? 0 : 1;
  return `${value.toFixed(fixed)} ${units[unitIndex]}`;
};
