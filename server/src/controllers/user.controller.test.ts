import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  listUsersForAdmin,
  updateProfile,
  getPostHogAnalyticsForAdmin,
  getActivityDashboardForAdmin,
  getLearnerActivityForAdmin,
} =
  vi.hoisted(() => ({
    listUsersForAdmin: vi.fn(),
    updateProfile: vi.fn(),
    getPostHogAnalyticsForAdmin: vi.fn(),
    getActivityDashboardForAdmin: vi.fn(),
    getLearnerActivityForAdmin: vi.fn(),
  }));

vi.mock('../services/user.service.js', () => ({
  UserService: {
    listUsersForAdmin,
    updateProfile,
    getPostHogAnalyticsForAdmin,
    getActivityDashboardForAdmin,
    getLearnerActivityForAdmin,
  },
}));

vi.mock('../utils/response.util.js', () => ({
  setupResponseHelpers: vi.fn(),
}));

import { PostHogAnalyticsError } from '../services/posthog.service.js';
import { UserController } from './user.controller.js';

describe('UserController.getPostHogAnalyticsForAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a sanitized gateway error when the PostHog upstream request fails', async () => {
    getPostHogAnalyticsForAdmin.mockRejectedValue(new PostHogAnalyticsError());

    const req = {
      params: { userId: 'user-1' },
    };
    const res = {
      success: vi.fn(),
      error: vi.fn(),
    };
    const next = vi.fn();

    UserController.getPostHogAnalyticsForAdmin(req as never, res as never, next);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(res.error).toHaveBeenCalledWith('行为数据查询失败，请稍后重试', 'POSTHOG_QUERY_FAILED', 502);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('UserController.getActivityDashboardForAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses a 7-day range ending today when no dates are given', async () => {
    const dashboard = { status: 'disabled' };
    getActivityDashboardForAdmin.mockResolvedValue(dashboard);
    const res = { success: vi.fn(), error: vi.fn() };

    UserController.getActivityDashboardForAdmin(
      { query: {} } as never,
      res as never,
      vi.fn() as never
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    const today = new Date().toISOString().slice(0, 10);
    const expectedStart = new Date(Date.parse(`${today}T00:00:00Z`) - 6 * 86_400_000)
      .toISOString()
      .slice(0, 10);
    expect(getActivityDashboardForAdmin).toHaveBeenCalledWith(
      expectedStart,
      today,
      10,
      'student'
    );
    expect(res.success).toHaveBeenCalledWith(dashboard);
  });

  it('passes an explicit custom date range and learner limit to the service', async () => {
    getActivityDashboardForAdmin.mockResolvedValue({ status: 'ok' });
    const res = { success: vi.fn(), error: vi.fn() };

    UserController.getActivityDashboardForAdmin(
      {
        query: {
          start: '2026-01-01',
          end: '2026-01-31',
          limit: 'all',
          user_type: 'all',
        },
      } as never,
      res as never,
      vi.fn() as never
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(getActivityDashboardForAdmin).toHaveBeenCalledWith(
      '2026-01-01',
      '2026-01-31',
      null,
      'all'
    );
  });

  it.each(['student', 'teacher', 'all'])('accepts the %s activity segment', async (segment) => {
    getActivityDashboardForAdmin.mockResolvedValue({ status: 'ok' });
    const res = { success: vi.fn(), error: vi.fn() };

    UserController.getActivityDashboardForAdmin(
      { query: { user_type: segment } } as never,
      res as never,
      vi.fn() as never
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(getActivityDashboardForAdmin).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      10,
      segment
    );
    expect(res.error).not.toHaveBeenCalled();
  });

  it('rejects an unsupported activity segment without querying analytics', async () => {
    const res = { success: vi.fn(), error: vi.fn() };

    UserController.getActivityDashboardForAdmin(
      { query: { user_type: 'guardian' } } as never,
      res as never,
      vi.fn() as never
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(res.error).toHaveBeenCalledWith(
      '用户类型仅支持 student、teacher 或 all',
      'INVALID_ACTIVITY_USER_TYPE',
      400
    );
    expect(getActivityDashboardForAdmin).not.toHaveBeenCalled();
  });

  it.each([
    [{ start: '2026-01-31', end: '2026-01-01' }],
    [{ start: '2026-01-01' }],
    [{ start: '01/01/2026', end: '2026-01-31' }],
    [{ start: '2026-01-01', end: '2999-01-01' }],
    [{ start: '2020-01-01', end: '2026-01-01' }],
  ])('rejects an invalid custom range %j without querying analytics', async (query) => {
    const res = { success: vi.fn(), error: vi.fn() };

    UserController.getActivityDashboardForAdmin(
      { query } as never,
      res as never,
      vi.fn() as never
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(res.error).toHaveBeenCalledWith(
      expect.any(String),
      'INVALID_ACTIVITY_RANGE',
      400
    );
    expect(getActivityDashboardForAdmin).not.toHaveBeenCalled();
  });

  it('rejects an unsupported learner limit without querying analytics', async () => {
    const res = { success: vi.fn(), error: vi.fn() };

    UserController.getActivityDashboardForAdmin(
      { query: { limit: '25' } } as never,
      res as never,
      vi.fn() as never
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(res.error).toHaveBeenCalledWith(
      '用户人数仅支持 10、50、100 或 all',
      'INVALID_ACTIVITY_LIMIT',
      400
    );
    expect(getActivityDashboardForAdmin).not.toHaveBeenCalled();
  });

  it('returns a sanitized gateway error when an aggregate query fails', async () => {
    getActivityDashboardForAdmin.mockRejectedValue(new PostHogAnalyticsError());
    const res = { success: vi.fn(), error: vi.fn() };

    UserController.getActivityDashboardForAdmin(
      { query: {} } as never,
      res as never,
      vi.fn() as never
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(res.error).toHaveBeenCalledWith(
      '行为数据查询失败，请稍后重试',
      'POSTHOG_QUERY_FAILED',
      502
    );
  });
});

describe('UserController profile and admin identity inputs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes the admin user type filter to the list service', async () => {
    listUsersForAdmin.mockResolvedValue({ items: [], total: 0 });
    const res = { success: vi.fn(), error: vi.fn() };

    UserController.listUsersForAdmin(
      { query: { user_type: 'unclassified' } } as never,
      res as never,
      vi.fn() as never
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(listUsersForAdmin).toHaveBeenCalledWith(
      expect.objectContaining({ userType: 'unclassified' })
    );
  });

  it('submits completion fields together without accepting a role change', async () => {
    updateProfile.mockResolvedValue({ id: 'user-1', role: 'admin', user_type: 'teacher' });
    const res = { success: vi.fn(), error: vi.fn() };

    UserController.updateProfile(
      {
        user: { sub: 'user-1', username: 'legacy-admin' },
        body: {
          real_name: 'Lin Chen',
          email: 'lin@example.com',
          user_type: 'teacher',
          role: 'user',
        },
      } as never,
      res as never,
      vi.fn() as never
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(updateProfile).toHaveBeenCalledWith('user-1', {
      username: undefined,
      real_name: 'Lin Chen',
      show_real_name_publicly: undefined,
      email: 'lin@example.com',
      avatar_url: undefined,
      user_type: 'teacher',
    });
    expect(updateProfile.mock.calls[0]?.[1]).not.toHaveProperty('role');
  });
});

describe('UserController.getLearnerActivityForAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes the requested learner and custom range to the service', async () => {
    const detail = { status: 'ok' };
    getLearnerActivityForAdmin.mockResolvedValue(detail);
    const res = { success: vi.fn(), error: vi.fn() };

    UserController.getLearnerActivityForAdmin(
      {
        params: { userId: 'user-1' },
        query: { start: '2026-01-01', end: '2026-01-31' },
      } as never,
      res as never,
      vi.fn() as never
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(getLearnerActivityForAdmin).toHaveBeenCalledWith(
      'user-1',
      '2026-01-01',
      '2026-01-31'
    );
    expect(res.success).toHaveBeenCalledWith(detail);
  });

  it('uses a 30-day range ending today when no detail dates are given', async () => {
    getLearnerActivityForAdmin.mockResolvedValue({ status: 'ok' });
    const res = { success: vi.fn(), error: vi.fn() };

    UserController.getLearnerActivityForAdmin(
      { params: { userId: 'user-1' }, query: {} } as never,
      res as never,
      vi.fn() as never
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    const today = new Date().toISOString().slice(0, 10);
    const expectedStart = new Date(Date.parse(`${today}T00:00:00Z`) - 29 * 86_400_000)
      .toISOString()
      .slice(0, 10);
    expect(getLearnerActivityForAdmin).toHaveBeenCalledWith(
      'user-1',
      expectedStart,
      today
    );
  });

  it('accepts an inclusive 366-day detail range', async () => {
    getLearnerActivityForAdmin.mockResolvedValue({ status: 'ok' });
    const res = { success: vi.fn(), error: vi.fn() };

    UserController.getLearnerActivityForAdmin(
      {
        params: { userId: 'user-1' },
        query: { start: '2025-08-05', end: '2026-08-05' },
      } as never,
      res as never,
      vi.fn() as never
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(getLearnerActivityForAdmin).toHaveBeenCalledWith(
      'user-1',
      '2025-08-05',
      '2026-08-05'
    );
    expect(res.error).not.toHaveBeenCalled();
  });

  it('rejects a 367-day detail range', async () => {
    const res = { success: vi.fn(), error: vi.fn() };

    UserController.getLearnerActivityForAdmin(
      {
        params: { userId: 'user-1' },
        query: { start: '2025-08-04', end: '2026-08-05' },
      } as never,
      res as never,
      vi.fn() as never
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(res.error).toHaveBeenCalledWith(
      '时间跨度不能超过 366 天',
      'INVALID_ACTIVITY_RANGE',
      400
    );
    expect(getLearnerActivityForAdmin).not.toHaveBeenCalled();
  });

  it('rejects an inverted range without querying analytics', async () => {
    const res = { success: vi.fn(), error: vi.fn() };

    UserController.getLearnerActivityForAdmin(
      {
        params: { userId: 'user-1' },
        query: { start: '2026-01-31', end: '2026-01-01' },
      } as never,
      res as never,
      vi.fn() as never
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(res.error).toHaveBeenCalledWith(
      expect.any(String),
      'INVALID_ACTIVITY_RANGE',
      400
    );
    expect(getLearnerActivityForAdmin).not.toHaveBeenCalled();
  });

  it('returns a sanitized gateway error when the learner query fails', async () => {
    getLearnerActivityForAdmin.mockRejectedValue(new PostHogAnalyticsError());
    const res = { success: vi.fn(), error: vi.fn() };

    UserController.getLearnerActivityForAdmin(
      { params: { userId: 'user-1' }, query: {} } as never,
      res as never,
      vi.fn() as never
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(res.error).toHaveBeenCalledWith(
      '行为数据查询失败，请稍后重试',
      'POSTHOG_QUERY_FAILED',
      502
    );
  });
});
