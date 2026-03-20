/**
 * Experiment Node Component
 * 实验节点组件
 *
 * Represents an experiment or simulation
 * 表示实验或仿真
 */

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { FlaskConical, Play, CheckCircle, Clock, XCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/utils/classNames';
import { CompactMarkdown } from '../shared/MarkdownRenderer';

export const ExperimentNode = memo(({ data, selected }: NodeProps) => {
  const statusConfig = {
    pending: {
      icon: <Clock className="w-3.5 h-3.5 text-slate-500" />,
      color: 'bg-slate-500',
      label: '准备中',
      bg: 'bg-slate-500/10'
    },
    running: {
      icon: <Play className="w-3.5 h-3.5 text-blue-500 animate-pulse" />,
      color: 'bg-blue-500',
      label: '运行中',
      bg: 'bg-blue-500/10'
    },
    completed: {
      icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />,
      color: 'bg-emerald-500',
      label: '已完成',
      bg: 'bg-emerald-500/10'
    },
    failed: {
      icon: <XCircle className="w-3.5 h-3.5 text-rose-500" />,
      color: 'bg-rose-500',
      label: '失败',
      bg: 'bg-rose-500/10'
    },
  };

  const currentStatus = statusConfig[data.status as keyof typeof statusConfig] || statusConfig.pending;

  return (
    <div
      className={cn(
        'group relative min-w-[260px] max-w-[320px] transition-all duration-300',
        selected ? 'scale-[1.02]' : 'hover:scale-[1.01]'
      )}
    >
      {/* Selection Glow */}
      {selected && (
        <div className="absolute -inset-0.5 bg-blue-500/30 blur-md rounded-2xl -z-10 animate-pulse" />
      )}

      <div className={cn(
        'relative bg-slate-900 border-2 rounded-2xl overflow-hidden shadow-2xl transition-all',
        selected ? 'border-blue-500 shadow-blue-500/20' : 'border-slate-800 hover:border-slate-700'
      )}>
        {/* Accent Bar */}
        <div className={cn("h-1.5 w-full", currentStatus.color)} />

        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 shrink-0">
                <FlaskConical className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-100 truncate leading-tight">
                {data.title?.zh || data.title?.['zh-CN'] || data.title?.en || '研究实验'}
              </h3>
            </div>
            <div className="shrink-0 p-1 rounded-full bg-slate-800 border border-slate-700">
               {currentStatus.icon}
            </div>
          </div>

          {/* Linked Demo Info */}
          {data.linkedDemo && (
             <div className="flex items-center gap-2 p-2 bg-blue-500/5 rounded-xl border border-blue-500/10 group/demo cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-500 transition-colors group-hover/demo:bg-blue-500 group-hover/demo:text-white">
                  <Play className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                   <p className="text-[9px] uppercase font-bold text-blue-500/60 tracking-wider">关联演示</p>
                   <p className="text-[11px] font-medium text-slate-300 truncate">{data.linkedDemo}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 transition-transform group-hover/demo:translate-x-1" />
             </div>
          )}

          {/* Description */}
          {data.description && (
            <div className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed italic">
              <CompactMarkdown
                content={data.description?.zh || data.description?.['zh-CN'] || data.description?.en || ''}
              />
            </div>
          )}

          {/* Assigned & Status Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
             <div className="flex -space-x-1.5 overflow-hidden">
                {(data.assignedTo || ['U1', 'U2']).slice(0, 3).map((u: string, i: number) => (
                   <div key={i} className="w-5 h-5 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[8px] font-bold text-slate-400">
                     {u.slice(0, 1).toUpperCase()}
                   </div>
                ))}
             </div>

             <div className="flex items-center gap-2">
                <span className={cn(
                  "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md",
                  currentStatus.bg,
                  currentStatus.color.replace('bg-', 'text-')
                )}>
                  {currentStatus.label}
                </span>
             </div>
          </div>
        </div>
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-slate-900 !border-2 !border-blue-500 !-top-1.5 hover:!scale-125 transition-transform"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-slate-900 !-bottom-1.5 hover:!scale-125 transition-transform shadow-lg"
      />
    </div>
  );
});

ExperimentNode.displayName = 'ExperimentNode';
