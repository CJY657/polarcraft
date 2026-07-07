/**
 * Course Controller
 * 课程控制器
 *
 * Handles course system HTTP requests
 * 处理课程系统的 HTTP 请求
 */

import fs from "fs";
import path from "path";
import { Request, Response } from "express";
import { appPaths } from "../config/paths.js";
import { uploadConfig } from "../config/upload.config.js";
import { CourseModel } from "../models/course.model.js";
import { asyncHandler } from "../middleware/error.middleware.js";
import { ManagedUploadCleanupService } from "../services/managed-upload-cleanup.service.js";
import { logger } from "../utils/logger.js";
import type {
  CourseRow,
  MainSlideRow,
  MediaRow,
  HyperlinkRow,
  CourseDiscussionCommentRow,
  CreateCourseInput,
  UpdateCourseInput,
  CreateMainSlideInput,
  CreateMediaInput,
  UpdateMediaInput,
  CreateHyperlinkInput,
  UpdateHyperlinkInput,
  KnowledgeTag,
} from "../types/course.types.js";

// ============================================================
// Helper Functions / 辅助函数
// ============================================================

const DEFAULT_KNOWLEDGE_TAG: KnowledgeTag = "foundation";
const KNOWLEDGE_TAGS = new Set<KnowledgeTag>(["foundation", "optical_device"]);

function normalizeKnowledgeTag(
  value: unknown,
  fallback: KnowledgeTag = DEFAULT_KNOWLEDGE_TAG
): KnowledgeTag {
  return typeof value === "string" && KNOWLEDGE_TAGS.has(value as KnowledgeTag)
    ? (value as KnowledgeTag)
    : fallback;
}

function parseKnowledgeTagInput(value: unknown): KnowledgeTag | undefined | null {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!KNOWLEDGE_TAGS.has(trimmed as KnowledgeTag)) {
    return null;
  }

  return trimmed as KnowledgeTag;
}

/**
 * Transform course row to API response format
 */
function transformCourseRow(row: CourseRow) {
  const knowledgeTag = normalizeKnowledgeTag(row.knowledge_tag);

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
    knowledgeTag,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Transform main slide row to API response format
 */
function transformMainSlideRow(row: MainSlideRow, fallbackKnowledgeTag = DEFAULT_KNOWLEDGE_TAG) {
  return {
    id: row.id,
    url: row.url,
    title: {
      "zh-CN": row.title_zh || undefined,
      "en-US": row.title_en || undefined,
    },
    knowledgeTag: normalizeKnowledgeTag(row.knowledge_tag, fallbackKnowledgeTag),
  };
}

/**
 * Transform media row to API response format
 */
function transformMediaRow(row: MediaRow, fallbackKnowledgeTag = DEFAULT_KNOWLEDGE_TAG) {
  return {
    id: row.id,
    type: row.type,
    url: row.url,
    previewPdfUrl: row.preview_pdf_url || undefined,
    title: {
      "zh-CN": row.title_zh,
      "en-US": row.title_en || undefined,
    },
    knowledgeTag: normalizeKnowledgeTag(row.knowledge_tag, fallbackKnowledgeTag),
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

function transformDiscussionCommentRow(
  row: CourseDiscussionCommentRow & {
    username: string;
    nickname: string | null;
    real_name: string | null;
    avatar_url: string | null;
    resource_title_zh: string | null;
    resource_title_en: string | null;
  }
) {
  return {
    id: row.id,
    courseId: row.course_id,
    userId: row.user_id,
    parentCommentId: row.parent_comment_id,
    username: row.username,
    nickname: row.nickname,
    realName: row.real_name,
    avatarUrl: row.avatar_url,
    content: row.content,
    imageUrls: row.image_urls,
    resourceId: row.resource_id,
    resourceTitle: row.resource_title_zh
      ? { 'zh-CN': row.resource_title_zh, 'en-US': row.resource_title_en || undefined }
      : null,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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

const LOCAL_RESOURCE_URL_BASE = "http://polariscope.local";

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function isRelativeResourceUrl(resourceUrl: string): boolean {
  return resourceUrl.startsWith("/") || !/^[a-z][a-z\d+.-]*:/i.test(resourceUrl);
}

function decodeUrlPathname(pathname: string): string {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return pathname;
  }
}

function getUrlPathPrefix(value: string): string {
  try {
    return stripTrailingSlash(
      decodeUrlPathname(new URL(value, LOCAL_RESOURCE_URL_BASE).pathname)
    );
  } catch {
    return stripTrailingSlash(value);
  }
}

function isPathInside(rootDir: string, targetPath: string): boolean {
  const relativePath = path.relative(rootDir, targetPath);
  return relativePath === "" || (!relativePath.startsWith("..") && !path.isAbsolute(relativePath));
}

function getExistingFilePath(rootDirs: string[], relativePath: string): string | null {
  for (const rootDir of rootDirs) {
    const resolvedRoot = path.resolve(rootDir);
    const resolvedPath = path.resolve(resolvedRoot, relativePath);

    if (!isPathInside(resolvedRoot, resolvedPath)) {
      return null;
    }

    try {
      if (fs.statSync(resolvedPath).isFile()) {
        return resolvedPath;
      }
    } catch {
      // Try the next configured root.
    }
  }

  return null;
}

function resolveLocalCourseResourcePath(resourceUrl: string): string | null {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(resourceUrl, LOCAL_RESOURCE_URL_BASE);
  } catch {
    return null;
  }

  if (!isRelativeResourceUrl(resourceUrl) && parsedUrl.origin !== LOCAL_RESOURCE_URL_BASE) {
    return null;
  }

  const pathname = decodeUrlPathname(parsedUrl.pathname);
  const resourceRoots = [
    {
      urlPrefix: getUrlPathPrefix(uploadConfig.publicUrlPrefix),
      rootDirs: [uploadConfig.uploadDir],
    },
    {
      urlPrefix: "/courses",
      rootDirs: [
        path.join(appPaths.frontendDistDir, "courses"),
        path.join(appPaths.repoRoot, "public", "courses"),
      ],
    },
    {
      urlPrefix: "/videos",
      rootDirs: [
        path.join(appPaths.frontendDistDir, "videos"),
        path.join(appPaths.repoRoot, "public", "videos"),
      ],
    },
  ];

  for (const { urlPrefix, rootDirs } of resourceRoots) {
    if (pathname !== urlPrefix && !pathname.startsWith(`${urlPrefix}/`)) {
      continue;
    }

    const relativePath = pathname.slice(urlPrefix.length).replace(/^\/+/, "");
    if (!relativePath) {
      return null;
    }

    return getExistingFilePath(rootDirs, relativePath);
  }

  return null;
}

function isExternalHttpUrl(resourceUrl: string): boolean {
  try {
    const parsedUrl = new URL(resourceUrl, LOCAL_RESOURCE_URL_BASE);
    return (
      (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") &&
      parsedUrl.origin !== LOCAL_RESOURCE_URL_BASE
    );
  } catch {
    return false;
  }
}

function sanitizeDownloadName(value: string): string {
  return value
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function getResourcePathname(resourceUrl: string): string {
  try {
    return decodeUrlPathname(new URL(resourceUrl, LOCAL_RESOURCE_URL_BASE).pathname);
  } catch {
    return resourceUrl;
  }
}

function getDownloadFilename(resourceUrl: string, fallbackTitle: string): string {
  const pathname = getResourcePathname(resourceUrl);
  const basename = sanitizeDownloadName(path.basename(pathname));
  const title = sanitizeDownloadName(fallbackTitle);
  const extension = path.extname(basename);

  if (!title) {
    return basename || "course-resource";
  }

  if (path.extname(title)) {
    return title;
  }

  return extension ? `${title}${extension}` : title;
}

function sendCourseResourceDownload(
  res: Response,
  resourceUrl: string,
  fallbackTitle: string
): void {
  const localFilePath = resolveLocalCourseResourcePath(resourceUrl);
  if (localFilePath) {
    res.download(localFilePath, getDownloadFilename(resourceUrl, fallbackTitle));
    return;
  }

  if (isExternalHttpUrl(resourceUrl)) {
    res.redirect(resourceUrl);
    return;
  }

  res.error("资源文件不存在", "RESOURCE_FILE_NOT_FOUND", 404);
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
        const courseKnowledgeTag = normalizeKnowledgeTag(course.knowledge_tag);

        return {
          ...transformCourseRow(course),
          mainSlide: mainSlide ? transformMainSlideRow(mainSlide, courseKnowledgeTag) : undefined,
          media: media.map((item) => transformMediaRow(item, courseKnowledgeTag)),
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
    const courseKnowledgeTag = normalizeKnowledgeTag(course.knowledge_tag);

    res.success({
      ...transformCourseRow(course),
      mainSlide: mainSlide ? transformMainSlideRow(mainSlide, courseKnowledgeTag) : undefined,
      media: media.map((item) => transformMediaRow(item, courseKnowledgeTag)),
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

    const parsedKnowledgeTag = parseKnowledgeTagInput(req.body.knowledgeTag);
    if (parsedKnowledgeTag === null) {
      return res.error("知识分类无效", "VALIDATION_ERROR", 400);
    }

    const data: CreateCourseInput = {
      ...req.body,
      unitId: typeof req.body.unitId === "string" ? req.body.unitId.trim() : req.body.unitId,
      title_zh: typeof req.body.title_zh === "string" ? req.body.title_zh.trim() : req.body.title_zh,
      coverImage: normalizedCoverImage,
      knowledgeTag: parsedKnowledgeTag || DEFAULT_KNOWLEDGE_TAG,
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

    const parsedKnowledgeTag = parseKnowledgeTagInput(req.body.knowledgeTag);
    if (parsedKnowledgeTag === null) {
      return res.error("知识分类无效", "VALIDATION_ERROR", 400);
    }

    const data: UpdateCourseInput = {
      ...req.body,
      unitId: typeof req.body.unitId === "string" ? req.body.unitId.trim() : req.body.unitId,
      ...(hasCoverImage ? { coverImage: normalizedCoverImage } : {}),
      ...(parsedKnowledgeTag ? { knowledgeTag: parsedKnowledgeTag } : {}),
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

    const course = await CourseModel.getCourseById(id);
    const courseKnowledgeTag = normalizeKnowledgeTag(course?.knowledge_tag);
    const mainSlide = await CourseModel.getMainSlide(id);
    if (!mainSlide) {
      return res.success(null);
    }

    res.success(transformMainSlideRow(mainSlide, courseKnowledgeTag));
  });

  /**
   * Download main slide
   * 下载主课件（管理员）
   */
  static downloadMainSlide = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const mainSlide = await CourseModel.getMainSlide(id);
    if (!mainSlide) {
      return res.error("主课件不存在", "NOT_FOUND", 404);
    }

    sendCourseResourceDownload(res, mainSlide.url, mainSlide.title_zh || `main-slide-${id}`);
  });

  /**
   * Upsert main slide
   * 创建或更新主课件
   */
  static upsertMainSlide = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const parsedKnowledgeTag = parseKnowledgeTagInput(req.body.knowledgeTag);
    if (parsedKnowledgeTag === null) {
      return res.error("知识分类无效", "VALIDATION_ERROR", 400);
    }

    if (!req.body.url) {
      return res.error("缺少 PDF URL", "VALIDATION_ERROR", 400);
    }

    const course = await CourseModel.getCourseById(id);
    if (!course) {
      return res.error("课程不存在", "NOT_FOUND", 404);
    }

    const courseKnowledgeTag = normalizeKnowledgeTag(course.knowledge_tag);
    const data: CreateMainSlideInput = {
      ...req.body,
      knowledgeTag: parsedKnowledgeTag || courseKnowledgeTag,
    };

    const existingMainSlide = await CourseModel.getMainSlide(id);
    await CourseModel.upsertMainSlide(id, data);
    await ManagedUploadCleanupService.cleanupUrls([existingMainSlide?.url], {
      reason: `course.main-slide.upsert:${id}`,
    });
    const mainSlide = await CourseModel.getMainSlide(id);

    logger.info(`Main slide upserted by ${req.user!.username} for course: ${id}`);
    res.success(transformMainSlideRow(mainSlide!, courseKnowledgeTag));
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

  /**
   * Get discussion comments
   * 获取实验讨论评论
   */
  static getDiscussionComments = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const course = await CourseModel.getCourseById(id);
    if (!course) {
      return res.error("课程不存在", "NOT_FOUND", 404);
    }

    const comments = await CourseModel.getDiscussionComments(id);
    res.success(comments.map(transformDiscussionCommentRow));
  });

  /**
   * Add discussion comment
   * 添加实验讨论评论
   */
  static addDiscussionComment = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const content = typeof req.body.content === "string" ? req.body.content.trim() : "";
    const rawImageUrls: unknown[] = Array.isArray(req.body.imageUrls) ? req.body.imageUrls : [];
    const imageUrls = rawImageUrls
      .filter((imageUrl): imageUrl is string => typeof imageUrl === "string")
      .map((imageUrl) => imageUrl.trim())
      .filter((imageUrl) => imageUrl.length > 0);
    const parentCommentId =
      typeof req.body.parentCommentId === "string" && req.body.parentCommentId.trim()
        ? req.body.parentCommentId.trim()
        : null;
    const resourceId =
      typeof req.body.resourceId === "string" && req.body.resourceId.trim()
        ? req.body.resourceId.trim()
        : null;

    // Validate: must have content or images
    if (!content && imageUrls.length === 0) {
      return res.error("评论内容不能为空（可以只发图片）", "INVALID_COMMENT_CONTENT", 400);
    }

    if (content.length > 2000) {
      return res.error("评论内容不能超过 2000 字", "COMMENT_TOO_LONG", 400);
    }

    if (imageUrls.length > 6) {
      return res.error("单条评论最多添加 6 张图片", "TOO_MANY_IMAGES", 400);
    }

    const course = await CourseModel.getCourseById(id);
    if (!course) {
      return res.error("课程不存在", "NOT_FOUND", 404);
    }

    // Validate parent comment if provided
    if (parentCommentId) {
      const parentComment = await CourseModel.getDiscussionCommentById(parentCommentId);
      if (!parentComment || parentComment.course_id !== id) {
        return res.error("回复的评论不存在", "PARENT_COMMENT_NOT_FOUND", 404);
      }
    }

    // Validate resource if provided
    if (resourceId) {
      const resource = await CourseModel.getMediaById(resourceId);
      if (!resource || resource.course_id !== id) {
        return res.error("关联的资源不存在", "RESOURCE_NOT_FOUND", 404);
      }
    }

    const commentId = await CourseModel.addDiscussionComment(
      id,
      req.user!.sub,
      content,
      imageUrls,
      parentCommentId,
      resourceId
    );

    logger.info(`Course discussion comment added by ${req.user!.username}: ${commentId}`);
    res.success({ id: commentId }, "讨论留言发布成功", 201);
  });

  /**
   * Delete discussion comment
   * 删除实验讨论评论
   */
  static deleteDiscussionComment = asyncHandler(async (req: Request, res: Response) => {
    const { commentId } = req.params;

    const comment = await CourseModel.getDiscussionCommentById(commentId);
    if (!comment) {
      return res.error("评论不存在", "COMMENT_NOT_FOUND", 404);
    }

    const canDelete = comment.user_id === req.user!.sub || req.user!.role === "admin";
    if (!canDelete) {
      return res.error("无权删除该评论", "FORBIDDEN", 403);
    }

    await CourseModel.deleteDiscussionComment(commentId);

    logger.info(`Course discussion comment deleted by ${req.user!.username}: ${commentId}`);
    res.success(null, "讨论留言删除成功");
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

    const course = await CourseModel.getCourseById(id);
    const courseKnowledgeTag = normalizeKnowledgeTag(course?.knowledge_tag);
    const media = await CourseModel.getMediaByCourse(id);
    res.success(media.map((item) => transformMediaRow(item, courseKnowledgeTag)));
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

    const course = await CourseModel.getCourseById(media.course_id);
    res.success(transformMediaRow(media, normalizeKnowledgeTag(course?.knowledge_tag)));
  });

  /**
   * Download media resource
   * 下载媒体资源（管理员）
   */
  static downloadMedia = asyncHandler(async (req: Request, res: Response) => {
    const { mediaId } = req.params;

    const media = await CourseModel.getMediaById(mediaId);
    if (!media) {
      return res.error("媒体资源不存在", "NOT_FOUND", 404);
    }

    sendCourseResourceDownload(res, media.url, media.title_zh || `media-${mediaId}`);
  });

  /**
   * Create media
   * 创建媒体资源
   */
  static createMedia = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const parsedKnowledgeTag = parseKnowledgeTagInput(req.body.knowledgeTag);
    if (parsedKnowledgeTag === null) {
      return res.error("知识分类无效", "VALIDATION_ERROR", 400);
    }

    if (!req.body.type || !req.body.url || !req.body.title_zh) {
      return res.error("缺少必要字段", "VALIDATION_ERROR", 400);
    }

    const course = await CourseModel.getCourseById(id);
    if (!course) {
      return res.error("课程不存在", "NOT_FOUND", 404);
    }

    const courseKnowledgeTag = normalizeKnowledgeTag(course.knowledge_tag);
    const data: CreateMediaInput = {
      ...req.body,
      knowledgeTag: parsedKnowledgeTag || courseKnowledgeTag,
    };

    const mediaId = await CourseModel.createMedia(id, data);
    const media = await CourseModel.getMediaById(mediaId);

    logger.info(`Media created by ${req.user!.username}: ${mediaId}`);
    res.success(transformMediaRow(media!, courseKnowledgeTag), "媒体资源创建成功", 201);
  });

  /**
   * Update media
   * 更新媒体资源
   */
  static updateMedia = asyncHandler(async (req: Request, res: Response) => {
    const { mediaId } = req.params;
    const parsedKnowledgeTag = parseKnowledgeTagInput(req.body.knowledgeTag);
    if (parsedKnowledgeTag === null) {
      return res.error("知识分类无效", "VALIDATION_ERROR", 400);
    }

    const media = await CourseModel.getMediaById(mediaId);
    if (!media) {
      return res.error("媒体资源不存在", "NOT_FOUND", 404);
    }

    const course = await CourseModel.getCourseById(media.course_id);
    const courseKnowledgeTag = normalizeKnowledgeTag(course?.knowledge_tag);
    const data: UpdateMediaInput = {
      ...req.body,
      knowledgeTag: parsedKnowledgeTag || courseKnowledgeTag,
    };

    await CourseModel.updateMedia(mediaId, data);
    await ManagedUploadCleanupService.cleanupUrls([media.url, media.preview_pdf_url], {
      reason: `course.media.update:${mediaId}`,
    });
    const updatedMedia = await CourseModel.getMediaById(mediaId);

    logger.info(`Media updated by ${req.user!.username}: ${mediaId}`);
    res.success(transformMediaRow(updatedMedia!, courseKnowledgeTag));
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
   * Batch delete media
   * 批量删除媒体资源
   */
  static deleteMediaBatch = asyncHandler(async (req: Request, res: Response) => {
    const mediaIds = Array.isArray(req.body?.mediaIds)
      ? req.body.mediaIds.filter(
          (mediaId: unknown): mediaId is string =>
            typeof mediaId === "string" && mediaId.trim().length > 0
        )
      : [];

    if (mediaIds.length === 0) {
      return res.error("请提供要删除的媒体资源", "VALIDATION_ERROR", 400);
    }

    const media = await CourseModel.getMediaByIds(mediaIds);
    if (media.length === 0) {
      return res.error("媒体资源不存在", "NOT_FOUND", 404);
    }

    const deletedCount = await CourseModel.deleteMediaBatch(media.map((item) => item.id));
    await ManagedUploadCleanupService.cleanupUrls(
      media.flatMap((item) => [item.url, item.preview_pdf_url]),
      {
        reason: `course.media.batch-delete:${media.map((item) => item.id).join(",")}`,
      }
    );

    logger.info(
      `Media deleted in batch by ${req.user!.username}: ${media.map((item) => item.id).join(",")}`
    );
    res.success({ deletedCount }, `已删除 ${deletedCount} 个媒体资源`);
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
