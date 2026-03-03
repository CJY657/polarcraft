/**
 * Course Model
 * 课程数据模型
 */

import { query, queryOne } from "../database/connection.js";
import { generateId } from "../utils/crypto.util.js";
import { logger } from "../utils/logger.js";
import type {
  CourseRow,
  MainSlideRow,
  MediaRow,
  HyperlinkRow,
  MediaType,
  CreateCourseInput,
  UpdateCourseInput,
  CreateMainSlideInput,
  CreateMediaInput,
  UpdateMediaInput,
  CreateHyperlinkInput,
  UpdateHyperlinkInput,
} from "../types/course.types.js";

/**
 * Course Model Class
 * 课程模型类
 */
export class CourseModel {
  // ============================================================
  // Courses / 课程
  // ============================================================

  /**
   * Get all courses
   * 获取所有课程
   */
  static async getAllCourses(): Promise<CourseRow[]> {
    const sql = `
      SELECT * FROM courses
      ORDER BY created_at DESC
    `;
    return await query(sql);
  }

  /**
   * Get course by ID
   * 获取课程详情
   */
  static async getCourseById(courseId: string): Promise<CourseRow | null> {
    const sql = "SELECT * FROM courses WHERE id = ?";
    return await queryOne(sql, [courseId]);
  }

  /**
   * Create course
   * 创建课程
   */
  static async createCourse(data: CreateCourseInput): Promise<string> {
    const id = generateId();
    const sql = `
      INSERT INTO courses (
        id, unit_id, title_zh, title_en, description_zh, description_en,
        cover_image, color
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await query(sql, [
      id,
      data.unitId,
      data.title_zh,
      data.title_en || null,
      data.description_zh || null,
      data.description_en || null,
      data.coverImage || null,
      data.color || "#C9A227",
    ]);

    logger.info(`Course created: ${id}`);
    return id;
  }

  /**
   * Update course
   * 更新课程
   */
  static async updateCourse(courseId: string, data: UpdateCourseInput): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];

    const updatable = [
      "unit_id",
      "title_zh",
      "title_en",
      "description_zh",
      "description_en",
      "cover_image",
      "color",
      "sort_order",
    ];

    const dataMap: Record<string, string | number | undefined> = {
      unit_id: data.unitId,
      title_zh: data.title_zh,
      title_en: data.title_en,
      description_zh: data.description_zh,
      description_en: data.description_en,
      cover_image: data.coverImage,
      color: data.color,
      sort_order: data.sortOrder,
    };

    for (const field of updatable) {
      if (dataMap[field] !== undefined) {
        fields.push(`${field} = ?`);
        params.push(dataMap[field]);
      }
    }

    if (fields.length === 0) return false;

    params.push(courseId);
    const sql = `UPDATE courses SET ${fields.join(", ")} WHERE id = ?`;
    await query(sql, params);

    logger.info(`Course updated: ${courseId}`);
    return true;
  }

  /**
   * Delete course
   * 删除课程
   */
  static async deleteCourse(courseId: string): Promise<boolean> {
    const sql = "DELETE FROM courses WHERE id = ?";
    await query(sql, [courseId]);
    logger.info(`Course deleted: ${courseId}`);
    return true;
  }

  // ============================================================
  // Main Slide / 主课件
  // ============================================================

  /**
   * Get main slide by course ID
   * 获取课程的主课件
   */
  static async getMainSlide(courseId: string): Promise<MainSlideRow | null> {
    const sql = "SELECT * FROM course_main_slides WHERE course_id = ?";
    return await queryOne(sql, [courseId]);
  }

  /**
   * Upsert main slide
   * 创建或更新主课件
   */
  static async upsertMainSlide(courseId: string, data: CreateMainSlideInput): Promise<string> {
    // Check if exists
    const existing = await this.getMainSlide(courseId);

    if (existing) {
      // Update
      const sql = `
        UPDATE course_main_slides
        SET url = ?, title_zh = ?, title_en = ?
        WHERE course_id = ?
      `;
      await query(sql, [data.url, data.title_zh || null, data.title_en || null, courseId]);
      logger.info(`Main slide updated for course: ${courseId}`);
      return existing.id;
    } else {
      // Create
      const id = generateId();
      const sql = `
        INSERT INTO course_main_slides (id, course_id, url, title_zh, title_en)
        VALUES (?, ?, ?, ?, ?)
      `;
      await query(sql, [id, courseId, data.url, data.title_zh || null, data.title_en || null]);
      logger.info(`Main slide created for course: ${courseId}`);
      return id;
    }
  }

  /**
   * Delete main slide
   * 删除主课件
   */
  static async deleteMainSlide(courseId: string): Promise<boolean> {
    const sql = "DELETE FROM course_main_slides WHERE course_id = ?";
    await query(sql, [courseId]);
    logger.info(`Main slide deleted for course: ${courseId}`);
    return true;
  }

  // ============================================================
  // Media / 媒体资源
  // ============================================================

  /**
   * Get all media for a course
   * 获取课程的所有媒体资源
   */
  static async getMediaByCourse(courseId: string): Promise<MediaRow[]> {
    const sql = `
      SELECT * FROM course_media
      WHERE course_id = ?
      ORDER BY sort_order ASC, created_at ASC
    `;
    return await query(sql, [courseId]);
  }

  /**
   * Get media by ID
   * 获取单个媒体资源
   */
  static async getMediaById(mediaId: string): Promise<MediaRow | null> {
    const sql = "SELECT * FROM course_media WHERE id = ?";
    return await queryOne(sql, [mediaId]);
  }

  /**
   * Create media
   * 创建媒体资源
   */
  static async createMedia(courseId: string, data: CreateMediaInput): Promise<string> {
    // Get max sort order
    const maxOrderSql = "SELECT COALESCE(MAX(sort_order), -1) as max_order FROM course_media WHERE course_id = ?";
    const result = await queryOne<{ max_order: number }>(maxOrderSql, [courseId]);
    const sortOrder = (result?.max_order ?? -1) + 1;

    const id = generateId();
    const sql = `
      INSERT INTO course_media (id, course_id, type, url, title_zh, title_en, duration, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await query(sql, [
      id,
      courseId,
      data.type,
      data.url,
      data.title_zh,
      data.title_en || null,
      data.duration || null,
      sortOrder,
    ]);

    logger.info(`Media created: ${id}`);
    return id;
  }

  /**
   * Update media
   * 更新媒体资源
   */
  static async updateMedia(mediaId: string, data: UpdateMediaInput): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];

    const updatable = ["type", "url", "title_zh", "title_en", "duration", "sort_order"];

    for (const field of updatable) {
      if (data[field as keyof UpdateMediaInput] !== undefined) {
        fields.push(`${field} = ?`);
        params.push(data[field as keyof UpdateMediaInput]);
      }
    }

    if (fields.length === 0) return false;

    params.push(mediaId);
    const sql = `UPDATE course_media SET ${fields.join(", ")} WHERE id = ?`;
    await query(sql, params);

    logger.info(`Media updated: ${mediaId}`);
    return true;
  }

  /**
   * Delete media
   * 删除媒体资源
   */
  static async deleteMedia(mediaId: string): Promise<boolean> {
    const sql = "DELETE FROM course_media WHERE id = ?";
    await query(sql, [mediaId]);
    logger.info(`Media deleted: ${mediaId}`);
    return true;
  }

  /**
   * Reorder media
   * 重新排序媒体资源
   */
  static async reorderMedia(courseId: string, mediaIds: string[]): Promise<boolean> {
    const sql = "UPDATE course_media SET sort_order = ? WHERE id = ? AND course_id = ?";

    for (let i = 0; i < mediaIds.length; i++) {
      await query(sql, [i, mediaIds[i], courseId]);
    }

    logger.info(`Media reordered for course: ${courseId}`);
    return true;
  }

  // ============================================================
  // Hyperlinks / 超链接
  // ============================================================

  /**
   * Get all hyperlinks for a course
   * 获取课程的所有超链接
   */
  static async getHyperlinksByCourse(courseId: string): Promise<HyperlinkRow[]> {
    const sql = `
      SELECT * FROM course_hyperlinks
      WHERE course_id = ?
      ORDER BY page ASC, created_at ASC
    `;
    return await query(sql, [courseId]);
  }

  /**
   * Get hyperlinks by page
   * 获取特定页面的超链接
   */
  static async getHyperlinksByPage(courseId: string, page: number): Promise<HyperlinkRow[]> {
    const sql = `
      SELECT * FROM course_hyperlinks
      WHERE course_id = ? AND page = ?
      ORDER BY created_at ASC
    `;
    return await query(sql, [courseId, page]);
  }

  /**
   * Get hyperlink by ID
   * 获取单个超链接
   */
  static async getHyperlinkById(hyperlinkId: string): Promise<HyperlinkRow | null> {
    const sql = "SELECT * FROM course_hyperlinks WHERE id = ?";
    return await queryOne(sql, [hyperlinkId]);
  }

  /**
   * Create hyperlink
   * 创建超链接
   */
  static async createHyperlink(courseId: string, data: CreateHyperlinkInput): Promise<string> {
    const id = generateId();
    const sql = `
      INSERT INTO course_hyperlinks (id, course_id, page, x, y, width, height, target_media_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await query(sql, [
      id,
      courseId,
      data.page,
      data.x,
      data.y,
      data.width,
      data.height,
      data.targetMediaId,
    ]);

    logger.info(`Hyperlink created: ${id}`);
    return id;
  }

  /**
   * Update hyperlink
   * 更新超链接
   */
  static async updateHyperlink(hyperlinkId: string, data: UpdateHyperlinkInput): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];

    const updatable = ["page", "x", "y", "width", "height", "target_media_id"];
    const dataMap: Record<string, any> = {
      page: data.page,
      x: data.x,
      y: data.y,
      width: data.width,
      height: data.height,
      target_media_id: data.targetMediaId,
    };

    for (const field of updatable) {
      if (dataMap[field] !== undefined) {
        fields.push(`${field} = ?`);
        params.push(dataMap[field]);
      }
    }

    if (fields.length === 0) return false;

    params.push(hyperlinkId);
    const sql = `UPDATE course_hyperlinks SET ${fields.join(", ")} WHERE id = ?`;
    await query(sql, params);

    logger.info(`Hyperlink updated: ${hyperlinkId}`);
    return true;
  }

  /**
   * Delete hyperlink
   * 删除超链接
   */
  static async deleteHyperlink(hyperlinkId: string): Promise<boolean> {
    const sql = "DELETE FROM course_hyperlinks WHERE id = ?";
    await query(sql, [hyperlinkId]);
    logger.info(`Hyperlink deleted: ${hyperlinkId}`);
    return true;
  }
}
