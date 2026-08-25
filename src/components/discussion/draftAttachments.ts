/**
 * 讨论区草稿附件的共享校验逻辑。
 *
 * ponytail: 提示文案不在这里拼——两处讨论区的文案不同（一处走 i18n 双语，
 * 一处硬编码中文），这里只产出计数，文案留在各自组件里。
 */

export type DraftAttachmentType = 'image' | 'video';

export interface DraftAttachment {
  id: string;
  file: File;
  previewUrl: string;
  type: DraftAttachmentType;
}

export function isSupportedImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) {
    return true;
  }

  return /\.(jpe?g|png|gif|webp)$/i.test(file.name);
}

export function isSupportedVideoFile(file: File): boolean {
  if (file.type.startsWith('video/')) {
    return true;
  }

  return /\.(mp4|webm|mov)$/i.test(file.name);
}

export function revokeDraftPreviewUrls(attachments: { previewUrl: string }[]): void {
  for (const attachment of attachments) {
    URL.revokeObjectURL(attachment.previewUrl);
  }
}

/** 把 File 数组还原成 FileList，供 buildDraftAttachments 复用同一条校验路径。 */
export function createFileListFromArray(files: File[]): FileList {
  const dataTransfer = new DataTransfer();
  files.forEach((file) => dataTransfer.items.add(file));
  return dataTransfer.files;
}

export interface BuildDraftAttachmentsOptions {
  /** 只收白名单内的类型；白名单外的一律算 invalid，而不是 overflow。 */
  allowedTypes: DraftAttachmentType[];
  remainingImageSlots: number;
  remainingVideoSlots?: number;
}

export interface DraftAttachmentSelection {
  acceptedAttachments: DraftAttachment[];
  invalidCount: number;
  imageOverflowCount: number;
  videoOverflowCount: number;
}

export function buildDraftAttachments(
  files: FileList | null,
  { allowedTypes, remainingImageSlots, remainingVideoSlots = 0 }: BuildDraftAttachmentsOptions
): DraftAttachmentSelection {
  const selectedFiles = Array.from(files ?? []);
  const acceptedAttachments: DraftAttachment[] = [];
  let invalidCount = 0;
  let imageOverflowCount = 0;
  let videoOverflowCount = 0;
  let remainingImages = Math.max(remainingImageSlots, 0);
  let remainingVideos = Math.max(remainingVideoSlots, 0);

  for (const file of selectedFiles) {
    const type = getAttachmentType(file, allowedTypes);

    if (!type) {
      invalidCount += 1;
      continue;
    }

    if (type === 'image') {
      if (remainingImages <= 0) {
        imageOverflowCount += 1;
        continue;
      }
      remainingImages -= 1;
    }

    if (type === 'video') {
      if (remainingVideos <= 0) {
        videoOverflowCount += 1;
        continue;
      }
      remainingVideos -= 1;
    }

    acceptedAttachments.push({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      type,
    });
  }

  return { acceptedAttachments, invalidCount, imageOverflowCount, videoOverflowCount };
}

function getAttachmentType(
  file: File,
  allowedTypes: DraftAttachmentType[]
): DraftAttachmentType | null {
  if (allowedTypes.includes('image') && isSupportedImageFile(file)) {
    return 'image';
  }

  if (allowedTypes.includes('video') && isSupportedVideoFile(file)) {
    return 'video';
  }

  return null;
}

export function countDraftAttachments(
  attachments: DraftAttachment[]
): Record<DraftAttachmentType, number> {
  return attachments.reduce(
    (counts, attachment) => ({
      ...counts,
      [attachment.type]: counts[attachment.type] + 1,
    }),
    { image: 0, video: 0 }
  );
}
