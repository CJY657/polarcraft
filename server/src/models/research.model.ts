/**
 * Research Model
 * 虚拟课题组数据模型
 */

import { getCollection } from '../database/connection.js';
import { compareRole, normalizeDocument, normalizeDocuments, pickDefined } from '../database/mongo.util.js';
import { generateId } from '../utils/crypto.util.js';
import { logger } from '../utils/logger.js';

const researchProjectsCollection = () => getCollection('research_projects');
const projectMembersCollection = () => getCollection('research_project_members');
const canvasesCollection = () => getCollection('research_canvases');
const nodesCollection = () => getCollection('research_nodes');
const edgesCollection = () => getCollection('research_edges');
const commentsCollection = () => getCollection('research_node_comments');
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

export class ResearchModel {
  /**
   * Get projects by user ID
   * 获取用户的项目列表
   */
  static async getUserProjects(userId: string): Promise<any[]> {
    const memberships = normalizeDocuments<{ project_id: string }>(
      await projectMembersCollection().find({ user_id: userId }).project({ _id: 0, project_id: 1 }).toArray()
    );
    const memberProjectIds = memberships.map((membership) => membership.project_id);
    const projectFilter = memberProjectIds.length > 0
      ? { $or: [{ id: { $in: memberProjectIds } }, { is_public: true }] }
      : { is_public: true };

    const projects = normalizeDocuments<any>(
      await researchProjectsCollection().find(projectFilter).sort({ updated_at: -1 }).toArray()
    );
    if (projects.length === 0) {
      return [];
    }

    const projectIds = projects.map((project) => project.id);
    const [members, canvases] = await Promise.all([
      normalizeDocuments<{ project_id: string; user_id: string }>(
        await projectMembersCollection().find({ project_id: { $in: projectIds } }).toArray()
      ),
      normalizeDocuments<{ id: string; project_id: string }>(
        await canvasesCollection().find({ project_id: { $in: projectIds } }).toArray()
      ),
    ]);

    const memberCountMap = new Map<string, number>();
    const canvasCountMap = new Map<string, number>();

    for (const member of members) {
      memberCountMap.set(member.project_id, (memberCountMap.get(member.project_id) ?? 0) + 1);
    }

    for (const canvas of canvases) {
      canvasCountMap.set(canvas.project_id, (canvasCountMap.get(canvas.project_id) ?? 0) + 1);
    }

    return projects.map((project) => ({
      ...project,
      member_count: memberCountMap.get(project.id) ?? 0,
      canvas_count: canvasCountMap.get(project.id) ?? 0,
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
      projectMembersCollection().countDocuments({ project_id: projectId }),
      canvasesCollection().countDocuments({ project_id: projectId }),
    ]);

    return {
      ...project,
      member_count: memberCount,
      canvas_count: canvasCount,
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
    role: string = 'viewer'
  ): Promise<boolean> {
    const existing = normalizeDocument<any>(
      await projectMembersCollection().findOne({ project_id: projectId, user_id: userId })
    );

    if (existing) {
      await projectMembersCollection().updateOne(
        { project_id: projectId, user_id: userId },
        { $set: { role } }
      );
    } else {
      await projectMembersCollection().insertOne({
        id: generateId(),
        project_id: projectId,
        user_id: userId,
        role,
        joined_at: new Date(),
      });
    }

    logger.info(`Member added to project: ${projectId} - ${userId} as ${role}`);
    return true;
  }

  /**
   * Remove project member
   * 移除项目成员
   */
  static async removeProjectMember(projectId: string, userId: string): Promise<boolean> {
    const result = await projectMembersCollection().deleteOne({ project_id: projectId, user_id: userId });
    logger.info(`Member removed from project: ${projectId} - ${userId}`);
    return result.deletedCount > 0;
  }

  /**
   * Get project members
   * 获取项目成员列表
   */
  static async getProjectMembers(projectId: string): Promise<any[]> {
    const members = normalizeDocuments<any>(
      await projectMembersCollection().find({ project_id: projectId }).toArray()
    ).sort(sortMembers);
    const userMap = await getUserMap(members.map((member) => member.user_id));

    return members.map((member) => ({
      ...member,
      username: userMap.get(member.user_id)?.username || '',
      avatar_url: userMap.get(member.user_id)?.avatar_url || null,
    }));
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
