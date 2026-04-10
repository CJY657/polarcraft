import { beforeEach, describe, expect, it, vi } from 'vitest';

type MockedDeleteRoute = {
  path: string;
  methods: Record<string, boolean>;
  stack: Array<{ handle: unknown }>;
};

const testDoubles = vi.hoisted(() => {
  const passthroughMiddleware = (_req: unknown, _res: unknown, next: (error?: unknown) => void) => {
    next();
  };

  return {
    passthroughMiddleware,
    deleteCourse: vi.fn((_req, res) => {
      res.status(418).json({ route: 'deleteCourse' });
    }),
    deleteMediaBatch: vi.fn((_req, res) => {
      res.status(200).json({ route: 'deleteMediaBatch' });
    }),
  };
});

vi.mock('../controllers/course.controller.js', () => ({
  CourseController: new Proxy(
    {},
    {
      get(_target, property: string) {
        if (property === 'deleteCourse') {
          return testDoubles.deleteCourse;
        }

        if (property === 'deleteMediaBatch') {
          return testDoubles.deleteMediaBatch;
        }

        return testDoubles.passthroughMiddleware;
      },
    }
  ),
}));

vi.mock('../controllers/upload.controller.js', () => ({
  UploadController: {
    uploadFile: testDoubles.passthroughMiddleware,
  },
}));

vi.mock('../middleware/auth.middleware.js', () => ({
  authenticate: testDoubles.passthroughMiddleware,
}));

vi.mock('../middleware/rate-limit.middleware.js', () => ({
  discussionRateLimiter: testDoubles.passthroughMiddleware,
}));

vi.mock('../middleware/rbac.middleware.js', () => ({
  requireAdmin: testDoubles.passthroughMiddleware,
}));

vi.mock('../middleware/upload.middleware.js', () => ({
  createUploadMiddleware: () => ({
    single: () => testDoubles.passthroughMiddleware,
  }),
  handleUploadError: vi.fn(),
}));

vi.mock('../middleware/validation.middleware.js', () => ({
  validateCreateCourseDiscussionComment: testDoubles.passthroughMiddleware,
}));

vi.mock('../models/course.model.js', () => ({
  CourseModel: {
    getCourseById: vi.fn(),
  },
}));

vi.mock('../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

import courseRoutes from './course.routes.js';

describe('course.routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('routes DELETE /media to batch deletion before the generic :id matcher', async () => {
    const deleteRoutes = courseRoutes.stack
      .map((layer) => (layer as { route?: MockedDeleteRoute }).route)
      .filter((route) => Boolean(route?.methods?.delete)) as MockedDeleteRoute[];

    const mediaDeleteIndex = deleteRoutes.findIndex((route) => route.path === '/media');
    const courseDeleteIndex = deleteRoutes.findIndex((route) => route.path === '/:id');

    expect(mediaDeleteIndex).toBeGreaterThanOrEqual(0);
    expect(courseDeleteIndex).toBeGreaterThanOrEqual(0);
    expect(mediaDeleteIndex).toBeLessThan(courseDeleteIndex);
    expect(deleteRoutes[mediaDeleteIndex]?.stack.at(-1)?.handle).toBe(testDoubles.deleteMediaBatch);
    expect(deleteRoutes[courseDeleteIndex]?.stack.at(-1)?.handle).toBe(testDoubles.deleteCourse);
  });
});
