// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
          email: 'alice@example.com',
          role: 'admin',
          avatar_url: null,
          email_verified: true,
          is_active: true,
          created_at: '2026-05-01T00:00:00.000Z',
          last_login_at: '2026-05-03T00:00:00.000Z',
        },
        {
          id: 'user-2',
          username: 'bob',
          email: 'bob@example.com',
          role: 'user',
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
    getPostHogAnalytics.mockResolvedValue({
      status: 'not_found',
      person: null,
      summary: null,
      recent_events: [],
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
    expect(screen.getByText('alice')).toBeDefined();
    expect(screen.getByText('alice@example.com')).toBeDefined();
    expect(screen.getByText('从未登录')).toBeDefined();
    expect(screen.getByRole('button', { name: '查看 alice 的详情' })).toBeDefined();

    await waitFor(() => {
      expect(list).toHaveBeenCalledWith(DEFAULT_LIST_PARAMS);
    });
  });

  it('reloads the list when the role filter changes', async () => {
    render(
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>
    );

    await screen.findByText('alice');

    fireEvent.change(screen.getByLabelText('角色筛选'), {
      target: { value: 'admin' },
    });

    await waitFor(() => {
      expect(list).toHaveBeenLastCalledWith({
        ...DEFAULT_LIST_PARAMS,
        role: 'admin',
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

  it('loads the user detail with educations and research involvement', async () => {
    getDetail.mockResolvedValue({
      user: {
        id: 'user-1',
        username: 'alice',
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

    render(
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole('button', { name: '查看 alice 的详情' }));

    expect(getDetail).toHaveBeenCalledWith('user-1');
    expect(getPostHogAnalytics).toHaveBeenCalledWith('user-1');

    expect(await screen.findByText('某某大学')).toBeDefined();
    expect(screen.getByText('物理学')).toBeDefined();
    expect(screen.getByText('本科')).toBeDefined();
    expect(screen.getByText('偏振光课题')).toBeDefined();
    expect(screen.getByText('负责人')).toBeDefined();
    expect(screen.getByText('另一个课题')).toBeDefined();
    expect(screen.getByText('待审核')).toBeDefined();
  });

  it('shows empty hints when a user has no educations or research involvement', async () => {
    render(
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole('button', { name: '查看 alice 的详情' }));

    expect(await screen.findByText('该用户还没有填写教育经历')).toBeDefined();
    expect(screen.getByText('该用户尚未加入或申请任何课题组')).toBeDefined();
  });

  it('loads and renders analytics in the detail dialog, sorting recent events newest first', async () => {
    let resolveAnalytics:
      | ((value: {
          status: 'ok';
          person: {
            id: string;
            uuid: string;
            created_at: string;
            last_seen_at: string;
          };
          summary: {
            window_days: 30;
            event_count_30d: number;
            pageview_count_30d: number;
          };
          recent_events: Array<{
            event: string;
            timestamp: string;
            route: string | null;
            url: string | null;
          }>;
        }) => void)
      | undefined;

    getPostHogAnalytics.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAnalytics = resolve;
        })
    );

    render(
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole('button', { name: '查看 alice 的详情' }));

    expect(screen.getByText('正在加载行为数据...')).toBeDefined();
    expect(getPostHogAnalytics).toHaveBeenCalledWith('user-1');

    resolveAnalytics?.({
      status: 'ok',
      person: {
        id: '123',
        uuid: 'person-uuid',
        created_at: '2026-04-01T00:00:00.000Z',
        last_seen_at: '2026-05-14T12:00:00.000Z',
      },
      summary: {
        window_days: 30,
        event_count_30d: 42,
        pageview_count_30d: 11,
      },
      recent_events: [
        {
          event: '$pageview',
          timestamp: '2026-05-14T10:00:00.000Z',
          route: '/earlier',
          url: 'https://example.com/earlier',
        },
        {
          event: 'profile_edit',
          timestamp: '2026-05-14T12:00:00.000Z',
          route: '/later',
          url: 'https://example.com/later',
        },
      ],
    });

    expect(await screen.findByText('最近活跃时间')).toBeDefined();
    expect(screen.getByText('42')).toBeDefined();
    expect(screen.getByText('11')).toBeDefined();

    const laterEvent = screen.getByText('Profile Edit');
    const earlierEvent = screen.getByText('查看页面');
    expect(
      laterEvent.compareDocumentPosition(earlierEvent) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it('renders common analytics events in teacher-friendly language', async () => {
    getPostHogAnalytics.mockResolvedValue({
      status: 'ok',
      person: {
        id: 'teacher-person',
        uuid: 'teacher-uuid',
        created_at: '2026-04-01T00:00:00.000Z',
        last_seen_at: '2026-05-14T12:00:00.000Z',
      },
      summary: {
        window_days: 30,
        event_count_30d: 8,
        pageview_count_30d: 5,
      },
      recent_events: [
        {
          event: '$pageview',
          timestamp: '2026-05-14T15:00:00.000Z',
          route: '/home',
          url: 'https://example.com/home',
        },
        {
          event: 'auth_login_success',
          timestamp: '2026-05-14T14:00:00.000Z',
          route: '/login',
          url: 'https://example.com/login',
        },
        {
          event: 'auth_register_success',
          timestamp: '2026-05-14T13:00:00.000Z',
          route: '/register',
          url: 'https://example.com/register',
        },
        {
          event: 'project_application_submitted',
          timestamp: '2026-05-14T12:00:00.000Z',
          route: '/projects/1',
          url: 'https://example.com/projects/1',
        },
        {
          event: 'experiment_opened',
          timestamp: '2026-05-14T11:00:00.000Z',
          route: '/courses/1',
          url: 'https://example.com/courses/1',
        },
      ],
    });

    render(
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole('button', { name: '查看 alice 的详情' }));

    expect(await screen.findByText('查看页面')).toBeDefined();
    expect(screen.getByText('登录成功')).toBeDefined();
    expect(screen.getByText('注册成功')).toBeDefined();
    expect(screen.getByText('提交课题申请')).toBeDefined();
    expect(screen.getByText('进入实验')).toBeDefined();
    expect(screen.queryByText('PostHog')).toBeNull();
  });

  it('shows disabled, not found, and failed analytics states explicitly', async () => {
    getPostHogAnalytics
      .mockResolvedValueOnce({
        status: 'disabled',
        person: null,
        summary: null,
        recent_events: [],
      })
      .mockResolvedValueOnce({
        status: 'not_found',
        person: null,
        summary: null,
        recent_events: [],
      })
      .mockRejectedValueOnce(new Error('行为数据查询失败，请稍后重试'));

    render(
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole('button', { name: '查看 alice 的详情' }));
    expect(await screen.findByText('行为统计尚未启用')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: '关闭用户详情' }));
    fireEvent.click(screen.getByRole('button', { name: '查看 bob 的详情' }));
    expect(await screen.findByText('该用户暂无行为记录')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: '关闭用户详情' }));
    fireEvent.click(screen.getByRole('button', { name: '查看 alice 的详情' }));
    expect(await screen.findByText('行为数据查询失败，请稍后重试')).toBeDefined();
  });

  it('clears the previous analytics result when switching users', async () => {
    let resolveBob:
      | ((value: {
          status: 'ok';
          person: {
            id: string;
            uuid: string;
            created_at: string;
            last_seen_at: string;
          };
          summary: {
            window_days: 30;
            event_count_30d: number;
            pageview_count_30d: number;
          };
          recent_events: Array<{
            event: string;
            timestamp: string;
            route: string | null;
            url: string | null;
          }>;
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
          window_days: 30,
          event_count_30d: 5,
          pageview_count_30d: 2,
        },
        recent_events: [
          {
            event: 'alice_event',
            timestamp: '2026-05-14T12:00:00.000Z',
            route: '/alice',
            url: 'https://example.com/alice',
          },
        ],
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
    expect(await screen.findByText('Alice Event')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: '查看 bob 的详情' }));
    expect(screen.queryByText('Alice Event')).toBeNull();
    expect(screen.getByText('正在加载行为数据...')).toBeDefined();

    resolveBob?.({
      status: 'ok',
      person: {
        id: 'bob-person',
        uuid: 'bob-uuid',
        created_at: '2026-04-02T00:00:00.000Z',
        last_seen_at: '2026-05-13T12:00:00.000Z',
      },
      summary: {
        window_days: 30,
        event_count_30d: 7,
        pageview_count_30d: 3,
      },
      recent_events: [
        {
          event: 'bob_event',
          timestamp: '2026-05-13T12:00:00.000Z',
          route: '/bob',
          url: 'https://example.com/bob',
        },
      ],
    });

    expect(await screen.findByText('Bob Event')).toBeDefined();
  });

  it('exports the filtered list as CSV', async () => {
    const createObjectURL = vi.fn(() => 'blob:mock');
    const revokeObjectURL = vi.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });

    render(
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>
    );

    await screen.findByText('alice');

    fireEvent.click(screen.getByRole('button', { name: /导出 CSV/ }));

    await waitFor(() => {
      expect(list).toHaveBeenLastCalledWith({
        ...DEFAULT_LIST_PARAMS,
        limit: 100,
        offset: 0,
      });
    });

    await waitFor(() => {
      expect(createObjectURL).toHaveBeenCalled();
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock');
    });
  });
});
