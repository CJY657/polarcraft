// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getStats, list, getDetail, getPostHogAnalytics } = vi.hoisted(() => ({
  getStats: vi.fn(),
  list: vi.fn(),
  getDetail: vi.fn(),
  getPostHogAnalytics: vi.fn(),
}));

vi.mock('@/lib/admin-user.service', () => ({
  adminUserApi: {
    getStats,
    list,
    getDetail,
    getPostHogAnalytics,
  },
}));

vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({ theme: 'dark' }),
}));

vi.mock('@/components/shared/PersistentHeader', () => ({
  PersistentHeader: () => <div>persistent header</div>,
}));

import AdminUsersPage from './AdminUsersPage';

const DEFAULT_LIST_PARAMS = {
  search: '',
  userType: 'all',
  role: 'all',
  status: 'all',
  sortBy: 'created_at',
  sortOrder: 'desc',
  limit: 20,
  offset: 0,
};

describe('AdminUsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getStats.mockResolvedValue({
      total_registered: 12,
      active_users: 9,
      new_users_7d: 4,
      recent_logins_7d: 6,
      unverified_emails: 3,
    });
    list.mockResolvedValue({
      items: [
        {
          id: 'user-1',
          username: 'alice',
          nickname: null,
          real_name: null,
          email: 'alice@example.com',
          role: 'admin',
          user_type: 'teacher',
          avatar_url: null,
          email_verified: true,
          is_active: true,
          created_at: '2026-05-01T00:00:00.000Z',
          last_login_at: '2026-05-03T00:00:00.000Z',
        },
        {
          id: 'user-2',
          username: 'bob',
          nickname: null,
          real_name: null,
          email: 'bob@example.com',
          role: 'user',
          user_type: null,
          avatar_url: null,
          email_verified: false,
          is_active: false,
          created_at: '2026-04-01T00:00:00.000Z',
          last_login_at: null,
        },
      ],
      total: 2,
    });
    getDetail.mockResolvedValue({
      user: {
        id: 'user-1',
        username: 'alice',
        nickname: null,
        real_name: null,
        email: 'alice@example.com',
        role: 'admin',
        user_type: 'teacher',
        avatar_url: null,
        email_verified: true,
        is_active: true,
        created_at: '2026-05-01T00:00:00.000Z',
        last_login_at: '2026-05-03T00:00:00.000Z',
      },
      educations: [],
      research: {
        memberships: [],
        applications: [],
      },
    });
    getPostHogAnalytics.mockResolvedValue({
      status: 'not_found',
      person: null,
      summary: null,
    });
  });

  it('renders admin user statistics and the basic user list', async () => {
    render(
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('用户管理')).toBeDefined();
    expect(screen.getByText('账号总览')).toBeDefined();
    expect(await screen.findByText('12')).toBeDefined();
    expect(screen.getByText('4')).toBeDefined();
    expect(screen.getByText('6')).toBeDefined();
    expect(screen.getByText('3')).toBeDefined();
    expect(screen.getByText('9 个可用 · 3 个停用')).toBeDefined();
    expect(screen.getByText('最近一周新加入的账号')).toBeDefined();
    expect(screen.getByText('最近一次登录发生在过去 7 个 24 小时内，每个账号只计一次')).toBeDefined();
    expect(screen.getByText('可用账号中尚未完成邮箱验证')).toBeDefined();
    expect(screen.getByText('alice')).toBeDefined();
    expect(screen.getByText('alice@example.com')).toBeDefined();
    expect(screen.getAllByText('教师').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('未分类').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole('columnheader', { name: '身份' })).toBeDefined();
    expect(screen.getByRole('columnheader', { name: '权限' })).toBeDefined();
    expect(screen.getByText('从未登录')).toBeDefined();
    expect(screen.getByRole('button', { name: '查看 alice 的详情' })).toBeDefined();

    await waitFor(() => {
      expect(list).toHaveBeenCalledWith(DEFAULT_LIST_PARAMS);
    });
  });

  it('reloads the list when the permission filter changes', async () => {
    render(
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>
    );

    await screen.findByText('alice');

    fireEvent.change(screen.getByLabelText('权限筛选'), {
      target: { value: 'admin' },
    });

    await waitFor(() => {
      expect(list).toHaveBeenLastCalledWith({
        ...DEFAULT_LIST_PARAMS,
        role: 'admin',
      });
    });
  });

  it('reloads the list when the identity filter changes', async () => {
    render(
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>
    );

    await screen.findByText('alice');

    fireEvent.change(screen.getByLabelText('身份筛选'), {
      target: { value: 'unclassified' },
    });

    await waitFor(() => {
      expect(list).toHaveBeenLastCalledWith({
        ...DEFAULT_LIST_PARAMS,
        userType: 'unclassified',
      });
    });
  });

  it('toggles sorting when a sortable header is clicked', async () => {
    render(
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>
    );

    await screen.findByText('alice');

    fireEvent.click(screen.getByRole('button', { name: '按最后登录排序' }));

    await waitFor(() => {
      expect(list).toHaveBeenLastCalledWith({
        ...DEFAULT_LIST_PARAMS,
        sortBy: 'last_login_at',
        sortOrder: 'desc',
      });
    });

    fireEvent.click(screen.getByRole('button', { name: '按最后登录排序' }));

    await waitFor(() => {
      expect(list).toHaveBeenLastCalledWith({
        ...DEFAULT_LIST_PARAMS,
        sortBy: 'last_login_at',
        sortOrder: 'asc',
      });
    });
  });

  it('keeps the profile disclosure collapsed, resets it on reopen, and preserves section order', async () => {
    getDetail.mockResolvedValue({
      user: {
        id: 'user-1',
        username: 'alice',
        nickname: null,
        real_name: null,
        email: 'alice@example.com',
        role: 'admin',
        avatar_url: null,
        email_verified: true,
        is_active: true,
        created_at: '2026-05-01T00:00:00.000Z',
        last_login_at: '2026-05-03T00:00:00.000Z',
      },
      educations: [
        {
          id: 'edu-1',
          organization: '某某大学',
          major: '物理学',
          degree_level: '本科',
          start_date: '2024-09-01',
          end_date: null,
          is_current: true,
        },
      ],
      research: {
        memberships: [
          {
            project_id: 'project-1',
            project_name: '偏振光课题',
            role: 'owner',
            joined_at: '2026-05-10T00:00:00.000Z',
          },
        ],
        applications: [
          {
            id: 'app-1',
            project_id: 'project-2',
            project_name: '另一个课题',
            display_name: 'Alice',
            organization: '某某大学',
            major: '物理学',
            grade: '大二',
            status: 'pending',
            created_at: '2026-06-01T00:00:00.000Z',
            reviewed_at: null,
          },
        ],
      },
    });
    getPostHogAnalytics.mockResolvedValue({
      status: 'ok',
      person: {
        id: 'person-1',
        uuid: 'person-uuid',
        created_at: '2026-04-01T00:00:00.000Z',
        last_seen_at: '2020-01-01T00:00:00.000Z',
      },
      summary: {
        window_days: 10,
        last_activity: '2026-07-30T12:30:00.000Z',
        meaningful_events: 42,
        pageviews: 11,
        learning_actions: 7,
      },
    });

    render(
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole('button', { name: '查看 alice 的详情' }));

    expect(getDetail).toHaveBeenCalledWith('user-1');
    expect(getPostHogAnalytics).toHaveBeenCalledWith('user-1');

    const profileLabel = await screen.findByText('个人档案');
    const profileSummary = profileLabel.closest('summary');
    const profileDetails = profileLabel.closest('details');
    expect(profileSummary?.getAttribute('aria-expanded')).toBe('false');
    expect(profileSummary?.getAttribute('aria-controls')).toBe('admin-user-profile-content');
    expect(profileDetails?.open).toBe(false);
    expect(screen.getByText('教育经历 1 条')).toBeDefined();

    const activityHeading = screen.getByRole('heading', { name: '近 10 天活动概览' });
    const researchHeading = await screen.findByRole('heading', { name: '课题组参与' });
    expect(
      profileLabel.compareDocumentPosition(activityHeading) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      activityHeading.compareDocumentPosition(researchHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();

    fireEvent.click(profileSummary!);
    expect(profileSummary?.getAttribute('aria-expanded')).toBe('true');
    expect(profileDetails?.open).toBe(true);
    expect(await screen.findByText('某某大学')).toBeDefined();
    expect(screen.getByText('物理学')).toBeDefined();
    expect(screen.getByText('本科')).toBeDefined();
    expect(screen.getByText('2024年9月 - 至今')).toBeDefined();
    expect(screen.getByText('偏振光课题')).toBeDefined();
    expect(screen.getByText('负责人')).toBeDefined();
    expect(screen.getByText('另一个课题')).toBeDefined();
    expect(screen.getByText('待审核')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: '关闭用户详情' }));
    fireEvent.click(screen.getByRole('button', { name: '查看 alice 的详情' }));

    const reopenedProfileSummary = (await screen.findByText('个人档案')).closest('summary');
    expect(reopenedProfileSummary?.getAttribute('aria-expanded')).toBe('false');
    expect(reopenedProfileSummary?.closest('details')?.open).toBe(false);
  });

  it('shows profile, activity, and research empty states without individual logs', async () => {
    render(
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole('button', { name: '查看 alice 的详情' }));
    fireEvent.click((await screen.findByText('个人档案')).closest('summary')!);

    expect(await screen.findByText('该用户还没有填写教育经历')).toBeDefined();
    expect(screen.getByText('近 10 天暂无活动数据')).toBeDefined();
    expect(screen.getByText('该用户尚未加入或申请任何课题组')).toBeDefined();
    expect(screen.queryByText('最近 10 条行为')).toBeNull();
  });

  it('renders four 10-day KPI cards for an admin and uses summary last activity', async () => {
    getPostHogAnalytics.mockResolvedValue({
      status: 'ok',
      person: {
        id: 'person-1',
        uuid: 'person-uuid',
        created_at: '2026-04-01T00:00:00.000Z',
        last_seen_at: '2020-01-01T00:00:00.000Z',
      },
      summary: {
        window_days: 10,
        last_activity: '2026-07-30T12:30:00.000Z',
        meaningful_events: 42,
        pageviews: 11,
        learning_actions: 7,
        daily: [
          { date: '2026-07-21', events: 0 },
          { date: '2026-07-22', events: 2 },
          { date: '2026-07-23', events: 5 },
          { date: '2026-07-24', events: 0 },
          { date: '2026-07-25', events: 9 },
          { date: '2026-07-26', events: 3 },
          { date: '2026-07-27', events: 6 },
          { date: '2026-07-28', events: 8 },
          { date: '2026-07-29', events: 4 },
          { date: '2026-07-30', events: 5 },
        ],
      },
    });

    render(
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole('button', { name: '查看 alice 的详情' }));

    expect(await screen.findByText('最近活跃')).toBeDefined();
    expect(screen.getAllByText('有效活动').length).toBeGreaterThan(0);
    expect(screen.getByText('页面访问')).toBeDefined();
    expect(screen.getByText('学习行为')).toBeDefined();
    expect(screen.getByText('42')).toBeDefined();
    expect(screen.getByText('11')).toBeDefined();
    expect(screen.getByText('7')).toBeDefined();
    expect(screen.getByText('纳入统计的活动中，时间最晚的一次。')).toBeDefined();
    expect(screen.getByText('已识别账号的活动，排除自动采集、离开、身份识别和属性设置等事件。')).toBeDefined();
    expect(screen.getByText('纳入统计的页面访问次数。')).toBeDefined();
    expect(screen.getByText('进入实验，以及在虚拟课题组里建课题、提交申请、讨论、交证据、完成任务的合计次数。')).toBeDefined();
    expect(screen.getAllByText(/2026.*07.*30/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/2020.*01.*01/)).toBeNull();
    expect(screen.queryByText('查看页面')).toBeNull();
    expect(screen.queryByText('最近 10 条行为')).toBeNull();
    expect(screen.queryByText('PostHog')).toBeNull();

    expect(screen.getByText('每日有效活动')).toBeDefined();
    expect(screen.getByText('每个趋势点表示当天纳入统计的有效活动次数。')).toBeDefined();
    expect(screen.getByRole('img', { name: /近 10 天每日有效活动趋势/ })).toBeDefined();
    expect(screen.getByText('7/21')).toBeDefined();
    expect(screen.getByText('7/30')).toBeDefined();
    expect(screen.getByText('近 10 天每日有效活动数据')).toBeDefined();

    // 纵轴刻度：峰值 9 → 0/5/10，并标注单位。
    const trend = screen.getByRole('img', { name: /近 10 天每日有效活动趋势/ });
    for (const tick of ['0', '5', '10']) {
      expect(within(trend).getByText(tick)).toBeDefined();
    }
    expect(screen.getByText('纵轴：当日有效活动次数（次）· 横轴：日期（月/日）')).toBeDefined();
  });

  it('loads profile and analytics independently with KPI-shaped analytics skeletons', async () => {
    let resolveDetail: ((value: Awaited<ReturnType<typeof getDetail>>) => void) | undefined;

    getDetail.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveDetail = resolve;
        })
    );
    getPostHogAnalytics.mockResolvedValue({
      status: 'ok',
      person: null,
      summary: {
        window_days: 10,
        last_activity: null,
        meaningful_events: 5,
        pageviews: 3,
        learning_actions: 2,
      },
    });

    render(
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole('button', { name: '查看 alice 的详情' }));

    expect(screen.getByText('教育经历加载中')).toBeDefined();
    expect(await screen.findByText('有效活动')).toBeDefined();
    expect(screen.getByText('5')).toBeDefined();

    resolveDetail?.({
      user: {
        id: 'user-1',
        username: 'alice',
        nickname: null,
        real_name: null,
        email: 'alice@example.com',
        role: 'admin',
        avatar_url: null,
        email_verified: true,
        is_active: true,
        created_at: '2026-05-01T00:00:00.000Z',
        last_login_at: '2026-05-03T00:00:00.000Z',
      },
      educations: [],
      research: {
        memberships: [],
        applications: [],
      },
    });

    expect(await screen.findByText('教育经历 0 条')).toBeDefined();

    let resolveAnalytics: ((value: unknown) => void) | undefined;
    getPostHogAnalytics.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAnalytics = resolve;
        })
    );
    fireEvent.click(screen.getByRole('button', { name: '查看 bob 的详情' }));
    expect(screen.getByLabelText('正在加载近 10 天活动概览')).toBeDefined();
    expect(screen.queryByText('正在加载行为数据...')).toBeNull();

    resolveAnalytics?.({
      status: 'not_found',
      person: null,
      summary: null,
    });
    expect(await screen.findByText('近 10 天暂无活动数据')).toBeDefined();
  });

  it('shows disabled, missing, failed, and zero-summary analytics states explicitly', async () => {
    getPostHogAnalytics
      .mockResolvedValueOnce({
        status: 'disabled',
        person: null,
        summary: null,
      })
      .mockResolvedValueOnce({
        status: 'not_found',
        person: null,
        summary: null,
      })
      .mockRejectedValueOnce(new Error('行为数据查询失败，请稍后重试'))
      .mockResolvedValueOnce({
        status: 'ok',
        person: null,
        summary: {
          window_days: 10,
          last_activity: null,
          meaningful_events: 0,
          pageviews: 0,
          learning_actions: 0,
        },
      });

    render(
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole('button', { name: '查看 alice 的详情' }));
    expect(await screen.findByText('行为统计尚未启用')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: '关闭用户详情' }));
    fireEvent.click(screen.getByRole('button', { name: '查看 bob 的详情' }));
    expect(await screen.findByText('近 10 天暂无活动数据')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: '关闭用户详情' }));
    fireEvent.click(screen.getByRole('button', { name: '查看 alice 的详情' }));
    expect(await screen.findByText('行为数据查询失败，请稍后重试')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: '关闭用户详情' }));
    fireEvent.click(screen.getByRole('button', { name: '查看 bob 的详情' }));
    expect(await screen.findByText('近 10 天暂无活动数据')).toBeDefined();
  });

  it('clears the previous analytics result when switching users', async () => {
    let resolveBob:
      | ((value: {
          status: 'ok';
          person: null;
          summary: {
            window_days: 10;
            last_activity: string | null;
            meaningful_events: number;
            pageviews: number;
            learning_actions: number;
          };
        }) => void)
      | undefined;

    getPostHogAnalytics
      .mockResolvedValueOnce({
        status: 'ok',
        person: {
          id: 'alice-person',
          uuid: 'alice-uuid',
          created_at: '2026-04-01T00:00:00.000Z',
          last_seen_at: '2026-05-14T12:00:00.000Z',
        },
        summary: {
          window_days: 10,
          last_activity: '2026-05-14T12:00:00.000Z',
          meaningful_events: 105,
          pageviews: 102,
          learning_actions: 101,
        },
      })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveBob = resolve;
          })
      );

    render(
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole('button', { name: '查看 alice 的详情' }));
    expect(await screen.findByText('105')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: '查看 bob 的详情' }));
    expect(screen.queryByText('105')).toBeNull();
    expect(screen.getByLabelText('正在加载近 10 天活动概览')).toBeDefined();

    resolveBob?.({
      status: 'ok',
      person: null,
      summary: {
        window_days: 10,
        last_activity: '2026-05-13T12:00:00.000Z',
        meaningful_events: 207,
        pageviews: 203,
        learning_actions: 201,
      },
    });

    expect(await screen.findByText('207')).toBeDefined();
  });

  it('does not offer CSV export from the user list', async () => {
    render(
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>
    );

    await screen.findByText('alice');

    expect(screen.queryByRole('button', { name: /导出 CSV/ })).toBeNull();
  });
});
