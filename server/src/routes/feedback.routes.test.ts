import { describe, expect, it, vi } from 'vitest';
import fs from 'fs/promises';

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
    feedbackImageUpload: vi.fn(passthroughMiddleware),
    createUploadMiddleware: vi.fn(() => ({
      single: vi.fn(() => vi.fn(passthroughMiddleware)),
    })),
    handleUploadError: vi.fn(),
    cleanupUrls: vi.fn(),
    create: vi.fn((_req, res) => {
      res.status(201).json({ route: 'create' });
    }),
    list: vi.fn((_req, res) => {
      res.status(200).json({ route: 'list' });
    }),
    remove: vi.fn((_req, res) => {
      res.status(200).json({ route: 'remove' });
    }),
    listPublic: vi.fn((_req, res) => {
      res.status(200).json({ route: 'listPublic' });
    }),
    setVisibility: vi.fn((_req, res) => {
      res.status(200).json({ route: 'setVisibility' });
    }),
  };
});

vi.mock('../controllers/feedback.controller.js', () => ({
  FeedbackController: {
    create: doubles.create,
    list: doubles.list,
    remove: doubles.remove,
    listPublic: doubles.listPublic,
    setVisibility: doubles.setVisibility,
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

vi.mock('../middleware/upload.middleware.js', () => ({
  createUploadMiddleware: doubles.createUploadMiddleware,
  handleUploadError: doubles.handleUploadError,
}));

vi.mock('../services/managed-upload-cleanup.service.js', () => ({
  ManagedUploadCleanupService: { cleanupUrls: doubles.cleanupUrls },
}));

vi.mock('../utils/managed-upload-url.util.js', () => ({
  getManagedUploadUrlForFile: vi.fn(() => '/uploads/courses/feedback/image/test.png'),
}));

vi.mock('../middleware/validation.middleware.js', () => ({
  validateCreateFeedback: doubles.validateCreateFeedback,
}));

import feedbackRoutes, {
  hasValidFeedbackImageSignature,
  validateFeedbackImageContent,
} from './feedback.routes.js';

function getRoute(method: 'delete' | 'get' | 'patch' | 'post', path?: string) {
  return feedbackRoutes.stack
    .map((layer) => (layer as MockedLayer).route)
    .find(
      (route) =>
        Boolean(route?.methods?.[method]) && (path === undefined || route?.path === path),
    ) as MockedRoute | undefined;
}

/** Layer index of `authenticate`, which every gated route must sit after. */
function authenticateIndex() {
  return (feedbackRoutes.stack as MockedLayer[]).findIndex(
    (layer) => layer.handle === doubles.authenticate,
  );
}

function routeIndex(route: MockedRoute | undefined) {
  return (feedbackRoutes.stack as MockedLayer[]).findIndex((layer) => layer.route === route);
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
    expect(doubles.createUploadMiddleware).toHaveBeenCalledWith(
      'image',
      expect.objectContaining({
        storageScope: 'feedback',
        maxFileSize: 5 * 1024 * 1024,
        maxFields: 10,
        maxFieldSize: 16 * 1024,
        maxFiles: 1,
        maxParts: 12,
        mimeExtensionPairs: {
          'image/jpeg': ['.jpg', '.jpeg'],
          'image/png': ['.png'],
          'image/webp': ['.webp'],
        },
        requireMimeAndExtension: true,
      }),
    );
  });

  it('accepts only matching JPEG, PNG, and WebP file signatures', () => {
    expect(
      hasValidFeedbackImageSignature(
        Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
        'image/jpeg',
      ),
    ).toBe(true);
    expect(
      hasValidFeedbackImageSignature(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        'image/png',
      ),
    ).toBe(true);
    expect(
      hasValidFeedbackImageSignature(
        Buffer.from('RIFF1234WEBP', 'ascii'),
        'image/webp',
      ),
    ).toBe(true);
    expect(hasValidFeedbackImageSignature(Buffer.from('pixels'), 'image/png')).toBe(false);
    expect(
      hasValidFeedbackImageSignature(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        'image/jpeg',
      ),
    ).toBe(false);
  });

  it('forwards cleanup failures when reading an uploaded image also fails', async () => {
    const readError = new Error('read failed');
    const cleanupError = new Error('unlink failed');
    vi.spyOn(fs, 'open').mockRejectedValueOnce(readError);
    const next = vi.fn();

    await validateFeedbackImageContent(
      { file: { path: '/tmp/missing.png', mimetype: 'image/png' } } as never,
      {
        locals: {
          cleanupRejectedUpload: vi.fn().mockRejectedValue(cleanupError),
        },
      } as never,
      next,
    );

    expect(next).toHaveBeenCalledWith(cleanupError);
  });

  it('keeps feedback listing behind auth plus admin checks', () => {
    const getRouteLayer = getRoute('get', '/');

    expect(getRouteLayer?.path).toBe('/');

    const handlers = getRouteLayer?.stack.map((layer) => layer.handle) ?? [];
    expect(handlers).toContain(doubles.requireAdmin);
    expect(handlers.at(-1)).toBe(doubles.list);

    expect(authenticateIndex()).toBeGreaterThan(-1);
    expect(routeIndex(getRouteLayer)).toBeGreaterThan(-1);
    expect(authenticateIndex()).toBeLessThan(routeIndex(getRouteLayer));
  });

  it('opens the public wall to any signed-in user but not to anonymous ones', () => {
    const publicRoute = getRoute('get', '/public');

    expect(publicRoute?.path).toBe('/public');

    const handlers = publicRoute?.stack.map((layer) => layer.handle) ?? [];
    // The whole point: gated by authenticate, NOT by requireAdmin.
    expect(handlers).not.toContain(doubles.requireAdmin);
    expect(handlers.at(-1)).toBe(doubles.listPublic);

    expect(authenticateIndex()).toBeGreaterThan(-1);
    expect(routeIndex(publicRoute)).toBeGreaterThan(-1);
    expect(authenticateIndex()).toBeLessThan(routeIndex(publicRoute));
  });

  it('is declared before the admin listing so /public never falls through to it', () => {
    expect(routeIndex(getRoute('get', '/public'))).toBeLessThan(
      routeIndex(getRoute('get', '/')),
    );
  });

  it('keeps hiding feedback behind auth plus admin checks', () => {
    const visibilityRoute = getRoute('patch', '/:id/visibility');

    expect(visibilityRoute?.path).toBe('/:id/visibility');

    const handlers = visibilityRoute?.stack.map((layer) => layer.handle) ?? [];
    expect(handlers).toContain(doubles.requireAdmin);
    expect(handlers.at(-1)).toBe(doubles.setVisibility);

    expect(authenticateIndex()).toBeGreaterThan(-1);
    expect(routeIndex(visibilityRoute)).toBeGreaterThan(-1);
    expect(authenticateIndex()).toBeLessThan(routeIndex(visibilityRoute));
  });

  it('keeps feedback deletion behind auth plus admin checks', () => {
    const deleteRoute = getRoute('delete');

    expect(deleteRoute?.path).toBe('/:id');

    const handlers = deleteRoute?.stack.map((layer) => layer.handle) ?? [];
    expect(handlers).toContain(doubles.requireAdmin);
    expect(handlers.at(-1)).toBe(doubles.remove);

    expect(authenticateIndex()).toBeGreaterThan(-1);
    expect(routeIndex(deleteRoute)).toBeGreaterThan(-1);
    expect(authenticateIndex()).toBeLessThan(routeIndex(deleteRoute));
  });
});
