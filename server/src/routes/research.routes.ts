/**
 * Research Routes
 * 虚拟课题组路由
 */

import { NextFunction, Request, Response, Router } from 'express';
import { ResearchController } from '../controllers/research.controller.js';
import { UploadController } from '../controllers/upload.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { researchAgentRateLimiter } from '../middleware/rate-limit.middleware.js';
import { createUploadMiddleware, handleUploadError } from '../middleware/upload.middleware.js';
import { ResearchModel } from '../models/research.model.js';
import { logger } from '../utils/logger.js';

const router = Router();

function buildProjectDiscussionUploadScope(projectId: string): string {
  const sanitizedProjectId = projectId.replace(/[^a-zA-Z0-9_-]/g, '');
  return `project-discussion-${sanitizedProjectId}`;
}

function buildProjectCoverUploadScope(projectId: string): string {
  const sanitizedProjectId = projectId.replace(/[^a-zA-Z0-9_-]/g, '');
  return `project-cover-${sanitizedProjectId}`;
}

async function authorizeProjectDiscussionUpload(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { projectId } = req.params;
    const uploadScope = buildProjectDiscussionUploadScope(projectId);

    if (!uploadScope || uploadScope === 'project-discussion-') {
      res.error('课题标识无效', 'INVALID_PROJECT_ID', 400);
      return;
    }

    const access = await ResearchModel.getProjectAccess(projectId, req.user!.sub, req.user!.role);

    if (!access.project) {
      res.error('课题未找到', 'PROJECT_NOT_FOUND', 404);
      return;
    }

    if (!access.canAccessDiscussion) {
      res.error('无权上传课题讨论附件', 'FORBIDDEN', 403);
      return;
    }

    req.body = {
      ...(typeof req.body === 'object' && req.body !== null ? req.body : {}),
      unitId: uploadScope,
    };
    next();
  } catch (error) {
    next(error);
  }
}

async function authorizeProjectCoverUpload(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { projectId } = req.params;
    const uploadScope = buildProjectCoverUploadScope(projectId);

    if (!uploadScope || uploadScope === 'project-cover-') {
      res.error('课题标识无效', 'INVALID_PROJECT_ID', 400);
      return;
    }

    const access = await ResearchModel.getProjectAccess(projectId, req.user!.sub, req.user!.role);

    if (!access.project) {
      res.error('课题未找到', 'PROJECT_NOT_FOUND', 404);
      return;
    }

    if (!access.canManage) {
      res.error('只有组长可以上传课题封面', 'FORBIDDEN', 403);
      return;
    }

    req.body = {
      ...(typeof req.body === 'object' && req.body !== null ? req.body : {}),
      unitId: uploadScope,
    };
    next();
  } catch (error) {
    next(error);
  }
}

// All research routes require authentication
router.use(authenticate);

/**
 * =====================================================
 * Projects Routes / 项目路由
 * =====================================================
 */

/**
 * @route   GET /api/research/projects
 * @desc    List user's projects
 * @access  Private
 */
router.get('/projects', ResearchController.getUserProjects);

/**
 * @route   POST /api/research/projects
 * @desc    Create new project
 * @access  Private
 */
router.post('/projects', ResearchController.createProject);

/**
 * @route   GET /api/research/projects/:id
 * @desc    Get project details
 * @access  Private
 */
router.get('/projects/:id', ResearchController.getProject);

/**
 * @route   PUT /api/research/projects/:id
 * @desc    Update project
 * @access  Private
 */
router.put('/projects/:id', ResearchController.updateProject);

/**
 * @route   DELETE /api/research/projects/:id
 * @desc    Delete project
 * @access  Private
 */
router.delete('/projects/:id', ResearchController.deleteProject);

/**
 * @route   POST /api/research/projects/:id/members
 * @desc    Add member to project
 * @access  Private
 */
router.post('/projects/:id/members', ResearchController.addProjectMember);

/**
 * @route   DELETE /api/research/projects/:id/members/:userId
 * @desc    Remove member from project
 * @access  Private
 */
router.delete('/projects/:id/members/:userId', ResearchController.removeProjectMember);

/**
 * @route   GET /api/research/projects/:projectId/messages
 * @desc    List project messages
 * @access  Private
 */
router.get('/projects/:projectId/messages', ResearchController.getProjectMessages);

/**
 * @route   POST /api/research/projects/:projectId/messages
 * @desc    Send project message
 * @access  Private
 */
router.post('/projects/:projectId/messages', ResearchController.sendProjectMessage);

/**
 * @route   POST /api/research/projects/:projectId/announcements
 * @desc    Send project announcement
 * @access  Private
 */
router.post('/projects/:projectId/announcements', ResearchController.sendProjectAnnouncement);

/**
 * @route   PUT /api/research/projects/:projectId/messages/read
 * @desc    Mark project message notifications as read
 * @access  Private
 */
router.put('/projects/:projectId/messages/read', ResearchController.markProjectMessagesRead);

/**
 * @route   GET /api/research/projects/:projectId/agent/messages
 * @desc    List project AI advisor messages
 * @access  Private
 */
router.get('/projects/:projectId/agent/messages', ResearchController.getProjectAgentMessages);

/**
 * @route   DELETE /api/research/projects/:projectId/agent/messages
 * @desc    Clear project AI advisor messages
 * @access  Private
 */
router.delete('/projects/:projectId/agent/messages', ResearchController.clearProjectAgentMessages);

/**
 * @route   POST /api/research/projects/:projectId/agent/messages
 * @desc    Send project AI advisor message
 * @access  Private
 */
router.post(
  '/projects/:projectId/agent/messages',
  researchAgentRateLimiter,
  ResearchController.sendProjectAgentMessage
);

/**
 * @route   POST /api/research/projects/:projectId/cover-image
 * @desc    Upload a cover image for a research project
 * @access  Private
 */
router.post(
  '/projects/:projectId/cover-image',
  authorizeProjectCoverUpload,
  (req, res, next): void => {
    req.params.category = 'image';
    res.locals.uploadStartedAt = Date.now();
    logger.info('Project cover image upload started', {
      projectId: req.params.projectId,
      user: req.user?.username,
      ip: req.ip,
      cfRay: req.headers['cf-ray'],
      contentLength: req.headers['content-length'],
    });

    const upload = createUploadMiddleware('image');
    upload.single('file')(req, res, (err) => {
      if (err) {
        handleUploadError(err, req, res, next);
        return;
      }
      next();
    });
  },
  UploadController.uploadFile
);

/**
 * =====================================================
 * Canvases Routes / 画布路由
 * =====================================================
 */

/**
 * @route   GET /api/research/projects/:projectId/canvases
 * @desc    List project canvases
 * @access  Private
 */
router.get('/projects/:projectId/canvases', ResearchController.getProjectCanvases);

/**
 * @route   POST /api/research/projects/:projectId/canvases
 * @desc    Create canvas
 * @access  Private
 */
router.post('/projects/:projectId/canvases', ResearchController.createCanvas);

/**
 * @route   GET /api/research/canvases/:id
 * @desc    Get canvas with nodes and edges
 * @access  Private
 */
router.get('/canvases/:id', ResearchController.getCanvas);

/**
 * @route   PUT /api/research/canvases/:id
 * @desc    Update canvas
 * @access  Private
 */
router.put('/canvases/:id', ResearchController.updateCanvas);

/**
 * @route   DELETE /api/research/canvases/:id
 * @desc    Delete canvas
 * @access  Private
 */
router.delete('/canvases/:id', ResearchController.deleteCanvas);

/**
 * =====================================================
 * Nodes Routes / 节点路由
 * =====================================================
 */

/**
 * @route   POST /api/research/canvases/:canvasId/nodes
 * @desc    Create node
 * @access  Private
 */
router.post('/canvases/:canvasId/nodes', ResearchController.createNode);

/**
 * @route   GET /api/research/nodes/:id
 * @desc    Get node details
 * @access  Private
 */
router.get('/nodes/:id', ResearchController.getNode);

/**
 * @route   PUT /api/research/nodes/:id
 * @desc    Update node
 * @access  Private
 */
router.put('/nodes/:id', ResearchController.updateNode);

/**
 * @route   DELETE /api/research/nodes/:id
 * @desc    Delete node
 * @access  Private
 */
router.delete('/nodes/:id', ResearchController.deleteNode);

/**
 * @route   POST /api/research/nodes/:id/assign
 * @desc    Assign node to users
 * @access  Private
 */
router.post('/nodes/:id/assign', ResearchController.assignNode);

/**
 * =====================================================
 * Edges Routes / 边（关系）路由
 * =====================================================
 */

/**
 * @route   POST /api/research/canvases/:canvasId/edges
 * @desc    Create edge
 * @access  Private
 */
router.post('/canvases/:canvasId/edges', ResearchController.createEdge);

/**
 * @route   GET /api/research/edges/:id
 * @desc    Get edge details
 * @access  Private
 */
router.get('/edges/:id', ResearchController.getEdge);

/**
 * @route   PUT /api/research/edges/:id
 * @desc    Update edge
 * @access  Private
 */
router.put('/edges/:id', ResearchController.updateEdge);

/**
 * @route   DELETE /api/research/edges/:id
 * @desc    Delete edge
 * @access  Private
 */
router.delete('/edges/:id', ResearchController.deleteEdge);

/**
 * =====================================================
 * Comments Routes / 评论路由
 * =====================================================
 */

/**
 * @route   GET /api/research/nodes/:nodeId/comments
 * @desc    List node comments
 * @access  Private
 */
router.get('/nodes/:nodeId/comments', ResearchController.getNodeComments);

/**
 * @route   POST /api/research/nodes/:nodeId/comments
 * @desc    Add comment to node
 * @access  Private
 */
router.post('/nodes/:nodeId/comments', ResearchController.addComment);

/**
 * @route   PUT /api/research/comments/:id
 * @desc    Update comment
 * @access  Private
 */
router.put('/comments/:id', ResearchController.updateComment);

/**
 * @route   DELETE /api/research/comments/:id
 * @desc    Delete comment
 * @access  Private
 */
router.delete('/comments/:id', ResearchController.deleteComment);

/**
 * @route   GET /api/research/projects/:projectId/discussion-comments
 * @desc    List project discussion comments
 * @access  Private
 */
router.get('/projects/:projectId/discussion-comments', ResearchController.getProjectDiscussionComments);

/**
 * @route   POST /api/research/projects/:projectId/discussion-comments
 * @desc    Add project discussion comment
 * @access  Private
 */
router.post('/projects/:projectId/discussion-comments', ResearchController.addProjectDiscussionComment);

/**
 * @route   POST /api/research/projects/:projectId/discussion-images
 * @desc    Upload an image for project discussion comments
 * @access  Private
 */
router.post(
  '/projects/:projectId/discussion-images',
  authorizeProjectDiscussionUpload,
  (req, res, next): void => {
    req.params.category = 'image';
    res.locals.uploadStartedAt = Date.now();
    logger.info('Project discussion image upload started', {
      projectId: req.params.projectId,
      user: req.user?.username,
      ip: req.ip,
      cfRay: req.headers['cf-ray'],
      contentLength: req.headers['content-length'],
    });

    const upload = createUploadMiddleware('image');
    upload.single('file')(req, res, (err) => {
      if (err) {
        handleUploadError(err, req, res, next);
        return;
      }
      next();
    });
  },
  UploadController.uploadFile
);

/**
 * @route   POST /api/research/projects/:projectId/discussion-videos
 * @desc    Upload a video for project discussion comments
 * @access  Private
 */
router.post(
  '/projects/:projectId/discussion-videos',
  authorizeProjectDiscussionUpload,
  (req, res, next): void => {
    req.params.category = 'video';
    res.locals.uploadStartedAt = Date.now();
    logger.info('Project discussion video upload started', {
      projectId: req.params.projectId,
      user: req.user?.username,
      ip: req.ip,
      cfRay: req.headers['cf-ray'],
      contentLength: req.headers['content-length'],
    });

    const upload = createUploadMiddleware('video');
    upload.single('file')(req, res, (err) => {
      if (err) {
        handleUploadError(err, req, res, next);
        return;
      }
      next();
    });
  },
  UploadController.uploadFile
);

/**
 * @route   DELETE /api/research/discussion-comments/:id
 * @desc    Delete project discussion comment
 * @access  Private
 */
router.delete('/discussion-comments/:id', ResearchController.deleteProjectDiscussionComment);

/**
 * =====================================================
 * Activity Routes / 活动日志路由
 * =====================================================
 */

/**
 * @route   GET /api/research/projects/:id/activity
 * @desc    Get project activity log
 * @access  Private
 */
router.get('/projects/:id/activity', ResearchController.getProjectActivity);

/**
 * =====================================================
 * Task Board Routes / 任务看板路由
 * =====================================================
 */

/**
 * @route   GET /api/research/projects/:id/taskboard
 * @desc    Get task board
 * @access  Private
 */
router.get('/projects/:id/taskboard', ResearchController.getTaskBoard);

/**
 * @route   PUT /api/research/projects/:id/taskboard
 * @desc    Update task board
 * @access  Private
 */
router.put('/projects/:id/taskboard', ResearchController.updateTaskBoard);

/**
 * =====================================================
 * Simulation Routes / 仿真路由
 * =====================================================
 */

/**
 * @route   POST /api/research/experiments/:id/run
 * @desc    Run simulation for experiment
 * @access  Private
 */
router.post('/experiments/:id/run', ResearchController.runSimulation);

/**
 * @route   GET /api/research/experiments/:id/results
 * @desc    Get simulation results
 * @access  Private
 */
router.get('/experiments/:id/results', ResearchController.getSimulationResults);

/**
 * @route   POST /api/research/nodes/:id/attach-demo
 * @desc    Attach demo to node
 * @access  Private
 */
router.post('/nodes/:id/attach-demo', ResearchController.attachDemoToNode);

/**
 * =====================================================
 * Project Settings Routes / 项目设置路由
 * =====================================================
 */

/**
 * @route   GET /api/research/projects/:id/settings
 * @desc    Get project settings
 * @access  Private
 */
router.get('/projects/:id/settings', ResearchController.getProjectSettings);

/**
 * @route   PUT /api/research/projects/:id/settings
 * @desc    Update project settings
 * @access  Private
 */
router.put('/projects/:id/settings', ResearchController.updateProjectSettings);

/**
 * =====================================================
 * Project Applications Routes / 项目申请路由
 * =====================================================
 */

/**
 * @route   GET /api/research/projects/:id/applications
 * @desc    Get project applications
 * @access  Private
 */
router.get('/projects/:id/applications', ResearchController.getProjectApplications);

/**
 * @route   POST /api/research/projects/:id/applications
 * @desc    Create application to join project
 * @access  Private
 */
router.post('/projects/:id/applications', ResearchController.createApplication);

/**
 * @route   PUT /api/research/applications/:id/status
 * @desc    Update application status (approve/reject)
 * @access  Private
 */
router.put('/applications/:id/status', ResearchController.updateApplicationStatus);

/**
 * @route   DELETE /api/research/applications/:id
 * @desc    Withdraw application
 * @access  Private
 */
router.delete('/applications/:id', ResearchController.withdrawApplication);

/**
 * =====================================================
 * Project Creator Profile Routes / 项目创建者资料路由
 * =====================================================
 */

/**
 * @route   GET /api/research/projects/:id/creator-profiles
 * @desc    Get project creator profiles
 * @access  Private
 */
router.get('/projects/:id/creator-profiles', ResearchController.getCreatorProfiles);

/**
 * @route   POST /api/research/projects/with-profile
 * @desc    Create project with creator profile
 * @access  Private
 */
router.post('/projects/with-profile', ResearchController.createProjectWithProfile);

export default router;
