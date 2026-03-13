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

export type MediaType = "pptx" | "image" | "video";

export interface MainSlide {
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
  mainSlide?: MainSlide;
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

export interface UpsertMainSlideInput {
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
   * Get main slide for a course (public)
   * 获取课程的主课件 (公开)
   */
  async getPublicMainSlide(courseId: string): Promise<MainSlide | null> {
    const response = await api.get<MainSlide | null>(
      `/api/courses/public/${courseId}/main-slide`
    );
    if (response.success) {
      return response.data || null;
    }
    throw new Error(response.error?.message || "Failed to fetch main slide");
  },

  /**
   * Get all media for a course (public)
   * 获取课程的所有媒体 (公开)
   */
  async getPublicMediaList(courseId: string): Promise<CourseMedia[]> {
    const response = await api.get<CourseMedia[]>(
      `/api/courses/public/${courseId}/media`
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || "Failed to fetch media list");
  },

  /**
   * Get all hyperlinks for a course (public)
   * 获取课程的所有超链接 (公开)
   */
  async getPublicHyperlinks(courseId: string): Promise<CourseHyperlink[]> {
    const response = await api.get<CourseHyperlink[]>(
      `/api/courses/public/${courseId}/hyperlinks`
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || "Failed to fetch hyperlinks");
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
   * Get main slide for a course
   * 获取课程的主课件
   */
  async getMainSlide(courseId: string): Promise<MainSlide | null> {
    const response = await api.get<MainSlide | null>(
      `/api/courses/${courseId}/main-slide`
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

  // =====================================================
  // Media / 媒体资源
  // =====================================================

  /**
   * Get all media for a course
   * 获取课程的所有媒体
   */
  async getMediaList(courseId: string): Promise<CourseMedia[]> {
    const response = await api.get<CourseMedia[]>(`/api/courses/${courseId}/media`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || "Failed to fetch media list");
  },

  /**
   * Get media by ID
   * 获取单个媒体
   */
  async getMedia(mediaId: string): Promise<CourseMedia> {
    const response = await api.get<CourseMedia>(`/api/courses/media/${mediaId}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || "Failed to fetch media");
  },

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
   * Get all hyperlinks for a course
   * 获取课程的所有超链接
   */
  async getHyperlinks(courseId: string): Promise<CourseHyperlink[]> {
    const response = await api.get<CourseHyperlink[]>(
      `/api/courses/${courseId}/hyperlinks`
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || "Failed to fetch hyperlinks");
  },

  /**
   * Get hyperlinks by page
   * 获取特定页面的超链接
   */
  async getHyperlinksByPage(
    courseId: string,
    page: number
  ): Promise<CourseHyperlink[]> {
    const response = await api.get<CourseHyperlink[]>(
      `/api/courses/${courseId}/hyperlinks/page/${page}`
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || "Failed to fetch hyperlinks");
  },

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
