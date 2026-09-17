/**
 * Unit Types
 * 单元相关类型定义
 */

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

export interface ExperimentCategoryInput {
  name_zh: string;
  name_en?: string;
}

export interface UpsertUnitMainSlideInput {
  url: string;
  title_zh?: string;
  title_en?: string;
}

// =====================================================
// Database Row Types / 数据库行类型
// =====================================================

/** 经典实验子分类（单元内有序，实验通过 experiment_category_id 引用） */
export interface ExperimentCategory {
  id: string;
  name_zh: string;
  name_en: string | null;
}

export interface UnitRow {
  id: string;
  title_zh: string;
  title_en: string | null;
  description_zh: string | null;
  description_en: string | null;
  cover_image: string | null;
  color: string;
  sort_order: number;
  /** 旧文档没有该字段，读取时视为空数组 */
  experiment_categories?: ExperimentCategory[];
  created_at: Date;
  updated_at: Date;
}

export interface UnitMainSlideRow {
  id: string;
  unit_id: string;
  url: string;
  title_zh: string | null;
  title_en: string | null;
  created_at: Date;
  updated_at: Date;
}
