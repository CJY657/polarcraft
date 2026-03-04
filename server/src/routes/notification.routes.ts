/**
 * Notification Routes
 * 通知路由
 */

import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// All notification routes require authentication
router.use(authenticate);

/**
 * =====================================================
 * Notification Routes / 通知路由
 * =====================================================
 */

/**
 * @route   GET /api/notifications
 * @desc    Get user's notifications
 * @query   limit - Number of notifications to return (default: 20)
 * @query   offset - Offset for pagination (default: 0)
 * @query   unread - Filter unread only (true/false)
 * @access  Private
 */
router.get("/", NotificationController.getNotifications);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Private
 */
router.get("/unread-count", NotificationController.getUnreadCount);

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.put("/:id/read", NotificationController.markAsRead);

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put("/read-all", NotificationController.markAllAsRead);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete notification
 * @access  Private
 */
router.delete("/:id", NotificationController.deleteNotification);

export default router;
