/**
 * Markdown Renderer Component
 * Markdown 渲染组件
 *
 * Renders markdown content with proper styling
 * 渲染带有样式的 Markdown 内容
 */

import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/utils/classNames";

interface MarkdownRendererProps {
  content: string;
  className?: string;
  maxLines?: number;
}

export const MarkdownRenderer = memo(({ content, className, maxLines }: MarkdownRendererProps) => {
  if (!content) return null;

  return (
    <div
      className={cn(
        "prose prose-invert prose-sm max-w-none",
        "prose-headings:font-semibold prose-headings:text-white",
        "prose-p:text-gray-300 prose-p:my-1",
        "prose-strong:text-white prose-strong:font-semibold",
        "prose-code:text-cyan-400 prose-code:bg-slate-900 prose-code:px-1 prose-code:rounded",
        "prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-700",
        "prose-ul:text-gray-300 prose-ul:my-1 prose-ul:pl-4",
        "prose-ol:text-gray-300 prose-ol:my-1 prose-ol:pl-4",
        "prose-li:text-gray-300 prose-li:my-0.5",
        "prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:text-cyan-300",
        "prose-blockquote:border-l-2 prose-blockquote:border-amber-500 prose-blockquote:pl-4 prose-blockquote:italic",
        "prose-hr:border-slate-700",
        maxLines && `line-clamp-${maxLines}`,
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Customize paragraph rendering
          p: ({ children }) => <p className="text-gray-300 my-1">{children}</p>,
          // Customize code block rendering
          code: ({ className, children, ...props }) => (
            <code
              className={className}
              {...props}
            >
              {children}
            </code>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});

MarkdownRenderer.displayName = "MarkdownRenderer";

/**
 * Compact Markdown Renderer for Node Cards
 * 节点卡片的紧凑版 Markdown 渲染器
 */
interface CompactMarkdownProps {
  content: string;
  maxLines?: number;
}

export const CompactMarkdown = memo(({ content }: CompactMarkdownProps) => {
  if (!content) return null;

  return (
    <div className={cn("text-sm text-gray-400")}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="text-gray-400 my-1">{children}</p>,
          strong: ({ children }) => <span className="font-semibold text-white">{children}</span>,
          em: ({ children }) => <span className="italic">{children}</span>,
          code: ({ children }) => (
            <code className="text-cyan-400 bg-slate-900/50 px-1 rounded text-sm">{children}</code>
          ),
          a: ({ children }) => <span className="text-cyan-400 underline">{children}</span>,
          ul: ({ children }) => <ul className="list-disc list-inside my-1 pl-4">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside my-1 pl-4">{children}</ol>,
          li: ({ children }) => <li className="text-gray-400">{children}</li>,
          br: () => <br />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});

CompactMarkdown.displayName = "CompactMarkdown";
