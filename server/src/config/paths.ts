import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');

function resolveFromRepo(value: string | undefined, fallback: string): string {
  if (!value) {
    return fallback;
  }

  return path.isAbsolute(value) ? value : path.resolve(repoRoot, value);
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function ensureDirectoryWritableSync(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
  fs.accessSync(dir, fs.constants.R_OK | fs.constants.W_OK);

  const probeFile = path.join(dir, `.write-probe-${process.pid}-${Date.now()}`);
  fs.writeFileSync(probeFile, 'ok');
  fs.unlinkSync(probeFile);
}

function resolveUploadRootDir() {
  const defaultUploadRootDir = path.join(repoRoot, 'public/uploads');
  const requestedUploadRootDir = resolveFromRepo(
    process.env.UPLOAD_ROOT_DIR,
    defaultUploadRootDir
  );
  const fallbackUploadRootDir = resolveFromRepo(
    process.env.UPLOAD_FALLBACK_ROOT_DIR,
    process.env.RENDER_EXTERNAL_URL ? '/tmp/polarcraft/uploads' : defaultUploadRootDir
  );

  try {
    ensureDirectoryWritableSync(requestedUploadRootDir);
    return {
      requestedUploadRootDir,
      effectiveUploadRootDir: requestedUploadRootDir,
      fallbackActive: false,
      reason: undefined as string | undefined,
    };
  } catch (error) {
    if (fallbackUploadRootDir === requestedUploadRootDir) {
      throw error;
    }

    ensureDirectoryWritableSync(fallbackUploadRootDir);
    return {
      requestedUploadRootDir,
      effectiveUploadRootDir: fallbackUploadRootDir,
      fallbackActive: true,
      reason: toErrorMessage(error),
    };
  }
}

const frontendDistDir = resolveFromRepo(
  process.env.FRONTEND_DIST_DIR,
  path.join(repoRoot, 'dist')
);

const uploadPathSelection = resolveUploadRootDir();
const uploadRootDir = uploadPathSelection.effectiveUploadRootDir;

export const appPaths = {
  repoRoot,
  frontendDistDir,
  frontendIndexFile: path.join(frontendDistDir, 'index.html'),
  uploadRootDir,
  uploadCoursesDir: resolveFromRepo(
    process.env.UPLOAD_DIR,
    path.join(uploadRootDir, 'courses')
  ),
} as const;

export const uploadPathResolution = {
  requestedUploadRootDir: uploadPathSelection.requestedUploadRootDir,
  effectiveUploadRootDir: uploadPathSelection.effectiveUploadRootDir,
  fallbackActive: uploadPathSelection.fallbackActive,
  fallbackReason: uploadPathSelection.reason,
} as const;
