// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getActivity } = vi.hoisted(() => ({
  getActivity: vi.fn(),
}));

vi.mock('@/lib/stats.service', () => ({
  publicStatsApi: { getActivity },
}));

vi.mock('@/components/shared/PersistentHeader', () => ({
  PersistentHeader: ({ moduleName }: { moduleName?: string }) => <div>{moduleName}</div>,
}));

import PulsePage from './PulsePage';

const activity = {
  status: 'ok' as const,
  range: { start: '2026-07-26', end: '2026-08-01', days: 7 },
  generated_at: '2026-08-01T02:00:00.000Z',
  summary: { active_learners: 18, pageviews: 240, learning_actions: 36 },
  daily: [
    { date: '2026-07-31', active_learners: 7, pageviews: 60, learning_actions: 9 },
    { date: '2026-08-01', active_learners: 11, pageviews: 80, learning_actions: 12 },
  ],
  top_pages: [
    { path: '/experiments/calcite', pageviews: 42 },
    { path: '/demos', pageviews: 21 },
  ],
  top_learners: [
    { code: '3FA2C1', events: 96, pageviews: 40, learning_actions: 12 },
    { code: 'B71D04', events: 71, pageviews: 33, learning_actions: 8 },
    { code: 'C0FFEE', events: 55, pageviews: 25, learning_actions: 6 },
  ],
  viewer: null as { code: string; rank: number; events: number } | null,
};

function lastDays(days: number): { start: string; end: string } {
  const toInput = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate()
    ).padStart(2, '0')}`;
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (days - 1));
  return { start: toInput(start), end: toInput(end) };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <PulsePage />
    </MemoryRouter>
  );
}

describe('PulsePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getActivity.mockResolvedValue(activity);
  });

  it('loads the last 7 days by default and renders anonymous learner codes', async () => {
    renderPage();

    await waitFor(() => expect(getActivity).toHaveBeenCalledWith(lastDays(7)));
    expect(await screen.findByRole('heading', { name: '平台学习热度' })).toBeDefined();
    expect(screen.getByText('18')).toBeDefined();
    expect(screen.getByText('240')).toBeDefined();
    expect(screen.getByText('36')).toBeDefined();
    expect(screen.getByText(/用户 #3FA2C1/)).toBeDefined();
    expect(screen.getByText(/用户 #B71D04/)).toBeDefined();
    expect(screen.getByText('实验内容 · 课程详情')).toBeDefined();
    expect(screen.getByText('理论模拟 · 模拟列表')).toBeDefined();
  });

  it('never renders identifying fields even if the payload carries them', async () => {
    getActivity.mockResolvedValue({
      ...activity,
      top_learners: [
        {
          ...activity.top_learners[0],
          user_id: 'learner-1',
          username: 'learner-account',
          display_name: '林晓光',
        },
      ],
    });

    renderPage();

    await screen.findByText(/用户 #3FA2C1/);
    expect(screen.queryByText('林晓光')).toBeNull();
    expect(screen.queryByText('learner-account')).toBeNull();
    expect(screen.queryByText(/learner-1/)).toBeNull();
  });

  it('highlights the signed-in student inside the leaderboard', async () => {
    getActivity.mockResolvedValue({
      ...activity,
      viewer: { code: 'B71D04', rank: 2, events: 71 },
    });

    renderPage();

    const row = (await screen.findByText(/用户 #B71D04/)).closest('li');
    expect(row).not.toBeNull();
    expect(within(row!).getByText('你')).toBeDefined();
    expect(screen.queryByText(/你的排名/)).toBeNull();
  });

  it('shows a separate rank card when the student is outside the top list', async () => {
    getActivity.mockResolvedValue({
      ...activity,
      viewer: { code: 'AA11BB', rank: 14, events: 12 },
    });

    renderPage();

    expect(await screen.findByText('你的排名：第 14 名')).toBeDefined();
    expect(screen.queryByText('你')).toBeNull();
  });

  it('reloads with a custom range picked from the date inputs', async () => {
    renderPage();
    await waitFor(() => expect(getActivity).toHaveBeenCalledWith(lastDays(7)));

    fireEvent.change(screen.getByLabelText('开始日期'), {
      target: { value: lastDays(14).start },
    });

    await waitFor(() =>
      expect(getActivity).toHaveBeenLastCalledWith({
        start: lastDays(14).start,
        end: lastDays(7).end,
      })
    );
  });

  it('blocks an inverted range client-side instead of querying', async () => {
    renderPage();
    await waitFor(() => expect(getActivity).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getByLabelText('开始日期'), {
      target: { value: '2999-01-01' },
    });

    expect(await screen.findByRole('alert')).toBeDefined();
    expect(getActivity).toHaveBeenCalledTimes(1);
  });

  it('blocks a range wider than 90 days client-side', async () => {
    renderPage();
    await waitFor(() => expect(getActivity).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getByLabelText('开始日期'), {
      target: { value: lastDays(120).start },
    });

    expect(await screen.findByText('时间跨度不能超过 90 天')).toBeDefined();
    expect(getActivity).toHaveBeenCalledTimes(1);
  });

  it('shows a loading skeleton before the first payload arrives', () => {
    getActivity.mockReturnValue(new Promise(() => undefined));

    renderPage();

    expect(screen.getByLabelText('正在加载学习热度')).toBeDefined();
  });

  it('shows a friendly disabled state without naming the vendor', async () => {
    getActivity.mockResolvedValue({
      ...activity,
      status: 'disabled',
      summary: null,
      daily: [],
      top_pages: [],
      top_learners: [],
    });

    renderPage();

    expect(await screen.findByText('学习热度暂未启用')).toBeDefined();
    expect(screen.queryByText(/PostHog/i)).toBeNull();
  });

  it('shows an empty state when nobody was active', async () => {
    getActivity.mockResolvedValue({
      ...activity,
      summary: { active_learners: 0, pageviews: 0, learning_actions: 0 },
      daily: [],
      top_pages: [],
      top_learners: [],
    });

    renderPage();

    expect(await screen.findByText('这段时间还很安静')).toBeDefined();
  });

  it('retries after a failed load', async () => {
    getActivity
      .mockRejectedValueOnce(new Error('学习热度暂时无法加载'))
      .mockResolvedValueOnce(activity);

    renderPage();

    expect(await screen.findByText('加载学习热度失败')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: '重试' }));

    await waitFor(() => expect(getActivity).toHaveBeenCalledTimes(2));
    expect(await screen.findByText(/用户 #3FA2C1/)).toBeDefined();
  });
});
