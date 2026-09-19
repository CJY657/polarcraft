/**
 * HTML courseware package (ZIP) extraction
 * 网页课件压缩包解压：管理员上传 ZIP → 解压到同目录同名文件夹 → 返回入口 index.html
 *
 * ponytail: 用系统 `unzip`（本机与线上均已安装，流式解压不占内存）；若换到没有 unzip 的机器再改为 yauzl。
 */

import { execFile } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export const HTML_PACKAGE_LIMITS = {
  maxEntries: 3000,
  maxUncompressedBytes: 300 * 1024 * 1024,
};

/** 拒绝绝对路径、`..` 穿越与 Windows 盘符；返回错误文案或 null */
export function validateEntryNames(names: string[]): string | null {
  if (names.length === 0) return '压缩包为空';
  if (names.length > HTML_PACKAGE_LIMITS.maxEntries) {
    return `压缩包内文件过多（最多 ${HTML_PACKAGE_LIMITS.maxEntries} 个）`;
  }
  for (const name of names) {
    const normalized = name.replace(/\\/g, '/');
    if (
      normalized.startsWith('/') ||
      /^[a-zA-Z]:/.test(normalized) ||
      normalized.split('/').includes('..')
    ) {
      return `压缩包包含非法路径：${name}`;
    }
  }
  return null;
}

/** 解析 `unzip -Zt` 输出的解压后总字节数 */
export function parseUncompressedTotal(output: string): number | null {
  const match = output.match(/(\d+)\s+bytes uncompressed/);
  return match ? Number(match[1]) : null;
}

/**
 * 找入口页：根目录 index.html，或唯一顶层文件夹内的 index.html（常见的“整个文件夹打包”）。
 * 返回相对 dir 的 POSIX 路径，找不到返回 null。
 */
export async function resolveEntryHtml(dir: string): Promise<string | null> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  if (entries.some((entry) => entry.isFile() && entry.name === 'index.html')) {
    return 'index.html';
  }
  const dirs = entries.filter((entry) => entry.isDirectory() && !entry.name.startsWith('__MACOSX'));
  if (dirs.length === 1) {
    const nested = await fs.readdir(path.join(dir, dirs[0].name), { withFileTypes: true });
    if (nested.some((entry) => entry.isFile() && entry.name === 'index.html')) {
      return `${dirs[0].name}/index.html`;
    }
  }
  return null;
}

/**
 * 解压 zipPath 到 destDir（不存在则创建），成功后删除 zip，返回入口页相对 destDir 的路径。
 * 任何一步失败都会清理 destDir 与 zip 并抛出带中文文案的 Error。
 */
export async function extractHtmlPackage(zipPath: string, destDir: string): Promise<string> {
  try {
    const { stdout: listing } = await execFileAsync('unzip', ['-Z1', zipPath], { maxBuffer: 4 * 1024 * 1024 });
    const names = listing.split('\n').map((line) => line.trim()).filter(Boolean);
    const nameError = validateEntryNames(names);
    if (nameError) throw new Error(nameError);

    const { stdout: totals } = await execFileAsync('unzip', ['-Zt', zipPath]);
    const total = parseUncompressedTotal(totals);
    if (total === null || total > HTML_PACKAGE_LIMITS.maxUncompressedBytes) {
      throw new Error('压缩包解压后体积过大或无法读取');
    }

    await fs.mkdir(destDir, { recursive: true });
    await execFileAsync('unzip', ['-o', '-q', '-d', destDir, zipPath]);

    const entry = await resolveEntryHtml(destDir);
    if (!entry) throw new Error('压缩包内未找到 index.html（可放在根目录或唯一的顶层文件夹内）');
    return entry;
  } catch (error) {
    await fs.rm(destDir, { recursive: true, force: true });
    throw error instanceof Error && /^[\u4e00-\u9fa5]/.test(error.message)
      ? error
      : new Error('压缩包解压失败，请确认是有效的 ZIP 文件');
  } finally {
    await fs.rm(zipPath, { force: true });
  }
}
