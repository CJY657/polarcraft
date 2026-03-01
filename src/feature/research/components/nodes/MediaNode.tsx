/**
 * Media Node Component
 * 媒体节点组件
 *
 * Represents an image or video media resource
 * 表示图片或视频媒体资源
 */

import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Image, Video, ExternalLink, Maximize2, X } from 'lucide-react';
import { cn } from '@/utils/classNames';
import { CompactMarkdown } from '../shared/MarkdownRenderer';
import type { MediaNodeData } from '../../types/node-data.types';

type MediaType = 'image' | 'video';

export const MediaNode = memo(({ data, selected }: NodeProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const mediaData = data as MediaNodeData;
  const mediaType: MediaType = mediaData.mediaType || 'image';
  const url = mediaData.url || '';
  const thumbnail = mediaData.thumbnail || url;

  // Auto-detect media type from URL if not specified
  const detectedType: MediaType = url.toLowerCase().match(/\.(mp4|webm|ogg|mov|avi|mkv)(\?.*)?$/i)
    ? 'video'
    : 'image';

  const displayType = mediaType || detectedType;

  const renderMedia = (isPreview = false) => {
    if (!url) {
      return (
        <div className="flex items-center justify-center bg-slate-900 rounded">
          <div className="text-center p-4">
            {displayType === 'image' ? (
              <Image className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            ) : (
              <Video className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            )}
            <span className="text-xs text-gray-500">
              {displayType === 'image' ? '暂无图片' : '暂无视频'}
            </span>
          </div>
        </div>
      );
    }

    if (displayType === 'video') {
      return (
        <div className={cn('relative bg-slate-900 rounded overflow-hidden', isPreview ? 'h-32' : 'h-full')}>
          <video
            src={url}
            controls={!isPreview}
            className="w-full h-full object-cover"
            poster={thumbnail}
          />
          {isPreview && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <Video className="w-8 h-8 text-white" />
            </div>
          )}
        </div>
      );
    }

    // Image
    return (
      <div className={cn('relative bg-slate-900 rounded overflow-hidden', isPreview ? 'h-32' : 'h-full')}>
        <img
          src={url}
          alt={data.title?.zh || data.title?.['zh-CN'] || data.title?.en || '媒体'}
          className="w-full h-full object-cover"
        />
      </div>
    );
  };

  return (
    <div
      className={cn(
        'px-4 py-3 rounded-lg border-2 bg-slate-800 transition-all',
        selected ? 'border-pink-500 shadow-lg shadow-pink-500/20' : 'border-pink-600',
        isExpanded && 'min-w-[500px] min-h-[400px]'
      )}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-pink-500 !border-2 !border-pink-400"
      />

      {/* Node Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {displayType === 'image' ? (
            <Image className="w-5 h-5 text-pink-400" />
          ) : (
            <Video className="w-5 h-5 text-pink-400" />
          )}
          <span className="font-semibold text-white text-sm truncate">
            {data.title?.zh || data.title?.['zh-CN'] || data.title?.en || (displayType === 'image' ? '图片' : '视频')}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {url && (
            <>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 text-gray-400 hover:text-white transition-colors"
                title={isExpanded ? '收起' : '展开'}
              >
                {isExpanded ? (
                  <X className="w-3 h-3" />
                ) : (
                  <Maximize2 className="w-3 h-3" />
                )}
              </button>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 text-gray-400 hover:text-white transition-colors"
                title="在新窗口打开"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </>
          )}
        </div>
      </div>

      {/* Media Preview/Display */}
      <div className={cn(
        'mb-2 rounded overflow-hidden',
        isExpanded ? 'h-80' : 'h-32'
      )}>
        {renderMedia(!isExpanded)}
      </div>

      {/* Description - Markdown rendered */}
      {mediaData.description && !isExpanded && (
        <div className="text-xs text-gray-400">
          <CompactMarkdown
            content={mediaData.description?.zh || mediaData.description?.['zh-CN'] || mediaData.description?.en || ''}
          />
        </div>
      )}

      {/* URL Display */}
      {url && (
        <div className="mt-2">
          <div className="text-xs text-gray-500 truncate" title={url}>
            {url}
          </div>
        </div>
      )}

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-pink-500 !border-2 !border-pink-400"
      />
    </div>
  );
});

MediaNode.displayName = 'MediaNode';
