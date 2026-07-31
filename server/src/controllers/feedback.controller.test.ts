import { beforeEach, describe, expect, it, vi } from 'vitest';

const { deleteFeedback, loggerError } = vi.hoisted(() => ({
  deleteFeedback: vi.fn(),
  loggerError: vi.fn(),
}));

vi.mock('../services/feedback.service.js', () => ({
  FeedbackService: {
    deleteFeedback,
  },
}));

vi.mock('../utils/logger.js', () => ({
  logger: {
    error: loggerError,
  },
}));

import { FeedbackController } from './feedback.controller.js';

function createResponse() {
  return {
    success: vi.fn(),
    error: vi.fn(),
  };
}

describe('FeedbackController.remove', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 after deleting the requested feedback record', async () => {
    deleteFeedback.mockResolvedValue(true);
    const res = createResponse();

    await FeedbackController.remove(
      { params: { id: 'feedback-1' } } as never,
      res as never,
    );

    expect(deleteFeedback).toHaveBeenCalledWith('feedback-1');
    expect(res.success).toHaveBeenCalledWith(null, '反馈已永久删除', 200);
    expect(res.error).not.toHaveBeenCalled();
  });

  it('returns FEEDBACK_NOT_FOUND when the record does not exist', async () => {
    deleteFeedback.mockResolvedValue(false);
    const res = createResponse();

    await FeedbackController.remove(
      { params: { id: 'missing-feedback' } } as never,
      res as never,
    );

    expect(res.error).toHaveBeenCalledWith('反馈记录不存在', 'FEEDBACK_NOT_FOUND', 404);
    expect(res.success).not.toHaveBeenCalled();
  });

  it('returns a sanitized server error when deletion fails', async () => {
    const failure = new Error('database unavailable');
    deleteFeedback.mockRejectedValue(failure);
    const res = createResponse();

    await FeedbackController.remove(
      { params: { id: 'feedback-1' } } as never,
      res as never,
    );

    expect(loggerError).toHaveBeenCalledWith('Delete feedback error:', failure);
    expect(res.error).toHaveBeenCalledWith(
      '删除反馈失败，请稍后再试',
      'SERVER_ERROR',
      500,
    );
    expect(res.success).not.toHaveBeenCalled();
  });
});
