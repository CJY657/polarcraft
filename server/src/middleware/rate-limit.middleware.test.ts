import { afterEach, describe, expect, it, vi } from 'vitest';
import { leadershipTransferRateLimiter } from './rate-limit.middleware.js';

const limiter = leadershipTransferRateLimiter as typeof leadershipTransferRateLimiter & {
  resetKey: (key: string) => Promise<void> | void;
};

function createResponse() {
  const response: any = {
    headersSent: false,
    statusCode: 200,
    setHeader: vi.fn(),
    status: vi.fn((statusCode: number) => {
      response.statusCode = statusCode;
      return response;
    }),
    json: vi.fn(() => response),
  };
  return response;
}

async function invoke(userId: string) {
  const response = createResponse();
  const next = vi.fn();
  await leadershipTransferRateLimiter(
    { user: { sub: userId } } as any,
    response,
    next
  );
  return { response, next };
}

describe('leadershipTransferRateLimiter', () => {
  const userId = 'rate-limit-user';

  afterEach(async () => {
    await limiter.resetKey(`user:${userId}`);
  });

  it('allows ten nominations per authenticated user per hour and rejects the eleventh', async () => {
    for (let index = 0; index < 10; index += 1) {
      const { next, response } = await invoke(userId);
      expect(next).toHaveBeenCalledOnce();
      expect(response.json).not.toHaveBeenCalled();
    }

    const { next, response } = await invoke(userId);
    expect(next).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(429);
    expect(response.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: '组长转让提名过于频繁，请稍后再试',
      },
    });
  });
});
