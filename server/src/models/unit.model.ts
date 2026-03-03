/**
 * Unit Model
 * 单元数据模型
 */

import { query, queryOne } from "../database/connection.js";
import { generateId } from "../utils/crypto.util.js";
import { logger } from "../utils/logger.js";
import type {
  UnitRow,
  UnitMainSlideRow,
  CreateUnitInput,
  UpdateUnitInput,
  UpsertUnitMainSlideInput,
} from "../types/unit.types.js";
import type { CourseRow } from "../types/course.types.js";

/**
 * Unit Model Class
 * 单元模型类
 */
export class UnitModel {
  // ============================================================
  // Units / 单元
  // ============================================================

  /**
   * Get all units
   * 获取所有单元
   */
  static async getAllUnits(): Promise<UnitRow[]> {
    const sql = `
      SELECT * FROM units
      ORDER BY sort_order ASC, created_at DESC
    `;
    return await query(sql);
  }

  /**
   * Get unit by ID
   * 获取单元详情
   */
  static async getUnitById(unitId: string): Promise<UnitRow | null> {
    const sql = "SELECT * FROM units WHERE id = ?";
    return await queryOne(sql, [unitId]);
  }

  /**
   * Create unit
   * 创建单元
   */
  static async createUnit(data: CreateUnitInput): Promise<string> {
    const id = generateId();

    // Get max sort order
    const maxOrderSql = "SELECT COALESCE(MAX(sort_order), -1) as max_order FROM units";
    const result = await queryOne<{ max_order: number }>(maxOrderSql);
    const sortOrder = (result?.max_order ?? -1) + 1;

    const sql = `
      INSERT INTO units (
        id, title_zh, title_en, description_zh, description_en,
        cover_image, color, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await query(sql, [
      id,
      data.title_zh,
      data.title_en || null,
      data.description_zh || null,
      data.description_en || null,
      data.coverImage || null,
      data.color || "#3B82F6",
      sortOrder,
    ]);

    logger.info(`Unit created: ${id}`);
    return id;
  }

  /**
   * Update unit
   * 更新单元
   */
  static async updateUnit(unitId: string, data: UpdateUnitInput): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];

    const updatable = [
      "title_zh",
      "title_en",
      "description_zh",
      "description_en",
      "cover_image",
      "color",
      "sort_order",
    ];

    const dataMap: Record<string, string | number | undefined> = {
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

    params.push(unitId);
    const sql = `UPDATE units SET ${fields.join(", ")} WHERE id = ?`;
    await query(sql, params);

    logger.info(`Unit updated: ${unitId}`);
    return true;
  }

  /**
   * Delete unit
   * 删除单元
   */
  static async deleteUnit(unitId: string): Promise<boolean> {
    const sql = "DELETE FROM units WHERE id = ?";
    await query(sql, [unitId]);
    logger.info(`Unit deleted: ${unitId}`);
    return true;
  }

  /**
   * Reorder units
   * 重新排序单元
   */
  static async reorderUnits(unitIds: string[]): Promise<boolean> {
    const sql = "UPDATE units SET sort_order = ? WHERE id = ?";

    for (let i = 0; i < unitIds.length; i++) {
      await query(sql, [i, unitIds[i]]);
    }

    logger.info(`Units reordered`);
    return true;
  }

  // ============================================================
  // Main Slide / 主课件
  // ============================================================

  /**
   * Get main slide by unit ID
   * 获取单元的主课件
   */
  static async getMainSlide(unitId: string): Promise<UnitMainSlideRow | null> {
    const sql = "SELECT * FROM unit_main_slides WHERE unit_id = ?";
    return await queryOne(sql, [unitId]);
  }

  /**
   * Upsert main slide
   * 创建或更新主课件
   */
  static async upsertMainSlide(unitId: string, data: UpsertUnitMainSlideInput): Promise<string> {
    // Check if exists
    const existing = await this.getMainSlide(unitId);

    if (existing) {
      // Update
      const sql = `
        UPDATE unit_main_slides
        SET url = ?, title_zh = ?, title_en = ?
        WHERE unit_id = ?
      `;
      await query(sql, [data.url, data.title_zh || null, data.title_en || null, unitId]);
      logger.info(`Unit main slide updated for unit: ${unitId}`);
      return existing.id;
    } else {
      // Create
      const id = generateId();
      const sql = `
        INSERT INTO unit_main_slides (id, unit_id, url, title_zh, title_en)
        VALUES (?, ?, ?, ?, ?)
      `;
      await query(sql, [id, unitId, data.url, data.title_zh || null, data.title_en || null]);
      logger.info(`Unit main slide created for unit: ${unitId}`);
      return id;
    }
  }

  /**
   * Delete main slide
   * 删除主课件
   */
  static async deleteMainSlide(unitId: string): Promise<boolean> {
    const sql = "DELETE FROM unit_main_slides WHERE unit_id = ?";
    await query(sql, [unitId]);
    logger.info(`Unit main slide deleted for unit: ${unitId}`);
    return true;
  }

  // ============================================================
  // Courses / 关联课程
  // ============================================================

  /**
   * Get courses by unit ID
   * 获取单元下的所有课程
   */
  static async getCoursesByUnit(unitId: string): Promise<CourseRow[]> {
    const sql = `
      SELECT * FROM courses
      WHERE unit_id = ?
      ORDER BY sort_order ASC, created_at ASC
    `;
    return await query(sql, [unitId]);
  }
}
