/**
 * Repair mojibake evidence attachment filenames.
 *
 * Multer historically decoded non-extended multipart filename parameters as
 * Latin-1. This migration reverses only values whose Latin-1 bytes are strict,
 * round-trippable UTF-8 and whose decoded value contains Han characters.
 *
 * Usage:
 *   pnpm --filter polariscope-server repair:evidence-filenames
 *   pnpm --filter polariscope-server repair:evidence-filenames --report=/path/report.json
 *   pnpm --filter polariscope-server repair:evidence-filenames --apply --report=/path/report.json
 *   pnpm --filter polariscope-server repair:evidence-filenames --restore=/path/report.json
 */

import fs from 'fs/promises';
import { pathToFileURL } from 'url';
import { TextDecoder } from 'util';
import { MongoClient, type Db } from 'mongodb';

import { config } from '../config/index.js';

const REPORT_VERSION = 1;
const EVIDENCE_COLLECTION = 'research_project_evidence';
const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
const hanCharacterPattern = /\p{Script=Han}/u;

interface EvidenceFilenameDocument {
  id?: unknown;
  project_id?: unknown;
  attachment_original_name?: unknown;
}

export interface EvidenceFilenameRepairRecord {
  id: string;
  project_id: string;
  before: string;
  after: string;
}

export interface EvidenceFilenameRepairReport {
  version: typeof REPORT_VERSION;
  collection: typeof EVIDENCE_COLLECTION;
  generated_at: string;
  records: EvidenceFilenameRepairRecord[];
}

export interface EvidenceFilenameMigrationResult {
  mode: 'dry-run' | 'apply' | 'restore';
  records: number;
  modified: number;
  protected: number;
  report_path: string | null;
}

export interface EvidenceFilenameMigrationOptions {
  mode: EvidenceFilenameMigrationResult['mode'];
  reportPath?: string;
  generatedAt?: Date;
}

export function decodeMojibakeEvidenceFilename(value: string): string | null {
  const latin1Bytes = Buffer.from(value, 'latin1');

  if (latin1Bytes.toString('latin1') !== value) {
    return null;
  }

  let decoded: string;
  try {
    decoded = utf8Decoder.decode(latin1Bytes);
  } catch {
    return null;
  }

  if (
    decoded === value
    || !hanCharacterPattern.test(decoded)
    || !Buffer.from(decoded, 'utf8').equals(latin1Bytes)
  ) {
    return null;
  }

  return decoded;
}

export async function buildEvidenceFilenameRepairReport(
  db: Db,
  generatedAt = new Date()
): Promise<EvidenceFilenameRepairReport> {
  const documents = await db
    .collection<EvidenceFilenameDocument>(EVIDENCE_COLLECTION)
    .find(
      {},
      {
        projection: {
          _id: 0,
          id: 1,
          project_id: 1,
          attachment_original_name: 1,
        },
      }
    )
    .toArray();
  const records: EvidenceFilenameRepairRecord[] = [];

  for (const document of documents) {
    if (
      typeof document.id !== 'string'
      || typeof document.project_id !== 'string'
      || typeof document.attachment_original_name !== 'string'
    ) {
      continue;
    }

    const repaired = decodeMojibakeEvidenceFilename(document.attachment_original_name);
    if (!repaired) {
      continue;
    }

    records.push({
      id: document.id,
      project_id: document.project_id,
      before: document.attachment_original_name,
      after: repaired,
    });
  }

  return {
    version: REPORT_VERSION,
    collection: EVIDENCE_COLLECTION,
    generated_at: generatedAt.toISOString(),
    records,
  };
}

function validateEvidenceFilenameRepairReport(
  value: unknown
): asserts value is EvidenceFilenameRepairReport {
  if (!value || typeof value !== 'object') {
    throw new Error('Invalid evidence filename repair report');
  }

  const report = value as Partial<EvidenceFilenameRepairReport>;
  if (
    report.version !== REPORT_VERSION
    || report.collection !== EVIDENCE_COLLECTION
    || typeof report.generated_at !== 'string'
    || !Array.isArray(report.records)
  ) {
    throw new Error('Unsupported evidence filename repair report');
  }

  const ids = new Set<string>();
  for (const record of report.records) {
    if (
      !record
      || typeof record.id !== 'string'
      || typeof record.project_id !== 'string'
      || typeof record.before !== 'string'
      || typeof record.after !== 'string'
      || decodeMojibakeEvidenceFilename(record.before) !== record.after
      || ids.has(record.id)
    ) {
      throw new Error('Invalid evidence filename repair report record');
    }
    ids.add(record.id);
  }
}

export async function writeEvidenceFilenameRepairReport(
  reportPath: string,
  report: EvidenceFilenameRepairReport
): Promise<void> {
  const temporaryPath = `${reportPath}.tmp-${process.pid}-${Date.now()}`;
  try {
    await fs.writeFile(temporaryPath, `${JSON.stringify(report, null, 2)}\n`, {
      encoding: 'utf8',
      flag: 'wx',
    });
    await fs.link(temporaryPath, reportPath);
  } finally {
    await fs.rm(temporaryPath, { force: true });
  }
}

export async function readEvidenceFilenameRepairReport(
  reportPath: string
): Promise<EvidenceFilenameRepairReport> {
  const report = JSON.parse(await fs.readFile(reportPath, 'utf8')) as unknown;
  validateEvidenceFilenameRepairReport(report);
  return report;
}

async function reportExists(reportPath: string): Promise<boolean> {
  try {
    await fs.access(reportPath);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

async function applyRepairReport(
  db: Db,
  report: EvidenceFilenameRepairReport,
  restore: boolean
): Promise<{ modified: number; protected: number }> {
  const collection = db.collection(EVIDENCE_COLLECTION);
  let modified = 0;

  for (const record of report.records) {
    const currentValue = restore ? record.after : record.before;
    const nextValue = restore ? record.before : record.after;
    const result = await collection.updateOne(
      {
        id: record.id,
        project_id: record.project_id,
        attachment_original_name: currentValue,
      },
      {
        $set: {
          attachment_original_name: nextValue,
        },
      }
    );
    modified += result.modifiedCount;
  }

  return {
    modified,
    protected: report.records.length - modified,
  };
}

export async function runEvidenceFilenameMigration(
  db: Db,
  options: EvidenceFilenameMigrationOptions
): Promise<{
  report: EvidenceFilenameRepairReport;
  result: EvidenceFilenameMigrationResult;
}> {
  if (options.mode === 'restore') {
    if (!options.reportPath) {
      throw new Error('--restore requires a report path');
    }

    const report = await readEvidenceFilenameRepairReport(options.reportPath);
    const counts = await applyRepairReport(db, report, true);
    return {
      report,
      result: {
        mode: 'restore',
        records: report.records.length,
        ...counts,
        report_path: options.reportPath,
      },
    };
  }

  let report: EvidenceFilenameRepairReport;
  if (
    options.mode === 'apply'
    && options.reportPath
    && await reportExists(options.reportPath)
  ) {
    report = await readEvidenceFilenameRepairReport(options.reportPath);
  } else {
    report = await buildEvidenceFilenameRepairReport(db, options.generatedAt);
    if (options.reportPath) {
      await writeEvidenceFilenameRepairReport(options.reportPath, report);
    }
  }

  if (options.mode === 'dry-run') {
    return {
      report,
      result: {
        mode: 'dry-run',
        records: report.records.length,
        modified: 0,
        protected: report.records.length,
        report_path: options.reportPath ?? null,
      },
    };
  }

  if (!options.reportPath) {
    throw new Error('--apply requires --report=<path>');
  }

  const counts = await applyRepairReport(db, report, false);
  return {
    report,
    result: {
      mode: 'apply',
      records: report.records.length,
      ...counts,
      report_path: options.reportPath,
    },
  };
}

function readOption(args: string[], name: string): string | undefined {
  const prefix = `${name}=`;
  const inline = args.find((argument) => argument.startsWith(prefix));
  if (inline) {
    return inline.slice(prefix.length);
  }

  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function parseCliOptions(args: string[]): EvidenceFilenameMigrationOptions {
  const apply = args.includes('--apply');
  const hasRestoreOption = args.some(
    (argument) => argument === '--restore' || argument.startsWith('--restore=')
  );
  const hasReportOption = args.some(
    (argument) => argument === '--report' || argument.startsWith('--report=')
  );
  const restorePath = readOption(args, '--restore');
  const reportPath = readOption(args, '--report');

  if (hasRestoreOption && (!restorePath || restorePath.startsWith('--'))) {
    throw new Error('--restore requires a report path');
  }
  if (hasReportOption && (!reportPath || reportPath.startsWith('--'))) {
    throw new Error('--report requires a path');
  }
  if (apply && restorePath) {
    throw new Error('--apply and --restore cannot be used together');
  }
  if (apply && !reportPath) {
    throw new Error('--apply requires --report=<path>');
  }

  return restorePath
    ? { mode: 'restore', reportPath: restorePath }
    : { mode: apply ? 'apply' : 'dry-run', reportPath };
}

async function main(): Promise<void> {
  const options = parseCliOptions(process.argv.slice(2));
  const client = new MongoClient(config.database.uri, { maxPoolSize: 1 });
  await client.connect();
  try {
    const db = client.db(config.database.name);
    const output = await runEvidenceFilenameMigration(db, options);
    console.info(JSON.stringify(output, null, 2));
  } finally {
    await client.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
