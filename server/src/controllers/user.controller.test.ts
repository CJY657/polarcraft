import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getPostHogAnalyticsForAdmin, getActivityDashboardForAdmin } = vi.hoisted(() => ({
  getPostHogAnalyticsForAdmin: vi.fn(),
  getActivityDashboardForAdmin: vi.fn(),
}));

vi.mock('../services/user.service.js', () => ({
  UserService: {
    getPostHogAnalyticsForAdmin,
    getActivityDashboardForAdmin,
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

  it('uses a 30-day range when days is omitted', async () => {
    const dashboard = { status: 'disabled', days: 30 };
    getActivityDashboardForAdmin.mockResolvedValue(dashboard);
    const res = { success: vi.fn(), error: vi.fn() };

    UserController.getActivityDashboardForAdmin(
      { query: {} } as never,
      res as never,
      vi.fn() as never
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(getActivityDashboardForAdmin).toHaveBeenCalledWith(30);
    expect(res.success).toHaveBeenCalledWith(dashboard);
  });

  it('passes an allowed explicit range to the service', async () => {
    getActivityDashboardForAdmin.mockResolvedValue({ status: 'ok', days: 90 });
    const res = { success: vi.fn(), error: vi.fn() };

    UserController.getActivityDashboardForAdmin(
      { query: { days: '90' } } as never,
      res as never,
      vi.fn() as never
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(getActivityDashboardForAdmin).toHaveBeenCalledWith(90);
  });

  it('rejects a present unsupported range without querying analytics', async () => {
    const res = { success: vi.fn(), error: vi.fn() };

    UserController.getActivityDashboardForAdmin(
      { query: { days: '31' } } as never,
      res as never,
      vi.fn() as never
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(res.error).toHaveBeenCalledWith(
      '时间范围仅支持 7、30 或 90 天',
      'INVALID_ACTIVITY_RANGE',
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
