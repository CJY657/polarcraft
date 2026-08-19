import { uploadConfig } from '../config/upload.config.js';

export const managedUploadUrlPrefix = uploadConfig.publicUrlPrefix.replace(/\/+$/, '');

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
