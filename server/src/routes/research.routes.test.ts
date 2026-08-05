import { describe, expect, it, vi } from 'vitest';

type MockedRoute = {
  path: string;
  methods: Record<string, boolean>;
  stack: Array<{ handle: unknown }>;
};

const doubles = vi.hoisted(() => {
  const passthrough = (_req: unknown, _res: unknown, next: (error?: unknown) => void) => next();
  return {
    passthrough,
    leadershipTransferRateLimiter: vi.fn(passthrough),
    nominateProjectLeader: vi.fn(passthrough),
    cancelProjectLeadershipTransfer: vi.fn(passthrough),
    acceptProjectLeadershipTransfer: vi.fn(passthrough),
    declineProjectLeadershipTransfer: vi.fn(passthrough),
    reorderProjectEvidence: vi.fn(passthrough),
  };
});

vi.mock('../controllers/research.controller.js', () => ({
  ResearchController: new Proxy({}, {
    get(_target, property: string) {
      if (property in doubles) {
        return doubles[property as keyof typeof doubles];
      }
      return doubles.passthrough;
    },
  }),
}));

vi.mock('../controllers/upload.controller.js', () => ({
  UploadController: { uploadFile: doubles.passthrough },
}));

vi.mock('../middleware/auth.middleware.js', () => ({
  authenticate: doubles.passthrough,
}));

vi.mock('../middleware/rate-limit.middleware.js', () => ({
  leadershipTransferRateLimiter: doubles.leadershipTransferRateLimiter,
  researchAgentRateLimiter: doubles.passthrough,
}));

vi.mock('../middleware/upload.middleware.js', () => ({
  createUploadMiddleware: () => ({ single: () => doubles.passthrough }),
  handleUploadError: vi.fn(),
}));

vi.mock('../services/project-access.service.js', () => ({
  ProjectAccessService: { getProjectAccess: vi.fn() },
}));

vi.mock('../utils/logger.js', () => ({
  logger: { info: vi.fn(), error: vi.fn() },
}));

import researchRoutes from './research.routes.js';

function findRoute(method: string, path: string): MockedRoute | undefined {
  return researchRoutes.stack
    .map((layer) => (layer as { route?: MockedRoute }).route)
    .find((route) => Boolean(route?.methods?.[method]) && route?.path === path);
}

describe('research leadership transfer routes', () => {
  it('applies the nomination limiter before the nomination controller', () => {
    const route = findRoute('put', '/projects/:id/leadership-transfer');

    expect(route?.stack.map((layer) => layer.handle)).toEqual([
      doubles.leadershipTransferRateLimiter,
      doubles.nominateProjectLeader,
    ]);
  });

  it('wires cancel, accept, and decline to separate lifecycle endpoints', () => {
    expect(
      findRoute('delete', '/projects/:id/leadership-transfer/:transferId')?.stack.at(-1)?.handle
    ).toBe(doubles.cancelProjectLeadershipTransfer);
    expect(
      findRoute('post', '/projects/:id/leadership-transfer/:transferId/accept')?.stack.at(-1)?.handle
    ).toBe(doubles.acceptProjectLeadershipTransfer);
    expect(
      findRoute('post', '/projects/:id/leadership-transfer/:transferId/decline')?.stack.at(-1)?.handle
    ).toBe(doubles.declineProjectLeadershipTransfer);
  });
});

describe('research evidence routes', () => {
  it('wires the explicit order endpoint before the evidence id endpoint', () => {
    expect(
      findRoute('put', '/projects/:projectId/evidence/order')?.stack.at(-1)?.handle
    ).toBe(doubles.reorderProjectEvidence);
  });
});
