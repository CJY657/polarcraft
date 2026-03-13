/**
 * Media Manager Component
 * 媒体管理组件
 *
 * Manages media resources for a course
 * 管理课程的媒体资源
 */

import { useState } from 'react';
import { useCourseAdminStore } from '@/stores/courseAdminStore';
import { CourseMedia, MediaType } from '@/lib/course.service';
import { Plus, Pencil, Trash2, FileText, Image, Video, GripVertical, Upload } from 'lucide-react';
import { MediaFormDialog } from './MediaFormDialog';
import { BatchMediaUploadDialog } from './BatchMediaUploadDialog';

interface MediaManagerProps {
  courseId: string;
  unitId?: string;
}

export function MediaManager({ courseId, unitId }: MediaManagerProps) {
  const { currentCourse, deleteMedia, reorderMedia, isLoading, error } =
    useCourseAdminStore();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isBatchUploadOpen, setIsBatchUploadOpen] = useState(false);
  const [editingMedia, setEditingMedia] = useState<CourseMedia | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const media = currentCourse?.media || [];

  const handleDelete = async (mediaId: string) => {
    try {
      await deleteMedia(mediaId);
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Failed to delete media:', err);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newMedia = [...media];
    const draggedItem = newMedia[draggedIndex];
    newMedia.splice(draggedIndex, 1);
    newMedia.splice(index, 0, draggedItem);

    // Update sort order locally
    const updatedMedia = newMedia.map((m, i) => ({ ...m, sortOrder: i }));

    // Optimistic update
    useCourseAdminStore.setState((state) => ({
      currentCourse: state.currentCourse
        ? { ...state.currentCourse, media: updatedMedia }
        : null,
    }));

    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex !== null) {
      const mediaIds = media.map((m) => m.id);
      try {
        await reorderMedia(courseId, mediaIds);
      } catch (err) {
        console.error('Failed to reorder media:', err);
      }
    }
    setDraggedIndex(null);
  };

  const getMediaIcon = (type: MediaType) => {
    switch (type) {
      case 'pptx':
        return <FileText className="w-5 h-5" />;
      case 'image':
        return <Image className="w-5 h-5" />;
      case 'video':
        return <Video className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: MediaType) => {
    switch (type) {
      case 'pptx':
        return 'text-orange-400';
      case 'image':
        return 'text-green-400';
      case 'video':
        return 'text-blue-400';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-gray-400">
          管理此实验的媒体资源。拖拽可重新排序。
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBatchUploadOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Upload className="w-4 h-4" />
            批量上传
          </button>
          <button
            onClick={() => setIsCreateDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            添加媒体
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <span className="text-red-400 text-sm">{error}</span>
        </div>
      )}

      {/* Media List */}
      <div className="space-y-2">
        {media.map((item, index) => (
          <div
            key={item.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition-colors cursor-move ${
              draggedIndex === index ? 'opacity-50' : ''
            }`}
          >
            <div className="flex items-center gap-4">
              {/* Drag Handle */}
              <div className="text-gray-500">
                <GripVertical className="w-5 h-5" />
              </div>

              {/* Type Icon */}
              <div className={getTypeColor(item.type)}>{getMediaIcon(item.type)}</div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-medium truncate">
                  {item.title['zh-CN']}
                  {item.title['en-US'] && (
                    <span className="text-gray-400 text-sm ml-2">({item.title['en-US']})</span>
                  )}
                </h4>
                <p className="text-gray-400 text-sm truncate">{item.url}</p>
              </div>

              {/* Duration (for videos) */}
              {item.duration && (
                <div className="text-gray-400 text-sm">{item.duration}s</div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingMedia(item)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteConfirmId(item.id)}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {media.length === 0 && (
          <div className="text-center py-12 bg-slate-800/50 rounded-lg border border-slate-700">
            <p className="text-gray-400 mb-2">暂无媒体资源</p>
            <button
              onClick={() => setIsCreateDialogOpen(true)}
              className="text-cyan-400 hover:text-cyan-300 text-sm"
            >
              添加您的第一个媒体资源
            </button>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <MediaFormDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        courseId={courseId}
        mode="create"
      />

      {/* Batch Upload Dialog */}
      <BatchMediaUploadDialog
        isOpen={isBatchUploadOpen}
        onClose={() => setIsBatchUploadOpen(false)}
        courseId={courseId}
        unitId={unitId}
      />

      {/* Edit Dialog */}
      {editingMedia && (
        <MediaFormDialog
          isOpen={true}
          onClose={() => setEditingMedia(null)}
          media={editingMedia}
          mode="edit"
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4 border border-slate-700">
            <h3 className="text-xl font-semibold text-white mb-2">删除媒体？</h3>
            <p className="text-gray-400 mb-6">
              这将同时删除指向此媒体的所有超链接。此操作无法撤销。
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={isLoading}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white rounded-lg text-sm transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
