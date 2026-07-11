import { describe, expect, it } from 'vitest';

import {
  buildResearchProjectBackfillPlan,
  runResearchPhase0Backfill,
} from './backfill-research-phase0.js';

const completeProject = {
  id: 'project-1',
  description_zh: '背景',
  challenge_value_zh: '价值',
  challenge_beginner_steps_zh: '步骤',
  challenge_roles_zh: '角色',
  challenge_min_deliverables_zh: '成果',
  challenge_timeline_zh: '周期',
  challenge_review_criteria_zh: '标准',
};

describe('research Phase 0 backfill planning', () => {
  it('maps completed, initializes activity, and preserves complete public visibility', () => {
    expect(buildResearchProjectBackfillPlan(
      { ...completeProject, status: 'completed', updated_at: new Date('2026-01-02'), is_public: true },
      { visibility: 'public' }
    )).toEqual({
      projectSet: {
        status: 'review_pending',
        last_activity_at: new Date('2026-01-02'),
      },
      visibility: 'public',
      invalidStatus: false,
    });
  });

  it('preserves incomplete public projects and their legacy visibility', () => {
    expect(buildResearchProjectBackfillPlan(
      { id: 'project-2', status: 'active', updated_at: new Date('2026-01-02'), is_public: true },
      { visibility: 'public' }
    )).toEqual({
      projectSet: {
        last_activity_at: new Date('2026-01-02'),
      },
      visibility: 'public',
      invalidStatus: false,
    });
  });

  it('is idempotent after the planned values have been applied', () => {
    expect(buildResearchProjectBackfillPlan(
      {
        ...completeProject,
        status: 'review_pending',
        updated_at: new Date('2026-01-02'),
        last_activity_at: new Date('2026-01-02'),
        is_public: true,
      },
      { visibility: 'public' }
    )).toEqual({ projectSet: {}, visibility: 'public', invalidStatus: false });
  });

  it('reports unknown legacy statuses without inventing a mapping', () => {
    expect(buildResearchProjectBackfillPlan(
      { id: 'project-3', status: 'paused', updated_at: new Date('2026-01-02'), is_public: false },
      { visibility: 'private' }
    )).toEqual({
      projectSet: { last_activity_at: new Date('2026-01-02') },
      visibility: 'private',
      invalidStatus: true,
    });
  });
});

describe('runResearchPhase0Backfill', () => {
  it('creates cycle 1, assigns resources, preserves public projects, and is idempotent', async () => {
    const data: Record<string, any[]> = {
      research_projects: [
        { ...completeProject, status: 'completed', updated_at: new Date('2026-01-02'), is_public: true },
        { id: 'project-2', status: 'draft', updated_at: new Date('2026-01-03'), is_public: true },
      ],
      research_project_settings: [
        { id: 'settings-1', project_id: 'project-1', visibility: 'public' },
        { id: 'settings-2', project_id: 'project-2', visibility: 'public' },
      ],
      research_project_cycles: [],
      research_project_charters: [{ id: 'charter-1', project_id: 'project-1' }],
      research_project_tasks: [{ id: 'task-1', project_id: 'project-1' }],
      research_project_reviews: [{ id: 'review-1', project_id: 'project-1' }],
      research_project_outcomes: [{ id: 'outcome-1', project_id: 'project-1' }],
    };

    const collection = (name: string) => ({
      find: (filter: Record<string, any> = {}) => ({
        toArray: async () => data[name].filter((row) =>
          Object.entries(filter).every(([key, value]) => row[key] === value)
        ),
      }),
      updateOne: async (filter: Record<string, any>, update: Record<string, any>, options?: { upsert?: boolean }) => {
        let row = data[name].find((candidate) =>
          Object.entries(filter).every(([key, value]) => candidate[key] === value)
        );
        let upsertedCount = 0;
        if (!row && options?.upsert) {
          row = { ...filter, ...(update.$setOnInsert ?? {}) };
          data[name].push(row);
          upsertedCount = 1;
        }
        if (!row) return { modifiedCount: 0, upsertedCount: 0 };
        const before = JSON.stringify(row);
        Object.assign(row, update.$set ?? {});
        return { modifiedCount: before === JSON.stringify(row) ? 0 : 1, upsertedCount };
      },
      distinct: async (field: string) => [...new Set(data[name].map((row) => row[field]))],
      updateMany: async (filter: Record<string, any>, update: Record<string, any>) => {
        let modifiedCount = 0;
        for (const row of data[name]) {
          const matches = Object.entries(filter).every(([key, value]) =>
            value && typeof value === 'object' && '$ne' in value
              ? row[key] !== value.$ne
              : row[key] === value
          );
          if (!matches) continue;
          const before = JSON.stringify(row);
          Object.assign(row, update.$set ?? {});
          if (before !== JSON.stringify(row)) modifiedCount += 1;
        }
        return { matchedCount: modifiedCount, modifiedCount };
      },
      countDocuments: async (filter: Record<string, any>) => data[name].filter((row) =>
        Object.entries(filter).every(([key, value]) => row[key] === value)
      ).length,
    });
    const db = { collection } as any;

    const first = await runResearchPhase0Backfill(db);
    const second = await runResearchPhase0Backfill(db);

    expect(first.changed).toBeGreaterThan(0);
    expect(second.changed).toBe(0);
    expect(data.research_project_cycles).toHaveLength(2);
    expect(data.research_projects[0]).toEqual(expect.objectContaining({
      status: 'review_pending',
      is_public: true,
      last_activity_at: new Date('2026-01-02'),
    }));
    expect(data.research_projects[1].is_public).toBe(true);
    expect(data.research_project_settings[1].visibility).toBe('public');
    const projectOneCycle = data.research_project_cycles.find((cycle) => cycle.project_id === 'project-1');
    expect(data.research_project_charters[0].cycle_id).toBe(projectOneCycle.id);
    expect(data.research_project_tasks[0].cycle_id).toBe(projectOneCycle.id);
    expect(data.research_project_reviews[0].cycle_id).toBe(projectOneCycle.id);
    expect(data.research_project_outcomes[0].cycle_id).toBe(projectOneCycle.id);
  });
});
