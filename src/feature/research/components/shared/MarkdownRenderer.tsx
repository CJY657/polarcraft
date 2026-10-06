/**
 * Markdown Renderer Component
 * Markdown 渲染组件
 *
 * Renders markdown content with proper styling
 * 渲染带有样式的 Markdown 内容
 */

import { Children, memo, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MathRenderer from "@/components/shared/MathRenderer";
import { cn } from "@/utils/classNames";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

function isEscaped(text: string, index: number): boolean {
  let slashCount = 0;
  for (let i = index - 1; i >= 0 && text[i] === "\\"; i -= 1) {
    slashCount += 1;
  }
  return slashCount % 2 === 1;
}

function findClosingDelimiter(text: string, delimiter: string, start: number): number {
  let index = text.indexOf(delimiter, start);
  while (index !== -1 && isEscaped(text, index)) {
    index = text.indexOf(delimiter, index + delimiter.length);
  }
  return index;
}

function normalizeBracketMath(content: string): string {
  let output = "";
  let index = 0;

  while (index < content.length) {
    if (content[index] === "`") {
      const start = index;
      while (content[index] === "`") index += 1;
      const ticks = content.slice(start, index);
      const end = content.indexOf(ticks, index);
      if (end === -1) return `${output}${content.slice(start)}`;
      output += content.slice(start, end + ticks.length);
      index = end + ticks.length;
      continue;
    }

    if (content.startsWith("\\(", index)) {
      const end = findClosingDelimiter(content, "\\)", index + 2);
      if (end !== -1) {
        output += `$${content.slice(index + 2, end)}$`;
        index = end + 2;
        continue;
      }
    }

    if (content.startsWith("\\[", index)) {
      const end = findClosingDelimiter(content, "\\]", index + 2);
      if (end !== -1) {
        output += `$$${content.slice(index + 2, end)}$$`;
        index = end + 2;
        continue;
      }
    }

    output += content[index];
    index += 1;
  }

  return output;
}

function isInlineMath(content: string): boolean {
  return content.trim() === content && /[A-Za-z\\^_=+\-*/<>]/.test(content);
}

function findMath(text: string, start: number) {
  for (let i = start; i < text.length; i += 1) {
    if (isEscaped(text, i)) continue;

    if (text.startsWith("$$", i)) {
      const end = findClosingDelimiter(text, "$$", i + 2);
      if (end !== -1) return { start: i, end: end + 2, latex: text.slice(i + 2, end), display: true };
    }

    if (text.startsWith("\\[", i)) {
      const end = findClosingDelimiter(text, "\\]", i + 2);
      if (end !== -1) return { start: i, end: end + 2, latex: text.slice(i + 2, end), display: true };
    }

    if (text.startsWith("\\(", i)) {
      const end = findClosingDelimiter(text, "\\)", i + 2);
      if (end !== -1) return { start: i, end: end + 2, latex: text.slice(i + 2, end), display: false };
    }

    if (text[i] === "$" && text[i + 1] !== "$") {
      const end = findClosingDelimiter(text, "$", i + 1);
      if (end !== -1) {
        const latex = text.slice(i + 1, end);
        if (isInlineMath(latex)) return { start: i, end: end + 1, latex, display: false };
      }
    }
  }

  return null;
}

function renderMathText(text: string, keyPrefix: number): ReactNode[] {
  const nodes: ReactNode[] = [];
  let index = 0;
  let match = findMath(text, index);

  while (match) {
    if (match.start > index) {
      nodes.push(text.slice(index, match.start));
    }
    nodes.push(
      <MathRenderer
        key={`math-${keyPrefix}-${match.start}`}
        latex={match.latex}
        displayMode={match.display}
        className={match.display ? "my-2 overflow-x-auto" : undefined}
      />
    );
    index = match.end;
    match = findMath(text, index);
  }

  if (index < text.length) {
    nodes.push(text.slice(index));
  }

  return nodes.length ? nodes : [text];
}

function renderMathChildren(children: ReactNode): ReactNode[] {
  return Children.toArray(children).flatMap((child, index) =>
    typeof child === "string" ? renderMathText(child, index) : child
  );
}

export const MarkdownRenderer = memo(({ content, className }: MarkdownRendererProps) => {
  if (!content) return null;
  const normalizedContent = normalizeBracketMath(content);

  return (
    <div
      className={cn(
        "prose prose-sm max-w-none",
        "prose-headings:font-semibold prose-headings:text-[var(--paper-foreground)]",
        "prose-p:text-[var(--paper-foreground)] prose-p:my-1",
        "prose-strong:text-[var(--paper-foreground)] prose-strong:font-semibold",
        "prose-code:text-[var(--paper-link)] prose-code:bg-[var(--research-chip)] prose-code:px-1 prose-code:rounded",
        "prose-pre:bg-[var(--research-head)] prose-pre:border prose-pre:border-[var(--research-line)]",
        "prose-ul:text-[var(--paper-foreground)] prose-ul:my-1 prose-ul:pl-4",
        "prose-ol:text-[var(--paper-foreground)] prose-ol:my-1 prose-ol:pl-4",
        "prose-li:text-[var(--paper-foreground)] prose-li:my-0.5",
        "prose-th:text-[var(--paper-foreground)] prose-td:text-[var(--paper-foreground)]",
        "prose-a:text-[var(--paper-link)] prose-a:no-underline hover:prose-a:text-[var(--paper-accent)]",
        "prose-blockquote:border-l-2 prose-blockquote:border-[var(--clay-ochre)] prose-blockquote:pl-4 prose-blockquote:italic",
        "prose-hr:border-[var(--research-line)]",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Customize paragraph rendering
          p: ({ children }) => <p className="my-1 text-[var(--paper-foreground)]">{renderMathChildren(children)}</p>,
          li: ({ children }) => <li>{renderMathChildren(children)}</li>,
          strong: ({ children }) => <strong>{renderMathChildren(children)}</strong>,
          em: ({ children }) => <em>{renderMathChildren(children)}</em>,
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
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
});

MarkdownRenderer.displayName = "MarkdownRenderer";

