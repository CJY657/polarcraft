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
    optionalAuth: vi.fn(passthroughMiddleware),
    feedbackRateLimiter: vi.fn(passthroughMiddleware),
    requireAdmin: vi.fn(passthroughMiddleware),
    validateCreateFeedback: vi.fn(passthroughMiddleware),
    create: vi.fn((_req, res) => {
      res.status(201).json({ route: 'create' });
    }),
    list: vi.fn((_req, res) => {
      res.status(200).json({ route: 'list' });
    }),
  };
});

vi.mock('../controllers/feedback.controller.js', () => ({
  FeedbackController: {
    create: doubles.create,
    list: doubles.list,
  },
}));

vi.mock('../middleware/auth.middleware.js', () => ({
  authenticate: doubles.authenticate,
  optionalAuth: doubles.optionalAuth,
}));

vi.mock('../middleware/rate-limit.middleware.js', () => ({
  feedbackRateLimiter: doubles.feedbackRateLimiter,
}));

vi.mock('../middleware/rbac.middleware.js', () => ({
  requireAdmin: doubles.requireAdmin,
}));

vi.mock('../middleware/validation.middleware.js', () => ({
  validateCreateFeedback: doubles.validateCreateFeedback,
}));

import feedbackRoutes from './feedback.routes.js';

function getRoute(method: 'get' | 'post') {
  return feedbackRoutes.stack
    .map((layer) => (layer as { route?: MockedRoute }).route)
    .find((route) => Boolean(route?.methods?.[method])) as MockedRoute | undefined;
}

describe('feedback.routes', () => {
  it('requires authentication before accepting feedback submissions', () => {
    const postRoute = getRoute('post');

    expect(postRoute?.path).toBe('/');

    const handlers = postRoute?.stack.map((layer) => layer.handle) ?? [];
    expect(handlers).toContain(doubles.feedbackRateLimiter);
    expect(handlers).toContain(doubles.authenticate);
    expect(handlers).toContain(doubles.validateCreateFeedback);
    expect(handlers).not.toContain(doubles.optionalAuth);
    expect(handlers.at(-1)).toBe(doubles.create);
  });

  it('keeps feedback listing behind auth plus admin checks', () => {
    const getRouteLayer = getRoute('get');

    expect(getRouteLayer?.path).toBe('/');

    const handlers = getRouteLayer?.stack.map((layer) => layer.handle) ?? [];
    expect(handlers).toContain(doubles.requireAdmin);
    expect(handlers.at(-1)).toBe(doubles.list);
  });
});
