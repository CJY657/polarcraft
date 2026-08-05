/**
 * Research Controller
 * 虚拟课题组控制器
 *
 * Handles research system HTTP requests
 * 处理虚拟课题组系统的 HTTP 请求
 */

import { Request, Response } from 'express';
import { uploadConfig } from '../config/upload.config.js';
import {
  ResearchModel,
  type CreateResearchProjectTaskInput,
  type PendingLeadershipTransfer,
  type ProjectEvidenceAttachment,
  type ResearchProjectEvidenceInput,
  type ResearchProjectEvidenceType,
  type UpdateResearchProjectTaskInput,
} from '../models/research.model.js';
import type {
  ResearchProjectReviewVerdict,
  ResearchProjectTaskStatus,
} from '../types/research-cycle.types.js';
import { NotificationModel } from '../models/notification.model.js';
import { ProfileModel } from '../models/profile.model.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { ManagedUploadCleanupService } from '../services/managed-upload-cleanup.service.js';
import {
  ProjectAccessService,
  type ProjectAccessLevel,
} from '../services/project-access.service.js';
import {
  RESEARCH_AGENT_SYSTEM_PROMPT,
  ResearchAgentDisabledError,
  ResearchAgentService,
  ResearchAgentUpstreamError,
  type ResearchAgentChatMessage,
} from '../services/research-agent.service.js';
import { generateId } from '../utils/crypto.util.js';
import { logger } from '../utils/logger.js';
import {
  isProjectStatusRollback,
  type ProjectStatus,
  validateProjectStatusTransition,
} from '../models/research-project.util.js';

const MAX_PROJECT_DISCUSSION_IMAGES = 6;
const MAX_PROJECT_DISCUSSION_VIDEOS = 2;
const MAX_RESEARCH_AGENT_CONTENT_LENGTH = 2000;
const MAX_RESEARCH_AGENT_HISTORY_MESSAGES = 12;
const MAX_PROJECT_REVIEW_CONTENT_LENGTH = 2000;
const MAX_PROJECT_TASK_TITLE_LENGTH = 200;
const MAX_PROJECT_EVIDENCE_ATTACHMENTS = 10;
const PROJECT_REVIEW_QUORUM = 2;
const LEADERSHIP_TRANSFER_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const PROJECT_REVIEW_VERDICTS: ResearchProjectReviewVerdict[] = ['approve', 'request_changes'];
const PROJECT_TASK_STATUSES: ResearchProjectTaskStatus[] = ['todo', 'doing', 'done'];
const managedUploadUrlPrefix = uploadConfig.publicUrlPrefix.replace(/\/+$/, '');
const DELETE_PROJECT_CONFIRMATION_KEYWORD = 'DELETE';
const RESEARCH_PROJECT_EVIDENCE_TYPES: ResearchProjectEvidenceType[] = [
  'image_observation',
  'data_table',
  'source_literature',
  'experiment_log',
  'code_prototype',
  'failure_record',
  'other',
];
const researchProjectEvidenceTypeSet = new Set<string>(RESEARCH_PROJECT_EVIDENCE_TYPES);
const researchProjectEvidenceAttachmentCategorySet = new Set(['image', 'video', 'pdf', 'pptx']);
const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: '草稿',
  recruiting: '招募中',
  forming: '组队中',
  active: '进行中',
  review_pending: '待评审',
  showcased: '已展示',
  relay_open: '接力开放',
  archived: '已归档',
};

function getPendingLeadershipTransfer(project: any): PendingLeadershipTransfer | null {
  const pending = project?.pending_leadership_transfer;
  if (
    !pending
    || typeof pending.id !== 'string'
    || typeof pending.outgoing_owner_user_id !== 'string'
    || typeof pending.nominee_user_id !== 'string'
    || typeof pending.initiated_by_user_id !== 'string'
    || typeof pending.invitation_notification_id !== 'string'
  ) {
    return null;
  }
  return pending as PendingLeadershipTransfer;
}

function isLeadershipTransferExpired(
  transfer: PendingLeadershipTransfer,
  now: Date = new Date()
): boolean {
  const expiresAt = new Date(transfer.expires_at).getTime();
  return !Number.isFinite(expiresAt) || expiresAt <= now.getTime();
}

async function deleteLeadershipTransferInvitation(
  transfer: PendingLeadershipTransfer | null | undefined
): Promise<void> {
  if (!transfer?.invitation_notification_id) {
    return;
  }
  await NotificationModel.deleteNotification(
    transfer.invitation_notification_id,
    transfer.nominee_user_id
  );
}

async function clearExpiredLeadershipTransfer(
  projectId: string,
  transfer: PendingLeadershipTransfer,
  now: Date = new Date()
): Promise<boolean> {
  if (!isLeadershipTransferExpired(transfer, now)) {
    return false;
  }

  const cleared = await ResearchModel.clearExpiredLeadershipTransfer(projectId, transfer.id, now);
  await deleteLeadershipTransferInvitation(cleared);
  return true;
}

async function notifyLeadershipTransferResolution({
  transfer,
  projectId,
  projectName,
  accepted,
  actorId,
}: {
  transfer: PendingLeadershipTransfer;
  projectId: string;
  projectName?: string | null;
  accepted: boolean;
  actorId: string;
}): Promise<void> {
  const recipients = [...new Set([
    transfer.initiated_by_user_id,
    transfer.outgoing_owner_user_id,
  ])].filter((userId) => userId && userId !== actorId);
  if (recipients.length === 0) {
    return;
  }

  const projectLabel = projectName ? `“${projectName}”` : '该课题';
  await NotificationModel.createNotificationForUsers(recipients, {
    type: 'leadership_transfer',
    title: accepted ? '组长转让已接受' : '组长转让已拒绝',
    content: accepted
      ? `${projectLabel}的组长权限已经完成转让。`
      : `${projectLabel}的组长转让邀请已被候选人拒绝。`,
    data: {
      project_id: projectId,
      transfer_id: transfer.id,
      nominee_user_id: transfer.nominee_user_id,
      accepted,
    },
    action_url: `/lab/projects/${projectId}#project-members`,
  });
}

function normalizeProjectTaskPayload(
  body: Record<string, unknown>,
  options: { partial?: boolean } = {}
): { data: CreateResearchProjectTaskInput & UpdateResearchProjectTaskInput; error?: string } {
  const partial = options.partial === true;
  const data: CreateResearchProjectTaskInput & UpdateResearchProjectTaskInput = {} as never;

  if (body.title !== undefined || !partial) {
    if (
      typeof body.title !== 'string'
      || !body.title.trim()
      || body.title.trim().length > MAX_PROJECT_TASK_TITLE_LENGTH
    ) {
      return { data, error: `任务标题为必填项，且不能超过 ${MAX_PROJECT_TASK_TITLE_LENGTH} 字` };
    }
    data.title = body.title.trim();
  }

  if (body.assignee_user_id !== undefined) {
    if (body.assignee_user_id === null) {
      data.assignee_user_id = null;
    } else if (typeof body.assignee_user_id === 'string' && body.assignee_user_id.trim()) {
      data.assignee_user_id = body.assignee_user_id.trim();
    } else {
      return { data, error: '任务负责人格式无效' };
    }
  }

  if (body.due_date !== undefined) {
    if (body.due_date === null) {
      data.due_date = null;
    } else if (typeof body.due_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.due_date.trim())) {
      data.due_date = body.due_date.trim();
    } else {
      return { data, error: '截止日期格式无效，应为 YYYY-MM-DD' };
    }
  }

  if (body.status !== undefined) {
    if (!partial) {
      return { data, error: '新任务默认从待办开始' };
    }
    if (typeof body.status !== 'string' || !PROJECT_TASK_STATUSES.includes(body.status as ResearchProjectTaskStatus)) {
      return { data, error: '任务状态无效' };
    }
    data.status = body.status as ResearchProjectTaskStatus;
  }

  return { data };
}

function normalizeProjectDiscussionManagedUrls(value: unknown): string[] | null {
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    return null;
  }

  const uniqueUrls = new Set<string>();

  for (const item of value) {
    if (typeof item !== 'string') {
      return null;
    }

    const trimmed = item.trim();
    if (!trimmed) {
      continue;
    }

    if (trimmed !== managedUploadUrlPrefix && !trimmed.startsWith(`${managedUploadUrlPrefix}/`)) {
      return null;
    }

    uniqueUrls.add(trimmed);
  }

  return [...uniqueUrls];
}

function parseResearchQuestions(value: unknown): string[] {
  return typeof value === 'string'
    ? value.split(/\r?\n/).map((question) => question.trim()).filter(Boolean)
    : [];
}

function preservesDiscussedQuestionPositions(
  previousValue: unknown,
  nextValue: unknown,
  discussedIndexes: number[]
): boolean {
  const previousQuestions = parseResearchQuestions(previousValue);
  const nextQuestions = parseResearchQuestions(nextValue);

  if (discussedIndexes.length === 0) {
    return true;
  }

  if (
    nextQuestions.length < previousQuestions.length
    || discussedIndexes.some((index) => index >= previousQuestions.length)
  ) {
    return false;
  }

  return previousQuestions.every((previousQuestion, index) => {
    const nextQuestion = nextQuestions[index];
    if (nextQuestion === previousQuestion) {
      return true;
    }

    const previousQuestionMoved = nextQuestions.some((
      question,
      nextIndex
    ) => nextIndex !== index && question === previousQuestion);
    const nextQuestionMoved = previousQuestions.some((
      question,
      previousIndex
    ) => previousIndex !== index && question === nextQuestion);

    return !previousQuestionMoved && !nextQuestionMoved;
  });
}

function normalizeManagedUploadUrl(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed !== managedUploadUrlPrefix && !trimmed.startsWith(`${managedUploadUrlPrefix}/`)) {
    return undefined;
  }

  return trimmed;
}

function normalizeOptionalString(
  value: unknown,
  maxLength: number
): { ok: true; value: string | null | undefined } | { ok: false } {
  if (value === undefined) {
    return { ok: true, value: undefined };
  }

  if (value === null) {
    return { ok: true, value: null };
  }

  if (typeof value !== 'string') {
    return { ok: false };
  }

  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    return { ok: false };
  }

  return { ok: true, value: trimmed || null };
}

function normalizeAttachmentSize(value: unknown): number | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return undefined;
  }

  return Math.floor(value);
}

function normalizeProjectEvidenceAttachments(
  value: unknown
): { attachments?: ProjectEvidenceAttachment[]; error?: string } {
  if (!Array.isArray(value)) {
    return { error: '附件列表格式无效' };
  }

  if (value.length > MAX_PROJECT_EVIDENCE_ATTACHMENTS) {
    return { error: `每条证据最多上传 ${MAX_PROJECT_EVIDENCE_ATTACHMENTS} 个附件` };
  }

  const attachments: ProjectEvidenceAttachment[] = [];
  const urls = new Set<string>();

  for (const item of value) {
    if (!item || typeof item !== 'object') {
      return { error: '附件信息格式无效' };
    }

    const input = item as Record<string, unknown>;
    const url = normalizeManagedUploadUrl(input.url);
    if (typeof url !== 'string' || url === managedUploadUrlPrefix) {
      return { error: '附件地址格式无效' };
    }
    if (urls.has(url)) {
      return { error: '附件地址不能重复' };
    }

    const originalName = normalizeOptionalString(input.original_name, 300);
    const mimeType = normalizeOptionalString(input.mime_type, 160);
    const category = normalizeOptionalString(input.category, 30);
    const size = input.size === undefined ? null : normalizeAttachmentSize(input.size);
    if (!originalName.ok) {
      return { error: '附件文件名过长' };
    }
    if (!mimeType.ok) {
      return { error: '附件类型过长' };
    }
    if (!category.ok || (
      category.value !== undefined
      && category.value !== null
      && !researchProjectEvidenceAttachmentCategorySet.has(category.value)
    )) {
      return { error: '附件类别无效' };
    }
    if (size === undefined) {
      return { error: '附件大小格式无效' };
    }

    urls.add(url);
    attachments.push({
      url,
      original_name: originalName.value ?? null,
      size: size ?? null,
      mime_type: mimeType.value ?? null,
      category: category.value ?? null,
    });
  }

  return { attachments };
}

function getEvidenceAttachmentUrls(evidence: any): string[] {
  const candidates: unknown[] = Array.isArray(evidence?.attachment_urls)
    ? evidence.attachment_urls
    : Array.isArray(evidence?.attachments)
      ? evidence.attachments.map((attachment: any) => attachment?.url)
      : [evidence?.attachment_url];

  return [...new Set(candidates
    .map((url: unknown) => (typeof url === 'string' ? url.trim() : ''))
    .filter((url): url is string => Boolean(url)))];
}

function normalizeProjectEvidenceOrderPayload(body: Record<string, unknown>): {
  expectedEvidenceIds?: string[];
  evidenceIds?: string[];
  error?: string;
} {
  const normalizeIds = (value: unknown): string[] | null => {
    if (!Array.isArray(value)) {
      return null;
    }

    const ids = value.map((id) => (typeof id === 'string' ? id.trim() : ''));
    if (ids.some((id) => !id) || new Set(ids).size !== ids.length) {
      return null;
    }
    return ids;
  };

  const expectedEvidenceIds = normalizeIds(body.expectedEvidenceIds);
  const evidenceIds = normalizeIds(body.evidenceIds);
  if (!expectedEvidenceIds || !evidenceIds) {
    return { error: '证据顺序列表格式无效或包含重复标识' };
  }

  const expectedSet = new Set(expectedEvidenceIds);
  if (
    expectedEvidenceIds.length !== evidenceIds.length
    || evidenceIds.some((id) => !expectedSet.has(id))
  ) {
    return { error: '调整前后的证据标识必须完全一致' };
  }

  return { expectedEvidenceIds, evidenceIds };
}

function normalizeProjectEvidencePayload(
  body: Record<string, unknown>,
  options: { partial?: boolean } = {}
): { data: Partial<ResearchProjectEvidenceInput>; error?: string } {
  const partial = options.partial === true;
  const data: Partial<ResearchProjectEvidenceInput> = {};

  if (body.title !== undefined || !partial) {
    if (typeof body.title !== 'string' || !body.title.trim() || body.title.trim().length > 120) {
      return { data, error: '证据标题为必填项，且不能超过 120 字' };
    }
    data.title = body.title.trim();
  }

  if (body.evidence_type !== undefined || !partial) {
    if (typeof body.evidence_type !== 'string' || !researchProjectEvidenceTypeSet.has(body.evidence_type)) {
      return { data, error: '证据类型无效' };
    }
    data.evidence_type = body.evidence_type as ResearchProjectEvidenceType;
  }

  const stringFields: Array<[keyof ResearchProjectEvidenceInput, number, string]> = [
    ['description', 4000, '过程说明不能超过 4000 字'],
    ['external_url', 1000, '外部链接格式无效或过长'],
    ['attachment_original_name', 300, '附件文件名过长'],
    ['attachment_mime_type', 160, '附件类型过长'],
    ['attachment_category', 30, '附件类别过长'],
    ['attachment_note', 1000, '附件说明不能超过 1000 字'],
  ];

  for (const [field, maxLength, error] of stringFields) {
    if (body[field] === undefined) {
      continue;
    }

    const normalized = normalizeOptionalString(body[field], maxLength);
    if (!normalized.ok) {
      return { data, error };
    }
    (data as Record<string, unknown>)[field] = normalized.value;
  }

  if (body.attachment_url !== undefined) {
    const attachmentUrl = normalizeManagedUploadUrl(body.attachment_url);
    if (attachmentUrl === undefined) {
      return { data, error: '附件地址格式无效' };
    }
    data.attachment_url = attachmentUrl;
  }

  if (body.attachment_size !== undefined) {
    const attachmentSize = normalizeAttachmentSize(body.attachment_size);
    if (attachmentSize === undefined) {
      return { data, error: '附件大小格式无效' };
    }
    data.attachment_size = attachmentSize;
  }

  if (body.attachments !== undefined) {
    const normalized = normalizeProjectEvidenceAttachments(body.attachments);
    if (normalized.error) {
      return { data, error: normalized.error };
    }
    data.attachments = normalized.attachments;
  } else if (body.attachment_url !== undefined) {
    data.attachments = data.attachment_url
      ? [{
          url: data.attachment_url,
          original_name: data.attachment_original_name ?? null,
          size: data.attachment_size ?? null,
          mime_type: data.attachment_mime_type ?? null,
          category: data.attachment_category ?? null,
        }]
      : [];
  }

  if (data.attachment_url === null) {
    data.attachment_original_name = null;
    data.attachment_size = null;
    data.attachment_mime_type = null;
    data.attachment_category = null;
  }

  return { data };
}

function normalizeResearchAgentLiveHistory(value: unknown): ResearchAgentChatMessage[] | null {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value) || value.length > MAX_RESEARCH_AGENT_HISTORY_MESSAGES) {
    return null;
  }

  const messages: ResearchAgentChatMessage[] = [];

  for (const item of value) {
    if (!item || typeof item !== 'object') {
      return null;
    }

    const { role, content: rawContent } = item as { role?: unknown; content?: unknown };
    const content = typeof rawContent === 'string' ? rawContent.trim() : '';

    if ((role !== 'user' && role !== 'assistant') || !content || content.length > MAX_RESEARCH_AGENT_CONTENT_LENGTH) {
      return null;
    }

    messages.push({ role, content });
  }

  return messages;
}

async function notifyProjectDiscussionCommentRecipients(
  projectId: string,
  senderId: string,
  commentId: string,
  parentCommentId: string | null,
  senderName: string,
  content: string
): Promise<void> {
  const recipients = (await ResearchModel.getActiveProjectMemberUserIds(projectId))
    .filter((userId) => userId !== senderId);

  await NotificationModel.createNotificationForUsers(recipients, {
    type: 'comment_reply',
    title: `${senderName} ${parentCommentId ? '回复了课题讨论' : '添加了课题讨论'}`,
    content: content || null,
    data: {
      project_id: projectId,
      comment_id: commentId,
      parent_comment_id: parentCommentId,
      sender_id: senderId,
    },
    action_url: `/lab/projects/${projectId}#discussion-comment-${commentId}`,
  });
}

async function notifyApplicationResult({
  applicationId,
  projectId,
  applicantId,
  status,
  projectName,
  reviewNotes,
}: {
  applicationId: string;
  projectId: string;
  applicantId: string;
  status: 'approved' | 'rejected';
  projectName?: string | null;
  reviewNotes?: unknown;
}): Promise<void> {
  const projectLabel = projectName ? `“${projectName}”` : '该课题';
  const resultText = status === 'approved' ? '已通过' : '未通过';
  const notes = typeof reviewNotes === 'string' ? reviewNotes.trim() : '';

  await NotificationModel.createNotification({
    user_id: applicantId,
    type: status === 'approved' ? 'application_approved' : 'application_rejected',
    title: `课题申请${resultText}`,
    content: `你加入${projectLabel}的申请${resultText}。${notes ? `\n审核备注：${notes}` : ''}`,
    data: {
      application_id: applicationId,
      project_id: projectId,
      status,
    },
    action_url: `/lab/projects/${projectId}`,
  });
}

/**
 * HTTP adapter over ProjectAccessService: resolves the access decision and
 * maps a denial onto the matching response. The policy itself lives in the
 * service; this only translates it into HTTP.
 */
async function ensureProjectAccess(
  res: Response,
  projectId: string,
  userId: string,
  userRole: 'user' | 'admin',
  level: ProjectAccessLevel,
  forbiddenMessage = '权限不足'
) {
  const access = await ProjectAccessService.getProjectAccess(projectId, userId, userRole);

  if (!access.project) {
    res.error('项目未找到', 'PROJECT_NOT_FOUND', 404);
    return null;
  }

  if (level === 'manage' && access.ownerStateValid === false) {
    res.error('课题当前组长数据异常', 'PROJECT_OWNER_STATE_INVALID', 409);
    return null;
  }

  if (!ProjectAccessService.hasPermission(access, level)) {
    res.error(forbiddenMessage, 'FORBIDDEN', 403);
    return null;
  }

  return access;
}

async function ensureProjectMemberCapacity(res: Response, projectId: string): Promise<boolean> {
  const capacity = await ResearchModel.getProjectMemberCapacity(projectId);

  if (capacity.isFull) {
    res.error('该课题组可参与讨论的成员名额已满', 'PROJECT_MEMBER_LIMIT_REACHED', 400);
    return false;
  }

  return true;
}

async function ensureCanvasAccess(
  res: Response,
  canvasId: string,
  userId: string,
  userRole: 'user' | 'admin',
  level: Exclude<ProjectAccessLevel, 'discussion'>,
  forbiddenMessage = '权限不足'
) {
  const canvas = await ResearchModel.getCanvasById(canvasId);
  if (!canvas) {
    res.error('画布未找到', 'CANVAS_NOT_FOUND', 404);
    return null;
  }

  const access = await ensureProjectAccess(res, canvas.project_id, userId, userRole, level, forbiddenMessage);
  if (!access) {
    return null;
  }

  return { canvas, access };
}

async function ensureNodeAccess(
  res: Response,
  nodeId: string,
  userId: string,
  userRole: 'user' | 'admin',
  level: Exclude<ProjectAccessLevel, 'discussion'>,
  forbiddenMessage = '权限不足'
) {
  const node = await ResearchModel.getNodeById(nodeId);
  if (!node) {
    res.error('节点未找到', 'NODE_NOT_FOUND', 404);
    return null;
  }

  const canvasAccess = await ensureCanvasAccess(res, node.canvas_id, userId, userRole, level, forbiddenMessage);
  if (!canvasAccess) {
    return null;
  }

  return { node, ...canvasAccess };
}

function formatContextField(label: string, value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? `${label}: ${trimmed}` : null;
}

function buildResearchAgentContext(
  project: any,
  members: any[],
  discussionDigest: Array<{
    username: string;
    content: string;
    image_count: number;
    video_count: number;
    created_at: Date | string;
  }>
): string {
  const projectLines = [
    formatContextField('Project title', project.name_zh),
    formatContextField('English title', project.name_en),
    formatContextField('Description', project.description_zh),
    formatContextField('Research questions', project.research_questions_zh),
    formatContextField('Hypotheses', project.research_hypotheses_zh),
    formatContextField('Basic plan', project.basic_plan_zh),
    formatContextField('Extended plan', project.extended_plan_zh),
    formatContextField('Challenge value', project.challenge_value_zh),
    formatContextField('Challenge objectives', project.challenge_objectives_zh),
    formatContextField('Beginner steps', project.challenge_beginner_steps_zh),
    formatContextField('Deliverables', project.challenge_min_deliverables_zh),
    formatContextField('Review criteria', project.challenge_review_criteria_zh),
    formatContextField('Timeline', project.challenge_timeline_zh),
    formatContextField('Difficulty', project.challenge_difficulty),
    formatContextField('Roles', project.challenge_roles_zh),
    formatContextField('Missing roles', project.challenge_missing_roles_zh),
    formatContextField('Progress', project.challenge_progress_zh),
    formatContextField('Status', project.status),
  ].filter((line): line is string => Boolean(line));

  const memberLines = members.map((member) => `- ${member.username || '成员'} (${member.role || 'member'})`);
  const digestLines = discussionDigest.map((item) => {
    const attachments = [
      item.image_count > 0 ? `${item.image_count} image(s)` : '',
      item.video_count > 0 ? `${item.video_count} video(s)` : '',
    ].filter(Boolean);
    const suffix = attachments.length > 0 ? ` [attachments: ${attachments.join(', ')}]` : '';
    const content = item.content || '[media-only discussion item]';
    return `- ${item.username}: ${content}${suffix}`;
  });

  return [
    'Project context for this request:',
    ...projectLines,
    '',
    'Members:',
    ...(memberLines.length > 0 ? memberLines : ['- No members listed']),
    '',
    'Recent discussion digest:',
    ...(digestLines.length > 0 ? digestLines : ['- No recent discussion']),
  ].join('\n');
}

async function ensureEdgeAccess(
  res: Response,
  edgeId: string,
  userId: string,
  userRole: 'user' | 'admin',
  level: Exclude<ProjectAccessLevel, 'discussion'>,
  forbiddenMessage = '权限不足'
) {
  const edge = await ResearchModel.getEdgeById(edgeId);
  if (!edge) {
    res.error('关系未找到', 'EDGE_NOT_FOUND', 404);
    return null;
  }

  const canvasAccess = await ensureCanvasAccess(res, edge.canvas_id, userId, userRole, level, forbiddenMessage);
  if (!canvasAccess) {
    return null;
  }

  return { edge, ...canvasAccess };
}

export class ResearchController {
  // ============================================================
  // Projects / 项目
  // ============================================================

  /**
   * Get user's projects
   * 获取用户的项目列表
   */
  static getUserProjects = asyncHandler(async (req: Request, res: Response) => {
    const projects = await ResearchModel.getUserProjects(req.user!.sub, req.user!.role);
    res.success(projects);
  });

  /**
   * Get project by ID
   * 获取项目详情
   */
  static getProject = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const access = await ensureProjectAccess(
      res,
      id,
      req.user!.sub,
      req.user!.role,
      'read',
      '你只能查看公开课题或已加入的课题'
    );
    if (!access) {
      return;
    }

    let pendingLeadershipTransfer = getPendingLeadershipTransfer(access.project);
    if (
      pendingLeadershipTransfer
      && await clearExpiredLeadershipTransfer(id, pendingLeadershipTransfer)
    ) {
      pendingLeadershipTransfer = null;
    }

    // Get members
    const [members, formerMembers, pendingApplication] = await Promise.all([
      ResearchModel.getProjectMembers(id),
      access.canManage ? ResearchModel.getFormerProjectMembers(id) : Promise.resolve(undefined),
      ProfileModel.getPendingApplication(id, req.user!.sub),
    ]);
    const isActiveNominee = Boolean(
      pendingLeadershipTransfer
      && access.membership
      && req.user!.sub === pendingLeadershipTransfer.nominee_user_id
    );
    const canViewLeadershipTransfer = Boolean(
      pendingLeadershipTransfer
      && (
        req.user!.role === 'admin'
        || req.user!.sub === access.ownerUserId
        || isActiveNominee
      )
    );
    const leadershipTransferView = canViewLeadershipTransfer && pendingLeadershipTransfer
      ? {
          ...(await ResearchModel.getLeadershipTransferIdentityView(pendingLeadershipTransfer)),
          can_accept: isActiveNominee,
          can_decline: isActiveNominee,
          can_cancel: req.user!.role === 'admin' || req.user!.sub === access.ownerUserId,
          can_replace: req.user!.role === 'admin' || req.user!.sub === access.ownerUserId,
        }
      : null;
    const {
      pending_leadership_transfer: _storedLeadershipTransfer,
      ...projectResponse
    } = access.project;

    res.success({
      ...projectResponse,
      owner_user_id: access.ownerUserId,
      members,
      has_pending_application: Boolean(pendingApplication),
      ...(formerMembers ? { former_members: formerMembers } : {}),
      ...(leadershipTransferView
        ? { pending_leadership_transfer: leadershipTransferView }
        : {}),
    });
  });

  /**
   * Create project
   * 创建项目
   */
  static createProject = asyncHandler(async (req: Request, res: Response) => {
    const {
      name_zh,
      name_en,
      description_zh,
      description_en,
      research_questions_zh,
      research_hypotheses_zh,
      basic_plan_zh,
      extended_plan_zh,
      challenge_value_zh,
      challenge_objectives_zh,
      challenge_beginner_steps_zh,
      challenge_min_deliverables_zh,
      challenge_review_criteria_zh,
      challenge_timeline_zh,
      challenge_difficulty,
      challenge_roles_zh,
      challenge_missing_roles_zh,
      challenge_progress_zh,
      is_public,
    } = req.body;
    const visibility = is_public === true ? 'public' : 'private';

    const projectId = await ResearchModel.createProject(
      {
        name_zh,
        name_en,
        description_zh,
        description_en,
        research_questions_zh,
        research_hypotheses_zh,
        basic_plan_zh,
        extended_plan_zh,
        challenge_value_zh,
        challenge_objectives_zh,
        challenge_beginner_steps_zh,
        challenge_min_deliverables_zh,
        challenge_review_criteria_zh,
        challenge_timeline_zh,
        challenge_difficulty,
        challenge_roles_zh,
        challenge_missing_roles_zh,
        challenge_progress_zh,
        is_public,
      },
      req.user!.sub
    );
    await ProjectAccessService.initializeProjectSettings(projectId, { visibility });

    const project = await ResearchModel.getProjectById(projectId);
    logger.info(`Project created by user ${req.user!.username}: ${projectId}`);
    res.success(project, '项目创建成功', 201);
  });

  /**
   * Update project
   * 更新项目
   */
  static updateProject = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const access = await ensureProjectAccess(res, id, req.user!.sub, req.user!.role, 'manage', '只有组长可以更新课题');
    if (!access) {
      return;
    }
    const previousThumbnail = access.project.thumbnail;
    const currentStatus = access.project.status as ProjectStatus;
    const nextStatus = req.body.status;
    const statusChanged = nextStatus !== undefined && nextStatus !== currentStatus;
    const isAdmin = req.user!.role === 'admin';
    const settings = await ProfileModel.getOrCreateProjectSettings(id);
    const requestedVisibility = req.body.is_public === undefined
      ? settings.visibility
      : req.body.is_public === true ? 'public' : 'private';

    if (req.body.research_questions_zh !== undefined) {
      const discussedQuestionIndexes = await ResearchModel.getDiscussedProjectQuestionIndexes(id);
      if (!preservesDiscussedQuestionPositions(
        access.project.research_questions_zh,
        req.body.research_questions_zh,
        discussedQuestionIndexes
      )) {
        return res.error(
          '已有讨论的问题不能删除、前插或重排；可原位修改文字或在末尾追加问题',
          'RESEARCH_QUESTION_POSITIONS_LOCKED',
          400
        );
      }
    }

    if (nextStatus !== undefined) {
      if (isProjectStatusRollback(currentStatus, nextStatus) && !isAdmin) {
        return res.error('只有管理员可以回退课题进度', 'PROJECT_STATUS_ROLLBACK_FORBIDDEN', 403);
      }

      const transition = validateProjectStatusTransition(currentStatus, nextStatus, isAdmin);
      if (!transition.valid) {
        return res.error('课题状态向前每次只能推进一步', 'INVALID_PROJECT_STATUS_TRANSITION', 400);
      }

      // 待评审 → 已展示 is gated on the peer-review quorum; admins bypass.
      if (!isAdmin && currentStatus === 'review_pending' && nextStatus === 'showcased') {
        const cycle = await ResearchModel.ensureCurrentProjectCycle(id);
        const reviewCount = await ResearchModel.countProjectReviews(id, cycle.id);
        if (reviewCount < PROJECT_REVIEW_QUORUM) {
          return res.error(
            `需要至少收到 ${PROJECT_REVIEW_QUORUM} 份同伴评审后才能进入展示（当前已收到 ${reviewCount} 份）`,
            'PROJECT_REVIEW_QUORUM_NOT_MET',
            400
          );
        }
      }
    }

    const { is_public: _ignoredLegacyVisibility, ...projectUpdate } = req.body;
    const hasProjectUpdate = Object.keys(projectUpdate).length > 0;
    const updated = hasProjectUpdate
      ? await ResearchModel.updateProject(
        id,
        projectUpdate,
        nextStatus === undefined ? undefined : currentStatus
      )
      : 'updated';

    if (updated === 'conflict') {
      return res.error('课题状态已被其他操作更新，请刷新后重试', 'PROJECT_STATUS_CONFLICT', 409);
    }

    if (updated === 'not_found') {
      return res.error('项目未找到', 'PROJECT_NOT_FOUND', 404);
    }

    if (req.body.is_public !== undefined) {
      await ProjectAccessService.setProjectVisibility(id, requestedVisibility);
    }

    if (statusChanged) {
      await ResearchModel.logActivity(
        id,
        req.user!.sub,
        'project_status_changed',
        'project',
        id,
        { from_status: currentStatus, to_status: nextStatus }
      );
      const recipients = (await ResearchModel.getActiveProjectMemberUserIds(id))
        .filter((userId) => userId !== req.user!.sub);
      await NotificationModel.createNotificationForUsers(recipients, {
        type: 'system',
        title: `课题“${access.project.name_zh || access.project.name_en || id}”阶段已更新`,
        content: `${PROJECT_STATUS_LABELS[currentStatus]} → ${PROJECT_STATUS_LABELS[nextStatus as ProjectStatus]}`,
        data: {
          project_id: id,
          from_status: currentStatus,
          to_status: nextStatus,
          actor_id: req.user!.sub,
        },
        action_url: `/lab/projects/${id}`,
      });
    }

    const project = await ResearchModel.getProjectById(id);
    if (req.body.thumbnail !== undefined && previousThumbnail && previousThumbnail !== req.body.thumbnail) {
      await ManagedUploadCleanupService.cleanupUrls([previousThumbnail], {
        reason: `research.project.cover-change:${id}`,
      });
    }
    logger.info(`Project updated by user ${req.user!.username}: ${id}`);
    const {
      pending_leadership_transfer: _pendingLeadershipTransfer,
      ...projectResponse
    } = project ?? {};
    res.success(projectResponse, '项目更新成功');
  });

  /**
   * Nominate or replace a pending project leader
   * 提名或替换待确认的新组长
   */
  static nominateProjectLeader = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const targetUserId = typeof req.body?.targetUserId === 'string'
      ? req.body.targetUserId.trim()
      : '';
    if (!targetUserId) {
      return res.error('请选择要提名的课题成员', 'INVALID_TRANSFER_TARGET', 400);
    }

    const access = await ensureProjectAccess(
      res,
      id,
      req.user!.sub,
      req.user!.role,
      'manage',
      '只有当前组长或管理员可以转让组长权限'
    );
    if (!access) {
      return;
    }
    if (!access.ownerStateValid || !access.ownerUserId) {
      return res.error('课题当前组长数据异常，无法发起转让', 'PROJECT_OWNER_STATE_INVALID', 409);
    }

    const members = await ResearchModel.getProjectMembers(id);
    const currentOwner = members.find((member: any) => member.user_id === access.ownerUserId);
    const targetMember = members.find((member: any) => member.user_id === targetUserId);
    if (!currentOwner || currentOwner.active === false) {
      return res.error('课题当前组长数据异常，无法发起转让', 'PROJECT_OWNER_STATE_INVALID', 409);
    }
    if (!targetMember || targetMember.active === false || targetUserId === access.ownerUserId) {
      return res.error('只能向其他有效课题成员转让组长权限', 'INVALID_TRANSFER_TARGET', 400);
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + LEADERSHIP_TRANSFER_TTL_MS);
    const transferId = generateId();
    const projectName = access.project.name_zh || access.project.name_en || id;
    const invitationNotificationId = await NotificationModel.createNotification({
      user_id: targetUserId,
      type: 'leadership_transfer',
      title: `课题“${projectName}”邀请你担任组长`,
      content: '请在七天内接受或拒绝。接受后，原组长仍保留为普通成员。',
      data: {
        project_id: id,
        transfer_id: transferId,
        outgoing_owner_user_id: access.ownerUserId,
        notification_kind: 'invitation',
      },
      action_url: `/lab/projects/${id}#project-members`,
      expires_at: expiresAt,
    });
    const transfer: PendingLeadershipTransfer = {
      id: transferId,
      outgoing_owner_user_id: access.ownerUserId,
      nominee_user_id: targetUserId,
      initiated_by_user_id: req.user!.sub,
      invitation_notification_id: invitationNotificationId,
      created_at: now,
      expires_at: expiresAt,
    };
    const previousTransfer = await ResearchModel.replacePendingLeadershipTransfer(
      id,
      access.ownerUserId,
      transfer
    );
    if (previousTransfer === false) {
      await deleteLeadershipTransferInvitation(transfer);
      return res.error('课题组长或转让状态已发生变化，请刷新后重试', 'LEADERSHIP_TRANSFER_STALE', 409);
    }
    await deleteLeadershipTransferInvitation(previousTransfer);

    if (req.user!.role === 'admin' && req.user!.sub !== access.ownerUserId) {
      await NotificationModel.createNotification({
        user_id: access.ownerUserId,
        type: 'leadership_transfer',
        title: `管理员已为课题“${projectName}”发起组长转让`,
        content: `已邀请 ${targetMember.nickname || targetMember.username || '该成员'} 接任组长。`,
        data: {
          project_id: id,
          transfer_id: transferId,
          nominee_user_id: targetUserId,
          notification_kind: 'admin_nomination',
        },
        action_url: `/lab/projects/${id}#project-members`,
        expires_at: expiresAt,
      });
    }

    const transferView = await ResearchModel.getLeadershipTransferIdentityView(transfer);
    logger.info(`Project leadership transfer nominated in ${id} by ${req.user!.username}: ${targetUserId}`);
    res.success({
      ...transferView,
      can_accept: req.user!.sub === targetUserId,
      can_decline: req.user!.sub === targetUserId,
      can_cancel: true,
      can_replace: true,
    }, '组长转让邀请已发送');
  });

  /** Cancel a pending project leadership transfer. */
  static cancelProjectLeadershipTransfer = asyncHandler(async (req: Request, res: Response) => {
    const { id, transferId } = req.params;
    const access = await ensureProjectAccess(
      res,
      id,
      req.user!.sub,
      req.user!.role,
      'manage',
      '只有当前组长或管理员可以取消组长转让'
    );
    if (!access) {
      return;
    }
    if (!access.ownerStateValid || !access.ownerUserId) {
      return res.error('课题当前组长数据异常', 'PROJECT_OWNER_STATE_INVALID', 409);
    }

    const pending = getPendingLeadershipTransfer(access.project);
    if (!pending || pending.id !== transferId) {
      return res.error('该组长转让邀请已失效或已被替换', 'LEADERSHIP_TRANSFER_STALE', 409);
    }
    const now = new Date();
    if (await clearExpiredLeadershipTransfer(id, pending, now)) {
      return res.error('该组长转让邀请已过期', 'LEADERSHIP_TRANSFER_EXPIRED', 410);
    }

    const cleared = await ResearchModel.clearPendingLeadershipTransfer(
      id,
      transferId,
      access.ownerUserId,
      undefined,
      now
    );
    if (!cleared) {
      return res.error('该组长转让邀请已失效或已被替换', 'LEADERSHIP_TRANSFER_STALE', 409);
    }
    await deleteLeadershipTransferInvitation(cleared);
    logger.info(`Project leadership transfer cancelled in ${id} by ${req.user!.username}`);
    res.success(null, '组长转让已取消');
  });

  /** Accept a project leadership transfer as the nominated member. */
  static acceptProjectLeadershipTransfer = asyncHandler(async (req: Request, res: Response) => {
    const { id, transferId } = req.params;
    const access = await ensureProjectAccess(
      res,
      id,
      req.user!.sub,
      req.user!.role,
      'read',
      '你只能处理自己所在课题的组长转让邀请'
    );
    if (!access) {
      return;
    }
    if (!access.ownerStateValid || !access.ownerUserId) {
      return res.error('课题当前组长数据异常', 'PROJECT_OWNER_STATE_INVALID', 409);
    }

    const pending = getPendingLeadershipTransfer(access.project);
    if (!pending || pending.id !== transferId) {
      return res.error('该组长转让邀请已失效或已被替换', 'LEADERSHIP_TRANSFER_STALE', 409);
    }
    if (pending.nominee_user_id !== req.user!.sub || !access.membership) {
      return res.error('只有被提名的有效成员可以接受邀请', 'FORBIDDEN', 403);
    }
    const now = new Date();
    if (await clearExpiredLeadershipTransfer(id, pending, now)) {
      return res.error('该组长转让邀请已过期', 'LEADERSHIP_TRANSFER_EXPIRED', 410);
    }

    const accepted = await ResearchModel.acceptLeadershipTransfer(
      id,
      transferId,
      access.ownerUserId,
      req.user!.sub,
      now
    );
    if (!accepted) {
      const latestProject = await ResearchModel.getProjectById(id);
      const latestPending = getPendingLeadershipTransfer(latestProject);
      if (
        latestPending?.id === transferId
        && await clearExpiredLeadershipTransfer(id, latestPending)
      ) {
        return res.error('该组长转让邀请已过期', 'LEADERSHIP_TRANSFER_EXPIRED', 410);
      }
      return res.error('该组长转让邀请已失效或已被处理', 'LEADERSHIP_TRANSFER_STALE', 409);
    }

    await deleteLeadershipTransferInvitation(accepted);
    await ResearchModel.logActivity(
      id,
      req.user!.sub,
      'project_leadership_transferred',
      'project',
      id,
      {
        outgoing_owner_user_id: accepted.outgoing_owner_user_id,
        incoming_owner_user_id: accepted.nominee_user_id,
      }
    );
    await notifyLeadershipTransferResolution({
      transfer: accepted,
      projectId: id,
      projectName: access.project.name_zh || access.project.name_en,
      accepted: true,
      actorId: req.user!.sub,
    });
    logger.info(`Project leadership transferred in ${id}: ${accepted.nominee_user_id}`);
    res.success({ owner_user_id: accepted.nominee_user_id }, '你已成为课题组长');
  });

  /** Decline a project leadership transfer as the nominated member. */
  static declineProjectLeadershipTransfer = asyncHandler(async (req: Request, res: Response) => {
    const { id, transferId } = req.params;
    const access = await ensureProjectAccess(
      res,
      id,
      req.user!.sub,
      req.user!.role,
      'read',
      '你只能处理自己所在课题的组长转让邀请'
    );
    if (!access) {
      return;
    }
    if (!access.ownerStateValid || !access.ownerUserId) {
      return res.error('课题当前组长数据异常', 'PROJECT_OWNER_STATE_INVALID', 409);
    }

    const pending = getPendingLeadershipTransfer(access.project);
    if (!pending || pending.id !== transferId) {
      return res.error('该组长转让邀请已失效或已被替换', 'LEADERSHIP_TRANSFER_STALE', 409);
    }
    if (pending.nominee_user_id !== req.user!.sub || !access.membership) {
      return res.error('只有被提名的有效成员可以拒绝邀请', 'FORBIDDEN', 403);
    }
    const now = new Date();
    if (await clearExpiredLeadershipTransfer(id, pending, now)) {
      return res.error('该组长转让邀请已过期', 'LEADERSHIP_TRANSFER_EXPIRED', 410);
    }

    const declined = await ResearchModel.clearPendingLeadershipTransfer(
      id,
      transferId,
      access.ownerUserId,
      req.user!.sub,
      now
    );
    if (!declined) {
      return res.error('该组长转让邀请已失效或已被处理', 'LEADERSHIP_TRANSFER_STALE', 409);
    }

    await deleteLeadershipTransferInvitation(declined);
    await notifyLeadershipTransferResolution({
      transfer: declined,
      projectId: id,
      projectName: access.project.name_zh || access.project.name_en,
      accepted: false,
      actorId: req.user!.sub,
    });
    logger.info(`Project leadership transfer declined in ${id}: ${req.user!.sub}`);
    res.success(null, '已拒绝组长转让邀请');
  });

  /**
   * Delete project
   * 删除项目
   */
  static deleteProject = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const confirmationText =
      typeof req.body?.confirmationText === 'string' ? req.body.confirmationText.trim() : '';
    const access = await ensureProjectAccess(
      res,
      id,
      req.user!.sub,
      req.user!.role,
      'read',
      '你只能查看公开课题或已加入的课题'
    );
    if (!access) {
      return;
    }

    if (req.user!.role !== 'admin' && !access.canManage) {
      return res.error('只有管理员或组长可以删除课题', 'FORBIDDEN', 403);
    }

    if (confirmationText !== DELETE_PROJECT_CONFIRMATION_KEYWORD) {
      return res.error('请输入大写 DELETE 以确认删除课题', 'DELETE_CONFIRMATION_REQUIRED', 400);
    }

    const coverUrl = access.project.thumbnail;
    const evidenceAttachmentUrls = await ResearchModel.getProjectEvidenceAttachmentUrls(id);
    await ResearchModel.deleteProject(id);
    await deleteLeadershipTransferInvitation(getPendingLeadershipTransfer(access.project));
    await ManagedUploadCleanupService.cleanupUrls([coverUrl, ...evidenceAttachmentUrls], {
      reason: `research.project.delete:${id}`,
    });
    logger.info(`Project deleted by user ${req.user!.username}: ${id}`);
    res.success(null, '项目删除成功');
  });

  /**
   * Get project evidence
   * 获取课题证据库
   */
  static getProjectEvidence = asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const access = await ensureProjectAccess(
      res,
      projectId,
      req.user!.sub,
      req.user!.role,
      'read',
      '你只能查看公开课题或已加入的课题证据'
    );
    if (!access) {
      return;
    }

    const evidenceItems = await ResearchModel.getProjectEvidence(projectId);
    res.success(evidenceItems);
  });

  /**
   * Reorder project evidence
   * 调整课题证据顺序
   */
  static reorderProjectEvidence = asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const access = await ensureProjectAccess(
      res,
      projectId,
      req.user!.sub,
      req.user!.role,
      'write',
      '只有课题成员可以调整证据顺序'
    );
    if (!access) {
      return;
    }

    const { expectedEvidenceIds, evidenceIds, error } = normalizeProjectEvidenceOrderPayload(req.body ?? {});
    if (error || !expectedEvidenceIds || !evidenceIds) {
      return res.error(error || '证据顺序列表格式无效', 'INVALID_EVIDENCE_ORDER', 400);
    }

    const reordered = await ResearchModel.reorderProjectEvidence(
      projectId,
      expectedEvidenceIds,
      evidenceIds
    );
    if (!reordered) {
      return res.error('证据列表已发生变化，请刷新后重试', 'EVIDENCE_ORDER_STALE', 409);
    }

    const evidenceItems = await ResearchModel.getProjectEvidence(projectId);
    logger.info(`Project evidence reordered by user ${req.user!.username}: ${projectId}`);
    res.success(evidenceItems, '证据顺序已更新');
  });

  /**
   * Create project evidence
   * 创建课题证据
   */
  static createProjectEvidence = asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const access = await ensureProjectAccess(
      res,
      projectId,
      req.user!.sub,
      req.user!.role,
      'write',
      '只有课题成员可以新增证据'
    );
    if (!access) {
      return;
    }

    const { data, error } = normalizeProjectEvidencePayload(req.body ?? {});
    if (error) {
      return res.error(error, 'INVALID_PROJECT_EVIDENCE', 400);
    }

    const evidenceId = await ResearchModel.createProjectEvidence(
      projectId,
      req.user!.sub,
      data as ResearchProjectEvidenceInput
    );
    const evidence = await ResearchModel.getProjectEvidenceById(evidenceId);
    logger.info(`Project evidence created by user ${req.user!.username}: ${evidenceId}`);
    res.success(evidence, '证据已新增', 201);
  });

  /**
   * Update project evidence
   * 更新课题证据
   */
  static updateProjectEvidence = asyncHandler(async (req: Request, res: Response) => {
    const { projectId, evidenceId } = req.params;
    const access = await ensureProjectAccess(
      res,
      projectId,
      req.user!.sub,
      req.user!.role,
      'write',
      '只有课题成员可以编辑证据'
    );
    if (!access) {
      return;
    }

    const existing = await ResearchModel.getProjectEvidenceById(evidenceId);
    if (!existing || existing.project_id !== projectId) {
      return res.error('证据未找到', 'EVIDENCE_NOT_FOUND', 404);
    }

    const { data, error } = normalizeProjectEvidencePayload(req.body ?? {}, { partial: true });
    if (error) {
      return res.error(error, 'INVALID_PROJECT_EVIDENCE', 400);
    }

    if (Object.keys(data).length === 0) {
      return res.error('没有可更新的证据字段', 'INVALID_PROJECT_EVIDENCE', 400);
    }

    const updated = await ResearchModel.updateProjectEvidence(evidenceId, data);
    if (!updated) {
      return res.error('证据未找到', 'EVIDENCE_NOT_FOUND', 404);
    }

    const evidence = await ResearchModel.getProjectEvidenceById(evidenceId);
    if (data.attachments !== undefined || data.attachment_url !== undefined) {
      const nextUrls = new Set(getEvidenceAttachmentUrls(evidence));
      const removedUrls = getEvidenceAttachmentUrls(existing).filter((url) => !nextUrls.has(url));
      await ManagedUploadCleanupService.cleanupUrls(removedUrls, {
        reason: `research.project-evidence.attachment-change:${evidenceId}`,
      });
    }

    logger.info(`Project evidence updated by user ${req.user!.username}: ${evidenceId}`);
    res.success(evidence, '证据已更新');
  });

  /**
   * Delete project evidence
   * 删除课题证据
   */
  static deleteProjectEvidence = asyncHandler(async (req: Request, res: Response) => {
    const { projectId, evidenceId } = req.params;
    const access = await ensureProjectAccess(
      res,
      projectId,
      req.user!.sub,
      req.user!.role,
      'write',
      '只有课题成员可以删除证据'
    );
    if (!access) {
      return;
    }

    const existing = await ResearchModel.getProjectEvidenceById(evidenceId);
    if (!existing || existing.project_id !== projectId) {
      return res.error('证据未找到', 'EVIDENCE_NOT_FOUND', 404);
    }

    await ResearchModel.deleteProjectEvidence(evidenceId);
    await ManagedUploadCleanupService.cleanupUrls(getEvidenceAttachmentUrls(existing), {
      reason: `research.project-evidence.delete:${evidenceId}`,
    });
    logger.info(`Project evidence deleted by user ${req.user!.username}: ${evidenceId}`);
    res.success(null, '证据已删除');
  });

  // ============================================================
  // Peer Reviews / 同伴评审
  // ============================================================

  /**
   * Get project peer reviews (current cycle)
   * 获取课题同伴评审（当前周期）
   */
  static getProjectReviews = asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const access = await ensureProjectAccess(
      res,
      projectId,
      req.user!.sub,
      req.user!.role,
      'read',
      '你只能查看公开课题或已加入的课题评审'
    );
    if (!access) {
      return;
    }

    const reviews = await ResearchModel.getProjectReviews(projectId);
    res.success(reviews);
  });

  /**
   * Create or update the current user's peer review
   * 提交或更新当前用户的同伴评审
   */
  static upsertMyProjectReview = asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const reviewerId = req.user!.sub;
    const verdict = req.body?.verdict;
    const rawContent = typeof req.body?.content === 'string' ? req.body.content : '';
    const content = rawContent.trim();

    if (!PROJECT_REVIEW_VERDICTS.includes(verdict)) {
      return res.error('评审结论无效', 'INVALID_REVIEW_VERDICT', 400);
    }

    if (!content) {
      return res.error('请填写评审意见', 'INVALID_REVIEW_CONTENT', 400);
    }

    if (content.length > MAX_PROJECT_REVIEW_CONTENT_LENGTH) {
      return res.error(
        `评审意见不能超过 ${MAX_PROJECT_REVIEW_CONTENT_LENGTH} 字`,
        'REVIEW_CONTENT_TOO_LONG',
        400
      );
    }

    const access = await ProjectAccessService.getProjectAccess(projectId, reviewerId, req.user!.role);
    if (!access.project) {
      return res.error('课题未找到', 'PROJECT_NOT_FOUND', 404);
    }

    if (!access.canRead) {
      return res.error('你只能评审公开课题', 'FORBIDDEN', 403);
    }

    // Peer review comes from outside the group: active members are excluded.
    if (access.isMember) {
      return res.error('课题成员不能评审自己的课题', 'REVIEWER_IS_MEMBER', 403);
    }

    if (access.project.status !== 'review_pending') {
      return res.error('该课题当前不在待评审阶段', 'PROJECT_NOT_REVIEW_PENDING', 400);
    }

    const cycle = await ResearchModel.ensureCurrentProjectCycle(projectId);
    const { id: reviewId, created } = await ResearchModel.upsertProjectReview(
      projectId,
      cycle.id,
      reviewerId,
      { verdict, content }
    );

    // Only first-time submissions log activity and notify, so edits stay quiet.
    if (created) {
      await ResearchModel.logActivity(
        projectId,
        reviewerId,
        'review_submitted',
        'project_review',
        reviewId,
        { verdict }
      );
      const recipients = await ResearchModel.getActiveProjectMemberUserIds(projectId);
      await NotificationModel.createNotificationForUsers(recipients, {
        type: 'system',
        title: `课题“${access.project.name_zh || access.project.name_en || projectId}”收到新的同伴评审`,
        content: verdict === 'approve' ? '评审结论：建议通过' : '评审结论：建议修改',
        data: {
          project_id: projectId,
          review_id: reviewId,
          reviewer_id: reviewerId,
          verdict,
        },
        action_url: `/lab/projects/${projectId}#project-peer-review`,
      });
    }

    const reviews = await ResearchModel.getProjectReviews(projectId);
    const review = reviews.find((item) => item.id === reviewId) ?? null;
    logger.info(`Project review ${created ? 'submitted' : 'updated'} by user ${req.user!.username}: ${reviewId}`);
    res.success(review, created ? '评审已提交' : '评审已更新', created ? 201 : 200);
  });

  /**
   * Delete a peer review (author or admin)
   * 删除同伴评审（作者本人或管理员）
   */
  static deleteProjectReview = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const review = await ResearchModel.getProjectReviewById(id);
    if (!review) {
      return res.error('评审未找到', 'REVIEW_NOT_FOUND', 404);
    }

    if (review.reviewer_id !== req.user!.sub && req.user!.role !== 'admin') {
      return res.error('只能删除自己的评审', 'FORBIDDEN', 403);
    }

    await ResearchModel.deleteProjectReview(id);
    logger.info(`Project review deleted by user ${req.user!.username}: ${id}`);
    res.success(null, '评审已删除');
  });

  // ============================================================
  // Project Tasks / 任务分工
  // ============================================================

  /**
   * Get project tasks (current cycle)
   * 获取课题任务（当前周期）
   */
  static getProjectTasks = asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const access = await ensureProjectAccess(
      res,
      projectId,
      req.user!.sub,
      req.user!.role,
      'discussion',
      '只有课题成员可以查看任务分工'
    );
    if (!access) {
      return;
    }

    const tasks = await ResearchModel.getProjectTasks(projectId);
    res.success(tasks);
  });

  /**
   * Create project task
   * 创建课题任务
   */
  static createProjectTask = asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const access = await ensureProjectAccess(
      res,
      projectId,
      req.user!.sub,
      req.user!.role,
      'write',
      '只有课题成员可以创建任务'
    );
    if (!access) {
      return;
    }

    const { data, error } = normalizeProjectTaskPayload(req.body ?? {});
    if (error) {
      return res.error(error, 'INVALID_PROJECT_TASK', 400);
    }

    if (data.assignee_user_id) {
      const memberIds = await ResearchModel.getActiveProjectMemberUserIds(projectId);
      if (!memberIds.includes(data.assignee_user_id)) {
        return res.error('任务负责人必须是当前课题成员', 'INVALID_TASK_ASSIGNEE', 400);
      }
    }

    const cycle = await ResearchModel.ensureCurrentProjectCycle(projectId);
    const taskId = await ResearchModel.createProjectTask(projectId, cycle.id, req.user!.sub, data);
    await ResearchModel.logActivity(
      projectId,
      req.user!.sub,
      'task_created',
      'project_task',
      taskId,
      { title: data.title }
    );

    const tasks = await ResearchModel.getProjectTasks(projectId);
    const task = tasks.find((item) => item.id === taskId) ?? null;
    logger.info(`Project task created by user ${req.user!.username}: ${taskId}`);
    res.success(task, '任务已创建', 201);
  });

  /**
   * Update project task
   * 更新课题任务
   */
  static updateProjectTask = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const existing = await ResearchModel.getProjectTaskById(id);
    if (!existing) {
      return res.error('任务未找到', 'TASK_NOT_FOUND', 404);
    }

    const access = await ensureProjectAccess(
      res,
      existing.project_id,
      req.user!.sub,
      req.user!.role,
      'write',
      '只有课题成员可以更新任务'
    );
    if (!access) {
      return;
    }

    const { data, error } = normalizeProjectTaskPayload(req.body ?? {}, { partial: true });
    if (error) {
      return res.error(error, 'INVALID_PROJECT_TASK', 400);
    }

    if (Object.keys(data).length === 0) {
      return res.error('没有可更新的任务字段', 'INVALID_PROJECT_TASK', 400);
    }

    if (data.assignee_user_id) {
      const memberIds = await ResearchModel.getActiveProjectMemberUserIds(existing.project_id);
      if (!memberIds.includes(data.assignee_user_id)) {
        return res.error('任务负责人必须是当前课题成员', 'INVALID_TASK_ASSIGNEE', 400);
      }
    }

    const completedNow = data.status === 'done' && existing.status !== 'done';
    await ResearchModel.updateProjectTask(id, data);

    if (completedNow) {
      await ResearchModel.logActivity(
        existing.project_id,
        req.user!.sub,
        'task_completed',
        'project_task',
        id,
        { title: data.title ?? existing.title }
      );
    }

    const tasks = await ResearchModel.getProjectTasks(existing.project_id);
    const task = tasks.find((item) => item.id === id) ?? null;
    logger.info(`Project task updated by user ${req.user!.username}: ${id}`);
    res.success(task, '任务已更新');
  });

  /**
   * Delete project task (creator, owner, or admin)
   * 删除课题任务（创建者、组长或管理员）
   */
  static deleteProjectTask = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const existing = await ResearchModel.getProjectTaskById(id);
    if (!existing) {
      return res.error('任务未找到', 'TASK_NOT_FOUND', 404);
    }

    const access = await ensureProjectAccess(
      res,
      existing.project_id,
      req.user!.sub,
      req.user!.role,
      'write',
      '只有课题成员可以删除任务'
    );
    if (!access) {
      return;
    }

    if (existing.created_by !== req.user!.sub && !access.canManage) {
      return res.error('只有任务创建者、组长或管理员可以删除任务', 'FORBIDDEN', 403);
    }

    await ResearchModel.deleteProjectTask(id);
    logger.info(`Project task deleted by user ${req.user!.username}: ${id}`);
    res.success(null, '任务已删除');
  });

  /**
   * Add project member
   * 添加项目成员
   */
  static addProjectMember = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { userId, memberRoleLabel } = req.body;
    const currentUserId = req.user!.sub;

    const access = await ensureProjectAccess(
      res,
      id,
      currentUserId,
      req.user!.role,
      'manage',
      '只有组长可以拉回成员'
    );
    if (!access) {
      return;
    }

    const targetMembership = await ResearchModel.getProjectMembership(id, userId);
    const formerMembers = targetMembership ? [] : await ResearchModel.getFormerProjectMembers(id);
    const isLegacyFormerMember = formerMembers.some((member: any) => member.user_id === userId);

    if (!targetMembership && !isLegacyFormerMember) {
      return res.error('只能拉回曾加入过该课题的成员', 'FORMER_MEMBER_REQUIRED', 400);
    }

    if (targetMembership && targetMembership.active !== false) {
      return res.error('该用户已经是当前成员', 'ALREADY_MEMBER', 400);
    }

    const hasCapacity = await ensureProjectMemberCapacity(res, id);
    if (!hasCapacity) {
      return;
    }

    const pendingApplication = await ProfileModel.getPendingApplication(id, userId);
    const resolvedMemberRoleLabel = pendingApplication?.desired_role ?? memberRoleLabel;
    await ResearchModel.addProjectMember(id, userId, 'member', resolvedMemberRoleLabel);
    if (pendingApplication) {
      const applicationUpdated = await ProfileModel.updateApplicationStatus(
        pendingApplication.id,
        'approved',
        currentUserId,
        '组长直接拉回成员'
      );
      if (applicationUpdated) {
        await notifyApplicationResult({
          applicationId: pendingApplication.id,
          projectId: id,
          applicantId: userId,
          status: 'approved',
          projectName: access.project.name_zh || access.project.name_en,
          reviewNotes: '组长直接拉回成员',
        });
      }
    }
    logger.info(`Member added to project ${id} by ${req.user!.username}: ${userId}`);
    res.success(null, '成员已拉回');
  });

  /**
   * Remove project member
   * 移除项目成员
   */
  static removeProjectMember = asyncHandler(async (req: Request, res: Response) => {
    const { id, userId } = req.params;
    const currentUserId = req.user!.sub;

    const access = await ensureProjectAccess(
      res,
      id,
      currentUserId,
      req.user!.role,
      'read',
      '你只能查看公开课题或已加入的课题'
    );
    if (!access) {
      return;
    }
    if (access.ownerStateValid === false) {
      return res.error('课题当前组长数据异常', 'PROJECT_OWNER_STATE_INVALID', 409);
    }

    // 获取项目成员列表
    const members = await ResearchModel.getProjectMembers(id);
    const targetMember = members.find((m: any) => m.user_id === userId);
    const currentOwnerUserId = access.ownerUserId
      ?? members.find((member: any) => member.role === 'owner')?.user_id
      ?? null;

    // 检查目标成员是否存在
    if (!targetMember) {
      return res.error('成员未找到', 'MEMBER_NOT_FOUND', 404);
    }

    // 允许成员移除自己（退出课题组）
    if (userId === currentUserId) {
      // owner 不能移除自己
      if (userId === currentOwnerUserId) {
        return res.error('组长不能退出课题组，请先转让组长权限', 'OWNER_CANNOT_LEAVE', 403);
      }
      const removal = await ResearchModel.removeProjectMember(id, userId, currentOwnerUserId);
      if (removal.ownerConflict) {
        return res.error('组长不能退出课题组，请先转让组长权限', 'OWNER_CANNOT_LEAVE', 403);
      }
      if (!removal.removed) {
        return res.error('成员状态已发生变化，请刷新后重试', 'MEMBER_STATE_STALE', 409);
      }
      await deleteLeadershipTransferInvitation(removal.clearedLeadershipTransfer);
      logger.info(`Member left project ${id}: ${userId}`);
      return res.success(null, '已退出课题组');
    }

    // 权限检查：只有 owner 或系统管理员可以移除其他成员
    if (!access.canManage) {
      return res.error('无权移除成员', 'FORBIDDEN', 403);
    }

    // 不能移除 owner
    if (userId === currentOwnerUserId) {
      return res.error('不能移除组长', 'CANNOT_REMOVE_OWNER', 403);
    }

    const removal = await ResearchModel.removeProjectMember(id, userId, currentOwnerUserId);
    if (removal.ownerConflict) {
      return res.error('不能移除组长', 'CANNOT_REMOVE_OWNER', 403);
    }
    if (!removal.removed) {
      return res.error('成员状态已发生变化，请刷新后重试', 'MEMBER_STATE_STALE', 409);
    }
    await deleteLeadershipTransferInvitation(removal.clearedLeadershipTransfer);
    logger.info(`Member removed from project ${id} by ${req.user!.username}: ${userId}`);
    res.success(null, '成员移除成功');
  });

  /**
   * Get project AI advisor messages
   * 获取课题 AI 顾问消息
   */
  static getProjectAgentMessages = asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const access = await ensureProjectAccess(
      res,
      projectId,
      req.user!.sub,
      req.user!.role,
      'discussion',
      '只有课题成员可以查看 AI 顾问'
    );
    if (!access) {
      return;
    }

    res.success({
      enabled: ResearchAgentService.isEnabled(),
      messages: [],
    });
  });

  /**
   * Clear project AI advisor messages
   * 清空课题 AI 顾问消息
   */
  static clearProjectAgentMessages = asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const access = await ensureProjectAccess(
      res,
      projectId,
      req.user!.sub,
      req.user!.role,
      'manage',
      '只有组长或管理员可以清空 AI 顾问历史'
    );
    if (!access) {
      return;
    }

    const deletedCount = await ResearchModel.clearProjectAgentMessages(projectId);
    res.success({ deletedCount }, 'AI 顾问历史已清空');
  });

  /**
   * Send a project AI advisor message
   * 发送课题 AI 顾问消息
   */
  static sendProjectAgentMessage = asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const rawContent = typeof req.body.content === 'string' ? req.body.content : '';
    const content = rawContent.trim();
    const liveHistory = normalizeResearchAgentLiveHistory(req.body.history);

    if (!content) {
      return res.error('请输入 AI 顾问消息', 'INVALID_AGENT_MESSAGE', 400);
    }

    if (content.length > MAX_RESEARCH_AGENT_CONTENT_LENGTH) {
      return res.error(
        `AI 顾问消息不能超过 ${MAX_RESEARCH_AGENT_CONTENT_LENGTH} 字`,
        'AGENT_MESSAGE_TOO_LONG',
        400
      );
    }

    if (!liveHistory) {
      return res.error('AI 顾问上下文格式无效', 'INVALID_AGENT_HISTORY', 400);
    }

    const access = await ensureProjectAccess(
      res,
      projectId,
      req.user!.sub,
      req.user!.role,
      'discussion',
      '只有课题成员可以使用 AI 顾问'
    );
    if (!access) {
      return;
    }

    if (!ResearchAgentService.isEnabled()) {
      return res.error('AI 顾问尚未配置', 'AI_ADVISOR_DISABLED', 503);
    }

    const [members, discussionDigest] = await Promise.all([
      ResearchModel.getProjectMembers(projectId),
      ResearchModel.getRecentProjectDiscussionDigest(projectId, 8),
    ]);
    const context = buildResearchAgentContext(access.project, members, discussionDigest);
    const chatMessages: ResearchAgentChatMessage[] = [
      { role: 'system', content: RESEARCH_AGENT_SYSTEM_PROMPT },
      { role: 'system', content: context },
      ...liveHistory,
      { role: 'user', content },
    ];

    try {
      const completion = await ResearchAgentService.createChatCompletion(chatMessages);
      const username = req.user!.username || '成员';

      res.success(
        {
          user: {
            id: generateId(),
            project_id: projectId,
            user_id: req.user!.sub,
            role: 'user',
            content,
            model: null,
            usage: null,
            created_at: new Date(),
            username,
            avatar_url: null,
          },
          assistant: {
            id: generateId(),
            project_id: projectId,
            user_id: req.user!.sub,
            role: 'assistant',
            content: completion.content,
            model: completion.model,
            usage: completion.usage ?? null,
            created_at: new Date(),
            username: 'AI 顾问',
            avatar_url: null,
          },
        },
        'AI 顾问已回复',
        201
      );
    } catch (error) {
      if (error instanceof ResearchAgentDisabledError || error instanceof ResearchAgentUpstreamError) {
        return res.error(error.message, error.code, error.statusCode);
      }

      throw error;
    }
  });

  // ============================================================
  // Canvases / 画布
  // ============================================================

  /**
   * Get project canvases
   * 获取项目的画布列表
   */
  static getProjectCanvases = asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const access = await ensureProjectAccess(
      res,
      projectId,
      req.user!.sub,
      req.user!.role,
      'read',
      '你只能查看公开课题或已加入的课题画布'
    );
    if (!access) {
      return;
    }
    const canvases = await ResearchModel.getProjectCanvases(projectId);
    res.success(canvases);
  });

  /**
   * Get canvas with nodes and edges
   * 获取画布详情（包含节点和边）
   */
  static getCanvas = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const canvasAccess = await ensureCanvasAccess(
      res,
      id,
      req.user!.sub,
      req.user!.role,
      'read',
      '你只能查看公开课题或已加入的课题画布'
    );
    if (!canvasAccess) {
      return;
    }

    res.success(canvasAccess.canvas);
  });

  /**
   * Create canvas
   * 创建画布
   */
  static createCanvas = asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const access = await ensureProjectAccess(
      res,
      projectId,
      req.user!.sub,
      req.user!.role,
      'write',
      '只有课题成员可以创建画布'
    );
    if (!access) {
      return;
    }
    const canvasId = await ResearchModel.createCanvas(projectId, req.body);

    const canvas = await ResearchModel.getCanvasById(canvasId);
    logger.info(`Canvas created by user ${req.user!.username}: ${canvasId}`);
    res.success(canvas, '画布创建成功', 201);
  });

  /**
   * Update canvas
   * 更新画布
   */
  static updateCanvas = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const canvasAccess = await ensureCanvasAccess(
      res,
      id,
      req.user!.sub,
      req.user!.role,
      'write',
      '只有课题成员可以编辑画布'
    );
    if (!canvasAccess) {
      return;
    }
    await ResearchModel.updateCanvas(id, req.body);

    const canvas = await ResearchModel.getCanvasById(id);
    logger.info(`Canvas updated by user ${req.user!.username}: ${id}`);
    res.success(canvas, '画布更新成功');
  });

  /**
   * Delete canvas
   * 删除画布
   */
  static deleteCanvas = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const canvasAccess = await ensureCanvasAccess(
      res,
      id,
      req.user!.sub,
      req.user!.role,
      'write',
      '只有课题成员可以删除画布'
    );
    if (!canvasAccess) {
      return;
    }
    await ResearchModel.deleteCanvas(id);
    logger.info(`Canvas deleted by user ${req.user!.username}: ${id}`);
    res.success(null, '画布删除成功');
  });

  // ============================================================
  // Nodes / 节点
  // ============================================================

  /**
   * Create node
   * 创建节点
   */
  static createNode = asyncHandler(async (req: Request, res: Response) => {
    const { canvasId } = req.params;
    const canvasAccess = await ensureCanvasAccess(
      res,
      canvasId,
      req.user!.sub,
      req.user!.role,
      'write',
      '只有课题成员可以创建节点'
    );
    if (!canvasAccess) {
      return;
    }

    const nodeId = await ResearchModel.createNode(canvasId, req.body, req.user!.sub);

    // Log activity
    await ResearchModel.logActivity(
      canvasAccess.canvas.project_id,
      req.user!.sub,
      'create_node',
      'node',
      nodeId,
      { type: req.body.type }
    );

    const node = await ResearchModel.getNodeById(nodeId);
    logger.info(`Node created by user ${req.user!.username}: ${nodeId}`);
    res.success(node, '节点创建成功', 201);
  });

  /**
   * Get node
   * 获取节点
   */
  static getNode = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const nodeAccess = await ensureNodeAccess(
      res,
      id,
      req.user!.sub,
      req.user!.role,
      'read',
      '你只能查看公开课题或已加入的课题内容'
    );
    if (!nodeAccess) {
      return;
    }

    res.success(nodeAccess.node);
  });

  /**
   * Update node
   * 更新节点
   */
  static updateNode = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const nodeAccess = await ensureNodeAccess(
      res,
      id,
      req.user!.sub,
      req.user!.role,
      'write',
      '只有课题成员可以编辑节点'
    );
    if (!nodeAccess) {
      return;
    }
    await ResearchModel.updateNode(id, req.body);

    const node = await ResearchModel.getNodeById(id);
    logger.info(`Node updated by user ${req.user!.username}: ${id}`);
    res.success(node, '节点更新成功');
  });

  /**
   * Delete node
   * 删除节点
   */
  static deleteNode = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const nodeAccess = await ensureNodeAccess(
      res,
      id,
      req.user!.sub,
      req.user!.role,
      'write',
      '只有课题成员可以删除节点'
    );
    if (!nodeAccess) {
      return;
    }

    await ResearchModel.deleteNode(id);

    // Log activity
    await ResearchModel.logActivity(
      nodeAccess.canvas.project_id,
      req.user!.sub,
      'delete_node',
      'node',
      id
    );

    logger.info(`Node deleted by user ${req.user!.username}: ${id}`);
    res.success(null, '节点删除成功');
  });

  /**
   * Assign node to users
   * 分配节点给用户
   */
  static assignNode = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { assignedTo } = req.body;
    const nodeAccess = await ensureNodeAccess(
      res,
      id,
      req.user!.sub,
      req.user!.role,
      'write',
      '只有课题成员可以分配节点'
    );
    if (!nodeAccess) {
      return;
    }

    await ResearchModel.updateNode(id, { assigned_to: assignedTo });
    logger.info(`Node ${id} assigned by user ${req.user!.username}`);
    res.success(null, '节点分配成功');
  });

  // ============================================================
  // Edges / 边（关系）
  // ============================================================

  /**
   * Create edge
   * 创建边
   */
  static createEdge = asyncHandler(async (req: Request, res: Response) => {
    const { canvasId } = req.params;
    const canvasAccess = await ensureCanvasAccess(
      res,
      canvasId,
      req.user!.sub,
      req.user!.role,
      'write',
      '只有课题成员可以创建关系'
    );
    if (!canvasAccess) {
      return;
    }
    const edgeId = await ResearchModel.createEdge(canvasId, req.body, req.user!.sub);

    // Log activity
    await ResearchModel.logActivity(
      canvasAccess.canvas.project_id,
      req.user!.sub,
      'create_edge',
      'edge',
      edgeId,
      { type: req.body.type, source: req.body.source, target: req.body.target }
    );

    const edge = await ResearchModel.getEdgeById(edgeId);
    logger.info(`Edge created by user ${req.user!.username}: ${edgeId}`);
    res.success(edge, '关系创建成功', 201);
  });

  /**
   * Get edge
   * 获取边
   */
  static getEdge = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const edgeAccess = await ensureEdgeAccess(
      res,
      id,
      req.user!.sub,
      req.user!.role,
      'read',
      '你只能查看公开课题或已加入的课题内容'
    );
    if (!edgeAccess) {
      return;
    }

    res.success(edgeAccess.edge);
  });

  /**
   * Update edge
   * 更新边
   */
  static updateEdge = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const edgeAccess = await ensureEdgeAccess(
      res,
      id,
      req.user!.sub,
      req.user!.role,
      'write',
      '只有课题成员可以编辑关系'
    );
    if (!edgeAccess) {
      return;
    }
    await ResearchModel.updateEdge(id, req.body);

    const edge = await ResearchModel.getEdgeById(id);
    logger.info(`Edge updated by user ${req.user!.username}: ${id}`);
    res.success(edge, '关系更新成功');
  });

  /**
   * Delete edge
   * 删除边
   */
  static deleteEdge = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const edgeAccess = await ensureEdgeAccess(
      res,
      id,
      req.user!.sub,
      req.user!.role,
      'write',
      '只有课题成员可以删除关系'
    );
    if (!edgeAccess) {
      return;
    }
    await ResearchModel.deleteEdge(id);
    logger.info(`Edge deleted by user ${req.user!.username}: ${id}`);
    res.success(null, '关系删除成功');
  });

  // ============================================================
  // Comments / 评论
  // ============================================================

  /**
   * Get node comments
   * 获取节点评论
   */
  static getNodeComments = asyncHandler(async (req: Request, res: Response) => {
    const { nodeId } = req.params;
    const nodeAccess = await ensureNodeAccess(
      res,
      nodeId,
      req.user!.sub,
      req.user!.role,
      'read',
      '你只能查看公开课题或已加入的课题评论'
    );
    if (!nodeAccess) {
      return;
    }
    const comments = await ResearchModel.getNodeComments(nodeId);
    res.success(comments);
  });

  /**
   * Add comment
   * 添加评论
   */
  static addComment = asyncHandler(async (req: Request, res: Response) => {
    const { nodeId } = req.params;
    const { content } = req.body;
    const nodeAccess = await ensureNodeAccess(
      res,
      nodeId,
      req.user!.sub,
      req.user!.role,
      'write',
      '只有课题成员可以发表评论'
    );
    if (!nodeAccess) {
      return;
    }

    const commentId = await ResearchModel.addComment(nodeId, req.user!.sub, content);
    logger.info(`Comment added to node ${nodeId} by user ${req.user!.username}`);
    res.success({ id: commentId }, '评论添加成功', 201);
  });

  /**
   * Update comment
   * 更新评论
   */
  static updateComment = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { content } = req.body;
    const comment = await ResearchModel.getCommentById(id);
    if (!comment) {
      return res.error('评论未找到', 'COMMENT_NOT_FOUND', 404);
    }

    const nodeAccess = await ensureNodeAccess(
      res,
      comment.node_id,
      req.user!.sub,
      req.user!.role,
      'write',
      '只有课题成员可以编辑评论'
    );
    if (!nodeAccess) {
      return;
    }

    if (comment.user_id !== req.user!.sub) {
      return res.error('只能编辑自己的评论', 'FORBIDDEN', 403);
    }

    await ResearchModel.updateComment(id, req.user!.sub, content);
    logger.info(`Comment ${id} updated by user ${req.user!.username}`);
    res.success(null, '评论更新成功');
  });

  /**
   * Delete comment
   * 删除评论
   */
  static deleteComment = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const comment = await ResearchModel.getCommentById(id);
    if (!comment) {
      return res.error('评论未找到', 'COMMENT_NOT_FOUND', 404);
    }

    const nodeAccess = await ensureNodeAccess(
      res,
      comment.node_id,
      req.user!.sub,
      req.user!.role,
      'write',
      '只有课题成员可以删除评论'
    );
    if (!nodeAccess) {
      return;
    }

    const canModerate = nodeAccess.access.canModerate;
    if (comment.user_id !== req.user!.sub && !canModerate) {
      return res.error('无权删除该评论', 'FORBIDDEN', 403);
    }

    await ResearchModel.deleteComment(id);
    logger.info(`Comment ${id} deleted by user ${req.user!.username}`);
    res.success(null, '评论删除成功');
  });

  /**
   * Get project discussion comments
   * 获取课题讨论评论
   */
  static getProjectDiscussionComments = asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const access = await ensureProjectAccess(
      res,
      projectId,
      req.user!.sub,
      req.user!.role,
      'discussion',
      '只有课题成员可以查看讨论区'
    );
    if (!access) {
      return;
    }

    const comments = await ResearchModel.getProjectDiscussionComments(projectId);
    res.success(comments);
  });

  /**
   * Add project discussion comment
   * 添加课题讨论评论
   */
  static addProjectDiscussionComment = asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const currentUserId = req.user!.sub;
    const rawContent = typeof req.body.content === 'string' ? req.body.content : '';
    const content = rawContent.trim();
    const imageUrls = normalizeProjectDiscussionManagedUrls(req.body.imageUrls);
    const videoUrls = normalizeProjectDiscussionManagedUrls(req.body.videoUrls);
    const parentCommentId = typeof req.body.parentCommentId === 'string' && req.body.parentCommentId.trim().length > 0
      ? req.body.parentCommentId.trim()
      : null;
    const hasQuestionIndex = req.body.questionIndex !== undefined;
    const questionIndex = req.body.questionIndex;

    if (imageUrls === null) {
      return res.error('评论附件地址格式无效', 'INVALID_COMMENT_IMAGES', 400);
    }

    if (videoUrls === null) {
      return res.error('评论视频地址格式无效', 'INVALID_COMMENT_VIDEOS', 400);
    }

    if (content.length > 2000) {
      return res.error('评论内容不能超过 2000 字', 'COMMENT_TOO_LONG', 400);
    }

    if ((imageUrls?.length ?? 0) > MAX_PROJECT_DISCUSSION_IMAGES) {
      return res.error(`单条评论最多上传 ${MAX_PROJECT_DISCUSSION_IMAGES} 张图片`, 'TOO_MANY_COMMENT_IMAGES', 400);
    }

    if ((videoUrls?.length ?? 0) > MAX_PROJECT_DISCUSSION_VIDEOS) {
      return res.error(`单条评论最多上传 ${MAX_PROJECT_DISCUSSION_VIDEOS} 个视频`, 'TOO_MANY_COMMENT_VIDEOS', 400);
    }

    if (!content && (imageUrls?.length ?? 0) === 0 && (videoUrls?.length ?? 0) === 0) {
      return res.error('评论内容、图片和视频至少填写一项', 'INVALID_COMMENT_CONTENT', 400);
    }

    const access = await ensureProjectAccess(
      res,
      projectId,
      currentUserId,
      req.user!.role,
      'discussion',
      '只有课题成员可以参与讨论'
    );
    if (!access) {
      return;
    }

    if (hasQuestionIndex && (!Number.isInteger(questionIndex) || questionIndex < 0)) {
      return res.error('问题索引必须是当前问题的非负整数索引', 'INVALID_QUESTION_INDEX', 400);
    }

    if (hasQuestionIndex && parentCommentId) {
      return res.error('问题讨论不能同时指定回复目标', 'QUESTION_INDEX_WITH_PARENT', 400);
    }

    if (
      hasQuestionIndex
      && questionIndex >= parseResearchQuestions(access.project.research_questions_zh).length
    ) {
      return res.error('问题索引超出当前问题范围', 'INVALID_QUESTION_INDEX', 400);
    }

    if (parentCommentId) {
      const parentComment = await ResearchModel.getProjectDiscussionCommentById(parentCommentId);
      if (!parentComment || parentComment.project_id !== projectId) {
        return res.error('回复的评论不存在', 'PARENT_COMMENT_NOT_FOUND', 404);
      }

      if (parentComment.is_deleted) {
        return res.error('该评论已删除，无法继续回复', 'PARENT_COMMENT_DELETED', 400);
      }
    }

    const commentId = await ResearchModel.addProjectDiscussionComment(
      projectId,
      currentUserId,
      content,
      parentCommentId,
      imageUrls ?? [],
      videoUrls ?? [],
      hasQuestionIndex ? questionIndex : undefined
    );

    await notifyProjectDiscussionCommentRecipients(
      projectId,
      currentUserId,
      commentId,
      parentCommentId,
      req.user!.username || '成员',
      content
    );

    await ResearchModel.logActivity(
      projectId,
      currentUserId,
      'add_comment',
      'project_comment',
      commentId,
      {
        parent_comment_id: parentCommentId,
        image_count: imageUrls?.length ?? 0,
        video_count: videoUrls?.length ?? 0,
      }
    );

    logger.info(`Project discussion comment added by user ${req.user!.username}: ${commentId}`);
    res.success({ id: commentId }, '讨论留言发布成功', 201);
  });

  /**
   * Update project discussion comment (author-only, text only)
   * 编辑课题讨论评论（仅作者本人，只改文字）
   */
  static updateProjectDiscussionComment = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const currentUserId = req.user!.sub;
    const rawContent = typeof req.body?.content === 'string' ? req.body.content : '';
    const content = rawContent.trim();

    if (content.length > 2000) {
      return res.error('评论内容不能超过 2000 字', 'COMMENT_TOO_LONG', 400);
    }

    const comment = await ResearchModel.getProjectDiscussionCommentById(id);
    if (!comment) {
      return res.error('评论未找到', 'COMMENT_NOT_FOUND', 404);
    }

    if (comment.is_deleted) {
      return res.error('该评论已删除，无法编辑', 'COMMENT_DELETED', 400);
    }

    if (comment.user_id !== currentUserId) {
      return res.error('只能编辑自己的留言', 'FORBIDDEN', 403);
    }

    if (!content && (comment.image_urls?.length ?? 0) === 0 && (comment.video_urls?.length ?? 0) === 0) {
      return res.error('评论内容、图片和视频至少填写一项', 'INVALID_COMMENT_CONTENT', 400);
    }

    const access = await ProjectAccessService.getProjectAccess(comment.project_id, currentUserId, req.user!.role);
    if (!access.canAccessDiscussion) {
      return res.error('只有课题成员可以编辑讨论留言', 'FORBIDDEN', 403);
    }

    await ResearchModel.updateProjectDiscussionComment(id, currentUserId, content);
    logger.info(`Project discussion comment updated by user ${req.user!.username}: ${id}`);
    res.success(null, '讨论留言已更新');
  });

  /**
   * Delete project discussion comment
   * 删除课题讨论评论
   */
  static deleteProjectDiscussionComment = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const currentUserId = req.user!.sub;

    const comment = await ResearchModel.getProjectDiscussionCommentById(id);
    if (!comment) {
      return res.error('评论未找到', 'COMMENT_NOT_FOUND', 404);
    }

    const access = await ProjectAccessService.getProjectAccess(comment.project_id, currentUserId, req.user!.role);
    const canModerate = access.canModerate;

    if (comment.user_id !== currentUserId && !canModerate) {
      return res.error('无权删除该评论', 'FORBIDDEN', 403);
    }

    await ResearchModel.deleteProjectDiscussionComment(id);
    await ManagedUploadCleanupService.cleanupUrls([...(comment.image_urls ?? []), ...(comment.video_urls ?? [])], {
      reason: `research.project-comment.delete:${id}`,
    });
    logger.info(`Project discussion comment deleted by user ${req.user!.username}: ${id}`);
    res.success(null, '讨论留言删除成功');
  });

  // ============================================================
  // Activity / 活动日志
  // ============================================================

  /**
   * Get project activity
   * 获取项目活动日志
   */
  static getProjectActivity = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { limit = 50 } = req.query;
    const access = await ensureProjectAccess(
      res,
      id,
      req.user!.sub,
      req.user!.role,
      'read',
      '你只能查看公开课题或已加入的课题活动'
    );
    if (!access) {
      return;
    }
    const activities = await ResearchModel.getProjectActivity(id, Number(limit));
    res.success(activities);
  });

  // ============================================================
  // Task Board / 任务看板
  // ============================================================

  /**
   * Get task board
   * 获取任务看板
   */
  static getTaskBoard = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const access = await ensureProjectAccess(
      res,
      id,
      req.user!.sub,
      req.user!.role,
      'read',
      '你只能查看公开课题或已加入的课题任务看板'
    );
    if (!access) {
      return;
    }
    const taskBoard = await ResearchModel.getTaskBoard(id);
    res.success(taskBoard);
  });

  /**
   * Update task board (placeholder for now)
   * 更新任务看板（暂未实现）
   */
  static updateTaskBoard = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const access = await ensureProjectAccess(
      res,
      id,
      req.user!.sub,
      req.user!.role,
      'write',
      '只有课题成员可以更新任务看板'
    );
    if (!access) {
      return;
    }
    // TODO: Implement task board updates
    res.success(null, '任务看板更新成功');
  });

  // ============================================================
  // Simulation / 仿真
  // ============================================================

  /**
   * Run simulation (placeholder for now)
   * 运行仿真（暂未实现）
   */
  static runSimulation = asyncHandler(async (req: Request, res: Response) => {
    // TODO: Implement simulation execution
    res.success({ message: 'Simulation execution not yet implemented' }, '仿真运行功能开发中');
  });

  /**
   * Get simulation results (placeholder for now)
   * 获取仿真结果（暂未实现）
   */
  static getSimulationResults = asyncHandler(async (req: Request, res: Response) => {
    // TODO: Implement result retrieval
    res.success({ message: 'Simulation results not yet implemented' }, '仿真结果功能开发中');
  });

  /**
   * Attach demo to node (placeholder for now)
   * 关联演示到节点（暂未实现）
   */
  static attachDemoToNode = asyncHandler(async (req: Request, res: Response) => {
    // TODO: Implement demo attachment
    res.success({ message: 'Demo attachment not yet implemented' }, '演示关联功能开发中');
  });

  // ============================================================
  // Project Settings / 项目设置
  // ============================================================

  /**
   * Get project settings
   * 获取项目设置
   */
  static getProjectSettings = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const access = await ensureProjectAccess(
      res,
      id,
      req.user!.sub,
      req.user!.role,
      'manage',
      '只有组长可以查看课题设置'
    );
    if (!access) {
      return;
    }
    const settings = await ProfileModel.getOrCreateProjectSettings(id);
    res.success(settings);
  });

  /**
   * Update project settings
   * 更新项目设置
   */
  static updateProjectSettings = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const access = await ensureProjectAccess(
      res,
      id,
      req.user!.sub,
      req.user!.role,
      'manage',
      '只有组长可以更新课题设置'
    );
    if (!access) {
      return;
    }
    await ProjectAccessService.applyProjectSettings(id, req.body);
    const settings = await ProfileModel.getProjectSettings(id);
    logger.info(`Project settings updated by user ${req.user!.username}: ${id}`);
    res.success(settings, '设置更新成功');
  });

  // ============================================================
  // Project Applications / 项目申请
  // ============================================================

  /**
   * Get project applications
   * 获取项目申请列表
   */
  static getProjectApplications = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const access = await ensureProjectAccess(
      res,
      id,
      req.user!.sub,
      req.user!.role,
      'manage',
      '无权查看申请列表'
    );
    if (!access) {
      return;
    }

    const applications = await ProfileModel.getProjectApplications(id);
    res.success(applications);
  });

  /**
   * Create application to join project
   * 创建加入项目申请
   */
  static createApplication = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.sub;
    const { desired_role, proposed_contribution, weekly_time_commitment } = req.body;

    if (typeof desired_role !== 'string' || !desired_role.trim()) {
      return res.error('请填写想承担的角色', 'DESIRED_ROLE_REQUIRED', 400);
    }
    if (typeof proposed_contribution !== 'string' || !proposed_contribution.trim()) {
      return res.error('请填写可贡献的内容', 'PROPOSED_CONTRIBUTION_REQUIRED', 400);
    }
    if (typeof weekly_time_commitment !== 'string' || !weekly_time_commitment.trim()) {
      return res.error('请填写每周可投入时间', 'WEEKLY_TIME_COMMITMENT_REQUIRED', 400);
    }

    // Check if project exists and is recruiting
    const settings = await ProfileModel.getOrCreateProjectSettings(id);
    if (settings.visibility === 'invite_only') {
      return res.error('该项目仅限邀请加入', 'INVITE_ONLY', 403);
    }

    if (!settings.is_recruiting) {
      return res.error('该项目暂未招募', 'NOT_RECRUITING', 403);
    }

    // Check if already a member
    const members = await ResearchModel.getProjectMembers(id);
    const isMember = members.some((m: any) => m.user_id === userId);
    if (isMember) {
      return res.error('您已经是项目成员', 'ALREADY_MEMBER', 400);
    }

    const hasCapacity = await ensureProjectMemberCapacity(res, id);
    if (!hasCapacity) {
      return;
    }

    try {
      const applicationId = await ProfileModel.createApplication(id, userId, req.body);
      const application = await ProfileModel.getApplicationById(applicationId);
      logger.info(`Application created by user ${req.user!.username}: ${applicationId}`);

      // If no approval required, auto-approve
      if (!settings.require_approval) {
        const applicationUpdated = await ProfileModel.updateApplicationStatus(applicationId, 'approved', userId);
        if (!applicationUpdated) {
          throw new Error('申请状态更新失败');
        }
        await ResearchModel.addProjectMember(id, userId, 'member', application?.desired_role);
        await notifyApplicationResult({
          applicationId,
          projectId: id,
          applicantId: userId,
          status: 'approved',
          projectName: application?.project_name,
        });
        logger.info(`Application auto-approved: ${applicationId}`);
      }

      res.success(application, '申请提交成功', 201);
    } catch (error: any) {
      if (error.message.includes('待处理')) {
        return res.error(error.message, 'APPLICATION_EXISTS', 400);
      }
      throw error;
    }
  });

  /**
   * Update application status (approve/reject)
   * 更新申请状态（批准/拒绝）
   */
  static updateApplicationStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, review_notes } = req.body;
    const reviewerId = req.user!.sub;

    if (!['approved', 'rejected'].includes(status)) {
      return res.error('无效的状态', 'INVALID_STATUS', 400);
    }

    const application = await ProfileModel.getApplicationById(id);
    if (!application) {
      return res.error('申请未找到', 'APPLICATION_NOT_FOUND', 404);
    }

    if (application.status !== 'pending') {
      return res.error('该申请已处理', 'ALREADY_PROCESSED', 400);
    }

    const access = await ensureProjectAccess(
      res,
      application.project_id,
      reviewerId,
      req.user!.role,
      'manage',
      '无权处理该申请'
    );
    if (!access) {
      return;
    }

    if (status === 'approved') {
      const applicantMembership = await ResearchModel.getProjectMembership(
        application.project_id,
        application.user_id
      );
      if (applicantMembership && applicantMembership.active !== false) {
        return res.error('该用户已经是项目成员', 'ALREADY_MEMBER', 400);
      }

      const hasCapacity = await ensureProjectMemberCapacity(res, application.project_id);
      if (!hasCapacity) {
        return;
      }
    }

    const applicationUpdated = await ProfileModel.updateApplicationStatus(id, status, reviewerId, review_notes);
    if (!applicationUpdated) {
      return res.error('该申请已处理', 'ALREADY_PROCESSED', 400);
    }

    // If approved, add to project members
    if (status === 'approved') {
      await ResearchModel.addProjectMember(
        application.project_id,
        application.user_id,
        'member',
        application.desired_role
      );
      logger.info(`User ${application.user_id} added to project ${application.project_id}`);
    } else {
      await ResearchModel.touchProjectActivity(application.project_id);
    }

    await notifyApplicationResult({
      applicationId: id,
      projectId: application.project_id,
      applicantId: application.user_id,
      status,
      projectName: application.project_name || access.project.name_zh || access.project.name_en,
      reviewNotes: review_notes,
    });

    logger.info(`Application ${id} ${status} by user ${req.user!.username}`);
    res.success(null, status === 'approved' ? '申请已通过' : '申请已拒绝');
  });

  /**
   * Withdraw application
   * 撤回申请
   */
  static withdrawApplication = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.sub;

    const application = await ProfileModel.getApplicationById(id);
    if (!application) {
      return res.error('申请未找到', 'APPLICATION_NOT_FOUND', 404);
    }

    if (application.user_id !== userId) {
      return res.error('无权撤回该申请', 'FORBIDDEN', 403);
    }

    if (application.status !== 'pending') {
      return res.error('只能撤回待处理的申请', 'NOT_PENDING', 400);
    }

    await ProfileModel.withdrawApplication(id, userId);
    logger.info(`Application ${id} withdrawn by user ${req.user!.username}`);
    res.success(null, '申请已撤回');
  });

  // ============================================================
  // Project Creator Profile / 项目创建者资料
  // ============================================================

  /**
   * Get project creator profiles
   * 获取项目创建者资料
   */
  static getCreatorProfiles = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const access = await ensureProjectAccess(
      res,
      id,
      req.user!.sub,
      req.user!.role,
      'read',
      '你只能查看公开课题或已加入的课题资料'
    );
    if (!access) {
      return;
    }
    const profiles = await ProfileModel.getProjectCreatorProfiles(id);
    res.success(profiles);
  });

  /**
   * Create project with creator profile
   * 创建项目（包含创建者资料）
   */
  static createProjectWithProfile = asyncHandler(async (req: Request, res: Response) => {
    const { project, creatorProfile, settings } = req.body;
    const userId = req.user!.sub;
    const visibility = settings?.visibility ?? (project.is_public === true ? 'public' : 'private');

    // Create project
    const projectId = await ResearchModel.createProject(
      {
        name_zh: project.name_zh,
        name_en: project.name_en,
        description_zh: project.description_zh,
        description_en: project.description_en,
        research_questions_zh: project.research_questions_zh,
        research_hypotheses_zh: project.research_hypotheses_zh,
        basic_plan_zh: project.basic_plan_zh,
        extended_plan_zh: project.extended_plan_zh,
        challenge_value_zh: project.challenge_value_zh,
        challenge_objectives_zh: project.challenge_objectives_zh,
        challenge_beginner_steps_zh: project.challenge_beginner_steps_zh,
        challenge_min_deliverables_zh: project.challenge_min_deliverables_zh,
        challenge_review_criteria_zh: project.challenge_review_criteria_zh,
        challenge_timeline_zh: project.challenge_timeline_zh,
        challenge_difficulty: project.challenge_difficulty,
        challenge_roles_zh: project.challenge_roles_zh,
        challenge_missing_roles_zh: project.challenge_missing_roles_zh,
        challenge_progress_zh: project.challenge_progress_zh,
        is_public: visibility === 'public',
      },
      userId
    );

    // Create creator profile
    if (creatorProfile) {
      await ProfileModel.createCreatorProfile(projectId, userId, {
        display_name: creatorProfile.display_name || req.user!.username,
        organization: creatorProfile.organization,
        education_id: creatorProfile.education_id,
        major: creatorProfile.major,
        grade: creatorProfile.grade,
      });
    }

    // Create project settings
    if (settings) {
      await ProjectAccessService.initializeProjectSettings(projectId, { ...settings, visibility });
    } else {
      await ProjectAccessService.initializeProjectSettings(projectId, { visibility });
    }

    const result = await ResearchModel.getProjectById(projectId);
    logger.info(`Project with profile created by user ${req.user!.username}: ${projectId}`);
    res.success(result, '项目创建成功', 201);
  });
}
