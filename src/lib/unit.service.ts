/**
 * Unit Service
 * 单元管理 API 服务
 *
 * Handles all API calls related to unit management
 * 处理单元管理相关的所有 API 调用
 */

import { api } from "./api";
import type { LabelI18n, Course } from "./course.service";

// =====================================================
// Types / 类型定义
// =====================================================

export interface UnitMainSlide {
  id: string;
  url: string;
  title: LabelI18n;
}

export interface Unit {
  id: string;
  title: LabelI18n;
  description: LabelI18n;
  coverImage?: string;
  color: string;
  sortOrder: number;
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
  color: string;
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
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || "Failed to fetch units");
  },

  /**
   * Get unit by ID (public)
   * 获取单个单元 (公开)
   */
  async getPublicUnit(unitId: string): Promise<Unit> {
    const response = await api.get<Unit>(`/api/units/public/${unitId}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || "Failed to fetch unit");
  },

  /**
   * Get main slide for a unit (public)
   * 获取单元的主课件 (公开)
   */
  async getPublicMainSlide(unitId: string): Promise<UnitMainSlide | null> {
    const response = await api.get<UnitMainSlide | null>(
      `/api/units/public/${unitId}/main-slide`
    );
    if (response.success) {
      return response.data || null;
    }
    throw new Error(response.error?.message || "Failed to fetch main slide");
  },

  /**
   * Get all courses for a unit (public)
   * 获取单元的所有课程 (公开)
   */
  async getPublicUnitCourses(unitId: string): Promise<UnitCourse[]> {
    const response = await api.get<UnitCourse[]>(
      `/api/units/public/${unitId}/courses`
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || "Failed to fetch unit courses");
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
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || "Failed to fetch units");
  },

  /**
   * Get unit by ID
   * 获取单个单元
   */
  async getUnit(unitId: string): Promise<Unit> {
    const response = await api.get<Unit>(`/api/units/${unitId}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || "Failed to fetch unit");
  },

  /**
   * Create unit
   * 创建单元
   */
  async createUnit(data: CreateUnitInput): Promise<Unit> {
    const response = await api.post<Unit>("/api/units", data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || "Failed to create unit");
  },

  /**
   * Update unit
   * 更新单元
   */
  async updateUnit(unitId: string, data: UpdateUnitInput): Promise<Unit> {
    const response = await api.put<Unit>(`/api/units/${unitId}`, data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || "Failed to update unit");
  },

  /**
   * Delete unit
   * 删除单元
   */
  async deleteUnit(unitId: string): Promise<void> {
    const response = await api.delete<null>(`/api/units/${unitId}`);
    if (!response.success) {
      throw new Error(response.error?.message || "Failed to delete unit");
    }
  },

  /**
   * Reorder units
   * 重新排序单元
   */
  async reorderUnits(unitIds: string[]): Promise<void> {
    const response = await api.put<null>("/api/units/reorder", { unitIds });
    if (!response.success) {
      throw new Error(response.error?.message || "Failed to reorder units");
    }
  },

  // =====================================================
  // Main Slide / 主课件
  // =====================================================

  /**
   * Get main slide for a unit
   * 获取单元的主课件
   */
  async getMainSlide(unitId: string): Promise<UnitMainSlide | null> {
    const response = await api.get<UnitMainSlide | null>(
      `/api/units/${unitId}/main-slide`
    );
    if (response.success) {
      return response.data || null;
    }
    throw new Error(response.error?.message || "Failed to fetch main slide");
  },

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
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || "Failed to upsert main slide");
  },

  /**
   * Delete main slide
   * 删除主课件
   */
  async deleteMainSlide(unitId: string): Promise<void> {
    const response = await api.delete<null>(`/api/units/${unitId}/main-slide`);
    if (!response.success) {
      throw new Error(response.error?.message || "Failed to delete main slide");
    }
  },

  // =====================================================
  // Unit Courses / 单元课程
  // =====================================================

  /**
   * Get all courses for a unit
   * 获取单元的所有课程
   */
  async getUnitCourses(unitId: string): Promise<UnitCourse[]> {
    const response = await api.get<UnitCourse[]>(
      `/api/units/${unitId}/courses`
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || "Failed to fetch unit courses");
  },
};
