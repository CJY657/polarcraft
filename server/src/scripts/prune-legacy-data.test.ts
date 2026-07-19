import { describe, expect, it, vi } from 'vitest';
import type { Db } from 'mongodb';

import { LEGACY_COLLECTIONS, pruneLegacyCollections } from './prune-legacy-data.js';

interface FakeCollectionStats {
  count: number;
  size: number;
  storageSize: number;
  totalIndexSize: number;
}

function buildFakeDb(collections: Record<string, FakeCollectionStats>) {
  const drop = vi.fn(async (_name: string) => true);
  const db = {
    listCollections: () => ({
      toArray: async () => Object.keys(collections).map((name) => ({ name })),
    }),
    collection: (name: string) => ({
      aggregate: () => ({
        toArray: async () => [{ storageStats: collections[name] }],
      }),
      drop: () => drop(name),
    }),
  } as unknown as Db;

  return { db, drop };
}

describe('pruneLegacyCollections', () => {
  it('reports sizes without deleting anything on a dry run', async () => {
    const { db, drop } = buildFakeDb({
      research_ai_messages: { count: 12, size: 4096, storageSize: 20480, totalIndexSize: 12288 },
      research_canvases: { count: 3, size: 900, storageSize: 16384, totalIndexSize: 8192 },
      research_projects: { count: 5, size: 5000, storageSize: 36864, totalIndexSize: 12288 },
    });

    const reports = await pruneLegacyCollections(db, { apply: false });

    expect(drop).not.toHaveBeenCalled();
    expect(reports.map((report) => report.name)).toEqual([...LEGACY_COLLECTIONS]);
    expect(reports.find((report) => report.name === 'research_ai_messages')).toEqual({
      name: 'research_ai_messages',
      exists: true,
      docs: 12,
      dataSize: 4096,
      storageSize: 20480,
      indexSize: 12288,
      dropped: false,
    });
  });

  it('drops only existing legacy collections with --apply and never touches live ones', async () => {
    const { db, drop } = buildFakeDb({
      research_ai_messages: { count: 12, size: 4096, storageSize: 20480, totalIndexSize: 12288 },
      research_canvases: { count: 3, size: 900, storageSize: 16384, totalIndexSize: 8192 },
      research_projects: { count: 5, size: 5000, storageSize: 36864, totalIndexSize: 12288 },
    });

    const reports = await pruneLegacyCollections(db, { apply: true });

    expect(drop.mock.calls.map(([name]) => name)).toEqual([
      'research_ai_messages',
      'research_canvases',
    ]);
    expect(reports.find((report) => report.name === 'research_ai_messages')?.dropped).toBe(true);
    // 不存在的遗留集合按 absent 报告，不触发 drop。
    expect(reports.find((report) => report.name === 'research_nodes')).toMatchObject({
      exists: false,
      dropped: false,
    });
  });
});
