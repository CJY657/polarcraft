/**
 * Research Routes
 * 虚拟课题组路由
 */

import { NextFunction, Request, Response, Router } from 'express';
import { ResearchController } from '../controllers/research.controller.js';
import { UploadController } from '../controllers/upload.controller.js';
import type { FileCategory } from '../config/upload.config.js';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  leadershipTransferRateLimiter,
  researchAgentRateLimiter,
} from '../middleware/rate-limit.middleware.js';
import { createUploadMiddleware, handleUploadError } from '../middleware/upload.middleware.js';
import { ProjectAccessService, type ResearchProjectAccess } from '../services/project-access.service.js';
import { logger } from '../utils/logger.js';

const router = Router();

type ProjectUploadScopePrefix = 'project-discussion' | 'project-cover' | 'project-evidence';

function buildProjectUploadScope(prefix: ProjectUploadScopePrefix, projectId: string): string {
  const sanitizedProjectId = projectId.replace(/[^a-zA-Z0-9_-]/g, '');
  return `${prefix}-${sanitizedProjectId}`;
}

function isEvidenceUploadCategory(value: string): value is FileCategory {
  return value === 'image' || value === 'video' || value === 'pdf' || value === 'pptx';
}

/**
 * Build an upload authorizer middleware: validates the project id, optionally
 * the evidence category, then checks the given access flag before scoping the
 * upload to the project. The generated middlewares replay the exact branch
 * order of the original hand-written ones.
 */
function createProjectUploadAuthorizer(options: {
  scopePrefix: ProjectUploadScopePrefix;
  hasPermission: (access: ResearchProjectAccess) => boolean;
  forbiddenMessage: string;
  requireEvidenceCategory?: boolean;
}) {
  return async function authorizeProjectUpload(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { projectId } = req.params;
      const uploadScope = buildProjectUploadScope(options.scopePrefix, projectId);

      if (!uploadScope || uploadScope === `${options.scopePrefix}-`) {
        res.error('课题标识无效', 'INVALID_PROJECT_ID', 400);
        return;
      }

      if (options.requireEvidenceCategory && !isEvidenceUploadCategory(req.params.category)) {
        res.error('证据附件类别无效', 'INVALID_CATEGORY', 400);
        return;
      }

      const access = await ProjectAccessService.getProjectAccess(projectId, req.user!.sub, req.user!.role);

      if (!access.project) {
        res.error('课题未找到', 'PROJECT_NOT_FOUND', 404);
        return;
      }

      if (!options.hasPermission(access)) {
        res.error(options.forbiddenMessage, 'FORBIDDEN', 403);
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
  };
}

const authorizeProjectDiscussionUpload = createProjectUploadAuthorizer({
  scopePrefix: 'project-discussion',
  hasPermission: (access) => access.canAccessDiscussion,
  forbiddenMessage: '无权上传课题讨论附件',
});

const authorizeProjectCoverUpload = createProjectUploadAuthorizer({
  scopePrefix: 'project-cover',
  hasPermission: (access) => access.canManage,
  forbiddenMessage: '只有组长可以上传课题封面',
});

const authorizeProjectEvidenceUpload = createProjectUploadAuthorizer({
  scopePrefix: 'project-evidence',
  hasPermission: (access) => access.canWrite,
  forbiddenMessage: '只有课题成员可以上传证据附件',
  requireEvidenceCategory: true,
});

/**
 * Build the shared upload middleware: stamps the upload start time, logs the
 * request, then streams the file through the category-scoped multer instance.
 * When `category` is given it is pinned onto req.params (cover/discussion
 * routes); otherwise the category comes from the route path (evidence route)
 * and is included in the log payload.
 */
function createScopedUploadHandler(options: { logMessage: string; category?: FileCategory }) {
  return (req: Request, res: Response, next: NextFunction): void => {
    let category: FileCategory;
    if (options.category) {
      category = options.category;
      req.params.category = options.category;
    } else {
      category = req.params.category as FileCategory;
    }

    res.locals.uploadStartedAt = Date.now();
    logger.info(options.logMessage, {
      projectId: req.params.projectId,
      ...(options.category ? {} : { category }),
      user: req.user?.username,
      ip: req.ip,
      cfRay: req.headers['cf-ray'],
      contentLength: req.headers['content-length'],
    });

    const upload = createUploadMiddleware(category);
    upload.single('file')(req, res, (err) => {
      if (err) {
        handleUploadError(err, req, res, next);
        return;
      }
      next();
    });
  };
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
 * @route   PUT /api/research/projects/:id/leadership-transfer
 * @desc    Nominate or replace a pending project leader
 * @access  Private (owner or admin)
 */
router.put(
  '/projects/:id/leadership-transfer',
  leadershipTransferRateLimiter,
  ResearchController.nominateProjectLeader
);

/**
 * @route   DELETE /api/research/projects/:id/leadership-transfer/:transferId
 * @desc    Cancel a pending leadership transfer
 * @access  Private (owner or admin)
 */
router.delete(
  '/projects/:id/leadership-transfer/:transferId',
  ResearchController.cancelProjectLeadershipTransfer
);

/**
 * @route   POST /api/research/projects/:id/leadership-transfer/:transferId/accept
 * @desc    Accept a project leadership transfer
 * @access  Private (nominee)
 */
router.post(
  '/projects/:id/leadership-transfer/:transferId/accept',
  ResearchController.acceptProjectLeadershipTransfer
);

/**
 * @route   POST /api/research/projects/:id/leadership-transfer/:transferId/decline
 * @desc    Decline a project leadership transfer
 * @access  Private (nominee)
 */
router.post(
  '/projects/:id/leadership-transfer/:transferId/decline',
  ResearchController.declineProjectLeadershipTransfer
);

/**
 * @route   DELETE /api/research/projects/:id
 * @desc    Delete project
 * @access  Private
 */
router.delete('/projects/:id', ResearchController.deleteProject);

/**
 * @route   GET /api/research/projects/:projectId/evidence
 * @desc    List project evidence
 * @access  Private
 */
router.get('/projects/:projectId/evidence', ResearchController.getProjectEvidence);

/**
 * @route   POST /api/research/projects/:projectId/evidence
 * @desc    Create project evidence
 * @access  Private
 */
router.post('/projects/:projectId/evidence', ResearchController.createProjectEvidence);

/**
 * @route   PUT /api/research/projects/:projectId/evidence/order
 * @desc    Reorder project evidence
 * @access  Private
 */
router.put('/projects/:projectId/evidence/order', ResearchController.reorderProjectEvidence);

/**
 * @route   PUT /api/research/projects/:projectId/evidence/:evidenceId
 * @desc    Update project evidence
 * @access  Private
 */
router.put('/projects/:projectId/evidence/:evidenceId', ResearchController.updateProjectEvidence);

/**
 * @route   DELETE /api/research/projects/:projectId/evidence/:evidenceId
 * @desc    Delete project evidence
 * @access  Private
 */
router.delete('/projects/:projectId/evidence/:evidenceId', ResearchController.deleteProjectEvidence);

/**
 * @route   POST /api/research/projects/:projectId/evidence-attachments/:category
 * @desc    Upload project evidence attachment
 * @access  Private
 */
router.post(
  '/projects/:projectId/evidence-attachments/:category',
  authorizeProjectEvidenceUpload,
  createScopedUploadHandler({ logMessage: 'Project evidence attachment upload started' }),
  UploadController.uploadFile
);

/**
 * =====================================================
 * Peer Review Routes / 同伴评审路由
 * =====================================================
 */

/**
 * @route   GET /api/research/projects/:projectId/reviews
 * @desc    List project peer reviews (current cycle)
 * @access  Private
 */
router.get('/projects/:projectId/reviews', ResearchController.getProjectReviews);

/**
 * @route   PUT /api/research/projects/:projectId/reviews/me
 * @desc    Create or update own peer review
 * @access  Private
 */
router.put('/projects/:projectId/reviews/me', ResearchController.upsertMyProjectReview);

/**
 * @route   DELETE /api/research/reviews/:id
 * @desc    Delete a peer review (author or admin)
 * @access  Private
 */
router.delete('/reviews/:id', ResearchController.deleteProjectReview);

/**
 * =====================================================
 * Project Task Routes / 任务分工路由
 * =====================================================
 */

/**
 * @route   GET /api/research/projects/:projectId/tasks
 * @desc    List project tasks (current cycle)
 * @access  Private
 */
router.get('/projects/:projectId/tasks', ResearchController.getProjectTasks);

/**
 * @route   POST /api/research/projects/:projectId/tasks
 * @desc    Create project task
 * @access  Private
 */
router.post('/projects/:projectId/tasks', ResearchController.createProjectTask);

/**
 * @route   PUT /api/research/tasks/:id
 * @desc    Update project task
 * @access  Private
 */
router.put('/tasks/:id', ResearchController.updateProjectTask);

/**
 * @route   DELETE /api/research/tasks/:id
 * @desc    Delete project task
 * @access  Private
 */
router.delete('/tasks/:id', ResearchController.deleteProjectTask);

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
  createScopedUploadHandler({ logMessage: 'Project cover image upload started', category: 'image' }),
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
  createScopedUploadHandler({ logMessage: 'Project discussion image upload started', category: 'image' }),
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
  createScopedUploadHandler({ logMessage: 'Project discussion video upload started', category: 'video' }),
  UploadController.uploadFile
);

/**
 * @route   PUT /api/research/discussion-comments/:id
 * @desc    Update project discussion comment (author-only)
 * @access  Private
 */
router.put('/discussion-comments/:id', ResearchController.updateProjectDiscussionComment);

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
