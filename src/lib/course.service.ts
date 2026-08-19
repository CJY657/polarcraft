/**
 * Course Service
 * 课程管理 API 服务
 *
 * Handles all API calls related to course management
 * 处理课程管理相关的所有 API 调用
 */

import { api } from "./api";

// =====================================================
// Types / 类型定义
// =====================================================

export interface LabelI18n {
  "zh-CN"?: string;
  "en-US"?: string;
}

export type MediaType = "pptx" | "pdf" | "image" | "video";

export const KNOWLEDGE_TAGS = [
  "foundation",
  "optical_device",
  "student_ppt",
  "student_poster",
  "student_project",
] as const;

export type KnowledgeTag = (typeof KNOWLEDGE_TAGS)[number];

export const KNOWLEDGE_TAG_LABELS: Record<
  KnowledgeTag,
  { "zh-CN": string; "en-US": string }
> = {
  foundation: {
    "zh-CN": "基础知识",
    "en-US": "Foundation",
  },
  optical_device: {
    "zh-CN": "光学设备",
    "en-US": "Optical device",
  },
  student_ppt: {
    "zh-CN": "学生PPT",
    "en-US": "Student PPT",
  },
  student_poster: {
    "zh-CN": "学生海报",
    "en-US": "Student poster",
  },
  student_project: {
    "zh-CN": "学生项目",
    "en-US": "Student project",
  },
};

export function isKnowledgeTag(tag: unknown): tag is KnowledgeTag {
  return typeof tag === "string" && (KNOWLEDGE_TAGS as readonly string[]).includes(tag);
}

export function normalizeKnowledgeTag(tag?: string | null): KnowledgeTag {
  return isKnowledgeTag(tag) ? tag : "foundation";
}

export function getKnowledgeTagLabel(tag: KnowledgeTag | undefined | null, isZh: boolean): string {
  return KNOWLEDGE_TAG_LABELS[normalizeKnowledgeTag(tag)][isZh ? "zh-CN" : "en-US"];
}

export interface MainSlide {
  id: string;
  url: string;
  title: LabelI18n;
  knowledgeTag: KnowledgeTag;
}

export interface CourseMedia {
  id: string;
  type: MediaType;
  url: string;
  previewPdfUrl?: string;
  title: LabelI18n;
  knowledgeTag: KnowledgeTag;
  duration?: number;
  sortOrder?: number;
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
  knowledgeTag: KnowledgeTag;
  sortOrder: number;
  mainSlide?: MainSlide;
  media: CourseMedia[];
  hyperlinks: CourseHyperlink[];
  createdAt: string;
  updatedAt: string;
}

export interface CourseDiscussionComment {
  id: string;
  courseId: string;
  userId: string;
  parentCommentId: string | null;
  username: string;
  nickname?: string | null;
  realName?: string | null;
  showRealNamePublicly?: boolean;
  avatarUrl: string | null;
  content: string;
  imageUrls: string[];
  resourceId: string | null;
  resourceTitle: LabelI18n | null;
  isDeleted: boolean;
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

export interface UpsertMainSlideInput {
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

export interface CreateCourseDiscussionCommentInput {
  content: string;
  parentCommentId?: string;
  imageUrls?: string[];
  resourceId?: string;
}

export interface CourseDiscussionImageUploadResult {
  url: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  category: 'image';
  unitId: string;
}

export interface DeleteMediaBatchResult {
  deletedCount: number;
}

// =====================================================
// Course API Service / 课程 API 服务
// =====================================================

export const courseApi = {
  // =====================================================
  // Public Courses / 公开课程 (无需认证)
  // =====================================================

  /**
   * Get all courses (public)
   * 获取所有课程 (公开)
   */
  async getPublicCourses(): Promise<Course[]> {
    const response = await api.get<Course[]>("/api/courses/public");
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || "Failed to fetch courses");
  },

  /**
   * Get course by ID (public)
   * 获取单个课程 (公开)
   */
  async getPublicCourse(courseId: string): Promise<Course> {
    const response = await api.get<Course>(`/api/courses/public/${courseId}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || "Failed to fetch course");
  },

  /**
   * Get public discussion comments for a course
   * 获取课程公开讨论评论
   */
  async getPublicDiscussionComments(courseId: string): Promise<CourseDiscussionComment[]> {
    const response = await api.get<CourseDiscussionComment[]>(
      `/api/courses/public/${courseId}/discussion-comments`
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || "Failed to fetch discussion comments");
  },

  // =====================================================
  // Courses / 课程 (Admin)
  // =====================================================

  /**
   * Get all courses
   * 获取所有课程
   */
  async getAllCourses(): Promise<Course[]> {
    const response = await api.get<Course[]>("/api/courses");
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || "Failed to fetch courses");
  },

  /**
   * Get course by ID
   * 获取单个课程
   */
  async getCourse(courseId: string): Promise<Course> {
    const response = await api.get<Course>(`/api/courses/${courseId}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || "Failed to fetch course");
  },

  /**
   * Create course
   * 创建课程
   */
  async createCourse(data: CreateCourseInput): Promise<Course> {
    const response = await api.post<Course>("/api/courses", data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || "Failed to create course");
  },

  /**
   * Update course
   * 更新课程
   */
  async updateCourse(courseId: string, data: UpdateCourseInput): Promise<Course> {
    const response = await api.put<Course>(`/api/courses/${courseId}`, data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || "Failed to update course");
  },

  /**
   * Delete course
   * 删除课程
   */
  async deleteCourse(courseId: string): Promise<void> {
    const response = await api.delete<null>(`/api/courses/${courseId}`);
    if (!response.success) {
      throw new Error(response.error?.message || "Failed to delete course");
    }
  },

  // =====================================================
  // Main Slide / 主课件
  // =====================================================

  /**
   * Upsert main slide
   * 创建或更新主课件
   */
  async upsertMainSlide(
    courseId: string,
    data: UpsertMainSlideInput
  ): Promise<MainSlide> {
    const response = await api.put<MainSlide>(
      `/api/courses/${courseId}/main-slide`,
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
  async deleteMainSlide(courseId: string): Promise<void> {
    const response = await api.delete<null>(`/api/courses/${courseId}/main-slide`);
    if (!response.success) {
      throw new Error(response.error?.message || "Failed to delete main slide");
    }
  },

  /**
   * Add discussion comment for a course
   * 添加课程讨论评论
   */
  async addDiscussionComment(
    courseId: string,
    data: CreateCourseDiscussionCommentInput
  ): Promise<{ id: string }> {
    const response = await api.post<{ id: string }>(
      `/api/courses/${courseId}/discussion-comments`,
      data
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || "Failed to add discussion comment");
  },

  /**
   * Delete discussion comment
   * 删除课程讨论评论
   */
  async deleteDiscussionComment(commentId: string): Promise<void> {
    const response = await api.delete<null>(`/api/courses/discussion-comments/${commentId}`);
    if (!response.success) {
      throw new Error(response.error?.message || "Failed to delete discussion comment");
    }
  },

  /**
   * Upload discussion image
   * 上传讨论图片
   */
  async uploadDiscussionImage(
    courseId: string,
    file: File
  ): Promise<CourseDiscussionImageUploadResult> {
    const response = await api.upload<CourseDiscussionImageUploadResult>(
      `/api/courses/${courseId}/discussion-images`,
      file
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || "上传讨论图片失败");
  },

  // =====================================================
  // Media / 媒体资源
  // =====================================================

  /**
   * Create media
   * 创建媒体资源
   */
  async createMedia(
    courseId: string,
    data: CreateMediaInput
  ): Promise<CourseMedia> {
    const response = await api.post<CourseMedia>(
      `/api/courses/${courseId}/media`,
      data
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || "Failed to create media");
  },

  /**
   * Update media
   * 更新媒体资源
   */
  async updateMedia(mediaId: string, data: UpdateMediaInput): Promise<CourseMedia> {
    const response = await api.put<CourseMedia>(
      `/api/courses/media/${mediaId}`,
      data
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || "Failed to update media");
  },

  /**
   * Delete media
   * 删除媒体资源
   */
  async deleteMedia(mediaId: string): Promise<void> {
    const response = await api.delete<null>(`/api/courses/media/${mediaId}`);
    if (!response.success) {
      throw new Error(response.error?.message || "Failed to delete media");
    }
  },

  /**
   * Batch delete media
   * 批量删除媒体资源
   */
  async deleteMediaBatch(mediaIds: string[]): Promise<DeleteMediaBatchResult> {
    const response = await api.delete<DeleteMediaBatchResult>("/api/courses/media", {
      mediaIds,
    });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || "Failed to batch delete media");
  },

  /**
   * Reorder media
   * 重新排序媒体
   */
  async reorderMedia(courseId: string, mediaIds: string[]): Promise<void> {
    const response = await api.put<null>(
      `/api/courses/${courseId}/media/reorder`,
      { mediaIds }
    );
    if (!response.success) {
      throw new Error(response.error?.message || "Failed to reorder media");
    }
  },

  // =====================================================
  // Hyperlinks / 超链接
  // =====================================================

  /**
   * Create hyperlink
   * 创建超链接
   */
  async createHyperlink(
    courseId: string,
    data: CreateHyperlinkInput
  ): Promise<CourseHyperlink> {
    const response = await api.post<CourseHyperlink>(
      `/api/courses/${courseId}/hyperlinks`,
      data
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || "Failed to create hyperlink");
  },

  /**
   * Update hyperlink
   * 更新超链接
   */
  async updateHyperlink(
    hyperlinkId: string,
    data: UpdateHyperlinkInput
  ): Promise<CourseHyperlink> {
    const response = await api.put<CourseHyperlink>(
      `/api/courses/hyperlinks/${hyperlinkId}`,
      data
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || "Failed to update hyperlink");
  },

  /**
   * Delete hyperlink
   * 删除超链接
   */
  async deleteHyperlink(hyperlinkId: string): Promise<void> {
    const response = await api.delete<null>(`/api/courses/hyperlinks/${hyperlinkId}`);
    if (!response.success) {
      throw new Error(response.error?.message || "Failed to delete hyperlink");
    }
  },
};
