/**
 * Research Model
 * 虚拟课题组数据模型
 */

import { getCollection } from '../database/connection.js';
import { compareRole, normalizeDocument, normalizeDocuments, normalizeImageUrls, pickDefined } from '../database/mongo.util.js';
import { generateId } from '../utils/crypto.util.js';
import { logger } from '../utils/logger.js';
import {
  buildActiveMembershipFilter,
  buildInactiveMembershipFilter,
  isMembershipActive,
} from './research-membership.util.js';
import { getProjectCoverImageMap } from './research-cover.util.js';

const researchProjectsCollection = () => getCollection('research_projects');
const projectMembersCollection = () => getCollection('research_project_members');
const canvasesCollection = () => getCollection('research_canvases');
const nodesCollection = () => getCollection('research_nodes');
const edgesCollection = () => getCollection('research_edges');
const commentsCollection = () => getCollection('research_node_comments');
const projectCommentsCollection = () => getCollection('research_project_comments');
const agentMessagesCollection = () => getCollection('research_ai_messages');
const activityLogCollection = () => getCollection('research_activity_log');
const usersCollection = () => getCollection('users');
const projectSettingsCollection = () => getCollection('research_project_settings');
const creatorProfilesCollection = () => getCollection('research_project_creator_profiles');
const applicationsCollection = () => getCollection('research_project_applications');

async function getUserMap(userIds: string[]): Promise<Map<string, { username: string; avatar_url: string | null }>> {
  if (userIds.length === 0) {
    return new Map();
  }

  const users = normalizeDocuments<{ id: string; username: string; avatar_url: string | null }>(
    await usersCollection()
      .find({ id: { $in: [...new Set(userIds)] } })
      .project({ _id: 0, id: 1, username: 1, avatar_url: 1 })
      .toArray()
  );

  return new Map(users.map((user) => [user.id, { username: user.username, avatar_url: user.avatar_url }]));
}

function sortMembers(a: any, b: any): number {
  const roleCompare = compareRole(a.role, b.role);
  if (roleCompare !== 0) {
    return roleCompare;
  }

  return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
}

function normalizeVideoUrls(value: unknown): string[] {
  return normalizeImageUrls(value);
}

type LegacyFormerMemberSource = {
  user_id: string;
  role?: string | null;
  joined_at?: Date | string | null;
  removed_at?: Date | string | null;
};

export type ResearchProjectRole = 'owner' | 'member';

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

function normalizeProjectRole(role: unknown): ResearchProjectRole {
  return role === 'owner' ? 'owner' : 'member';
}

function normalizeMemberRoleLabel(value?: string | null): string | null {
  const label = typeof value === 'string' ? value.trim() : '';
  return label || null;
}

function normalizeMembershipRecord<T extends { role?: unknown }>(member: T): T & { role: ResearchProjectRole } {
  return {
    ...member,
    role: normalizeProjectRole(member.role),
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
      currentUserRoleMap.set(membership.project_id, normalizeProjectRole(membership.role));
    }

    for (const canvas of canvases) {
      canvasCountMap.set(canvas.project_id, (canvasCountMap.get(canvas.project_id) ?? 0) + 1);
    }

    return projects.map((project) => ({
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

    const [memberCount, canvasCount] = await Promise.all([
      projectMembersCollection().countDocuments(buildActiveMembershipFilter({ project_id: projectId })),
      canvasesCollection().countDocuments({ project_id: projectId }),
    ]);

    return {
      ...project,
      member_count: memberCount,
      canvas_count: canvasCount,
    };
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
      canRead: isAdmin || isMember || Boolean(project.is_public),
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
      status: data.status || 'draft',
      is_public: data.is_public || false,
      allow_guest_comments: data.allow_guest_comments || false,
      enable_task_board: data.enable_task_board !== undefined ? data.enable_task_board : true,
      default_canvas_id: data.default_canvas_id || null,
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
  static async updateProject(projectId: string, data: any): Promise<boolean> {
    const updateDoc = pickDefined({
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
      status: data.status,
      is_public: data.is_public,
      allow_guest_comments: data.allow_guest_comments,
      enable_task_board: data.enable_task_board,
      default_canvas_id: data.default_canvas_id,
    });

    if (Object.keys(updateDoc).length === 0) {
      return false;
    }

    const result = await researchProjectsCollection().updateOne(
      { id: projectId },
      { $set: { ...updateDoc, updated_at: new Date() } }
    );

    logger.info(`Project updated: ${projectId}`);
    return result.matchedCount > 0;
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
    const normalizedRole = normalizeProjectRole(role);
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
    ).map((member) => normalizeMembershipRecord(member)).sort(sortMembers);
    const userMap = await getUserMap(members.map((member) => member.user_id));

    return members.map((member) => ({
      ...member,
      member_role_label: member.member_role_label ?? null,
      username: userMap.get(member.user_id)?.username || '',
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
    ).sort((a, b) => {
      const removedAtA = a.removed_at ? new Date(a.removed_at).getTime() : 0;
      const removedAtB = b.removed_at ? new Date(b.removed_at).getTime() : 0;
      return removedAtB - removedAtA;
    });
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

    const formerMembers = [...knownFormerMembers.values()].sort((a, b) => {
      const removedAtA = a.removed_at ? new Date(a.removed_at).getTime() : 0;
      const removedAtB = b.removed_at ? new Date(b.removed_at).getTime() : 0;
      return removedAtB - removedAtA;
    });
    const userMap = await getUserMap(formerMembers.map((member) => member.user_id));

    return formerMembers.map((member) => ({
      ...member,
      id: (member as { id?: string }).id || `legacy-former-${projectId}-${member.user_id}`,
      project_id: projectId,
      role: normalizeProjectRole(member.role),
      member_role_label: (member as { member_role_label?: string | null }).member_role_label ?? null,
      active: false,
      joined_at: member.joined_at || member.removed_at || new Date(0).toISOString(),
      removed_at: member.removed_at || member.joined_at || new Date(0).toISOString(),
      username: userMap.get(member.user_id)?.username || '',
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

    const now = new Date();
    const result = await canvasesCollection().updateOne(
      { id: canvasId },
      { $set: { ...updateDoc, updated_at: now, last_opened_at: now } }
    );

    logger.info(`Canvas updated: ${canvasId}`);
    return result.matchedCount > 0;
  }

  /**
   * Delete canvas
   * 删除画布
   */
  static async deleteCanvas(canvasId: string): Promise<boolean> {
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

    logger.info(`Node created: ${nodeId} of type ${data.type}`);
    return nodeId;
  }

  /**
   * Update node
   * 更新节点
   */
  static async updateNode(nodeId: string, data: any): Promise<boolean> {
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

    logger.info(`Node updated: ${nodeId}`);
    return result.matchedCount > 0;
  }

  /**
   * Delete node
   * 删除节点
   */
  static async deleteNode(nodeId: string): Promise<boolean> {
    const result = await nodesCollection().deleteOne({ id: nodeId });
    if (result.deletedCount === 0) {
      return false;
    }

    await Promise.all([
      edgesCollection().deleteMany({ $or: [{ source_node_id: nodeId }, { target_node_id: nodeId }] }),
      commentsCollection().deleteMany({ node_id: nodeId }),
    ]);

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
      created_at: new Date(),
    });

    logger.info(`Edge created: ${edgeId} of type ${data.type}`);
    return edgeId;
  }

  /**
   * Update edge
   * 更新边
   */
  static async updateEdge(edgeId: string, data: any): Promise<boolean> {
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

    logger.info(`Edge updated: ${edgeId}`);
    return result.matchedCount > 0;
  }

  /**
   * Delete edge
   * 删除边
   */
  static async deleteEdge(edgeId: string): Promise<boolean> {
    const result = await edgesCollection().deleteOne({ id: edgeId });
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
    const userMap = await getUserMap(comments.map((comment) => comment.user_id));

    return comments.map((comment) => ({
      ...comment,
      username: userMap.get(comment.user_id)?.username || '',
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

    logger.info(`Comment added to node: ${nodeId}`);
    return commentId;
  }

  /**
   * Update comment
   * 更新评论
   */
  static async updateComment(commentId: string, userId: string, content: string): Promise<boolean> {
    const result = await commentsCollection().updateOne(
      { id: commentId, user_id: userId },
      { $set: { content, updated_at: new Date() } }
    );

    logger.info(`Comment updated: ${commentId}`);
    return result.matchedCount > 0;
  }

  /**
   * Delete comment
   * 删除评论
   */
  static async deleteComment(commentId: string): Promise<boolean> {
    const result = await commentsCollection().deleteOne({ id: commentId });
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
    const userMap = await getUserMap(comments.map((comment) => comment.user_id));

    return comments.map((comment) => ({
      ...comment,
      image_urls: normalizeImageUrls(comment.image_urls),
      video_urls: normalizeVideoUrls(comment.video_urls),
      username: userMap.get(comment.user_id)?.username || '',
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
    const userMap = await getUserMap(comments.map((comment) => comment.user_id));

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

    logger.info(`Project discussion comment added: ${commentId} in project ${projectId}`);
    return commentId;
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
      logger.info(`Project discussion comment soft deleted: ${commentId}`);
      return result.matchedCount > 0;
    }

    const result = await projectCommentsCollection().deleteOne({ id: commentId });
    if (result.deletedCount === 0) {
      return false;
    }

    await this.pruneDeletedProjectDiscussionAncestor(comment.parent_comment_id ?? null);
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
    const userMap = await getUserMap(activities.map((activity) => activity.user_id));

    return activities.map((activity) => ({
      ...activity,
      username: userMap.get(activity.user_id)?.username || '',
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
