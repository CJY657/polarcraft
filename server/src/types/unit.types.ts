/**
 * Unit Types
 * 单元相关类型定义
 */

import type { LabelI18n, Course } from "./course.types.js";

// =====================================================
// Unit Types / 单元类型
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
  courses?: Course[];
  createdAt: string;
  updatedAt: string;
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
// Database Row Types / 数据库行类型
// =====================================================

export interface UnitRow {
  id: string;
  title_zh: string;
  title_en: string | null;
  description_zh: string | null;
  description_en: string | null;
  cover_image: string | null;
  color: string;
  sort_order: number;
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
