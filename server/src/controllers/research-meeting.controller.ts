/**
 * Research Meeting Controller
 * 课题组会议与成员互评控制器
 *
 * Meeting scheduling, AI minutes generation/archiving, intra-group member
 * ratings (成员互评) and the performance leaderboard. Kept out of the
 * oversized research.controller.ts; naming deliberately avoids the bare
 * "review(s)" wording reserved by the external peer-review feature
 * (组外同伴评审).
 */

import { Request, Response } from 'express';
import { uploadConfig } from '../config/upload.config.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import {
  ResearchMeetingModel,
  computeLeaderboard,
  type MeetingLeaderboardEntry,
  type ResearchMeetingAiScore,
  type ResearchMeetingRawFile,
  type UpdateResearchMeetingInput,
} from '../models/research-meeting.model.js';
import { ResearchModel } from '../models/research.model.js';
import { NotificationModel } from '../models/notification.model.js';
import { getUserIdentityMap } from '../models/user-identity.util.js';
import { generateMeetingMinutes } from '../services/meeting-ai.service.js';
import {
  ResearchAgentDisabledError,
  ResearchAgentService,
  ResearchAgentUpstreamError,
} from '../services/research-agent.service.js';
import { logger } from '../utils/logger.js';
import { ensureProjectAccess } from './research.controller.js';

const MAX_MEETING_TITLE_LENGTH = 100;
const MAX_MEETING_AGENDA_LENGTH = 2000;
const MAX_MEETING_LOCATION_LENGTH = 200;
const MAX_MEETING_RAW_NOTES_LENGTH = 20000;
const MAX_MEETING_MINUTES_LENGTH = 10000;
const MAX_RATING_COMMENT_LENGTH = 200;
const MAX_MEETING_AI_COMMENT_LENGTH = 200;
const MIN_MEETING_DURATION_MINUTES = 5;
const MAX_MEETING_DURATION_MINUTES = 600;
const MAX_MEETING_RAW_FILE_NAME_LENGTH = 300;
const MAX_MEETING_RAW_FILE_MIME_LENGTH = 160;
const MEETING_LEADERBOARD_TOP_SIZE = 3;

const managedUploadUrlPrefix = uploadConfig.publicUrlPrefix.replace(/\/+$/, '');

/**
 * Duplicated from research.controller.ts (not exported there): only accept
 * URLs pointing into the managed upload tree.
 * 仅接受指向站内托管上传目录的地址。
 */
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

/**
 * null → null; string → trimmed (empty becomes null); anything else or an
 * over-long string → undefined (invalid).
 */
function normalizeNullableText(value: unknown, maxLength: number): string | null | undefined {
  if (value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    return undefined;
  }

  return trimmed || null;
}

function parseMeetingDate(value: unknown): Date | null {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return null;
  }

  if (typeof value === 'string' && !value.trim()) {
    return null;
  }

  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

const meetingTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function formatMeetingTime(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? meetingTimeFormatter.format(date) : '';
}

interface MeetingPayload {
  title?: string;
  scheduled_at?: Date;
  duration_minutes?: number | null;
  location?: string | null;
  agenda?: string | null;
  status?: 'cancelled';
}

function normalizeMeetingPayload(
  body: Record<string, unknown>,
  options: { partial?: boolean } = {}
): { data: MeetingPayload; error?: string } {
  const partial = options.partial === true;
  const data: MeetingPayload = {};

  if (body.title !== undefined || !partial) {
    if (
      typeof body.title !== 'string'
      || !body.title.trim()
      || body.title.trim().length > MAX_MEETING_TITLE_LENGTH
    ) {
      return { data, error: `会议主题为必填项，且不能超过 ${MAX_MEETING_TITLE_LENGTH} 字` };
    }
    data.title = body.title.trim();
  }

  if (body.scheduled_at !== undefined || !partial) {
    const scheduledAt = parseMeetingDate(body.scheduled_at);
    if (!scheduledAt) {
      return { data, error: '会议开始时间格式无效' };
    }
    data.scheduled_at = scheduledAt;
  }

  if (body.duration_minutes !== undefined) {
    if (body.duration_minutes === null) {
      data.duration_minutes = null;
    } else if (
      typeof body.duration_minutes !== 'number'
      || !Number.isInteger(body.duration_minutes)
      || body.duration_minutes < MIN_MEETING_DURATION_MINUTES
      || body.duration_minutes > MAX_MEETING_DURATION_MINUTES
    ) {
      return {
        data,
        error: `会议时长须为 ${MIN_MEETING_DURATION_MINUTES}–${MAX_MEETING_DURATION_MINUTES} 分钟的整数`,
      };
    } else {
      data.duration_minutes = body.duration_minutes;
    }
  }

  if (body.location !== undefined) {
    const location = normalizeNullableText(body.location, MAX_MEETING_LOCATION_LENGTH);
    if (location === undefined) {
      return { data, error: `地点或线上链接不能超过 ${MAX_MEETING_LOCATION_LENGTH} 字` };
    }
    data.location = location;
  }

  if (body.agenda !== undefined) {
    const agenda = normalizeNullableText(body.agenda, MAX_MEETING_AGENDA_LENGTH);
    if (agenda === undefined) {
      return { data, error: `议程不能超过 ${MAX_MEETING_AGENDA_LENGTH} 字` };
    }
    data.agenda = agenda;
  }

  if (partial && body.status !== undefined) {
    if (body.status !== 'cancelled') {
      return { data, error: '会议状态仅支持改为取消（cancelled）' };
    }
    data.status = 'cancelled';
  }

  return { data };
}

/**
 * Validate attendee ids: non-empty, unique, and a subset of the project's
 * active members. Returns null when invalid.
 * 实到成员名单校验：非空、去重、且均为课题活跃成员。
 */
function normalizeAttendeeIds(value: unknown, activeMemberIds: string[]): string[] | null {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }

  const memberSet = new Set(activeMemberIds);
  const seen = new Set<string>();
  const attendeeIds: string[] = [];

  for (const raw of value) {
    const id = typeof raw === 'string' ? raw.trim() : '';
    if (!id || seen.has(id) || !memberSet.has(id)) {
      return null;
    }
    seen.add(id);
    attendeeIds.push(id);
  }

  return attendeeIds;
}

/**
 * Wire shape of raw_file: metadata fields are nullable (read-compatibility
 * with whatever the client echoes back from the upload endpoint).
 */
interface NormalizedMeetingRawFile {
  url: string;
  original_name: string | null;
  mime_type: string | null;
  size: number | null;
}

function normalizeMeetingRawFile(
  value: unknown
): { rawFile: NormalizedMeetingRawFile | null; error?: string } {
  if (value === undefined || value === null) {
    return { rawFile: null };
  }

  if (typeof value !== 'object' || Array.isArray(value)) {
    return { rawFile: null, error: '会议记录文件信息格式无效' };
  }

  const input = value as Record<string, unknown>;
  const url = normalizeManagedUploadUrl(input.url);
  if (typeof url !== 'string' || url === managedUploadUrlPrefix) {
    return { rawFile: null, error: '会议记录文件地址无效' };
  }

  const originalName = normalizeNullableText(input.original_name, MAX_MEETING_RAW_FILE_NAME_LENGTH);
  if (originalName === undefined) {
    return { rawFile: null, error: '会议记录文件名过长' };
  }

  const mimeType = normalizeNullableText(input.mime_type, MAX_MEETING_RAW_FILE_MIME_LENGTH);
  if (mimeType === undefined) {
    return { rawFile: null, error: '会议记录文件类型过长' };
  }

  let size: number | null = null;
  if (input.size !== undefined && input.size !== null) {
    if (typeof input.size !== 'number' || !Number.isFinite(input.size) || input.size < 0) {
      return { rawFile: null, error: '会议记录文件大小格式无效' };
    }
    size = Math.floor(input.size);
  }

  return { rawFile: { url, original_name: originalName, mime_type: mimeType, size } };
}

/**
 * Validate the archived AI scores echoed back by the leader after preview:
 * attendee subset, integer 0–100, comment length. 空数组视为无 AI 分。
 */
function normalizeArchiveAiScores(
  value: unknown,
  attendeeIds: string[]
): { scores: ResearchMeetingAiScore[] | null; error?: string } {
  if (value === undefined || value === null) {
    return { scores: null };
  }

  if (!Array.isArray(value)) {
    return { scores: null, error: 'AI 评分数据格式无效' };
  }

  const attendeeSet = new Set(attendeeIds);
  const seen = new Set<string>();
  const scores: ResearchMeetingAiScore[] = [];

  for (const entry of value) {
    if (!entry || typeof entry !== 'object') {
      return { scores: null, error: 'AI 评分数据格式无效' };
    }

    const { user_id: userId, score, comment } = entry as Record<string, unknown>;

    if (typeof userId !== 'string' || !attendeeSet.has(userId) || seen.has(userId)) {
      return { scores: null, error: 'AI 评分只能针对实到成员，且不能重复' };
    }

    if (typeof score !== 'number' || !Number.isInteger(score) || score < 0 || score > 100) {
      return { scores: null, error: 'AI 评分须为 0–100 的整数' };
    }

    const normalizedComment = typeof comment === 'string' ? comment.trim() : '';
    if (normalizedComment.length > MAX_MEETING_AI_COMMENT_LENGTH) {
      return { scores: null, error: `AI 评语不能超过 ${MAX_MEETING_AI_COMMENT_LENGTH} 字` };
    }

    seen.add(userId);
    scores.push({ user_id: userId, score, comment: normalizedComment });
  }

  return { scores: scores.length > 0 ? scores : null };
}

/**
 * AI 分可见性：组长/管理员可见全部，普通成员仅见本人条目。
 */
function restrictAiScoresToViewer<T extends { ai_scores: ResearchMeetingAiScore[] | null }>(
  meeting: T,
  viewerId: string,
  canViewAll: boolean
): T {
  if (canViewAll || !Array.isArray(meeting.ai_scores)) {
    return meeting;
  }

  return {
    ...meeting,
    ai_scores: meeting.ai_scores.filter((score) => score.user_id === viewerId),
  };
}

/**
 * Notify every active member except the actor about a meeting event.
 * 会议事件通知：全体活跃成员（不含操作者），复用 system 类型与会议锚点。
 */
async function notifyProjectMeetingEvent(
  projectId: string,
  actorId: string,
  meetingId: string,
  notification: { title: string; content: string | null }
): Promise<void> {
  const recipients = (await ResearchModel.getActiveProjectMemberUserIds(projectId))
    .filter((userId) => userId !== actorId);

  await NotificationModel.createNotificationForUsers(recipients, {
    type: 'system',
    title: notification.title,
    content: notification.content,
    data: { project_id: projectId, meeting_id: meetingId },
    action_url: `/lab/projects/${projectId}#project-meetings`,
  });
}

export class ResearchMeetingController {
  // ============================================================
  // Meetings / 会议排期
  // ============================================================

  /**
   * List project meetings (newest first, large text fields omitted)
   * 获取会议列表（倒序，不含纪要正文与原始记录全文）
   */
  static getProjectMeetings = asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const access = await ensureProjectAccess(
      res,
      projectId,
      req.user!.sub,
      req.user!.role,
      'discussion',
      '只有课题成员可以查看会议'
    );
    if (!access) {
      return;
    }

    const meetings = await ResearchMeetingModel.listProjectMeetings(projectId);
    res.success(
      meetings.map((meeting) => restrictAiScoresToViewer(meeting, req.user!.sub, access.canManage))
    );
  });

  /**
   * Get single meeting with full minutes content and raw record
   * 获取会议详情（含纪要全文与原始记录）
   */
  static getProjectMeeting = asyncHandler(async (req: Request, res: Response) => {
    const { projectId, meetingId } = req.params;
    const access = await ensureProjectAccess(
      res,
      projectId,
      req.user!.sub,
      req.user!.role,
      'discussion',
      '只有课题成员可以查看会议'
    );
    if (!access) {
      return;
    }

    const meeting = await ResearchMeetingModel.getMeetingById(projectId, meetingId);
    if (!meeting) {
      return res.error('会议未找到', 'MEETING_NOT_FOUND', 404);
    }

    res.success(restrictAiScoresToViewer(meeting, req.user!.sub, access.canManage));
  });

  /**
   * Create meeting (owner/admin) and notify members
   * 创建会议（组长/管理员）并通知全体组员
   */
  static createProjectMeeting = asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const { data, error } = normalizeMeetingPayload(req.body ?? {});
    if (error) {
      return res.error(error, 'VALIDATION_ERROR', 400);
    }

    const access = await ensureProjectAccess(
      res,
      projectId,
      req.user!.sub,
      req.user!.role,
      'manage',
      '只有组长可以安排会议'
    );
    if (!access) {
      return;
    }

    const meetingId = await ResearchMeetingModel.createMeeting(projectId, req.user!.sub, {
      title: data.title!,
      scheduled_at: data.scheduled_at!,
      duration_minutes: data.duration_minutes ?? null,
      location: data.location ?? null,
      agenda: data.agenda ?? null,
    });

    await ResearchModel.logActivity(
      projectId,
      req.user!.sub,
      'meeting_scheduled',
      'project_meeting',
      meetingId,
      { title: data.title }
    );
    await notifyProjectMeetingEvent(projectId, req.user!.sub, meetingId, {
      title: '课题组安排了新的讨论会',
      content: `会议「${data.title}」将于 ${formatMeetingTime(data.scheduled_at!)} 开始`,
    });

    const meeting = await ResearchMeetingModel.getMeetingById(projectId, meetingId);
    logger.info(`Research meeting created by user ${req.user!.username}: ${meetingId}`);
    res.success(meeting, '会议已创建', 201);
  });

  /**
   * Update or cancel meeting (owner/admin); completed meetings are frozen
   * 编辑或取消会议（组长/管理员）；已完成归档的会议不可改期/取消
   */
  static updateProjectMeeting = asyncHandler(async (req: Request, res: Response) => {
    const { projectId, meetingId } = req.params;
    const { data, error } = normalizeMeetingPayload(req.body ?? {}, { partial: true });
    if (error) {
      return res.error(error, 'VALIDATION_ERROR', 400);
    }

    if (Object.keys(data).length === 0) {
      return res.error('没有需要更新的会议字段', 'VALIDATION_ERROR', 400);
    }

    const access = await ensureProjectAccess(
      res,
      projectId,
      req.user!.sub,
      req.user!.role,
      'manage',
      '只有组长可以编辑或取消会议'
    );
    if (!access) {
      return;
    }

    const meeting = await ResearchMeetingModel.getMeetingById(projectId, meetingId);
    if (!meeting) {
      return res.error('会议未找到', 'MEETING_NOT_FOUND', 404);
    }

    if (meeting.status === 'completed') {
      return res.error('会议已归档完成，不可再修改或取消', 'MEETING_ALREADY_ARCHIVED', 409);
    }

    await ResearchMeetingModel.updateMeeting(projectId, meetingId, data as UpdateResearchMeetingInput);

    const updated = await ResearchMeetingModel.getMeetingById(projectId, meetingId);
    if (!updated) {
      return res.error('会议未找到', 'MEETING_NOT_FOUND', 404);
    }

    const cancelled = data.status === 'cancelled';
    await notifyProjectMeetingEvent(projectId, req.user!.sub, meetingId, cancelled
      ? {
          title: '会议已取消',
          content: `会议「${updated.title}」（原定 ${formatMeetingTime(updated.scheduled_at)}）已取消`,
        }
      : {
          title: '会议信息有变更',
          content: `会议「${updated.title}」信息已更新，最新时间：${formatMeetingTime(updated.scheduled_at)}`,
        });

    logger.info(`Research meeting ${cancelled ? 'cancelled' : 'updated'} by user ${req.user!.username}: ${meetingId}`);
    res.success(updated, cancelled ? '会议已取消' : '会议已更新');
  });

  // ============================================================
  // Minutes / AI 纪要
  // ============================================================

  /**
   * Generate AI minutes preview (not persisted; leader archives explicitly)
   * AI 生成纪要预览（不落库，组长确认后归档时回传）
   */
  static generateMeetingMinutesPreview = asyncHandler(async (req: Request, res: Response) => {
    const { projectId, meetingId } = req.params;
    const rawNotes = typeof req.body?.raw_notes === 'string' ? req.body.raw_notes.trim() : '';

    if (!rawNotes) {
      return res.error('请粘贴会议文字记录', 'VALIDATION_ERROR', 400);
    }

    if (rawNotes.length > MAX_MEETING_RAW_NOTES_LENGTH) {
      return res.error(
        `会议文字记录不能超过 ${MAX_MEETING_RAW_NOTES_LENGTH} 字`,
        'VALIDATION_ERROR',
        400
      );
    }

    const access = await ensureProjectAccess(
      res,
      projectId,
      req.user!.sub,
      req.user!.role,
      'manage',
      '只有组长可以生成会议纪要'
    );
    if (!access) {
      return;
    }

    const meeting = await ResearchMeetingModel.getMeetingById(projectId, meetingId);
    if (!meeting) {
      return res.error('会议未找到', 'MEETING_NOT_FOUND', 404);
    }

    const activeMemberIds = await ResearchModel.getActiveProjectMemberUserIds(projectId);
    const attendeeIds = normalizeAttendeeIds(req.body?.attendee_ids, activeMemberIds);
    if (!attendeeIds) {
      return res.error('实到成员名单无效（须为课题活跃成员且不重复）', 'VALIDATION_ERROR', 400);
    }

    if (!ResearchAgentService.isEnabled()) {
      return res.error('AI 顾问尚未配置', 'AI_ADVISOR_DISABLED', 503);
    }

    const identityMap = await getUserIdentityMap(attendeeIds);
    const attendees = attendeeIds.map((id) => ({
      id,
      name: identityMap.get(id)?.username || '成员',
    }));

    try {
      const generated = await generateMeetingMinutes(rawNotes, attendees);
      logger.info(`Meeting minutes generated by user ${req.user!.username}: ${meetingId}`);
      res.success({ minutes_content: generated.minutes, ai_scores: generated.scores }, 'AI 纪要已生成');
    } catch (error) {
      if (error instanceof ResearchAgentDisabledError || error instanceof ResearchAgentUpstreamError) {
        return res.error(error.message, error.code, error.statusCode);
      }

      throw error;
    }
  });

  /**
   * Archive minutes: raw record (text/file) is required and saved with the
   * meeting; status flips to completed; members are notified to rate.
   * 归档纪要：原始记录（文本/文件）必须随会议保存；状态置为 completed 并通知互评。
   */
  static archiveMeetingMinutes = asyncHandler(async (req: Request, res: Response) => {
    const { projectId, meetingId } = req.params;
    const content = typeof req.body?.content === 'string' ? req.body.content.trim() : '';

    if (!content) {
      return res.error('请填写会议纪要内容', 'VALIDATION_ERROR', 400);
    }

    if (content.length > MAX_MEETING_MINUTES_LENGTH) {
      return res.error(
        `会议纪要不能超过 ${MAX_MEETING_MINUTES_LENGTH} 字`,
        'VALIDATION_ERROR',
        400
      );
    }

    const rawNotesValue = req.body?.raw_notes;
    let rawNotes: string | null = null;
    if (rawNotesValue !== undefined && rawNotesValue !== null) {
      if (typeof rawNotesValue !== 'string') {
        return res.error('会议文字记录格式无效', 'VALIDATION_ERROR', 400);
      }
      if (rawNotesValue.trim().length > MAX_MEETING_RAW_NOTES_LENGTH) {
        return res.error(
          `会议文字记录不能超过 ${MAX_MEETING_RAW_NOTES_LENGTH} 字`,
          'VALIDATION_ERROR',
          400
        );
      }
      rawNotes = rawNotesValue.trim() || null;
    }

    const { rawFile, error: rawFileError } = normalizeMeetingRawFile(req.body?.raw_file);
    if (rawFileError) {
      return res.error(rawFileError, 'VALIDATION_ERROR', 400);
    }

    // 用户提供的会议原始记录必须随会议保存：文本与文件至少其一。
    if (!rawNotes && !rawFile) {
      return res.error('请提供会议原始记录（粘贴文字或上传记录文件）', 'VALIDATION_ERROR', 400);
    }

    const access = await ensureProjectAccess(
      res,
      projectId,
      req.user!.sub,
      req.user!.role,
      'manage',
      '只有组长可以归档会议纪要'
    );
    if (!access) {
      return;
    }

    const meeting = await ResearchMeetingModel.getMeetingById(projectId, meetingId);
    if (!meeting) {
      return res.error('会议未找到', 'MEETING_NOT_FOUND', 404);
    }

    const activeMemberIds = await ResearchModel.getActiveProjectMemberUserIds(projectId);
    const attendeeIds = normalizeAttendeeIds(req.body?.attendee_ids, activeMemberIds);
    if (!attendeeIds) {
      return res.error('实到成员名单无效（须为课题活跃成员且不重复）', 'VALIDATION_ERROR', 400);
    }

    const { scores: aiScores, error: aiScoresError } = normalizeArchiveAiScores(
      req.body?.ai_scores,
      attendeeIds
    );
    if (aiScoresError) {
      return res.error(aiScoresError, 'VALIDATION_ERROR', 400);
    }

    const result = await ResearchMeetingModel.archiveMeetingMinutes(projectId, meetingId, {
      content,
      generated_by_ai: req.body?.generated_by_ai === true,
      // 预览/归档契约不回传模型名，归档纪要的 model 恒为 null。
      model: null,
      archived_by: req.user!.sub,
      attendee_ids: attendeeIds,
      raw_notes: rawNotes,
      // raw_file 元信息在线上契约中可空；文档读侧同样容忍，收窄断言仅为对齐模型类型。
      raw_file: rawFile as ResearchMeetingRawFile | null,
      ai_scores: aiScores,
    });

    if (result === 'not_found') {
      return res.error('会议未找到', 'MEETING_NOT_FOUND', 404);
    }

    if (result === 'conflict') {
      return res.error('该会议已归档或已取消', 'MEETING_ALREADY_ARCHIVED', 409);
    }

    await ResearchModel.logActivity(
      projectId,
      req.user!.sub,
      'meeting_minutes_archived',
      'project_meeting',
      meetingId,
      { title: meeting.title }
    );
    await notifyProjectMeetingEvent(projectId, req.user!.sub, meetingId, {
      title: '会议纪要已归档，快去互评',
      content: `会议「${meeting.title}」的纪要已归档，可查看纪要并完成成员互评`,
    });

    logger.info(`Meeting minutes archived by user ${req.user!.username}: ${meetingId}`);
    res.success(null, '会议纪要已归档');
  });

  // ============================================================
  // Member ratings / 成员互评
  // ============================================================

  /**
   * Create or update own rating of one attendee (anonymous to everyone)
   * 提交或更新自己对某位实到成员的互评（对所有人匿名，仅系统留存）
   */
  static upsertMyMeetingRating = asyncHandler(async (req: Request, res: Response) => {
    const { projectId, meetingId } = req.params;
    const raterId = req.user!.sub;
    const rateeId = typeof req.body?.ratee_id === 'string' ? req.body.ratee_id.trim() : '';

    if (!rateeId) {
      return res.error('请选择被评成员', 'VALIDATION_ERROR', 400);
    }

    if (rateeId === raterId) {
      return res.error('不能评价自己', 'VALIDATION_ERROR', 400);
    }

    const score = req.body?.score;
    if (typeof score !== 'number' || !Number.isInteger(score) || score < 1 || score > 5) {
      return res.error('互评分数须为 1–5 的整数', 'VALIDATION_ERROR', 400);
    }

    const comment = normalizeNullableText(req.body?.comment, MAX_RATING_COMMENT_LENGTH);
    if (comment === undefined) {
      return res.error(`互评短评不能超过 ${MAX_RATING_COMMENT_LENGTH} 字`, 'VALIDATION_ERROR', 400);
    }

    const access = await ensureProjectAccess(
      res,
      projectId,
      raterId,
      req.user!.role,
      'discussion',
      '只有课题成员可以互评'
    );
    if (!access) {
      return;
    }

    const meeting = await ResearchMeetingModel.getMeetingById(projectId, meetingId);
    if (!meeting) {
      return res.error('会议未找到', 'MEETING_NOT_FOUND', 404);
    }

    if (meeting.status !== 'completed') {
      return res.error('会议纪要归档后才能互评', 'MEETING_NOT_COMPLETED', 409);
    }

    const attendeeSet = new Set(meeting.attendee_ids);
    if (!attendeeSet.has(raterId)) {
      return res.error('只有该会议的实到成员可以互评', 'FORBIDDEN', 403);
    }

    if (!attendeeSet.has(rateeId)) {
      return res.error('只能评价该会议的实到成员', 'FORBIDDEN', 403);
    }

    const { created } = await ResearchMeetingModel.upsertMeetingRating(
      projectId,
      meetingId,
      raterId,
      rateeId,
      { score, comment }
    );

    // 互评匿名：不写活动日志、不发通知，避免泄露评分人身份。
    logger.info(`Meeting rating ${created ? 'submitted' : 'updated'} for meeting ${meetingId}`);
    res.success(null, created ? '互评已提交' : '互评已更新', created ? 201 : 200);
  });

  /**
   * Get ratings view: own submitted rows + anonymous aggregates + own
   * received anonymous comments
   * 获取互评视图：我提交的评分 + 匿名聚合 + 我收到的匿名短评
   */
  static getMeetingRatings = asyncHandler(async (req: Request, res: Response) => {
    const { projectId, meetingId } = req.params;
    const access = await ensureProjectAccess(
      res,
      projectId,
      req.user!.sub,
      req.user!.role,
      'discussion',
      '只有课题成员可以查看互评'
    );
    if (!access) {
      return;
    }

    const meeting = await ResearchMeetingModel.getMeetingById(projectId, meetingId);
    if (!meeting) {
      return res.error('会议未找到', 'MEETING_NOT_FOUND', 404);
    }

    const ratings = await ResearchMeetingModel.getMeetingRatings(meetingId);
    const viewerId = req.user!.sub;

    const aggregateMap = new Map<string, { total: number; count: number }>();
    for (const rating of ratings) {
      // 防御：自评行不参与聚合（写入侧已禁止自评）。
      if (rating.rater_id === rating.ratee_id) {
        continue;
      }
      if (typeof rating.score !== 'number' || !Number.isFinite(rating.score)) {
        continue;
      }
      const aggregate = aggregateMap.get(rating.ratee_id) ?? { total: 0, count: 0 };
      aggregate.total += rating.score;
      aggregate.count += 1;
      aggregateMap.set(rating.ratee_id, aggregate);
    }

    const aggregates = [...aggregateMap.entries()]
      .map(([rateeId, aggregate]) => ({
        ratee_id: rateeId,
        avg: aggregate.total / aggregate.count,
        count: aggregate.count,
      }))
      .sort((a, b) => a.ratee_id.localeCompare(b.ratee_id));

    // 匿名短评按文本排序，避免通过提交顺序反推评分人身份。
    const myReceivedComments = ratings
      .filter((rating) => (
        rating.ratee_id === viewerId
        && rating.rater_id !== viewerId
        && typeof rating.comment === 'string'
        && rating.comment.trim()
      ))
      .map((rating) => (rating.comment as string).trim())
      .sort((a, b) => a.localeCompare(b, 'zh-CN'));

    res.success({
      my_given: ratings.filter((rating) => rating.rater_id === viewerId),
      aggregates,
      my_received_comments: myReceivedComments,
    });
  });

  // ============================================================
  // Leaderboard / 表现榜
  // ============================================================

  /**
   * Project performance leaderboard: Top 3 + own standing; full list for
   * owner/admin only. Computed on read, nothing persisted.
   * 表现榜：Top 3 + 我的名次；完整榜单仅组长/管理员；读时计算不存聚合。
   */
  static getProjectLeaderboard = asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const access = await ensureProjectAccess(
      res,
      projectId,
      req.user!.sub,
      req.user!.role,
      'discussion',
      '只有课题成员可以查看表现榜'
    );
    if (!access) {
      return;
    }

    const [activeMemberIds, meetings, ratings] = await Promise.all([
      ResearchModel.getActiveProjectMemberUserIds(projectId),
      ResearchMeetingModel.listProjectMeetings(projectId),
      ResearchMeetingModel.getProjectRatings(projectId),
    ]);

    const standings = computeLeaderboard(meetings, ratings, activeMemberIds);
    const identityMap = await getUserIdentityMap(standings.map((entry) => entry.user_id));
    const enrich = (entry: MeetingLeaderboardEntry) => ({
      ...entry,
      username: identityMap.get(entry.user_id)?.username || '',
      nickname: identityMap.get(entry.user_id)?.nickname ?? null,
      real_name: identityMap.get(entry.user_id)?.real_name ?? null,
      show_real_name_publicly: identityMap.get(entry.user_id)?.show_real_name_publicly ?? false,
      avatar_url: identityMap.get(entry.user_id)?.avatar_url || null,
    });

    const myStanding = standings.find((entry) => entry.user_id === req.user!.sub) ?? null;

    res.success({
      top: standings.slice(0, MEETING_LEADERBOARD_TOP_SIZE).map(enrich),
      me: myStanding
        ? {
            rank: myStanding.rank,
            composite: myStanding.composite,
            ai_avg: myStanding.ai_avg,
            peer_avg: myStanding.peer_avg,
            rated_meetings: myStanding.rated_meetings,
          }
        : null,
      ...(access.canManage ? { all: standings.map(enrich) } : {}),
    });
  });
}
