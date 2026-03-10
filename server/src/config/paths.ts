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

const frontendDistDir = resolveFromRepo(
  process.env.FRONTEND_DIST_DIR,
  path.join(repoRoot, 'dist')
);

const uploadRootDir = resolveFromRepo(
  process.env.UPLOAD_ROOT_DIR,
  path.join(repoRoot, 'public/uploads')
);

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
