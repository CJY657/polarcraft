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
import { createSwrCache } from '../utils/swr-cache.js';

const CACHE_TTL_MS = 40 * 60 * 1000;
const PUBLIC_LEADERBOARD_SIZE = 10;
/** Ranges are caller-chosen, so the cache needs a ceiling. */
const MAX_CACHED_RANGES = 32;

/** Raw snapshots only — the viewer's rank and codes are derived per request. */
const snapshots = createSwrCache<PublicActivitySnapshot>(
  'public activity',
  CACHE_TTL_MS,
  MAX_CACHED_RANGES
);

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

export class PublicStatsService {
  /**
   * Public payload: top 10 anonymized learners plus, for a signed-in student,
   * their own code and rank (which may sit outside the top 10).
   */
  static async getPublicActivity(
    range: ActivityDateRange,
    viewerUserId: string | null
  ): Promise<PublicActivityResponse> {
    const snapshot = await snapshots(`${range.start}:${range.end}`, () =>
      PostHogService.getPublicActivitySnapshot(range.start, range.end)
    );
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
