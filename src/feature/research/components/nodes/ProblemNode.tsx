/**
 * Problem Node Component
 * 问题节点组件
 *
 * Represents a research question or problem
 * 表示研究问题或疑问
 */

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { HelpCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/classNames';
import { CompactMarkdown } from '../shared/MarkdownRenderer';

export const ProblemNode = memo(({ data, selected }: NodeProps) => {
  const priorityColors = {
    low: 'text-slate-400',
    medium: 'text-amber-500',
    high: 'text-rose-500',
  };

  const statusLabels = {
    open: '待解决',
    investigating: '调查中',
    answered: '已解答',
  };

  const getDescriptionText = () => {
    return data.description?.zh || data.description?.['zh-CN'] || data.description?.en || '';
  };

  return (
    <div
      className={cn(
        'group relative min-w-[240px] max-w-[300px] transition-all duration-300',
        selected ? 'scale-[1.02]' : 'hover:scale-[1.01]'
      )}
    >
      {/* Selection Glow */}
      {selected && (
        <div className="absolute -inset-0.5 bg-amber-500/30 blur-md rounded-2xl -z-10 animate-pulse" />
      )}

      <div className={cn(
        'relative bg-slate-900 border-2 rounded-2xl overflow-hidden shadow-2xl transition-all',
        selected ? 'border-amber-500 shadow-amber-500/20' : 'border-slate-800 hover:border-slate-700'
      )}>
        {/* Accent Bar */}
        <div className="h-1.5 w-full bg-amber-500" />

        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
                <HelpCircle className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-100 truncate leading-tight">
                {data.title?.zh || data.title?.['zh-CN'] || data.title?.en || '研究问题'}
              </h3>
            </div>
            <div className={cn(
              "shrink-0 p-1 rounded-full",
              priorityColors[data.priority as keyof typeof priorityColors] || priorityColors.medium
            )}>
              <AlertCircle className="w-3.5 h-3.5 fill-current opacity-20" />
            </div>
          </div>

          {/* Description */}
          {getDescriptionText() ? (
            <div className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed">
              <CompactMarkdown content={getDescriptionText()} />
            </div>
          ) : (
             <div className="text-[10px] text-slate-600 italic">暂无描述...</div>
          )}

          {/* Footer Metadata */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
            <span className={cn(
              "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md",
              data.status === 'answered' ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-800 text-slate-500"
            )}>
              {statusLabels[data.status as keyof typeof statusLabels] || '待处理'}
            </span>
            <span className="text-[9px] text-slate-600 font-mono">#{data.id?.slice(-4) || 'NODE'}</span>
          </div>
        </div>
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-slate-900 !border-2 !border-amber-500 !-top-1.5 hover:!scale-125 transition-transform"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-amber-500 !border-2 !border-slate-900 !-bottom-1.5 hover:!scale-125 transition-transform shadow-lg"
      />
    </div>
  );
});

ProblemNode.displayName = 'ProblemNode';
