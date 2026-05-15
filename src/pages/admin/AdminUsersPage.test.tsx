// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getStats, list, getPostHogAnalytics } = vi.hoisted(() => ({
  getStats: vi.fn(),
  list: vi.fn(),
  getPostHogAnalytics: vi.fn(),
}));

vi.mock('@/lib/admin-user.service', () => ({
  adminUserApi: {
    getStats,
    list,
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

describe('AdminUsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getStats.mockResolvedValue({
      total_registered: 12,
      active_users: 9,
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
    expect(await screen.findByText('12')).toBeDefined();
    expect(screen.getByText('9')).toBeDefined();
    expect(screen.getByText('alice')).toBeDefined();
    expect(screen.getByText('alice@example.com')).toBeDefined();
    expect(screen.getByRole('button', { name: '查看 alice 的行为' })).toBeDefined();

    await waitFor(() => {
      expect(list).toHaveBeenCalledWith({
        search: '',
        role: 'all',
        status: 'all',
        limit: 20,
        offset: 0,
      });
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
        search: '',
        role: 'admin',
        status: 'all',
        limit: 20,
        offset: 0,
      });
    });
  });

  it('loads and renders a selected user analytics dialog, sorting recent events newest first', async () => {
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

    fireEvent.click(await screen.findByRole('button', { name: '查看 alice 的行为' }));

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
          event: 'earlier_event',
          timestamp: '2026-05-14T10:00:00.000Z',
          route: '/earlier',
          url: 'https://example.com/earlier',
        },
        {
          event: 'later_event',
          timestamp: '2026-05-14T12:00:00.000Z',
          route: '/later',
          url: 'https://example.com/later',
        },
      ],
    });

    expect(await screen.findByText('最近活跃时间')).toBeDefined();
    expect(screen.getByText('42')).toBeDefined();
    expect(screen.getByText('11')).toBeDefined();

    const laterEvent = screen.getByText('later_event');
    const earlierEvent = screen.getByText('earlier_event');
    expect(
      laterEvent.compareDocumentPosition(earlierEvent) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
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
      .mockRejectedValueOnce(new Error('PostHog 查询失败，请稍后重试'));

    render(
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole('button', { name: '查看 alice 的行为' }));
    expect(await screen.findByText('PostHog 尚未配置')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: '关闭行为详情' }));
    fireEvent.click(screen.getByRole('button', { name: '查看 bob 的行为' }));
    expect(await screen.findByText('该用户在 PostHog 中暂无记录')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: '关闭行为详情' }));
    fireEvent.click(screen.getByRole('button', { name: '查看 alice 的行为' }));
    expect(await screen.findByText('PostHog 查询失败，请稍后重试')).toBeDefined();
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

    fireEvent.click(await screen.findByRole('button', { name: '查看 alice 的行为' }));
    expect(await screen.findByText('alice_event')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: '查看 bob 的行为' }));
    expect(screen.queryByText('alice_event')).toBeNull();
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

    expect(await screen.findByText('bob_event')).toBeDefined();
  });
});
