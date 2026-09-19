import { execFile } from 'child_process';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { promisify } from 'util';
import { afterEach, describe, expect, it } from 'vitest';

import {
  extractHtmlPackage,
  parseUncompressedTotal,
  resolveEntryHtml,
  validateEntryNames,
} from './html-package.service.js';

const execFileAsync = promisify(execFile);
const tempDirs: string[] = [];

async function makeTempDir(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'html-package-'));
  tempDirs.push(dir);
  return dir;
}

async function hasZipTools(): Promise<boolean> {
  try {
    await execFileAsync('zip', ['-v']);
    await execFileAsync('unzip', ['-v']);
    return true;
  } catch {
    return false;
  }
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

describe('validateEntryNames', () => {
  it('rejects traversal, absolute and drive paths', () => {
    expect(validateEntryNames(['index.html', 'assets/a.js'])).toBeNull();
    expect(validateEntryNames(['../evil'])).toMatch(/非法路径/);
    expect(validateEntryNames(['a/../../evil'])).toMatch(/非法路径/);
    expect(validateEntryNames(['/etc/passwd'])).toMatch(/非法路径/);
    expect(validateEntryNames(['C:\\win\\x'])).toMatch(/非法路径/);
    expect(validateEntryNames([])).toMatch(/为空/);
  });
});

describe('parseUncompressedTotal', () => {
  it('reads the unzip -Zt summary line', () => {
    expect(parseUncompressedTotal('12 files, 1049 bytes uncompressed, 700 bytes compressed:  33.3%\n')).toBe(1049);
    expect(parseUncompressedTotal('garbage')).toBeNull();
  });
});

describe('resolveEntryHtml', () => {
  it('accepts root index.html or a single top-level folder', async () => {
    const root = await makeTempDir();
    expect(await resolveEntryHtml(root)).toBeNull();

    await fs.mkdir(path.join(root, 'course'));
    await fs.writeFile(path.join(root, 'course', 'index.html'), '<html></html>');
    expect(await resolveEntryHtml(root)).toBe('course/index.html');

    await fs.writeFile(path.join(root, 'index.html'), '<html></html>');
    expect(await resolveEntryHtml(root)).toBe('index.html');
  });
});

describe('extractHtmlPackage', () => {
  it('extracts a zip next to itself, deletes the zip and returns the entry', async () => {
    if (!(await hasZipTools())) return;

    const work = await makeTempDir();
    const src = path.join(work, 'src');
    await fs.mkdir(path.join(src, 'assets'), { recursive: true });
    await fs.writeFile(path.join(src, 'index.html'), '<script src="assets/a.js"></script>');
    await fs.writeFile(path.join(src, 'assets', 'a.js'), 'console.log(1)');
    const zipPath = path.join(work, 'pkg.zip');
    await execFileAsync('zip', ['-qr', zipPath, '.'], { cwd: src });

    const dest = path.join(work, 'pkg');
    expect(await extractHtmlPackage(zipPath, dest)).toBe('index.html');
    expect(await fs.readFile(path.join(dest, 'assets', 'a.js'), 'utf8')).toBe('console.log(1)');
    await expect(fs.access(zipPath)).rejects.toThrow();
  });

  it('rejects packages without index.html and cleans up', async () => {
    if (!(await hasZipTools())) return;

    const work = await makeTempDir();
    const src = path.join(work, 'src');
    await fs.mkdir(src);
    await fs.writeFile(path.join(src, 'readme.txt'), 'no entry');
    const zipPath = path.join(work, 'bad.zip');
    await execFileAsync('zip', ['-qr', zipPath, '.'], { cwd: src });

    const dest = path.join(work, 'bad');
    await expect(extractHtmlPackage(zipPath, dest)).rejects.toThrow(/index\.html/);
    await expect(fs.access(dest)).rejects.toThrow();
    await expect(fs.access(zipPath)).rejects.toThrow();
  });
});
