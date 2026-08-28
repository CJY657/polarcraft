import path from 'path';
import { uploadConfig } from '../config/upload.config.js';

export const managedUploadUrlPrefix = uploadConfig.publicUrlPrefix.replace(/\/+$/, '');
const managedUploadRoot = path.resolve(uploadConfig.uploadDir);

export function getManagedUploadUrlForFile(filePath: string): string | null {
  const relativePath = path.relative(managedUploadRoot, path.resolve(filePath));
  if (!relativePath || relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    return null;
  }

  return `${managedUploadUrlPrefix}/${relativePath.replace(/\\/g, '/')}`;
}

export function normalizeManagedUploadUrl(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed !== managedUploadUrlPrefix && !trimmed.startsWith(`${managedUploadUrlPrefix}/`)) {
    return undefined;
  }

  return trimmed;
}
