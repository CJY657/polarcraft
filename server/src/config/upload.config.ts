/**
 * Upload Configuration
 * 上传配置
 */

import { appPaths } from './paths.js';

export type FileCategory = 'pdf' | 'image' | 'video' | 'pptx';

export const uploadConfig = {
  // Storage path - relative to project root
  // 存储路径 - 相对于项目根目录
  uploadDir: appPaths.uploadCoursesDir,

  // Public URL prefix for accessing uploaded files
  // 访问上传文件的公共 URL 前缀
  publicUrlPrefix: process.env.UPLOAD_PUBLIC_URL_PREFIX || '/uploads/courses',

  // File size limits (in bytes)
  // 文件大小限制（字节）
  maxFileSize: {
    pdf: 100 * 1024 * 1024,      // 100MB for PDFs
    image: 10 * 1024 * 1024,     // 10MB for images
    video: 500 * 1024 * 1024,    // 500MB for videos
    pptx: 100 * 1024 * 1024,     // 100MB for PowerPoint
    default: 50 * 1024 * 1024,   // 50MB default
  },

  // Allowed MIME types by category
  // 按类别允许的 MIME 类型
  allowedMimeTypes: {
    pdf: ['application/pdf'],
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    video: ['video/mp4', 'video/webm', 'video/quicktime'],
    pptx: [
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint.presentation.macroEnabled.12',
    ],
  },

  // File extensions for validation
  // 用于验证的文件扩展名
  allowedExtensions: {
    pdf: ['.pdf'],
    image: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    video: ['.mp4', '.webm', '.mov'],
    pptx: ['.pptx', '.ppt'],
  },
};

/**
 * Validate if a category is valid
 * 验证类别是否有效
 */
export function isValidCategory(category: string): category is FileCategory {
  return ['pdf', 'image', 'video', 'pptx'].includes(category);
}

/**
 * Get file extension from mimetype
 * 从 MIME 类型获取文件扩展名
 */
export function getExtensionFromMime(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'application/pdf': '.pdf',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'video/quicktime': '.mov',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
    'application/vnd.ms-powerpoint.presentation.macroEnabled.12': '.pptm',
  };
  return mimeToExt[mimeType] || '';
}
