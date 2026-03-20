/**
 * Conclusion Node Component
 * 结论节点组件
 *
 * Represents a research conclusion or finding
 * 表示研究结论或发现
 */

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { CheckCircle2, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { cn } from '@/utils/classNames';
import { CompactMarkdown } from '../shared/MarkdownRenderer';

export const ConclusionNode = memo(({ data, selected }: NodeProps) => {
  const confidence = data.confidence || 0.5;

  const getConfidenceColor = (val: number) => {
    if (val > 0.8) return 'text-emerald-500';
    if (val > 0.5) return 'text-blue-500';
    return 'text-amber-500';
  };

  const getConfidenceBg = (val: number) => {
    if (val > 0.8) return 'bg-emerald-500/10';
    if (val > 0.5) return 'bg-blue-500/10';
    return 'bg-amber-500/10';
  };

  return (
    <div
      className={cn(
        'group relative min-w-[260px] max-w-[320px] transition-all duration-300',
        selected ? 'scale-[1.02]' : 'hover:scale-[1.01]'
      )}
    >
      {/* Selection Glow */}
      {selected && (
        <div className="absolute -inset-0.5 bg-emerald-500/30 blur-md rounded-2xl -z-10 animate-pulse" />
      )}

      <div className={cn(
        'relative bg-slate-900 border-2 rounded-2xl overflow-hidden shadow-2xl transition-all',
        selected ? 'border-emerald-500 shadow-emerald-500/20' : 'border-slate-800 hover:border-slate-700'
      )}>
        {/* Accent Bar */}
        <div className="h-1.5 w-full bg-emerald-500" />

        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-100 truncate leading-tight">
                {data.title?.zh || data.title?.['zh-CN'] || data.title?.en || '研究结论'}
              </h3>
            </div>
            <div className={cn("shrink-0 p-1 rounded-full bg-slate-800 border border-slate-700", getConfidenceColor(confidence))}>
               <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Statement */}
          <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
             <div className="text-[11px] text-slate-300 leading-relaxed font-medium">
                <CompactMarkdown
                  content={data.statement?.zh || data.statement?.['zh-CN'] || data.statement?.en || '尚未得出最终结论...'}
                />
             </div>
          </div>

          {/* Evidence Count & Confidence */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
             <div className="flex items-center gap-1.5 text-slate-500">
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 text-[9px] font-bold uppercase tracking-wider">
                   {data.evidenceIds?.length || 0} 项证据
                </div>
             </div>

             <div className="flex items-center gap-2">
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">可信度</div>
                <div className={cn(
                  "px-1.5 py-0.5 rounded text-[10px] font-mono font-bold",
                  getConfidenceBg(confidence),
                  getConfidenceColor(confidence)
                )}>
                  {Math.round(confidence * 100)}%
                </div>
             </div>
          </div>
        </div>

        {/* Decorative corner icon */}
        <div className="absolute top-0 right-0 p-1 opacity-5">
           <ArrowUpRight className="w-12 h-12 text-white" />
        </div>
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-slate-900 !border-2 !border-emerald-500 !-top-1.5 hover:!scale-125 transition-transform"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-slate-900 !-bottom-1.5 hover:!scale-125 transition-transform shadow-lg"
      />
    </div>
  );
});

ConclusionNode.displayName = 'ConclusionNode';
