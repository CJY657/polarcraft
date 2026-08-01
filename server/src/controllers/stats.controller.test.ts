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

  const today = new Date().toISOString().slice(0, 10);
  const daysAgo = (days: number) =>
    new Date(Date.parse(`${today}T00:00:00Z`) - days * 86_400_000).toISOString().slice(0, 10);

  it('defaults to the last 7 days for anonymous visitors', async () => {
    const { res } = invoke({ query: {} });
    await flush();

    expect(getPublicActivity).toHaveBeenCalledWith({ start: daysAgo(6), end: today }, null);
    expect(res.success).toHaveBeenCalledWith({ status: 'ok' });
  });

  it('accepts a custom start/end range', async () => {
    invoke({ query: { start: '2026-01-01', end: '2026-01-31' } });
    await flush();

    expect(getPublicActivity).toHaveBeenCalledWith(
      { start: '2026-01-01', end: '2026-01-31' },
      null
    );
  });

  it.each([
    [{ start: '2026-01-31', end: '2026-01-01' }],
    [{ start: '2026-01-01' }],
    [{ start: '01/01/2026', end: '2026-01-31' }],
    [{ start: '2026-01-01', end: '2999-01-01' }],
    // 92 days — past the tighter public cap.
    [{ start: '2026-01-01', end: '2026-04-02' }],
  ])('rejects an invalid range %j without querying', async (query) => {
    const { res } = invoke({ query });
    await flush();

    expect(res.error).toHaveBeenCalledWith(
      expect.any(String),
      'INVALID_STATS_RANGE',
      400
    );
    expect(getPublicActivity).not.toHaveBeenCalled();
  });

  it('passes a signed-in student through as the viewer', async () => {
    invoke({ query: {}, user: { sub: 'user-1', role: 'user' } });
    await flush();

    expect(getPublicActivity).toHaveBeenCalledWith(
      { start: daysAgo(6), end: today },
      'user-1'
    );
  });

  it('does not rank administrators, who are excluded from the stats', async () => {
    invoke({ query: {}, user: { sub: 'admin-1', role: 'admin' } });
    await flush();

    expect(getPublicActivity).toHaveBeenCalledWith({ start: daysAgo(6), end: today }, null);
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
