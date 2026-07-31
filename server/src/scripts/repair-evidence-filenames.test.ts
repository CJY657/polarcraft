import fs from 'fs/promises';
import os from 'os';
import path from 'path';

import type { Db } from 'mongodb';
import { afterEach, describe, expect, it } from 'vitest';

import {
  buildEvidenceFilenameRepairReport,
  decodeMojibakeEvidenceFilename,
  readEvidenceFilenameRepairReport,
  runEvidenceFilenameMigration,
} from './repair-evidence-filenames.js';

const temporaryDirectories: string[] = [];

function mojibake(value: string): string {
  return Buffer.from(value, 'utf8').toString('latin1');
}

function createFakeDb(documents: Array<Record<string, any>>) {
  const collection = {
    find: () => ({
      toArray: async () => documents.map((document) => ({ ...document })),
    }),
    updateOne: async (
      filter: Record<string, unknown>,
      update: { $set: Record<string, unknown> }
    ) => {
      const document = documents.find((candidate) =>
        Object.entries(filter).every(([key, value]) => candidate[key] === value)
      );
      if (!document) {
        return { matchedCount: 0, modifiedCount: 0 };
      }

      const before = JSON.stringify(document);
      Object.assign(document, update.$set);
      return {
        matchedCount: 1,
        modifiedCount: before === JSON.stringify(document) ? 0 : 1,
      };
    },
  };
  const db = {
    collection: () => collection,
  } as unknown as Db;

  return { db, documents };
}

async function createReportPath(): Promise<string> {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'evidence-filename-report-'));
  temporaryDirectories.push(directory);
  return path.join(directory, 'report.json');
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      fs.rm(directory, { recursive: true, force: true })
    )
  );
});

describe('decodeMojibakeEvidenceFilename', () => {
  it('repairs only strict Latin-1-to-UTF-8 round trips containing Han characters', () => {
    expect(decodeMojibakeEvidenceFilename(mojibake('中文证据.pdf'))).toBe('中文证据.pdf');

    expect(decodeMojibakeEvidenceFilename('中文证据.pdf')).toBeNull();
    expect(decodeMojibakeEvidenceFilename('evidence.pdf')).toBeNull();
    expect(decodeMojibakeEvidenceFilename('résumé.pdf')).toBeNull();
    expect(decodeMojibakeEvidenceFilename(mojibake('résumé.pdf'))).toBeNull();
    expect(decodeMojibakeEvidenceFilename('Ã(.pdf')).toBeNull();
  });
});

describe('evidence filename repair migration', () => {
  it('is a dry run by default and generates a complete report without changing data', async () => {
    const broken = mojibake('中文证据.pdf');
    const { db, documents } = createFakeDb([
      {
        id: 'evidence-1',
        project_id: 'project-1',
        attachment_original_name: broken,
        updated_at: 'unchanged',
      },
      {
        id: 'evidence-2',
        project_id: 'project-1',
        attachment_original_name: '中文正确.pdf',
      },
    ]);
    const reportPath = await createReportPath();

    const output = await runEvidenceFilenameMigration(db, {
      mode: 'dry-run',
      reportPath,
      generatedAt: new Date('2026-07-31T00:00:00.000Z'),
    });
    const savedReport = await readEvidenceFilenameRepairReport(reportPath);

    expect(output.result).toEqual({
      mode: 'dry-run',
      records: 1,
      modified: 0,
      protected: 1,
      report_path: reportPath,
    });
    expect(savedReport).toEqual({
      version: 1,
      collection: 'research_project_evidence',
      generated_at: '2026-07-31T00:00:00.000Z',
      records: [
        {
          id: 'evidence-1',
          project_id: 'project-1',
          before: broken,
          after: '中文证据.pdf',
        },
      ],
    });
    expect(documents[0]).toEqual({
      id: 'evidence-1',
      project_id: 'project-1',
      attachment_original_name: broken,
      updated_at: 'unchanged',
    });
  });

  it('applies conditionally, is idempotent, and leaves no repairable records', async () => {
    const { db, documents } = createFakeDb([
      {
        id: 'evidence-1',
        project_id: 'project-1',
        attachment_original_name: mojibake('第一份证据.pdf'),
        updated_at: 'unchanged',
      },
      {
        id: 'evidence-2',
        project_id: 'project-2',
        attachment_original_name: mojibake('第二份证据.pdf'),
      },
    ]);
    const reportPath = await createReportPath();

    const first = await runEvidenceFilenameMigration(db, {
      mode: 'apply',
      reportPath,
    });
    const second = await runEvidenceFilenameMigration(db, {
      mode: 'apply',
      reportPath,
    });
    const remaining = await buildEvidenceFilenameRepairReport(db);

    expect(first.result.modified).toBe(2);
    expect(second.result).toMatchObject({ modified: 0, protected: 2 });
    expect(remaining.records).toEqual([]);
    expect(documents).toEqual([
      {
        id: 'evidence-1',
        project_id: 'project-1',
        attachment_original_name: '第一份证据.pdf',
        updated_at: 'unchanged',
      },
      {
        id: 'evidence-2',
        project_id: 'project-2',
        attachment_original_name: '第二份证据.pdf',
      },
    ]);
  });

  it('protects concurrent changes and restores only still-migrated values', async () => {
    const brokenOne = mojibake('第一份证据.pdf');
    const brokenTwo = mojibake('第二份证据.pdf');
    const { db, documents } = createFakeDb([
      {
        id: 'evidence-1',
        project_id: 'project-1',
        attachment_original_name: brokenOne,
      },
      {
        id: 'evidence-2',
        project_id: 'project-2',
        attachment_original_name: brokenTwo,
      },
    ]);
    const reportPath = await createReportPath();

    await runEvidenceFilenameMigration(db, { mode: 'dry-run', reportPath });
    documents[1].attachment_original_name = '并发修改.pdf';
    const applied = await runEvidenceFilenameMigration(db, {
      mode: 'apply',
      reportPath,
    });

    expect(applied.result).toMatchObject({ modified: 1, protected: 1 });
    expect(documents[0].attachment_original_name).toBe('第一份证据.pdf');
    expect(documents[1].attachment_original_name).toBe('并发修改.pdf');

    documents[1].attachment_original_name = '第二份证据.pdf';
    documents[0].attachment_original_name = '应用后再次修改.pdf';
    const restored = await runEvidenceFilenameMigration(db, {
      mode: 'restore',
      reportPath,
    });

    expect(restored.result).toMatchObject({ modified: 1, protected: 1 });
    expect(documents[0].attachment_original_name).toBe('应用后再次修改.pdf');
    expect(documents[1].attachment_original_name).toBe(brokenTwo);
  });
});
