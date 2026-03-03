/**
 * Batch Media Upload Dialog
 * 批量媒体上传对话框
 *
 * Supports uploading multiple files of different types at once
 * 支持同时上传多个不同类型的文件
 */

import { useState, useCallback, useRef } from 'react';
import { useCourseAdminStore } from '@/stores/courseAdminStore';
import { MediaType, CreateMediaInput } from '@/lib/course.service';
import { uploadApi, getFileCategory, FileCategory } from '@/lib/upload.service';
import { X, Upload, Loader2, CheckCircle, AlertCircle, File, Image, Video, FileText } from 'lucide-react';
import { cn } from '@/utils/classNames';

interface FileUploadItem {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  url?: string;
  duration?: number;
  error?: string;
  title_zh: string;
  type: MediaType;
}

interface BatchMediaUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  unitId?: string;
}

const ACCEPT_ALL_MEDIA = '.jpg,.jpeg,.png,.gif,.webp,.mp4,.webm,.mov,.pptx,.ppt';

const TYPE_ICONS: Record<MediaType, typeof File> = {
  image: Image,
  video: Video,
  pptx: FileText,
};

const getMediaTypeFromFile = (file: File): MediaType | null => {
  const category = getFileCategory(file);
  if (category === 'image') return 'image';
  if (category === 'video') return 'video';
  if (category === 'pptx') return 'pptx';
  return null;
};

const readVideoDuration = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      const duration = video.duration;
      URL.revokeObjectURL(video.src);
      resolve(Math.round(duration));
    };
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      resolve(0);
    };
    video.src = URL.createObjectURL(file);
  });
};

export function BatchMediaUploadDialog({
  isOpen,
  onClose,
  courseId,
  unitId,
}: BatchMediaUploadDialogProps) {
  const { createMedia } = useCourseAdminStore();
  const [files, setFiles] = useState<FileUploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((selectedFiles: FileList) => {
    const newFiles: FileUploadItem[] = [];

    Array.from(selectedFiles).forEach((file) => {
      const mediaType = getMediaTypeFromFile(file);
      if (mediaType) {
        newFiles.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          status: 'pending',
          progress: 0,
          title_zh: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
          type: mediaType,
        });
      }
    });

    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files);
    }
    e.target.value = '';
  };

  const updateFile = (id: string, updates: Partial<FileUploadItem>) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const updateFileTitle = (id: string, title: string) => {
    updateFile(id, { title_zh: title });
  };

  const uploadFile = async (item: FileUploadItem): Promise<void> => {
    try {
      updateFile(item.id, { status: 'uploading', progress: 10 });

      // Read video duration if applicable
      let duration: number | undefined;
      if (item.type === 'video') {
        duration = await readVideoDuration(item.file);
        updateFile(item.id, { duration, progress: 30 });
      }

      // Upload file
      updateFile(item.id, { progress: 40 });
      const category: FileCategory = item.type === 'pptx' ? 'pptx' : item.type;
      const result = await uploadApi.uploadFile(category, item.file, unitId);
      updateFile(item.id, { progress: 70, url: result.url });

      // Create media record
      const input: CreateMediaInput = {
        type: item.type,
        url: result.url,
        title_zh: item.title_zh,
        duration: duration,
      };
      await createMedia(courseId, input);
      updateFile(item.id, { status: 'success', progress: 100 });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      updateFile(item.id, { status: 'error', error: message });
    }
  };

  const handleUploadAll = async () => {
    setIsUploading(true);
    const pendingFiles = files.filter((f) => f.status === 'pending');

    // Upload files sequentially to avoid overwhelming the server
    for (const file of pendingFiles) {
      await uploadFile(file);
    }

    setIsUploading(false);
  };

  const handleClose = () => {
    if (!isUploading) {
      setFiles([]);
      onClose();
    }
  };

  const pendingCount = files.filter((f) => f.status === 'pending').length;
  const successCount = files.filter((f) => f.status === 'success').length;
  const errorCount = files.filter((f) => f.status === 'error').length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl p-6 max-w-2xl w-full mx-4 border border-slate-700 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">批量上传媒体</h3>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drop Zone */}
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center transition-colors mb-4',
            dragOver
              ? 'border-cyan-500 bg-cyan-500/10'
              : 'border-slate-600 hover:border-slate-500'
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !isUploading && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT_ALL_MEDIA}
            multiple
            onChange={handleInputChange}
            disabled={isUploading}
            className="hidden"
          />
          <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-400 mb-2">
            拖放文件到此处或点击选择
          </p>
          <p className="text-xs text-gray-500">
            支持: 图片、视频、PowerPoint
          </p>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="flex-1 overflow-y-auto space-y-2 mb-4">
            {files.map((item) => {
              const Icon = TYPE_ICONS[item.type];
              return (
                <div
                  key={item.id}
                  className="bg-slate-700/50 rounded-lg p-3 flex items-center gap-3"
                >
                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    {item.status === 'pending' && (
                      <Icon className="w-8 h-8 text-gray-400" />
                    )}
                    {item.status === 'uploading' && (
                      <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                    )}
                    {item.status === 'success' && (
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    )}
                    {item.status === 'error' && (
                      <AlertCircle className="w-8 h-8 text-red-500" />
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    {item.status === 'pending' ? (
                      <input
                        type="text"
                        value={item.title_zh}
                        onChange={(e) => updateFileTitle(item.id, e.target.value)}
                        className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm mb-1"
                        placeholder="标题"
                        disabled={isUploading}
                      />
                    ) : (
                      <p className="text-white text-sm truncate">{item.title_zh}</p>
                    )}
                    <p className="text-xs text-gray-400 truncate">
                      {item.file.name} ({(item.file.size / 1024).toFixed(1)} KB)
                    </p>
                    {item.error && (
                      <p className="text-xs text-red-400">{item.error}</p>
                    )}
                    {item.duration && (
                      <p className="text-xs text-cyan-400">
                        时长: {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}
                      </p>
                    )}
                  </div>

                  {/* Progress */}
                  {item.status === 'uploading' && (
                    <div className="flex-shrink-0 w-16">
                      <div className="h-2 bg-slate-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-500 transition-all"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 text-center mt-1">
                        {item.progress}%
                      </p>
                    </div>
                  )}

                  {/* Remove Button */}
                  {item.status === 'pending' && !isUploading && (
                    <button
                      onClick={() => removeFile(item.id)}
                      className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Stats */}
        {files.length > 0 && (
          <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
            <span>总计: {files.length}</span>
            {successCount > 0 && (
              <span className="text-green-400">成功: {successCount}</span>
            )}
            {errorCount > 0 && (
              <span className="text-red-400">失败: {errorCount}</span>
            )}
            {pendingCount > 0 && (
              <span>等待中: {pendingCount}</span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {successCount > 0 && pendingCount === 0 ? '完成' : '取消'}
          </button>
          {pendingCount > 0 && (
            <button
              onClick={handleUploadAll}
              disabled={isUploading}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-500/50 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  上传中...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  上传 {pendingCount} 个文件
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
