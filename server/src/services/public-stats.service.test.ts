import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { PublicActivitySnapshot } from '../types/stats.types.js';
import type { PublicStatsService as PublicStatsServiceType } from './public-stats.service.js';

vi.mock('../config/index.js', () => ({
  config: {
    security: { cookieSecret: 'test-cookie-secret' },
  },
}));

vi.mock('../utils/logger.js', () => ({
  logger: { warn: vi.fn(), error: vi.fn() },
}));

const { getPublicActivitySnapshot } = vi.hoisted(() => ({
  getPublicActivitySnapshot: vi.fn(),
}));

vi.mock('./posthog.service.js', () => ({
  PostHogService: { getPublicActivitySnapshot },
}));

function snapshot(overrides: Partial<PublicActivitySnapshot> = {}): PublicActivitySnapshot {
  return {
    status: 'ok',
    range: { start: '2026-07-26', end: '2026-08-01', days: 7 },
    generated_at: '2026-08-01T02:00:00.000Z',
    summary: { active_learners: 12, pageviews: 240, learning_actions: 36 },
    daily: [
      { date: '2026-08-01', active_learners: 5, pageviews: 40, learning_actions: 6 },
    ],
    top_pages: [{ path: '/experiments', pageviews: 42 }],
    learners: Array.from({ length: 12 }, (_, index) => ({
      user_id: `user-${index + 1}`,
      events: 100 - index,
      pageviews: 50 - index,
      learning_actions: 10,
    })),
    ...overrides,
  };
}

/** Fresh module registry per test: the snapshot cache lives in module scope. */
async function loadService(): Promise<typeof PublicStatsServiceType> {
  vi.resetModules();
  return (await import('./public-stats.service.js')).PublicStatsService;
}

describe('PublicStatsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-01T09:00:00Z'));
    getPublicActivitySnapshot.mockResolvedValue(snapshot());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('queries the window that the caller asked for', async () => {
    const service = await loadService();

    await service.getPublicActivity('30d', null);

    expect(getPublicActivitySnapshot).toHaveBeenCalledWith('2026-07-03', '2026-08-01');
  });

  it('publishes only the top 10 learners, as stable anonymous codes', async () => {
    const service = await loadService();

    const result = await service.getPublicActivity('7d', null);
    const serialized = JSON.stringify(result);

    expect(result.top_learners).toHaveLength(10);
    expect(result.top_learners[0]).toEqual({
      code: expect.stringMatching(/^[0-9A-F]{6}$/),
      events: 100,
      pageviews: 50,
      learning_actions: 10,
    });
    // Nothing that identifies a learner may reach the public payload.
    expect(serialized).not.toContain('user-1');
    expect(serialized).not.toContain('user_id');
    expect(serialized).not.toContain('username');
    expect(serialized).not.toContain('last_activity');
  });

  it('gives every learner a distinct code that is stable across requests', async () => {
    const service = await loadService();

    const first = await service.getPublicActivity('7d', null);
    const second = await service.getPublicActivity('7d', null);
    const codes = first.top_learners.map((learner) => learner.code);

    expect(new Set(codes).size).toBe(codes.length);
    expect(second.top_learners.map((learner) => learner.code)).toEqual(codes);
  });

  it('reports a signed-in student their own rank even outside the top 10', async () => {
    const service = await loadService();

    const result = await service.getPublicActivity('7d', 'user-12');

    expect(result.viewer).toEqual({
      code: expect.stringMatching(/^[0-9A-F]{6}$/),
      rank: 12,
      events: 89,
    });
    expect(result.top_learners.some((learner) => learner.code === result.viewer?.code)).toBe(
      false
    );
  });

  it('matches the viewer code against the leaderboard code for a ranked student', async () => {
    const service = await loadService();

    const result = await service.getPublicActivity('7d', 'user-2');

    expect(result.viewer?.rank).toBe(2);
    expect(result.top_learners[1].code).toBe(result.viewer?.code);
  });

  it('returns no viewer block for anonymous visitors or unseen students', async () => {
    const service = await loadService();

    expect((await service.getPublicActivity('7d', null)).viewer).toBeNull();
    expect((await service.getPublicActivity('7d', 'nobody')).viewer).toBeNull();
  });

  it('serves the cached snapshot until the TTL expires', async () => {
    const service = await loadService();

    await service.getPublicActivity('7d', null);
    vi.setSystemTime(new Date('2026-08-01T09:09:00Z'));
    await service.getPublicActivity('7d', null);
    expect(getPublicActivitySnapshot).toHaveBeenCalledTimes(1);

    vi.setSystemTime(new Date('2026-08-01T09:11:00Z'));
    await service.getPublicActivity('7d', null);
    expect(getPublicActivitySnapshot).toHaveBeenCalledTimes(2);
  });

  it('caches each window separately', async () => {
    const service = await loadService();

    await service.getPublicActivity('7d', null);
    await service.getPublicActivity('30d', null);

    expect(getPublicActivitySnapshot).toHaveBeenCalledTimes(2);
  });

  it('collapses concurrent misses into a single upstream refresh', async () => {
    const service = await loadService();

    await Promise.all([
      service.getPublicActivity('7d', null),
      service.getPublicActivity('7d', null),
      service.getPublicActivity('7d', 'user-1'),
    ]);

    expect(getPublicActivitySnapshot).toHaveBeenCalledTimes(1);
  });

  it('serves the stale snapshot when a refresh fails', async () => {
    const service = await loadService();
    await service.getPublicActivity('7d', null);

    getPublicActivitySnapshot.mockRejectedValue(new Error('upstream down'));
    vi.setSystemTime(new Date('2026-08-01T09:11:00Z'));

    const result = await service.getPublicActivity('7d', null);
    expect(result.summary).toEqual({
      active_learners: 12,
      pageviews: 240,
      learning_actions: 36,
    });
  });

  it('propagates the failure when there is no snapshot to fall back on', async () => {
    const service = await loadService();
    getPublicActivitySnapshot.mockRejectedValue(new Error('upstream down'));

    await expect(service.getPublicActivity('7d', null)).rejects.toThrow('upstream down');
  });

  it('passes the disabled status through with an empty payload', async () => {
    const service = await loadService();
    getPublicActivitySnapshot.mockResolvedValue(
      snapshot({
        status: 'disabled',
        summary: null,
        daily: [],
        top_pages: [],
        learners: [],
      })
    );

    const result = await service.getPublicActivity('7d', 'user-1');

    expect(result.status).toBe('disabled');
    expect(result.top_learners).toEqual([]);
    expect(result.viewer).toBeNull();
  });
});
