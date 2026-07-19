/**
 * Research Model
 * 虚拟课题组数据模型
 */

import { getCollection } from '../database/connection.js';
import { normalizeDocument, normalizeDocuments, normalizeImageUrls, pickDefined } from '../database/mongo.util.js';
import { generateId } from '../utils/crypto.util.js';
import { logger } from '../utils/logger.js';
import {
  buildActiveMembershipFilter,
  buildInactiveMembershipFilter,
  compareMembersByRoleThenJoinedAt,
  isMembershipActive,
} from './research-membership.util.js';
import { getProjectCoverImageMap } from './research-cover.util.js';
import {
  decorateResearchProject,
  type ProjectStatus,
} from './research-project.util.js';
import { getUserIdentityMap } from './user-identity.util.js';
import type {
  ResearchProjectReviewVerdict,
  ResearchProjectTaskStatus,
} from '../types/research-cycle.types.js';

const researchProjectsCollection = () => getCollection('research_projects');
const projectMembersCollection = () => getCollection('research_project_members');
const canvasesCollection = () => getCollection('research_canvases');
const nodesCollection = () => getCollection('research_nodes');
const edgesCollection = () => getCollection('research_edges');
const commentsCollection = () => getCollection('research_node_comments');
const projectCommentsCollection = () => getCollection('research_project_comments');
const agentMessagesCollection = () => getCollection('research_ai_messages');
const activityLogCollection = () => getCollection('research_activity_log');
const projectSettingsCollection = () => getCollection('research_project_settings');
const creatorProfilesCollection = () => getCollection('research_project_creator_profiles');
const applicationsCollection = () => getCollection('research_project_applications');
const evidenceCollection = () => getCollection('research_project_evidence');
const projectCyclesCollection = () => getCollection('research_project_cycles');
const projectChartersCollection = () => getCollection('research_project_charters');
const projectTasksCollection = () => getCollection('research_project_tasks');
const projectReviewsCollection = () => getCollection('research_project_reviews');
const projectOutcomesCollection = () => getCollection('research_project_outcomes');

function normalizeVideoUrls(value: unknown): string[] {
  return normalizeImageUrls(value);
}

function compareByRemovedAtDesc(
  a: { removed_at?: Date | string | null },
  b: { removed_at?: Date | string | null }
): number {
  const removedAtA = a.removed_at ? new Date(a.removed_at).getTime() : 0;
  const removedAtB = b.removed_at ? new Date(b.removed_at).getTime() : 0;
  return removedAtB - removedAtA;
}

type LegacyFormerMemberSource = {
  user_id: string;
  role?: string | null;
  joined_at?: Date | string | null;
  removed_at?: Date | string | null;
};

export type ResearchProjectRole = 'owner' | 'member';
export type ResearchProjectEvidenceType =
  | 'image_observation'
  | 'data_table'
  | 'source_literature'
  | 'experiment_log'
  | 'code_prototype'
  | 'failure_record'
  | 'other';

export interface ResearchProjectEvidenceInput {
  title: string;
  evidence_type: ResearchProjectEvidenceType;
  description?: string | null;
  external_url?: string | null;
  attachment_url?: string | null;
  attachment_original_name?: string | null;
  attachment_size?: number | null;
  attachment_mime_type?: string | null;
  attachment_category?: string | null;
  attachment_note?: string | null;
}

export interface ResearchProjectReviewInput {
  verdict: ResearchProjectReviewVerdict;
  content: string;
}

export interface CreateResearchProjectTaskInput {
  title: string;
  assignee_user_id?: string | null;
  due_date?: string | null;
}

export interface UpdateResearchProjectTaskInput {
  title?: string;
  assignee_user_id?: string | null;
  status?: ResearchProjectTaskStatus;
  due_date?: string | null;
}

export interface ResearchProjectAccess {
  project: any | null;
  membership: any | null;
  role: ResearchProjectRole | null;
  isAdmin: boolean;
  isMember: boolean;
  canRead: boolean;
  canWrite: boolean;
  canManage: boolean;
  canAccessDiscussion: boolean;
  canModerate: boolean;
}

export interface ResearchDiscussionDigestItem {
  username: string;
  content: string;
  image_count: number;
  video_count: number;
  created_at: Date;
}

function coerceProjectRole(role: unknown): ResearchProjectRole {
  return role === 'owner' ? 'owner' : 'member';
}

function normalizeMemberRoleLabel(value?: string | null): string | null {
  const label = typeof value === 'string' ? value.trim() : '';
  return label || null;
}

function normalizeMembershipRecord<T extends { role?: unknown }>(member: T): T & { role: ResearchProjectRole } {
  return {
    ...member,
    role: coerceProjectRole(member.role),
  };
}

function pickLatestDate(...values: Array<Date | string | null | undefined>): Date | null {
  const timestamps = values
    .map((value) => {
      if (!value) return null;
      const date = value instanceof Date ? value : new Date(value);
      const timestamp = date.getTime();
      return Number.isNaN(timestamp) ? null : timestamp;
    })
    .filter((value): value is number => value !== null);

  if (timestamps.length === 0) {
    return null;
  }

  return new Date(Math.max(...timestamps));
}

export class ResearchModel {
  /**
   * Get projects by user ID
   * 获取用户的项目列表
   */
  static async getUserProjects(userId: string, userRole: 'user' | 'admin' = 'user'): Promise<any[]> {
    const memberships = normalizeDocuments<{ project_id: string; role?: string | null }>(
      await projectMembersCollection()
        .find(buildActiveMembershipFilter({ user_id: userId }))
        .project({ _id: 0, project_id: 1, role: 1 })
        .toArray()
    );
    const memberProjectIds = memberships.map((membership) => membership.project_id);

    if (userRole !== 'admin' && memberProjectIds.length === 0) {
      return [];
    }

    const projectFilter = userRole === 'admin'
      ? {}
      : { id: { $in: memberProjectIds } };

    const projects = normalizeDocuments<any>(
      await researchProjectsCollection().find(projectFilter).sort({ updated_at: -1 }).toArray()
    );
    if (projects.length === 0) {
      return [];
    }

    const projectIds = projects.map((project) => project.id);
    const [members, canvases, coverMap] = await Promise.all([
      normalizeDocuments<{ project_id: string; user_id: string }>(
        await projectMembersCollection().find(buildActiveMembershipFilter({ project_id: { $in: projectIds } })).toArray()
      ),
      normalizeDocuments<{ id: string; project_id: string }>(
        await canvasesCollection().find({ project_id: { $in: projectIds } }).toArray()
      ),
      getProjectCoverImageMap(projectIds),
    ]);

    const memberCountMap = new Map<string, number>();
    const canvasCountMap = new Map<string, number>();
    const currentUserRoleMap = new Map<string, ResearchProjectRole>();

    for (const member of members) {
      memberCountMap.set(member.project_id, (memberCountMap.get(member.project_id) ?? 0) + 1);
    }

    for (const membership of memberships) {
      currentUserRoleMap.set(membership.project_id, coerceProjectRole(membership.role));
    }

    for (const canvas of canvases) {
      canvasCountMap.set(canvas.project_id, (canvasCountMap.get(canvas.project_id) ?? 0) + 1);
    }

    return projects.map((project) => decorateResearchProject({
      ...project,
      cover_image: coverMap.get(project.id) ?? null,
      member_count: memberCountMap.get(project.id) ?? 0,
      canvas_count: canvasCountMap.get(project.id) ?? 0,
      current_user_role: currentUserRoleMap.get(project.id) ?? null,
    }));
  }

  /**
   * Get project by ID
   * 获取项目详情
   */
  static async getProjectById(projectId: string): Promise<any | null> {
    const project = normalizeDocument<any>(
      await researchProjectsCollection().findOne({ id: projectId })
    );

    if (!project) {
      return null;
    }

    const [memberCount, canvasCount, settings] = await Promise.all([
      projectMembersCollection().countDocuments(buildActiveMembershipFilter({ project_id: projectId })),
      canvasesCollection().countDocuments({ project_id: projectId }),
      projectSettingsCollection().findOne({ project_id: projectId }),
    ]);

    return decorateResearchProject({
      ...project,
      visibility: settings?.visibility ?? 'private',
      member_count: memberCount,
      canvas_count: canvasCount,
    });
  }

  static async getProjectDiscussionAccess(
    projectId: string,
    userId: string,
    userRole?: 'user' | 'admin'
  ): Promise<{ project: any | null; isMember: boolean; canParticipate: boolean }> {
    const access = await this.getProjectAccess(projectId, userId, userRole);
    return {
      project: access.project,
      isMember: access.isMember,
      canParticipate: access.canAccessDiscussion,
    };
  }

  static async getProjectAccess(
    projectId: string,
    userId?: string,
    userRole: 'user' | 'admin' = 'user'
  ): Promise<ResearchProjectAccess> {
    const project = await this.getProjectById(projectId);
    if (!project) {
      return {
        project: null,
        membership: null,
        role: null,
        isAdmin: false,
        isMember: false,
        canRead: false,
        canWrite: false,
        canManage: false,
        canAccessDiscussion: false,
        canModerate: false,
      };
    }

    const membership = userId
      ? normalizeDocument<any>(
          await projectMembersCollection().findOne(buildActiveMembershipFilter({ project_id: projectId, user_id: userId }))
        )
      : null;
    const normalizedMembership = membership ? normalizeMembershipRecord(membership) : null;
    const role = normalizedMembership?.role ?? null;
    const isMember = Boolean(normalizedMembership);
    const isAdmin = userRole === 'admin';

    return {
      project,
      membership: normalizedMembership,
      role,
      isAdmin,
      isMember,
      canRead: isAdmin || isMember || project.visibility === 'public',
      canWrite: isAdmin || isMember,
      canManage: isAdmin || role === 'owner',
      canAccessDiscussion: isAdmin || isMember,
      canModerate: isAdmin || role === 'owner',
    };
  }

  /**
   * Create project
   * 创建项目
   */
  static async createProject(data: any, ownerId: string): Promise<string> {
    const now = new Date();
    const projectId = generateId();

    await researchProjectsCollection().insertOne({
      id: projectId,
      name_zh: data.name_zh,
      name_en: data.name_en || null,
      description_zh: data.description_zh || null,
      description_en: data.description_en || null,
      research_questions_zh: data.research_questions_zh || null,
      research_hypotheses_zh: data.research_hypotheses_zh || null,
      basic_plan_zh: data.basic_plan_zh || null,
      extended_plan_zh: data.extended_plan_zh || null,
      challenge_value_zh: data.challenge_value_zh || null,
      challenge_objectives_zh: data.challenge_objectives_zh || null,
      challenge_beginner_steps_zh: data.challenge_beginner_steps_zh || null,
      challenge_min_deliverables_zh: data.challenge_min_deliverables_zh || null,
      challenge_review_criteria_zh: data.challenge_review_criteria_zh || null,
      challenge_timeline_zh: data.challenge_timeline_zh || null,
      challenge_difficulty: data.challenge_difficulty || null,
      challenge_roles_zh: data.challenge_roles_zh || null,
      challenge_missing_roles_zh: data.challenge_missing_roles_zh || null,
      challenge_progress_zh: data.challenge_progress_zh || null,
      thumbnail: data.thumbnail || null,
      status: 'draft',
      is_public: data.is_public === true,
      allow_guest_comments: data.allow_guest_comments || false,
      enable_task_board: data.enable_task_board !== undefined ? data.enable_task_board : true,
      default_canvas_id: data.default_canvas_id || null,
      created_at: now,
      updated_at: now,
      last_activity_at: now,
    });

    await projectCyclesCollection().insertOne({
      id: generateId(),
      project_id: projectId,
      cycle_number: 1,
      created_at: now,
      updated_at: now,
    });

    await this.addProjectMember(projectId, ownerId, 'owner');
    await this.createCanvas(projectId, {
      name_zh: '主画布',
      name_en: 'Main Canvas',
    });

    logger.info(`Project created: ${projectId}`);
    return projectId;
  }

  /**
   * Update project
   * 更新项目
   */
  static async updateProject(
    projectId: string,
    data: any,
    expectedStatus?: ProjectStatus
  ): Promise<'updated' | 'not_found' | 'conflict'> {
    const updateDoc: Record<string, unknown> = pickDefined({
      name_zh: data.name_zh,
      name_en: data.name_en,
      description_zh: data.description_zh,
      description_en: data.description_en,
      research_questions_zh: data.research_questions_zh,
      research_hypotheses_zh: data.research_hypotheses_zh,
      basic_plan_zh: data.basic_plan_zh,
      extended_plan_zh: data.extended_plan_zh,
      challenge_value_zh: data.challenge_value_zh,
      challenge_objectives_zh: data.challenge_objectives_zh,
      challenge_beginner_steps_zh: data.challenge_beginner_steps_zh,
      challenge_min_deliverables_zh: data.challenge_min_deliverables_zh,
      challenge_review_criteria_zh: data.challenge_review_criteria_zh,
      challenge_timeline_zh: data.challenge_timeline_zh,
      challenge_difficulty: data.challenge_difficulty,
      challenge_roles_zh: data.challenge_roles_zh,
      challenge_missing_roles_zh: data.challenge_missing_roles_zh,
      challenge_progress_zh: data.challenge_progress_zh,
      thumbnail: data.thumbnail,
      is_public: data.is_public,
      allow_guest_comments: data.allow_guest_comments,
      enable_task_board: data.enable_task_board,
      default_canvas_id: data.default_canvas_id,
    });

    if (data.status !== undefined) {
      updateDoc.status = data.status;
    }
    if (Object.keys(updateDoc).length === 0) {
      return 'not_found';
    }

    const now = new Date();
    const result = await researchProjectsCollection().updateOne(
      expectedStatus === undefined ? { id: projectId } : { id: projectId, status: expectedStatus },
      { $set: { ...updateDoc, updated_at: now, last_activity_at: now } }
    );

    logger.info(`Project updated: ${projectId}`);
    if (result.matchedCount > 0) {
      return 'updated';
    }

    return await researchProjectsCollection().findOne({ id: projectId }) ? 'conflict' : 'not_found';
  }

  static async touchProjectActivity(projectId: string, at: Date = new Date()): Promise<void> {
    await researchProjectsCollection().updateOne(
      { id: projectId },
      { $set: { last_activity_at: at } }
    );
  }

  static async setLegacyProjectVisibility(projectId: string, isPublic: boolean): Promise<boolean> {
    const now = new Date();
    const result = await researchProjectsCollection().updateOne(
      { id: projectId },
      { $set: { is_public: isPublic, updated_at: now, last_activity_at: now } }
    );
    return result.matchedCount > 0;
  }

  static async getCurrentProjectCycle(projectId: string): Promise<any | null> {
    return normalizeDocument<any>(
      await projectCyclesCollection().findOne({ project_id: projectId }, { sort: { cycle_number: -1 } })
    );
  }

  static async cycleBelongsToProject(projectId: string, cycleId: string): Promise<boolean> {
    return Boolean(await projectCyclesCollection().findOne({ id: cycleId, project_id: projectId }));
  }

  /**
   * Get the current cycle, lazily creating cycle 1 for legacy projects that
   * were created before cycles existed. No migration needed.
   * 获取当前研究周期；旧课题缺少周期记录时惰性补建第 1 周期，无需迁移。
   */
  static async ensureCurrentProjectCycle(projectId: string): Promise<any> {
    const existing = await this.getCurrentProjectCycle(projectId);
    if (existing) {
      return existing;
    }

    const now = new Date();
    const cycle = {
      id: generateId(),
      project_id: projectId,
      cycle_number: 1,
      created_at: now,
      updated_at: now,
    };

    try {
      await projectCyclesCollection().insertOne({ ...cycle });
    } catch (error) {
      // 11000 = duplicate key: a concurrent request already created cycle 1.
      if ((error as { code?: number }).code !== 11000) {
        throw error;
      }
      return (await this.getCurrentProjectCycle(projectId)) ?? cycle;
    }

    logger.info(`Project cycle 1 backfilled for legacy project: ${projectId}`);
    return cycle;
  }

  // ============================================================
  // Peer reviews / 同伴评审
  // ============================================================

  private static async enrichProjectReviews(reviews: any[]): Promise<any[]> {
    if (reviews.length === 0) {
      return [];
    }

    const userMap = await getUserIdentityMap(reviews.map((review) => review.reviewer_id));

    return reviews.map((review) => ({
      ...review,
      reviewer_username: userMap.get(review.reviewer_id)?.username || '',
      reviewer_nickname: userMap.get(review.reviewer_id)?.nickname ?? null,
      reviewer_real_name: userMap.get(review.reviewer_id)?.real_name ?? null,
      reviewer_show_real_name_publicly: userMap.get(review.reviewer_id)?.show_real_name_publicly ?? false,
      reviewer_avatar_url: userMap.get(review.reviewer_id)?.avatar_url || null,
    }));
  }

  /**
   * Get current-cycle peer reviews (newest first, enriched with reviewer identity)
   * 获取当前周期的同伴评审（按时间倒序，附评审者身份）
   */
  static async getProjectReviews(projectId: string): Promise<any[]> {
    const cycle = await this.ensureCurrentProjectCycle(projectId);
    const reviews = normalizeDocuments<any>(
      await projectReviewsCollection()
        .find({ project_id: projectId, cycle_id: cycle.id })
        .sort({ updated_at: -1 })
        .toArray()
    );

    return this.enrichProjectReviews(reviews);
  }

  static async getProjectReviewById(reviewId: string): Promise<any | null> {
    return normalizeDocument<any>(await projectReviewsCollection().findOne({ id: reviewId }));
  }

  /**
   * Create or update the reviewer's single review for this cycle. One document
   * per (project, cycle, reviewer) keeps the collection bounded.
   * 创建或更新评审者在本周期内的唯一评审，按（课题、周期、评审者）去重，集合不会膨胀。
   */
  static async upsertProjectReview(
    projectId: string,
    cycleId: string,
    reviewerId: string,
    data: ResearchProjectReviewInput
  ): Promise<{ id: string; created: boolean }> {
    const now = new Date();
    const filter = { project_id: projectId, cycle_id: cycleId, reviewer_id: reviewerId };
    const existing = normalizeDocument<any>(await projectReviewsCollection().findOne(filter));

    if (existing) {
      await projectReviewsCollection().updateOne(
        { id: existing.id },
        { $set: { verdict: data.verdict, content: data.content, updated_at: now } }
      );
      await this.touchProjectActivity(projectId, now);
      logger.info(`Project review updated: ${existing.id} in project ${projectId}`);
      return { id: existing.id, created: false };
    }

    const reviewId = generateId();
    try {
      await projectReviewsCollection().insertOne({
        id: reviewId,
        project_id: projectId,
        cycle_id: cycleId,
        reviewer_id: reviewerId,
        verdict: data.verdict,
        content: data.content,
        created_at: now,
        updated_at: now,
      });
    } catch (error) {
      // 11000 = duplicate key: concurrent submit by the same reviewer — fold into an update.
      if ((error as { code?: number }).code !== 11000) {
        throw error;
      }
      await projectReviewsCollection().updateOne(
        filter,
        { $set: { verdict: data.verdict, content: data.content, updated_at: now } }
      );
      const current = normalizeDocument<any>(await projectReviewsCollection().findOne(filter));
      return { id: current?.id ?? reviewId, created: false };
    }

    await this.touchProjectActivity(projectId, now);
    logger.info(`Project review submitted: ${reviewId} in project ${projectId}`);
    return { id: reviewId, created: true };
  }

  static async deleteProjectReview(reviewId: string): Promise<boolean> {
    const result = await projectReviewsCollection().deleteOne({ id: reviewId });
    logger.info(`Project review deleted: ${reviewId}`);
    return result.deletedCount > 0;
  }

  static async countProjectReviews(projectId: string, cycleId: string): Promise<number> {
    return projectReviewsCollection().countDocuments({ project_id: projectId, cycle_id: cycleId });
  }

  // ============================================================
  // Project tasks / 任务分工
  // ============================================================

  private static async enrichProjectTasks(tasks: any[]): Promise<any[]> {
    if (tasks.length === 0) {
      return [];
    }

    const userMap = await getUserIdentityMap(
      tasks.flatMap((task) => [task.assignee_user_id, task.created_by]).filter(Boolean)
    );

    return tasks.map((task) => {
      const assignee = task.assignee_user_id ? userMap.get(task.assignee_user_id) : undefined;
      return {
        ...task,
        assignee_username: assignee?.username || '',
        assignee_nickname: assignee?.nickname ?? null,
        assignee_real_name: assignee?.real_name ?? null,
        assignee_show_real_name_publicly: assignee?.show_real_name_publicly ?? false,
        assignee_avatar_url: assignee?.avatar_url || null,
      };
    });
  }

  /**
   * Get current-cycle tasks (oldest first, enriched with assignee identity)
   * 获取当前周期的任务（按创建时间正序，附负责人身份）
   */
  static async getProjectTasks(projectId: string): Promise<any[]> {
    const cycle = await this.ensureCurrentProjectCycle(projectId);
    const tasks = normalizeDocuments<any>(
      await projectTasksCollection()
        .find({ project_id: projectId, cycle_id: cycle.id })
        .sort({ created_at: 1 })
        .toArray()
    );

    return this.enrichProjectTasks(tasks);
  }

  static async getProjectTaskById(taskId: string): Promise<any | null> {
    return normalizeDocument<any>(await projectTasksCollection().findOne({ id: taskId }));
  }

  static async createProjectTask(
    projectId: string,
    cycleId: string,
    createdBy: string,
    data: CreateResearchProjectTaskInput
  ): Promise<string> {
    const now = new Date();
    const taskId = generateId();

    await projectTasksCollection().insertOne({
      id: taskId,
      project_id: projectId,
      cycle_id: cycleId,
      title: data.title,
      assignee_user_id: data.assignee_user_id ?? null,
      status: 'todo',
      due_date: data.due_date ?? null,
      created_by: createdBy,
      completed_at: null,
      created_at: now,
      updated_at: now,
    });
    await this.touchProjectActivity(projectId, now);

    logger.info(`Project task created: ${taskId} in project ${projectId}`);
    return taskId;
  }

  static async updateProjectTask(taskId: string, data: UpdateResearchProjectTaskInput): Promise<boolean> {
    const task = await this.getProjectTaskById(taskId);
    if (!task) {
      return false;
    }

    const updateDoc: Record<string, unknown> = pickDefined({
      title: data.title,
      assignee_user_id: data.assignee_user_id,
      status: data.status,
      due_date: data.due_date,
    });

    if (Object.keys(updateDoc).length === 0) {
      return false;
    }

    // completed_at only moves on an actual status transition, not on repeated saves.
    if (data.status !== undefined && data.status !== task.status) {
      updateDoc.completed_at = data.status === 'done' ? new Date() : null;
    }

    const result = await projectTasksCollection().updateOne(
      { id: taskId },
      { $set: { ...updateDoc, updated_at: new Date() } }
    );

    if (result.matchedCount > 0) {
      await this.touchProjectActivity(task.project_id);
    }

    logger.info(`Project task updated: ${taskId}`);
    return result.matchedCount > 0;
  }

  static async deleteProjectTask(taskId: string): Promise<boolean> {
    const task = await this.getProjectTaskById(taskId);
    const result = await projectTasksCollection().deleteOne({ id: taskId });
    if (result.deletedCount > 0 && task?.project_id) {
      await this.touchProjectActivity(task.project_id);
    }
    logger.info(`Project task deleted: ${taskId}`);
    return result.deletedCount > 0;
  }

  /**
   * Delete project
   * 删除项目
   */
  static async deleteProject(projectId: string): Promise<boolean> {
    const canvases = normalizeDocuments<{ id: string }>(
      await canvasesCollection().find({ project_id: projectId }).project({ _id: 0, id: 1 }).toArray()
    );
    const canvasIds = canvases.map((canvas) => canvas.id);
    const nodes = canvasIds.length > 0
      ? normalizeDocuments<{ id: string }>(
          await nodesCollection()
            .find({ canvas_id: { $in: canvasIds } })
            .project({ _id: 0, id: 1 })
            .toArray()
        )
      : [];
    const nodeIds = nodes.map((node) => node.id);

    const result = await researchProjectsCollection().deleteOne({ id: projectId });
    if (result.deletedCount === 0) {
      return false;
    }

    await Promise.all([
      projectMembersCollection().deleteMany({ project_id: projectId }),
      canvasesCollection().deleteMany({ project_id: projectId }),
      edgesCollection().deleteMany(canvasIds.length > 0 ? { canvas_id: { $in: canvasIds } } : { canvas_id: '__none__' }),
      nodesCollection().deleteMany(canvasIds.length > 0 ? { canvas_id: { $in: canvasIds } } : { canvas_id: '__none__' }),
      commentsCollection().deleteMany(nodeIds.length > 0 ? { node_id: { $in: nodeIds } } : { node_id: '__none__' }),
      projectCommentsCollection().deleteMany({ project_id: projectId }),
      evidenceCollection().deleteMany({ project_id: projectId }),
      projectCyclesCollection().deleteMany({ project_id: projectId }),
      projectChartersCollection().deleteMany({ project_id: projectId }),
      projectTasksCollection().deleteMany({ project_id: projectId }),
      projectReviewsCollection().deleteMany({ project_id: projectId }),
      projectOutcomesCollection().deleteMany({ project_id: projectId }),
      agentMessagesCollection().deleteMany({ project_id: projectId }),
      activityLogCollection().deleteMany({ project_id: projectId }),
      projectSettingsCollection().deleteMany({ project_id: projectId }),
      creatorProfilesCollection().deleteMany({ project_id: projectId }),
      applicationsCollection().deleteMany({ project_id: projectId }),
    ]);

    logger.info(`Project deleted: ${projectId}`);
    return true;
  }

  /**
   * Add project member
   * 添加项目成员
   */
  static async addProjectMember(
    projectId: string,
    userId: string,
    role: string = 'member',
    memberRoleLabel?: string | null
  ): Promise<boolean> {
    const now = new Date();
    const normalizedRole = coerceProjectRole(role);
    const normalizedMemberRoleLabel = normalizeMemberRoleLabel(memberRoleLabel);
    const existing = normalizeDocument<any>(
      await projectMembersCollection().findOne({ project_id: projectId, user_id: userId })
    );

    if (existing) {
      const updateDoc: Record<string, unknown> = {
        role: normalizedRole,
        active: true,
        removed_at: null,
      };

      if (!isMembershipActive(existing)) {
        updateDoc.joined_at = now;
      }

      if (memberRoleLabel !== undefined) {
        updateDoc.member_role_label = normalizedMemberRoleLabel;
      }

      await projectMembersCollection().updateOne(
        { project_id: projectId, user_id: userId },
        { $set: updateDoc }
      );
    } else {
      await projectMembersCollection().insertOne({
        id: generateId(),
        project_id: projectId,
        user_id: userId,
        role: normalizedRole,
        member_role_label: normalizedMemberRoleLabel,
        active: true,
        removed_at: null,
        joined_at: now,
      });
    }

    await this.touchProjectActivity(projectId, now);

    logger.info(`Member added to project: ${projectId} - ${userId} as ${normalizedRole}`);
    return true;
  }

  /**
   * Remove project member
   * 移除项目成员
   */
  static async removeProjectMember(projectId: string, userId: string): Promise<boolean> {
    const result = await projectMembersCollection().updateOne(
      buildActiveMembershipFilter({ project_id: projectId, user_id: userId }),
      {
        $set: {
          active: false,
          removed_at: new Date(),
        },
      }
    );
    if (result.matchedCount > 0) {
      await this.touchProjectActivity(projectId);
    }
    logger.info(`Member removed from project: ${projectId} - ${userId}`);
    return result.matchedCount > 0;
  }

  /**
   * Get project members
   * 获取项目成员列表
   */
  static async getProjectMembers(projectId: string): Promise<any[]> {
    const members = normalizeDocuments<any>(
      await projectMembersCollection().find(buildActiveMembershipFilter({ project_id: projectId })).toArray()
    ).map((member) => normalizeMembershipRecord(member)).sort(compareMembersByRoleThenJoinedAt);
    const userMap = await getUserIdentityMap(members.map((member) => member.user_id));

    return members.map((member) => ({
      ...member,
      member_role_label: member.member_role_label ?? null,
      username: userMap.get(member.user_id)?.username || '',
      nickname: userMap.get(member.user_id)?.nickname ?? null,
      real_name: userMap.get(member.user_id)?.real_name ?? null,
      show_real_name_publicly: userMap.get(member.user_id)?.show_real_name_publicly ?? false,
      avatar_url: userMap.get(member.user_id)?.avatar_url || null,
    }));
  }

  static async getActiveProjectMemberUserIds(projectId: string): Promise<string[]> {
    const members = normalizeDocuments<{ user_id: string }>(
      await projectMembersCollection()
        .find(buildActiveMembershipFilter({ project_id: projectId }))
        .project({ _id: 0, user_id: 1 })
        .toArray()
    );

    return [...new Set(members.map((member) => member.user_id).filter(Boolean))];
  }

  /**
   * Get former project members
   * 获取已退出/被移除的历史成员
   */
  static async getFormerProjectMembers(projectId: string): Promise<any[]> {
    const inactiveMembers = normalizeDocuments<any>(
      await projectMembersCollection().find(buildInactiveMembershipFilter({ project_id: projectId })).toArray()
    ).sort(compareByRemovedAtDesc);
    const activeMembers = normalizeDocuments<{ user_id: string }>(
      await projectMembersCollection()
        .find(buildActiveMembershipFilter({ project_id: projectId }))
        .project({ _id: 0, user_id: 1 })
        .toArray()
    );
    const legacySources = await Promise.all([
      normalizeDocuments<any>(
        await applicationsCollection()
          .find({ project_id: projectId, status: 'approved' })
          .project({ _id: 0, user_id: 1, created_at: 1, reviewed_at: 1 })
          .toArray()
      ),
      normalizeDocuments<any>(
        await projectCommentsCollection()
          .find({ project_id: projectId })
          .project({ _id: 0, user_id: 1, created_at: 1, updated_at: 1 })
          .toArray()
      ),
      normalizeDocuments<any>(
        await activityLogCollection()
          .find({ project_id: projectId })
          .project({ _id: 0, user_id: 1, created_at: 1 })
          .toArray()
      ),
      normalizeDocuments<any>(
        await creatorProfilesCollection()
          .find({ project_id: projectId })
          .project({ _id: 0, user_id: 1, created_at: 1, updated_at: 1 })
          .toArray()
      ),
    ]);

    const knownFormerMembers = new Map<string, LegacyFormerMemberSource>(
      inactiveMembers.map((member) => [member.user_id, member])
    );
    const activeUserIds = new Set(activeMembers.map((member) => member.user_id));

    for (const sourceGroup of legacySources) {
      for (const source of sourceGroup) {
        if (!source.user_id || activeUserIds.has(source.user_id) || knownFormerMembers.has(source.user_id)) {
          continue;
        }

        knownFormerMembers.set(source.user_id, {
          user_id: source.user_id,
          role: 'member',
          joined_at: pickLatestDate(source.created_at, source.reviewed_at, source.updated_at),
          removed_at: pickLatestDate(source.updated_at, source.created_at, source.reviewed_at),
        });
      }
    }

    const formerMembers = [...knownFormerMembers.values()].sort(compareByRemovedAtDesc);
    const userMap = await getUserIdentityMap(formerMembers.map((member) => member.user_id));

    return formerMembers.map((member) => ({
      ...member,
      id: (member as { id?: string }).id || `legacy-former-${projectId}-${member.user_id}`,
      project_id: projectId,
      role: coerceProjectRole(member.role),
      member_role_label: (member as { member_role_label?: string | null }).member_role_label ?? null,
      active: false,
      joined_at: member.joined_at || member.removed_at || new Date(0).toISOString(),
      removed_at: member.removed_at || member.joined_at || new Date(0).toISOString(),
      username: userMap.get(member.user_id)?.username || '',
      nickname: userMap.get(member.user_id)?.nickname ?? null,
      real_name: userMap.get(member.user_id)?.real_name ?? null,
      show_real_name_publicly: userMap.get(member.user_id)?.show_real_name_publicly ?? false,
      avatar_url: userMap.get(member.user_id)?.avatar_url || null,
    }));
  }

  /**
   * Get a project membership record regardless of active state
   * 获取指定成员的成员关系记录（含 inactive）
   */
  static async getProjectMembership(projectId: string, userId: string): Promise<any | null> {
    const membership = normalizeDocument<any>(
      await projectMembersCollection().findOne({ project_id: projectId, user_id: userId })
    );
    return membership ? normalizeMembershipRecord(membership) : null;
  }

  static async getProjectMemberCapacity(projectId: string): Promise<{
    maxMembers: number | null;
    memberCount: number;
    isFull: boolean;
  }> {
    const [settings, memberCount] = await Promise.all([
      normalizeDocument<{ max_members?: number | null }>(
        await projectSettingsCollection().findOne({ project_id: projectId })
      ),
      projectMembersCollection().countDocuments(buildActiveMembershipFilter({ project_id: projectId })),
    ]);
    const configuredMaxMembers = settings?.max_members;
    const maxMembers =
      typeof configuredMaxMembers === 'number' && Number.isFinite(configuredMaxMembers) && configuredMaxMembers > 0
        ? Math.floor(configuredMaxMembers)
        : null;

    return {
      maxMembers,
      memberCount,
      isFull: maxMembers !== null && memberCount >= maxMembers,
    };
  }

  private static async enrichProjectEvidence(evidenceItems: any[]): Promise<any[]> {
    if (evidenceItems.length === 0) {
      return [];
    }

    const userMap = await getUserIdentityMap(evidenceItems.map((item) => item.created_by));

    return evidenceItems.map((item) => ({
      ...item,
      creator_username: userMap.get(item.created_by)?.username || '',
      creator_nickname: userMap.get(item.created_by)?.nickname ?? null,
      creator_real_name: userMap.get(item.created_by)?.real_name ?? null,
      creator_show_real_name_publicly: userMap.get(item.created_by)?.show_real_name_publicly ?? false,
      creator_avatar_url: userMap.get(item.created_by)?.avatar_url || null,
    }));
  }

  /**
   * Get project evidence
   * 获取课题证据库记录
   */
  static async getProjectEvidence(projectId: string): Promise<any[]> {
    const evidenceItems = normalizeDocuments<any>(
      await evidenceCollection()
        .find({ project_id: projectId })
        .sort({ created_at: -1 })
        .toArray()
    );

    return this.enrichProjectEvidence(evidenceItems);
  }

  static async getProjectEvidenceById(evidenceId: string): Promise<any | null> {
    const evidence = normalizeDocument<any>(await evidenceCollection().findOne({ id: evidenceId }));
    if (!evidence) {
      return null;
    }

    const [enriched] = await this.enrichProjectEvidence([evidence]);
    return enriched ?? null;
  }

  /**
   * Resolve the owning project of an evidence record without enrichment.
   * 仅查询证据所属课题，避免为记录活跃时间而加载用户信息
   */
  private static async getEvidenceProjectId(evidenceId: string): Promise<string | null> {
    const evidence = normalizeDocument<{ project_id?: string | null }>(
      await evidenceCollection().findOne(
        { id: evidenceId },
        { projection: { _id: 0, project_id: 1 } }
      )
    );
    return evidence?.project_id ?? null;
  }

  static async getProjectEvidenceAttachmentUrls(projectId: string): Promise<string[]> {
    const evidenceItems = normalizeDocuments<{ attachment_url?: string | null }>(
      await evidenceCollection()
        .find({ project_id: projectId })
        .project({ _id: 0, attachment_url: 1 })
        .toArray()
    );

    return evidenceItems
      .map((item) => (typeof item.attachment_url === 'string' ? item.attachment_url.trim() : ''))
      .filter(Boolean);
  }

  /**
   * Create project evidence
   * 创建课题证据记录
   */
  static async createProjectEvidence(
    projectId: string,
    createdBy: string,
    data: ResearchProjectEvidenceInput
  ): Promise<string> {
    const now = new Date();
    const evidenceId = generateId();

    await evidenceCollection().insertOne({
      id: evidenceId,
      project_id: projectId,
      title: data.title,
      evidence_type: data.evidence_type,
      description: data.description ?? null,
      external_url: data.external_url ?? null,
      attachment_url: data.attachment_url ?? null,
      attachment_original_name: data.attachment_original_name ?? null,
      attachment_size: data.attachment_size ?? null,
      attachment_mime_type: data.attachment_mime_type ?? null,
      attachment_category: data.attachment_category ?? null,
      attachment_note: data.attachment_note ?? null,
      created_by: createdBy,
      created_at: now,
      updated_at: now,
    });
    await this.touchProjectActivity(projectId, now);

    logger.info(`Project evidence created: ${evidenceId} in project ${projectId}`);
    return evidenceId;
  }

  /**
   * Update project evidence
   * 更新课题证据记录
   */
  static async updateProjectEvidence(
    evidenceId: string,
    data: Partial<ResearchProjectEvidenceInput>
  ): Promise<boolean> {
    const updateDoc = pickDefined({
      title: data.title,
      evidence_type: data.evidence_type,
      description: data.description,
      external_url: data.external_url,
      attachment_url: data.attachment_url,
      attachment_original_name: data.attachment_original_name,
      attachment_size: data.attachment_size,
      attachment_mime_type: data.attachment_mime_type,
      attachment_category: data.attachment_category,
      attachment_note: data.attachment_note,
    });

    if (Object.keys(updateDoc).length === 0) {
      return false;
    }

    const projectId = await this.getEvidenceProjectId(evidenceId);
    const result = await evidenceCollection().updateOne(
      { id: evidenceId },
      { $set: { ...updateDoc, updated_at: new Date() } }
    );

    if (result.matchedCount > 0 && projectId) {
      await this.touchProjectActivity(projectId);
    }

    logger.info(`Project evidence updated: ${evidenceId}`);
    return result.matchedCount > 0;
  }

  /**
   * Delete project evidence
   * 删除课题证据记录
   */
  static async deleteProjectEvidence(evidenceId: string): Promise<boolean> {
    const projectId = await this.getEvidenceProjectId(evidenceId);
    const result = await evidenceCollection().deleteOne({ id: evidenceId });
    if (result.deletedCount > 0 && projectId) {
      await this.touchProjectActivity(projectId);
    }
    logger.info(`Project evidence deleted: ${evidenceId}`);
    return result.deletedCount > 0;
  }

  /**
   * Get canvases by project ID
   * 获取项目的画布列表
   */
  static async getProjectCanvases(projectId: string): Promise<any[]> {
    const canvases = normalizeDocuments<any>(
      await canvasesCollection().find({ project_id: projectId }).sort({ updated_at: -1 }).toArray()
    );
    if (canvases.length === 0) {
      return [];
    }

    const canvasIds = canvases.map((canvas) => canvas.id);
    const [nodes, edges] = await Promise.all([
      normalizeDocuments<{ canvas_id: string }>(
        await nodesCollection().find({ canvas_id: { $in: canvasIds } }).project({ _id: 0, canvas_id: 1 }).toArray()
      ),
      normalizeDocuments<{ canvas_id: string }>(
        await edgesCollection().find({ canvas_id: { $in: canvasIds } }).project({ _id: 0, canvas_id: 1 }).toArray()
      ),
    ]);

    const nodeCountMap = new Map<string, number>();
    const edgeCountMap = new Map<string, number>();

    for (const node of nodes) {
      nodeCountMap.set(node.canvas_id, (nodeCountMap.get(node.canvas_id) ?? 0) + 1);
    }

    for (const edge of edges) {
      edgeCountMap.set(edge.canvas_id, (edgeCountMap.get(edge.canvas_id) ?? 0) + 1);
    }

    return canvases.map((canvas) => ({
      ...canvas,
      node_count: nodeCountMap.get(canvas.id) ?? 0,
      edge_count: edgeCountMap.get(canvas.id) ?? 0,
    }));
  }

  /**
   * Get canvas by ID with nodes and edges
   * 获取画布详情（包含节点和边）
   */
  static async getCanvasById(canvasId: string): Promise<any | null> {
    const canvas = normalizeDocument<any>(await canvasesCollection().findOne({ id: canvasId }));
    if (!canvas) {
      return null;
    }

    const [nodes, edges] = await Promise.all([
      normalizeDocuments<any>(
        await nodesCollection().find({ canvas_id: canvasId }).sort({ created_at: 1 }).toArray()
      ),
      normalizeDocuments<any>(
        await edgesCollection().find({ canvas_id: canvasId }).sort({ created_at: 1 }).toArray()
      ),
    ]);

    return {
      ...canvas,
      nodes,
      edges,
    };
  }

  /**
   * Resolve the owning project of a canvas without loading its nodes/edges.
   * 仅查询画布所属课题，避免为记录活跃时间而加载整张画布
   */
  private static async getCanvasProjectId(canvasId: string): Promise<string | null> {
    const canvas = normalizeDocument<{ project_id?: string | null }>(
      await canvasesCollection().findOne(
        { id: canvasId },
        { projection: { _id: 0, project_id: 1 } }
      )
    );
    return canvas?.project_id ?? null;
  }

  /**
   * Create canvas
   * 创建画布
   */
  static async createCanvas(projectId: string, data: any): Promise<string> {
    const now = new Date();
    const canvasId = generateId();

    await canvasesCollection().insertOne({
      id: canvasId,
      project_id: projectId,
      name_zh: data.name_zh,
      name_en: data.name_en || null,
      description_zh: data.description_zh || null,
      description_en: data.description_en || null,
      viewport_data: data.viewport_data ?? null,
      created_at: now,
      updated_at: now,
      last_opened_at: now,
    });
    await this.touchProjectActivity(projectId, now);

    logger.info(`Canvas created: ${canvasId} in project ${projectId}`);
    return canvasId;
  }

  /**
   * Update canvas
   * 更新画布
   */
  static async updateCanvas(canvasId: string, data: any): Promise<boolean> {
    const updateDoc = pickDefined({
      name_zh: data.name_zh,
      name_en: data.name_en,
      description_zh: data.description_zh,
      description_en: data.description_en,
      viewport_data: data.viewport_data,
    });

    if (Object.keys(updateDoc).length === 0) {
      return false;
    }

    const projectId = await this.getCanvasProjectId(canvasId);
    const now = new Date();
    const result = await canvasesCollection().updateOne(
      { id: canvasId },
      { $set: { ...updateDoc, updated_at: now, last_opened_at: now } }
    );

    if (result.matchedCount > 0 && projectId) {
      await this.touchProjectActivity(projectId, now);
    }

    logger.info(`Canvas updated: ${canvasId}`);
    return result.matchedCount > 0;
  }

  /**
   * Delete canvas
   * 删除画布
   */
  static async deleteCanvas(canvasId: string): Promise<boolean> {
    const projectId = await this.getCanvasProjectId(canvasId);
    const nodes = normalizeDocuments<{ id: string }>(
      await nodesCollection().find({ canvas_id: canvasId }).project({ _id: 0, id: 1 }).toArray()
    );
    const nodeIds = nodes.map((node) => node.id);

    const result = await canvasesCollection().deleteOne({ id: canvasId });
    if (result.deletedCount === 0) {
      return false;
    }

    await Promise.all([
      nodesCollection().deleteMany({ canvas_id: canvasId }),
      edgesCollection().deleteMany({ canvas_id: canvasId }),
      commentsCollection().deleteMany(nodeIds.length > 0 ? { node_id: { $in: nodeIds } } : { node_id: '__none__' }),
    ]);

    if (projectId) {
      await this.touchProjectActivity(projectId);
    }

    logger.info(`Canvas deleted: ${canvasId}`);
    return true;
  }

  /**
   * Get node by ID
   * 获取节点详情
   */
  static async getNodeById(nodeId: string): Promise<any | null> {
    return normalizeDocument<any>(await nodesCollection().findOne({ id: nodeId }));
  }

  /**
   * Create node
   * 创建节点
   */
  static async createNode(canvasId: string, data: any, createdBy: string): Promise<string> {
    const now = new Date();
    const nodeId = generateId();

    await nodesCollection().insertOne({
      id: nodeId,
      canvas_id: canvasId,
      type: data.type,
      position_x: data.position_x,
      position_y: data.position_y,
      title_zh: data.title_zh ?? null,
      title_en: data.title_en ?? null,
      description_zh: data.description_zh ?? null,
      description_en: data.description_en ?? null,
      status: data.status ?? null,
      created_by: createdBy,
      created_at: now,
      updated_at: now,
      assigned_to: data.assigned_to ?? null,
      hypothesis_zh: data.hypothesis_zh,
      hypothesis_en: data.hypothesis_en,
      priority: data.priority,
      tags: data.tags,
      simulation_config: data.simulation_config,
      result_snapshot: data.result_snapshot,
      linked_demo: data.linked_demo,
      statement_zh: data.statement_zh,
      statement_en: data.statement_en,
      confidence: data.confidence,
      evidence_ids: data.evidence_ids,
      limitations_zh: data.limitations_zh,
      limitations_en: data.limitations_en,
      future_work_zh: data.future_work_zh,
      future_work_en: data.future_work_en,
      topic_zh: data.topic_zh,
      topic_en: data.topic_en,
      participants: data.participants,
      media_url: data.media_url,
      media_type: data.media_type,
      content_zh: data.content_zh,
      content_en: data.content_en,
      color: data.color,
      pinned: data.pinned,
    });

    const projectId = await this.getCanvasProjectId(canvasId);
    if (projectId) {
      await this.touchProjectActivity(projectId, now);
    }

    logger.info(`Node created: ${nodeId} of type ${data.type}`);
    return nodeId;
  }

  /**
   * Update node
   * 更新节点
   */
  static async updateNode(nodeId: string, data: any): Promise<boolean> {
    const node = await this.getNodeById(nodeId);
    const updateDoc = pickDefined({
      title_zh: data.title_zh,
      title_en: data.title_en,
      description_zh: data.description_zh,
      description_en: data.description_en,
      status: data.status,
      position_x: data.position_x,
      position_y: data.position_y,
      hypothesis_zh: data.hypothesis_zh,
      hypothesis_en: data.hypothesis_en,
      tags: data.tags,
      simulation_config: data.simulation_config,
      result_snapshot: data.result_snapshot,
      evidence_ids: data.evidence_ids,
      statement_zh: data.statement_zh,
      statement_en: data.statement_en,
      limitations_zh: data.limitations_zh,
      limitations_en: data.limitations_en,
      future_work_zh: data.future_work_zh,
      future_work_en: data.future_work_en,
      assigned_to: data.assigned_to,
      participants: data.participants,
      priority: data.priority,
      confidence: data.confidence,
      linked_demo: data.linked_demo,
      topic_zh: data.topic_zh,
      topic_en: data.topic_en,
      media_url: data.media_url,
      media_type: data.media_type,
      content_zh: data.content_zh,
      content_en: data.content_en,
      color: data.color,
      pinned: data.pinned,
      type: data.type,
    });

    if (Object.keys(updateDoc).length === 0) {
      return false;
    }

    const result = await nodesCollection().updateOne(
      { id: nodeId },
      { $set: { ...updateDoc, updated_at: new Date() } }
    );

    if (result.matchedCount > 0 && node?.canvas_id) {
      const projectId = await this.getCanvasProjectId(node.canvas_id);
      if (projectId) await this.touchProjectActivity(projectId);
    }

    logger.info(`Node updated: ${nodeId}`);
    return result.matchedCount > 0;
  }

  /**
   * Delete node
   * 删除节点
   */
  static async deleteNode(nodeId: string): Promise<boolean> {
    const node = await this.getNodeById(nodeId);
    const result = await nodesCollection().deleteOne({ id: nodeId });
    if (result.deletedCount === 0) {
      return false;
    }

    await Promise.all([
      edgesCollection().deleteMany({ $or: [{ source_node_id: nodeId }, { target_node_id: nodeId }] }),
      commentsCollection().deleteMany({ node_id: nodeId }),
    ]);

    if (node?.canvas_id) {
      const projectId = await this.getCanvasProjectId(node.canvas_id);
      if (projectId) await this.touchProjectActivity(projectId);
    }

    logger.info(`Node deleted: ${nodeId}`);
    return true;
  }

  /**
   * Get edge by ID
   * 获取边详情
   */
  static async getEdgeById(edgeId: string): Promise<any | null> {
    return normalizeDocument<any>(await edgesCollection().findOne({ id: edgeId }));
  }

  /**
   * Create edge
   * 创建边
   */
  static async createEdge(canvasId: string, data: any, createdBy: string): Promise<string> {
    const edgeId = generateId();
    const now = new Date();

    await edgesCollection().insertOne({
      id: edgeId,
      canvas_id: canvasId,
      type: data.type,
      source_node_id: data.source_node_id,
      target_node_id: data.target_node_id,
      label_zh: data.label_zh || null,
      label_en: data.label_en || null,
      evidence_strength: data.evidence_strength || null,
      evidence_notes_zh: data.evidence_notes_zh || null,
      evidence_notes_en: data.evidence_notes_en || null,
      created_by: createdBy,
      created_at: now,
    });

    const projectId = await this.getCanvasProjectId(canvasId);
    if (projectId) await this.touchProjectActivity(projectId, now);

    logger.info(`Edge created: ${edgeId} of type ${data.type}`);
    return edgeId;
  }

  /**
   * Update edge
   * 更新边
   */
  static async updateEdge(edgeId: string, data: any): Promise<boolean> {
    const edge = await this.getEdgeById(edgeId);
    const updateDoc = pickDefined({
      type: data.type,
      label_zh: data.label_zh,
      label_en: data.label_en,
      evidence_strength: data.evidence_strength,
      evidence_notes_zh: data.evidence_notes_zh,
      evidence_notes_en: data.evidence_notes_en,
    });

    if (Object.keys(updateDoc).length === 0) {
      return false;
    }

    const result = await edgesCollection().updateOne({ id: edgeId }, { $set: updateDoc });

    if (result.matchedCount > 0 && edge?.canvas_id) {
      const projectId = await this.getCanvasProjectId(edge.canvas_id);
      if (projectId) await this.touchProjectActivity(projectId);
    }

    logger.info(`Edge updated: ${edgeId}`);
    return result.matchedCount > 0;
  }

  /**
   * Delete edge
   * 删除边
   */
  static async deleteEdge(edgeId: string): Promise<boolean> {
    const edge = await this.getEdgeById(edgeId);
    const result = await edgesCollection().deleteOne({ id: edgeId });
    if (result.deletedCount > 0 && edge?.canvas_id) {
      const projectId = await this.getCanvasProjectId(edge.canvas_id);
      if (projectId) await this.touchProjectActivity(projectId);
    }
    logger.info(`Edge deleted: ${edgeId}`);
    return result.deletedCount > 0;
  }

  /**
   * Get comments for node
   * 获取节点评论
   */
  static async getNodeComments(nodeId: string): Promise<any[]> {
    const comments = normalizeDocuments<any>(
      await commentsCollection().find({ node_id: nodeId }).sort({ created_at: 1 }).toArray()
    );
    const userMap = await getUserIdentityMap(comments.map((comment) => comment.user_id));

    return comments.map((comment) => ({
      ...comment,
      username: userMap.get(comment.user_id)?.username || '',
      nickname: userMap.get(comment.user_id)?.nickname ?? null,
      real_name: userMap.get(comment.user_id)?.real_name ?? null,
      show_real_name_publicly: userMap.get(comment.user_id)?.show_real_name_publicly ?? false,
      avatar_url: userMap.get(comment.user_id)?.avatar_url || null,
    }));
  }

  static async getCommentById(commentId: string): Promise<any | null> {
    return normalizeDocument<any>(await commentsCollection().findOne({ id: commentId }));
  }

  /**
   * Add comment
   * 添加评论
   */
  static async addComment(nodeId: string, userId: string, content: string): Promise<string> {
    const now = new Date();
    const commentId = generateId();

    await commentsCollection().insertOne({
      id: commentId,
      node_id: nodeId,
      user_id: userId,
      content,
      resolved: false,
      created_at: now,
      updated_at: now,
    });

    const node = await this.getNodeById(nodeId);
    if (node?.canvas_id) {
      const projectId = await this.getCanvasProjectId(node.canvas_id);
      if (projectId) await this.touchProjectActivity(projectId, now);
    }

    logger.info(`Comment added to node: ${nodeId}`);
    return commentId;
  }

  /**
   * Update comment
   * 更新评论
   */
  static async updateComment(commentId: string, userId: string, content: string): Promise<boolean> {
    const comment = await this.getCommentById(commentId);
    const result = await commentsCollection().updateOne(
      { id: commentId, user_id: userId },
      { $set: { content, updated_at: new Date() } }
    );

    if (result.matchedCount > 0 && comment?.node_id) {
      const node = await this.getNodeById(comment.node_id);
      if (node?.canvas_id) {
        const projectId = await this.getCanvasProjectId(node.canvas_id);
        if (projectId) await this.touchProjectActivity(projectId);
      }
    }

    logger.info(`Comment updated: ${commentId}`);
    return result.matchedCount > 0;
  }

  /**
   * Delete comment
   * 删除评论
   */
  static async deleteComment(commentId: string): Promise<boolean> {
    const comment = await this.getCommentById(commentId);
    const result = await commentsCollection().deleteOne({ id: commentId });
    if (result.deletedCount > 0 && comment?.node_id) {
      const node = await this.getNodeById(comment.node_id);
      if (node?.canvas_id) {
        const projectId = await this.getCanvasProjectId(node.canvas_id);
        if (projectId) await this.touchProjectActivity(projectId);
      }
    }
    logger.info(`Comment deleted: ${commentId}`);
    return result.deletedCount > 0;
  }

  /**
   * Get project discussion comments
   * 获取课题讨论评论
   */
  static async getProjectDiscussionComments(projectId: string): Promise<any[]> {
    const comments = normalizeDocuments<any>(
      await projectCommentsCollection().find({ project_id: projectId }).sort({ created_at: 1 }).toArray()
    );
    const userMap = await getUserIdentityMap(comments.map((comment) => comment.user_id));

    return comments.map((comment) => ({
      ...comment,
      image_urls: normalizeImageUrls(comment.image_urls),
      video_urls: normalizeVideoUrls(comment.video_urls),
      username: userMap.get(comment.user_id)?.username || '',
      nickname: userMap.get(comment.user_id)?.nickname ?? null,
      real_name: userMap.get(comment.user_id)?.real_name ?? null,
      show_real_name_publicly: userMap.get(comment.user_id)?.show_real_name_publicly ?? false,
      avatar_url: userMap.get(comment.user_id)?.avatar_url || null,
    }));
  }

  static async getRecentProjectDiscussionDigest(
    projectId: string,
    limit: number = 8
  ): Promise<ResearchDiscussionDigestItem[]> {
    const safeLimit = Math.min(20, Math.max(1, Math.floor(limit)));
    const comments = normalizeDocuments<any>(
      await projectCommentsCollection()
        .find({ project_id: projectId, is_deleted: { $ne: true } })
        .sort({ created_at: -1 })
        .limit(safeLimit)
        .project({ _id: 0, user_id: 1, content: 1, image_urls: 1, video_urls: 1, created_at: 1 })
        .toArray()
    ).reverse();
    const userMap = await getUserIdentityMap(comments.map((comment) => comment.user_id));

    return comments.map((comment) => ({
      username: userMap.get(comment.user_id)?.username || '成员',
      content: typeof comment.content === 'string' ? comment.content.trim().slice(0, 500) : '',
      image_count: normalizeImageUrls(comment.image_urls).length,
      video_count: normalizeVideoUrls(comment.video_urls).length,
      created_at: comment.created_at,
    }));
  }

  static async clearProjectAgentMessages(projectId: string): Promise<number> {
    const result = await agentMessagesCollection().deleteMany({ project_id: projectId });
    return result.deletedCount ?? 0;
  }

  /**
   * Get project discussion comment by ID
   * 获取课题讨论评论详情
   */
  static async getProjectDiscussionCommentById(commentId: string): Promise<any | null> {
    const comment = normalizeDocument<any>(await projectCommentsCollection().findOne({ id: commentId }));
    if (!comment) {
      return null;
    }

    return {
      ...comment,
      image_urls: normalizeImageUrls(comment.image_urls),
      video_urls: normalizeVideoUrls(comment.video_urls),
    };
  }

  /**
   * Add project discussion comment
   * 添加课题讨论评论
   */
  static async addProjectDiscussionComment(
    projectId: string,
    userId: string,
    content: string,
    parentCommentId: string | null = null,
    imageUrls: string[] = [],
    videoUrls: string[] = []
  ): Promise<string> {
    const now = new Date();
    const commentId = generateId();

    await projectCommentsCollection().insertOne({
      id: commentId,
      project_id: projectId,
      user_id: userId,
      parent_comment_id: parentCommentId,
      content,
      image_urls: normalizeImageUrls(imageUrls),
      video_urls: normalizeVideoUrls(videoUrls),
      is_deleted: false,
      created_at: now,
      updated_at: now,
    });
    await this.touchProjectActivity(projectId, now);

    logger.info(`Project discussion comment added: ${commentId} in project ${projectId}`);
    return commentId;
  }

  /**
   * Update a project discussion comment's text (author-only, attachments unchanged)
   * 更新课题讨论评论文字（仅作者本人，附件保持不变）
   */
  static async updateProjectDiscussionComment(
    commentId: string,
    userId: string,
    content: string
  ): Promise<boolean> {
    const comment = await this.getProjectDiscussionCommentById(commentId);
    if (!comment || comment.is_deleted) {
      return false;
    }

    const result = await projectCommentsCollection().updateOne(
      { id: commentId, user_id: userId, is_deleted: { $ne: true } },
      { $set: { content, updated_at: new Date() } }
    );

    if (result.matchedCount > 0) {
      await this.touchProjectActivity(comment.project_id);
    }

    logger.info(`Project discussion comment updated: ${commentId}`);
    return result.matchedCount > 0;
  }

  private static async pruneDeletedProjectDiscussionAncestor(commentId: string | null): Promise<void> {
    if (!commentId) {
      return;
    }

    const comment = await this.getProjectDiscussionCommentById(commentId);
    if (!comment?.is_deleted) {
      return;
    }

    const childCount = await projectCommentsCollection().countDocuments({ parent_comment_id: commentId });
    if (childCount > 0) {
      return;
    }

    await projectCommentsCollection().deleteOne({ id: commentId });
    await this.pruneDeletedProjectDiscussionAncestor(comment.parent_comment_id ?? null);
  }

  /**
   * Delete project discussion comment
   * 删除课题讨论评论
   */
  static async deleteProjectDiscussionComment(commentId: string): Promise<boolean> {
    const comment = await this.getProjectDiscussionCommentById(commentId);
    if (!comment) {
      return false;
    }

    const childCount = await projectCommentsCollection().countDocuments({ parent_comment_id: commentId });

    if (childCount > 0) {
      const result = await projectCommentsCollection().updateOne(
        { id: commentId },
        { $set: { is_deleted: true, content: '', image_urls: [], video_urls: [], updated_at: new Date() } }
      );
      if (result.matchedCount > 0) await this.touchProjectActivity(comment.project_id);
      logger.info(`Project discussion comment soft deleted: ${commentId}`);
      return result.matchedCount > 0;
    }

    const result = await projectCommentsCollection().deleteOne({ id: commentId });
    if (result.deletedCount === 0) {
      return false;
    }

    await this.pruneDeletedProjectDiscussionAncestor(comment.parent_comment_id ?? null);
    await this.touchProjectActivity(comment.project_id);
    logger.info(`Project discussion comment deleted: ${commentId}`);
    return true;
  }

  /**
   * Log activity
   * 记录活动
   */
  static async logActivity(
    projectId: string,
    userId: string,
    action: string,
    targetType: string,
    targetId: string,
    changes?: any
  ): Promise<string> {
    const activityId = generateId();

    await activityLogCollection().insertOne({
      id: activityId,
      project_id: projectId,
      user_id: userId,
      action,
      target_type: targetType,
      target_id: targetId,
      changes: changes || null,
      created_at: new Date(),
    });
    await this.touchProjectActivity(projectId);

    return activityId;
  }

  /**
   * Get project activity
   * 获取项目活动日志
   */
  static async getProjectActivity(projectId: string, limit: number = 50): Promise<any[]> {
    const safeLimit = Math.max(1, Math.floor(limit));
    const activities = normalizeDocuments<any>(
      await activityLogCollection()
        .find({ project_id: projectId })
        .sort({ created_at: -1 })
        .limit(safeLimit)
        .toArray()
    );
    const userMap = await getUserIdentityMap(activities.map((activity) => activity.user_id));

    return activities.map((activity) => ({
      ...activity,
      username: userMap.get(activity.user_id)?.username || '',
      nickname: userMap.get(activity.user_id)?.nickname ?? null,
      real_name: userMap.get(activity.user_id)?.real_name ?? null,
      show_real_name_publicly: userMap.get(activity.user_id)?.show_real_name_publicly ?? false,
      avatar_url: userMap.get(activity.user_id)?.avatar_url || null,
    }));
  }

  /**
   * Get task board data
   * 获取任务看板数据
   */
  static async getTaskBoard(projectId: string): Promise<any> {
    const canvases = normalizeDocuments<{ id: string }>(
      await canvasesCollection().find({ project_id: projectId }).project({ _id: 0, id: 1 }).toArray()
    );
    const canvasIds = canvases.map((canvas) => canvas.id);

    if (canvasIds.length === 0) {
      return { columns: [] };
    }

    const nodes = normalizeDocuments<{ status?: string | null; id: string }>(
      await nodesCollection()
        .find({
          canvas_id: { $in: canvasIds },
          status: { $exists: true, $ne: null },
        })
        .project({ _id: 0, status: 1, id: 1 })
        .toArray()
    );

    const columns = new Map<string, string[]>();
    for (const node of nodes) {
      if (!node.status) {
        continue;
      }
      const list = columns.get(node.status) || [];
      list.push(node.id);
      columns.set(node.status, list);
    }

    return {
      columns: Array.from(columns.entries()).map(([status, nodeIds]) => ({
        status,
        nodes: nodeIds,
      })),
    };
  }
}
