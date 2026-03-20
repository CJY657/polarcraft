/**
 * Note Node Component
 * 便签节点组件
 *
 * Represents a quick note or idea
 * 表示快速记录或想法
 */

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { StickyNote, Pin } from 'lucide-react';
import { cn } from '@/utils/classNames';
import { CompactMarkdown } from '../shared/MarkdownRenderer';

export const NoteNode = memo(({ data, selected }: NodeProps) => {
  const colorMap = {
    yellow: 'bg-amber-100 border-amber-300 text-amber-900',
    green: 'bg-emerald-100 border-emerald-300 text-emerald-900',
    blue: 'bg-blue-100 border-blue-300 text-blue-900',
    pink: 'bg-rose-100 border-rose-300 text-rose-900',
    purple: 'bg-indigo-100 border-indigo-300 text-indigo-900',
  };

  const currentColor = colorMap[data.color as keyof typeof colorMap] || colorMap.yellow;

  return (
    <div
      className={cn(
        'group relative min-w-[200px] max-w-[280px] transition-all duration-300',
        selected ? 'scale-[1.05]' : 'hover:rotate-1'
      )}
    >
      <div className={cn(
        'relative p-5 rounded-sm shadow-xl transition-all',
        currentColor,
        selected ? 'ring-2 ring-slate-900 ring-offset-2' : 'hover:shadow-2xl'
      )}
      style={{
         borderRadius: '2px 2px 30px 2px',
         boxShadow: '2px 2px 15px rgba(0,0,0,0.2), inset 0 0 40px rgba(0,0,0,0.05)'
      }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3 border-b border-black/5 pb-2">
           <div className="flex items-center gap-2 opacity-60">
              <StickyNote className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">随想便签</span>
           </div>
           {data.pinned && <Pin className="w-3.5 h-3.5 text-rose-500 fill-current" />}
        </div>

        {/* Content */}
        <div className="text-[13px] leading-relaxed font-serif italic text-slate-800/90 min-h-[60px]">
          <CompactMarkdown
            content={data.content?.zh || data.content?.['zh-CN'] || data.content?.en || '记录下这一刻的想法...'}
          />
        </div>

        {/* Shadow Fold Effect */}
        <div className="absolute bottom-0 right-0 w-8 h-8 bg-black/5 rounded-tl-full blur-sm -z-10" />
      </div>

      {/* Invisible Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-full !h-1 !bg-transparent !border-none !-top-0"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-full !h-1 !bg-transparent !border-none !-bottom-0"
      />
    </div>
  );
});

NoteNode.displayName = 'NoteNode';
