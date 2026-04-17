import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockCourseModel, mockManagedUploadCleanupService } = vi.hoisted(() => ({
  mockCourseModel: {
    getMainSlide: vi.fn(),
    getMediaById: vi.fn(),
    getMediaByIds: vi.fn(),
    deleteMediaBatch: vi.fn(),
  },
  mockManagedUploadCleanupService: {
    cleanupUrls: vi.fn(),
  },
}));

vi.mock('../models/course.model.js', () => ({
  CourseModel: mockCourseModel,
}));

vi.mock('../services/managed-upload-cleanup.service.js', () => ({
  ManagedUploadCleanupService: mockManagedUploadCleanupService,
}));

import { CourseController } from './course.controller.js';

function createResponse() {
  return {
    success: vi.fn(),
    error: vi.fn(),
    download: vi.fn(),
    redirect: vi.fn(),
  };
}

async function invokeHandler(
  handler: (req: any, res: any, next: (error?: unknown) => void) => void,
  req: any,
  res: ReturnType<typeof createResponse>
) {
  const next = vi.fn();
  handler(req, res, next);
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(next).not.toHaveBeenCalled();
}

describe('CourseController.deleteMediaBatch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects an empty mediaIds payload', async () => {
    const req = {
      body: { mediaIds: [] },
      user: { username: 'admin' },
    };
    const res = createResponse();

    await invokeHandler(CourseController.deleteMediaBatch, req, res);

    expect(res.error).toHaveBeenCalledWith('请提供要删除的媒体资源', 'VALIDATION_ERROR', 400);
    expect(mockCourseModel.getMediaByIds).not.toHaveBeenCalled();
  });

  it('returns not found when no media exists', async () => {
    mockCourseModel.getMediaByIds.mockResolvedValue([]);

    const req = {
      body: { mediaIds: ['media-1', 'media-2'] },
      user: { username: 'admin' },
    };
    const res = createResponse();

    await invokeHandler(CourseController.deleteMediaBatch, req, res);

    expect(mockCourseModel.getMediaByIds).toHaveBeenCalledWith(['media-1', 'media-2']);
    expect(res.error).toHaveBeenCalledWith('媒体资源不存在', 'NOT_FOUND', 404);
    expect(mockCourseModel.deleteMediaBatch).not.toHaveBeenCalled();
  });

  it('deletes existing media and cleans up managed uploads', async () => {
    mockCourseModel.getMediaByIds.mockResolvedValue([
      {
        id: 'media-1',
        url: '/uploads/unit-1/image/a.png',
        preview_pdf_url: null,
      },
      {
        id: 'media-2',
        url: '/uploads/unit-1/video/b.mp4',
        preview_pdf_url: '/uploads/unit-1/pptx/b-preview.pdf',
      },
    ]);
    mockCourseModel.deleteMediaBatch.mockResolvedValue(2);
    mockManagedUploadCleanupService.cleanupUrls.mockResolvedValue(undefined);

    const req = {
      body: { mediaIds: ['media-1', 'media-2', 'media-1'] },
      user: { username: 'admin' },
    };
    const res = createResponse();

    await invokeHandler(CourseController.deleteMediaBatch, req, res);

    expect(mockCourseModel.deleteMediaBatch).toHaveBeenCalledWith(['media-1', 'media-2']);
    expect(mockManagedUploadCleanupService.cleanupUrls).toHaveBeenCalledWith(
      [
        '/uploads/unit-1/image/a.png',
        null,
        '/uploads/unit-1/video/b.mp4',
        '/uploads/unit-1/pptx/b-preview.pdf',
      ],
      {
        reason: 'course.media.batch-delete:media-1,media-2',
      }
    );
    expect(res.success).toHaveBeenCalledWith({ deletedCount: 2 }, '已删除 2 个媒体资源');
  });
});

describe('CourseController resource downloads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('downloads an existing main slide with an attachment filename', async () => {
    mockCourseModel.getMainSlide.mockResolvedValue({
      id: 'slide-1',
      course_id: 'course1',
      url: '/courses/unit1/第一单元——冰洲石和布儒斯特实验介绍.pdf',
      title_zh: '主课件',
      title_en: null,
    });

    const req = {
      params: { id: 'course1' },
      user: { username: 'admin' },
    };
    const res = createResponse();

    await invokeHandler(CourseController.downloadMainSlide, req, res);

    expect(mockCourseModel.getMainSlide).toHaveBeenCalledWith('course1');
    expect(res.download).toHaveBeenCalledWith(
      expect.stringContaining('/courses/unit1/第一单元——冰洲石和布儒斯特实验介绍.pdf'),
      '主课件.pdf'
    );
    expect(res.error).not.toHaveBeenCalled();
  });

  it('returns not found when a media download target does not exist', async () => {
    mockCourseModel.getMediaById.mockResolvedValue(null);

    const req = {
      params: { mediaId: 'missing-media' },
      user: { username: 'admin' },
    };
    const res = createResponse();

    await invokeHandler(CourseController.downloadMedia, req, res);

    expect(mockCourseModel.getMediaById).toHaveBeenCalledWith('missing-media');
    expect(res.error).toHaveBeenCalledWith('媒体资源不存在', 'NOT_FOUND', 404);
    expect(res.download).not.toHaveBeenCalled();
  });
});
