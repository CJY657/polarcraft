/**
 * Unit Routes
 * 单元管理路由
 */

import { Router } from "express";
import { UnitController } from "../controllers/unit.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/rbac.middleware.js";

const router = Router();

/**
 * =====================================================
 * Public Unit Routes / 公开单元路由
 * =====================================================
 */

/**
 * @route   GET /api/units/public
 * @desc    Get all units (public, no auth required)
 * @access  Public
 */
router.get("/public", UnitController.getPublicUnits);

/**
 * @route   GET /api/units/public/:id
 * @desc    Get unit by ID (public, no auth required)
 * @access  Public
 */
router.get("/public/:id", UnitController.getPublicUnit);

/**
 * @route   GET /api/units/public/:id/main-slide
 * @desc    Get main slide for a unit (public)
 * @access  Public
 */
router.get("/public/:id/main-slide", UnitController.getPublicMainSlide);

/**
 * @route   GET /api/units/public/:id/courses
 * @desc    Get all courses for a unit (public)
 * @access  Public
 */
router.get("/public/:id/courses", UnitController.getPublicUnitCourses);

// All remaining unit routes require authentication
// 所有剩余单元路由需要认证
router.use(authenticate);

/**
 * =====================================================
 * Unit Routes / 单元路由 (Admin Only)
 * =====================================================
 */

/**
 * @route   GET /api/units
 * @desc    Get all units
 * @access  Private (Admin)
 */
router.get("/", requireAdmin, UnitController.getAllUnits);

/**
 * @route   PUT /api/units/reorder
 * @desc    Reorder units
 * @access  Private (Admin)
 */
router.put("/reorder", requireAdmin, UnitController.reorderUnits);

/**
 * @route   GET /api/units/:id
 * @desc    Get unit by ID
 * @access  Private (Admin)
 */
router.get("/:id", requireAdmin, UnitController.getUnit);

/**
 * @route   POST /api/units
 * @desc    Create unit
 * @access  Private (Admin)
 */
router.post("/", requireAdmin, UnitController.createUnit);

/**
 * @route   PUT /api/units/:id
 * @desc    Update unit
 * @access  Private (Admin)
 */
router.put("/:id", requireAdmin, UnitController.updateUnit);

/**
 * @route   DELETE /api/units/:id
 * @desc    Delete unit
 * @access  Private (Admin)
 */
router.delete("/:id", requireAdmin, UnitController.deleteUnit);

/**
 * =====================================================
 * Main Slide Routes / 主课件路由
 * =====================================================
 */

/**
 * @route   GET /api/units/:id/main-slide
 * @desc    Get main slide for a unit
 * @access  Private (Admin)
 */
router.get("/:id/main-slide", requireAdmin, UnitController.getMainSlide);

/**
 * @route   PUT /api/units/:id/main-slide
 * @desc    Create or update main slide
 * @access  Private (Admin)
 */
router.put("/:id/main-slide", requireAdmin, UnitController.upsertMainSlide);

/**
 * @route   DELETE /api/units/:id/main-slide
 * @desc    Delete main slide
 * @access  Private (Admin)
 */
router.delete("/:id/main-slide", requireAdmin, UnitController.deleteMainSlide);

/**
 * =====================================================
 * Unit Courses Routes / 单元课程路由
 * =====================================================
 */

/**
 * @route   GET /api/units/:id/courses
 * @desc    Get all courses for a unit
 * @access  Private (Admin)
 */
router.get("/:id/courses", requireAdmin, UnitController.getUnitCourses);

export default router;
