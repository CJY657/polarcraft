import { beforeEach, describe, expect, it, vi } from 'vitest';

const { findByIdForAdmin, getUserAnalytics } = vi.hoisted(() => ({
  findByIdForAdmin: vi.fn(),
  getUserAnalytics: vi.fn(),
}));

vi.mock('../models/user.model.js', () => ({
  UserModel: {
    findByIdForAdmin,
  },
}));

vi.mock('./posthog.service.js', () => ({
  PostHogService: {
    getUserAnalytics,
  },
}));

import { AuthError } from '../types/auth.types.js';
import { UserService } from './user.service.js';

describe('UserService.getPostHogAnalyticsForAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unknown users before asking PostHog for analytics', async () => {
    findByIdForAdmin.mockResolvedValue(null);

    await expect(UserService.getPostHogAnalyticsForAdmin('missing-user')).rejects.toBeInstanceOf(
      AuthError
    );
    expect(getUserAnalytics).not.toHaveBeenCalled();
  });

  it('allows inactive users to be queried through the admin lookup path', async () => {
    findByIdForAdmin.mockResolvedValue({
      id: 'inactive-user',
      username: 'bob',
      role: 'user',
      avatar_url: null,
      email: null,
      email_verified: false,
      is_active: false,
      created_at: new Date('2026-05-01T00:00:00.000Z'),
      last_login_at: null,
    });
    getUserAnalytics.mockResolvedValue({
      status: 'not_found',
      person: null,
      summary: null,
      recent_events: [],
    });

    await expect(UserService.getPostHogAnalyticsForAdmin('inactive-user')).resolves.toEqual({
      status: 'not_found',
      person: null,
      summary: null,
      recent_events: [],
    });

    expect(findByIdForAdmin).toHaveBeenCalledWith('inactive-user');
    expect(getUserAnalytics).toHaveBeenCalledWith('inactive-user');
  });
});
