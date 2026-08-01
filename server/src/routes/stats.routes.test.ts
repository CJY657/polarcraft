import { describe, expect, it, vi } from 'vitest';

type MockedRoute = {
  path: string;
  methods: Record<string, boolean>;
  stack: Array<{ handle: unknown }>;
};

const doubles = vi.hoisted(() => {
  const passthroughMiddleware = (_req: unknown, _res: unknown, next: () => void) => {
    next();
  };

  return {
    optionalAuth: vi.fn(passthroughMiddleware),
    authenticate: vi.fn(passthroughMiddleware),
    getPublicActivity: vi.fn((_req, res) => {
      res.status(200).json({ route: 'public-activity' });
    }),
  };
});

vi.mock('../controllers/stats.controller.js', () => ({
  StatsController: { getPublicActivity: doubles.getPublicActivity },
}));

vi.mock('../middleware/auth.middleware.js', () => ({
  optionalAuth: doubles.optionalAuth,
  authenticate: doubles.authenticate,
}));

import statsRoutes from './stats.routes.js';

describe('stats.routes', () => {
  it('exposes the public activity endpoint without requiring a login', () => {
    const route = statsRoutes.stack
      .map((layer) => (layer as { route?: MockedRoute }).route)
      .find((candidate) => candidate?.path === '/activity');
    const handlers = route?.stack.map((layer) => layer.handle);

    expect(route?.methods.get).toBe(true);
    expect(handlers).toContain(doubles.optionalAuth);
    expect(handlers).not.toContain(doubles.authenticate);
    expect(route?.stack.at(-1)?.handle).toBe(doubles.getPublicActivity);
  });

  it('mounts no router-level authentication middleware', () => {
    const routerMiddleware = statsRoutes.stack
      .filter((layer) => !(layer as { route?: unknown }).route)
      .map((layer) => (layer as unknown as { handle: unknown }).handle);

    expect(routerMiddleware).not.toContain(doubles.authenticate);
  });
});
