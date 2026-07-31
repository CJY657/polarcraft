import { describe, expect, it, vi } from 'vitest';

type MockedRoute = {
  path: string;
  methods: Record<string, boolean>;
  stack: Array<{ handle: unknown }>;
};

type MockedLayer = {
  handle: unknown;
  route?: MockedRoute;
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
    remove: vi.fn((_req, res) => {
      res.status(200).json({ route: 'remove' });
    }),
  };
});

vi.mock('../controllers/feedback.controller.js', () => ({
  FeedbackController: {
    create: doubles.create,
    list: doubles.list,
    remove: doubles.remove,
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

function getRoute(method: 'delete' | 'get' | 'post') {
  return feedbackRoutes.stack
    .map((layer) => (layer as MockedLayer).route)
    .find((route) => Boolean(route?.methods?.[method])) as MockedRoute | undefined;
}

describe('feedback.routes', () => {
  it('allows anonymous feedback submissions with optional auth metadata', () => {
    const postRoute = getRoute('post');

    expect(postRoute?.path).toBe('/');

    const handlers = postRoute?.stack.map((layer) => layer.handle) ?? [];
    expect(handlers).toContain(doubles.feedbackRateLimiter);
    expect(handlers).toContain(doubles.optionalAuth);
    expect(handlers).toContain(doubles.validateCreateFeedback);
    expect(handlers).not.toContain(doubles.authenticate);
    expect(handlers.at(-1)).toBe(doubles.create);
  });

  it('keeps feedback listing behind auth plus admin checks', () => {
    const getRouteLayer = getRoute('get');

    expect(getRouteLayer?.path).toBe('/');

    const handlers = getRouteLayer?.stack.map((layer) => layer.handle) ?? [];
    expect(handlers).toContain(doubles.requireAdmin);
    expect(handlers.at(-1)).toBe(doubles.list);

    const layers = feedbackRoutes.stack as MockedLayer[];
    const authIndex = layers.findIndex((layer) => layer.handle === doubles.authenticate);
    const getIndex = layers.findIndex((layer) => layer.route === getRouteLayer);

    expect(authIndex).toBeGreaterThan(-1);
    expect(getIndex).toBeGreaterThan(-1);
    expect(authIndex).toBeLessThan(getIndex);
  });

  it('keeps feedback deletion behind auth plus admin checks', () => {
    const deleteRoute = getRoute('delete');

    expect(deleteRoute?.path).toBe('/:id');

    const handlers = deleteRoute?.stack.map((layer) => layer.handle) ?? [];
    expect(handlers).toContain(doubles.requireAdmin);
    expect(handlers.at(-1)).toBe(doubles.remove);

    const layers = feedbackRoutes.stack as MockedLayer[];
    const authIndex = layers.findIndex((layer) => layer.handle === doubles.authenticate);
    const deleteIndex = layers.findIndex((layer) => layer.route === deleteRoute);

    expect(authIndex).toBeGreaterThan(-1);
    expect(deleteIndex).toBeGreaterThan(-1);
    expect(authIndex).toBeLessThan(deleteIndex);
  });
});
