/**
 * Topic reference parsing
 * 议题引用解析
 *
 * A reference is the literal text `#123` inside an existing markdown string
 * field, where 123 is a research project's immutable `issue_number`. There is
 * no structured document format and no snapshotted title: the number is the
 * stable key, and the title is resolved per viewer at read time.
 *
 * ponytail: no lookbehind — Safari < 16.4 throws at parse time on `(?<!…)`,
 * and this regex ships to the browser copy of the same rule.
 */

const REFERENCE_PATTERN = /#(\d{1,9})(?![\w#])/g;

/** `#` must not continue a word (`abc#1`) or a run of hashes (markdown `## 1`). */
function startsReference(text: string, index: number): boolean {
  if (index === 0) return true;
  return !/[\w#]/.test(text[index - 1]);
}

export type TopicReferenceSegment =
  | { type: 'text'; value: string }
  | { type: 'reference'; number: number };

/**
 * Split text into plain runs and reference tokens, preserving every character.
 * 将文本拆分为普通片段与引用片段（不丢字符）。
 */
export function splitTopicReferences(text: string): TopicReferenceSegment[] {
  const segments: TopicReferenceSegment[] = [];
  let cursor = 0;

  REFERENCE_PATTERN.lastIndex = 0;
  for (const match of text.matchAll(REFERENCE_PATTERN)) {
    const start = match.index ?? 0;
    if (!startsReference(text, start)) continue;

    if (start > cursor) {
      segments.push({ type: 'text', value: text.slice(cursor, start) });
    }
    segments.push({ type: 'reference', number: Number(match[1]) });
    cursor = start + match[0].length;
  }

  if (cursor < text.length) {
    segments.push({ type: 'text', value: text.slice(cursor) });
  }
  return segments;
}

/**
 * Collect the distinct issue numbers referenced across the given fields.
 * 汇总各字段中引用到的议题编号（去重升序）。
 */
export function extractTopicReferenceNumbers(
  ...texts: Array<string | null | undefined>
): number[] {
  const numbers = new Set<number>();

  for (const text of texts) {
    if (typeof text !== 'string' || !text) continue;
    for (const segment of splitTopicReferences(text)) {
      if (segment.type === 'reference') {
        numbers.add(segment.number);
      }
    }
  }

  return [...numbers].sort((a, b) => a - b);
}
