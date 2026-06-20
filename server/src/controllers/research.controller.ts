/**
 * Research Controller
 * 虚拟课题组控制器
 *
 * Handles research system HTTP requests
 * 处理虚拟课题组系统的 HTTP 请求
 */

import { Request, Response } from 'express';
import { uploadConfig } from '../config/upload.config.js';
import { ResearchModel, type ResearchProjectMessageKind } from '../models/research.model.js';
import { NotificationModel } from '../models/notification.model.js';
import { ProfileModel } from '../models/profile.model.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { ManagedUploadCleanupService } from '../services/managed-upload-cleanup.service.js';
import {
  RESEARCH_AGENT_SYSTEM_PROMPT,
  ResearchAgentDisabledError,
  ResearchAgentService,
  ResearchAgentUpstreamError,
  type ResearchAgentChatMessage,
} from '../services/research-agent.service.js';
import { generateId } from '../utils/crypto.util.js';
import { logger } from '../utils/logger.js';

const MAX_PROJECT_DISCUSSION_IMAGES = 6;
const MAX_PROJECT_DISCUSSION_VIDEOS = 2;
const MAX_PROJECT_MESSAGE_LENGTH = 2000;
const MAX_RESEARCH_AGENT_CONTENT_LENGTH = 2000;
const MAX_RESEARCH_AGENT_HISTORY_MESSAGES = 12;
const managedUploadUrlPrefix = uploadConfig.publicUrlPrefix.replace(/\/+$/, '');
const DELETE_PROJECT_CONFIRMATION_KEYWORD = 'DELETE';

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

function parseProjectMessageCursor(value: unknown): Date | null | 'invalid' {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const rawValue = Array.isArray(value) ? value[0] : value;
  if (typeof rawValue !== 'string') {
    return 'invalid';
  }

  const date = new Date(rawValue);
  return Number.isNaN(date.getTime()) ? 'invalid' : date;
}

async function notifyProjectMessageRecipients(
  projectId: string,
  senderId: string,
  messageId: string,
  kind: ResearchProjectMessageKind,
  title: string,
  content: string
): Promise<void> {
  const recipients = (await ResearchModel.getActiveProjectMemberUserIds(projectId))
    .filter((userId) => userId !== senderId);

  await NotificationModel.createNotificationForUsers(recipients, {
    type: kind === 'announcement' ? 'project_announcement' : 'project_message',
    title,
    content,
    data: {
      project_id: projectId,
      message_id: messageId,
      sender_id: senderId,
      kind,
    },
    action_url: `/lab/projects/${projectId}#project-messages`,
  });
}

type ProjectAccessLevel = 'read' | 'write' | 'manage' | 'discussion';

async function ensureProjectAccess(
  res: Response,
  projectId: string,
  userId: string,
  userRole: 'user' | 'admin',
  level: ProjectAccessLevel,
  forbiddenMessage = '权限不足'
) {
  const access = await ResearchModel.getProjectAccess(projectId, userId, userRole);

  if (!access.project) {
    res.error('项目未找到', 'PROJECT_NOT_FOUND', 404);
    return null;
  }

  const allowed = {
    read: access.canRead,
    write: access.canWrite,
    manage: access.canManage,
    discussion: access.canAccessDiscussion,
  }[level];

  if (!allowed) {
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

    // Get members
    const members = await ResearchModel.getProjectMembers(id);
    const formerMembers = access.canManage
      ? await ResearchModel.getFormerProjectMembers(id)
      : undefined;
    const pendingApplication = await ProfileModel.getPendingApplication(id, req.user!.sub);

    res.success({
      ...access.project,
      members,
      has_pending_application: Boolean(pendingApplication),
      ...(formerMembers ? { former_members: formerMembers } : {}),
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
      is_public,
    } = req.body;
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
        is_public,
      },
      req.user!.sub
    );

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

    const updated = await ResearchModel.updateProject(id, req.body);

    if (!updated) {
      return res.error('项目未找到', 'PROJECT_NOT_FOUND', 404);
    }

    const project = await ResearchModel.getProjectById(id);
    if (req.body.thumbnail !== undefined && previousThumbnail && previousThumbnail !== req.body.thumbnail) {
      await ManagedUploadCleanupService.cleanupUrls([previousThumbnail], {
        reason: `research.project.cover-change:${id}`,
      });
    }
    logger.info(`Project updated by user ${req.user!.username}: ${id}`);
    res.success(project, '项目更新成功');
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
    await ResearchModel.deleteProject(id);
    await ManagedUploadCleanupService.cleanupUrls([coverUrl], {
      reason: `research.project.delete:${id}`,
    });
    logger.info(`Project deleted by user ${req.user!.username}: ${id}`);
    res.success(null, '项目删除成功');
  });

  /**
   * Add project member
   * 添加项目成员
   */
  static addProjectMember = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { userId } = req.body;
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

    await ResearchModel.addProjectMember(id, userId, 'member');
    const pendingApplication = await ProfileModel.getPendingApplication(id, userId);
    if (pendingApplication) {
      await ProfileModel.updateApplicationStatus(
        pendingApplication.id,
        'approved',
        currentUserId,
        '组长直接拉回成员'
      );
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

    // 获取项目成员列表
    const members = await ResearchModel.getProjectMembers(id);
    const currentUser = members.find((m: any) => m.user_id === currentUserId);
    const targetMember = members.find((m: any) => m.user_id === userId);

    // 检查目标成员是否存在
    if (!targetMember) {
      return res.error('成员未找到', 'MEMBER_NOT_FOUND', 404);
    }

    // 允许成员移除自己（退出课题组）
    if (userId === currentUserId) {
      // owner 不能移除自己
      if (currentUser?.role === 'owner') {
        return res.error('组长不能退出课题组，请先转让组长权限', 'OWNER_CANNOT_LEAVE', 403);
      }
      await ResearchModel.removeProjectMember(id, userId);
      logger.info(`Member left project ${id}: ${userId}`);
      return res.success(null, '已退出课题组');
    }

    // 权限检查：只有 owner 或系统管理员可以移除其他成员
    if (!access.canManage) {
      return res.error('无权移除成员', 'FORBIDDEN', 403);
    }

    // 不能移除 owner
    if (targetMember.role === 'owner') {
      return res.error('不能移除组长', 'CANNOT_REMOVE_OWNER', 403);
    }

    await ResearchModel.removeProjectMember(id, userId);
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
   * Get project messages
   * 获取课题成员消息
   */
  static getProjectMessages = asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const limit = Math.min(100, Math.max(1, Math.floor(Number(req.query.limit ?? 50))));
    const before = parseProjectMessageCursor(req.query.before);
    const after = parseProjectMessageCursor(req.query.after);

    if (before === 'invalid' || after === 'invalid' || Number.isNaN(limit)) {
      return res.error('消息查询参数无效', 'INVALID_MESSAGE_QUERY', 400);
    }

    const access = await ensureProjectAccess(
      res,
      projectId,
      req.user!.sub,
      req.user!.role,
      'discussion',
      '只有课题成员可以查看消息'
    );
    if (!access) {
      return;
    }

    const messages = await ResearchModel.getProjectMessages(projectId, {
      limit,
      ...(before ? { before } : {}),
      ...(after ? { after } : {}),
    });
    res.success(messages);
  });

  /**
   * Send project message
   * 发送课题成员消息
   */
  static sendProjectMessage = asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const currentUserId = req.user!.sub;
    const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';

    if (!content) {
      return res.error('消息内容不能为空', 'INVALID_MESSAGE_CONTENT', 400);
    }

    if (content.length > MAX_PROJECT_MESSAGE_LENGTH) {
      return res.error(`消息内容不能超过 ${MAX_PROJECT_MESSAGE_LENGTH} 字`, 'MESSAGE_TOO_LONG', 400);
    }

    const access = await ensureProjectAccess(
      res,
      projectId,
      currentUserId,
      req.user!.role,
      'discussion',
      '只有课题成员可以发送消息'
    );
    if (!access) {
      return;
    }

    const messageId = await ResearchModel.addProjectMessage(projectId, currentUserId, 'message', content);

    await notifyProjectMessageRecipients(
      projectId,
      currentUserId,
      messageId,
      'message',
      `${req.user!.username || '成员'} 发送了课题消息`,
      content
    );

    res.success({ id: messageId }, '消息已发送', 201);
  });

  /**
   * Send project announcement
   * 发送课题公告
   */
  static sendProjectAnnouncement = asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const currentUserId = req.user!.sub;
    const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';

    if (!content) {
      return res.error('公告内容不能为空', 'INVALID_ANNOUNCEMENT_CONTENT', 400);
    }

    if (content.length > MAX_PROJECT_MESSAGE_LENGTH) {
      return res.error(`公告内容不能超过 ${MAX_PROJECT_MESSAGE_LENGTH} 字`, 'ANNOUNCEMENT_TOO_LONG', 400);
    }

    const access = await ensureProjectAccess(
      res,
      projectId,
      currentUserId,
      req.user!.role,
      'manage',
      '只有组长或管理员可以发送公告'
    );
    if (!access) {
      return;
    }

    const messageId = await ResearchModel.addProjectMessage(projectId, currentUserId, 'announcement', content);

    await notifyProjectMessageRecipients(
      projectId,
      currentUserId,
      messageId,
      'announcement',
      `${access.project.name_zh || '课题'} 发布了公告`,
      content
    );

    res.success({ id: messageId }, '公告已发送', 201);
  });

  /**
   * Mark project messages as read
   * 标记课题消息为已读
   */
  static markProjectMessagesRead = asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const currentUserId = req.user!.sub;
    const access = await ensureProjectAccess(
      res,
      projectId,
      currentUserId,
      req.user!.role,
      'discussion',
      '只有课题成员可以标记消息已读'
    );
    if (!access) {
      return;
    }

    const updatedCount = await NotificationModel.markProjectMessagesAsRead(currentUserId, projectId);
    res.success({ updated_count: updatedCount });
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
      videoUrls ?? []
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

    const access = await ResearchModel.getProjectAccess(comment.project_id, currentUserId, req.user!.role);
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
    await ProfileModel.updateProjectSettings(id, req.body);
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
        await ProfileModel.updateApplicationStatus(applicationId, 'approved', userId);
        await ResearchModel.addProjectMember(id, userId, 'member');
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

    await ProfileModel.updateApplicationStatus(id, status, reviewerId, review_notes);

    // If approved, add to project members
    if (status === 'approved') {
      await ResearchModel.addProjectMember(application.project_id, application.user_id, 'member');
      logger.info(`User ${application.user_id} added to project ${application.project_id}`);
    }

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
        is_public: project.is_public,
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
      await ProfileModel.createProjectSettings(projectId, settings);
    } else {
      await ProfileModel.createProjectSettings(projectId, {});
    }

    const result = await ResearchModel.getProjectById(projectId);
    logger.info(`Project with profile created by user ${req.user!.username}: ${projectId}`);
    res.success(result, '项目创建成功', 201);
  });
}
