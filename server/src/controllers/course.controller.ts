/**
 * Course Controller
 * 课程控制器
 *
 * Handles course system HTTP requests
 * 处理课程系统的 HTTP 请求
 */

import { Request, Response } from "express";
import { CourseModel } from "../models/course.model.js";
import { asyncHandler } from "../middleware/error.middleware.js";
import { ManagedUploadCleanupService } from "../services/managed-upload-cleanup.service.js";
import { logger } from "../utils/logger.js";
import type {
  CourseRow,
  MainSlideRow,
  MediaRow,
  HyperlinkRow,
  CreateCourseInput,
  UpdateCourseInput,
  CreateMainSlideInput,
  CreateMediaInput,
  UpdateMediaInput,
  CreateHyperlinkInput,
  UpdateHyperlinkInput,
} from "../types/course.types.js";

// ============================================================
// Helper Functions / 辅助函数
// ============================================================

/**
 * Transform course row to API response format
 */
function transformCourseRow(row: CourseRow) {
  return {
    id: row.id,
    unitId: row.unit_id,
    title: {
      "zh-CN": row.title_zh,
      "en-US": row.title_en || undefined,
    },
    description: {
      "zh-CN": row.description_zh || undefined,
      "en-US": row.description_en || undefined,
    },
    coverImage: row.cover_image || undefined,
    color: row.color,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Transform main slide row to API response format
 */
function transformMainSlideRow(row: MainSlideRow) {
  return {
    id: row.id,
    url: row.url,
    title: {
      "zh-CN": row.title_zh || undefined,
      "en-US": row.title_en || undefined,
    },
  };
}

/**
 * Transform media row to API response format
 */
function transformMediaRow(row: MediaRow) {
  return {
    id: row.id,
    type: row.type,
    url: row.url,
    previewPdfUrl: row.preview_pdf_url || undefined,
    title: {
      "zh-CN": row.title_zh,
      "en-US": row.title_en || undefined,
    },
    duration: row.duration || undefined,
    sortOrder: row.sort_order,
  };
}

/**
 * Transform hyperlink row to API response format
 */
function transformHyperlinkRow(row: HyperlinkRow) {
  return {
    id: row.id,
    sourceMediaId: row.source_media_id || undefined,
    page: row.page,
    x: row.x,
    y: row.y,
    width: row.width,
    height: row.height,
    targetMediaId: row.target_media_id,
  };
}

function normalizeCoverImageInput(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export class CourseController {
  // ============================================================
  // Courses / 课程
  // ============================================================

  /**
   * Get all courses
   * 获取所有课程
   */
  static getAllCourses = asyncHandler(async (req: Request, res: Response) => {
    const courses = await CourseModel.getAllCourses();

    // Get main slides, media, and hyperlinks for each course
    const coursesWithData = await Promise.all(
      courses.map(async (course) => {
        const mainSlide = await CourseModel.getMainSlide(course.id);
        const media = await CourseModel.getMediaByCourse(course.id);
        const hyperlinks = await CourseModel.getHyperlinksByCourse(course.id);

        return {
          ...transformCourseRow(course),
          mainSlide: mainSlide ? transformMainSlideRow(mainSlide) : undefined,
          media: media.map(transformMediaRow),
          hyperlinks: hyperlinks.map(transformHyperlinkRow),
        };
      })
    );

    res.success(coursesWithData);
  });

  /**
   * Get course by ID
   * 获取单个课程
   */
  static getCourse = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const course = await CourseModel.getCourseById(id);
    if (!course) {
      return res.error("课程不存在", "NOT_FOUND", 404);
    }

    const mainSlide = await CourseModel.getMainSlide(id);
    const media = await CourseModel.getMediaByCourse(id);
    const hyperlinks = await CourseModel.getHyperlinksByCourse(id);

    res.success({
      ...transformCourseRow(course),
      mainSlide: mainSlide ? transformMainSlideRow(mainSlide) : undefined,
      media: media.map(transformMediaRow),
      hyperlinks: hyperlinks.map(transformHyperlinkRow),
    });
  });

  /**
   * Create course
   * 创建课程
   */
  static createCourse = asyncHandler(async (req: Request, res: Response) => {
    const normalizedCoverImage = normalizeCoverImageInput(req.body.coverImage);
    if (req.body.coverImage !== undefined && normalizedCoverImage === undefined) {
      return res.error("封面图地址格式无效", "VALIDATION_ERROR", 400);
    }

    const data: CreateCourseInput = {
      ...req.body,
      unitId: typeof req.body.unitId === "string" ? req.body.unitId.trim() : req.body.unitId,
      title_zh: typeof req.body.title_zh === "string" ? req.body.title_zh.trim() : req.body.title_zh,
      coverImage: normalizedCoverImage,
    };

    if (!data.unitId || !data.title_zh) {
      return res.error("缺少必要字段", "VALIDATION_ERROR", 400);
    }

    const courseId = await CourseModel.createCourse(data);
    const course = await CourseModel.getCourseById(courseId);

    logger.info(`Course created by ${req.user!.username}: ${courseId}`);
    res.success(transformCourseRow(course!), "课程创建成功", 201);
  });

  /**
   * Update course
   * 更新课程
   */
  static updateCourse = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const hasCoverImage = Object.prototype.hasOwnProperty.call(req.body, "coverImage");
    const normalizedCoverImage = hasCoverImage
      ? normalizeCoverImageInput(req.body.coverImage)
      : undefined;

    if (hasCoverImage && normalizedCoverImage === undefined) {
      return res.error("封面图地址格式无效", "VALIDATION_ERROR", 400);
    }

    const data: UpdateCourseInput = {
      ...req.body,
      unitId: typeof req.body.unitId === "string" ? req.body.unitId.trim() : req.body.unitId,
      ...(hasCoverImage ? { coverImage: normalizedCoverImage } : {}),
    };

    const course = await CourseModel.getCourseById(id);
    if (!course) {
      return res.error("课程不存在", "NOT_FOUND", 404);
    }

    if (typeof data.unitId === "string" && data.unitId.length === 0) {
      return res.error("实验必须归属于一个单元", "VALIDATION_ERROR", 400);
    }

    const coverImageChanged = hasCoverImage && normalizedCoverImage !== course.cover_image;

    await CourseModel.updateCourse(id, data);
    if (coverImageChanged) {
      await ManagedUploadCleanupService.cleanupUrls([course.cover_image], {
        reason: `course.update:${id}`,
      });
    }
    const updatedCourse = await CourseModel.getCourseById(id);

    logger.info(`Course updated by ${req.user!.username}: ${id}`);
    res.success(transformCourseRow(updatedCourse!));
  });

  /**
   * Delete course
   * 删除课程
   */
  static deleteCourse = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const course = await CourseModel.getCourseById(id);
    if (!course) {
      return res.error("课程不存在", "NOT_FOUND", 404);
    }

    const cleanupUrls = await ManagedUploadCleanupService.collectCourseResourceUrls(id);
    await CourseModel.deleteCourse(id);
    await ManagedUploadCleanupService.cleanupUrls(cleanupUrls, {
      reason: `course.delete:${id}`,
    });

    logger.info(`Course deleted by ${req.user!.username}: ${id}`);
    res.success(null, "课程删除成功");
  });

  // ============================================================
  // Main Slide / 主课件
  // ============================================================

  /**
   * Get main slide
   * 获取主课件
   */
  static getMainSlide = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const mainSlide = await CourseModel.getMainSlide(id);
    if (!mainSlide) {
      return res.success(null);
    }

    res.success(transformMainSlideRow(mainSlide));
  });

  /**
   * Upsert main slide
   * 创建或更新主课件
   */
  static upsertMainSlide = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data: CreateMainSlideInput = req.body;

    if (!data.url) {
      return res.error("缺少 PDF URL", "VALIDATION_ERROR", 400);
    }

    const course = await CourseModel.getCourseById(id);
    if (!course) {
      return res.error("课程不存在", "NOT_FOUND", 404);
    }

    const existingMainSlide = await CourseModel.getMainSlide(id);
    await CourseModel.upsertMainSlide(id, data);
    await ManagedUploadCleanupService.cleanupUrls([existingMainSlide?.url], {
      reason: `course.main-slide.upsert:${id}`,
    });
    const mainSlide = await CourseModel.getMainSlide(id);

    logger.info(`Main slide upserted by ${req.user!.username} for course: ${id}`);
    res.success(transformMainSlideRow(mainSlide!));
  });

  /**
   * Delete main slide
   * 删除主课件
   */
  static deleteMainSlide = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const existingMainSlide = await CourseModel.getMainSlide(id);
    await CourseModel.deleteMainSlide(id);
    await ManagedUploadCleanupService.cleanupUrls([existingMainSlide?.url], {
      reason: `course.main-slide.delete:${id}`,
    });

    logger.info(`Main slide deleted by ${req.user!.username} for course: ${id}`);
    res.success(null, "主课件删除成功");
  });

  // ============================================================
  // Media / 媒体资源
  // ============================================================

  /**
   * Get media list
   * 获取媒体列表
   */
  static getMediaList = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const media = await CourseModel.getMediaByCourse(id);
    res.success(media.map(transformMediaRow));
  });

  /**
   * Get media by ID
   * 获取单个媒体
   */
  static getMedia = asyncHandler(async (req: Request, res: Response) => {
    const { mediaId } = req.params;

    const media = await CourseModel.getMediaById(mediaId);
    if (!media) {
      return res.error("媒体资源不存在", "NOT_FOUND", 404);
    }

    res.success(transformMediaRow(media));
  });

  /**
   * Create media
   * 创建媒体资源
   */
  static createMedia = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data: CreateMediaInput = req.body;

    if (!data.type || !data.url || !data.title_zh) {
      return res.error("缺少必要字段", "VALIDATION_ERROR", 400);
    }

    const course = await CourseModel.getCourseById(id);
    if (!course) {
      return res.error("课程不存在", "NOT_FOUND", 404);
    }

    const mediaId = await CourseModel.createMedia(id, data);
    const media = await CourseModel.getMediaById(mediaId);

    logger.info(`Media created by ${req.user!.username}: ${mediaId}`);
    res.success(transformMediaRow(media!), "媒体资源创建成功", 201);
  });

  /**
   * Update media
   * 更新媒体资源
   */
  static updateMedia = asyncHandler(async (req: Request, res: Response) => {
    const { mediaId } = req.params;
    const data: UpdateMediaInput = req.body;

    const media = await CourseModel.getMediaById(mediaId);
    if (!media) {
      return res.error("媒体资源不存在", "NOT_FOUND", 404);
    }

    await CourseModel.updateMedia(mediaId, data);
    await ManagedUploadCleanupService.cleanupUrls([media.url, media.preview_pdf_url], {
      reason: `course.media.update:${mediaId}`,
    });
    const updatedMedia = await CourseModel.getMediaById(mediaId);

    logger.info(`Media updated by ${req.user!.username}: ${mediaId}`);
    res.success(transformMediaRow(updatedMedia!));
  });

  /**
   * Delete media
   * 删除媒体资源
   */
  static deleteMedia = asyncHandler(async (req: Request, res: Response) => {
    const { mediaId } = req.params;

    const media = await CourseModel.getMediaById(mediaId);
    if (!media) {
      return res.error("媒体资源不存在", "NOT_FOUND", 404);
    }

    await CourseModel.deleteMedia(mediaId);
    await ManagedUploadCleanupService.cleanupUrls([media.url, media.preview_pdf_url], {
      reason: `course.media.delete:${mediaId}`,
    });

    logger.info(`Media deleted by ${req.user!.username}: ${mediaId}`);
    res.success(null, "媒体资源删除成功");
  });

  /**
   * Reorder media
   * 重新排序媒体
   */
  static reorderMedia = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { mediaIds } = req.body;

    if (!Array.isArray(mediaIds)) {
      return res.error("无效的排序数据", "VALIDATION_ERROR", 400);
    }

    await CourseModel.reorderMedia(id, mediaIds);

    logger.info(`Media reordered by ${req.user!.username} for course: ${id}`);
    res.success(null, "排序更新成功");
  });

  // ============================================================
  // Hyperlinks / 超链接
  // ============================================================

  /**
   * Get all hyperlinks for a course
   * 获取课程的所有超链接
   */
  static getHyperlinks = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const hyperlinks = await CourseModel.getHyperlinksByCourse(id);
    res.success(hyperlinks.map(transformHyperlinkRow));
  });

  /**
   * Get hyperlinks by page
   * 获取特定页面的超链接
   */
  static getHyperlinksByPage = asyncHandler(async (req: Request, res: Response) => {
    const { id, page } = req.params;

    const hyperlinks = await CourseModel.getHyperlinksByPage(id, parseInt(page, 10));
    res.success(hyperlinks.map(transformHyperlinkRow));
  });

  /**
   * Create hyperlink
   * 创建超链接
   */
  static createHyperlink = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data: CreateHyperlinkInput = req.body;

    if (
      !data.sourceMediaId ||
      data.page === undefined ||
      data.x === undefined ||
      data.y === undefined ||
      data.width === undefined ||
      data.height === undefined ||
      !data.targetMediaId
    ) {
      return res.error("缺少必要字段", "VALIDATION_ERROR", 400);
    }

    const course = await CourseModel.getCourseById(id);
    if (!course) {
      return res.error("课程不存在", "NOT_FOUND", 404);
    }

    const sourceMedia = await CourseModel.getMediaById(data.sourceMediaId);
    if (!sourceMedia || sourceMedia.course_id !== id) {
      return res.error("PPT 课件不存在", "VALIDATION_ERROR", 400);
    }

    if (sourceMedia.type !== "pptx") {
      return res.error("超链接只能配置在 PPT 类型媒体上", "VALIDATION_ERROR", 400);
    }

    const targetMedia = await CourseModel.getMediaById(data.targetMediaId);
    if (!targetMedia || targetMedia.course_id !== id) {
      return res.error("目标媒体资源不存在", "VALIDATION_ERROR", 400);
    }

    if (targetMedia.type === "pptx") {
      return res.error("超链接目标必须是右侧实验媒体，不能选择 PPT", "VALIDATION_ERROR", 400);
    }

    const hyperlinkId = await CourseModel.createHyperlink(id, data);
    const hyperlink = await CourseModel.getHyperlinkById(hyperlinkId);

    logger.info(`Hyperlink created by ${req.user!.username}: ${hyperlinkId}`);
    res.success(transformHyperlinkRow(hyperlink!), "超链接创建成功", 201);
  });

  /**
   * Update hyperlink
   * 更新超链接
   */
  static updateHyperlink = asyncHandler(async (req: Request, res: Response) => {
    const { hyperlinkId } = req.params;
    const data: UpdateHyperlinkInput = req.body;

    const hyperlink = await CourseModel.getHyperlinkById(hyperlinkId);
    if (!hyperlink) {
      return res.error("超链接不存在", "NOT_FOUND", 404);
    }

    const courseId = hyperlink.course_id;

    if (data.sourceMediaId) {
      const sourceMedia = await CourseModel.getMediaById(data.sourceMediaId);
      if (!sourceMedia || sourceMedia.course_id !== courseId) {
        return res.error("PPT 课件不存在", "VALIDATION_ERROR", 400);
      }

      if (sourceMedia.type !== "pptx") {
        return res.error("超链接只能配置在 PPT 类型媒体上", "VALIDATION_ERROR", 400);
      }
    }

    if (data.targetMediaId) {
      const targetMedia = await CourseModel.getMediaById(data.targetMediaId);
      if (!targetMedia || targetMedia.course_id !== courseId) {
        return res.error("目标媒体资源不存在", "VALIDATION_ERROR", 400);
      }

      if (targetMedia.type === "pptx") {
        return res.error("超链接目标必须是右侧实验媒体，不能选择 PPT", "VALIDATION_ERROR", 400);
      }
    }

    await CourseModel.updateHyperlink(hyperlinkId, data);
    const updatedHyperlink = await CourseModel.getHyperlinkById(hyperlinkId);

    logger.info(`Hyperlink updated by ${req.user!.username}: ${hyperlinkId}`);
    res.success(transformHyperlinkRow(updatedHyperlink!));
  });

  /**
   * Delete hyperlink
   * 删除超链接
   */
  static deleteHyperlink = asyncHandler(async (req: Request, res: Response) => {
    const { hyperlinkId } = req.params;

    const hyperlink = await CourseModel.getHyperlinkById(hyperlinkId);
    if (!hyperlink) {
      return res.error("超链接不存在", "NOT_FOUND", 404);
    }

    await CourseModel.deleteHyperlink(hyperlinkId);

    logger.info(`Hyperlink deleted by ${req.user!.username}: ${hyperlinkId}`);
    res.success(null, "超链接删除成功");
  });
}
