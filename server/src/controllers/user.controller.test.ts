import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getPostHogAnalyticsForAdmin } = vi.hoisted(() => ({
  getPostHogAnalyticsForAdmin: vi.fn(),
}));

vi.mock('../services/user.service.js', () => ({
  UserService: {
    getPostHogAnalyticsForAdmin,
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

    expect(res.error).toHaveBeenCalledWith(
      'PostHog 查询失败，请稍后重试',
      'POSTHOG_QUERY_FAILED',
      502
    );
    expect(next).not.toHaveBeenCalled();
  });
});
