/**
 * Profile Service
 * 个人资料 API 服务
 */

import { api } from './api';

// =====================================================
// Types / 类型定义
// =====================================================

export interface UserEducation {
  id: string;
  user_id: string;
  organization: string;
  major: string;
  start_date: string; // YYYY-MM format
  end_date: string | null;
  is_current: boolean;
  degree_level: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateEducationInput {
  organization: string;
  major: string;
  start_date: string; // YYYY-MM format
  end_date?: string;
  is_current?: boolean;
  degree_level?: string;
}

export interface UpdateEducationInput {
  organization?: string;
  major?: string;
  start_date?: string;
  end_date?: string | null;
  is_current?: boolean;
  degree_level?: string;
}

export type ProjectVisibility = 'public' | 'private' | 'invite_only';

export interface ProjectSettings {
  id: string;
  project_id: string;
  visibility: ProjectVisibility;
  require_approval: boolean;
  recruitment_requirements: string | null;
  max_members: number | null;
  recruitment_deadline: string | null;
  is_recruiting: boolean;
  contact_email: string | null;
  discussion_channel: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectSettingsInput {
  visibility?: ProjectVisibility;
  require_approval?: boolean;
  recruitment_requirements?: string;
  max_members?: number;
  recruitment_deadline?: string;
  is_recruiting?: boolean;
  contact_email?: string;
  discussion_channel?: string;
}

export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn';

export interface ProjectApplication {
  id: string;
  project_id: string;
  user_id: string;
  display_name: string;
  organization: string;
  education_id: string | null;
  major: string | null;
  grade: string | null;
  research_experience: string | null;
  expertise: string | null;
  motivation: string | null;
  status: ApplicationStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  username?: string;
  avatar_url?: string | null;
  project_name?: string;
}

export interface CreateApplicationInput {
  display_name: string;
  organization: string;
  education_id?: string;
  major?: string;
  grade?: string;
  research_experience?: string;
  expertise?: string;
  motivation?: string;
}

export interface ProjectCreatorProfile {
  id: string;
  project_id: string;
  user_id: string;
  display_name: string;
  organization: string;
  education_id: string | null;
  major: string | null;
  grade: string | null;
  created_at: string;
  updated_at: string;
  username?: string;
}

export interface CreateProjectWithProfileInput {
  project: {
    name_zh: string;
    name_en?: string;
    description_zh?: string;
    description_en?: string;
    is_public?: boolean;
  };
  creatorProfile: {
    display_name?: string;
    organization: string;
    education_id?: string;
    major?: string;
    grade?: string;
  };
  settings?: CreateProjectSettingsInput;
}

export interface PublicProject {
  id: string;
  name_zh: string;
  name_en: string | null;
  description_zh: string | null;
  description_en: string | null;
  thumbnail: string | null;
  status: string;
  visibility: ProjectVisibility;
  require_approval: boolean;
  recruitment_requirements: string | null;
  is_recruiting: boolean;
  max_members: number | null;
  member_count: number;
  is_member: boolean;
  created_at: string;
  updated_at: string;
}

// =====================================================
// Profile API Methods / 个人资料 API 方法
// =====================================================

export const profileApi = {
  // =====================================================
  // Educations / 教育经历
  // =====================================================

  /**
   * Get user's education records
   * 获取用户的教育经历
   */
  getUserEducations: async (): Promise<UserEducation[]> => {
    const response = await api.get<UserEducation[]>('/api/profile/educations');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || '获取教育经历失败');
  },

  /**
   * Create education record
   * 创建教育经历
   */
  createEducation: async (data: CreateEducationInput): Promise<UserEducation> => {
    const response = await api.post<UserEducation>('/api/profile/educations', data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || '创建教育经历失败');
  },

  /**
   * Update education record
   * 更新教育经历
   */
  updateEducation: async (id: string, data: UpdateEducationInput): Promise<UserEducation> => {
    const response = await api.put<UserEducation>(`/api/profile/educations/${id}`, data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || '更新教育经历失败');
  },

  /**
   * Delete education record
   * 删除教育经历
   */
  deleteEducation: async (id: string): Promise<void> => {
    const response = await api.delete(`/api/profile/educations/${id}`);
    if (!response.success) {
      throw new Error(response.error?.message || '删除教育经历失败');
    }
  },

  // =====================================================
  // Applications / 申请
  // =====================================================

  /**
   * Get user's applications
   * 获取用户的申请列表
   */
  getUserApplications: async (): Promise<ProjectApplication[]> => {
    const response = await api.get<ProjectApplication[]>('/api/profile/applications');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || '获取申请列表失败');
  },

  /**
   * Get project applications (admin)
   * 获取项目申请列表（管理员）
   */
  getProjectApplications: async (projectId: string): Promise<ProjectApplication[]> => {
    const response = await api.get<ProjectApplication[]>(
      `/api/research/projects/${projectId}/applications`
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || '获取申请列表失败');
  },

  /**
   * Create application to join project
   * 创建加入项目申请
   */
  createApplication: async (
    projectId: string,
    data: CreateApplicationInput
  ): Promise<ProjectApplication> => {
    const response = await api.post<ProjectApplication>(
      `/api/research/projects/${projectId}/applications`,
      data
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || '提交申请失败');
  },

  /**
   * Update application status (approve/reject)
   * 更新申请状态
   */
  updateApplicationStatus: async (
    applicationId: string,
    status: 'approved' | 'rejected',
    reviewNotes?: string
  ): Promise<void> => {
    const response = await api.put(`/api/research/applications/${applicationId}/status`, {
      status,
      review_notes: reviewNotes,
    });
    if (!response.success) {
      throw new Error(response.error?.message || '处理申请失败');
    }
  },

  /**
   * Withdraw application
   * 撤回申请
   */
  withdrawApplication: async (applicationId: string): Promise<void> => {
    const response = await api.delete(`/api/research/applications/${applicationId}`);
    if (!response.success) {
      throw new Error(response.error?.message || '撤回申请失败');
    }
  },

  // =====================================================
  // Project Settings / 项目设置
  // =====================================================

  /**
   * Get project settings
   * 获取项目设置
   */
  getProjectSettings: async (projectId: string): Promise<ProjectSettings> => {
    const response = await api.get<ProjectSettings>(
      `/api/research/projects/${projectId}/settings`
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || '获取项目设置失败');
  },

  /**
   * Update project settings
   * 更新项目设置
   */
  updateProjectSettings: async (
    projectId: string,
    data: Partial<ProjectSettings>
  ): Promise<ProjectSettings> => {
    const response = await api.put<ProjectSettings>(
      `/api/research/projects/${projectId}/settings`,
      data
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || '更新项目设置失败');
  },

  // =====================================================
  // Project Creator Profile / 项目创建者资料
  // =====================================================

  /**
   * Get project creator profiles
   * 获取项目创建者资料
   */
  getCreatorProfiles: async (projectId: string): Promise<ProjectCreatorProfile[]> => {
    const response = await api.get<ProjectCreatorProfile[]>(
      `/api/research/projects/${projectId}/creator-profiles`
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || '获取创建者资料失败');
  },

  /**
   * Create project with creator profile
   * 创建项目（包含创建者资料）
   */
  createProjectWithProfile: async (data: CreateProjectWithProfileInput): Promise<any> => {
    const response = await api.post<any>('/api/research/projects/with-profile', data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || '创建项目失败');
  },

  // =====================================================
  // Public Projects / 公开项目
  // =====================================================

  /**
   * Get public projects
   * 获取公开项目列表
   */
  getPublicProjects: async (filters?: {
    recruiting?: boolean;
    search?: string;
  }): Promise<PublicProject[]> => {
    const params = new URLSearchParams();
    if (filters?.recruiting !== undefined) {
      params.append('recruiting', String(filters.recruiting));
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }
    const queryString = params.toString();
    const url = queryString
      ? `/api/profile/public-projects?${queryString}`
      : '/api/profile/public-projects';

    const response = await api.get<PublicProject[]>(url);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || '获取公开项目失败');
  },
};
