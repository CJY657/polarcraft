import { getCollection } from '../database/connection.js';
import { normalizeDocuments } from '../database/mongo.util.js';

const canvasesCollection = () => getCollection('research_canvases');
const nodesCollection = () => getCollection('research_nodes');
const projectCommentsCollection = () => getCollection('research_project_comments');

type CanvasCoverSource = {
  id: string;
  project_id: string;
};

type NodeCoverSource = {
  canvas_id: string;
  media_url?: string | null;
};

type ProjectCommentCoverSource = {
  project_id: string;
  image_urls?: unknown;
};

function normalizeImageUrl(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

function getFirstCommentImageUrl(imageUrls: unknown): string | null {
  if (!Array.isArray(imageUrls)) {
    return null;
  }

  return normalizeImageUrl(imageUrls[0]);
}

export async function getProjectCoverImageMap(projectIds: string[]): Promise<Map<string, string>> {
  const uniqueProjectIds = [...new Set(projectIds)].filter(Boolean);
  const coverMap = new Map<string, string>();

  if (uniqueProjectIds.length === 0) {
    return coverMap;
  }

  const canvases = normalizeDocuments<CanvasCoverSource>(
    await canvasesCollection()
      .find({ project_id: { $in: uniqueProjectIds } })
      .project({ _id: 0, id: 1, project_id: 1 })
      .toArray()
  );

  const canvasProjectMap = new Map(canvases.map((canvas) => [canvas.id, canvas.project_id]));
  const canvasIds = canvases.map((canvas) => canvas.id);

  if (canvasIds.length > 0) {
    const imageNodes = normalizeDocuments<NodeCoverSource>(
      await nodesCollection()
        .find({
          canvas_id: { $in: canvasIds },
          media_type: 'image',
          media_url: { $nin: [null, ''] },
        })
        .project({ _id: 0, canvas_id: 1, media_url: 1, created_at: 1 })
        .sort({ created_at: 1 })
        .toArray()
    );

    for (const node of imageNodes) {
      const projectId = canvasProjectMap.get(node.canvas_id);
      const imageUrl = normalizeImageUrl(node.media_url);

      if (!projectId || !imageUrl || coverMap.has(projectId)) {
        continue;
      }

      coverMap.set(projectId, imageUrl);
    }
  }

  const remainingProjectIds = uniqueProjectIds.filter((projectId) => !coverMap.has(projectId));
  if (remainingProjectIds.length === 0) {
    return coverMap;
  }

  const comments = normalizeDocuments<ProjectCommentCoverSource>(
    await projectCommentsCollection()
      .find({
        project_id: { $in: remainingProjectIds },
        is_deleted: { $ne: true },
      })
      .project({ _id: 0, project_id: 1, image_urls: 1, created_at: 1 })
      .sort({ created_at: 1 })
      .toArray()
  );

  for (const comment of comments) {
    const imageUrl = getFirstCommentImageUrl(comment.image_urls);

    if (!imageUrl || coverMap.has(comment.project_id)) {
      continue;
    }

    coverMap.set(comment.project_id, imageUrl);
  }

  return coverMap;
}
