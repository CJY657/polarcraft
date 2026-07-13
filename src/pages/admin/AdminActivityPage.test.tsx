// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getActivity } = vi.hoisted(() => ({
  getActivity: vi.fn(),
}));

vi.mock('@/lib/admin-user.service', () => ({
  adminUserApi: { getActivity },
}));

vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

vi.mock('@/components/shared/PersistentHeader', () => ({
  PersistentHeader: ({ moduleName }: { moduleName?: string }) => <div>{moduleName}</div>,
}));

import AdminActivityPage from './AdminActivityPage';

function toDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function presetRange(days: number): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (days - 1));
  return { start: toDateInput(start), end: toDateInput(end) };
}

const activity = {
  status: 'ok' as const,
  range: { ...presetRange(30), days: 30 },
  generated_at: '2026-07-10T08:00:00.000Z',
  summary: {
    active_learners: 18,
    meaningful_events: 146,
    pageviews: 62,
    learning_actions: 84,
  },
  daily: [
    { date: '2026-07-09', active_learners: 7, pageviews: 24, learning_actions: 31 },
    { date: '2026-07-10', active_learners: 9, pageviews: 38, learning_actions: 53 },
  ],
  top_pages: [
    { path: '/experiments/calcite', pageviews: 21, unique_learners: 8 },
  ],
  activity_breakdown: [
    { event: 'experiment_opened', count: 42, unique_learners: 11 },
    { event: '$pageview', count: 21, unique_learners: 8 },
  ],
  module_breakdown: [
    {
      module: 'module1',
      label: '实验内容',
      pageviews: 21,
      unique_learners: 8,
      learners: [{ user_id: 'learner-1', username: '林晓光', pageviews: 12 }],
    },
    {
      module: 'module6',
      label: '虚拟课题',
      pageviews: 6,
      unique_learners: 2,
      learners: [{ user_id: 'learner-2', username: '王小雨', pageviews: 6 }],
    },
  ],
  top_learners: [
    {
      user_id: 'learner-1',
      username: '林晓光',
      events: 32,
      pageviews: 12,
      learning_actions: 20,
      last_activity: '2026-07-10T07:30:00.000Z',
    },
  ],
};

function renderPage() {
  return render(
    <MemoryRouter>
      <AdminActivityPage />
    </MemoryRouter>
  );
}

describe('AdminActivityPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getActivity.mockResolvedValue(activity);
  });

  it('loads the last 30 days by default and renders the dashboard data', async () => {
    renderPage();

    await waitFor(() =>
      expect(getActivity).toHaveBeenCalledWith({ ...presetRange(30), limit: 10 })
    );
    expect(await screen.findByRole('heading', { name: '用户活动' })).toBeDefined();
    expect(screen.getAllByText('活跃学生').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('18')).toBeDefined();
    expect(screen.getByText('146')).toBeDefined();
    expect(screen.getByText('62')).toBeDefined();
    expect(screen.getByText('84')).toBeDefined();
    expect(screen.getByRole('img', { name: '每日活动趋势' })).toBeDefined();
    expect(screen.getByRole('table', { name: '每日活动趋势数据' })).toBeDefined();
    expect(screen.getByText('实验内容 · 课程详情')).toBeDefined();
    expect(screen.getByText(/\/experiments\/calcite/)).toBeDefined();
    expect(screen.getByText('进入实验')).toBeDefined();
    const mixPanel = screen.getByRole('heading', { name: '活动构成' }).closest('section');
    expect(mixPanel).not.toBeNull();
    expect(within(mixPanel!).getByText('页面访问')).toBeDefined();
    expect(screen.getAllByText('林晓光').length).toBeGreaterThanOrEqual(1);
  });

  it('renders the module breakdown with per-module learners', async () => {
    renderPage();

    const modulePanel = (
      await screen.findByRole('heading', { name: '模块热度' })
    ).closest('section');
    expect(modulePanel).not.toBeNull();
    expect(within(modulePanel!).getByText('实验内容')).toBeDefined();
    expect(within(modulePanel!).getByText('虚拟课题')).toBeDefined();
    expect(within(modulePanel!).getByText('21 次 / 8 人')).toBeDefined();
    expect(within(modulePanel!).getByText('王小雨')).toBeDefined();
  });

  it('reloads when a preset range is selected', async () => {
    renderPage();
    await waitFor(() =>
      expect(getActivity).toHaveBeenCalledWith({ ...presetRange(30), limit: 10 })
    );

    fireEvent.click(screen.getByRole('button', { name: '近 7 天' }));

    await waitFor(() =>
      expect(getActivity).toHaveBeenLastCalledWith({ ...presetRange(7), limit: 10 })
    );
    expect(screen.getByRole('button', { name: '近 7 天' }).getAttribute('aria-pressed')).toBe(
      'true'
    );
  });

  it('reloads when a custom date range is entered', async () => {
    renderPage();
    await waitFor(() => expect(getActivity).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText('开始日期'), {
      target: { value: '2026-06-01' },
    });
    fireEvent.change(screen.getByLabelText('结束日期'), {
      target: { value: '2026-06-30' },
    });

    await waitFor(() =>
      expect(getActivity).toHaveBeenLastCalledWith({
        start: '2026-06-01',
        end: '2026-06-30',
        limit: 10,
      })
    );
  });

  it('flags an inverted custom range instead of querying', async () => {
    renderPage();
    await waitFor(() => expect(getActivity).toHaveBeenCalled());
    getActivity.mockClear();

    fireEvent.change(screen.getByLabelText('开始日期'), {
      target: { value: '2026-06-30' },
    });
    fireEvent.change(screen.getByLabelText('结束日期'), {
      target: { value: '2026-06-01' },
    });

    expect(await screen.findByRole('alert')).toBeDefined();
    expect(getActivity).not.toHaveBeenCalledWith(
      expect.objectContaining({ start: '2026-06-30', end: '2026-06-01' })
    );
  });

  it('reloads when the learner list size changes', async () => {
    renderPage();
    await waitFor(() => expect(getActivity).toHaveBeenCalled());

    fireEvent.change(await screen.findByLabelText(/显示人数/), {
      target: { value: 'all' },
    });

    await waitFor(() =>
      expect(getActivity).toHaveBeenLastCalledWith(
        expect.objectContaining({ limit: 'all' })
      )
    );
  });

  it('shows a dashboard-shaped loading skeleton', () => {
    getActivity.mockReturnValue(new Promise(() => undefined));

    renderPage();

    expect(screen.getByLabelText('正在加载用户活动')).toBeDefined();
  });

  it('shows an empty state when the selected range has no activity', async () => {
    getActivity.mockResolvedValue({
      ...activity,
      summary: {
        active_learners: 0,
        meaningful_events: 0,
        pageviews: 0,
        learning_actions: 0,
      },
      daily: [
        { date: '2026-07-09', active_learners: 0, pageviews: 0, learning_actions: 0 },
        { date: '2026-07-10', active_learners: 0, pageviews: 0, learning_actions: 0 },
      ],
      top_pages: [],
      activity_breakdown: [],
      module_breakdown: [],
      top_learners: [],
    });

    renderPage();

    expect(await screen.findByText('暂无活动数据')).toBeDefined();
  });

  it('shows a teacher-friendly disabled state', async () => {
    getActivity.mockResolvedValue({
      status: 'disabled',
      range: { ...presetRange(30), days: 30 },
      generated_at: '2026-07-10T08:00:00.000Z',
      summary: null,
      daily: [],
      top_pages: [],
      activity_breakdown: [],
      module_breakdown: [],
      top_learners: [],
    });

    renderPage();

    expect(await screen.findByText('行为统计暂未启用')).toBeDefined();
    expect(screen.queryByText(/PostHog/i)).toBeNull();
  });

  it('renders a missing last activity without inventing a date', async () => {
    getActivity.mockResolvedValue({
      ...activity,
      top_learners: [{ ...activity.top_learners[0], last_activity: null }],
    });

    renderPage();

    expect(await screen.findByText('暂无记录')).toBeDefined();
  });

  it('keeps a single-point trend finite', async () => {
    getActivity.mockResolvedValue({
      ...activity,
      daily: [activity.daily[0]],
    });

    renderPage();

    const chart = await screen.findByRole('img', { name: '每日活动趋势' });
    expect(chart.outerHTML).not.toContain('NaN');
  });

  it('retries after an upstream error', async () => {
    getActivity
      .mockRejectedValueOnce(new Error('行为统计服务暂时不可用'))
      .mockResolvedValueOnce(activity);

    renderPage();

    expect(await screen.findByText('加载用户活动失败')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: '重试' }));

    await waitFor(() => expect(getActivity).toHaveBeenCalledTimes(2));
    expect((await screen.findAllByText('林晓光')).length).toBeGreaterThanOrEqual(1);
  });
});
