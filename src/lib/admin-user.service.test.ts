import { beforeEach, describe, expect, it, vi } from 'vitest';

const { get } = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock('./api', () => ({
  api: {
    get,
  },
}));

import { adminUserApi } from './admin-user.service';

describe('adminUserApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requests admin user statistics', async () => {
    get.mockResolvedValue({
      success: true,
      data: {
        total_registered: 12,
        active_users: 9,
      },
    });

    await expect(adminUserApi.getStats()).resolves.toEqual({
      total_registered: 12,
      active_users: 9,
    });

    expect(get).toHaveBeenCalledWith('/api/users/stats');
  });

  it('builds filtered user-list queries without serializing all filters', async () => {
    get.mockResolvedValue({
      success: true,
      data: {
        items: [],
        total: 0,
      },
    });

    await adminUserApi.list({
      search: 'alice',
      role: 'admin',
      status: 'inactive',
      limit: 20,
      offset: 40,
      sortBy: 'last_login_at',
      sortOrder: 'asc',
    });

    expect(get).toHaveBeenCalledWith(
      '/api/users?search=alice&role=admin&status=inactive&limit=20&offset=40&sort_by=last_login_at&sort_order=asc'
    );

    await adminUserApi.list({
      role: 'all',
      status: 'all',
    });

    expect(get).toHaveBeenLastCalledWith('/api/users');
  });

  it('requests a single user detail for admins', async () => {
    const detail = {
      user: {
        id: 'user-1',
        username: 'alice',
        role: 'user',
        avatar_url: null,
        email: 'alice@example.com',
        email_verified: true,
        is_active: true,
        created_at: '2026-05-01T00:00:00.000Z',
        last_login_at: null,
      },
      educations: [],
      research: {
        memberships: [],
        applications: [],
      },
    };
    get.mockResolvedValue({
      success: true,
      data: detail,
    });

    await expect(adminUserApi.getDetail('user-1')).resolves.toEqual(detail);

    expect(get).toHaveBeenCalledWith('/api/users/user-1/details');
  });

  it('requests PostHog analytics for a single admin-selected user', async () => {
    get.mockResolvedValue({
      success: true,
      data: {
        status: 'not_found',
        person: null,
        summary: null,
        recent_events: [],
      },
    });

    await expect(adminUserApi.getPostHogAnalytics('user-1')).resolves.toEqual({
      status: 'not_found',
      person: null,
      summary: null,
      recent_events: [],
    });

    expect(get).toHaveBeenCalledWith('/api/users/user-1/posthog-analytics');
  });
});
