/**
 * Profile Types
 * 个人资料和教育经历类型
 */

// =====================================================
// User Education / 用户教育经历
// =====================================================

export interface UserEducation {
  id: string;
  user_id: string;
  organization: string;
  major: string;
  start_date: string; // YYYY-MM-DD format (day is always 01)
  end_date: string | null; // NULL means "present"
  is_current: boolean;
  degree_level: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateEducationInput {
  organization: string;
  major: string;
  start_date: string; // YYYY-MM format
  end_date?: string; // YYYY-MM format, omit if current
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

// =====================================================
// Project Settings / 项目设置
// =====================================================

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
  created_at: Date;
  updated_at: Date;
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

export interface UpdateProjectSettingsInput {
  visibility?: ProjectVisibility;
  require_approval?: boolean;
  recruitment_requirements?: string;
  max_members?: number | null;
  recruitment_deadline?: string | null;
  is_recruiting?: boolean;
  contact_email?: string;
  discussion_channel?: string;
}

// =====================================================
// Project Creator Profile / 项目创建者资料
// =====================================================

export interface ProjectCreatorProfile {
  id: string;
  project_id: string;
  user_id: string;
  display_name: string;
  organization: string;
  education_id: string | null;
  major: string | null;
  grade: string | null;
  created_at: Date;
  updated_at: Date;
  username?: string;
}

export interface CreateCreatorProfileInput {
  display_name: string;
  organization: string;
  education_id?: string;
  major?: string;
  grade?: string;
}

// =====================================================
// Project Application / 项目申请
// =====================================================

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
  reviewed_at: Date | null;
  review_notes: string | null;
  created_at: Date;
  updated_at: Date;
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

export interface UpdateApplicationStatusInput {
  status: 'approved' | 'rejected';
  review_notes?: string;
}
