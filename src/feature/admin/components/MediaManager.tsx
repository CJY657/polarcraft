/**
 * Media Manager Component
 * 媒体管理组件
 *
 * Manages media resources for a course
 * 管理课程的媒体资源
 */

import { useEffect, useMemo, useState } from 'react';
import { useCourseAdminStore } from '@/stores/courseAdminStore';
import { getKnowledgeTagLabel, type CourseMedia, type KnowledgeTag, type MediaType } from '@/lib/course.service';
import { Plus, Pencil, Trash2, FileText, Image, Video, GripVertical, Upload } from 'lucide-react';
import { MediaFormDialog } from './MediaFormDialog';
import { BatchMediaUploadDialog } from './BatchMediaUploadDialog';

interface MediaManagerProps {
  courseId: string;
  unitId?: string;
  isGalleryResults?: boolean;
}

export function MediaManager({ courseId, unitId, isGalleryResults = false }: MediaManagerProps) {
  const { currentCourse, deleteMedia, deleteMediaBatch, reorderMedia, isLoading, error } =
    useCourseAdminStore();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isBatchUploadOpen, setIsBatchUploadOpen] = useState(false);
  const [editingMedia, setEditingMedia] = useState<CourseMedia | null>(null);
  const [deleteConfirmIds, setDeleteConfirmIds] = useState<string[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);

  const media = currentCourse?.media || [];
  const courseKnowledgeTag = currentCourse?.knowledgeTag || 'foundation';
  const mediaNoun = isGalleryResults ? '成果文件' : '媒体资源';
  const knowledgeTagOptions = isGalleryResults
    ? [{ value: courseKnowledgeTag as KnowledgeTag, label: getKnowledgeTagLabel(courseKnowledgeTag, true) }]
    : undefined;
  const selectedIdSet = useMemo(() => new Set(selectedMediaIds), [selectedMediaIds]);
  const allSelected = media.length > 0 && selectedMediaIds.length === media.length;
  const deleteTargetCount = deleteConfirmIds.length;
  const deleteTargetLabel = deleteTargetCount > 1 ? `${deleteTargetCount} 个${mediaNoun}` : `此${mediaNoun}`;

  useEffect(() => {
    const validIds = new Set(media.map((item) => item.id));
    setSelectedMediaIds((prev) => prev.filter((id) => validIds.has(id)));
  }, [media]);

  const handleDelete = async (mediaId: string) => {
    try {
      await deleteMedia(mediaId);
      setDeleteConfirmIds([]);
    } catch (err) {
      console.error('Failed to delete media:', err);
    }
  };

  const handleBatchDelete = async (mediaIds: string[]) => {
    try {
      if (mediaIds.length === 1) {
        await handleDelete(mediaIds[0]);
        return;
      }

      await deleteMediaBatch(mediaIds);
      setSelectedMediaIds((prev) => prev.filter((id) => !mediaIds.includes(id)));
      setDeleteConfirmIds([]);
    } catch (err) {
      console.error('Failed to delete media in batch:', err);
    }
  };

  const toggleMediaSelection = (mediaId: string) => {
    setSelectedMediaIds((prev) =>
      prev.includes(mediaId)
        ? prev.filter((id) => id !== mediaId)
        : [...prev, mediaId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedMediaIds(allSelected ? [] : media.map((item) => item.id));
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
      case 'pdf':
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
      case 'pdf':
        return 'text-red-400';
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
          管理此{isGalleryResults ? '成果' : '实验'}的{mediaNoun}。拖拽可重新排序。
        </p>
        <div className="flex items-center gap-2">
          {media.length > 0 && (
            <button
              onClick={toggleSelectAll}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {allSelected ? '取消全选' : '全选'}
            </button>
          )}
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
            添加{isGalleryResults ? '文件' : '媒体'}
          </button>
        </div>
      </div>

      {selectedMediaIds.length > 0 && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-3">
          <p className="text-sm text-cyan-100">
            已选中 {selectedMediaIds.length} 个{mediaNoun}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedMediaIds([])}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
            >
              清空选择
            </button>
            <button
              onClick={() => setDeleteConfirmIds(selectedMediaIds)}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              批量删除
            </button>
          </div>
        </div>
      )}

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
              <label className="flex items-center justify-center">
                <input
                  type="checkbox"
                  aria-label={`选择媒体 ${item.title['zh-CN'] || item.title['en-US'] || item.id}`}
                  checked={selectedIdSet.has(item.id)}
                  onChange={() => toggleMediaSelection(item.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-4 w-4 rounded border-slate-500 bg-slate-900 text-cyan-500 focus:ring-cyan-500"
                />
              </label>

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
                <span className="mt-1 inline-flex rounded-full border border-slate-600 bg-slate-700/70 px-2 py-0.5 text-xs text-slate-200">
                  {getKnowledgeTagLabel(item.knowledgeTag, true)}
                </span>
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
                  onClick={() => setDeleteConfirmIds([item.id])}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                  aria-label={`删除媒体 ${item.title['zh-CN'] || item.title['en-US'] || item.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {media.length === 0 && (
          <div className="text-center py-12 bg-slate-800/50 rounded-lg border border-slate-700">
            <p className="text-gray-400 mb-2">暂无{mediaNoun}</p>
            <button
              onClick={() => setIsCreateDialogOpen(true)}
              className="text-cyan-400 hover:text-cyan-300 text-sm"
            >
              添加您的第一个{mediaNoun}
            </button>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <MediaFormDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        courseId={courseId}
        unitId={unitId}
        courseKnowledgeTag={courseKnowledgeTag}
        knowledgeTagOptions={knowledgeTagOptions}
        isGalleryResults={isGalleryResults}
        mode="create"
      />

      {/* Batch Upload Dialog */}
      <BatchMediaUploadDialog
        isOpen={isBatchUploadOpen}
        onClose={() => setIsBatchUploadOpen(false)}
        courseId={courseId}
        unitId={unitId}
        courseKnowledgeTag={courseKnowledgeTag}
        isGalleryResults={isGalleryResults}
      />

      {/* Edit Dialog */}
      {editingMedia && (
        <MediaFormDialog
          isOpen={true}
          onClose={() => setEditingMedia(null)}
          media={editingMedia}
          unitId={unitId}
          courseKnowledgeTag={courseKnowledgeTag}
          knowledgeTagOptions={knowledgeTagOptions}
          isGalleryResults={isGalleryResults}
          mode="edit"
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirmIds.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4 border border-slate-700">
            <h3 className="text-xl font-semibold text-white mb-2">删除{isGalleryResults ? '文件' : '媒体'}？</h3>
            <p className="text-gray-400 mb-6">
              这将删除 {deleteTargetLabel}，并同时删除所有指向这些{mediaNoun}的超链接。此操作无法撤销。
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmIds([])}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => handleBatchDelete(deleteConfirmIds)}
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
