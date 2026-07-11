import { pathToFileURL } from 'url';
import type { Db } from 'mongodb';

import { closeDatabase, connectDatabase } from '../database/connection.js';
import { isProjectStatus } from '../models/research-project.util.js';
import { generateId } from '../utils/crypto.util.js';

type LegacyProject = Record<string, any> & {
  id: string;
  status?: unknown;
  is_public?: boolean;
  created_at?: Date | string;
  updated_at?: Date | string;
  last_activity_at?: Date | string;
};

type LegacySettings = { visibility?: string } | null | undefined;

export function buildResearchProjectBackfillPlan(project: LegacyProject, settings: LegacySettings) {
  const projectSet: Record<string, unknown> = {};
  const mappedStatus = project.status === 'completed' ? 'review_pending' : project.status;
  const invalidStatus = mappedStatus !== undefined && !isProjectStatus(mappedStatus);

  if (project.status === 'completed') {
    projectSet.status = 'review_pending';
  }

  if (!project.last_activity_at) {
    projectSet.last_activity_at = project.updated_at ?? project.created_at ?? new Date();
  }

  const visibility = settings?.visibility ?? (project.is_public === true ? 'public' : 'private');

  const expectedLegacyVisibility = visibility === 'public';
  if (project.is_public !== expectedLegacyVisibility) {
    projectSet.is_public = expectedLegacyVisibility;
  }

  return { projectSet, visibility, invalidStatus };
}

export async function runResearchPhase0Backfill(db: Db) {
  const projectsCollection = db.collection<LegacyProject>('research_projects');
  const settingsCollection = db.collection('research_project_settings');
  const cyclesCollection = db.collection('research_project_cycles');
  const resourceNames = [
    'research_project_charters',
    'research_project_tasks',
    'research_project_reviews',
    'research_project_outcomes',
  ] as const;

  const [projects, settingsRows] = await Promise.all([
    projectsCollection.find({}).toArray(),
    settingsCollection.find({}).toArray(),
  ]);
  const settingsMap = new Map(settingsRows.map((settings: any) => [settings.project_id, settings]));
  const report = { matched: 0, changed: 0, skipped: 0, invalid: 0 };

  for (const project of projects) {
    const plan = buildResearchProjectBackfillPlan(project, settingsMap.get(project.id));
    if (plan.invalidStatus) report.invalid += 1;

    const settings = settingsMap.get(project.id) as any;
    const settingsNeedsUpdate = !settings || settings.visibility !== plan.visibility;
    report.matched += 1;
    if (settingsNeedsUpdate) {
      const now = new Date();
      const result = await settingsCollection.updateOne(
        { project_id: project.id },
        {
          $set: { visibility: plan.visibility, updated_at: now },
          $setOnInsert: {
            id: generateId(),
            project_id: project.id,
            require_approval: true,
            recruitment_requirements: null,
            max_members: null,
            recruitment_deadline: null,
            is_recruiting: true,
            contact_email: null,
            discussion_channel: null,
            created_at: now,
          },
        },
        { upsert: true }
      );
      const changed = result.modifiedCount + result.upsertedCount;
      report.changed += changed;
      report.skipped += changed > 0 ? 0 : 1;
    } else {
      report.skipped += 1;
    }

    report.matched += 1;
    if (Object.keys(plan.projectSet).length > 0) {
      const result = await projectsCollection.updateOne(
        { id: project.id },
        { $set: plan.projectSet }
      );
      report.changed += result.modifiedCount;
      report.skipped += result.modifiedCount > 0 ? 0 : 1;
    } else {
      report.skipped += 1;
    }

    const now = new Date();
    const cycleResult = await cyclesCollection.updateOne(
      { project_id: project.id, cycle_number: 1 },
      {
        $setOnInsert: {
          id: generateId(),
          project_id: project.id,
          cycle_number: 1,
          created_at: now,
          updated_at: now,
        },
      },
      { upsert: true }
    );
    report.matched += 1;
    report.changed += cycleResult.upsertedCount;
    report.skipped += cycleResult.upsertedCount > 0 ? 0 : 1;
  }

  const cycles = await cyclesCollection.find({ cycle_number: 1 }).toArray();
  const cycleIdByProject = new Map(cycles.map((cycle: any) => [cycle.project_id, cycle.id]));

  for (const resourceName of resourceNames) {
    const collection = db.collection(resourceName);
    const projectIds = await collection.distinct('project_id');
    for (const projectId of projectIds) {
      const cycleId = cycleIdByProject.get(projectId);
      if (!cycleId) {
        report.invalid += await collection.countDocuments({ project_id: projectId });
        continue;
      }
      const result = await collection.updateMany(
        { project_id: projectId, cycle_id: { $ne: cycleId } },
        { $set: { cycle_id: cycleId, updated_at: new Date() } }
      );
      report.matched += result.matchedCount;
      report.changed += result.modifiedCount;
      report.skipped += result.matchedCount - result.modifiedCount;
    }
  }
  return report;
}

async function main(): Promise<void> {
  const db = await connectDatabase();
  const report = await runResearchPhase0Backfill(db);
  console.info(JSON.stringify(report, null, 2));
  await closeDatabase();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(async (error) => {
    console.error(error);
    try {
      await closeDatabase();
    } catch {
      // Ignore shutdown failures after a migration error.
    }
    process.exitCode = 1;
  });
}
