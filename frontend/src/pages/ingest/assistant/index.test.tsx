import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '@/services/data-platform';

// Mock ProComponents（PageContainer 渲染 extra + children；ProDescriptions 简化为标题）
vi.mock('@ant-design/pro-components', () => ({
  PageContainer: ({ children, extra }: any) => (
    <div data-testid="page-container">
      <div data-testid="page-extra">{extra}</div>
      {children}
    </div>
  ),
  ProDescriptions: ({ title }: any) => (
    <div data-testid="pro-descriptions">{title}</div>
  ),
}));

// Mock @ant-design/x：Sender 暴露一个输入框 + 发送按钮，便于触发 onSubmit
vi.mock('@ant-design/x', () => ({
  Bubble: ({ content, loading }: any) => (
    <div data-testid="bubble">{loading ? '__loading__' : content}</div>
  ),
  Sender: ({ value, onChange, onSubmit, placeholder }: any) => (
    <div>
      <input
        data-testid="sender-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
      />
      <button
        type="button"
        data-testid="sender-submit"
        onClick={() => onSubmit?.(value)}
      >
        发送
      </button>
    </div>
  ),
}));

vi.mock('@/services/data-platform', () => ({
  inferSchema: vi.fn(),
  generateTask: vi.fn(),
  aiQa: vi.fn(),
}));

import AssistantPage from './index';

describe('AssistantPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.inferSchema).mockResolvedValue({
      success: true,
      data: {
        format: 'application/json',
        confidence: 0.95,
        fields: [
          { name: 'id', type: 'integer', example: '1', nullable: false },
        ],
        suggestion: '检测到标准 JSON 结构。',
        recommendedConfig: { format: 'json', encoding: 'utf-8' },
      },
    });
    vi.mocked(api.aiQa).mockResolvedValue({
      success: true,
      data: { answer: '平台支持 4 类数据源。' },
    });
  });

  it('should render without crashing', () => {
    const { container } = render(<AssistantPage />);
    expect(container).toBeTruthy();
  });

  it('should render mode segmented options', () => {
    render(<AssistantPage />);
    // 「样本识别」同时出现在分段控制器与空态标题中，用 getAllByText 断言存在
    expect(screen.getAllByText('样本识别').length).toBeGreaterThan(0);
    expect(screen.getByText('生成任务')).toBeInTheDocument();
    expect(screen.getByText('接入答疑')).toBeInTheDocument();
  });

  it('should call inferSchema on submit in schema mode and show result panel', async () => {
    render(<AssistantPage />);

    fireEvent.change(screen.getByTestId('sender-input'), {
      target: { value: '{"id":1}' },
    });
    fireEvent.click(screen.getByTestId('sender-submit'));

    await waitFor(() => {
      expect(api.inferSchema).toHaveBeenCalledWith({ sample: '{"id":1}' });
    });
    // 右侧面板出现识别格式统计
    await waitFor(() => {
      expect(screen.getByText('识别格式')).toBeInTheDocument();
    });
  });

  it('should not call service on empty submit', () => {
    render(<AssistantPage />);
    fireEvent.click(screen.getByTestId('sender-submit'));
    expect(api.inferSchema).not.toHaveBeenCalled();
  });
});
