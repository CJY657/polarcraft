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
  PublicActivityWindow,
} from '../types/stats.types.js';
import { logger } from '../utils/logger.js';

const WINDOW_DAYS: Record<PublicActivityWindow, number> = { '7d': 7, '30d': 30 };
const CACHE_TTL_MS = 10 * 60 * 1000;
const PUBLIC_LEADERBOARD_SIZE = 10;

type CacheEntry = { expiresAt: number; snapshot: PublicActivitySnapshot };

const cache = new Map<PublicActivityWindow, CacheEntry>();
const inFlight = new Map<PublicActivityWindow, Promise<PublicActivitySnapshot>>();

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

function windowRange(window: PublicActivityWindow): { start: string; end: string } {
  const todayTimestamp = Date.parse(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`);
  return {
    start: new Date(todayTimestamp - (WINDOW_DAYS[window] - 1) * 86_400_000)
      .toISOString()
      .slice(0, 10),
    end: new Date(todayTimestamp).toISOString().slice(0, 10),
  };
}

async function refresh(window: PublicActivityWindow): Promise<PublicActivitySnapshot> {
  try {
    const { start, end } = windowRange(window);
    const snapshot = await PostHogService.getPublicActivitySnapshot(start, end);
    cache.set(window, { expiresAt: Date.now() + CACHE_TTL_MS, snapshot });
    return snapshot;
  } finally {
    inFlight.delete(window);
  }
}

async function loadSnapshot(window: PublicActivityWindow): Promise<PublicActivitySnapshot> {
  const cached = cache.get(window);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.snapshot;
  }

  let request = inFlight.get(window);
  if (!request) {
    request = refresh(window);
    inFlight.set(window, request);
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
      window,
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
    window: PublicActivityWindow,
    viewerUserId: string | null
  ): Promise<PublicActivityResponse> {
    const snapshot = await loadSnapshot(window);
    const viewerIndex = viewerUserId
      ? snapshot.learners.findIndex((learner) => learner.user_id === viewerUserId)
      : -1;

    return {
      status: snapshot.status,
      window,
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
