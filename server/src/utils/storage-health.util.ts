import fs from 'fs';
import path from 'path';

export interface DirectoryHealthStatus {
  status: 'up' | 'down';
  path: string;
  writable: boolean;
  error?: string;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

async function writeProbeFile(dir: string): Promise<void> {
  const probeFile = path.join(dir, `.write-probe-${process.pid}-${Date.now()}`);
  await fs.promises.writeFile(probeFile, 'ok');
  await fs.promises.unlink(probeFile);
}

export async function ensureDirectoryWritable(dir: string): Promise<void> {
  await fs.promises.mkdir(dir, { recursive: true });
  await fs.promises.access(dir, fs.constants.R_OK | fs.constants.W_OK);
  await writeProbeFile(dir);
}

export async function getDirectoryHealth(dir: string): Promise<DirectoryHealthStatus> {
  try {
    const stats = await fs.promises.stat(dir);
    if (!stats.isDirectory()) {
      return {
        status: 'down',
        path: dir,
        writable: false,
        error: 'Path exists but is not a directory',
      };
    }

    await fs.promises.access(dir, fs.constants.R_OK | fs.constants.W_OK);

    return {
      status: 'up',
      path: dir,
      writable: true,
    };
  } catch (error) {
    return {
      status: 'down',
      path: dir,
      writable: false,
      error: toErrorMessage(error),
    };
  }
}
