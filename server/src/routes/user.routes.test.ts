import { describe, expect, it, vi } from 'vitest';

type MockedRoute = {
  path: string;
  methods: Record<string, boolean>;
  stack: Array<{ handle: unknown }>;
};

const doubles = vi.hoisted(() => {
  const passthroughMiddleware = (_req: unknown, _res: unknown, next: (error?: unknown) => void) => {
    next();
  };

  return {
    passthroughMiddleware,
    authenticate: vi.fn(passthroughMiddleware),
    requireAdmin: vi.fn(passthroughMiddleware),
    getUserStatsForAdmin: vi.fn((_req, res) => {
      res.status(200).json({ route: 'stats' });
    }),
    listUsersForAdmin: vi.fn((_req, res) => {
      res.status(200).json({ route: 'list' });
    }),
    getPostHogAnalyticsForAdmin: vi.fn((_req, res) => {
      res.status(200).json({ route: 'posthog-analytics' });
    }),
    getActivityDashboardForAdmin: vi.fn((_req, res) => {
      res.status(200).json({ route: 'activity' });
    }),
    getUserDetailForAdmin: vi.fn((_req, res) => {
      res.status(200).json({ route: 'details' });
    }),
  };
});

vi.mock('../controllers/user.controller.js', () => ({
  UserController: {
    getProfile: doubles.passthroughMiddleware,
    updateProfile: doubles.passthroughMiddleware,
    changePassword: doubles.passthroughMiddleware,
    getSessions: doubles.passthroughMiddleware,
    logoutFromSession: doubles.passthroughMiddleware,
    logoutFromAllSessions: doubles.passthroughMiddleware,
    getUserStatsForAdmin: doubles.getUserStatsForAdmin,
    listUsersForAdmin: doubles.listUsersForAdmin,
    getPostHogAnalyticsForAdmin: doubles.getPostHogAnalyticsForAdmin,
    getActivityDashboardForAdmin: doubles.getActivityDashboardForAdmin,
    getUserDetailForAdmin: doubles.getUserDetailForAdmin,
  },
}));

vi.mock('../middleware/auth.middleware.js', () => ({
  authenticate: doubles.authenticate,
}));

vi.mock('../middleware/rbac.middleware.js', () => ({
  requireAdmin: doubles.requireAdmin,
}));

vi.mock('../middleware/validation.middleware.js', () => ({
  validateUpdateProfile: doubles.passthroughMiddleware,
  validateChangePassword: doubles.passthroughMiddleware,
  sessionIdParamValidation: doubles.passthroughMiddleware,
}));

import userRoutes from './user.routes.js';

function getRoute(path: string) {
  return userRoutes.stack
    .map((layer) => (layer as { route?: MockedRoute }).route)
    .find((route) => route?.path === path) as MockedRoute | undefined;
}

describe('user.routes admin endpoints', () => {
  it('protects admin user statistics, listing, and PostHog analytics routes with admin authorization', () => {
    const statsRoute = getRoute('/stats');
    const listRoute = getRoute('/');
    const analyticsRoute = getRoute('/:userId/posthog-analytics');
    const activityRoute = getRoute('/activity');
    const detailRoute = getRoute('/:userId/details');

    expect(statsRoute?.methods.get).toBe(true);
    expect(statsRoute?.stack.map((layer) => layer.handle)).toContain(doubles.requireAdmin);
    expect(statsRoute?.stack.at(-1)?.handle).toBe(doubles.getUserStatsForAdmin);

    expect(listRoute?.methods.get).toBe(true);
    expect(listRoute?.stack.map((layer) => layer.handle)).toContain(doubles.requireAdmin);
    expect(listRoute?.stack.at(-1)?.handle).toBe(doubles.listUsersForAdmin);

    expect(analyticsRoute?.methods.get).toBe(true);
    expect(analyticsRoute?.stack.map((layer) => layer.handle)).toContain(doubles.requireAdmin);
    expect(analyticsRoute?.stack.at(-1)?.handle).toBe(doubles.getPostHogAnalyticsForAdmin);

    expect(activityRoute?.methods.get).toBe(true);
    expect(activityRoute?.stack.map((layer) => layer.handle)).toContain(doubles.requireAdmin);
    expect(activityRoute?.stack.at(-1)?.handle).toBe(doubles.getActivityDashboardForAdmin);

    expect(detailRoute?.methods.get).toBe(true);
    expect(detailRoute?.stack.map((layer) => layer.handle)).toContain(doubles.requireAdmin);
    expect(detailRoute?.stack.at(-1)?.handle).toBe(doubles.getUserDetailForAdmin);
  });
});
