/**
 * Media Node Component
 * 媒体节点组件
 *
 * Represents an image or video media resource
 * 表示图片或视频媒体资源
 */

import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Image, Video, ExternalLink, Maximize2, Play, FileText } from 'lucide-react';
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

  return (
    <div
      className={cn(
        'group relative transition-all duration-300',
        selected ? 'scale-[1.02]' : 'hover:scale-[1.01]',
        isExpanded ? 'w-[400px]' : 'w-[280px]'
      )}
    >
      {/* Selection Glow */}
      {selected && (
        <div className="absolute -inset-0.5 bg-pink-500/30 blur-md rounded-2xl -z-10 animate-pulse" />
      )}

      <div className={cn(
        'relative bg-slate-900 border-2 rounded-2xl overflow-hidden shadow-2xl transition-all',
        selected ? 'border-pink-500 shadow-pink-500/20' : 'border-slate-800 hover:border-slate-700'
      )}>
        {/* Accent Bar */}
        <div className="h-1.5 w-full bg-pink-500" />

        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1.5 rounded-lg bg-pink-500/10 text-pink-500 shrink-0">
                {mediaType === 'video' ? <Video className="w-4 h-4" /> : <Image className="w-4 h-4" />}
              </div>
              <h3 className="text-sm font-bold text-slate-100 truncate leading-tight">
                {data.title?.zh || data.title?.['zh-CN'] || data.title?.en || (mediaType === 'video' ? '研究视频' : '研究图片')}
              </h3>
            </div>
            <div className="flex items-center gap-1">
               <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1 rounded-md bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors"
                >
                  <Maximize2 className="w-3 h-3" />
                </button>
                {url && (
                  <a
                    href={url} target="_blank" rel="noopener noreferrer"
                    className="p-1 rounded-md bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
            </div>
          </div>

          {/* Media Container */}
          <div className={cn(
            "relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 group/media",
            isExpanded ? "aspect-video" : "aspect-[4/3]"
          )}>
            {url ? (
              mediaType === 'video' ? (
                <div className="w-full h-full relative">
                  <video src={url} className="w-full h-full object-cover" poster={thumbnail} />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-100 group-hover/media:bg-black/20 transition-all">
                     <div className="w-10 h-10 rounded-full bg-pink-500 flex items-center justify-center shadow-lg shadow-pink-500/40">
                        <Play className="w-5 h-5 text-white fill-current" />
                     </div>
                  </div>
                </div>
              ) : (
                <img src={url} alt="Media" className="w-full h-full object-cover transition-transform duration-500 group-hover/media:scale-105" />
              )
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-600">
                <FileText className="w-8 h-8 opacity-20" />
                <span className="text-[10px] font-bold uppercase tracking-widest">暂无媒体内容</span>
              </div>
            )}
          </div>

          {/* Description */}
          {mediaData.description && (
            <div className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed italic border-l-2 border-pink-500/30 pl-3">
              <CompactMarkdown
                content={mediaData.description?.zh || mediaData.description?.['zh-CN'] || mediaData.description?.en || ''}
              />
            </div>
          )}

          {/* Footer Metadata */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
             <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
               {mediaType === 'video' ? 'MP4 / WEBM' : 'JPG / PNG / GIF'}
             </span>
             <span className="text-[9px] text-slate-600 font-mono uppercase tracking-tighter">
               Media Source
             </span>
          </div>
        </div>
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-slate-900 !border-2 !border-pink-500 !-top-1.5 hover:!scale-125 transition-transform"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-pink-500 !border-2 !border-slate-900 !-bottom-1.5 hover:!scale-125 transition-transform shadow-lg"
      />
    </div>
  );
});

MediaNode.displayName = 'MediaNode';
