/**
 * Unit Controller
 * 单元控制器
 *
 * Handles unit system HTTP requests
 * 处理单元系统的 HTTP 请求
 */

import { Request, Response } from "express";
import { UnitModel } from "../models/unit.model.js";
import { CourseModel } from "../models/course.model.js";
import { asyncHandler } from "../middleware/error.middleware.js";
import { ManagedUploadCleanupService } from "../services/managed-upload-cleanup.service.js";
import { logger } from "../utils/logger.js";
import type {
  UnitRow,
  UnitMainSlideRow,
  CreateUnitInput,
  UpdateUnitInput,
  UpsertUnitMainSlideInput,
} from "../types/unit.types.js";
import type { CourseRow, MainSlideRow, MediaRow, HyperlinkRow } from "../types/course.types.js";

// ============================================================
// Helper Functions / 辅助函数
// ============================================================

/**
 * Transform unit row to API response format
 */
function transformUnitRow(row: UnitRow) {
  return {
    id: row.id,
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
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Transform unit main slide row to API response format
 */
function transformUnitMainSlideRow(row: UnitMainSlideRow) {
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
 * Transform course row to API response format (for unit courses)
 */
function transformCourseRowSimple(row: CourseRow) {
  return {
    id: row.id,
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
  };
}

function resolveCourseThumbnail(row: CourseRow, media: MediaRow[]) {
  if (row.cover_image) {
    return row.cover_image;
  }

  return media.find((item) => item.type === "image" && item.url)?.url;
}

export class UnitController {
  // ============================================================
  // Public API / 公开接口
  // ============================================================

  /**
   * Get all public units
   * 获取所有公开单元
   */
  static getPublicUnits = asyncHandler(async (req: Request, res: Response) => {
    const units = await UnitModel.getAllUnits();

    // Get main slides for each unit
    const unitsWithData = await Promise.all(
      units.map(async (unit) => {
        const mainSlide = await UnitModel.getMainSlide(unit.id);
        const courses = await UnitModel.getCoursesByUnit(unit.id);

        return {
          ...transformUnitRow(unit),
          mainSlide: mainSlide ? transformUnitMainSlideRow(mainSlide) : undefined,
          courseCount: courses.length,
        };
      })
    );

    res.success(unitsWithData);
  });

  /**
   * Get public unit by ID
   * 获取单个公开单元
   */
  static getPublicUnit = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const unit = await UnitModel.getUnitById(id);
    if (!unit) {
      return res.error("单元不存在", "NOT_FOUND", 404);
    }

    const mainSlide = await UnitModel.getMainSlide(id);
    const courses = await UnitModel.getCoursesByUnit(id);

    res.success({
      ...transformUnitRow(unit),
      mainSlide: mainSlide ? transformUnitMainSlideRow(mainSlide) : undefined,
      courses: courses.map(transformCourseRowSimple),
    });
  });

  /**
   * Get public unit main slide
   * 获取公开单元主课件
   */
  static getPublicMainSlide = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const unit = await UnitModel.getUnitById(id);
    if (!unit) {
      return res.error("单元不存在", "NOT_FOUND", 404);
    }

    const mainSlide = await UnitModel.getMainSlide(id);
    if (!mainSlide) {
      return res.success(null);
    }

    res.success(transformUnitMainSlideRow(mainSlide));
  });

  /**
   * Get public unit courses
   * 获取公开单元课程列表
   */
  static getPublicUnitCourses = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const unit = await UnitModel.getUnitById(id);
    if (!unit) {
      return res.error("单元不存在", "NOT_FOUND", 404);
    }

    const courses = await UnitModel.getCoursesByUnit(id);

    // Get additional data for each course
    const coursesWithData = await Promise.all(
      courses.map(async (course) => {
        const [mainSlide, media] = await Promise.all([
          CourseModel.getMainSlide(course.id),
          CourseModel.getMediaByCourse(course.id),
        ]);

        return {
          ...transformCourseRowSimple(course),
          thumbnailImage: resolveCourseThumbnail(course, media),
          mainSlide: mainSlide
            ? {
                id: mainSlide.id,
                url: mainSlide.url,
                title: {
                  "zh-CN": mainSlide.title_zh || undefined,
                  "en-US": mainSlide.title_en || undefined,
                },
              }
            : undefined,
          mediaCount: media.length,
        };
      })
    );

    res.success(coursesWithData);
  });

  // ============================================================
  // Admin API / 管理接口
  // ============================================================

  /**
   * Get all units (admin)
   * 获取所有单元（管理）
   */
  static getAllUnits = asyncHandler(async (req: Request, res: Response) => {
    const units = await UnitModel.getAllUnits();

    // Get main slides and course counts for each unit
    const unitsWithData = await Promise.all(
      units.map(async (unit) => {
        const mainSlide = await UnitModel.getMainSlide(unit.id);
        const courses = await UnitModel.getCoursesByUnit(unit.id);

        return {
          ...transformUnitRow(unit),
          mainSlide: mainSlide ? transformUnitMainSlideRow(mainSlide) : undefined,
          courseCount: courses.length,
        };
      })
    );

    res.success(unitsWithData);
  });

  /**
   * Get unit by ID (admin)
   * 获取单个单元（管理）
   */
  static getUnit = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const unit = await UnitModel.getUnitById(id);
    if (!unit) {
      return res.error("单元不存在", "NOT_FOUND", 404);
    }

    const mainSlide = await UnitModel.getMainSlide(id);
    const courses = await UnitModel.getCoursesByUnit(id);

    res.success({
      ...transformUnitRow(unit),
      mainSlide: mainSlide ? transformUnitMainSlideRow(mainSlide) : undefined,
      courses: courses.map(transformCourseRowSimple),
    });
  });

  /**
   * Create unit
   * 创建单元
   */
  static createUnit = asyncHandler(async (req: Request, res: Response) => {
    const data: CreateUnitInput = req.body;

    if (!data.title_zh) {
      return res.error("缺少单元标题", "VALIDATION_ERROR", 400);
    }

    const unitId = await UnitModel.createUnit(data);
    const unit = await UnitModel.getUnitById(unitId);

    logger.info(`Unit created by ${req.user!.username}: ${unitId}`);
    res.success(transformUnitRow(unit!), "单元创建成功", 201);
  });

  /**
   * Update unit
   * 更新单元
   */
  static updateUnit = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data: UpdateUnitInput = req.body;

    const unit = await UnitModel.getUnitById(id);
    if (!unit) {
      return res.error("单元不存在", "NOT_FOUND", 404);
    }

    await UnitModel.updateUnit(id, data);
    await ManagedUploadCleanupService.cleanupUrls([unit.cover_image], {
      reason: `unit.update:${id}`,
    });
    const updatedUnit = await UnitModel.getUnitById(id);

    logger.info(`Unit updated by ${req.user!.username}: ${id}`);
    res.success(transformUnitRow(updatedUnit!));
  });

  /**
   * Delete unit
   * 删除单元
   */
  static deleteUnit = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const unit = await UnitModel.getUnitById(id);
    if (!unit) {
      return res.error("单元不存在", "NOT_FOUND", 404);
    }

    const cleanupUrls = await ManagedUploadCleanupService.collectUnitResourceUrls(id);
    await UnitModel.deleteUnit(id);
    await ManagedUploadCleanupService.cleanupUrls(cleanupUrls, {
      reason: `unit.delete:${id}`,
    });

    logger.info(`Unit deleted by ${req.user!.username}: ${id}`);
    res.success(null, "单元删除成功");
  });

  /**
   * Reorder units
   * 重新排序单元
   */
  static reorderUnits = asyncHandler(async (req: Request, res: Response) => {
    const { unitIds } = req.body;

    if (!Array.isArray(unitIds)) {
      return res.error("无效的排序数据", "VALIDATION_ERROR", 400);
    }

    await UnitModel.reorderUnits(unitIds);

    logger.info(`Units reordered by ${req.user!.username}`);
    res.success(null, "排序更新成功");
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

    const mainSlide = await UnitModel.getMainSlide(id);
    if (!mainSlide) {
      return res.success(null);
    }

    res.success(transformUnitMainSlideRow(mainSlide));
  });

  /**
   * Upsert main slide
   * 创建或更新主课件
   */
  static upsertMainSlide = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data: UpsertUnitMainSlideInput = req.body;

    if (!data.url) {
      return res.error("缺少 PDF URL", "VALIDATION_ERROR", 400);
    }

    const unit = await UnitModel.getUnitById(id);
    if (!unit) {
      return res.error("单元不存在", "NOT_FOUND", 404);
    }

    const existingMainSlide = await UnitModel.getMainSlide(id);
    await UnitModel.upsertMainSlide(id, data);
    await ManagedUploadCleanupService.cleanupUrls([existingMainSlide?.url], {
      reason: `unit.main-slide.upsert:${id}`,
    });
    const mainSlide = await UnitModel.getMainSlide(id);

    logger.info(`Unit main slide upserted by ${req.user!.username} for unit: ${id}`);
    res.success(transformUnitMainSlideRow(mainSlide!));
  });

  /**
   * Delete main slide
   * 删除主课件
   */
  static deleteMainSlide = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const existingMainSlide = await UnitModel.getMainSlide(id);
    await UnitModel.deleteMainSlide(id);
    await ManagedUploadCleanupService.cleanupUrls([existingMainSlide?.url], {
      reason: `unit.main-slide.delete:${id}`,
    });

    logger.info(`Unit main slide deleted by ${req.user!.username} for unit: ${id}`);
    res.success(null, "主课件删除成功");
  });

  // ============================================================
  // Courses / 关联课程
  // ============================================================

  /**
   * Get unit courses (admin)
   * 获取单元课程列表（管理）
   */
  static getUnitCourses = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const unit = await UnitModel.getUnitById(id);
    if (!unit) {
      return res.error("单元不存在", "NOT_FOUND", 404);
    }

    const courses = await UnitModel.getCoursesByUnit(id);

    // Get additional data for each course
    const coursesWithData = await Promise.all(
      courses.map(async (course) => {
        const [mainSlide, media, hyperlinks] = await Promise.all([
          CourseModel.getMainSlide(course.id),
          CourseModel.getMediaByCourse(course.id),
          CourseModel.getHyperlinksByCourse(course.id),
        ]);

        return {
          ...transformCourseRowSimple(course),
          mainSlide: mainSlide
            ? {
                id: mainSlide.id,
                url: mainSlide.url,
                title: {
                  "zh-CN": mainSlide.title_zh || undefined,
                  "en-US": mainSlide.title_en || undefined,
                },
              }
            : undefined,
          mediaCount: media.length,
          hyperlinkCount: hyperlinks.length,
        };
      })
    );

    res.success(coursesWithData);
  });
}
