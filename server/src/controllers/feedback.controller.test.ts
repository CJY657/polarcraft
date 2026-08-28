import { beforeEach, describe, expect, it, vi } from 'vitest';

const { submitFeedback, deleteFeedback, setFeedbackVisibility, cleanupUrls, loggerError } =
  vi.hoisted(() => ({
    submitFeedback: vi.fn(),
    deleteFeedback: vi.fn(),
    setFeedbackVisibility: vi.fn(),
    cleanupUrls: vi.fn(),
    loggerError: vi.fn(),
  }));

vi.mock('../services/feedback.service.js', () => ({
  FeedbackService: {
    submitFeedback,
    deleteFeedback,
    setFeedbackVisibility,
  },
}));

vi.mock('../services/managed-upload-cleanup.service.js', () => ({
  ManagedUploadCleanupService: {
    cleanupUrls,
  },
}));

vi.mock('../config/upload.config.js', () => ({
  uploadConfig: {
    uploadDir: '/tmp/polarcraft-feedback-test',
    publicUrlPrefix: '/uploads/courses',
  },
}));

vi.mock('../utils/logger.js', () => ({
  logger: {
    error: loggerError,
  },
}));

import { FeedbackController } from './feedback.controller.js';
import { uploadConfig } from '../config/upload.config.js';

function createResponse() {
  return {
    success: vi.fn(),
    error: vi.fn(),
    locals: {},
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

describe('FeedbackController.create', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    submitFeedback.mockResolvedValue({ id: 'feedback-1' });
    cleanupUrls.mockResolvedValue(undefined);
  });

  it('stores the server-generated managed URL for an uploaded feedback image', async () => {
    const res = createResponse();
    const imagePath = `${uploadConfig.uploadDir}/feedback/image/screenshot.png`;

    await FeedbackController.create(
      {
        body: {
          category: 'product',
          subject: '建议增加截图反馈',
          content: '截图能够帮助管理员更快定位显示问题。',
        },
        file: { path: imagePath },
        headers: {},
        socket: {},
      } as never,
      res as never,
    );

    expect(submitFeedback).toHaveBeenCalledWith(
      expect.objectContaining({
        image_url: `${uploadConfig.publicUrlPrefix}/feedback/image/screenshot.png`,
      }),
    );
    expect(res.success).toHaveBeenCalledWith({ id: 'feedback-1' }, '反馈已提交', 201);
  });

  it('cleans the uploaded image when feedback persistence fails', async () => {
    const failure = new Error('database unavailable');
    submitFeedback.mockRejectedValue(failure);
    const res = createResponse();
    const imagePath = `${uploadConfig.uploadDir}/feedback/image/screenshot.png`;

    await FeedbackController.create(
      {
        body: {
          category: 'product',
          subject: '建议增加截图反馈',
          content: '截图能够帮助管理员更快定位显示问题。',
        },
        file: { path: imagePath },
        headers: {},
        socket: {},
      } as never,
      res as never,
    );

    expect(cleanupUrls).toHaveBeenCalledWith(
      [`${uploadConfig.publicUrlPrefix}/feedback/image/screenshot.png`],
      { reason: 'feedback-create-failed' },
    );
    expect(res.error).toHaveBeenCalledWith(
      '提交反馈失败，请稍后再试',
      'SERVER_ERROR',
      500,
    );
  });
});

describe('FeedbackController.create public flag parsing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    submitFeedback.mockResolvedValue({ id: 'feedback-1' });
  });

  const baseBody = {
    category: 'product',
    subject: '建议增加公开反馈墙',
    content: '让同学们能看到彼此提过的问题，避免重复反馈。',
  };

  async function submitWith(body: Record<string, unknown>) {
    const res = createResponse();
    await FeedbackController.create(
      { body: { ...baseBody, ...body }, headers: {}, ip: '203.0.113.7', socket: {} } as never,
      res as never,
    );
    return submitFeedback.mock.calls[0]?.[0];
  }

  it('defaults to public when the field is absent', async () => {
    expect(await submitWith({})).toMatchObject({ is_public: true });
  });

  // multipart 传输会把布尔值变成字符串——这一条挡住的正是「带图片提交时
  // 取消勾选被静默忽略」的回归。
  it('honours the opt-out sent as a multipart string', async () => {
    expect(await submitWith({ isPublic: 'false' })).toMatchObject({ is_public: false });
  });

  it('honours the opt-out sent as a JSON boolean', async () => {
    expect(await submitWith({ isPublic: false })).toMatchObject({ is_public: false });
  });

  it('treats an explicit opt-in as public in both transports', async () => {
    expect(await submitWith({ isPublic: 'true' })).toMatchObject({ is_public: true });
    vi.clearAllMocks();
    submitFeedback.mockResolvedValue({ id: 'feedback-1' });
    expect(await submitWith({ isPublic: true })).toMatchObject({ is_public: true });
  });
});

describe('FeedbackController.setVisibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hides the record and reports success', async () => {
    setFeedbackVisibility.mockResolvedValue(true);
    const res = createResponse();

    await FeedbackController.setVisibility(
      { params: { id: 'feedback-1' }, body: { is_public: false } } as never,
      res as never,
    );

    expect(setFeedbackVisibility).toHaveBeenCalledWith('feedback-1', false);
    expect(res.success).toHaveBeenCalledWith(null, '反馈已隐藏', 200);
  });

  it('rejects a non-boolean visibility value', async () => {
    const res = createResponse();

    await FeedbackController.setVisibility(
      { params: { id: 'feedback-1' }, body: { is_public: 'false' } } as never,
      res as never,
    );

    expect(setFeedbackVisibility).not.toHaveBeenCalled();
    expect(res.error).toHaveBeenCalledWith('可见性参数无效', 'INVALID_VISIBILITY', 400);
  });

  it('returns 404 when the record does not exist', async () => {
    setFeedbackVisibility.mockResolvedValue(false);
    const res = createResponse();

    await FeedbackController.setVisibility(
      { params: { id: 'missing' }, body: { is_public: true } } as never,
      res as never,
    );

    expect(res.error).toHaveBeenCalledWith('反馈记录不存在', 'FEEDBACK_NOT_FOUND', 404);
  });
});
