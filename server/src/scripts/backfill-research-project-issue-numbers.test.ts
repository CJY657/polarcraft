import { describe, expect, it } from 'vitest';
import type { Db } from 'mongodb';

import { runResearchProjectIssueNumberBackfill } from './backfill-research-project-issue-numbers.js';

type ProjectRow = {
  id: string;
  issue_number?: number | null;
  created_at: Date;
};

function buildFakeDb(projects: ProjectRow[], initialCounter?: number) {
  let counter = initialCounter;
  const counters = {
    findOneAndUpdate: async (
      _filter: Record<string, unknown>,
      update: { $max?: { value: number }; $inc?: { value: number } }
    ) => {
      if (update.$max) {
        counter = Math.max(counter ?? 0, update.$max.value);
      }
      if (update.$inc) {
        counter = (counter ?? 0) + update.$inc.value;
      }
      return { _id: 'research_project_issue_number', value: counter };
    },
  };
  const projectCollection = {
    find: () => ({
      sort: () => ({
        toArray: async () => projects
          .filter((project) => project.issue_number == null)
          .sort((a, b) => a.created_at.getTime() - b.created_at.getTime() || a.id.localeCompare(b.id)),
      }),
    }),
    findOne: async () => {
      const assigned = projects
        .filter((project) => Number.isSafeInteger(project.issue_number))
        .sort((a, b) => Number(b.issue_number) - Number(a.issue_number));
      return assigned[0] ?? null;
    },
    updateOne: async (
      filter: { id: string },
      update: { $set: { issue_number: number } }
    ) => {
      const project = projects.find((candidate) => candidate.id === filter.id);
      if (!project || project.issue_number != null) {
        return { modifiedCount: 0 };
      }
      project.issue_number = update.$set.issue_number;
      return { modifiedCount: 1 };
    },
  };
  const db = {
    collection: (name: string) => name === 'research_projects' ? projectCollection : counters,
  } as unknown as Db;

  return { db, getCounter: () => counter };
}

describe('runResearchProjectIssueNumberBackfill', () => {
  it('numbers missing projects chronologically, seeds the counter, and is idempotent', async () => {
    const projects: ProjectRow[] = [
      { id: 'existing', issue_number: 5, created_at: new Date('2026-01-01') },
      { id: 'later', created_at: new Date('2026-03-01') },
      { id: 'earlier', issue_number: null, created_at: new Date('2026-02-01') },
    ];
    const { db, getCounter } = buildFakeDb(projects);

    await expect(runResearchProjectIssueNumberBackfill(db)).resolves.toEqual({
      candidates: 2,
      modified: 2,
      skipped: 0,
      max_issue_number: 7,
    });
    expect(projects.map(({ id, issue_number }) => ({ id, issue_number }))).toEqual([
      { id: 'existing', issue_number: 5 },
      { id: 'later', issue_number: 7 },
      { id: 'earlier', issue_number: 6 },
    ]);
    expect(getCounter()).toBe(7);

    await expect(runResearchProjectIssueNumberBackfill(db)).resolves.toEqual({
      candidates: 0,
      modified: 0,
      skipped: 0,
      max_issue_number: 7,
    });
  });

  it('reports a dry run without changing projects or the counter', async () => {
    const projects: ProjectRow[] = [
      { id: 'candidate', issue_number: null, created_at: new Date('2026-01-01') },
    ];
    const { db, getCounter } = buildFakeDb(projects);

    await expect(runResearchProjectIssueNumberBackfill(db, { apply: false })).resolves.toEqual({
      candidates: 1,
      modified: 0,
      skipped: 0,
      max_issue_number: 0,
    });
    expect(projects[0].issue_number).toBeNull();
    expect(getCounter()).toBeUndefined();
  });
});
