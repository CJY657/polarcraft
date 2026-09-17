/**
 * Unit Service
 * 单元管理 API 服务
 *
 * Handles all API calls related to unit management
 * 处理单元管理相关的所有 API 调用
 */

import { api, unwrapApiData, ensureApiSuccess } from "./api";
import type { KnowledgeTag, LabelI18n } from "./course.service";

// =====================================================
// Types / 类型定义
// =====================================================

export interface UnitMainSlide {
  id: string;
  url: string;
  title: LabelI18n;
  knowledgeTag?: KnowledgeTag;
}

/** 经典实验子分类（单元内有序） */
export interface ExperimentCategory {
  id: string;
  name: LabelI18n;
}

export interface Unit {
  id: string;
  title: LabelI18n;
  description: LabelI18n;
  coverImage?: string;
  color: string;
  sortOrder: number;
  /** 旧接口/旧数据可能缺省，按空数组处理 */
  experimentCategories?: ExperimentCategory[];
  mainSlide?: UnitMainSlide;
  courses?: UnitCourse[];
  courseCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface UnitCourse {
  id: string;
  title: LabelI18n;
  description: LabelI18n;
  coverImage?: string;
  thumbnailImage?: string;
  color: string;
  knowledgeTag: KnowledgeTag;
  /** 仅经典实验有效；缺省或 null 表示未分类 */
  experimentCategoryId?: string | null;
  mainSlide?: UnitMainSlide;
  mediaCount?: number;
}

// =====================================================
// Input Types / 输入类型
// =====================================================

export interface CreateUnitInput {
  title_zh: string;
  title_en?: string;
  description_zh?: string;
  description_en?: string;
  coverImage?: string;
  color?: string;
}

export interface UpdateUnitInput {
  title_zh?: string;
  title_en?: string;
  description_zh?: string;
  description_en?: string;
  coverImage?: string;
  color?: string;
  sortOrder?: number;
}

export interface UpsertUnitMainSlideInput {
  url: string;
  title_zh?: string;
  title_en?: string;
}

export interface ExperimentCategoryInput {
  name_zh: string;
  name_en?: string;
}

// =====================================================
// Unit API Service / 单元 API 服务
// =====================================================

export const unitApi = {
  // =====================================================
  // Public Units / 公开单元 (无需认证)
  // =====================================================

  /**
   * Get all units (public)
   * 获取所有单元 (公开)
   */
  async getPublicUnits(): Promise<Unit[]> {
    const response = await api.get<Unit[]>("/api/units/public");
    return unwrapApiData(response, "Failed to fetch units");
  },

  /**
   * Get all courses for a unit (public)
   * 获取单元的所有课程 (公开)
   */
  async getPublicUnitCourses(unitId: string): Promise<UnitCourse[]> {
    const response = await api.get<UnitCourse[]>(
      `/api/units/public/${unitId}/courses`
    );
    return unwrapApiData(response, "Failed to fetch unit courses");
  },

  // =====================================================
  // Units / 单元 (Admin)
  // =====================================================

  /**
   * Get all units
   * 获取所有单元
   */
  async getAllUnits(): Promise<Unit[]> {
    const response = await api.get<Unit[]>("/api/units");
    return unwrapApiData(response, "Failed to fetch units");
  },

  /**
   * Get unit by ID
   * 获取单个单元
   */
  async getUnit(unitId: string): Promise<Unit> {
    const response = await api.get<Unit>(`/api/units/${unitId}`);
    return unwrapApiData(response, "Failed to fetch unit");
  },

  /**
   * Create unit
   * 创建单元
   */
  async createUnit(data: CreateUnitInput): Promise<Unit> {
    const response = await api.post<Unit>("/api/units", data);
    return unwrapApiData(response, "Failed to create unit");
  },

  /**
   * Update unit
   * 更新单元
   */
  async updateUnit(unitId: string, data: UpdateUnitInput): Promise<Unit> {
    const response = await api.put<Unit>(`/api/units/${unitId}`, data);
    return unwrapApiData(response, "Failed to update unit");
  },

  /**
   * Delete unit
   * 删除单元
   */
  async deleteUnit(unitId: string): Promise<void> {
    const response = await api.delete<null>(`/api/units/${unitId}`);
    ensureApiSuccess(response, "Failed to delete unit");
  },

  /**
   * Reorder units
   * 重新排序单元
   */
  async reorderUnits(unitIds: string[]): Promise<void> {
    const response = await api.put<null>("/api/units/reorder", { unitIds });
    ensureApiSuccess(response, "Failed to reorder units");
  },

  // =====================================================
  // Main Slide / 主课件
  // =====================================================

  /**
   * Upsert main slide
   * 创建或更新主课件
   */
  async upsertMainSlide(
    unitId: string,
    data: UpsertUnitMainSlideInput
  ): Promise<UnitMainSlide> {
    const response = await api.put<UnitMainSlide>(
      `/api/units/${unitId}/main-slide`,
      data
    );
    return unwrapApiData(response, "Failed to upsert main slide");
  },

  /**
   * Delete main slide
   * 删除主课件
   */
  async deleteMainSlide(unitId: string): Promise<void> {
    const response = await api.delete<null>(`/api/units/${unitId}/main-slide`);
    ensureApiSuccess(response, "Failed to delete main slide");
  },

  // =====================================================
  // Experiment Categories / 经典实验子分类
  // =====================================================

  async createExperimentCategory(
    unitId: string,
    data: ExperimentCategoryInput
  ): Promise<ExperimentCategory> {
    const response = await api.post<ExperimentCategory>(
      `/api/units/${unitId}/experiment-categories`,
      data
    );
    return unwrapApiData(response, "Failed to create category");
  },

  async updateExperimentCategory(
    unitId: string,
    categoryId: string,
    data: ExperimentCategoryInput
  ): Promise<ExperimentCategory> {
    const response = await api.put<ExperimentCategory>(
      `/api/units/${unitId}/experiment-categories/${categoryId}`,
      data
    );
    return unwrapApiData(response, "Failed to update category");
  },

  async deleteExperimentCategory(unitId: string, categoryId: string): Promise<void> {
    const response = await api.delete<null>(
      `/api/units/${unitId}/experiment-categories/${categoryId}`
    );
    ensureApiSuccess(response, "Failed to delete category");
  },

  async reorderExperimentCategories(unitId: string, categoryIds: string[]): Promise<void> {
    const response = await api.put<ExperimentCategory[]>(
      `/api/units/${unitId}/experiment-categories/reorder`,
      { categoryIds }
    );
    ensureApiSuccess(response, "Failed to reorder categories");
  },
};
