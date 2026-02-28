/**
 * Note Node Component
 * 便签节点组件
 *
 * Represents a sticky note for quick thoughts and reminders
 * 用于快速记录想法和备注的便签节点
 */

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { StickyNote, Pin } from 'lucide-react';
import { cn } from '@/utils/classNames';
import { CompactMarkdown } from '../shared/MarkdownRenderer';

// Color theme configuration
const colorThemes = {
  yellow: {
    bg: 'bg-yellow-100',
    border: 'border-yellow-400',
    borderSelected: 'border-yellow-500',
    shadow: 'shadow-yellow-500/20',
    icon: 'text-yellow-600',
    text: 'text-yellow-800',
    handle: '!bg-yellow-500',
  },
  green: {
    bg: 'bg-green-100',
    border: 'border-green-400',
    borderSelected: 'border-green-500',
    shadow: 'shadow-green-500/20',
    icon: 'text-green-600',
    text: 'text-green-800',
    handle: '!bg-green-500',
  },
  blue: {
    bg: 'bg-blue-100',
    border: 'border-blue-400',
    borderSelected: 'border-blue-500',
    shadow: 'shadow-blue-500/20',
    icon: 'text-blue-600',
    text: 'text-blue-800',
    handle: '!bg-blue-500',
  },
  pink: {
    bg: 'bg-pink-100',
    border: 'border-pink-400',
    borderSelected: 'border-pink-500',
    shadow: 'shadow-pink-500/20',
    icon: 'text-pink-600',
    text: 'text-pink-800',
    handle: '!bg-pink-500',
  },
  purple: {
    bg: 'bg-purple-100',
    border: 'border-purple-400',
    borderSelected: 'border-purple-500',
    shadow: 'shadow-purple-500/20',
    icon: 'text-purple-600',
    text: 'text-purple-800',
    handle: '!bg-purple-500',
  },
};

type NoteColor = keyof typeof colorThemes;

export const NoteNode = memo(({ data, selected }: NodeProps) => {
  const color = (data.color as NoteColor) || 'yellow';
  const theme = colorThemes[color];

  const getTitle = () => {
    return data.title?.zh || data.title?.['zh-CN'] || data.title?.en || '便签';
  };

  const getContent = () => {
    return data.content?.zh || data.content?.['zh-CN'] || data.content?.en || '';
  };

  return (
    <div
      className={cn(
        'px-4 py-3 rounded-lg border-2 min-w-[180px] max-w-[280px] transition-all',
        'shadow-md hover:shadow-lg',
        theme.bg,
        selected ? `${theme.borderSelected} shadow-lg ${theme.shadow}` : theme.border
      )}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className={cn('!border-2 !border-white/50', theme.handle)}
      />

      {/* Node Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <StickyNote className={cn('w-5 h-5', theme.icon)} />
          <span className={cn('font-semibold text-sm truncate', theme.text)}>
            {getTitle()}
          </span>
        </div>
        {data.pinned && (
          <Pin className={cn('w-4 h-4', theme.icon)} />
        )}
      </div>

      {/* Note Content - Markdown rendered */}
      {getContent() && (
        <div className={cn('text-sm', theme.text, 'opacity-80')}>
          <CompactMarkdown content={getContent()} />
        </div>
      )}

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className={cn('!border-2 !border-white/50', theme.handle)}
      />
    </div>
  );
});

NoteNode.displayName = 'NoteNode';
