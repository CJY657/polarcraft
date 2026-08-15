/**
 * Research Meeting Model
 * 课题组会议与成员互评数据模型
 *
 * Meetings (例会排期 / AI 纪要归档) and intra-group member ratings (成员互评).
 * Kept out of research.model.ts, which is already oversized. Naming
 * deliberately avoids the bare "review(s)" wording reserved by the external
 * peer-review feature (组外同伴评审).
 */

import { getCollection, withDatabaseTransaction } from '../database/connection.js';
import { normalizeDocument, normalizeDocuments, pickDefined } from '../database/mongo.util.js';
import { generateId } from '../utils/crypto.util.js';
import { logger } from '../utils/logger.js';
import { ResearchModel } from './research.model.js';

const meetingsCollection = () => getCollection('research_project_meetings');
const meetingRatingsCollection = () => getCollection('research_meeting_member_ratings');

export type ResearchMeetingStatus = 'scheduled' | 'completed' | 'cancelled';

export interface ResearchMeetingRawFile {
  url: string;
  original_name: string;
  mime_type: string;
  size: number;
}

export interface ResearchMeetingAiScore {
  user_id: string;
  score: number; // 0–100
  comment: string; // ≤200 字
}

export interface ResearchMeetingMinutes {
  content: string; // 结构化纪要（markdown 文本）≤10000 字
  generated_by_ai: boolean;
  model: string | null;
  archived_at: Date;
  archived_by: string;
}

export interface ResearchMeetingDocument {
  id: string;
  project_id: string;
  title: string; // ≤100 字
  scheduled_at: Date;
  duration_minutes: number | null; // 5–600
  location: string | null; // ≤200 字，地点或线上链接
  agenda: string | null; // ≤2000 字
  status: ResearchMeetingStatus;
  created_by: string;
  // ―― 归档时写入 ――
  raw_notes: string | null; // 粘贴的原始文字记录 ≤20000 字（用户要求必须保存）
  raw_file: ResearchMeetingRawFile | null; // 上传的记录文件引用
  attendee_ids: string[]; // 实到成员（归档时勾选）
  ai_scores: ResearchMeetingAiScore[] | null;
  minutes: ResearchMeetingMinutes | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * List items omit the large text fields (raw_notes / minutes.content); the
 * full text is served by the single-meeting endpoint only.
 * 列表条目不含大字段（原始记录全文与纪要正文），全文走单会议详情端点。
 */
export type ResearchMeetingListItem = Omit<ResearchMeetingDocument, 'raw_notes' | 'minutes'> & {
  minutes: Omit<ResearchMeetingMinutes, 'content'> | null;
  has_minutes: boolean;
};

export interface CreateResearchMeetingInput {
  title: string;
  scheduled_at: Date;
  duration_minutes?: number | null;
  location?: string | null;
  agenda?: string | null;
}

export interface UpdateResearchMeetingInput {
  title?: string;
  scheduled_at?: Date;
  duration_minutes?: number | null;
  location?: string | null;
  agenda?: string | null;
  status?: ResearchMeetingStatus;
}

export interface ArchiveMeetingMinutesInput {
  content: string;
  generated_by_ai: boolean;
  model: string | null;
  archived_by: string;
  attendee_ids: string[];
  raw_notes: string | null;
  raw_file: ResearchMeetingRawFile | null;
  ai_scores: ResearchMeetingAiScore[] | null;
}

export interface MeetingMemberRatingDocument {
  id: string;
  project_id: string; // 冗余存储，供排行榜按课题聚合
  meeting_id: string;
  rater_id: string;
  ratee_id: string;
  score: number; // 整数 1–5
  comment: string | null; // ≤200 字
  created_at: Date;
  updated_at: Date;
}

export interface UpsertMeetingRatingInput {
  score: number;
  comment?: string | null;
}

/**
 * Tolerate legacy documents that predate later schema additions.
 * 读侧对缺字段的旧文档以 null/空数组容忍，保证读兼容。
 */
function normalizeMeetingSharedFields<T extends Record<string, any>>(meeting: T) {
  return {
    ...meeting,
    duration_minutes: meeting.duration_minutes ?? null,
    location: meeting.location ?? null,
    agenda: meeting.agenda ?? null,
    status: (meeting.status ?? 'scheduled') as ResearchMeetingStatus,
    raw_file: meeting.raw_file ?? null,
    attendee_ids: Array.isArray(meeting.attendee_ids) ? meeting.attendee_ids : [],
    ai_scores: Array.isArray(meeting.ai_scores) ? meeting.ai_scores : null,
  };
}

export class ResearchMeetingModel {
  // ============================================================
  // Meetings / 会议排期与纪要归档
  // ============================================================

  static async createMeeting(
    projectId: string,
    createdBy: string,
    data: CreateResearchMeetingInput
  ): Promise<string> {
    const now = new Date();
    const meetingId = generateId();

    await meetingsCollection().insertOne({
      id: meetingId,
      project_id: projectId,
      title: data.title,
      scheduled_at: data.scheduled_at,
      duration_minutes: data.duration_minutes ?? null,
      location: data.location ?? null,
      agenda: data.agenda ?? null,
      status: 'scheduled',
      created_by: createdBy,
      raw_notes: null,
      raw_file: null,
      attendee_ids: [],
      ai_scores: null,
      minutes: null,
      created_at: now,
      updated_at: now,
    });
    await ResearchModel.touchProjectActivity(projectId, now);

    logger.info(`Research meeting created: ${meetingId} in project ${projectId}`);
    return meetingId;
  }

  /**
   * Get one meeting with full text (raw notes + minutes content)
   * 获取单个会议全文（原始记录 + 纪要正文）
   */
  static async getMeetingById(
    projectId: string,
    meetingId: string
  ): Promise<ResearchMeetingDocument | null> {
    const meeting = normalizeDocument<Record<string, any>>(
      await meetingsCollection().findOne({ id: meetingId, project_id: projectId })
    );
    if (!meeting) {
      return null;
    }

    return {
      ...normalizeMeetingSharedFields(meeting),
      raw_notes: meeting.raw_notes ?? null,
      minutes: meeting.minutes ?? null,
    } as ResearchMeetingDocument;
  }

  /**
   * List meetings newest-first, excluding the large text fields but keeping
   * the raw-file metadata plus a has_minutes flag.
   * 会议列表（按开始时间倒序），投影排除大字段，保留记录文件元信息与 has_minutes 标志。
   */
  static async listProjectMeetings(projectId: string): Promise<ResearchMeetingListItem[]> {
    const meetings = normalizeDocuments<Record<string, any>>(
      await meetingsCollection()
        .find({ project_id: projectId })
        .sort({ scheduled_at: -1 })
        .project({ _id: 0, raw_notes: 0, 'minutes.content': 0 })
        .toArray()
    );

    return meetings.map((meeting) => {
      const { raw_notes: _rawNotes, minutes, ...rest } = meeting;
      const minutesMeta = minutes && typeof minutes === 'object'
        ? {
            generated_by_ai: Boolean(minutes.generated_by_ai),
            model: minutes.model ?? null,
            archived_at: minutes.archived_at,
            archived_by: minutes.archived_by,
          }
        : null;

      return {
        ...normalizeMeetingSharedFields(rest),
        minutes: minutesMeta,
        has_minutes: Boolean(minutesMeta),
      } as ResearchMeetingListItem;
    });
  }

  static async getProjectMeetingRawFileUrls(projectId: string): Promise<string[]> {
    const meetings = await meetingsCollection()
      .find({ project_id: projectId })
      .project({ _id: 0, 'raw_file.url': 1 })
      .toArray();

    return meetings
      .map((meeting) => (typeof meeting.raw_file?.url === 'string' ? meeting.raw_file.url.trim() : ''))
      .filter(Boolean);
  }

  static async deleteMeeting(
    projectId: string,
    meetingId: string
  ): Promise<{ rawFileUrl: string | null } | null> {
    const now = new Date();

    return withDatabaseTransaction(async (session) => {
      const deletedMeeting = normalizeDocument<{ raw_file?: { url?: unknown } }>(
        await meetingsCollection().findOneAndDelete(
          { id: meetingId, project_id: projectId },
          { projection: { _id: 0, 'raw_file.url': 1 }, session }
        )
      );

      if (!deletedMeeting) {
        return null;
      }

      await meetingRatingsCollection().deleteMany(
        { project_id: projectId, meeting_id: meetingId },
        { session }
      );
      await ResearchModel.touchProjectActivity(projectId, now, session);

      const rawFileUrl = typeof deletedMeeting.raw_file?.url === 'string'
        ? deletedMeeting.raw_file.url.trim() || null
        : null;
      logger.info(`Research meeting deleted: ${meetingId} in project ${projectId}`);
      return { rawFileUrl };
    });
  }

  static async updateMeeting(
    projectId: string,
    meetingId: string,
    data: UpdateResearchMeetingInput
  ): Promise<boolean> {
    const updateDoc = pickDefined({
      title: data.title,
      scheduled_at: data.scheduled_at,
      duration_minutes: data.duration_minutes,
      location: data.location,
      agenda: data.agenda,
      status: data.status,
    });

    if (Object.keys(updateDoc).length === 0) {
      return false;
    }

    const now = new Date();
    const result = await meetingsCollection().updateOne(
      { id: meetingId, project_id: projectId },
      { $set: { ...updateDoc, updated_at: now } }
    );

    if (result.matchedCount > 0) {
      await ResearchModel.touchProjectActivity(projectId, now);
    }

    logger.info(`Research meeting updated: ${meetingId}`);
    return result.matchedCount > 0;
  }

  /**
   * Archive the minutes in a single conditional update: minutes + raw record
   * (text/file) + attendees + AI scores land atomically and the status flips
   * to completed. Only a still-scheduled meeting can be archived.
   * 归档纪要：单次条件更新，纪要、原始记录、实到成员与 AI 分原子写入并置为
   * completed；仅 scheduled 状态的会议可归档（重复归档/已取消返回 conflict）。
   */
  static async archiveMeetingMinutes(
    projectId: string,
    meetingId: string,
    input: ArchiveMeetingMinutesInput
  ): Promise<'archived' | 'conflict' | 'not_found'> {
    const now = new Date();
    const result = await meetingsCollection().updateOne(
      { id: meetingId, project_id: projectId, status: 'scheduled' },
      {
        $set: {
          status: 'completed',
          raw_notes: input.raw_notes,
          raw_file: input.raw_file,
          attendee_ids: input.attendee_ids,
          ai_scores: input.ai_scores,
          minutes: {
            content: input.content,
            generated_by_ai: input.generated_by_ai,
            model: input.model,
            archived_at: now,
            archived_by: input.archived_by,
          },
          updated_at: now,
        },
      }
    );

    if (result.matchedCount > 0) {
      await ResearchModel.touchProjectActivity(projectId, now);
      logger.info(`Meeting minutes archived: ${meetingId} in project ${projectId}`);
      return 'archived';
    }

    const exists = await meetingsCollection().findOne({ id: meetingId, project_id: projectId });
    return exists ? 'conflict' : 'not_found';
  }

  // ============================================================
  // Member ratings / 成员互评
  // ============================================================

  /**
   * Create or update the rater's single rating of one attendee for one
   * meeting, keyed by the unique (meeting, rater, ratee) index.
   * 按（会议、评分人、被评人）唯一键 upsert，每人对每人每会议只保留一条互评。
   */
  static async upsertMeetingRating(
    projectId: string,
    meetingId: string,
    raterId: string,
    rateeId: string,
    data: UpsertMeetingRatingInput
  ): Promise<{ id: string; created: boolean }> {
    const now = new Date();
    const ratingId = generateId();
    const filter = { meeting_id: meetingId, rater_id: raterId, ratee_id: rateeId };
    const update = {
      $set: {
        project_id: projectId,
        score: data.score,
        comment: data.comment ?? null,
        updated_at: now,
      },
      $setOnInsert: {
        id: ratingId,
        created_at: now,
      },
    };

    let result;
    try {
      result = await meetingRatingsCollection().updateOne(filter, update, { upsert: true });
    } catch (error) {
      // 11000 = duplicate key: concurrent upsert on the same key — fold into an update.
      if ((error as { code?: number }).code !== 11000) {
        throw error;
      }
      result = await meetingRatingsCollection().updateOne(filter, update);
    }
    await ResearchModel.touchProjectActivity(projectId, now);

    if ((result.upsertedCount ?? 0) > 0) {
      logger.info(`Meeting rating submitted: ${ratingId} for meeting ${meetingId}`);
      return { id: ratingId, created: true };
    }

    const existing = normalizeDocument<MeetingMemberRatingDocument>(
      await meetingRatingsCollection().findOne(filter)
    );
    logger.info(`Meeting rating updated for meeting ${meetingId}`);
    return { id: existing?.id ?? ratingId, created: false };
  }

  static async getMeetingRatings(meetingId: string): Promise<MeetingMemberRatingDocument[]> {
    return normalizeDocuments<MeetingMemberRatingDocument>(
      await meetingRatingsCollection()
        .find({ meeting_id: meetingId })
        .sort({ created_at: 1 })
        .toArray()
    );
  }

  static async getProjectRatings(projectId: string): Promise<MeetingMemberRatingDocument[]> {
    return normalizeDocuments<MeetingMemberRatingDocument>(
      await meetingRatingsCollection().find({ project_id: projectId }).toArray()
    );
  }
}

// ============================================================
// Leaderboard / 排行榜（读时计算，不存聚合）
// ============================================================

export interface MeetingLeaderboardEntry {
  user_id: string;
  rank: number; // 同分并列名次
  composite: number; // 综合分，0–5
  ai_avg: number | null; // AI 分均值，已折算 5 分制
  peer_avg: number | null; // 互评均分，1–5
  rated_meetings: number; // 有评分数据（AI 分或收到互评）的会议数
}

export type LeaderboardMeetingInput = Pick<ResearchMeetingDocument, 'id' | 'status'> & {
  ai_scores?: ResearchMeetingAiScore[] | null;
};

export type LeaderboardRatingInput = Pick<
  MeetingMemberRatingDocument,
  'meeting_id' | 'rater_id' | 'ratee_id' | 'score'
>;

function meanOf(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * Compute the project performance leaderboard in memory.
 * 计算课题表现榜：每位成员的 AI 分均值折算 5 分制（÷20）与互评均分各占
 * 50%；只有一方数据时该方占 100%；无任何评分数据则不入榜；按综合分降序，
 * 同分并列名次。组内成员为个位数到十几人，两次查询 + 内存聚合足够；若单
 * 课题会议数破千再改 $group 管道。
 */
export function computeLeaderboard(
  meetings: LeaderboardMeetingInput[],
  ratings: LeaderboardRatingInput[],
  activeMemberIds: string[]
): MeetingLeaderboardEntry[] {
  const memberIds = new Set(activeMemberIds);
  const aiScoresByUser = new Map<string, number[]>();
  const peerScoresByUser = new Map<string, number[]>();
  const ratedMeetingsByUser = new Map<string, Set<string>>();

  const markRatedMeeting = (userId: string, meetingId: string): void => {
    const meetingIds = ratedMeetingsByUser.get(userId) ?? new Set<string>();
    meetingIds.add(meetingId);
    ratedMeetingsByUser.set(userId, meetingIds);
  };

  for (const meeting of meetings) {
    if (meeting.status !== 'completed') {
      continue;
    }
    for (const aiScore of meeting.ai_scores ?? []) {
      if (!memberIds.has(aiScore.user_id)) {
        continue;
      }
      if (typeof aiScore.score !== 'number' || !Number.isFinite(aiScore.score)) {
        continue;
      }
      const scores = aiScoresByUser.get(aiScore.user_id) ?? [];
      scores.push(aiScore.score);
      aiScoresByUser.set(aiScore.user_id, scores);
      markRatedMeeting(aiScore.user_id, meeting.id);
    }
  }

  for (const rating of ratings) {
    if (!memberIds.has(rating.ratee_id)) {
      continue;
    }
    // 防御：自评行不参与聚合（写入侧已禁止自评）
    if (rating.rater_id === rating.ratee_id) {
      continue;
    }
    if (typeof rating.score !== 'number' || !Number.isFinite(rating.score)) {
      continue;
    }
    const scores = peerScoresByUser.get(rating.ratee_id) ?? [];
    scores.push(rating.score);
    peerScoresByUser.set(rating.ratee_id, scores);
    markRatedMeeting(rating.ratee_id, rating.meeting_id);
  }

  const unranked: Array<Omit<MeetingLeaderboardEntry, 'rank'>> = [];
  for (const userId of memberIds) {
    const aiScores = aiScoresByUser.get(userId);
    const peerScores = peerScoresByUser.get(userId);
    // AI 分为 0–100，除以 20 折算 5 分制
    const aiAvg = aiScores && aiScores.length > 0 ? meanOf(aiScores) / 20 : null;
    const peerAvg = peerScores && peerScores.length > 0 ? meanOf(peerScores) : null;
    const composite = aiAvg !== null && peerAvg !== null
      ? (aiAvg + peerAvg) / 2
      : aiAvg ?? peerAvg;
    if (composite === null) {
      continue; // 无任何评分数据则不入榜
    }

    unranked.push({
      user_id: userId,
      composite,
      ai_avg: aiAvg,
      peer_avg: peerAvg,
      rated_meetings: ratedMeetingsByUser.get(userId)?.size ?? 0,
    });
  }

  unranked.sort((a, b) => b.composite - a.composite || a.user_id.localeCompare(b.user_id));

  const entries: MeetingLeaderboardEntry[] = [];
  for (let index = 0; index < unranked.length; index += 1) {
    const previous = entries[index - 1];
    const rank = previous && previous.composite === unranked[index].composite
      ? previous.rank
      : index + 1;
    entries.push({ ...unranked[index], rank });
  }

  return entries;
}
