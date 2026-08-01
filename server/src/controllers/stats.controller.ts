/**
 * Stats Controller
 * 公开统计控制器
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware.js';
import { PostHogAnalyticsError } from '../services/posthog.service.js';
import { PublicStatsService } from '../services/public-stats.service.js';
import { resolveActivityDateRange } from '../utils/activity-range.util.js';

/** Tighter than the admin range: this endpoint is public and hits the upstream. */
const PUBLIC_ACTIVITY_RANGE = { defaultDays: 7, maxSpanDays: 90 };

export class StatsController {
  /** Public learning activity — no authentication required. */
  static getPublicActivity = asyncHandler(async (req: Request, res: Response) => {
    const range = resolveActivityDateRange(
      req.query.start,
      req.query.end,
      PUBLIC_ACTIVITY_RANGE
    );
    if ('error' in range) {
      res.error(range.error, 'INVALID_STATS_RANGE', 400);
      return;
    }

    // Only students get a personal rank; admins are excluded from the stats.
    const viewerUserId = req.user?.role === 'user' ? req.user.sub : null;

    try {
      res.success(await PublicStatsService.getPublicActivity(range, viewerUserId));
    } catch (error) {
      if (error instanceof PostHogAnalyticsError) {
        res.error(error.message, error.code, error.statusCode);
        return;
      }

      throw error;
    }
  });
}
