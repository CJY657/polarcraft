import { beforeEach, describe, expect, it, vi } from 'vitest';

const { deleteRequest, ensureApiSuccess } = vi.hoisted(() => ({
  deleteRequest: vi.fn(),
  ensureApiSuccess: vi.fn(),
}));

vi.mock('./api', () => ({
  api: {
    delete: deleteRequest,
  },
  ensureApiSuccess,
}));

import { feedbackApi } from './feedback.service';

describe('feedbackApi.deleteFeedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes the encoded feedback ID and validates the API response', async () => {
    const response = { success: true };
    deleteRequest.mockResolvedValue(response);

    await expect(feedbackApi.deleteFeedback('feedback/1')).resolves.toBeUndefined();

    expect(deleteRequest).toHaveBeenCalledWith('/api/feedback/feedback%2F1');
    expect(ensureApiSuccess).toHaveBeenCalledWith(response, '删除反馈失败');
  });
});
