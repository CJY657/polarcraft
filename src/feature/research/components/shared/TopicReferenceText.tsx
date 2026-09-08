/**
 * Topic reference text
 * 议题引用文本
 *
 * Renders a plain-text field (description, discussion message) with `#123`
 * tokens turned into inline chips carrying the target's *current* title. The
 * text stays a plain string everywhere — the number is the stable key and the
 * server resolves titles per viewer, so a renamed topic updates by itself and
 * a private one never leaks its name.
 *
 * ponytail: a `#123` the viewer cannot resolve stays literal text. Rendering a
 * "议题不可用" placeholder instead would tell an outsider that topic #123 exists,
 * which is exactly what the access rules forbid.
 */

import { Link } from "react-router-dom";

/** A reference target the current viewer is allowed to see. */
export interface TopicReference {
  number: number;
  project_id: string;
  name_zh: string;
  name_en?: string | null;
}

type Segment =
  | { type: "text"; value: string }
  | { type: "reference"; number: number };

// ponytail: no lookbehind — Safari < 16.4 throws at parse time on `(?<!…)`.
const REFERENCE_PATTERN = /#(\d{1,9})(?![\w#])/g;

/** `#` must not continue a word (`abc#1`) or a run of hashes (markdown `## 1`). */
function startsReference(text: string, index: number): boolean {
  if (index === 0) return true;
  return !/[\w#]/.test(text[index - 1]);
}

export function splitTopicReferences(text: string): Segment[] {
  const segments: Segment[] = [];
  let cursor = 0;

  for (const match of text.matchAll(REFERENCE_PATTERN)) {
    const start = match.index ?? 0;
    if (!startsReference(text, start)) continue;

    if (start > cursor) {
      segments.push({ type: "text", value: text.slice(cursor, start) });
    }
    segments.push({ type: "reference", number: Number(match[1]) });
    cursor = start + match[0].length;
  }

  if (cursor < text.length) {
    segments.push({ type: "text", value: text.slice(cursor) });
  }
  return segments;
}

interface TopicReferenceTextProps {
  text: string;
  references?: TopicReference[] | null;
}

export default function TopicReferenceText({ text, references }: TopicReferenceTextProps) {
  if (!references?.length) {
    return <>{text}</>;
  }

  const byNumber = new Map(references.map((reference) => [reference.number, reference]));

  return (
    <>
      {splitTopicReferences(text).map((segment, index) => {
        if (segment.type === "text") {
          return <span key={index}>{segment.value}</span>;
        }

        const reference = byNumber.get(segment.number);
        if (!reference) {
          return <span key={index}>{`#${segment.number}`}</span>;
        }

        return (
          <Link
            key={index}
            to={`/lab/projects/${reference.project_id}`}
            title={reference.name_zh}
            className="mx-0.5 inline-flex max-w-full items-baseline gap-1 rounded-md border border-[var(--paper-accent)]/40 bg-[var(--paper-accent)]/10 px-1.5 py-px align-baseline font-medium text-[var(--paper-foreground)] no-underline transition-colors hover:bg-[var(--paper-accent)]/20"
          >
            <span className="tabular-nums opacity-70">#{reference.number}</span>
            <span className="truncate">{reference.name_zh}</span>
          </Link>
        );
      })}
    </>
  );
}
