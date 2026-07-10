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

const activity = {
  status: 'ok' as const,
  days: 30 as const,
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

  it('loads 30 days by default and renders the dashboard data', async () => {
    renderPage();

    await waitFor(() => expect(getActivity).toHaveBeenCalledWith(30));
    expect(await screen.findByRole('heading', { name: '用户活动' })).toBeDefined();
    expect(screen.getAllByText('活跃学生').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('18')).toBeDefined();
    expect(screen.getByText('146')).toBeDefined();
    expect(screen.getByText('62')).toBeDefined();
    expect(screen.getByText('84')).toBeDefined();
    expect(screen.getByRole('img', { name: '每日活动趋势' })).toBeDefined();
    expect(screen.getByRole('table', { name: '每日活动趋势数据' })).toBeDefined();
    expect(screen.getByText('/experiments/calcite')).toBeDefined();
    expect(screen.getByText('进入实验')).toBeDefined();
    const mixPanel = screen.getByRole('heading', { name: '活动构成' }).closest('section');
    expect(mixPanel).not.toBeNull();
    expect(within(mixPanel!).getByText('页面访问')).toBeDefined();
    expect(screen.getByText('林晓光')).toBeDefined();
  });

  it('reloads when the selected range changes', async () => {
    renderPage();
    await waitFor(() => expect(getActivity).toHaveBeenCalledWith(30));

    fireEvent.click(screen.getByRole('button', { name: '近 7 天' }));

    await waitFor(() => expect(getActivity).toHaveBeenLastCalledWith(7));
    expect(screen.getByRole('button', { name: '近 7 天' }).getAttribute('aria-pressed')).toBe(
      'true'
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
      top_learners: [],
    });

    renderPage();

    expect(await screen.findByText('暂无活动数据')).toBeDefined();
  });

  it('shows a teacher-friendly disabled state', async () => {
    getActivity.mockResolvedValue({
      status: 'disabled',
      days: 30,
      generated_at: '2026-07-10T08:00:00.000Z',
      summary: null,
      daily: [],
      top_pages: [],
      activity_breakdown: [],
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
    expect(await screen.findByText('林晓光')).toBeDefined();
  });
});
