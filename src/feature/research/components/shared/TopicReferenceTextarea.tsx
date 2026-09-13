/**
 * Topic reference editor
 * 支持 @ 引用议题的输入框（芯片版）
 *
 * A contentEditable replacement for the description / discussion textarea.
 * Typing `@` opens a picker of topics the author can read; choosing one inserts
 * an atomic *chip* showing the topic's name. The outside contract is still a
 * plain string: chips serialise to the reference token `#123`, so storage,
 * the server-side resolver and the read view are untouched.
 *
 * Scope is deliberately tiny: text, line breaks and chips. No other formatting
 * ever enters the DOM (pasted HTML is flattened to text).
 *
 * ponytail: the picker anchors to the editor box, not to the caret. Caret-accurate
 * placement needs a Range rect measurement; add it if authors complain.
 */

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
  type FocusEvent,
} from "react";
import { researchApi, type TopicReferenceCandidate } from "@/lib/research.service";
import { cn } from "@/utils/classNames";
import { splitTopicReferences, type TopicReference } from "./TopicReferenceText";

const MAX_QUERY_LENGTH = 40;
const CHIP_ATTR = "data-issue";
const CHIP_CLASS =
  "mx-0.5 inline-flex max-w-full items-baseline rounded-md border border-[var(--paper-accent)]/40 bg-[var(--paper-accent)]/15 px-1.5 py-px align-baseline font-medium text-[var(--paper-foreground)] select-none";

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

function isChip(node: Node | null | undefined): boolean {
  return node instanceof HTMLElement && node.hasAttribute(CHIP_ATTR);
}

function createChip(number: number, name: string): HTMLElement {
  const chip = document.createElement("span");
  chip.setAttribute(CHIP_ATTR, String(number));
  chip.contentEditable = "false";
  chip.className = CHIP_CLASS;
  chip.title = `#${number}`;
  chip.textContent = name;
  return chip;
}

/** Editor DOM → stored string. Chips become `#N`; `<br>` becomes `\n`. */
export function serializeEditor(root: Node): string {
  let out = "";
  const children = Array.from(root.childNodes);
  children.forEach((node, index) => {
    if (node.nodeType === Node.TEXT_NODE) {
      out += node.textContent ?? "";
      return;
    }
    if (!(node instanceof HTMLElement)) return;
    if (isChip(node)) {
      out += `#${node.getAttribute(CHIP_ATTR)}`;
      return;
    }
    if (node.tagName === "BR") {
      // ponytail: a trailing <br> is the browser's caret placeholder, not a newline.
      if (index < children.length - 1) out += "\n";
      return;
    }
    if (node.tagName === "DIV" || node.tagName === "P") {
      if (out.length > 0 && !out.endsWith("\n")) out += "\n";
    }
    out += serializeEditor(node);
  });
  return out;
}

/** Stored string → editor DOM. `#N` becomes a chip when its name is known. */
export function hydrateEditor(
  root: HTMLElement,
  value: string,
  references?: TopicReference[] | null
): void {
  const byNumber = new Map((references ?? []).map((reference) => [reference.number, reference]));
  root.replaceChildren();

  for (const segment of splitTopicReferences(value)) {
    if (segment.type === "reference" && byNumber.has(segment.number)) {
      root.appendChild(createChip(segment.number, byNumber.get(segment.number)!.name_zh));
      continue;
    }
    const text = segment.type === "text" ? segment.value : `#${segment.number}`;
    text.split("\n").forEach((line, index) => {
      if (index > 0) root.appendChild(document.createElement("br"));
      if (line) root.appendChild(document.createTextNode(line));
    });
  }
  if (value.endsWith("\n")) root.appendChild(document.createElement("br"));
}

function placeCaret(node: Node, offset: number) {
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.setStart(node, offset);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

function insertText(text: string) {
  // ponytail: execCommand is deprecated but is the only way to keep native undo.
  if (typeof document.execCommand === "function" && document.execCommand("insertText", false, text)) return;
  const selection = window.getSelection();
  if (!selection?.rangeCount) return;
  const range = selection.getRangeAt(0);
  range.deleteContents();
  const node = document.createTextNode(text);
  range.insertNode(node);
  placeCaret(node, text.length);
}

interface Mention {
  node: Text;
  start: number;
  query: string;
}

interface TopicReferenceTextareaProps {
  value: string;
  onValueChange: (next: string) => void;
  /** The topic being edited, excluded from its own picker. */
  excludeProjectId?: string;
  /** Known reference targets, used to show existing `#N` tokens as chips. */
  references?: TopicReference[] | null;
  className?: string;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  "aria-label"?: string;
  onPaste?: (event: ClipboardEvent<HTMLElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void;
  onBlur?: (event: FocusEvent<HTMLElement>) => void;
}

export default function TopicReferenceTextarea({
  value,
  onValueChange,
  excludeProjectId,
  references,
  className,
  placeholder,
  rows = 3,
  maxLength,
  disabled,
  autoFocus,
  onPaste,
  onKeyDown,
  onBlur,
  "aria-label": ariaLabel,
}: TopicReferenceTextareaProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const lastSerialized = useRef<string | null>(null);
  const lastReferences = useRef<TopicReference[] | null | undefined>(undefined);
  const listboxId = useId();
  const [mention, setMention] = useState<Mention | null>(null);
  const [candidates, setCandidates] = useState<TopicReferenceCandidate[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectFirstCandidateWhenReady, setSelectFirstCandidateWhenReady] = useState(false);

  const isOpen = mention !== null && candidates.length > 0;

  // Rebuild the DOM only when the value was changed from outside (reset, load).
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (lastSerialized.current === value && lastReferences.current === references) return;
    hydrateEditor(root, value, references);
    lastSerialized.current = value;
    lastReferences.current = references;
    if (document.activeElement === root) placeCaret(root, root.childNodes.length);
  }, [value, references]);

  useEffect(() => {
    if (autoFocus && rootRef.current) {
      rootRef.current.focus();
      placeCaret(rootRef.current, rootRef.current.childNodes.length);
    }
  }, [autoFocus]);

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
          const usable = results.filter((candidate) => candidate.issue_number);
          setCandidates(usable);
          setActiveIndex(0);
          if (usable.length === 0) setSelectFirstCandidateWhenReady(false);
        }
      } catch {
        // ponytail: a failed lookup just means no suggestions; typing is unaffected.
        if (!cancelled) {
          setCandidates([]);
          setSelectFirstCandidateWhenReady(false);
        }
      }
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [mention, excludeProjectId]);

  function commit() {
    const root = rootRef.current;
    if (!root) return;
    const next = serializeEditor(root);
    lastSerialized.current = next;
    onValueChange(next);
  }

  function syncMention() {
    const root = rootRef.current;
    const selection = window.getSelection();
    const node = selection?.anchorNode;
    if (!root || !selection?.isCollapsed || !(node instanceof Text) || node.parentNode !== root) {
      setMention(null);
      return;
    }
    const next = readMentionQuery(node.data, selection.anchorOffset);
    setMention((current) =>
      next === null
        ? null
        : current?.node === node && current.start === next.start && current.query === next.query
          ? current
          : { node, ...next }
    );
  }

  function insertReference(candidate: TopicReferenceCandidate) {
    if (!mention || !candidate.issue_number || !mention.node.isConnected) return;

    const { node, start } = mention;
    const selection = window.getSelection();
    const caret = selection?.anchorNode === node ? selection.anchorOffset : start + mention.query.length + 1;
    const after = document.createTextNode(` ${node.data.slice(caret)}`);
    node.data = node.data.slice(0, start);
    const chip = createChip(candidate.issue_number, candidate.name_zh);
    node.after(chip, after);
    if (!node.data) node.remove();

    setMention(null);
    setCandidates([]);
    placeCaret(after, 1);
    commit();
  }

  useEffect(() => {
    if (!selectFirstCandidateWhenReady || mention === null) return;
    if (candidates.length > 0) {
      setSelectFirstCandidateWhenReady(false);
      insertReference(candidates[0]);
    }
  }, [candidates, mention, selectFirstCandidateWhenReady]);

  /** Remove a chip adjacent to a collapsed caret; returns true when handled. */
  function deleteAdjacentChip(direction: "backward" | "forward"): boolean {
    const root = rootRef.current;
    const selection = window.getSelection();
    if (!root || !selection?.isCollapsed || !selection.anchorNode) return false;
    const { anchorNode, anchorOffset } = selection;

    let target: Node | null = null;
    if (anchorNode === root) {
      target = direction === "backward" ? root.childNodes[anchorOffset - 1] : root.childNodes[anchorOffset];
    } else if (anchorNode instanceof Text && anchorNode.parentNode === root) {
      if (direction === "backward" && anchorOffset === 0) target = anchorNode.previousSibling;
      if (direction === "forward" && anchorOffset === anchorNode.length) target = anchorNode.nextSibling;
    }
    if (!isChip(target)) return false;

    const index = Array.from(root.childNodes).indexOf(target as ChildNode);
    root.removeChild(target as ChildNode);
    placeCaret(root, index);
    commit();
    return true;
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    // Never steal keys from an active IME composition. / 输入法组词期间不拦截按键。
    const composing = event.nativeEvent.isComposing;
    if (isOpen && !composing) {
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
    if (event.key === "Enter" && !composing) {
      event.preventDefault();
      if (mention !== null) {
        setSelectFirstCandidateWhenReady(true);
        return;
      }
      if (maxLength !== undefined && serializeEditor(event.currentTarget).length >= maxLength) return;
      if (!(typeof document.execCommand === "function" && document.execCommand("insertLineBreak"))) {
        insertText("\n");
      }
      commit();
      return;
    }
    if (event.key === "Backspace" && !composing && deleteAdjacentChip("backward")) {
      event.preventDefault();
      return;
    }
    if (event.key === "Delete" && !composing && deleteAdjacentChip("forward")) {
      event.preventDefault();
      return;
    }
    onKeyDown?.(event);
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    onPaste?.(event);
    if (event.defaultPrevented) return;
    event.preventDefault();
    let text = event.clipboardData.getData("text/plain");
    if (!text) return;
    if (maxLength !== undefined) {
      const room = maxLength - serializeEditor(event.currentTarget).length;
      text = text.slice(0, Math.max(0, room));
    }
    if (text) {
      insertText(text);
      commit();
      syncMention();
    }
  }

  function handleCopy(event: ClipboardEvent<HTMLDivElement>) {
    const selection = window.getSelection();
    if (!selection?.rangeCount || selection.isCollapsed) return;
    const fragment = selection.getRangeAt(0).cloneContents();
    event.clipboardData.setData("text/plain", serializeEditor(fragment));
    event.preventDefault();
  }

  function handleCut(event: ClipboardEvent<HTMLDivElement>) {
    handleCopy(event);
    if (!event.defaultPrevented) return;
    window.getSelection()?.getRangeAt(0).deleteContents();
    commit();
    syncMention();
  }

  return (
    <div className="relative">
      <div
        ref={rootRef}
        // Native attribute so tests and CSS (`[placeholder]:empty::before`) can use it.
        {...{ placeholder }}
        data-empty={value ? undefined : ""}
        role="textbox"
        aria-multiline
        aria-label={ariaLabel}
        aria-disabled={disabled || undefined}
        aria-expanded={isOpen || undefined}
        aria-controls={isOpen ? listboxId : undefined}
        aria-autocomplete={isOpen ? "list" : undefined}
        contentEditable={!disabled}
        suppressContentEditableWarning
        tabIndex={disabled ? -1 : 0}
        style={{ minHeight: `${rows * 1.5 + 1}em`, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
        className={cn(className, "topic-reference-editor overflow-y-auto outline-none")}
        onInput={() => {
          commit();
          syncMention();
        }}
        onBeforeInput={(event) => {
          if (maxLength === undefined) return;
          const data = (event.nativeEvent as InputEvent).data ?? "";
          if (data && serializeEditor(event.currentTarget).length + data.length > maxLength) event.preventDefault();
        }}
        onClick={syncMention}
        onKeyUp={(event) => {
          if (event.key.startsWith("Arrow") || event.key === "Home" || event.key === "End") syncMention();
        }}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onCopy={handleCopy}
        onCut={handleCut}
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
                <span className="min-w-0 flex-1 truncate">{candidate.name_zh}</span>
                <span className="tabular-nums text-sm opacity-60">#{candidate.issue_number}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
