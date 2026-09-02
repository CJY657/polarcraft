import type { Collection } from 'mongodb';

const PROJECT_ISSUE_COUNTER_ID = 'research_project_issue_number';

interface ProjectIssueCounterDocument {
  _id: string;
  value: number;
}

// ponytail: the shared `counters` collection is untyped (Document, _id: ObjectId),
// so the string-_id filter needs one cast instead of a typed collection everywhere.
const COUNTER_FILTER = { _id: PROJECT_ISSUE_COUNTER_ID } as unknown as Record<string, never>;

function readCounterValue(document: Record<string, unknown> | null): number {
  const value = document?.value;
  if (!Number.isSafeInteger(value) || Number(value) < 0) {
    throw new Error('Invalid research project issue counter value');
  }
  return Number(value);
}

export async function ensureProjectIssueCounterAtLeast(
  counters: Collection,
  minimum: number
): Promise<number> {
  if (!Number.isSafeInteger(minimum) || minimum < 0) {
    throw new Error('Project issue counter minimum must be a non-negative integer');
  }

  const counter = await counters.findOneAndUpdate(
    COUNTER_FILTER,
    { $max: { value: minimum } },
    { upsert: true, returnDocument: 'after' }
  );
  return readCounterValue(counter);
}

export async function reserveProjectIssueNumbers(
  counters: Collection,
  count: number
): Promise<{ start: number; end: number }> {
  if (!Number.isSafeInteger(count) || count < 1) {
    throw new Error('Project issue number reservation must be a positive integer');
  }

  const counter = await counters.findOneAndUpdate(
    COUNTER_FILTER,
    { $inc: { value: count } },
    { upsert: true, returnDocument: 'after' }
  );
  const end = readCounterValue(counter);
  return { start: end - count + 1, end };
}

export async function allocateProjectIssueNumber(counters: Collection): Promise<number> {
  return (await reserveProjectIssueNumbers(counters, 1)).start;
}
