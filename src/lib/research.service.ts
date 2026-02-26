/**
 * Research Service
 * 研究项目 API 服务
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
  default_canvas_id: string | null;
  member_count: number;
  canvas_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  joined_at: string;
  username: string;
  avatar_url: string | null;
}

export interface ProjectWithMembers extends ResearchProject {
  members: ProjectMember[];
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
  // Projects / 项目
  // =====================================================

  /**
   * Get user's projects
   * 获取用户的项目列表
   */
  getUserProjects: async (): Promise<ResearchProject[]> => {
    const response = await api.get<ResearchProject[]>('/api/research/projects');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || '获取项目列表失败');
  },

  /**
   * Get project by ID
   * 获取项目详情
   */
  getProject: async (projectId: string): Promise<ProjectWithMembers> => {
    const response = await api.get<ProjectWithMembers>(`/api/research/projects/${projectId}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || '获取项目详情失败');
  },

  /**
   * Create new project
   * 创建新项目
   */
  createProject: async (input: CreateProjectInput): Promise<ResearchProject> => {
    const response = await api.post<ResearchProject>('/api/research/projects', input);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || '创建项目失败');
  },

  /**
   * Update project
   * 更新项目
   */
  updateProject: async (projectId: string, input: UpdateProjectInput): Promise<ResearchProject> => {
    const response = await api.put<ResearchProject>(`/api/research/projects/${projectId}`, input);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || '更新项目失败');
  },

  /**
   * Delete project
   * 删除项目
   */
  deleteProject: async (projectId: string): Promise<void> => {
    const response = await api.delete(`/api/research/projects/${projectId}`);
    if (!response.success) {
      throw new Error(response.error?.message || '删除项目失败');
    }
  },

  /**
   * Add member to project
   * 添加项目成员
   */
  addProjectMember: async (projectId: string, userId: string, role: 'admin' | 'editor' | 'viewer' = 'viewer'): Promise<void> => {
    const response = await api.post(`/api/research/projects/${projectId}/members`, { userId, role });
    if (!response.success) {
      throw new Error(response.error?.message || '添加成员失败');
    }
  },

  /**
   * Remove member from project
   * 移除项目成员
   */
  removeProjectMember: async (projectId: string, userId: string): Promise<void> => {
    const response = await api.delete(`/api/research/projects/${projectId}/members/${userId}`);
    if (!response.success) {
      throw new Error(response.error?.message || '移除成员失败');
    }
  },

  // =====================================================
  // Canvases / 画布
  // =====================================================

  /**
   * Get project canvases
   * 获取项目的画布列表
   */
  getProjectCanvases: async (projectId: string): Promise<any[]> => {
    const response = await api.get<any[]>(`/api/research/projects/${projectId}/canvases`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || '获取画布列表失败');
  },

  /**
   * Get canvas by ID
   * 获取画布详情
   */
  getCanvas: async (canvasId: string): Promise<any> => {
    const response = await api.get<any>(`/api/research/canvases/${canvasId}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || '获取画布详情失败');
  },

  /**
   * Create canvas
   * 创建画布
   */
  createCanvas: async (projectId: string, data: { name_zh: string; name_en?: string }): Promise<any> => {
    const response = await api.post<any>(`/api/research/projects/${projectId}/canvases`, data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || '创建画布失败');
  },

  // =====================================================
  // Activity / 活动日志
  // =====================================================

  /**
   * Get project activity log
   * 获取项目活动日志
   */
  getProjectActivity: async (projectId: string, limit: number = 50): Promise<any[]> => {
    const response = await api.get<any[]>(`/api/research/projects/${projectId}/activity?limit=${limit}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || '获取活动日志失败');
  },
};
