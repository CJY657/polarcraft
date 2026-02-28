/**
 * Research Controller
 * 虚拟课题组控制器
 *
 * Handles research system HTTP requests
 * 处理虚拟课题组系统的 HTTP 请求
 */

import { Request, Response } from 'express';
import { ResearchModel } from '../models/research.model.js';
import { ProfileModel } from '../models/profile.model.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { logger } from '../utils/logger.js';

export class ResearchController {
  // ============================================================
  // Projects / 项目
  // ============================================================

  /**
   * Get user's projects
   * 获取用户的项目列表
   */
  static getUserProjects = asyncHandler(async (req: Request, res: Response) => {
    const projects = await ResearchModel.getUserProjects(req.user!.sub);
    res.success(projects);
  });

  /**
   * Get project by ID
   * 获取项目详情
   */
  static getProject = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const project = await ResearchModel.getProjectById(id);

    if (!project) {
      return res.error('项目未找到', 'PROJECT_NOT_FOUND', 404);
    }

    // Get members
    const members = await ResearchModel.getProjectMembers(id);
    res.success({ ...project, members });
  });

  /**
   * Create project
   * 创建项目
   */
  static createProject = asyncHandler(async (req: Request, res: Response) => {
    const { name_zh, name_en, description_zh, description_en, is_public } = req.body;
    const projectId = await ResearchModel.createProject(
      { name_zh, name_en, description_zh, description_en, is_public },
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
    const updated = await ResearchModel.updateProject(id, req.body);

    if (!updated) {
      return res.error('项目未找到', 'PROJECT_NOT_FOUND', 404);
    }

    const project = await ResearchModel.getProjectById(id);
    logger.info(`Project updated by user ${req.user!.username}: ${id}`);
    res.success(project, '项目更新成功');
  });

  /**
   * Delete project
   * 删除项目
   */
  static deleteProject = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await ResearchModel.deleteProject(id);
    logger.info(`Project deleted by user ${req.user!.username}: ${id}`);
    res.success(null, '项目删除成功');
  });

  /**
   * Add project member
   * 添加项目成员
   */
  static addProjectMember = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { userId, role = 'viewer' } = req.body;

    await ResearchModel.addProjectMember(id, userId, role);
    logger.info(`Member added to project ${id} by ${req.user!.username}: ${userId}`);
    res.success(null, '成员添加成功');
  });

  /**
   * Remove project member
   * 移除项目成员
   */
  static removeProjectMember = asyncHandler(async (req: Request, res: Response) => {
    const { id, userId } = req.params;

    await ResearchModel.removeProjectMember(id, userId);
    logger.info(`Member removed from project ${id} by ${req.user!.username}: ${userId}`);
    res.success(null, '成员移除成功');
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
    const canvases = await ResearchModel.getProjectCanvases(projectId);
    res.success(canvases);
  });

  /**
   * Get canvas with nodes and edges
   * 获取画布详情（包含节点和边）
   */
  static getCanvas = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const canvas = await ResearchModel.getCanvasById(id);

    if (!canvas) {
      return res.error('画布未找到', 'CANVAS_NOT_FOUND', 404);
    }

    res.success(canvas);
  });

  /**
   * Create canvas
   * 创建画布
   */
  static createCanvas = asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.params;
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
    const nodeId = await ResearchModel.createNode(canvasId, req.body, req.user!.sub);

    // Log activity
    const canvas = await ResearchModel.getCanvasById(canvasId);
    await ResearchModel.logActivity(
      canvas!.project_id,
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
    const node = await ResearchModel.getNodeById(id);

    if (!node) {
      return res.error('节点未找到', 'NODE_NOT_FOUND', 404);
    }

    res.success(node);
  });

  /**
   * Update node
   * 更新节点
   */
  static updateNode = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
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

    // Get canvas for activity logging
    const node = await ResearchModel.getNodeById(id);
    const canvas = await ResearchModel.getCanvasById(node!.canvas_id);

    await ResearchModel.deleteNode(id);

    // Log activity
    await ResearchModel.logActivity(
      canvas!.project_id,
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
    const edgeId = await ResearchModel.createEdge(canvasId, req.body, req.user!.sub);

    // Log activity
    const canvas = await ResearchModel.getCanvasById(canvasId);
    await ResearchModel.logActivity(
      canvas!.project_id,
      req.user!.sub,
      'create_edge',
      'edge',
      edgeId,
      { type: req.body.type, source: req.body.source, target: req.body.target }
    );

    const edge = await queryOne('SELECT * FROM research_edges WHERE id = ?', [edgeId]);
    logger.info(`Edge created by user ${req.user!.username}: ${edgeId}`);
    res.success(edge, '关系创建成功', 201);
  });

  /**
   * Get edge
   * 获取边
   */
  static getEdge = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const edge = await queryOne('SELECT * FROM research_edges WHERE id = ?', [id]);

    if (!edge) {
      return res.error('关系未找到', 'EDGE_NOT_FOUND', 404);
    }

    res.success(edge);
  });

  /**
   * Update edge
   * 更新边
   */
  static updateEdge = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await ResearchModel.updateEdge(id, req.body);

    const edge = await queryOne('SELECT * FROM research_edges WHERE id = ?', [id]);
    logger.info(`Edge updated by user ${req.user!.username}: ${id}`);
    res.success(edge, '关系更新成功');
  });

  /**
   * Delete edge
   * 删除边
   */
  static deleteEdge = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
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
    await ResearchModel.deleteComment(id);
    logger.info(`Comment ${id} deleted by user ${req.user!.username}`);
    res.success(null, '评论删除成功');
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
    const taskBoard = await ResearchModel.getTaskBoard(id);
    res.success(taskBoard);
  });

  /**
   * Update task board (placeholder for now)
   * 更新任务看板（暂未实现）
   */
  static updateTaskBoard = asyncHandler(async (req: Request, res: Response) => {
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
    const settings = await ProfileModel.getOrCreateProjectSettings(id);
    res.success(settings);
  });

  /**
   * Update project settings
   * 更新项目设置
   */
  static updateProjectSettings = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
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

    try {
      const applicationId = await ProfileModel.createApplication(id, userId, req.body);
      const application = await ProfileModel.getApplicationById(applicationId);
      logger.info(`Application created by user ${req.user!.username}: ${applicationId}`);

      // If no approval required, auto-approve
      if (!settings.require_approval) {
        await ProfileModel.updateApplicationStatus(applicationId, 'approved', userId);
        await ResearchModel.addProjectMember(id, userId, 'viewer');
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

    // Check if user is project owner/admin
    const members = await ResearchModel.getProjectMembers(application.project_id);
    const reviewer = members.find((m: any) => m.user_id === reviewerId);
    if (!reviewer || !['owner', 'admin'].includes(reviewer.role)) {
      return res.error('无权处理该申请', 'FORBIDDEN', 403);
    }

    await ProfileModel.updateApplicationStatus(id, status, reviewerId, review_notes);

    // If approved, add to project members
    if (status === 'approved') {
      await ResearchModel.addProjectMember(application.project_id, application.user_id, 'editor');
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

// Helper function for queries
async function queryOne(sql: string, params: any[]): Promise<any> {
  const { query } = await import('../database/connection.js');
  const results = await query(sql, params);
  return results.length > 0 ? results[0] : null;
}
