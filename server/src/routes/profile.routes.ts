/**
 * Profile Routes
 * 个人资料路由
 */

import { Router } from "express";
import { ProfileController } from "../controllers/profile.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// All profile routes require authentication
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

/**
 * =====================================================
 * Public Projects Routes / 公开项目路由
 * =====================================================
 */

/**
 * @route   GET /api/profile/public-projects
 * @desc    Get public projects list
 * @access  Private
 */
router.get("/public-projects", ProfileController.getPublicProjects);

export default router;
