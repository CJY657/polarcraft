/**
 * Stats Controller
 * 公开统计控制器
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware.js';
import { PostHogAnalyticsError } from '../services/posthog.service.js';
import { PublicStatsService } from '../services/public-stats.service.js';

export class StatsController {
  /** Public learning activity — no authentication required. */
  static getPublicActivity = asyncHandler(async (req: Request, res: Response) => {
    const window = req.query.window ?? '7d';
    if (window !== '7d' && window !== '30d') {
      res.error('时间范围仅支持 7d 或 30d', 'INVALID_STATS_WINDOW', 400);
      return;
    }

    // Only students get a personal rank; admins are excluded from the stats.
    const viewerUserId = req.user?.role === 'user' ? req.user.sub : null;

    try {
      res.success(await PublicStatsService.getPublicActivity(window, viewerUserId));
    } catch (error) {
      if (error instanceof PostHogAnalyticsError) {
        res.error(error.message, error.code, error.statusCode);
        return;
      }

      throw error;
    }
  });
}
