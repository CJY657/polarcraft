/**
 * Prune legacy research collections
 * 清理遗留课题集合
 *
 * The React Flow canvas UI was removed from the frontend and the AI advisor
 * no longer persists chat history, but the collections behind them still hold
 * documents and indexes in every environment. This script is read-only by
 * default: it reports per-collection document counts and sizes. Pass --apply
 * to drop the collections — a drop reclaims data and index disk space
 * immediately. Canvas collections listed in COLLECTION_INDEXES are recreated
 * empty (a few KB each) on the next server start; research_ai_messages is not
 * recreated.
 * 前端画布已下线、AI 顾问不再持久化对话，但相关集合的存量文档与索引仍占用
 * 空间。脚本默认只读报告；加 --apply 才执行 drop（立即回收数据与索引空间）。
 * 列在 COLLECTION_INDEXES 中的画布集合会在下次启动时重建为空集合（每个仅几
 * KB），research_ai_messages 不会重建。
 *
 * Usage:
 *   pnpm --filter polariscope-server prune:legacy            # dry-run report
 *   pnpm --filter polariscope-server prune:legacy --apply    # drop for real
 */

import { pathToFileURL } from 'url';
import type { Db } from 'mongodb';
import { closeDatabase, connectDatabase } from '../database/connection.js';
import { formatBytes } from './db-stats.js';

export const LEGACY_COLLECTIONS = [
  'research_ai_messages',
  'research_canvases',
  'research_nodes',
  'research_edges',
  'research_node_comments',
] as const;

export interface LegacyCollectionReport {
  name: string;
  exists: boolean;
  docs: number;
  dataSize: number;
  storageSize: number;
  indexSize: number;
  dropped: boolean;
}

function numberOrZero(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export async function pruneLegacyCollections(
  db: Db,
  options: { apply: boolean }
): Promise<LegacyCollectionReport[]> {
  const existingNames = new Set(
    (await db.listCollections({}, { nameOnly: true }).toArray()).map((entry) => entry.name)
  );
  const reports: LegacyCollectionReport[] = [];

  for (const name of LEGACY_COLLECTIONS) {
    const report: LegacyCollectionReport = {
      name,
      exists: existingNames.has(name),
      docs: 0,
      dataSize: 0,
      storageSize: 0,
      indexSize: 0,
      dropped: false,
    };

    if (report.exists) {
      const [result] = await db
        .collection(name)
        .aggregate([{ $collStats: { storageStats: {} } }])
        .toArray();
      const stats = (result?.storageStats ?? {}) as Record<string, unknown>;
      report.docs = numberOrZero(stats.count);
      report.dataSize = numberOrZero(stats.size);
      report.storageSize = numberOrZero(stats.storageSize);
      report.indexSize = numberOrZero(stats.totalIndexSize);

      if (options.apply) {
        try {
          report.dropped = await db.collection(name).drop();
        } catch (error) {
          // 26 = NamespaceNotFound：并发下已被删除，视为已完成。
          if ((error as { code?: number }).code !== 26) {
            throw error;
          }
        }
      }
    }

    reports.push(report);
  }

  return reports;
}

async function main(): Promise<void> {
  const apply = process.argv.includes('--apply');
  const db = await connectDatabase();
  const reports = await pruneLegacyCollections(db, { apply });

  const header = ['collection', 'docs', 'data', 'on-disk', 'indexes', apply ? 'dropped' : 'status'];
  const table = reports.map((report) => [
    report.name,
    String(report.docs),
    formatBytes(report.dataSize),
    formatBytes(report.storageSize),
    formatBytes(report.indexSize),
    apply ? (report.dropped ? 'yes' : report.exists ? 'no' : 'absent') : report.exists ? 'present' : 'absent',
  ]);
  const widths = header.map((title, column) =>
    Math.max(title.length, ...table.map((cells) => cells[column].length))
  );
  const renderLine = (cells: string[]) =>
    cells
      .map((cell, column) => (column === 0 ? cell.padEnd(widths[column]) : cell.padStart(widths[column])))
      .join('  ');

  console.log(renderLine(header));
  console.log(widths.map((width) => '-'.repeat(width)).join('  '));
  for (const cells of table) {
    console.log(renderLine(cells));
  }

  const reclaimable = reports.reduce(
    (sum, report) => sum + report.storageSize + report.indexSize,
    0
  );
  console.log('');
  if (apply) {
    console.log(`Dropped ${reports.filter((report) => report.dropped).length} collections, reclaimed ${formatBytes(reclaimable)} (data + indexes).`);
  } else {
    console.log(`Dry run — nothing deleted. Re-run with --apply to drop these collections (~${formatBytes(reclaimable)} reclaimable).`);
  }

  await closeDatabase();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(async (error) => {
    console.error(error);
    try {
      await closeDatabase();
    } catch {
      // Ignore shutdown failures in the prune script.
    }
    process.exitCode = 1;
  });
}
