/**
 * Topic reference textarea
 * 支持 @ 引用议题的文本框
 *
 * A drop-in replacement for a controlled `<textarea>`: typing `@` opens a
 * picker of topics the author can read, and choosing one inserts the plain text
 * `#123`. Nothing else changes — the value stays a string, so undo/redo, copy,
 * paste, selection, IME composition and mobile keyboards are the browser's
 * native behaviour rather than something we reimplement.
 *
 * ponytail: the picker anchors to the textarea, not to the caret. Caret-accurate
 * placement needs a mirrored-div measurement pass; add it if authors complain
 * about long descriptions.
 */

import { useEffect, useId, useRef, useState, type TextareaHTMLAttributes } from "react";
import { researchApi, type TopicReferenceCandidate } from "@/lib/research.service";
import { cn } from "@/utils/classNames";

const MAX_QUERY_LENGTH = 40;

/**
 * Find the `@query` run the caret sits in, or null when the caret is not in one.
 * An `@` that continues a word (`user@example.com`) is never a trigger.
 */
export function readMentionQuery(value: string, caret: number): { start: number; query: string } | null {
  const start = value.lastIndexOf("@", caret - 1);
  if (start === -1) return null;

  const before = start > 0 ? value[start - 1] : "";
  if (before && /[\w@.]/.test(before)) return null;

  const query = value.slice(start + 1, caret);
  if (query.length > MAX_QUERY_LENGTH || /[\s@#]/.test(query)) return null;

  return { start, query };
}

interface TopicReferenceTextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange"> {
  value: string;
  onValueChange: (next: string) => void;
  /** The topic being edited, excluded from its own picker. */
  excludeProjectId?: string;
}

export default function TopicReferenceTextarea({
  value,
  onValueChange,
  excludeProjectId,
  onKeyDown,
  onBlur,
  className,
  ...textareaProps
}: TopicReferenceTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const listboxId = useId();
  const [mention, setMention] = useState<{ start: number; query: string } | null>(null);
  const [candidates, setCandidates] = useState<TopicReferenceCandidate[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const isOpen = mention !== null && candidates.length > 0;

  useEffect(() => {
    if (mention === null) {
      setCandidates([]);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const results = await researchApi.searchTopicReferenceCandidates({
          query: mention.query,
          excludeProjectId,
        });
        if (!cancelled) {
          setCandidates(results);
          setActiveIndex(0);
        }
      } catch {
        // ponytail: a failed lookup just means no suggestions; typing is unaffected.
        if (!cancelled) setCandidates([]);
      }
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [mention, excludeProjectId]);

  function syncMention(target: HTMLTextAreaElement) {
    const next = readMentionQuery(target.value, target.selectionStart ?? 0);
    setMention((current) =>
      current?.start === next?.start && current?.query === next?.query ? current : next
    );
  }

  function insertReference(candidate: TopicReferenceCandidate) {
    if (!mention || !candidate.issue_number) return;

    const caret = textareaRef.current?.selectionStart ?? mention.start;
    const token = `#${candidate.issue_number} `;
    const next = `${value.slice(0, mention.start)}${token}${value.slice(caret)}`;

    setMention(null);
    setCandidates([]);
    onValueChange(next);

    const caretAfter = mention.start + token.length;
    window.requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(caretAfter, caretAfter);
    });
  }

  return (
    <div className="relative">
      <textarea
        {...textareaProps}
        ref={textareaRef}
        className={className}
        value={value}
        role={isOpen ? "combobox" : undefined}
        aria-expanded={isOpen || undefined}
        aria-controls={isOpen ? listboxId : undefined}
        aria-autocomplete={isOpen ? "list" : undefined}
        onChange={(event) => {
          onValueChange(event.target.value);
          syncMention(event.target);
        }}
        onClick={(event) => syncMention(event.currentTarget)}
        onKeyUp={(event) => {
          if (event.key.startsWith("Arrow") || event.key === "Home" || event.key === "End") {
            syncMention(event.currentTarget);
          }
        }}
        onKeyDown={(event) => {
          // Never steal keys from an active IME composition. / 输入法组词期间不拦截按键。
          if (isOpen && !event.nativeEvent.isComposing) {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((index) => (index + 1) % candidates.length);
              return;
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((index) => (index - 1 + candidates.length) % candidates.length);
              return;
            }
            if (event.key === "Enter" || event.key === "Tab") {
              event.preventDefault();
              insertReference(candidates[activeIndex]);
              return;
            }
            if (event.key === "Escape") {
              event.preventDefault();
              event.stopPropagation();
              setMention(null);
              return;
            }
          }
          onKeyDown?.(event);
        }}
        onBlur={(event) => {
          // Let a click on an option land before the list unmounts. / 先让选项点击生效。
          window.setTimeout(() => setMention(null), 120);
          onBlur?.(event);
        }}
      />

      {isOpen && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="引用议题"
          className="glass-panel absolute left-0 right-0 top-full z-30 mt-1 max-h-64 list-none overflow-y-auto rounded-xl border border-[var(--glass-border)] bg-[var(--glass-surface)] p-1 shadow-xl"
        >
          {candidates.map((candidate, index) => (
            <li key={candidate.id} role="none">
              <button
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => insertReference(candidate)}
                className={cn(
                  "flex w-full items-baseline gap-2 rounded-lg px-3 py-2 text-left text-base",
                  index === activeIndex
                    ? "bg-[var(--paper-accent)]/15 text-[var(--paper-foreground)]"
                    : "text-[var(--glass-text)]"
                )}
              >
                <span className="tabular-nums opacity-70">#{candidate.issue_number}</span>
                <span className="min-w-0 flex-1 truncate">{candidate.name_zh}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
