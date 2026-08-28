import { beforeEach, describe, expect, it, vi } from 'vitest';

const { model, cleanupUrls, loggerInfo } = vi.hoisted(() => ({
  model: {
    create: vi.fn(),
    getById: vi.fn(),
    deleteById: vi.fn(),
    list: vi.fn(),
    count: vi.fn(),
  },
  cleanupUrls: vi.fn(),
  loggerInfo: vi.fn(),
}));

vi.mock('../models/feedback.model.js', () => ({
  FeedbackModel: model,
}));

vi.mock('./managed-upload-cleanup.service.js', () => ({
  ManagedUploadCleanupService: { cleanupUrls },
}));

vi.mock('../utils/logger.js', () => ({
  logger: { info: loggerInfo },
}));

import { FeedbackService } from './feedback.service.js';

const storedFeedback = {
  id: 'feedback-1',
  category: 'product' as const,
  subject: '建议增加截图反馈',
  content: '截图能够帮助管理员更快定位显示问题。',
  course_id: null,
  course_title: null,
  source_page: 'feedback-page',
  page_path: '/feedback',
  contact_name: null,
  contact_email: null,
  image_url: '/uploads/courses/feedback/image/screenshot.png',
  user_id: null,
  username: null,
  user_role: null,
  recipient_email: null,
  email_status: 'not_configured' as const,
  email_sent_at: null,
  ip_address: null,
  user_agent: null,
  created_at: new Date('2026-08-27T00:00:00.000Z'),
};

describe('FeedbackService image lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanupUrls.mockResolvedValue(undefined);
  });

  it('persists the optional managed image URL', async () => {
    model.create.mockResolvedValue(storedFeedback);

    await FeedbackService.submitFeedback({
      category: 'product',
      subject: storedFeedback.subject,
      content: storedFeedback.content,
      image_url: storedFeedback.image_url,
    });

    expect(model.create).toHaveBeenCalledWith(
      expect.objectContaining({ image_url: storedFeedback.image_url }),
    );
  });

  it('normalizes legacy records without an image field for admin listing', async () => {
    const { image_url: _imageUrl, ...legacyFeedback } = storedFeedback;
    model.list.mockResolvedValue([legacyFeedback]);
    model.count.mockResolvedValue(1);

    const result = await FeedbackService.listFeedback();

    expect(result.items[0]?.image_url).toBeNull();
  });

  it('removes the managed image after deleting its feedback record', async () => {
    model.getById.mockResolvedValue(storedFeedback);
    model.deleteById.mockResolvedValue(true);

    await expect(FeedbackService.deleteFeedback('feedback-1')).resolves.toBe(true);

    expect(cleanupUrls).toHaveBeenCalledWith([storedFeedback.image_url], {
      reason: 'feedback-delete',
    });
  });

  it('does not delete or clean files when the feedback record is missing', async () => {
    model.getById.mockResolvedValue(null);

    await expect(FeedbackService.deleteFeedback('missing-feedback')).resolves.toBe(false);

    expect(model.deleteById).not.toHaveBeenCalled();
    expect(cleanupUrls).not.toHaveBeenCalled();
  });
});

describe('FeedbackService public visibility on create', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    model.create.mockResolvedValue(storedFeedback);
  });

  const baseInput = {
    category: 'product' as const,
    subject: storedFeedback.subject,
    content: storedFeedback.content,
  };

  it('publishes a signed-in submission by default', async () => {
    await FeedbackService.submitFeedback({ ...baseInput, user_id: 'user-1' });

    expect(model.create).toHaveBeenCalledWith(
      expect.objectContaining({ is_public: true }),
    );
  });

  it('keeps a signed-in submission private when the submitter opted out', async () => {
    await FeedbackService.submitFeedback({
      ...baseInput,
      user_id: 'user-1',
      is_public: false,
    });

    expect(model.create).toHaveBeenCalledWith(
      expect.objectContaining({ is_public: false }),
    );
  });

  it('never publishes an anonymous submission, even when it asks to be public', async () => {
    await FeedbackService.submitFeedback({ ...baseInput, is_public: true });

    expect(model.create).toHaveBeenCalledWith(
      expect.objectContaining({ is_public: false }),
    );
  });
});
