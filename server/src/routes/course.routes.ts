/**
 * Course Routes
 * 课程管理路由
 */

import { NextFunction, Request, Response, Router } from "express";
import { CourseController } from "../controllers/course.controller.js";
import { UploadController } from "../controllers/upload.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { discussionRateLimiter } from "../middleware/rate-limit.middleware.js";
import { requireAdmin } from "../middleware/rbac.middleware.js";
import { createUploadMiddleware, handleUploadError } from "../middleware/upload.middleware.js";
import { validateCreateCourseDiscussionComment } from "../middleware/validation.middleware.js";
import { CourseModel } from "../models/course.model.js";
import { logger } from "../utils/logger.js";

const router = Router();

function buildCourseDiscussionUploadScope(courseId: string): string {
  const sanitizedCourseId = courseId.replace(/[^a-zA-Z0-9_-]/g, '');
  return `course-discussion-${sanitizedCourseId}`;
}

async function authorizeCourseDiscussionImageUpload(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const uploadScope = buildCourseDiscussionUploadScope(id);

    if (!uploadScope || uploadScope === 'course-discussion-') {
      res.error('课程标识无效', 'INVALID_COURSE_ID', 400);
      return;
    }

    const course = await CourseModel.getCourseById(id);
    if (!course) {
      res.error('课程不存在', 'COURSE_NOT_FOUND', 404);
      return;
    }

    // Any authenticated user can upload discussion images
    req.body = {
      ...(typeof req.body === 'object' && req.body !== null ? req.body : {}),
      unitId: uploadScope,
    };
    req.params.category = 'image';

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * =====================================================
 * Public Course Routes / 公开课程路由
 * =====================================================
 */

/**
 * @route   GET /api/courses/public
 * @desc    Get all courses (public, no auth required)
 * @access  Public
 */
router.get("/public", CourseController.getAllCourses);

/**
 * @route   GET /api/courses/public/:id
 * @desc    Get course by ID (public, no auth required)
 * @access  Public
 */
router.get("/public/:id", CourseController.getCourse);

/**
 * @route   GET /api/courses/public/:id/main-slide
 * @desc    Get main slide for a course (public)
 * @access  Public
 */
router.get("/public/:id/main-slide", CourseController.getMainSlide);

/**
 * @route   GET /api/courses/public/:id/media
 * @desc    Get all media for a course (public)
 * @access  Public
 */
router.get("/public/:id/media", CourseController.getMediaList);

/**
 * @route   GET /api/courses/public/:id/hyperlinks
 * @desc    Get all hyperlinks for a course (public)
 * @access  Public
 */
router.get("/public/:id/hyperlinks", CourseController.getHyperlinks);

/**
 * @route   GET /api/courses/public/:id/discussion-comments
 * @desc    Get discussion comments for a course (public)
 * @access  Public
 */
router.get("/public/:id/discussion-comments", CourseController.getDiscussionComments);

// All remaining course routes require authentication
// 所有剩余课程路由需要认证
router.use(authenticate);

/**
 * =====================================================
 * Discussion Routes / 讨论区路由
 * =====================================================
 */

/**
 * @route   POST /api/courses/:id/discussion-comments
 * @desc    Add a discussion comment for a course
 * @access  Private
 */
router.post(
  "/:id/discussion-comments",
  discussionRateLimiter,
  validateCreateCourseDiscussionComment,
  CourseController.addDiscussionComment
);

/**
 * @route   POST /api/courses/:id/discussion-images
 * @desc    Upload an image for course discussion comments
 * @access  Private
 */
router.post(
  "/:id/discussion-images",
  authorizeCourseDiscussionImageUpload,
  (req, res, next): void => {
    res.locals.uploadStartedAt = Date.now();
    logger.info('Course discussion image upload started', {
      courseId: req.params.id,
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
 * @route   DELETE /api/courses/discussion-comments/:commentId
 * @desc    Delete a discussion comment
 * @access  Private
 */
router.delete(
  "/discussion-comments/:commentId",
  CourseController.deleteDiscussionComment
);

/**
 * =====================================================
 * Course Routes / 课程路由 (Admin Only)
 * =====================================================
 */

/**
 * @route   GET /api/courses
 * @desc    Get all courses
 * @access  Private (Admin)
 */
router.get("/", requireAdmin, CourseController.getAllCourses);

/**
 * @route   GET /api/courses/:id
 * @desc    Get course by ID
 * @access  Private (Admin)
 */
router.get("/:id", requireAdmin, CourseController.getCourse);

/**
 * @route   POST /api/courses
 * @desc    Create course
 * @access  Private (Admin)
 */
router.post("/", requireAdmin, CourseController.createCourse);

/**
 * @route   PUT /api/courses/:id
 * @desc    Update course
 * @access  Private (Admin)
 */
router.put("/:id", requireAdmin, CourseController.updateCourse);

/**
 * @route   DELETE /api/courses/media
 * @desc    Batch delete media
 * @access  Private (Admin)
 */
router.delete("/media", requireAdmin, CourseController.deleteMediaBatch);

/**
 * @route   DELETE /api/courses/:id
 * @desc    Delete course
 * @access  Private (Admin)
 */
router.delete("/:id", requireAdmin, CourseController.deleteCourse);

/**
 * =====================================================
 * Main Slide Routes / 主课件路由
 * =====================================================
 */

/**
 * @route   GET /api/courses/:id/main-slide
 * @desc    Get main slide for a course
 * @access  Private (Admin)
 */
router.get("/:id/main-slide", requireAdmin, CourseController.getMainSlide);

/**
 * @route   GET /api/courses/:id/main-slide/download
 * @desc    Download main slide for a course
 * @access  Private (Admin)
 */
router.get("/:id/main-slide/download", requireAdmin, CourseController.downloadMainSlide);

/**
 * @route   PUT /api/courses/:id/main-slide
 * @desc    Create or update main slide
 * @access  Private (Admin)
 */
router.put("/:id/main-slide", requireAdmin, CourseController.upsertMainSlide);

/**
 * @route   DELETE /api/courses/:id/main-slide
 * @desc    Delete main slide
 * @access  Private (Admin)
 */
router.delete("/:id/main-slide", requireAdmin, CourseController.deleteMainSlide);

/**
 * =====================================================
 * Media Routes / 媒体资源路由
 * =====================================================
 */

/**
 * @route   GET /api/courses/:id/media
 * @desc    Get all media for a course
 * @access  Private (Admin)
 */
router.get("/:id/media", requireAdmin, CourseController.getMediaList);

/**
 * @route   POST /api/courses/:id/media
 * @desc    Create media for a course
 * @access  Private (Admin)
 */
router.post("/:id/media", requireAdmin, CourseController.createMedia);

/**
 * @route   PUT /api/courses/:id/media/reorder
 * @desc    Reorder media
 * @access  Private (Admin)
 */
router.put("/:id/media/reorder", requireAdmin, CourseController.reorderMedia);

/**
 * @route   GET /api/courses/media/:mediaId
 * @desc    Get media by ID
 * @access  Private (Admin)
 */
router.get("/media/:mediaId", requireAdmin, CourseController.getMedia);

/**
 * @route   GET /api/courses/media/:mediaId/download
 * @desc    Download media by ID
 * @access  Private (Admin)
 */
router.get("/media/:mediaId/download", requireAdmin, CourseController.downloadMedia);

/**
 * @route   PUT /api/courses/media/:mediaId
 * @desc    Update media
 * @access  Private (Admin)
 */
router.put("/media/:mediaId", requireAdmin, CourseController.updateMedia);

/**
 * @route   DELETE /api/courses/media/:mediaId
 * @desc    Delete media
 * @access  Private (Admin)
 */
router.delete("/media/:mediaId", requireAdmin, CourseController.deleteMedia);

/**
 * =====================================================
 * Hyperlink Routes / 超链接路由
 * =====================================================
 */

/**
 * @route   GET /api/courses/:id/hyperlinks
 * @desc    Get all hyperlinks for a course
 * @access  Private (Admin)
 */
router.get("/:id/hyperlinks", requireAdmin, CourseController.getHyperlinks);

/**
 * @route   GET /api/courses/:id/hyperlinks/page/:page
 * @desc    Get hyperlinks by page
 * @access  Private (Admin)
 */
router.get(
  "/:id/hyperlinks/page/:page",
  requireAdmin,
  CourseController.getHyperlinksByPage
);

/**
 * @route   POST /api/courses/:id/hyperlinks
 * @desc    Create hyperlink
 * @access  Private (Admin)
 */
router.post("/:id/hyperlinks", requireAdmin, CourseController.createHyperlink);

/**
 * @route   PUT /api/courses/hyperlinks/:hyperlinkId
 * @desc    Update hyperlink
 * @access  Private (Admin)
 */
router.put(
  "/hyperlinks/:hyperlinkId",
  requireAdmin,
  CourseController.updateHyperlink
);

/**
 * @route   DELETE /api/courses/hyperlinks/:hyperlinkId
 * @desc    Delete hyperlink
 * @access  Private (Admin)
 */
router.delete(
  "/hyperlinks/:hyperlinkId",
  requireAdmin,
  CourseController.deleteHyperlink
);

export default router;
