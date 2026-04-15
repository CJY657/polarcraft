/**
 * Research Service
 * 研究课题 API 服务
 *
 * Handles all API calls related to the virtual research group system
 * 处理虚拟课题组系统相关的所有 API 调用
 */

import { api } from './api';

// =====================================================
// Types / 类型定义
// =====================================================

export interface ResearchProject {
  id: string;
  name_zh: string;
  name_en: string | null;
  description_zh: string | null;
  description_en: string | null;
  thumbnail: string | null;
  status: 'draft' | 'active' | 'completed' | 'archived';
  is_public: boolean;
  allow_guest_comments: boolean;
  enable_task_board: boolean;
  member_count: number;
  canvas_count?: number;
  current_user_role?: 'owner' | 'member' | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: 'owner' | 'member';
  active?: boolean;
  removed_at?: string | null;
  joined_at: string;
  username: string;
  avatar_url: string | null;
}

export interface FormerProjectMember extends ProjectMember {
  active: false;
  removed_at: string | null;
}

export interface ProjectWithMembers extends ResearchProject {
  members: ProjectMember[];
  former_members?: FormerProjectMember[];
  has_pending_application?: boolean;
}

export interface ProjectDiscussionComment {
  id: string;
  project_id: string;
  user_id: string;
  parent_comment_id: string | null;
  content: string;
  image_urls: string[];
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  username: string;
  avatar_url: string | null;
}

export interface ProjectDiscussionImageUploadResult {
  url: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  category: 'image';
  unitId: string;
}

export interface CreateProjectInput {
  name_zh: string;
  name_en?: string;
  description_zh?: string;
  description_en?: string;
  is_public?: boolean;
}

export interface UpdateProjectInput {
  name_zh?: string;
  name_en?: string;
  description_zh?: string;
  description_en?: string;
  thumbnail?: string;
  status?: 'draft' | 'active' | 'completed' | 'archived';
  is_public?: boolean;
}

// =====================================================
// Research API Methods / 研究 API 方法
// =====================================================

export const researchApi = {
  // =====================================================
  // Projects / 课题
  // =====================================================

  /**
   * Get user's projects
   * 获取用户的课题列表
   */
  getUserProjects: async (): Promise<ResearchProject[]> => {
    const response = await api.get<ResearchProject[]>('/api/research/projects');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || '获取课题列表失败');
  },

  /**
   * Get project by ID
   * 获取课题详情
   */
  getProject: async (projectId: string): Promise<ProjectWithMembers> => {
    const response = await api.get<ProjectWithMembers>(`/api/research/projects/${projectId}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || '获取课题详情失败');
  },

  /**
   * Create new project
   * 创建新课题
   */
  createProject: async (input: CreateProjectInput): Promise<ResearchProject> => {
    const response = await api.post<ResearchProject>('/api/research/projects', input);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || '创建课题失败');
  },

  /**
   * Update project
   * 更新课题
   */
  updateProject: async (projectId: string, input: UpdateProjectInput): Promise<ResearchProject> => {
    const response = await api.put<ResearchProject>(`/api/research/projects/${projectId}`, input);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || '更新课题失败');
  },

  /**
   * Delete project
   * 删除课题
   */
  deleteProject: async (projectId: string): Promise<void> => {
    const response = await api.delete(`/api/research/projects/${projectId}`);
    if (!response.success) {
      throw new Error(response.error?.message || '删除课题失败');
    }
  },

  /**
   * Add member to project
   * 添加课题成员
   */
  addProjectMember: async (projectId: string, userId: string, role: 'member' = 'member'): Promise<void> => {
    const response = await api.post(`/api/research/projects/${projectId}/members`, { userId, role });
    if (!response.success) {
      throw new Error(response.error?.message || '添加成员失败');
    }
  },

  /**
   * Remove member from project
   * 移除课题成员
   */
  removeProjectMember: async (projectId: string, userId: string): Promise<void> => {
    const response = await api.delete(`/api/research/projects/${projectId}/members/${userId}`);
    if (!response.success) {
      throw new Error(response.error?.message || '移除成员失败');
    }
  },

  /**
   * Get project discussion comments
   * 获取课题讨论评论
   */
  getProjectDiscussionComments: async (projectId: string): Promise<ProjectDiscussionComment[]> => {
    const response = await api.get<ProjectDiscussionComment[]>(`/api/research/projects/${projectId}/discussion-comments`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || '获取课题讨论失败');
  },

  /**
   * Add project discussion comment
   * 发布课题讨论评论
   */
  addProjectDiscussionComment: async (
    projectId: string,
    input: { content: string; parentCommentId?: string; imageUrls?: string[] }
  ): Promise<{ id: string }> => {
    const response = await api.post<{ id: string }>(`/api/research/projects/${projectId}/discussion-comments`, input);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || '发布讨论留言失败');
  },

  /**
   * Upload project discussion image
   * 上传课题讨论图片
   */
  uploadProjectDiscussionImage: async (
    projectId: string,
    file: File
  ): Promise<ProjectDiscussionImageUploadResult> => {
    const response = await api.upload<ProjectDiscussionImageUploadResult>(
      `/api/research/projects/${projectId}/discussion-images`,
      file
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || '上传讨论图片失败');
  },

  /**
   * Delete project discussion comment
   * 删除课题讨论评论
   */
  deleteProjectDiscussionComment: async (commentId: string): Promise<void> => {
    const response = await api.delete(`/api/research/discussion-comments/${commentId}`);
    if (!response.success) {
      throw new Error(response.error?.message || '删除讨论留言失败');
    }
  },

  // =====================================================
  // Activity / 活动日志
  // =====================================================

  /**
   * Get project activity log
   * 获取课题活动日志
   */
  getProjectActivity: async (projectId: string, limit: number = 50): Promise<any[]> => {
    const response = await api.get<any[]>(`/api/research/projects/${projectId}/activity?limit=${limit}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || '获取活动日志失败');
  },
};
