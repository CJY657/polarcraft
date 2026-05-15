// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getStats, list } = vi.hoisted(() => ({
  getStats: vi.fn(),
  list: vi.fn(),
}));

vi.mock('@/lib/admin-user.service', () => ({
  adminUserApi: {
    getStats,
    list,
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
      ],
      total: 1,
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
});
