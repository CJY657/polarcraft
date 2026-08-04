/**
 * Bounded stale-while-revalidate cache
 * 有界的 stale-while-revalidate 缓存
 *
 * A fresh entry is returned as is. An expired one is returned immediately while
 * a single background refresh runs, so only the first-ever load for a key ever
 * waits on the upstream. A failed refresh keeps the previous value until the
 * entry is evicted or the process restarts.
 *
 * Process-local by design: caches reset on restart and are not shared across
 * replicas. ponytail: enough for the single-process deployment; reach for a
 * shared store only when a second replica exists.
 */

import { logger } from './logger.js';

type Entry<T> = { value: T; expiresAt: number };

export function createSwrCache<T>(name: string, ttlMs: number, maxEntries: number) {
  const entries = new Map<string, Entry<T>>();
  const inFlight = new Map<string, Promise<T>>();

  function refresh(key: string, load: () => Promise<T>): Promise<T> {
    const request: Promise<T> = load()
      .then((value) => {
        entries.delete(key);
        entries.set(key, { value, expiresAt: Date.now() + ttlMs });
        if (entries.size > maxEntries) {
          entries.delete(entries.keys().next().value as string);
        }
        return value;
      })
      .catch((error: unknown) => {
        if (entries.has(key)) {
          logger.warn(`${name} refresh failed, keeping the previous snapshot`, {
            key,
            error: error instanceof Error ? error.message : String(error),
          });
        }
        throw error;
      })
      .finally(() => {
        if (inFlight.get(key) === request) {
          inFlight.delete(key);
        }
      });

    inFlight.set(key, request);
    // A background refresh may have no awaiting caller; keep Node quiet.
    void request.catch(() => undefined);
    return request;
  }

  return async function get(key: string, load: () => Promise<T>): Promise<T> {
    const cached = entries.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      // LRU touch: re-insert so the least recently *used* key is evicted first.
      entries.delete(key);
      entries.set(key, cached);
      return cached.value;
    }

    const request = inFlight.get(key) ?? refresh(key, load);
    // Expired: hand back the last good value and let the refresh land later.
    return cached ? cached.value : request;
  };
}
