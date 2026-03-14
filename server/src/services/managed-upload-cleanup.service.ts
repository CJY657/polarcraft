import fs from 'fs/promises';
import path from 'path';
import { uploadConfig } from '../config/upload.config.js';
import { getCollection } from '../database/connection.js';
import { escapeRegExp } from '../database/mongo.util.js';
import { CourseModel } from '../models/course.model.js';
import { UnitModel } from '../models/unit.model.js';
import { logger } from '../utils/logger.js';

type CleanupCandidateUrl = string | null | undefined;

interface CleanupFailure {
  url: string;
  message: string;
}

interface CleanupOptions {
  reason?: string;
}

interface CollectionFieldRef {
  collection: string;
  field: string;
}

export interface ManagedUploadCleanupResult {
  totalCandidates: number;
  uniqueCandidates: number;
  deletedUrls: string[];
  missingUrls: string[];
  skippedReferencedUrls: string[];
  skippedUnmanagedUrls: string[];
  failedUrls: CleanupFailure[];
}

export interface ManagedUploadSweepResult {
  scannedFiles: number;
  deletedFiles: string[];
  skippedReferencedFiles: string[];
  skippedYoungFiles: string[];
  failedFiles: CleanupFailure[];
}

const UPLOAD_REFERENCE_FIELDS: CollectionFieldRef[] = [
  { collection: 'units', field: 'cover_image' },
  { collection: 'unit_main_slides', field: 'url' },
  { collection: 'courses', field: 'cover_image' },
  { collection: 'course_main_slides', field: 'url' },
  { collection: 'course_media', field: 'url' },
  { collection: 'course_media', field: 'preview_pdf_url' },
];

const uploadRootDir = path.resolve(uploadConfig.uploadDir);
const publicUrlPrefix = uploadConfig.publicUrlPrefix.replace(/\/+$/, '');
const managedUrlRegex = new RegExp(`^${escapeRegExp(publicUrlPrefix)}(?:/|$)`);

function normalizeCandidateUrls(urls: CleanupCandidateUrl[]): string[] {
  const uniqueUrls = new Set<string>();

  for (const url of urls) {
    if (typeof url !== 'string') {
      continue;
    }

    const trimmed = url.trim();
    if (!trimmed) {
      continue;
    }

    uniqueUrls.add(trimmed);
  }

  return [...uniqueUrls];
}

function getManagedUploadFilePath(url: string): string | null {
  const pathname = url.split(/[?#]/, 1)[0];
  if (!pathname) {
    return null;
  }

  if (pathname !== publicUrlPrefix && !pathname.startsWith(`${publicUrlPrefix}/`)) {
    return null;
  }

  const relativePath = pathname.slice(publicUrlPrefix.length).replace(/^\/+/, '');
  if (!relativePath) {
    return null;
  }

  const resolvedFilePath = path.resolve(uploadRootDir, relativePath);
  const relativeToRoot = path.relative(uploadRootDir, resolvedFilePath);
  if (!relativeToRoot || relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) {
    return null;
  }

  return resolvedFilePath;
}

async function pruneEmptyUploadDirectories(filePath: string): Promise<void> {
  let currentDir = path.dirname(filePath);

  while (currentDir.startsWith(uploadRootDir) && currentDir !== uploadRootDir) {
    try {
      const entries = await fs.readdir(currentDir);
      if (entries.length > 0) {
        return;
      }

      await fs.rmdir(currentDir);
      currentDir = path.dirname(currentDir);
    } catch (error: any) {
      if (error?.code === 'ENOENT' || error?.code === 'ENOTEMPTY') {
        return;
      }

      throw error;
    }
  }
}

async function findStillReferencedUrls(urls: string[]): Promise<Set<string>> {
  if (urls.length === 0) {
    return new Set<string>();
  }

  const urlSet = new Set(urls);
  const referencedUrls = new Set<string>();

  await Promise.all(
    UPLOAD_REFERENCE_FIELDS.map(async ({ collection, field }) => {
      const documents = await getCollection(collection)
        .find({ [field]: { $in: urls } }, { projection: { [field]: 1 } })
        .toArray();

      for (const document of documents) {
        const value = document?.[field];
        if (typeof value === 'string' && urlSet.has(value)) {
          referencedUrls.add(value);
        }
      }
    })
  );

  return referencedUrls;
}

async function collectReferencedManagedUploadFilePaths(): Promise<Set<string>> {
  const referencedPaths = new Set<string>();

  await Promise.all(
    UPLOAD_REFERENCE_FIELDS.map(async ({ collection, field }) => {
      const documents = await getCollection(collection)
        .find({ [field]: { $regex: managedUrlRegex } }, { projection: { [field]: 1 } })
        .toArray();

      for (const document of documents) {
        const value = document?.[field];
        if (typeof value !== 'string') {
          continue;
        }

        const filePath = getManagedUploadFilePath(value);
        if (filePath) {
          referencedPaths.add(filePath);
        }
      }
    })
  );

  return referencedPaths;
}

async function walkUploadFiles(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true, encoding: 'utf8' });

    const nestedFiles = await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          return walkUploadFiles(fullPath);
        }

        if (entry.isFile()) {
          return [fullPath];
        }

        return [];
      })
    );

    return nestedFiles.flat();
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      return [];
    }

    throw error;
  }
}

function buildCourseResourceUrls(input: {
  coverImage?: string | null;
  mainSlideUrl?: string | null;
  media: Array<{ url: string; preview_pdf_url: string | null }>;
}): string[] {
  return normalizeCandidateUrls([
    input.coverImage,
    input.mainSlideUrl,
    ...input.media.flatMap((item) => [item.url, item.preview_pdf_url]),
  ]);
}

export class ManagedUploadCleanupService {
  static async collectCourseResourceUrls(courseId: string): Promise<string[]> {
    const [course, mainSlide, media] = await Promise.all([
      CourseModel.getCourseById(courseId),
      CourseModel.getMainSlide(courseId),
      CourseModel.getMediaByCourse(courseId),
    ]);

    return buildCourseResourceUrls({
      coverImage: course?.cover_image,
      mainSlideUrl: mainSlide?.url,
      media,
    });
  }

  static async collectUnitResourceUrls(unitId: string): Promise<string[]> {
    const [unit, mainSlide, courses] = await Promise.all([
      UnitModel.getUnitById(unitId),
      UnitModel.getMainSlide(unitId),
      UnitModel.getCoursesByUnit(unitId),
    ]);

    const courseResourceUrls = await Promise.all(
      courses.map((course) => this.collectCourseResourceUrls(course.id))
    );

    return normalizeCandidateUrls([
      unit?.cover_image,
      mainSlide?.url,
      ...courseResourceUrls.flat(),
    ]);
  }

  static async cleanupUrls(
    urls: CleanupCandidateUrl[],
    options: CleanupOptions = {}
  ): Promise<ManagedUploadCleanupResult> {
    const uniqueUrls = normalizeCandidateUrls(urls);
    const managedEntries = uniqueUrls
      .map((url) => ({ url, filePath: getManagedUploadFilePath(url) }))
      .filter((entry): entry is { url: string; filePath: string } => Boolean(entry.filePath));

    const result: ManagedUploadCleanupResult = {
      totalCandidates: urls.length,
      uniqueCandidates: uniqueUrls.length,
      deletedUrls: [],
      missingUrls: [],
      skippedReferencedUrls: [],
      skippedUnmanagedUrls: uniqueUrls.filter((url) => !managedEntries.some((entry) => entry.url === url)),
      failedUrls: [],
    };

    if (managedEntries.length === 0) {
      return result;
    }

    try {
      const referencedUrls = await findStillReferencedUrls(managedEntries.map((entry) => entry.url));

      for (const entry of managedEntries) {
        if (referencedUrls.has(entry.url)) {
          result.skippedReferencedUrls.push(entry.url);
          continue;
        }

        try {
          await fs.unlink(entry.filePath);
          result.deletedUrls.push(entry.url);
          await pruneEmptyUploadDirectories(entry.filePath);
        } catch (error: any) {
          if (error?.code === 'ENOENT') {
            result.missingUrls.push(entry.url);
            continue;
          }

          const message = error instanceof Error ? error.message : String(error);
          result.failedUrls.push({ url: entry.url, message });
          logger.warn('Managed upload cleanup failed for file', {
            url: entry.url,
            filePath: entry.filePath,
            reason: options.reason,
            error: message,
          });
        }
      }
    } catch (error: any) {
      const message = error instanceof Error ? error.message : String(error);
      result.failedUrls.push(
        ...managedEntries.map((entry) => ({ url: entry.url, message }))
      );

      logger.error('Managed upload cleanup aborted', {
        reason: options.reason,
        error: message,
      });

      return result;
    }

    if (
      result.deletedUrls.length > 0 ||
      result.missingUrls.length > 0 ||
      result.failedUrls.length > 0
    ) {
      logger.info('Managed upload cleanup completed', {
        reason: options.reason,
        deletedCount: result.deletedUrls.length,
        missingCount: result.missingUrls.length,
        failedCount: result.failedUrls.length,
        skippedReferencedCount: result.skippedReferencedUrls.length,
      });
    }

    return result;
  }

  static async pruneOrphanedManagedUploads(options: {
    minAgeMs?: number;
    reason?: string;
  } = {}): Promise<ManagedUploadSweepResult> {
    const result: ManagedUploadSweepResult = {
      scannedFiles: 0,
      deletedFiles: [],
      skippedReferencedFiles: [],
      skippedYoungFiles: [],
      failedFiles: [],
    };

    try {
      const [referencedPaths, uploadFiles] = await Promise.all([
        collectReferencedManagedUploadFilePaths(),
        walkUploadFiles(uploadRootDir),
      ]);

      result.scannedFiles = uploadFiles.length;

      for (const filePath of uploadFiles) {
        const relativePath = path.relative(uploadRootDir, filePath);
        const url = `${publicUrlPrefix}/${relativePath.replace(/\\/g, '/')}`;

        if (referencedPaths.has(filePath)) {
          result.skippedReferencedFiles.push(url);
          continue;
        }

        if (options.minAgeMs && options.minAgeMs > 0) {
          const stats = await fs.stat(filePath);
          if (Date.now() - stats.mtimeMs < options.minAgeMs) {
            result.skippedYoungFiles.push(url);
            continue;
          }
        }

        try {
          await fs.unlink(filePath);
          result.deletedFiles.push(url);
          await pruneEmptyUploadDirectories(filePath);
        } catch (error: any) {
          const message = error instanceof Error ? error.message : String(error);
          result.failedFiles.push({ url, message });
          logger.warn('Managed upload orphan sweep failed for file', {
            url,
            filePath,
            reason: options.reason,
            error: message,
          });
        }
      }
    } catch (error: any) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Managed upload orphan sweep aborted', {
        reason: options.reason,
        error: message,
      });
      result.failedFiles.push({ url: uploadConfig.publicUrlPrefix, message });
      return result;
    }

    logger.info('Managed upload orphan sweep completed', {
      reason: options.reason,
      scannedCount: result.scannedFiles,
      deletedCount: result.deletedFiles.length,
      skippedReferencedCount: result.skippedReferencedFiles.length,
      skippedYoungCount: result.skippedYoungFiles.length,
      failedCount: result.failedFiles.length,
    });

    return result;
  }
}
