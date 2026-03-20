/**
 * Profile Routes
 * 个人资料路由
 */

import { Router } from "express";
import { ProfileController } from "../controllers/profile.controller.js";
import { authenticate, optionalAuth } from "../middleware/auth.middleware.js";

const router = Router();

// Public routes (no authentication required)
// 公开路由（无需认证）
router.get("/public-projects", optionalAuth, ProfileController.getPublicProjects);
router.get("/public-projects/:id", optionalAuth, ProfileController.getPublicProject);

// All other profile routes require authentication
// 其他个人资料路由需要认证
router.use(authenticate);

/**
 * =====================================================
 * Education Routes / 教育经历路由
 * =====================================================
 */

/**
 * @route   GET /api/profile/educations
 * @desc    Get user's education records
 * @access  Private
 */
router.get("/educations", ProfileController.getUserEducations);

/**
 * @route   POST /api/profile/educations
 * @desc    Create education record
 * @access  Private
 */
router.post("/educations", ProfileController.createEducation);

/**
 * @route   PUT /api/profile/educations/:id
 * @desc    Update education record
 * @access  Private
 */
router.put("/educations/:id", ProfileController.updateEducation);

/**
 * @route   DELETE /api/profile/educations/:id
 * @desc    Delete education record
 * @access  Private
 */
router.delete("/educations/:id", ProfileController.deleteEducation);

/**
 * =====================================================
 * Applications Routes / 申请路由
 * =====================================================
 */

/**
 * @route   GET /api/profile/applications
 * @desc    Get user's applications
 * @access  Private
 */
router.get("/applications", ProfileController.getUserApplications);

export default router;
