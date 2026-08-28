import { beforeEach, describe, expect, it, vi } from 'vitest';

const { deleteRequest, getRequest, patchRequest, postRequest, uploadRequest, ensureApiSuccess } =
  vi.hoisted(() => ({
    deleteRequest: vi.fn(),
    getRequest: vi.fn(),
    patchRequest: vi.fn(),
    postRequest: vi.fn(),
    uploadRequest: vi.fn(),
    ensureApiSuccess: vi.fn(),
  }));

vi.mock('./api', () => ({
  api: {
    delete: deleteRequest,
    get: getRequest,
    patch: patchRequest,
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

  // 回归防线：api.upload 的调用方把非字符串字段过滤掉了，布尔 isPublic 会被
  // 静默丢弃，于是「带图片 + 取消勾选」的提交会变成公开且不报错。
  it('sends the opt-out as a string so multipart cannot drop it', async () => {
    uploadRequest.mockResolvedValue({ success: true, data: { id: 'feedback-3' } });
    const imageFile = { name: 'screenshot.png' } as File;

    await feedbackApi.submit({
      category: 'product',
      subject: '这条不要公开',
      content: '这条反馈涉及我的账号信息，请不要显示在公开墙上。',
      isPublic: false,
      imageFile,
    });

    expect(uploadRequest).toHaveBeenCalledWith(
      '/api/feedback',
      imageFile,
      expect.objectContaining({ isPublic: 'false' }),
    );
  });

  it('sends the opt-out as a string on the JSON path too', async () => {
    postRequest.mockResolvedValue({ success: true, data: { id: 'feedback-4' } });

    await feedbackApi.submit({
      category: 'product',
      subject: '这条也不要公开',
      content: '纯文字提交同样需要尊重取消勾选的选择。',
      isPublic: false,
    });

    expect(postRequest).toHaveBeenCalledWith(
      '/api/feedback',
      expect.objectContaining({ isPublic: 'false' }),
    );
  });

  it('omits the field entirely when the submitter did not choose', async () => {
    postRequest.mockResolvedValue({ success: true, data: { id: 'feedback-5' } });

    await feedbackApi.submit({
      category: 'product',
      subject: '没有显式选择',
      content: '未指定时交给服务端决定默认值，不要凭空发送。',
    });

    expect(postRequest.mock.calls[0]?.[1]).not.toHaveProperty('isPublic');
  });
});

describe('feedbackApi.listPublic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reads the wall from the public endpoint', async () => {
    getRequest.mockResolvedValue({ success: true, data: { items: [] } });

    await expect(feedbackApi.listPublic()).resolves.toEqual({ items: [] });

    expect(getRequest).toHaveBeenCalledWith('/api/feedback/public');
  });
});

describe('feedbackApi.setVisibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('patches the encoded feedback ID and validates the API response', async () => {
    const response = { success: true };
    patchRequest.mockResolvedValue(response);

    await expect(feedbackApi.setVisibility('feedback/1', false)).resolves.toBeUndefined();

    expect(patchRequest).toHaveBeenCalledWith('/api/feedback/feedback%2F1/visibility', {
      is_public: false,
    });
    expect(ensureApiSuccess).toHaveBeenCalledWith(response, '隐藏反馈失败');
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
