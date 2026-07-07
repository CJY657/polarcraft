import type { Stats } from 'fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockCourseModel, mockManagedUploadCleanupService, mockFsStatSync } = vi.hoisted(() => ({
  mockCourseModel: {
    getCourseById: vi.fn(),
    getMainSlide: vi.fn(),
    getMediaByCourse: vi.fn(),
    getHyperlinksByCourse: vi.fn(),
    getMediaById: vi.fn(),
    getMediaByIds: vi.fn(),
    createCourse: vi.fn(),
    createMedia: vi.fn(),
    deleteMediaBatch: vi.fn(),
  },
  mockManagedUploadCleanupService: {
    cleanupUrls: vi.fn(),
  },
  mockFsStatSync: vi.fn(),
}));

vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs');
  mockFsStatSync.mockImplementation((...args: Parameters<typeof actual.statSync>) =>
    actual.statSync(...args)
  );

  return {
    ...actual,
    default: {
      ...actual,
      statSync: mockFsStatSync,
    },
    statSync: mockFsStatSync,
  };
});

vi.mock('../models/course.model.js', () => ({
  CourseModel: mockCourseModel,
}));

vi.mock('../services/managed-upload-cleanup.service.js', () => ({
  ManagedUploadCleanupService: mockManagedUploadCleanupService,
}));

import { CourseController } from './course.controller.js';

const now = new Date('2026-06-28T00:00:00.000Z');

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

describe('CourseController knowledge tags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('defaults untagged legacy course data to foundation in responses', async () => {
    mockCourseModel.getCourseById.mockResolvedValue({
      id: 'course-legacy',
      unit_id: 'unit-1',
      title_zh: '冰洲石实验',
      title_en: null,
      description_zh: null,
      description_en: null,
      cover_image: null,
      color: '#0ea5e9',
      sort_order: 0,
      created_at: now,
      updated_at: now,
    });
    mockCourseModel.getMainSlide.mockResolvedValue({
      id: 'slide-1',
      course_id: 'course-legacy',
      url: '/courses/unit1/legacy.pdf',
      title_zh: '主课件',
      title_en: null,
      created_at: now,
      updated_at: now,
    });
    mockCourseModel.getMediaByCourse.mockResolvedValue([
      {
        id: 'media-1',
        course_id: 'course-legacy',
        type: 'image',
        url: '/uploads/unit-1/image/a.png',
        preview_pdf_url: null,
        title_zh: '图片',
        title_en: null,
        duration: null,
        sort_order: 0,
        created_at: now,
        updated_at: now,
      },
    ]);
    mockCourseModel.getHyperlinksByCourse.mockResolvedValue([]);

    const req = {
      params: { id: 'course-legacy' },
    };
    const res = createResponse();

    await invokeHandler(CourseController.getCourse, req, res);

    expect(res.success).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'course-legacy',
        knowledgeTag: 'foundation',
        mainSlide: expect.objectContaining({ knowledgeTag: 'foundation' }),
        media: [expect.objectContaining({ knowledgeTag: 'foundation' })],
      })
    );
  });

  it('creates media with the parent course tag when no media tag is supplied', async () => {
    let receivedInput: unknown = null;

    mockCourseModel.getCourseById.mockResolvedValue({
      id: 'course-device',
      unit_id: 'unit-1',
      title_zh: '缪勒显微镜',
      title_en: null,
      description_zh: null,
      description_en: null,
      cover_image: null,
      color: '#14b8a6',
      knowledge_tag: 'optical_device',
      sort_order: 0,
      created_at: now,
      updated_at: now,
    });
    mockCourseModel.createMedia.mockImplementation((_courseId: string, input: unknown) => {
      receivedInput = input;
      return Promise.resolve('media-device');
    });
    mockCourseModel.getMediaById.mockResolvedValue({
      id: 'media-device',
      course_id: 'course-device',
      type: 'video',
      url: 'https://example-cos.example.com/device.mp4',
      preview_pdf_url: null,
      title_zh: '设备视频',
      title_en: null,
      knowledge_tag: 'optical_device',
      duration: null,
      sort_order: 0,
      created_at: now,
      updated_at: now,
    });

    const req = {
      params: { id: 'course-device' },
      body: {
        type: 'video',
        url: 'https://example-cos.example.com/device.mp4',
        title_zh: '设备视频',
      },
      user: { username: 'admin' },
    };
    const res = createResponse();

    await invokeHandler(CourseController.createMedia, req, res);

    expect(receivedInput).toEqual(
      expect.objectContaining({
        knowledgeTag: 'optical_device',
      })
    );
    expect(res.success).toHaveBeenCalledWith(
      expect.objectContaining({ knowledgeTag: 'optical_device' }),
      '媒体资源创建成功',
      201
    );
  });

  it('rejects invalid knowledge tags when creating a course', async () => {
    const req = {
      body: {
        unitId: 'unit-1',
        title_zh: '测试实验',
        knowledgeTag: 'device',
      },
      user: { username: 'admin' },
    };
    const res = createResponse();

    await invokeHandler(CourseController.createCourse, req, res);

    expect(res.error).toHaveBeenCalledWith('知识分类无效', 'VALIDATION_ERROR', 400);
    expect(mockCourseModel.createCourse).not.toHaveBeenCalled();
  });
});

describe('CourseController resource downloads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('downloads an existing main slide with an attachment filename', async () => {
    mockFsStatSync.mockReturnValueOnce({
      isFile: () => true,
    } as Stats);
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
