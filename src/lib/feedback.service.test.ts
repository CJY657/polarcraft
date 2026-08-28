import { beforeEach, describe, expect, it, vi } from 'vitest';

const { deleteRequest, postRequest, uploadRequest, ensureApiSuccess } = vi.hoisted(() => ({
  deleteRequest: vi.fn(),
  postRequest: vi.fn(),
  uploadRequest: vi.fn(),
  ensureApiSuccess: vi.fn(),
}));

vi.mock('./api', () => ({
  api: {
    delete: deleteRequest,
    post: postRequest,
    upload: uploadRequest,
  },
  ensureApiSuccess,
}));

import { feedbackApi } from './feedback.service';

describe('feedbackApi.submit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps text-only feedback on the existing JSON request path', async () => {
    postRequest.mockResolvedValue({ success: true, data: { id: 'feedback-1' } });
    const input = {
      category: 'product' as const,
      subject: '建议增加图片反馈',
      content: '希望反馈表单可以继续支持纯文字提交。',
    };

    await expect(feedbackApi.submit(input)).resolves.toEqual({ id: 'feedback-1' });

    expect(postRequest).toHaveBeenCalledWith('/api/feedback', input);
    expect(uploadRequest).not.toHaveBeenCalled();
  });

  it('uses the existing multipart client when an image is selected', async () => {
    uploadRequest.mockResolvedValue({ success: true, data: { id: 'feedback-2' } });
    const imageFile = { name: 'screenshot.png' } as File;

    await feedbackApi.submit({
      category: 'experiment',
      subject: '实验页面显示异常',
      content: '截图中可以看到实验结果区域没有正确显示。',
      courseId: 'course-1',
      contactEmail: undefined,
      imageFile,
    });

    expect(uploadRequest).toHaveBeenCalledWith('/api/feedback', imageFile, {
      category: 'experiment',
      subject: '实验页面显示异常',
      content: '截图中可以看到实验结果区域没有正确显示。',
      courseId: 'course-1',
    });
    expect(postRequest).not.toHaveBeenCalled();
  });
});

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
