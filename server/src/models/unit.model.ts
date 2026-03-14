/**
 * Unit Model
 * 单元数据模型
 */

import { getCollection } from '../database/connection.js';
import { normalizeDocument, normalizeDocuments, pickDefined } from '../database/mongo.util.js';
import { generateId } from '../utils/crypto.util.js';
import { logger } from '../utils/logger.js';
import { CourseModel } from './course.model.js';
import type {
  UnitRow,
  UnitMainSlideRow,
  CreateUnitInput,
  UpdateUnitInput,
  UpsertUnitMainSlideInput,
} from '../types/unit.types.js';
import type { CourseRow } from '../types/course.types.js';

const unitsCollection = () => getCollection('units');
const unitMainSlidesCollection = () => getCollection('unit_main_slides');
const coursesCollection = () => getCollection('courses');

export class UnitModel {
  /**
   * Get all units
   * 获取所有单元
   */
  static async getAllUnits(): Promise<UnitRow[]> {
    return normalizeDocuments<UnitRow>(
      await unitsCollection().find({}).sort({ sort_order: 1, created_at: -1 }).toArray()
    );
  }

  /**
   * Get unit by ID
   * 获取单元详情
   */
  static async getUnitById(unitId: string): Promise<UnitRow | null> {
    return normalizeDocument<UnitRow>(await unitsCollection().findOne({ id: unitId }));
  }

  /**
   * Create unit
   * 创建单元
   */
  static async createUnit(data: CreateUnitInput): Promise<string> {
    const maxOrderRow = normalizeDocument<Pick<UnitRow, 'sort_order'>>(
      await unitsCollection().findOne({}, { sort: { sort_order: -1 } })
    );
    const sortOrder = (maxOrderRow?.sort_order ?? -1) + 1;
    const now = new Date();
    const unit: UnitRow = {
      id: generateId(),
      title_zh: data.title_zh,
      title_en: data.title_en || null,
      description_zh: data.description_zh || null,
      description_en: data.description_en || null,
      cover_image: data.coverImage || null,
      color: data.color || '#3B82F6',
      sort_order: sortOrder,
      created_at: now,
      updated_at: now,
    };

    await unitsCollection().insertOne(unit as unknown as Record<string, unknown>);

    logger.info(`Unit created: ${unit.id}`);
    return unit.id;
  }

  /**
   * Update unit
   * 更新单元
   */
  static async updateUnit(unitId: string, data: UpdateUnitInput): Promise<boolean> {
    const updateDoc = pickDefined({
      title_zh: data.title_zh,
      title_en: data.title_en,
      description_zh: data.description_zh,
      description_en: data.description_en,
      cover_image: data.coverImage,
      color: data.color,
      sort_order: data.sortOrder,
    });

    if (Object.keys(updateDoc).length === 0) {
      return false;
    }

    const result = await unitsCollection().updateOne(
      { id: unitId },
      { $set: { ...updateDoc, updated_at: new Date() } }
    );

    logger.info(`Unit updated: ${unitId}`);
    return result.matchedCount > 0;
  }

  /**
   * Delete unit
   * 删除单元
   */
  static async deleteUnit(unitId: string): Promise<boolean> {
    const existingUnit = await unitsCollection().findOne({ id: unitId }, { projection: { id: 1 } });
    if (!existingUnit) {
      return false;
    }

    const relatedCourses = normalizeDocuments<Pick<CourseRow, 'id'>>(
      await coursesCollection().find({ unit_id: unitId }, { projection: { id: 1 } }).toArray()
    );

    await unitMainSlidesCollection().deleteMany({ unit_id: unitId });
    await CourseModel.deleteCoursesByIds(relatedCourses.map((course) => course.id));
    await unitsCollection().deleteOne({ id: unitId });

    logger.info(`Unit deleted: ${unitId}`);
    return true;
  }

  /**
   * Reorder units
   * 重新排序单元
   */
  static async reorderUnits(unitIds: string[]): Promise<boolean> {
    const now = new Date();
    await Promise.all(
      unitIds.map((unitId, index) =>
        unitsCollection().updateOne(
          { id: unitId },
          { $set: { sort_order: index, updated_at: now } }
        )
      )
    );

    logger.info('Units reordered');
    return true;
  }

  /**
   * Get main slide by unit ID
   * 获取单元的主课件
   */
  static async getMainSlide(unitId: string): Promise<UnitMainSlideRow | null> {
    return normalizeDocument<UnitMainSlideRow>(
      await unitMainSlidesCollection().findOne({ unit_id: unitId })
    );
  }

  /**
   * Upsert main slide
   * 创建或更新主课件
   */
  static async upsertMainSlide(unitId: string, data: UpsertUnitMainSlideInput): Promise<string> {
    const existing = await this.getMainSlide(unitId);
    const now = new Date();

    if (existing) {
      await unitMainSlidesCollection().updateOne(
        { unit_id: unitId },
        {
          $set: {
            url: data.url,
            title_zh: data.title_zh || null,
            title_en: data.title_en || null,
            updated_at: now,
          },
        }
      );

      logger.info(`Unit main slide updated for unit: ${unitId}`);
      return existing.id;
    }

    const slide: UnitMainSlideRow = {
      id: generateId(),
      unit_id: unitId,
      url: data.url,
      title_zh: data.title_zh || null,
      title_en: data.title_en || null,
      created_at: now,
      updated_at: now,
    };

    await unitMainSlidesCollection().insertOne(slide as unknown as Record<string, unknown>);

    logger.info(`Unit main slide created for unit: ${unitId}`);
    return slide.id;
  }

  /**
   * Delete main slide
   * 删除主课件
   */
  static async deleteMainSlide(unitId: string): Promise<boolean> {
    const result = await unitMainSlidesCollection().deleteOne({ unit_id: unitId });
    logger.info(`Unit main slide deleted for unit: ${unitId}`);
    return result.deletedCount > 0;
  }

  /**
   * Get courses by unit ID
   * 获取单元下的所有课程
   */
  static async getCoursesByUnit(unitId: string): Promise<CourseRow[]> {
    return normalizeDocuments<CourseRow>(
      await coursesCollection()
        .find({ unit_id: unitId })
        .sort({ sort_order: 1, created_at: 1 })
        .toArray()
    );
  }
}
