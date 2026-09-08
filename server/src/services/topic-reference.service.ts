/**
 * Topic Reference Service
 * 议题引用服务
 *
 * Resolves `#编号` references for display and derives the "引用自" backlinks that
 * appear on a topic. Both directions are permission-filtered here, against the
 * same ProjectAccessService decision the rest of the API uses, so an authed view
 * and a public view can never disagree about who may see what.
 *
 * Two rules, applied everywhere:
 *   - a reference target is shown only if the viewer may read it;
 *   - a backlink location is shown only if the viewer may read that location
 *     (topic read access for descriptions, discussion access for messages).
 * A reference never grants access; it only ever points at something.
 */

import { ResearchModel } from '../models/research.model.js';
import { extractTopicReferenceNumbers } from '../models/research-reference.util.js';
import { ProjectAccessService, type ResearchProjectAccess } from './project-access.service.js';

export interface TopicReference {
  number: number;
  project_id: string;
  name_zh: string;
  name_en: string | null;
}

export type BacklinkLocationType = 'description_zh' | 'description_en' | 'comment';

export interface BacklinkLocation {
  type: BacklinkLocationType;
  comment_id?: string;
}

export interface BacklinkGroup {
  project_id: string;
  issue_number: number | null;
  name_zh: string;
  name_en: string | null;
  locations: BacklinkLocation[];
}

export interface TopicReferenceViewer {
  userId?: string;
  role: 'user' | 'admin';
}

export const BACKLINK_PAGE_SIZE = 20;

/**
 * Per-request memo over the access decision. Backlink pages touch the same
 * source topic many times (one description + many messages), and this keeps
 * that to one permission lookup each.
 * ponytail: still one lookup per distinct project — fine for a page of 20
 * groups; batch it in the model if a topic ever collects thousands of sources.
 */
function createAccessResolver(viewer: TopicReferenceViewer) {
  const cache = new Map<string, Promise<ResearchProjectAccess>>();
  return (projectId: string) => {
    let entry = cache.get(projectId);
    if (!entry) {
      entry = ProjectAccessService.getProjectAccess(projectId, viewer.userId, viewer.role);
      cache.set(projectId, entry);
    }
    return entry;
  };
}

export class TopicReferenceService {
  /**
   * Turn a document's stored target ids into display labels the viewer may see.
   * Targets the viewer cannot read are dropped, so no title, number or link for
   * them ever reaches the client.
   * 将文档存储的引用目标解析为当前访问者可见的展示信息。
   */
  static async resolveReferences(
    referencedProjectIds: unknown,
    viewer: TopicReferenceViewer,
    resolveAccess = createAccessResolver(viewer)
  ): Promise<TopicReference[]> {
    const ids = Array.isArray(referencedProjectIds)
      ? referencedProjectIds.filter((id): id is string => typeof id === 'string' && id.length > 0)
      : [];
    if (ids.length === 0) {
      return [];
    }

    const targets = await ResearchModel.getTopicReferenceLabels(ids);
    const readable = await Promise.all(
      targets.map(async (target) => {
        const access = await resolveAccess(target.id);
        return access.canRead ? target : null;
      })
    );

    return readable
      .filter((target): target is any => target !== null)
      .filter((target) => Number.isSafeInteger(target.issue_number) && target.issue_number > 0)
      .map((target) => ({
        number: target.issue_number as number,
        project_id: target.id as string,
        name_zh: (target.name_zh as string) ?? '',
        name_en: (target.name_en as string) ?? null,
      }));
  }

  /**
   * Resolve references for many documents at once, sharing one access cache.
   * 批量解析引用（共享一次权限缓存）。
   */
  static async resolveReferencesForEach<T extends { referenced_project_ids?: unknown }>(
    documents: T[],
    viewer: TopicReferenceViewer
  ): Promise<Array<Omit<T, 'referenced_project_ids'> & { references: TopicReference[] }>> {
    const resolveAccess = createAccessResolver(viewer);
    return Promise.all(
      documents.map(async ({ referenced_project_ids: referencedProjectIds, ...document }) => ({
        ...document,
        references: await this.resolveReferences(referencedProjectIds, viewer, resolveAccess),
      }))
    );
  }

  /**
   * "引用自": topics whose description or discussion references this topic,
   * grouped by source topic and filtered to what the viewer may actually open.
   * Filtering happens before counting and paging, so a hidden source is not
   * visible as a gap, a count or an empty page either.
   * 反向引用：按来源课题分组，先过滤权限再计数分页。
   */
  static async getBacklinks(
    targetProjectId: string,
    viewer: TopicReferenceViewer,
    page = 1
  ): Promise<{ items: BacklinkGroup[]; total: number }> {
    const [target] = await ResearchModel.getTopicReferenceLabels([targetProjectId]);
    const targetIssueNumber = Number.isSafeInteger(target?.issue_number)
      ? (target.issue_number as number)
      : null;

    const { projects, comments } = await ResearchModel.findTopicReferenceSources(targetProjectId);
    const resolveAccess = createAccessResolver(viewer);

    const describedBy = new Map<string, any>();
    for (const project of projects) {
      if (project.id !== targetProjectId) {
        describedBy.set(project.id, project);
      }
    }

    const commentsBySource = new Map<string, any[]>();
    for (const comment of comments) {
      // A topic's own discussion referencing itself is noise, not a backlink.
      if (comment.project_id === targetProjectId) continue;
      const bucket = commentsBySource.get(comment.project_id) ?? [];
      bucket.push(comment);
      commentsBySource.set(comment.project_id, bucket);
    }

    // Description sources keep their recent-activity order; comment-only
    // sources follow, in the order their messages were written.
    const sourceIds = [
      ...describedBy.keys(),
      ...[...commentsBySource.keys()].filter((id) => !describedBy.has(id)),
    ];

    const groups = await Promise.all(
      sourceIds.map(async (sourceId): Promise<BacklinkGroup | null> => {
        const access = await resolveAccess(sourceId);
        if (!access.project) {
          return null;
        }

        const locations: BacklinkLocation[] = [];
        const source = describedBy.get(sourceId);

        if (source && access.canRead && targetIssueNumber !== null) {
          // Repeated references inside one field collapse to a single location.
          if (extractTopicReferenceNumbers(source.description_zh).includes(targetIssueNumber)) {
            locations.push({ type: 'description_zh' });
          }
          if (extractTopicReferenceNumbers(source.description_en).includes(targetIssueNumber)) {
            locations.push({ type: 'description_en' });
          }
        }

        if (access.canAccessDiscussion) {
          for (const comment of commentsBySource.get(sourceId) ?? []) {
            locations.push({ type: 'comment', comment_id: comment.id });
          }
        }

        if (locations.length === 0) {
          return null;
        }

        return {
          project_id: sourceId,
          issue_number: Number.isSafeInteger(access.project.issue_number)
            ? access.project.issue_number
            : null,
          name_zh: access.project.name_zh ?? '',
          name_en: access.project.name_en ?? null,
          locations,
        };
      })
    );

    const visible = groups.filter((group): group is BacklinkGroup => group !== null);
    const safePage = Math.max(1, Math.floor(page) || 1);
    const start = (safePage - 1) * BACKLINK_PAGE_SIZE;

    return {
      items: visible.slice(start, start + BACKLINK_PAGE_SIZE),
      total: visible.length,
    };
  }
}
