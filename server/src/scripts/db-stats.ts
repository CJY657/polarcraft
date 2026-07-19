/**
 * MongoDB Space Report
 * MongoDB 空间占用报告
 *
 * Read-only: prints per-collection document counts, logical data size,
 * on-disk (compressed) size, reusable free space, and index size, plus
 * database totals. Use it to see which collections actually grow.
 * 只读脚本：按集合输出文档数、逻辑大小、磁盘占用（压缩后）、可复用空闲
 * 空间与索引大小，并汇总数据库总量，用于定位真正增长的集合。
 *
 * Usage: pnpm db:stats
 */

import { pathToFileURL } from 'url';
import { closeDatabase, connectDatabase } from '../database/connection.js';

interface CollectionSpace {
  name: string;
  count: number;
  dataSize: number;
  storageSize: number;
  freeStorageSize: number;
  indexSize: number;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(Math.floor(Math.log2(bytes) / 10), units.length - 1);
  const value = bytes / 2 ** (10 * exponent);
  return `${value >= 100 ? Math.round(value) : value.toFixed(1)} ${units[exponent]}`;
}

function numberOrZero(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export async function collectDatabaseSpace(): Promise<CollectionSpace[]> {
  const db = await connectDatabase();
  const collections = await db.listCollections({}, { nameOnly: true }).toArray();
  const rows: CollectionSpace[] = [];

  for (const { name } of collections) {
    const [result] = await db
      .collection(name)
      .aggregate([{ $collStats: { storageStats: {} } }])
      .toArray();
    const stats = (result?.storageStats ?? {}) as Record<string, unknown>;

    rows.push({
      name,
      count: numberOrZero(stats.count),
      dataSize: numberOrZero(stats.size),
      storageSize: numberOrZero(stats.storageSize),
      freeStorageSize: numberOrZero(stats.freeStorageSize),
      indexSize: numberOrZero(stats.totalIndexSize),
    });
  }

  return rows.sort((a, b) => b.storageSize + b.indexSize - (a.storageSize + a.indexSize));
}

async function main(): Promise<void> {
  const rows = await collectDatabaseSpace();
  const db = await connectDatabase();
  const dbStats = (await db.command({ dbStats: 1 })) as Record<string, unknown>;

  const header = ['collection', 'docs', 'data', 'on-disk', 'free', 'indexes'];
  const table = rows.map((row) => [
    row.name,
    String(row.count),
    formatBytes(row.dataSize),
    formatBytes(row.storageSize),
    formatBytes(row.freeStorageSize),
    formatBytes(row.indexSize),
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

  console.log('');
  console.log(`totals  data: ${formatBytes(numberOrZero(dbStats.dataSize))}`);
  console.log(`        on-disk (collections): ${formatBytes(numberOrZero(dbStats.storageSize))}`);
  console.log(`        indexes: ${formatBytes(numberOrZero(dbStats.indexSize))}`);
  console.log(`        disk used on volume: ${formatBytes(numberOrZero(dbStats.fsUsedSize))}`);

  await closeDatabase();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(async (error) => {
    console.error(error);
    try {
      await closeDatabase();
    } catch {
      // Ignore shutdown failures in the stats script.
    }
    process.exitCode = 1;
  });
}
