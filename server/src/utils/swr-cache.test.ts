import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./logger.js', () => ({
  logger: { warn: vi.fn(), error: vi.fn() },
}));

import { createSwrCache } from './swr-cache.js';

const TTL = 20 * 60 * 1000;

describe('createSwrCache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-01T09:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('serves a fresh entry without calling the loader again', async () => {
    const cache = createSwrCache<string>('test', TTL, 4);
    const load = vi.fn().mockResolvedValue('first');

    expect(await cache('k', load)).toBe('first');
    vi.setSystemTime(new Date('2026-08-01T09:19:00Z'));
    expect(await cache('k', load)).toBe('first');
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('returns the stale value immediately and refreshes in the background', async () => {
    const cache = createSwrCache<string>('test', TTL, 4);
    let resolveRefresh: (value: string) => void = () => undefined;
    const load = vi
      .fn()
      .mockResolvedValueOnce('first')
      .mockImplementationOnce(
        () => new Promise<string>((resolve) => {
          resolveRefresh = resolve;
        })
      );

    await cache('k', load);
    vi.setSystemTime(new Date('2026-08-01T09:21:00Z'));

    // The refresh is still pending, so a blocking implementation would hang here.
    expect(await cache('k', load)).toBe('first');
    expect(load).toHaveBeenCalledTimes(2);

    resolveRefresh('second');
    await vi.waitFor(async () => expect(await cache('k', load)).toBe('second'));
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('collapses concurrent misses into a single load', async () => {
    const cache = createSwrCache<string>('test', TTL, 4);
    const load = vi.fn().mockResolvedValue('value');

    const results = await Promise.all([cache('k', load), cache('k', load), cache('k', load)]);

    expect(results).toEqual(['value', 'value', 'value']);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('propagates the failure when a key has never been loaded', async () => {
    const cache = createSwrCache<string>('test', TTL, 4);
    const load = vi.fn().mockRejectedValue(new Error('upstream down'));

    await expect(cache('k', load)).rejects.toThrow('upstream down');
  });

  it('keeps the previous value when a background refresh fails', async () => {
    const cache = createSwrCache<string>('test', TTL, 4);
    const load = vi
      .fn()
      .mockResolvedValueOnce('first')
      .mockRejectedValue(new Error('upstream down'));

    await cache('k', load);
    vi.setSystemTime(new Date('2026-08-01T09:21:00Z'));

    expect(await cache('k', load)).toBe('first');
    await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(2));
    expect(await cache('k', load)).toBe('first');
  });

  it('keys entries independently', async () => {
    const cache = createSwrCache<string>('test', TTL, 4);
    const load = vi.fn(async (value: string) => value);

    expect(await cache('a', () => load('a'))).toBe('a');
    expect(await cache('b', () => load('b'))).toBe('b');
    expect(await cache('a', () => load('a'))).toBe('a');
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('evicts the least recently used key once full', async () => {
    const cache = createSwrCache<string>('test', TTL, 2);
    const load = vi.fn(async (value: string) => value);

    await cache('a', () => load('a'));
    await cache('b', () => load('b'));
    await cache('a', () => load('a')); // touch: 'b' is now the least recently used
    await cache('c', () => load('c'));
    expect(load).toHaveBeenCalledTimes(3);

    await cache('a', () => load('a'));
    expect(load).toHaveBeenCalledTimes(3);
    await cache('b', () => load('b'));
    expect(load).toHaveBeenCalledTimes(4);
  });
});
