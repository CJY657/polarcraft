/**
 * Media Form Dialog
 * 媒体表单对话框
 *
 * Used for creating and editing media resources
 * 用于创建和编辑媒体资源
 */

import { useState, useEffect } from 'react';
import { useCourseAdminStore } from '@/stores/courseAdminStore';
import { CourseMedia, CreateMediaInput, UpdateMediaInput, MediaType } from '@/lib/course.service';
import { FileUpload } from '@/components/ui/FileUpload';
import { FileCategory } from '@/lib/upload.service';
import { X } from 'lucide-react';

interface MediaFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  courseId?: string;
  unitId?: string;
  mode: 'create' | 'edit';
  media?: CourseMedia;
}

const MEDIA_TYPES: { value: MediaType; label: string }[] = [
  { value: 'pptx', label: 'PowerPoint' },
  { value: 'image', label: '图片' },
  { value: 'video', label: '视频' },
];

// Helper to map MediaType to FileCategory
// 将 MediaType 映射到 FileCategory 的辅助函数
const getUploadCategory = (type: MediaType): FileCategory => {
  if (type === 'pptx') return 'pptx';
  if (type === 'image') return 'image';
  if (type === 'video') return 'video';
  return 'image';
};

export function MediaFormDialog({
  isOpen,
  onClose,
  courseId,
  unitId,
  mode,
  media,
}: MediaFormDialogProps) {
  const { createMedia, updateMedia, isLoading, error } = useCourseAdminStore();

  const [formData, setFormData] = useState({
    type: 'image' as MediaType,
    url: '',
    previewPdfUrl: '',
    title_zh: '',
    title_en: '',
    duration: '',
  });

  useEffect(() => {
    if (mode === 'edit' && media) {
      setFormData({
        type: media.type,
        url: media.url,
        previewPdfUrl: media.previewPdfUrl || '',
        title_zh: media.title['zh-CN'] || '',
        title_en: media.title['en-US'] || '',
        duration: media.duration?.toString() || '',
      });
    } else {
      setFormData({
        type: 'image',
        url: '',
        previewPdfUrl: '',
        title_zh: '',
        title_en: '',
        duration: '',
      });
    }
  }, [mode, media, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (mode === 'create' && courseId) {
        const input: CreateMediaInput = {
          type: formData.type,
          url: formData.url,
          previewPdfUrl: formData.type === 'pptx' && formData.previewPdfUrl ? formData.previewPdfUrl : undefined,
          title_zh: formData.title_zh,
          title_en: formData.title_en || undefined,
          duration: formData.duration ? parseInt(formData.duration, 10) : undefined,
        };
        await createMedia(courseId, input);
      } else if (mode === 'edit' && media) {
        const input: UpdateMediaInput = {
          type: formData.type,
          url: formData.url,
          previewPdfUrl: formData.type === 'pptx' ? formData.previewPdfUrl : '',
          title_zh: formData.title_zh,
          title_en: formData.title_en || undefined,
          duration: formData.duration ? parseInt(formData.duration, 10) : undefined,
        };
        await updateMedia(media.id, input);
      }
      onClose();
    } catch (err) {
      console.error('Failed to save media:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl p-6 max-w-lg w-full mx-4 border border-slate-700 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">
            {mode === 'create' ? '添加媒体' : '编辑媒体'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">类型 *</label>
            <div className="flex gap-2">
              {MEDIA_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: type.value })}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    formData.type === type.value
                      ? 'bg-cyan-500 text-white'
                      : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Media File */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">媒体文件 *</label>
            <FileUpload
              category={getUploadCategory(formData.type)}
              unitId={unitId}
              value={formData.url}
              onChange={(url) => setFormData({ ...formData, url })}
              onDurationChange={
                formData.type === 'video'
                  ? (duration) => setFormData({ ...formData, duration: duration.toString() })
                  : undefined
              }
              preview={formData.type === 'image'}
            />
          </div>

          {formData.type === 'pptx' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                PDF 预览文件
              </label>
              <FileUpload
                category="pdf"
                unitId={unitId}
                value={formData.previewPdfUrl}
                onChange={(url) => setFormData({ ...formData, previewPdfUrl: url })}
                preview={false}
                showUrlInput={false}
              />
              <p className="mt-1 text-xs text-gray-500">
                给 PPT 绑定一个 PDF 预览后，才能在“超链接”标签中直接拉框配置热点。
              </p>
            </div>
          )}

          {/* Title (Chinese) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              标题 (中文) *
            </label>
            <input
              type="text"
              value={formData.title_zh}
              onChange={(e) => setFormData({ ...formData, title_zh: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="媒体标题"
              required
            />
          </div>

          {/* Title (English) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              标题 (英文)
            </label>
            <input
              type="text"
              value={formData.title_en}
              onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Media Title"
            />
          </div>

          {/* Duration (for videos) */}
          {formData.type === 'video' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                时长 (秒)
              </label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="120"
                min="0"
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-500/50 text-white rounded-lg text-sm transition-colors"
            >
              {isLoading ? '保存中...' : mode === 'create' ? '添加' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
