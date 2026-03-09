import type { MediaResource } from "@/data/courses";

type MediaReferenceKind = "视频" | "照片";

const MEDIA_REFERENCE_PATTERN = /(视频|照片)\s*([0-9]+(?:\.\d+)?)/gu;

export function normalizeMediaReferenceText(text: string) {
  return text.replace(/\s+/gu, "");
}

function buildMediaReferenceId(kind: MediaReferenceKind, key: string) {
  return `${kind}:${key}`;
}

export function extractReferenceKeysFromText(text: string) {
  const keys = new Set<string>();
  const normalizedText = normalizeMediaReferenceText(text);

  for (const match of normalizedText.matchAll(MEDIA_REFERENCE_PATTERN)) {
    const kind = match[1] as MediaReferenceKind | undefined;
    const key = match[2];

    if (kind && key) {
      keys.add(buildMediaReferenceId(kind, key));
    }
  }

  return Array.from(keys);
}

export function extractMediaReferenceKeys(media: Pick<MediaResource, "url" | "title">) {
  const keys = new Set<string>();
  const sources = [media.url, media.title["zh-CN"], media.title["en-US"]].filter(Boolean);

  sources.forEach((source) => {
    extractReferenceKeysFromText(source).forEach((key) => {
      keys.add(key);
    });
  });

  return Array.from(keys);
}

export function buildMediaReferenceMap(mediaList: Pick<MediaResource, "id" | "url" | "title">[]) {
  const referenceMap: Record<string, string> = {};

  mediaList.forEach((media) => {
    extractMediaReferenceKeys(media).forEach((referenceKey) => {
      referenceMap[referenceKey] = media.id;
    });
  });

  return referenceMap;
}
