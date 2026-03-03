/**
 * Upload Service
 * 上传服务
 */

import { api } from './api';

export type FileCategory = 'pdf' | 'image' | 'video' | 'pptx';

export interface UploadResult {
  url: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  category: FileCategory;
  unitId: string;
}

export interface UploadConfig {
  maxFileSize: Record<string, number>;
  allowedExtensions: Record<string, string[]>;
}

export const uploadApi = {
  /**
   * Upload a file
   * 上传文件
   */
  async uploadFile(
    category: FileCategory,
    file: File,
    unitId?: string
  ): Promise<UploadResult> {
    const response = await api.upload<UploadResult>(
      `/api/upload/${category}`,
      file,
      unitId ? { unitId } : undefined
    );

    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Upload failed');
  },

  /**
   * Delete an uploaded file
   * 删除已上传的文件
   */
  async deleteFile(
    category: FileCategory,
    unitId: string,
    filename: string
  ): Promise<void> {
    const response = await api.delete(
      `/api/upload/${category}/${unitId}/${filename}`
    );
    if (!response.success) {
      throw new Error(response.error?.message || 'Delete failed');
    }
  },

  /**
   * Get upload configuration
   * 获取上传配置
   */
  async getUploadConfig(): Promise<UploadConfig> {
    const response = await api.get<UploadConfig>('/api/upload/config');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to get config');
  },
};

/**
 * Determine file category from file type
 * 根据文件类型确定文件类别
 */
export function getFileCategory(file: File): FileCategory | null {
  const mimeToCategory: Record<string, FileCategory> = {
    'application/pdf': 'pdf',
    'image/jpeg': 'image',
    'image/png': 'image',
    'image/gif': 'image',
    'image/webp': 'image',
    'video/mp4': 'video',
    'video/webm': 'video',
    'video/quicktime': 'video',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  };

  return mimeToCategory[file.type] || null;
}

/**
 * Get file category from extension
 * 根据扩展名获取文件类别
 */
export function getFileCategoryFromExtension(filename: string): FileCategory | null {
  const ext = filename.toLowerCase().split('.').pop();

  const extToCategory: Record<string, FileCategory> = {
    pdf: 'pdf',
    jpg: 'image',
    jpeg: 'image',
    png: 'image',
    gif: 'image',
    webp: 'image',
    mp4: 'video',
    webm: 'video',
    mov: 'video',
    pptx: 'pptx',
  };

  return ext ? extToCategory[ext] || null : null;
}

/**
 * Format file size for display
 * 格式化文件大小用于显示
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get accept string for file category
 * 获取文件类别的 accept 字符串
 */
export function getAcceptString(category: FileCategory): string {
  const acceptMap: Record<FileCategory, string> = {
    pdf: '.pdf',
    image: '.jpg,.jpeg,.png,.gif,.webp',
    video: '.mp4,.webm,.mov',
    pptx: '.pptx',
  };
  return acceptMap[category];
}

/**
 * Get human-readable category name
 * 获取类别的可读名称
 */
export function getCategoryName(category: FileCategory): string {
  const nameMap: Record<FileCategory, string> = {
    pdf: 'PDF',
    image: 'Image',
    video: 'Video',
    pptx: 'PowerPoint',
  };
  return nameMap[category];
}
