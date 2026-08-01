import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getPublicActivity } = vi.hoisted(() => ({
  getPublicActivity: vi.fn(),
}));

vi.mock('../services/public-stats.service.js', () => ({
  PublicStatsService: { getPublicActivity },
}));

vi.mock('../utils/response.util.js', () => ({
  setupResponseHelpers: vi.fn(),
}));

import { PostHogAnalyticsError } from '../services/posthog.service.js';
import { StatsController } from './stats.controller.js';

function invoke(req: unknown) {
  const res = { success: vi.fn(), error: vi.fn() };
  const next = vi.fn();
  StatsController.getPublicActivity(req as never, res as never, next as never);
  return { res, next };
}

async function flush() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('StatsController.getPublicActivity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getPublicActivity.mockResolvedValue({ status: 'ok' });
  });

  it('defaults to the 7-day window for anonymous visitors', async () => {
    const { res } = invoke({ query: {} });
    await flush();

    expect(getPublicActivity).toHaveBeenCalledWith('7d', null);
    expect(res.success).toHaveBeenCalledWith({ status: 'ok' });
  });

  it('accepts the 30-day window', async () => {
    invoke({ query: { window: '30d' } });
    await flush();

    expect(getPublicActivity).toHaveBeenCalledWith('30d', null);
  });

  it('rejects an unsupported window without querying', async () => {
    const { res } = invoke({ query: { window: '90d' } });
    await flush();

    expect(res.error).toHaveBeenCalledWith(
      '时间范围仅支持 7d 或 30d',
      'INVALID_STATS_WINDOW',
      400
    );
    expect(getPublicActivity).not.toHaveBeenCalled();
  });

  it('passes a signed-in student through as the viewer', async () => {
    invoke({ query: {}, user: { sub: 'user-1', role: 'user' } });
    await flush();

    expect(getPublicActivity).toHaveBeenCalledWith('7d', 'user-1');
  });

  it('does not rank administrators, who are excluded from the stats', async () => {
    invoke({ query: {}, user: { sub: 'admin-1', role: 'admin' } });
    await flush();

    expect(getPublicActivity).toHaveBeenCalledWith('7d', null);
  });

  it('returns a sanitized gateway error when the upstream query fails', async () => {
    getPublicActivity.mockRejectedValue(new PostHogAnalyticsError());

    const { res, next } = invoke({ query: {} });
    await flush();

    expect(res.error).toHaveBeenCalledWith(
      '行为数据查询失败，请稍后重试',
      'POSTHOG_QUERY_FAILED',
      502
    );
    expect(next).not.toHaveBeenCalled();
  });
});
