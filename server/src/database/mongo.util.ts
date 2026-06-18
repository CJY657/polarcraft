import type { Document } from 'mongodb';

export function normalizeDocument<T>(doc: Document | null): T | null {
  if (!doc) {
    return null;
  }

  const { _id, ...rest } = doc;
  return rest as unknown as T;
}

export function normalizeDocuments<T>(docs: Document[]): T[] {
  return docs.map((doc) => normalizeDocument<T>(doc) as T);
}

export function pickDefined<T extends Record<string, unknown>>(input: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function compareRole(a: string, b: string): number {
  const rank: Record<string, number> = {
    owner: 0,
    admin: 1,
    member: 2,
    editor: 2,
    viewer: 2,
  };

  return (rank[a] ?? Number.MAX_SAFE_INTEGER) - (rank[b] ?? Number.MAX_SAFE_INTEGER);
}

/**
 * Trim, drop empties, and de-duplicate a list of string URLs.
 * 去除空白、空值并去重的字符串 URL 列表。
 */
export function normalizeImageUrls(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const uniqueUrls = new Set<string>();

  for (const item of value) {
    if (typeof item !== 'string') {
      continue;
    }

    const trimmed = item.trim();
    if (!trimmed) {
      continue;
    }

    uniqueUrls.add(trimmed);
  }

  return [...uniqueUrls];
}
