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

const range7 = { start: '2026-07-26', end: '2026-08-01' };
const range30 = { start: '2026-07-03', end: '2026-08-01' };

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

  it('queries the range that the caller asked for', async () => {
    const service = await loadService();

    await service.getPublicActivity(range30, null);

    expect(getPublicActivitySnapshot).toHaveBeenCalledWith('2026-07-03', '2026-08-01');
  });

  it('publishes only the top 10 learners, as stable anonymous codes', async () => {
    const service = await loadService();

    const result = await service.getPublicActivity(range7, null);
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

    const first = await service.getPublicActivity(range7, null);
    const second = await service.getPublicActivity(range7, null);
    const codes = first.top_learners.map((learner) => learner.code);

    expect(new Set(codes).size).toBe(codes.length);
    expect(second.top_learners.map((learner) => learner.code)).toEqual(codes);
  });

  it('reports a signed-in student their own rank even outside the top 10', async () => {
    const service = await loadService();

    const result = await service.getPublicActivity(range7, 'user-12');

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

    const result = await service.getPublicActivity(range7, 'user-2');

    expect(result.viewer?.rank).toBe(2);
    expect(result.top_learners[1].code).toBe(result.viewer?.code);
  });

  it('returns no viewer block for anonymous visitors or unseen students', async () => {
    const service = await loadService();

    expect((await service.getPublicActivity(range7, null)).viewer).toBeNull();
    expect((await service.getPublicActivity(range7, 'nobody')).viewer).toBeNull();
  });

  it('serves the cached snapshot until the TTL expires', async () => {
    const service = await loadService();

    await service.getPublicActivity(range7, null);
    vi.setSystemTime(new Date('2026-08-01T09:39:00Z'));
    await service.getPublicActivity(range7, null);
    expect(getPublicActivitySnapshot).toHaveBeenCalledTimes(1);

    vi.setSystemTime(new Date('2026-08-01T09:41:00Z'));
    await service.getPublicActivity(range7, null);
    expect(getPublicActivitySnapshot).toHaveBeenCalledTimes(2);
  });

  it('serves an expired snapshot without waiting for the refresh', async () => {
    const service = await loadService();
    await service.getPublicActivity(range7, null);

    getPublicActivitySnapshot.mockReturnValue(new Promise(() => undefined));
    vi.setSystemTime(new Date('2026-08-01T09:41:00Z'));

    // A blocking refresh would never settle here.
    const result = await service.getPublicActivity(range7, null);
    expect(result.generated_at).toBe('2026-08-01T02:00:00.000Z');
    expect(getPublicActivitySnapshot).toHaveBeenCalledTimes(2);
  });

  it('derives each viewer from the shared snapshot instead of caching their rank', async () => {
    const service = await loadService();

    const anonymous = await service.getPublicActivity(range7, null);
    const student = await service.getPublicActivity(range7, 'user-12');

    expect(anonymous.viewer).toBeNull();
    expect(student.viewer?.rank).toBe(12);
    expect(getPublicActivitySnapshot).toHaveBeenCalledTimes(1);
  });

  it('caches each range separately', async () => {
    const service = await loadService();

    await service.getPublicActivity(range7, null);
    await service.getPublicActivity(range30, null);

    expect(getPublicActivitySnapshot).toHaveBeenCalledTimes(2);
  });

  it('evicts the oldest range once the cache is full, so callers cannot grow it forever', async () => {
    const service = await loadService();
    const day = (index: number) =>
      new Date(Date.UTC(2026, 0, 1) + index * 86_400_000).toISOString().slice(0, 10);

    // 33 distinct ranges against a 32-entry cache: the first one is evicted.
    for (let index = 0; index < 33; index += 1) {
      await service.getPublicActivity({ start: day(index), end: '2026-08-01' }, null);
    }
    expect(getPublicActivitySnapshot).toHaveBeenCalledTimes(33);

    await service.getPublicActivity({ start: day(0), end: '2026-08-01' }, null);
    expect(getPublicActivitySnapshot).toHaveBeenCalledTimes(34);

    // ...while a range still in the cache is served without another upstream hit.
    await service.getPublicActivity({ start: day(32), end: '2026-08-01' }, null);
    expect(getPublicActivitySnapshot).toHaveBeenCalledTimes(34);
  });

  it('collapses concurrent misses into a single upstream refresh', async () => {
    const service = await loadService();

    await Promise.all([
      service.getPublicActivity(range7, null),
      service.getPublicActivity(range7, null),
      service.getPublicActivity(range7, 'user-1'),
    ]);

    expect(getPublicActivitySnapshot).toHaveBeenCalledTimes(1);
  });

  it('serves the stale snapshot when a refresh fails', async () => {
    const service = await loadService();
    await service.getPublicActivity(range7, null);

    getPublicActivitySnapshot.mockRejectedValue(new Error('upstream down'));
    vi.setSystemTime(new Date('2026-08-01T09:41:00Z'));

    const result = await service.getPublicActivity(range7, null);
    expect(result.summary).toEqual({
      active_learners: 12,
      pageviews: 240,
      learning_actions: 36,
    });
  });

  it('propagates the failure when there is no snapshot to fall back on', async () => {
    const service = await loadService();
    getPublicActivitySnapshot.mockRejectedValue(new Error('upstream down'));

    await expect(service.getPublicActivity(range7, null)).rejects.toThrow('upstream down');
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

    const result = await service.getPublicActivity(range7, 'user-1');

    expect(result.status).toBe('disabled');
    expect(result.top_learners).toEqual([]);
    expect(result.viewer).toBeNull();
  });
});
