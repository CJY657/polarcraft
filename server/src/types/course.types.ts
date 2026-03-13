/**
 * Course Types
 * 课程相关类型定义
 */

// =====================================================
// Label Types / 标签类型
// =====================================================

export interface LabelI18n {
  'zh-CN'?: string;
  'en-US'?: string;
}

// =====================================================
// Media Types / 媒体类型
// =====================================================

export type MediaType = 'pptx' | 'image' | 'video';

// =====================================================
// Course Types / 课程类型
// =====================================================

export interface CourseMainSlide {
  id: string;
  url: string;
  title: LabelI18n;
}

export interface CourseMedia {
  id: string;
  type: MediaType;
  url: string;
  previewPdfUrl?: string;
  title: LabelI18n;
  duration?: number;
  sortOrder: number;
}

export interface CourseHyperlink {
  id: string;
  sourceMediaId?: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  targetMediaId: string;
}

export interface Course {
  id: string;
  unitId: string;
  title: LabelI18n;
  description: LabelI18n;
  coverImage?: string;
  color: string;
  mainSlide?: CourseMainSlide;
  media: CourseMedia[];
  hyperlinks: CourseHyperlink[];
  createdAt: string;
  updatedAt: string;
}

// =====================================================
// Input Types / 输入类型
// =====================================================

export interface CreateCourseInput {
  unitId: string;
  title_zh: string;
  title_en?: string;
  description_zh?: string;
  description_en?: string;
  coverImage?: string;
  color?: string;
}

export interface UpdateCourseInput {
  unitId?: string;
  title_zh?: string;
  title_en?: string;
  description_zh?: string;
  description_en?: string;
  coverImage?: string;
  color?: string;
  sortOrder?: number;
}

export interface CreateMainSlideInput {
  url: string;
  title_zh?: string;
  title_en?: string;
}

export interface CreateMediaInput {
  type: MediaType;
  url: string;
  previewPdfUrl?: string;
  title_zh: string;
  title_en?: string;
  duration?: number;
}

export interface UpdateMediaInput {
  type?: MediaType;
  url?: string;
  previewPdfUrl?: string;
  title_zh?: string;
  title_en?: string;
  duration?: number;
  sort_order?: number;
}

export interface CreateHyperlinkInput {
  sourceMediaId: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  targetMediaId: string;
}

export interface UpdateHyperlinkInput {
  sourceMediaId?: string;
  page?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  targetMediaId?: string;
}

// =====================================================
// Database Row Types / 数据库行类型
// =====================================================

export interface CourseRow {
  id: string;
  unit_id: string;
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

export interface MainSlideRow {
  id: string;
  course_id: string;
  url: string;
  title_zh: string | null;
  title_en: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface MediaRow {
  id: string;
  course_id: string;
  type: MediaType;
  url: string;
  preview_pdf_url: string | null;
  title_zh: string;
  title_en: string | null;
  duration: number | null;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface HyperlinkRow {
  id: string;
  course_id: string;
  source_media_id: string | null;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  target_media_id: string;
  created_at: Date;
  updated_at: Date;
}
