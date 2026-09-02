import { pathToFileURL } from 'url';
import { MongoClient, type Db, type Filter } from 'mongodb';

import { config } from '../config/index.js';
import {
  ensureProjectIssueCounterAtLeast,
  reserveProjectIssueNumbers,
} from '../models/research-project-issue-number.util.js';

type ResearchProjectIssueNumberDocument = {
  id: string;
  issue_number?: number | null;
  created_at?: Date | string | null;
};

const MISSING_ISSUE_NUMBER_FILTER: Filter<ResearchProjectIssueNumberDocument> = {
  $or: [
    { issue_number: null },
    { issue_number: { $exists: false } },
  ],
};

export interface ResearchProjectIssueNumberBackfillReport {
  candidates: number;
  modified: number;
  skipped: number;
  max_issue_number: number;
}

export async function runResearchProjectIssueNumberBackfill(
  db: Db,
  options: { apply: boolean } = { apply: true }
): Promise<ResearchProjectIssueNumberBackfillReport> {
  const projects = db.collection<ResearchProjectIssueNumberDocument>('research_projects');
  const counters = db.collection('counters');
  const candidates = await projects
    .find(MISSING_ISSUE_NUMBER_FILTER, { projection: { _id: 0, id: 1, created_at: 1 } })
    .sort({ created_at: 1, id: 1 })
    .toArray();
  const currentHighest = await projects.findOne(
    { issue_number: { $exists: true, $ne: null } },
    { projection: { _id: 0, issue_number: 1 }, sort: { issue_number: -1 } }
  );
  const existingMaximum = Number.isSafeInteger(currentHighest?.issue_number)
    ? Number(currentHighest?.issue_number)
    : 0;

  if (!options.apply) {
    return {
      candidates: candidates.length,
      modified: 0,
      skipped: 0,
      max_issue_number: existingMaximum,
    };
  }

  const counterFloor = await ensureProjectIssueCounterAtLeast(counters, existingMaximum);
  if (candidates.length === 0) {
    return {
      candidates: 0,
      modified: 0,
      skipped: 0,
      max_issue_number: counterFloor,
    };
  }

  const reservation = await reserveProjectIssueNumbers(counters, candidates.length);
  let modified = 0;

  for (const [index, project] of candidates.entries()) {
    const result = await projects.updateOne(
      { id: project.id, ...MISSING_ISSUE_NUMBER_FILTER },
      { $set: { issue_number: reservation.start + index } }
    );
    modified += result.modifiedCount;
  }

  const maxIssueNumber = await ensureProjectIssueCounterAtLeast(counters, reservation.end);
  return {
    candidates: candidates.length,
    modified,
    skipped: candidates.length - modified,
    max_issue_number: maxIssueNumber,
  };
}

async function main(): Promise<void> {
  const apply = process.argv.includes('--apply');
  const client = new MongoClient(config.database.uri, { maxPoolSize: 1 });
  await client.connect();
  try {
    const db = client.db(config.database.name);
    const report = await runResearchProjectIssueNumberBackfill(db, { apply });
    console.info(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', ...report }, null, 2));
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
