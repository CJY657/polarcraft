/**
 * Markdown Editor Component
 * Markdown 编辑器组件
 *
 * Provides a markdown input with live preview
 * 提供 Markdown 输入和实时预览
 */

import { useState, useCallback } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/utils/classNames';
import { MarkdownRenderer } from './MarkdownRenderer';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  theme?: 'dark' | 'light';
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = '支持 Markdown 语法...',
  rows = 4,
  className,
  theme = 'dark',
}: MarkdownEditorProps) {
  const [showPreview, setShowPreview] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  return (
    <div className={cn('relative', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-500">
          支持Markdown: **粗体**, *斜体*, `代码`, [链接](url)
        </div>
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded text-sm transition-colors',
            theme === 'dark'
              ? 'bg-slate-700 hover:bg-slate-600 text-gray-300'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          )}
        >
          {showPreview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          {showPreview ? '编辑' : '预览'}
        </button>
      </div>

      {/* Editor or Preview */}
      {showPreview ? (
        <div
          className={cn(
            'p-3 rounded-lg border min-h-[100px] overflow-y-auto',
            theme === 'dark'
              ? 'bg-slate-900 border-slate-700'
              : 'bg-gray-50 border-gray-300'
          )}
        >
          {value ? (
            <MarkdownRenderer content={value} className="prose-sm" />
          ) : (
            <div className={cn('text-base text-center', theme === 'dark' ? 'text-gray-600' : 'text-gray-400')}>
              暂无内容
            </div>
          )}
        </div>
      ) : (
        <textarea
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          rows={rows}
          className={cn(
            'w-full px-3 py-2 rounded-lg text-base resize-none font-mono',
            'focus:outline-none focus:ring-2 focus:ring-purple-500',
            theme === 'dark'
              ? 'bg-slate-700 border border-slate-600 text-white placeholder:text-gray-500'
              : 'bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400'
          )}
        />
      )}

      {/* Markdown Quick Help */}
      {!showPreview && (
        <div
          className={cn(
            'mt-1 px-2 py-1 rounded text-sm',
            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          )}
        >
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            <span><code className="text-cyan-400">**粗体**</code></span>
            <span><code className="text-cyan-400">*斜体*</code></span>
            <span><code className="text-cyan-400">`代码`</code></span>
            <span><code className="text-cyan-400">[链接](url)</code></span>
            <span><code className="text-cyan-400">- 列表</code></span>
          </div>
        </div>
      )}
    </div>
  );
}
