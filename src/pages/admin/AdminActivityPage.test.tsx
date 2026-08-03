// @vitest-environment jsdom

import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getActivity, getActivityDetail } = vi.hoisted(() => ({
  getActivity: vi.fn(),
  getActivityDetail: vi.fn(),
}));

vi.mock('@/lib/admin-user.service', () => ({
  adminUserApi: { getActivity, getActivityDetail },
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
  segment: 'student' as const,
  range: { ...presetRange(7), days: 30 },
  generated_at: '2026-07-10T08:00:00.000Z',
  summary: {
    active_users: 18,
    meaningful_events: 146,
    pageviews: 62,
    learning_actions: 84,
  },
  previous_summary: {
    range: { start: '2026-05-11', end: '2026-06-09', days: 30 },
    active_users: 12,
    meaningful_events: 146,
    pageviews: 124,
    learning_actions: 0,
  },
  daily: [
    { date: '2026-07-09', active_users: 7, pageviews: 24, learning_actions: 31 },
    { date: '2026-07-10', active_users: 9, pageviews: 38, learning_actions: 53 },
  ],
  top_pages: [
    { path: '/experiments/calcite', pageviews: 21, unique_users: 8 },
  ],
  activity_breakdown: [
    { event: 'experiment_opened', count: 42, unique_users: 11 },
    { event: '$pageview', count: 21, unique_users: 8 },
  ],
  module_breakdown: [
    {
      module: 'module1',
      label: '实验内容',
      pageviews: 21,
      unique_users: 8,
      users: [{ user_id: 'learner-1', username: '林晓光', pageviews: 12 }],
    },
    {
      module: 'module6',
      label: '虚拟课题',
      pageviews: 6,
      unique_users: 2,
      users: [{ user_id: 'learner-2', username: '王小雨', pageviews: 6 }],
    },
  ],
  top_users: [
    {
      user_id: 'learner-1',
      username: 'learner-account',
      display_name: '林晓光',
      user_type: 'student' as const,
      events: 32,
      pageviews: 12,
      learning_actions: 20,
      last_activity: '2026-07-10T07:30:00.000Z',
    },
  ],
};

const learnerDetail = {
  status: 'ok' as const,
  user_type: 'student' as const,
  range: { ...presetRange(7), days: 30 },
  previous_range: { start: '2026-05-11', end: '2026-06-09', days: 30 },
  generated_at: '2026-07-10T08:00:00.000Z',
  last_activity: '2026-07-10T07:30:00.000Z',
  summary: { meaningful_events: 32, pageviews: 12, learning_actions: 20 },
  previous_summary: { meaningful_events: 16, pageviews: 10, learning_actions: 20 },
  daily: [
    { date: '2026-07-09', events: 12, pageviews: 5, learning_actions: 7 },
    { date: '2026-07-10', events: 20, pageviews: 7, learning_actions: 13 },
  ],
  top_pages: [{ path: '/experiments/calcite', pageviews: 9 }],
  module_breakdown: [{ module: 'module1', label: '实验内容', pageviews: 9 }],
  hourly: [{ weekday: 4, hour: 20, count: 6 }],
};

function renderPage(initialPath = '/admin/activity') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AdminActivityPage />
    </MemoryRouter>
  );
}

describe('AdminActivityPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getActivity.mockResolvedValue(activity);
    getActivityDetail.mockResolvedValue(learnerDetail);
  });

  it('loads the last 7 days by default and renders the dashboard data', async () => {
    renderPage();

    await waitFor(() =>
      expect(getActivity).toHaveBeenCalledWith({
        ...presetRange(7),
        userType: 'student',
        limit: 10,
      })
    );
    expect(await screen.findByRole('heading', { name: '用户活动' })).toBeDefined();
    expect(screen.getAllByText('活跃学生').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('18')).toBeDefined();
    expect(screen.getByText('146')).toBeDefined();
    expect(screen.getByText('62')).toBeDefined();
    expect(screen.getByText('84')).toBeDefined();
    expect(screen.getByText('所选起止日期均计入；至少有 1 次有效活动的已识别学生人数，按账号去重。')).toBeDefined();
    expect(screen.getByText('所选起止日期均计入；排除自动采集、离开、身份识别和属性设置后，学生的活动总次数。')).toBeDefined();
    expect(screen.getByText('所选起止日期均计入；已识别学生纳入统计的页面访问次数。')).toBeDefined();
    expect(screen.getByText('所选起止日期均计入；已识别学生进入实验，以及在虚拟课题组里建课题、提交申请、讨论、交证据、完成任务的合计次数。')).toBeDefined();
    expect(screen.getByText('每个日期分别显示当天的学生去重人数、页面访问次数和学习行为次数。')).toBeDefined();
    expect(screen.getByText('按页面访问次数展示前 10 个路径，每个路径的学生人数单独去重。')).toBeDefined();
    expect(screen.getByText('按现有页面路径前缀归类并汇总页面访问次数。')).toBeDefined();
    expect(screen.getByText('展示次数最多的前 10 类活动；占比按当前展示的次数计算。')).toBeDefined();
    expect(screen.getByText('按纳入统计的有效活动次数排序；显示人数只影响排行行数。点击任意学生查看完整活动分析。')).toBeDefined();
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

  it('renders the admin-resolved learner name instead of the account username', async () => {
    renderPage();

    const rankingPanel = (
      await screen.findByRole('heading', { name: '活跃学生排行' })
    ).closest('section');
    expect(rankingPanel).not.toBeNull();
    expect(within(rankingPanel!).getByText('林晓光')).toBeDefined();
    expect(within(rankingPanel!).queryByText('learner-account')).toBeNull();
  });

  it('keeps a legacy account visible and labels its missing identity', async () => {
    getActivity.mockResolvedValue({
      ...activity,
      top_users: [
        ...activity.top_users,
        {
          user_id: 'legacy-user',
          username: 'legacy-account',
          display_name: '旧账号',
          user_type: null,
          events: 8,
          pageviews: 5,
          learning_actions: 3,
          last_activity: '2026-07-09T07:30:00.000Z',
        },
      ],
    });
    renderPage();

    const rankingPanel = (
      await screen.findByRole('heading', { name: '活跃学生排行' })
    ).closest('section');
    expect(rankingPanel).not.toBeNull();
    expect(within(rankingPanel!).getByText('旧账号')).toBeDefined();
    expect(within(rankingPanel!).getByText('未分类')).toBeDefined();
  });

  it('defaults to students and makes one request when the activity segment changes', async () => {
    getActivity.mockImplementation(({ userType }: { userType: 'student' | 'teacher' | 'all' }) =>
      Promise.resolve({ ...activity, segment: userType })
    );
    renderPage();

    await waitFor(() => expect(getActivity).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('button', { name: '学生' }).getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: '教师' }));

    await waitFor(() => {
      expect(getActivity).toHaveBeenCalledTimes(2);
      expect(getActivity).toHaveBeenLastCalledWith({
        ...presetRange(7),
        userType: 'teacher',
        limit: 10,
      });
    });
    expect(screen.getByRole('button', { name: '教师' }).getAttribute('aria-pressed')).toBe('true');
    expect(await screen.findByRole('heading', { name: '活跃教师排行' })).toBeDefined();
  });

  it('closes the activity drawer when the segment changes', async () => {
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: '查看 林晓光 的活动详情' }));
    const drawer = await screen.findByRole('dialog', { name: '林晓光 的活动详情' });
    expect(within(drawer).getByText('学生')).toBeDefined();

    getActivity.mockClear();
    getActivity.mockResolvedValue({ ...activity, segment: 'teacher' });
    fireEvent.click(screen.getByRole('button', { name: '教师' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(getActivity).toHaveBeenCalledTimes(1));
  });

  it('does not label an unresolved module user as unclassified in the all segment', async () => {
    getActivity.mockImplementation(({ userType }: { userType: 'student' | 'teacher' | 'all' }) =>
      Promise.resolve({ ...activity, segment: userType })
    );
    getActivityDetail.mockReturnValue(new Promise(() => undefined));
    renderPage();

    await waitFor(() => expect(getActivity).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: '全部' }));
    await waitFor(() => expect(getActivity).toHaveBeenCalledTimes(2));

    const modulePanel = (
      await screen.findByRole('heading', { name: '模块热度' })
    ).closest('section');
    expect(modulePanel).not.toBeNull();
    fireEvent.click(within(modulePanel!).getByText('虚拟课题'));
    fireEvent.click(within(modulePanel!).getByRole('button', { name: /王小雨/ }));

    const drawer = await screen.findByRole('dialog', { name: '王小雨 的活动详情' });
    expect(within(drawer).queryByText('未分类')).toBeNull();
    expect(within(drawer).getByLabelText('正在加载账号活动详情')).toBeDefined();
  });

  it('does not infer a student identity for an unresolved legacy module user', async () => {
    getActivityDetail.mockReturnValue(new Promise(() => undefined));
    renderPage();

    const modulePanel = (
      await screen.findByRole('heading', { name: '模块热度' })
    ).closest('section');
    expect(modulePanel).not.toBeNull();
    fireEvent.click(within(modulePanel!).getByText('虚拟课题'));
    fireEvent.click(within(modulePanel!).getByRole('button', { name: /王小雨/ }));

    const drawer = await screen.findByRole('dialog', { name: '王小雨 的活动详情' });
    expect(within(drawer).queryByText('学生')).toBeNull();
    expect(within(drawer).queryByText('未分类')).toBeNull();
    expect(within(drawer).getByLabelText('正在加载账号活动详情')).toBeDefined();
  });

  it('reloads when a preset range is selected', async () => {
    renderPage();
    await waitFor(() =>
      expect(getActivity).toHaveBeenCalledWith({
        ...presetRange(7),
        userType: 'student',
        limit: 10,
      })
    );

    fireEvent.click(screen.getByRole('button', { name: '近 30 天' }));

    await waitFor(() =>
      expect(getActivity).toHaveBeenLastCalledWith({
        ...presetRange(30),
        userType: 'student',
        limit: 10,
      })
    );
    expect(screen.getByRole('button', { name: '近 30 天' }).getAttribute('aria-pressed')).toBe(
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
        userType: 'student',
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

    expect(screen.getByLabelText('正在加载学生活动')).toBeDefined();
  });

  it('uses the selected segment in loading and error copy', async () => {
    let rejectTeacher: ((reason: Error) => void) | undefined;
    getActivity
      .mockResolvedValueOnce(activity)
      .mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            rejectTeacher = reject;
          })
      );
    renderPage();

    await screen.findByRole('heading', { name: '活跃学生排行' });
    fireEvent.click(screen.getByRole('button', { name: '教师' }));
    expect(screen.getByLabelText('正在加载教师活动')).toBeDefined();

    await act(async () => {
      rejectTeacher?.(new Error('行为统计服务暂时不可用'));
    });
    expect(await screen.findByText('加载教师活动失败')).toBeDefined();
  });

  it('shows an empty state when the selected range has no activity', async () => {
    getActivity.mockResolvedValue({
      ...activity,
      summary: {
        active_users: 0,
        meaningful_events: 0,
        pageviews: 0,
        learning_actions: 0,
      },
      daily: [
        { date: '2026-07-09', active_users: 0, pageviews: 0, learning_actions: 0 },
        { date: '2026-07-10', active_users: 0, pageviews: 0, learning_actions: 0 },
      ],
      top_pages: [],
      activity_breakdown: [],
      module_breakdown: [],
      top_users: [],
    });

    renderPage();

    expect(await screen.findByText('暂无活动数据')).toBeDefined();
    expect(screen.getByText(/还没有已登录学生的活动/)).toBeDefined();
  });

  it('shows a teacher-friendly disabled state', async () => {
    getActivity.mockResolvedValue({
      status: 'disabled',
      segment: 'student',
      range: { ...presetRange(7), days: 30 },
      generated_at: '2026-07-10T08:00:00.000Z',
      summary: null,
      daily: [],
      top_pages: [],
      activity_breakdown: [],
      module_breakdown: [],
      top_users: [],
    });

    renderPage();

    expect(await screen.findByText('行为统计暂未启用')).toBeDefined();
    expect(screen.queryByText(/PostHog/i)).toBeNull();
  });

  it('renders a missing last activity without inventing a date', async () => {
    getActivity.mockResolvedValue({
      ...activity,
      top_users: [{ ...activity.top_users[0], last_activity: null }],
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

  it('marks both trend axes with scale ticks and units', async () => {
    renderPage();

    const chart = await screen.findByRole('img', { name: '每日活动趋势' });
    // 数据峰值 53 → 纵轴取整到 0/20/40/60。
    for (const tick of ['0', '20', '40', '60']) {
      expect(within(chart).getByText(tick)).toBeDefined();
    }
    // 横轴标出日期刻度（两天全标）。
    expect(within(chart).getAllByText(/月|\//).length).toBeGreaterThanOrEqual(2);
    expect(
      screen.getByText(/纵轴：当日数量（活跃学生按人计，页面访问与学习行为按次计）· 横轴：日期/)
    ).toBeDefined();
  });

  it('labels the learner drawer trend axes as well', async () => {
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: '查看 林晓光 的活动详情' }));

    const drawer = await screen.findByRole('dialog', { name: '林晓光 的活动详情' });
    expect(
      within(drawer).getByText(/纵轴：当日有效活动次数（次）· 横轴：日期（月\/日）/)
    ).toBeDefined();
    // 数据峰值 20 → 纵轴取整到 0/5/10/15/20。
    const caption = within(drawer).getByText(/纵轴：当日有效活动次数/);
    const plot = caption.closest('figure')?.querySelector('[aria-hidden="true"]');
    expect(plot).not.toBeNull();
    for (const tick of ['0', '5', '10', '15', '20']) {
      expect(within(plot as HTMLElement).getByText(tick)).toBeDefined();
    }
    expect(within(plot as HTMLElement).getByText('7/9')).toBeDefined();
    expect(within(plot as HTMLElement).getByText('7/10')).toBeDefined();
  });

  it('retries after an upstream error', async () => {
    getActivity
      .mockRejectedValueOnce(new Error('行为统计服务暂时不可用'))
      .mockResolvedValueOnce(activity);

    renderPage();

    expect(await screen.findByText('加载学生活动失败')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: '重试' }));

    await waitFor(() => expect(getActivity).toHaveBeenCalledTimes(2));
    expect((await screen.findAllByText('林晓光')).length).toBeGreaterThanOrEqual(1);
  });

  it('compares each metric against the preceding window', async () => {
    renderPage();

    const overview = (await screen.findByLabelText('活动概览')) as HTMLElement;
    // 18 vs 12 学生, 146 vs 146 活动, 62 vs 124 访问, 84 vs 0 行为
    expect(within(overview).getByText(/较上期 \+50%/)).toBeDefined();
    expect(within(overview).getByText(/较上期持平/)).toBeDefined();
    expect(within(overview).getByText(/较上期 -50%/)).toBeDefined();
    expect(within(overview).getByText(/较上期新增 84/)).toBeDefined();
  });

  it('omits the comparison when the payload has no previous window', async () => {
    getActivity.mockResolvedValue({ ...activity, previous_summary: null });

    renderPage();

    const overview = (await screen.findByLabelText('活动概览')) as HTMLElement;
    expect(within(overview).queryByText(/较上期/)).toBeNull();
  });

  it('opens the learner drawer from a ranking row', async () => {
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: '查看 林晓光 的活动详情' }));

    const drawer = await screen.findByRole('dialog', { name: '林晓光 的活动详情' });
    await waitFor(() =>
      expect(getActivityDetail).toHaveBeenCalledWith('learner-1', presetRange(7))
    );
    expect(within(drawer).getByText('32')).toBeDefined();
    expect(within(drawer).getByText(/较上期 \+100%/)).toBeDefined();
    expect(within(drawer).getByText('实验内容 · 课程详情')).toBeDefined();
    expect(within(drawer).getByRole('table', { name: /按星期与时段统计的活动次数/ })).toBeDefined();
  });

  it('opens the learner drawer straight from a bookmarked link', async () => {
    renderPage('/admin/activity?user=learner-2');

    expect(await screen.findByRole('dialog', { name: '王小雨 的活动详情' })).toBeDefined();
    await waitFor(() =>
      expect(getActivityDetail).toHaveBeenCalledWith('learner-2', presetRange(7))
    );
  });

  it('closes the learner drawer without losing the dashboard', async () => {
    renderPage('/admin/activity?user=learner-1');

    await screen.findByRole('dialog', { name: '林晓光 的活动详情' });
    fireEvent.click(screen.getByRole('button', { name: '关闭账号活动详情' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getByRole('heading', { name: '用户活动' })).toBeDefined();
  });

  it('surfaces a drawer-level failure without breaking the dashboard', async () => {
    getActivityDetail.mockRejectedValue(new Error('行为数据查询失败，请稍后重试'));

    renderPage('/admin/activity?user=learner-1');

    expect(await screen.findByText('加载账号活动详情失败')).toBeDefined();
    expect(screen.getByRole('heading', { name: '用户活动' })).toBeDefined();
  });
});
