/**
 * Research Service
 * 研究课题 API 服务
 *
 * Handles all API calls related to the virtual research group system
 * 处理虚拟课题组系统相关的所有 API 调用
 */

import { api, ensureApiSuccess, unwrapApiData } from './api';
import type { ProjectStatus } from '@/feature/research/projectLifecycle';

export type { ProjectStatus } from '@/feature/research/projectLifecycle';

// =====================================================
// Types / 类型定义
// =====================================================

export interface ResearchProject {
  id: string;
  owner_user_id?: string | null;
  name_zh: string;
  name_en: string | null;
  description_zh: string | null;
  description_en: string | null;
  research_questions_zh?: string | null;
  research_hypotheses_zh?: string | null;
  basic_plan_zh?: string | null;
  extended_plan_zh?: string | null;
  challenge_value_zh?: string | null;
  challenge_objectives_zh?: string | null;
  challenge_beginner_steps_zh?: string | null;
  challenge_min_deliverables_zh?: string | null;
  challenge_review_criteria_zh?: string | null;
  challenge_timeline_zh?: string | null;
  challenge_difficulty?: 'beginner' | 'intermediate' | 'advanced' | null;
  challenge_roles_zh?: string | null;
  challenge_missing_roles_zh?: string | null;
  challenge_progress_zh?: string | null;
  thumbnail: string | null;
  cover_image?: string | null;
  status: ProjectStatus;
  last_activity_at?: string | null;
  is_dormant?: boolean;
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
  member_role_label?: string | null;
  active?: boolean;
  removed_at?: string | null;
  joined_at: string;
  username: string;
  nickname?: string | null;
  real_name?: string | null;
  show_real_name_publicly?: boolean;
  avatar_url: string | null;
}

export interface FormerProjectMember extends ProjectMember {
  active: false;
  removed_at: string | null;
}

export interface ProjectLeadershipTransferIdentity {
  user_id: string;
  username: string;
  nickname?: string | null;
  real_name?: string | null;
  show_real_name_publicly?: boolean;
  avatar_url: string | null;
}

export interface PendingProjectLeadershipTransfer {
  id: string;
  outgoing_owner: ProjectLeadershipTransferIdentity;
  nominee: ProjectLeadershipTransferIdentity;
  initiator: ProjectLeadershipTransferIdentity;
  created_at: string;
  expires_at: string;
  can_accept: boolean;
  can_decline: boolean;
  can_cancel: boolean;
  can_replace: boolean;
}

export interface ProjectWithMembers extends ResearchProject {
  members: ProjectMember[];
  former_members?: FormerProjectMember[];
  has_pending_application?: boolean;
  pending_leadership_transfer?: PendingProjectLeadershipTransfer | null;
}

export interface ProjectDiscussionComment {
  id: string;
  project_id: string;
  user_id: string;
  parent_comment_id: string | null;
  question_index?: number | null;
  content: string;
  image_urls: string[];
  video_urls: string[];
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  username: string;
  nickname?: string | null;
  real_name?: string | null;
  show_real_name_publicly?: boolean;
  avatar_url: string | null;
}

export type ProjectReviewVerdict = 'approve' | 'request_changes';

export interface ProjectReview {
  id: string;
  project_id: string;
  cycle_id: string;
  reviewer_id: string;
  verdict: ProjectReviewVerdict;
  content: string;
  created_at: string;
  updated_at: string;
  reviewer_username: string;
  reviewer_nickname?: string | null;
  reviewer_real_name?: string | null;
  reviewer_show_real_name_publicly?: boolean;
  reviewer_avatar_url: string | null;
}

export interface UpsertProjectReviewInput {
  verdict: ProjectReviewVerdict;
  content: string;
}

export type ProjectTaskStatus = 'todo' | 'doing' | 'done';

export interface ProjectTask {
  id: string;
  project_id: string;
  cycle_id: string;
  title: string;
  assignee_user_id: string | null;
  status: ProjectTaskStatus;
  due_date: string | null;
  created_by: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  assignee_username: string;
  assignee_nickname?: string | null;
  assignee_real_name?: string | null;
  assignee_show_real_name_publicly?: boolean;
  assignee_avatar_url: string | null;
}

export interface CreateProjectTaskInput {
  title: string;
  assignee_user_id?: string | null;
  due_date?: string | null;
}

export interface UpdateProjectTaskInput {
  title?: string;
  assignee_user_id?: string | null;
  status?: ProjectTaskStatus;
  due_date?: string | null;
}

export interface ProjectActivityItem {
  id: string;
  project_id: string;
  user_id: string;
  action: string;
  target_type: string;
  target_id: string;
  changes?: Record<string, unknown> | null;
  created_at: string;
  username: string;
  nickname?: string | null;
  real_name?: string | null;
  show_real_name_publicly?: boolean;
  avatar_url: string | null;
}

export type ProjectEvidenceType =
  | 'image_observation'
  | 'data_table'
  | 'source_literature'
  | 'experiment_log'
  | 'code_prototype'
  | 'failure_record'
  | 'other';

export type ProjectEvidenceAttachmentCategory = 'image' | 'video' | 'pdf' | 'pptx';

export interface ProjectEvidenceAttachment {
  url: string;
  original_name: string | null;
  size: number | null;
  mime_type: string | null;
  category: ProjectEvidenceAttachmentCategory | string | null;
}

export interface ProjectEvidence {
  id: string;
  project_id: string;
  title: string;
  evidence_type: ProjectEvidenceType;
  description: string | null;
  external_url: string | null;
  attachment_url: string | null;
  attachment_original_name: string | null;
  attachment_size: number | null;
  attachment_mime_type: string | null;
  attachment_category: ProjectEvidenceAttachmentCategory | string | null;
  attachment_note: string | null;
  attachments: ProjectEvidenceAttachment[];
  attachment_urls?: string[];
  sort_order: number;
  created_by: string;
  creator_username: string;
  creator_nickname?: string | null;
  creator_real_name?: string | null;
  creator_show_real_name_publicly?: boolean;
  creator_avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpsertProjectEvidenceInput {
  title: string;
  evidence_type: ProjectEvidenceType;
  description?: string | null;
  external_url?: string | null;
  attachment_url?: string | null;
  attachment_original_name?: string | null;
  attachment_size?: number | null;
  attachment_mime_type?: string | null;
  attachment_category?: ProjectEvidenceAttachmentCategory | null;
  attachment_note?: string | null;
  attachments?: ProjectEvidenceAttachment[];
}

export interface ReorderProjectEvidenceInput {
  expectedEvidenceIds: string[];
  evidenceIds: string[];
}

export interface ResearchAgentMessage {
  id: string;
  project_id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  model: string | null;
  usage?: Record<string, unknown> | null;
  created_at: string;
  username?: string;
  nickname?: string | null;
  real_name?: string | null;
  show_real_name_publicly?: boolean;
  avatar_url?: string | null;
}

export interface ResearchAgentMessagesResponse {
  enabled: boolean;
  messages: ResearchAgentMessage[];
}

export type ResearchAgentLiveMessage = Pick<ResearchAgentMessage, 'role' | 'content'>;

export interface SendResearchAgentMessageResponse {
  user: ResearchAgentMessage;
  assistant: ResearchAgentMessage;
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

export interface ProjectCoverImageUploadResult extends ProjectDiscussionImageUploadResult {}

export interface ProjectDiscussionVideoUploadResult {
  url: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  category: 'video';
  unitId: string;
}

export interface ProjectEvidenceAttachmentUploadResult {
  url: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  category: ProjectEvidenceAttachmentCategory;
  unitId: string;
}

export interface CreateProjectInput {
  name_zh: string;
  name_en?: string;
  description_zh?: string;
  description_en?: string;
  research_questions_zh?: string;
  research_hypotheses_zh?: string;
  basic_plan_zh?: string;
  extended_plan_zh?: string;
  challenge_value_zh?: string;
  challenge_objectives_zh?: string;
  challenge_beginner_steps_zh?: string;
  challenge_min_deliverables_zh?: string;
  challenge_review_criteria_zh?: string;
  challenge_timeline_zh?: string;
  challenge_difficulty?: 'beginner' | 'intermediate' | 'advanced';
  challenge_roles_zh?: string;
  challenge_missing_roles_zh?: string;
  challenge_progress_zh?: string;
  is_public?: boolean;
}

export interface UpdateProjectInput {
  name_zh?: string;
  name_en?: string;
  description_zh?: string;
  description_en?: string;
  research_questions_zh?: string;
  research_hypotheses_zh?: string;
  basic_plan_zh?: string;
  extended_plan_zh?: string;
  challenge_value_zh?: string | null;
  challenge_objectives_zh?: string | null;
  challenge_beginner_steps_zh?: string | null;
  challenge_min_deliverables_zh?: string | null;
  challenge_review_criteria_zh?: string | null;
  challenge_timeline_zh?: string | null;
  challenge_difficulty?: 'beginner' | 'intermediate' | 'advanced' | null;
  challenge_roles_zh?: string | null;
  challenge_missing_roles_zh?: string | null;
  challenge_progress_zh?: string | null;
  thumbnail?: string | null;
  status?: ProjectStatus;
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
    return unwrapApiData(response, '获取课题列表失败');
  },

  /**
   * Get project by ID
   * 获取课题详情
   */
  getProject: async (projectId: string): Promise<ProjectWithMembers> => {
    const response = await api.get<ProjectWithMembers>(`/api/research/projects/${projectId}`);
    return unwrapApiData(response, '获取课题详情失败');
  },

  /**
   * Create new project
   * 创建新课题
   */
  createProject: async (input: CreateProjectInput): Promise<ResearchProject> => {
    const response = await api.post<ResearchProject>('/api/research/projects', input);
    return unwrapApiData(response, '创建课题失败');
  },

  /**
   * Update project
   * 更新课题
   */
  updateProject: async (projectId: string, input: UpdateProjectInput): Promise<ResearchProject> => {
    const response = await api.put<ResearchProject>(`/api/research/projects/${projectId}`, input);
    return unwrapApiData(response, '更新课题失败');
  },

  /**
   * Upload project cover image
   * 上传课题封面图片
   */
  uploadProjectCoverImage: async (
    projectId: string,
    file: File
  ): Promise<ProjectCoverImageUploadResult> => {
    const response = await api.upload<ProjectCoverImageUploadResult>(
      `/api/research/projects/${projectId}/cover-image`,
      file
    );
    return unwrapApiData(response, '上传课题封面失败');
  },

  /**
   * Delete project
   * 删除课题
   */
  deleteProject: async (projectId: string, confirmationText: string): Promise<void> => {
    const response = await api.delete(`/api/research/projects/${projectId}`, { confirmationText });
    ensureApiSuccess(response, '删除课题失败');
  },

  /**
   * Add member to project
   * 添加课题成员
   */
  addProjectMember: async (
    projectId: string,
    userId: string,
    role: 'member' = 'member',
    memberRoleLabel?: string | null
  ): Promise<void> => {
    const response = await api.post(`/api/research/projects/${projectId}/members`, {
      userId,
      role,
      memberRoleLabel,
    });
    ensureApiSuccess(response, '添加成员失败');
  },

  /**
   * Remove member from project
   * 移除课题成员
   */
  removeProjectMember: async (projectId: string, userId: string): Promise<void> => {
    const response = await api.delete(`/api/research/projects/${projectId}/members/${userId}`);
    ensureApiSuccess(response, '移除成员失败');
  },

  /**
   * Nominate or replace the next project leader
   * 提名或更换下一任课题组长
   */
  nominateProjectLeadershipTransfer: async (projectId: string, targetUserId: string): Promise<void> => {
    const response = await api.put(`/api/research/projects/${projectId}/leadership-transfer`, {
      targetUserId,
    });
    ensureApiSuccess(response, '发起组长转让失败');
  },

  /**
   * Cancel a pending project leadership transfer
   * 取消待处理的课题组长转让
   */
  cancelProjectLeadershipTransfer: async (projectId: string, transferId: string): Promise<void> => {
    const response = await api.delete(
      `/api/research/projects/${projectId}/leadership-transfer/${transferId}`
    );
    ensureApiSuccess(response, '取消组长转让失败');
  },

  /**
   * Accept a pending project leadership transfer
   * 接受课题组长转让
   */
  acceptProjectLeadershipTransfer: async (projectId: string, transferId: string): Promise<void> => {
    const response = await api.post(
      `/api/research/projects/${projectId}/leadership-transfer/${transferId}/accept`
    );
    ensureApiSuccess(response, '接受组长转让失败');
  },

  /**
   * Decline a pending project leadership transfer
   * 拒绝课题组长转让
   */
  declineProjectLeadershipTransfer: async (projectId: string, transferId: string): Promise<void> => {
    const response = await api.post(
      `/api/research/projects/${projectId}/leadership-transfer/${transferId}/decline`
    );
    ensureApiSuccess(response, '拒绝组长转让失败');
  },

  /**
   * Get project discussion comments
   * 获取课题讨论评论
   */
  getProjectDiscussionComments: async (projectId: string): Promise<ProjectDiscussionComment[]> => {
    const response = await api.get<ProjectDiscussionComment[]>(`/api/research/projects/${projectId}/discussion-comments`);
    return unwrapApiData(response, '获取课题讨论失败');
  },

  /**
   * Add project discussion comment
   * 发布课题讨论评论
   */
  addProjectDiscussionComment: async (
    projectId: string,
    input: {
      content: string;
      parentCommentId?: string;
      questionIndex?: number;
      imageUrls?: string[];
      videoUrls?: string[];
    }
  ): Promise<{ id: string }> => {
    const response = await api.post<{ id: string }>(`/api/research/projects/${projectId}/discussion-comments`, input);
    return unwrapApiData(response, '发布讨论留言失败');
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
    return unwrapApiData(response, '上传讨论图片失败');
  },

  /**
   * Upload project discussion video
   * 上传课题讨论视频
   */
  uploadProjectDiscussionVideo: async (
    projectId: string,
    file: File
  ): Promise<ProjectDiscussionVideoUploadResult> => {
    const response = await api.upload<ProjectDiscussionVideoUploadResult>(
      `/api/research/projects/${projectId}/discussion-videos`,
      file
    );
    return unwrapApiData(response, '上传讨论视频失败');
  },

  /**
   * Delete project discussion comment
   * 删除课题讨论评论
   */
  deleteProjectDiscussionComment: async (commentId: string): Promise<void> => {
    const response = await api.delete(`/api/research/discussion-comments/${commentId}`);
    ensureApiSuccess(response, '删除讨论留言失败');
  },

  /**
   * Update project discussion comment (author-only, text only)
   * 编辑课题讨论评论（仅作者本人，只改文字）
   */
  updateProjectDiscussionComment: async (commentId: string, content: string): Promise<void> => {
    const response = await api.put(`/api/research/discussion-comments/${commentId}`, { content });
    ensureApiSuccess(response, '编辑讨论留言失败');
  },

  // =====================================================
  // Peer Reviews / 同伴评审
  // =====================================================

  /**
   * Get project peer reviews (current cycle)
   * 获取课题同伴评审（当前周期）
   */
  getProjectReviews: async (projectId: string): Promise<ProjectReview[]> => {
    const response = await api.get<ProjectReview[]>(`/api/research/projects/${projectId}/reviews`);
    return unwrapApiData(response, '获取同伴评审失败');
  },

  /**
   * Create or update own peer review
   * 提交或更新自己的同伴评审
   */
  upsertMyProjectReview: async (
    projectId: string,
    input: UpsertProjectReviewInput
  ): Promise<ProjectReview> => {
    const response = await api.put<ProjectReview>(`/api/research/projects/${projectId}/reviews/me`, input);
    return unwrapApiData(response, '提交评审失败');
  },

  /**
   * Delete a peer review (author or admin)
   * 删除同伴评审（作者本人或管理员）
   */
  deleteProjectReview: async (reviewId: string): Promise<void> => {
    const response = await api.delete(`/api/research/reviews/${reviewId}`);
    ensureApiSuccess(response, '删除评审失败');
  },

  // =====================================================
  // Project Tasks / 任务分工
  // =====================================================

  /**
   * Get project tasks (current cycle)
   * 获取课题任务（当前周期）
   */
  getProjectTasks: async (projectId: string): Promise<ProjectTask[]> => {
    const response = await api.get<ProjectTask[]>(`/api/research/projects/${projectId}/tasks`);
    return unwrapApiData(response, '获取任务列表失败');
  },

  /**
   * Create project task
   * 创建课题任务
   */
  createProjectTask: async (projectId: string, input: CreateProjectTaskInput): Promise<ProjectTask> => {
    const response = await api.post<ProjectTask>(`/api/research/projects/${projectId}/tasks`, input);
    return unwrapApiData(response, '创建任务失败');
  },

  /**
   * Update project task
   * 更新课题任务
   */
  updateProjectTask: async (taskId: string, input: UpdateProjectTaskInput): Promise<ProjectTask> => {
    const response = await api.put<ProjectTask>(`/api/research/tasks/${taskId}`, input);
    return unwrapApiData(response, '更新任务失败');
  },

  /**
   * Delete project task
   * 删除课题任务
   */
  deleteProjectTask: async (taskId: string): Promise<void> => {
    const response = await api.delete(`/api/research/tasks/${taskId}`);
    ensureApiSuccess(response, '删除任务失败');
  },

  /**
   * Get project evidence
   * 获取课题证据库
   */
  getProjectEvidence: async (projectId: string): Promise<ProjectEvidence[]> => {
    const response = await api.get<ProjectEvidence[]>(`/api/research/projects/${projectId}/evidence`);
    return unwrapApiData(response, '获取证据库失败');
  },

  /**
   * Create project evidence
   * 新增课题证据
   */
  createProjectEvidence: async (
    projectId: string,
    input: UpsertProjectEvidenceInput
  ): Promise<ProjectEvidence> => {
    const response = await api.post<ProjectEvidence>(`/api/research/projects/${projectId}/evidence`, input);
    return unwrapApiData(response, '新增证据失败');
  },

  /**
   * Reorder project evidence
   * 调整课题证据顺序
   */
  reorderProjectEvidence: async (
    projectId: string,
    input: ReorderProjectEvidenceInput
  ): Promise<ProjectEvidence[]> => {
    const response = await api.put<ProjectEvidence[]>(
      `/api/research/projects/${projectId}/evidence/order`,
      input
    );
    return unwrapApiData(response, '更新证据顺序失败');
  },

  /**
   * Update project evidence
   * 更新课题证据
   */
  updateProjectEvidence: async (
    projectId: string,
    evidenceId: string,
    input: UpsertProjectEvidenceInput
  ): Promise<ProjectEvidence> => {
    const response = await api.put<ProjectEvidence>(
      `/api/research/projects/${projectId}/evidence/${evidenceId}`,
      input
    );
    return unwrapApiData(response, '更新证据失败');
  },

  /**
   * Delete project evidence
   * 删除课题证据
   */
  deleteProjectEvidence: async (projectId: string, evidenceId: string): Promise<void> => {
    const response = await api.delete(`/api/research/projects/${projectId}/evidence/${evidenceId}`);
    ensureApiSuccess(response, '删除证据失败');
  },

  /**
   * Upload project evidence attachment
   * 上传课题证据附件
   */
  uploadProjectEvidenceAttachment: async (
    projectId: string,
    category: ProjectEvidenceAttachmentCategory,
    file: File
  ): Promise<ProjectEvidenceAttachmentUploadResult> => {
    const response = await api.upload<ProjectEvidenceAttachmentUploadResult>(
      `/api/research/projects/${projectId}/evidence-attachments/${category}`,
      file
    );
    return unwrapApiData(response, '上传证据附件失败');
  },

  /**
   * Get project AI advisor messages
   * 获取课题 AI 顾问消息
   */
  getProjectAgentMessages: async (
    projectId: string,
    limit: number = 30
  ): Promise<ResearchAgentMessagesResponse> => {
    const response = await api.get<ResearchAgentMessagesResponse>(
      `/api/research/projects/${projectId}/agent/messages?limit=${limit}`
    );
    return unwrapApiData(response, '获取 AI 顾问消息失败');
  },

  /**
   * Send project AI advisor message
   * 发送课题 AI 顾问消息
   */
  sendProjectAgentMessage: async (
    projectId: string,
    content: string,
    history: ResearchAgentLiveMessage[] = []
  ): Promise<SendResearchAgentMessageResponse> => {
    const response = await api.post<SendResearchAgentMessageResponse>(
      `/api/research/projects/${projectId}/agent/messages`,
      { content, history }
    );
    return unwrapApiData(response, 'AI 顾问暂时不可用');
  },

  /**
   * Clear project AI advisor messages
   * 清空课题 AI 顾问消息
   */
  clearProjectAgentMessages: async (projectId: string): Promise<{ deletedCount: number }> => {
    const response = await api.delete<{ deletedCount: number }>(
      `/api/research/projects/${projectId}/agent/messages`
    );
    return unwrapApiData(response, '清空 AI 顾问消息失败');
  },

  // =====================================================
  // Activity / 活动日志
  // =====================================================

  /**
   * Get project activity log
   * 获取课题活动日志
   */
  getProjectActivity: async (projectId: string, limit: number = 50): Promise<ProjectActivityItem[]> => {
    const response = await api.get<ProjectActivityItem[]>(`/api/research/projects/${projectId}/activity?limit=${limit}`);
    return unwrapApiData(response, '获取活动日志失败');
  },
};
