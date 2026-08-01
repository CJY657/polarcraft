/**
 * Public Stats Service
 * 公开学习热度服务
 *
 * Anonymizes the PostHog learner snapshot for the public /pulse page and
 * caches it, so a public route can never fan out to the upstream per request.
 */

import { createHmac } from 'node:crypto';
import { config } from '../config/index.js';
import { PostHogService } from './posthog.service.js';
import {
  PublicActivityResponse,
  PublicActivitySnapshot,
} from '../types/stats.types.js';
import type { ActivityDateRange } from '../utils/activity-range.util.js';
import { logger } from '../utils/logger.js';

const CACHE_TTL_MS = 10 * 60 * 1000;
const PUBLIC_LEADERBOARD_SIZE = 10;
/**
 * Ranges are caller-chosen now, so the cache needs a ceiling.
 * ponytail: insertion-order eviction, not true LRU — swap if 32 ever thrashes.
 */
const MAX_CACHED_RANGES = 32;

type CacheEntry = { expiresAt: number; snapshot: PublicActivitySnapshot };

const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<PublicActivitySnapshot>>();

/**
 * Stable, non-reversible display code for a learner (学员 #3FA2C1).
 * Rotating COOKIE_SECRET rotates every code — acceptable, nothing is stored.
 * Salted apart from any other HMAC so codes can't be joined against the user
 * ids that appear on public research pages.
 */
function anonymousCode(userId: string): string {
  return createHmac('sha256', `${config.security.cookieSecret}:public-stats`)
    .update(userId)
    .digest('hex')
    .slice(0, 6)
    .toUpperCase();
}

async function refresh(key: string, range: ActivityDateRange): Promise<PublicActivitySnapshot> {
  try {
    const snapshot = await PostHogService.getPublicActivitySnapshot(range.start, range.end);
    cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, snapshot });
    if (cache.size > MAX_CACHED_RANGES) {
      cache.delete(cache.keys().next().value as string);
    }
    return snapshot;
  } finally {
    inFlight.delete(key);
  }
}

async function loadSnapshot(range: ActivityDateRange): Promise<PublicActivitySnapshot> {
  const key = `${range.start}:${range.end}`;
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.snapshot;
  }

  let request = inFlight.get(key);
  if (!request) {
    request = refresh(key, range);
    inFlight.set(key, request);
    // The shared promise may be awaited by nobody else; keep Node quiet.
    void request.catch(() => undefined);
  }

  try {
    return await request;
  } catch (error) {
    if (!cached) {
      throw error;
    }
    logger.warn('Public activity refresh failed, serving the previous snapshot', {
      range: key,
      error: error instanceof Error ? error.message : String(error),
    });
    return cached.snapshot;
  }
}

export class PublicStatsService {
  /**
   * Public payload: top 10 anonymized learners plus, for a signed-in student,
   * their own code and rank (which may sit outside the top 10).
   */
  static async getPublicActivity(
    range: ActivityDateRange,
    viewerUserId: string | null
  ): Promise<PublicActivityResponse> {
    const snapshot = await loadSnapshot(range);
    const viewerIndex = viewerUserId
      ? snapshot.learners.findIndex((learner) => learner.user_id === viewerUserId)
      : -1;

    return {
      status: snapshot.status,
      range: snapshot.range,
      generated_at: snapshot.generated_at,
      summary: snapshot.summary,
      daily: snapshot.daily,
      top_pages: snapshot.top_pages,
      top_learners: snapshot.learners
        .slice(0, PUBLIC_LEADERBOARD_SIZE)
        .map((learner) => ({
          code: anonymousCode(learner.user_id),
          events: learner.events,
          pageviews: learner.pageviews,
          learning_actions: learner.learning_actions,
        })),
      viewer:
        viewerIndex < 0
          ? null
          : {
              code: anonymousCode(snapshot.learners[viewerIndex].user_id),
              rank: viewerIndex + 1,
              events: snapshot.learners[viewerIndex].events,
            },
    };
  }
}
