import { describe, expect, it, vi } from 'vitest';
import type { Db } from 'mongodb';

import { runUserLastLoginBackfill } from './backfill-user-last-login.js';

type Row = Record<string, unknown>;

function matchesField(row: Row, key: string, condition: unknown): boolean {
  const exists = Object.prototype.hasOwnProperty.call(row, key);
  const value = row[key];

  if (condition === null) {
    return !exists || value === null;
  }

  if (!condition || typeof condition !== 'object') {
    return value === condition;
  }

  const operators = condition as Record<string, unknown>;
  if ('$exists' in operators) {
    return exists === operators.$exists;
  }
  if ('$type' in operators) {
    return operators.$type === 'date' && value instanceof Date;
  }
  if ('$not' in operators) {
    return !matchesField(row, key, operators.$not);
  }

  return false;
}

function matches(row: Row, filter: Row): boolean {
  if (Array.isArray(filter.$and)) {
    return filter.$and.every((entry) => matches(row, entry as Row));
  }
  if (Array.isArray(filter.$or)) {
    return filter.$or.some((entry) => matches(row, entry as Row));
  }

  return Object.entries(filter).every(([key, condition]) => matchesField(row, key, condition));
}

function buildFakeDb(rows: Row[]) {
  const updateMany = vi.fn(async (filter: Row, pipeline: Row[]) => {
    expect(pipeline).toEqual([{ $set: { last_login_at: '$created_at' } }]);
    let modifiedCount = 0;

    for (const row of rows) {
      if (!matches(row, filter)) {
        continue;
      }
      row.last_login_at = row.created_at;
      modifiedCount += 1;
    }

    return { modifiedCount };
  });
  const db = {
    collection: (name: string) => {
      expect(name).toBe('users');
      return {
        countDocuments: async (filter: Row) => rows.filter((row) => matches(row, filter)).length,
        updateMany,
      };
    },
  } as unknown as Db;

  return { db, updateMany };
}

describe('runUserLastLoginBackfill', () => {
  it('backfills valid missing values, preserves existing logins, skips invalid dates, and is idempotent', async () => {
    const createdAtNullLogin = new Date('2025-01-01T00:00:00.000Z');
    const createdAtMissingLogin = new Date('2025-02-01T00:00:00.000Z');
    const existingLogin = new Date('2025-03-02T00:00:00.000Z');
    const rows: Row[] = [
      {
        id: 'null-login',
        created_at: createdAtNullLogin,
        updated_at: new Date('2025-01-02T00:00:00.000Z'),
        last_login_at: null,
      },
      {
        id: 'missing-login',
        created_at: createdAtMissingLogin,
        updated_at: new Date('2025-02-02T00:00:00.000Z'),
      },
      {
        id: 'existing-login',
        created_at: new Date('2025-03-01T00:00:00.000Z'),
        last_login_at: existingLogin,
      },
      { id: 'missing-created-at', last_login_at: null },
      { id: 'string-created-at', created_at: '2025-04-01T00:00:00.000Z' },
    ];
    const originalUpdatedAt = rows[0].updated_at;
    const { db } = buildFakeDb(rows);

    await expect(runUserLastLoginBackfill(db)).resolves.toEqual({
      candidates: 2,
      modified: 2,
      skipped_invalid_created_at: 2,
    });
    expect(rows[0]).toMatchObject({
      last_login_at: createdAtNullLogin,
      updated_at: originalUpdatedAt,
    });
    expect(rows[1].last_login_at).toBe(createdAtMissingLogin);
    expect(rows[2].last_login_at).toBe(existingLogin);
    expect(rows[3].last_login_at).toBeNull();
    expect(rows[4]).not.toHaveProperty('last_login_at');

    await expect(runUserLastLoginBackfill(db)).resolves.toEqual({
      candidates: 0,
      modified: 0,
      skipped_invalid_created_at: 2,
    });
  });

  it('reports candidates without changing data in dry-run mode', async () => {
    const rows: Row[] = [
      { id: 'candidate', created_at: new Date('2025-01-01T00:00:00.000Z'), last_login_at: null },
    ];
    const { db, updateMany } = buildFakeDb(rows);

    await expect(runUserLastLoginBackfill(db, { apply: false })).resolves.toEqual({
      candidates: 1,
      modified: 0,
      skipped_invalid_created_at: 0,
    });
    expect(updateMany).not.toHaveBeenCalled();
    expect(rows[0].last_login_at).toBeNull();
  });
});
