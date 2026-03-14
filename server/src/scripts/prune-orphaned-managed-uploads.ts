import { closeDatabase, connectDatabase } from '../database/connection.js';
import { ManagedUploadCleanupService } from '../services/managed-upload-cleanup.service.js';

const DEFAULT_MIN_AGE_HOURS = 24;

function parseMinAgeHours(): number {
  const arg = process.argv.find((value) => value.startsWith('--min-age-hours='));
  if (!arg) {
    return DEFAULT_MIN_AGE_HOURS;
  }

  const rawValue = arg.slice('--min-age-hours='.length).trim();
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`Invalid --min-age-hours value: ${rawValue}`);
  }

  return parsed;
}

async function main(): Promise<void> {
  const minAgeHours = parseMinAgeHours();

  await connectDatabase();

  const result = await ManagedUploadCleanupService.pruneOrphanedManagedUploads({
    minAgeMs: minAgeHours * 60 * 60 * 1000,
    reason: `script:prune-orphaned-managed-uploads:${minAgeHours}h`,
  });

  console.info(
    JSON.stringify(
      {
        minAgeHours,
        scannedFiles: result.scannedFiles,
        deletedFiles: result.deletedFiles.length,
        skippedReferencedFiles: result.skippedReferencedFiles.length,
        skippedYoungFiles: result.skippedYoungFiles.length,
        failedFiles: result.failedFiles,
      },
      null,
      2
    )
  );

  await closeDatabase();

  if (result.failedFiles.length > 0) {
    process.exitCode = 1;
  }
}

main().catch(async (error) => {
  console.error(error);
  try {
    await closeDatabase();
  } catch {
    // Ignore shutdown failures in the cleanup script.
  }
  process.exitCode = 1;
});
