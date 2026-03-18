/**
 * File Upload Component
 * 文件上传组件
 *
 * A reusable file upload component with drag & drop support
 * 支持拖拽上传的可复用文件上传组件
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, File, Image, Video, FileText, Loader2 } from 'lucide-react';
import {
  uploadApi,
  getFileCategory,
  getAcceptString,
  FileCategory,
  formatFileSize,
} from '@/lib/upload.service';
import { cn } from '@/utils/classNames';

interface FileUploadProps {
  category: FileCategory;
  unitId?: string;
  value?: string;
  onChange: (url: string) => void;
  /** Callback when video duration is read (in seconds) */
  onDurationChange?: (duration: number) => void;
  accept?: string;
  disabled?: boolean;
  className?: string;
  preview?: boolean;
  showUrlInput?: boolean;
}

const ICON_MAP: Record<FileCategory, typeof File> = {
  pdf: FileText,
  image: Image,
  video: Video,
  pptx: File,
};

export function FileUpload({
  category,
  unitId,
  value,
  onChange,
  onDurationChange,
  accept,
  disabled,
  className = '',
  preview = true,
  showUrlInput = true,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [maxFileSize, setMaxFileSize] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const Icon = ICON_MAP[category];
  const acceptTypes = accept || getAcceptString(category);

  useEffect(() => {
    let cancelled = false;

    uploadApi
      .getUploadConfig()
      .then((config) => {
        const size = config.maxFileSize[category];
        if (!cancelled && typeof size === 'number') {
          setMaxFileSize(size);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMaxFileSize(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [category]);

  /**
   * Read video duration from file
   * 从文件读取视频时长
   */
  const readVideoDuration = useCallback(
    (file: File): Promise<number | null> => {
      return new Promise((resolve) => {
        if (category !== 'video' || !onDurationChange) {
          resolve(null);
          return;
        }

        const video = document.createElement('video');
        video.preload = 'metadata';

        video.onloadedmetadata = () => {
          const duration = video.duration;
          URL.revokeObjectURL(video.src);
          resolve(duration);
        };

        video.onerror = () => {
          URL.revokeObjectURL(video.src);
          resolve(null);
        };

        video.src = URL.createObjectURL(file);
      });
    },
    [category, onDurationChange]
  );

  const handleFileSelect = useCallback(
    async (file: File) => {
      // Validate category
      const detectedCategory = getFileCategory(file);
      if (detectedCategory !== category) {
        setError(
          `Invalid file type. Expected ${category}, got ${detectedCategory || 'unknown'}`
        );
        return;
      }

      if (maxFileSize !== null && file.size > maxFileSize) {
        setError(`文件大小超出限制，当前类别最大允许 ${formatFileSize(maxFileSize)}`);
        return;
      }

      setIsUploading(true);
      setError(null);

      try {
        // Read video duration before upload
        const duration = await readVideoDuration(file);
        if (duration !== null && onDurationChange) {
          onDurationChange(Math.round(duration));
        }

        const result = await uploadApi.uploadFile(category, file, unitId);
        onChange(result.url);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setIsUploading(false);
      }
    },
    [category, maxFileSize, unitId, onChange, readVideoDuration, onDurationChange]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
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

  const handleClear = () => {
    onChange('');
    setError(null);
  };

  const isImageWithPreview = preview && category === 'image' && value;

  return (
    <div className={cn('space-y-2', className)}>
      {/* Upload Area */}
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-4 text-center transition-colors',
          dragOver
            ? 'border-cyan-500 bg-cyan-500/10'
            : 'border-slate-600 hover:border-slate-500',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && !isUploading && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptTypes}
          onChange={handleInputChange}
          disabled={disabled || isUploading}
          className="hidden"
        />

        {isUploading ? (
          <div className="flex items-center justify-center gap-2 py-2">
            <Loader2 className="w-5 h-5 animate-spin text-cyan-500" />
            <span className="text-gray-400">Uploading...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 py-2">
            <Upload className="w-5 h-5 text-gray-400" />
            <span className="text-gray-400">Drag & drop or click to upload</span>
          </div>
        )}

        <p className="text-xs text-gray-500 mt-1">
          Accepted: {acceptTypes}
          {maxFileSize !== null ? ` · Max ${formatFileSize(maxFileSize)}` : ''}
        </p>
      </div>

      {/* Current Value Preview */}
      {value && (
        <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
          {isImageWithPreview ? (
            <img
              src={value}
              alt="Preview"
              className="w-12 h-12 object-cover rounded"
            />
          ) : (
            <div className="w-12 h-12 flex items-center justify-center bg-slate-600 rounded">
              <Icon className="w-6 h-6 text-gray-400" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{value.split('/').pop()}</p>
            <p className="text-xs text-gray-400 truncate">{value}</p>
          </div>

          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-red-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* URL Input Fallback */}
      {showUrlInput && (
        <div>
          <p className="text-xs text-gray-500 mb-1">Or enter URL directly:</p>
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
            placeholder="/uploads/image.jpg 或完整 URL"
          />
        </div>
      )}

      {/* Error Message */}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
