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

export type ProjectMeetingStatus = 'scheduled' | 'completed' | 'cancelled';

export type MeetingRecordFileCategory = 'pdf' | 'image' | 'document';

export interface MeetingRecordFile {
  url: string;
  original_name: string | null;
  mime_type: string | null;
  size: number | null;
}

export interface MeetingAiScore {
  user_id: string;
  /** 0-100 */
  score: number;
  comment: string;
}

export interface MeetingMinutes {
  /** 纪要正文：会议列表端点不返回，需走会议详情端点获取 */
  content?: string;
  generated_by_ai: boolean;
  model: string | null;
  archived_at: string;
  archived_by: string;
}

export interface ProjectMeeting {
  id: string;
  project_id: string;
  title: string;
  scheduled_at: string;
  duration_minutes: number | null;
  location: string | null;
  agenda: string | null;
  status: ProjectMeetingStatus;
  created_by: string;
  /** 原始文字记录：仅会议详情端点返回 */
  raw_notes?: string | null;
  raw_file: MeetingRecordFile | null;
  attendee_ids: string[];
  /** 非组长/管理员仅含本人条目 */
  ai_scores: MeetingAiScore[] | null;
  minutes: MeetingMinutes | null;
  /** 会议列表端点附带的归档标志 */
  has_minutes?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectMeetingInput {
  title: string;
  scheduled_at: string;
  duration_minutes?: number | null;
  location?: string | null;
  agenda?: string | null;
}

export interface UpdateProjectMeetingInput {
  title?: string;
  scheduled_at?: string;
  duration_minutes?: number | null;
  location?: string | null;
  agenda?: string | null;
  status?: 'cancelled';
}

export interface GenerateMeetingMinutesInput {
  raw_notes: string;
  attendee_ids: string[];
}

export interface MeetingMinutesPreview {
  minutes_content: string;
  ai_scores: MeetingAiScore[];
}

export interface ArchiveMeetingMinutesInput {
  content: string;
  attendee_ids: string[];
  ai_scores?: MeetingAiScore[] | null;
  generated_by_ai: boolean;
  raw_notes?: string | null;
  raw_file?: MeetingRecordFile | null;
}

export interface MeetingRecordFileUploadResult {
  url: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  category: MeetingRecordFileCategory;
  unitId: string;
}

export interface UpsertMeetingRatingInput {
  ratee_id: string;
  /** 整数 1-5 */
  score: number;
  comment?: string | null;
}

export interface MeetingMemberRating {
  id: string;
  project_id: string;
  meeting_id: string;
  rater_id: string;
  ratee_id: string;
  score: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface MeetingRatingAggregate {
  ratee_id: string;
  avg: number;
  count: number;
}

export interface MeetingRatingsView {
  /** 我提交的互评（用于预填表单） */
  my_given: MeetingMemberRating[];
  /** 匿名聚合：各实到成员的平均星级与评分数 */
  aggregates: MeetingRatingAggregate[];
  /** 我收到的匿名短评列表（仅本人可见） */
  my_received_comments: string[];
}

export interface ProjectLeaderboardStanding {
  rank: number;
  /** 综合分（5 分制） */
  composite: number;
  /** AI 分均值（已折算 5 分制），无 AI 分时为 null */
  ai_avg: number | null;
  peer_avg: number | null;
  rated_meetings: number;
}

export interface ProjectLeaderboardEntry extends ProjectLeaderboardStanding {
  user_id: string;
  username: string;
  nickname?: string | null;
  real_name?: string | null;
  show_real_name_publicly?: boolean;
  avatar_url: string | null;
}

export interface ProjectLeaderboard {
  top: ProjectLeaderboardEntry[];
  me: ProjectLeaderboardStanding | null;
  /** 完整榜单：仅组长/管理员返回 */
  all?: ProjectLeaderboardEntry[];
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

  // =====================================================
  // Meetings & Member Ratings / 会议与成员互评
  // =====================================================

  /**
   * Get project meetings (newest first; list omits minutes content and raw notes)
   * 获取课题会议列表（倒序，列表不含纪要正文与原始记录）
   */
  getProjectMeetings: async (projectId: string): Promise<ProjectMeeting[]> => {
    const response = await api.get<ProjectMeeting[]>(`/api/research/projects/${projectId}/meetings`);
    return unwrapApiData(response, '获取会议列表失败');
  },

  /**
   * Get single meeting detail (full minutes content and raw record)
   * 获取会议详情（含纪要全文与原始记录）
   */
  getProjectMeeting: async (projectId: string, meetingId: string): Promise<ProjectMeeting> => {
    const response = await api.get<ProjectMeeting>(
      `/api/research/projects/${projectId}/meetings/${meetingId}`
    );
    return unwrapApiData(response, '获取会议详情失败');
  },

  /**
   * Create project meeting (owner/admin)
   * 创建课题会议（组长/管理员）
   */
  createProjectMeeting: async (
    projectId: string,
    input: CreateProjectMeetingInput
  ): Promise<ProjectMeeting> => {
    const response = await api.post<ProjectMeeting>(`/api/research/projects/${projectId}/meetings`, input);
    return unwrapApiData(response, '创建会议失败');
  },

  /**
   * Update or cancel project meeting (owner/admin)
   * 编辑或取消课题会议（组长/管理员）
   */
  updateProjectMeeting: async (
    projectId: string,
    meetingId: string,
    patch: UpdateProjectMeetingInput
  ): Promise<ProjectMeeting> => {
    const response = await api.patch<ProjectMeeting>(
      `/api/research/projects/${projectId}/meetings/${meetingId}`,
      patch
    );
    return unwrapApiData(response, '更新会议失败');
  },

  /**
   * Permanently delete a project meeting and its owned content
   * 永久删除课题会议及其关联内容
   */
  deleteProjectMeeting: async (projectId: string, meetingId: string): Promise<void> => {
    const response = await api.delete(
      `/api/research/projects/${projectId}/meetings/${meetingId}`
    );
    ensureApiSuccess(response, '删除会议失败');
  },

  /**
   * Generate AI meeting minutes preview (not persisted)
   * AI 生成会议纪要预览（不落库，归档时再回传）
   */
  generateMeetingMinutes: async (
    projectId: string,
    meetingId: string,
    input: GenerateMeetingMinutesInput
  ): Promise<MeetingMinutesPreview> => {
    const response = await api.post<MeetingMinutesPreview>(
      `/api/research/projects/${projectId}/meetings/${meetingId}/minutes/generate`,
      input
    );
    return unwrapApiData(response, 'AI 生成纪要失败');
  },

  /**
   * Archive meeting minutes (meeting becomes completed)
   * 归档会议纪要（会议随之标记完成）
   */
  archiveMeetingMinutes: async (
    projectId: string,
    meetingId: string,
    input: ArchiveMeetingMinutesInput
  ): Promise<void> => {
    const response = await api.post(
      `/api/research/projects/${projectId}/meetings/${meetingId}/minutes`,
      input
    );
    ensureApiSuccess(response, '归档会议纪要失败');
  },

  /**
   * Upload meeting record file
   * 上传会议记录文件
   */
  uploadMeetingRecordFile: async (
    projectId: string,
    category: MeetingRecordFileCategory,
    file: File
  ): Promise<MeetingRecordFileUploadResult> => {
    const response = await api.upload<MeetingRecordFileUploadResult>(
      `/api/research/projects/${projectId}/meetings/record-file/${category}`,
      file
    );
    return unwrapApiData(response, '上传会议记录文件失败');
  },

  /**
   * Create or update own rating for an attendee
   * 提交或更新自己对实到成员的互评
   */
  upsertMyMeetingRating: async (
    projectId: string,
    meetingId: string,
    input: UpsertMeetingRatingInput
  ): Promise<void> => {
    const response = await api.put(
      `/api/research/projects/${projectId}/meetings/${meetingId}/ratings/me`,
      input
    );
    ensureApiSuccess(response, '提交互评失败');
  },

  /**
   * Get meeting ratings (own given rows + anonymous aggregates)
   * 获取会议互评（我提交的评分与匿名聚合结果）
   */
  getMeetingRatings: async (projectId: string, meetingId: string): Promise<MeetingRatingsView> => {
    const response = await api.get<MeetingRatingsView>(
      `/api/research/projects/${projectId}/meetings/${meetingId}/ratings`
    );
    return unwrapApiData(response, '获取互评结果失败');
  },

  /**
   * Get project performance leaderboard (Top 3 + own standing)
   * 获取课题表现榜（Top 3 与我的名次）
   */
  getProjectLeaderboard: async (projectId: string): Promise<ProjectLeaderboard> => {
    const response = await api.get<ProjectLeaderboard>(
      `/api/research/projects/${projectId}/leaderboard`
    );
    return unwrapApiData(response, '获取表现榜失败');
  },
};
