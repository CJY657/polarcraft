/**
 * Research Routes
 * 虚拟课题组路由
 */

import { Router } from 'express';
import { ResearchController } from '../controllers/research.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

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
