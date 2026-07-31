import { pathToFileURL } from 'url';
import { MongoClient, type Db, type Filter } from 'mongodb';

import { config } from '../config/index.js';

type LegacyUserDocument = {
  created_at?: Date | string | null;
  last_login_at?: Date | string | null;
};

const MISSING_LAST_LOGIN_FILTER: Filter<LegacyUserDocument> = {
  $or: [
    { last_login_at: null },
    { last_login_at: { $exists: false } },
  ],
};

const VALID_CREATED_AT_FILTER: Filter<LegacyUserDocument> = {
  created_at: { $type: 'date' },
};

const INVALID_CREATED_AT_FILTER: Filter<LegacyUserDocument> = {
  created_at: { $not: { $type: 'date' } },
};

export interface UserLastLoginBackfillReport {
  candidates: number;
  modified: number;
  skipped_invalid_created_at: number;
}

export async function runUserLastLoginBackfill(
  db: Db,
  options: { apply: boolean } = { apply: true }
): Promise<UserLastLoginBackfillReport> {
  const users = db.collection<LegacyUserDocument>('users');
  const eligibleFilter: Filter<LegacyUserDocument> = {
    $and: [MISSING_LAST_LOGIN_FILTER, VALID_CREATED_AT_FILTER],
  };
  const invalidCreatedAtFilter: Filter<LegacyUserDocument> = {
    $and: [MISSING_LAST_LOGIN_FILTER, INVALID_CREATED_AT_FILTER],
  };

  const [candidates, skippedInvalidCreatedAt] = await Promise.all([
    users.countDocuments(eligibleFilter),
    users.countDocuments(invalidCreatedAtFilter),
  ]);

  if (!options.apply) {
    return {
      candidates,
      modified: 0,
      skipped_invalid_created_at: skippedInvalidCreatedAt,
    };
  }

  const result = await users.updateMany(
    eligibleFilter,
    [{ $set: { last_login_at: '$created_at' } }]
  );

  return {
    candidates,
    modified: result.modifiedCount,
    skipped_invalid_created_at: skippedInvalidCreatedAt,
  };
}

async function main(): Promise<void> {
  const apply = !process.argv.includes('--dry-run');
  const client = new MongoClient(config.database.uri, { maxPoolSize: 1 });
  await client.connect();
  try {
    const db = client.db(config.database.name);
    const report = await runUserLastLoginBackfill(db, { apply });
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
