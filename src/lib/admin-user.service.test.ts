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
    });

    expect(get).toHaveBeenCalledWith(
      '/api/users?search=alice&role=admin&status=inactive&limit=20&offset=40'
    );

    await adminUserApi.list({
      role: 'all',
      status: 'all',
    });

    expect(get).toHaveBeenLastCalledWith('/api/users');
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
