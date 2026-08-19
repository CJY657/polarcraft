/**
 * Course Types
 * 课程相关类型定义
 */

// =====================================================
// Media Types / 媒体类型
// =====================================================

export type MediaType = 'pptx' | 'pdf' | 'image' | 'video';

export type KnowledgeTag =
  | 'foundation'
  | 'optical_device'
  | 'student_ppt'
  | 'student_poster'
  | 'student_project';

// =====================================================
// Input Types / 输入类型
// =====================================================

export interface CreateCourseInput {
  unitId: string;
  title_zh: string;
  title_en?: string;
  description_zh?: string;
  description_en?: string;
  coverImage?: string | null;
  color?: string;
  knowledgeTag?: KnowledgeTag;
}

export interface UpdateCourseInput {
  unitId?: string;
  title_zh?: string;
  title_en?: string;
  description_zh?: string;
  description_en?: string;
  coverImage?: string | null;
  color?: string;
  knowledgeTag?: KnowledgeTag;
  sortOrder?: number;
}

export interface CreateMainSlideInput {
  url: string;
  title_zh?: string;
  title_en?: string;
  knowledgeTag?: KnowledgeTag;
}

export interface CreateMediaInput {
  type: MediaType;
  url: string;
  previewPdfUrl?: string;
  title_zh: string;
  title_en?: string;
  knowledgeTag?: KnowledgeTag;
  duration?: number;
}

export interface UpdateMediaInput {
  type?: MediaType;
  url?: string;
  previewPdfUrl?: string;
  title_zh?: string;
  title_en?: string;
  knowledgeTag?: KnowledgeTag;
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
  knowledge_tag?: KnowledgeTag | null;
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
  knowledge_tag?: KnowledgeTag | null;
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
  knowledge_tag?: KnowledgeTag | null;
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

export interface CourseDiscussionCommentRow {
  id: string;
  course_id: string;
  user_id: string;
  nickname?: string | null;
  real_name?: string | null;
  show_real_name_publicly?: boolean;
  parent_comment_id: string | null;
  content: string;
  image_urls: string[];
  resource_id: string | null;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}
