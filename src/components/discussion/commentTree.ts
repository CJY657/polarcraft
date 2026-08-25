/**
 * 讨论区评论树的共享逻辑。
 * 课题讨论（snake_case 字段）与实验讨论（camelCase 字段）都用它，
 * 差异只通过字段访问器抹平，排序语义与各自原实现保持一致。
 */

export interface CommentTreeAccessors<T> {
  idOf: (comment: T) => string;
  parentIdOf: (comment: T) => string | null;
  createdAtOf: (comment: T) => string;
}

export type WithReplies<T> = T & { replies: WithReplies<T>[] };

/** 顶层按创建时间倒序，回复按正序——与两处原实现一致。 */
export function buildCommentTree<T>(
  comments: T[],
  { idOf, parentIdOf, createdAtOf }: CommentTreeAccessors<T>
): WithReplies<T>[] {
  const grouped = new Map<string | null, T[]>();

  for (const comment of comments) {
    const parentId = parentIdOf(comment);
    const siblings = grouped.get(parentId) ?? [];
    siblings.push(comment);
    grouped.set(parentId, siblings);
  }

  const buildBranch = (parentId: string | null): WithReplies<T>[] => {
    const siblings = [...(grouped.get(parentId) ?? [])];
    siblings.sort((left, right) => {
      const leftTime = new Date(createdAtOf(left)).getTime();
      const rightTime = new Date(createdAtOf(right)).getTime();
      return parentId === null ? rightTime - leftTime : leftTime - rightTime;
    });

    return siblings.map((comment) => ({
      ...comment,
      replies: buildBranch(idOf(comment)),
    }));
  };

  return buildBranch(null);
}

export function countReplies(comment: { replies: { replies: unknown[] }[] }): number {
  return comment.replies.reduce(
    (total, reply) => total + 1 + countReplies(reply as { replies: { replies: unknown[] }[] }),
    0
  );
}

export function buildParentCommentLookup<T>(
  comments: T[],
  { idOf, parentIdOf }: Pick<CommentTreeAccessors<T>, 'idOf' | 'parentIdOf'>
): Map<string, string | null> {
  const parentLookup = new Map<string, string | null>();

  for (const comment of comments) {
    parentLookup.set(idOf(comment), parentIdOf(comment) ?? null);
  }

  return parentLookup;
}

/** 从某条评论一路向上展开到根，返回可直接并入 expanded state 的 map。 */
export function expandCommentAncestors(
  commentId: string,
  parentLookup: Map<string, string | null>
): Record<string, boolean> {
  const expanded: Record<string, boolean> = {};
  let currentId: string | null = commentId;

  while (currentId) {
    expanded[currentId] = true;
    currentId = parentLookup.get(currentId) ?? null;
  }

  return expanded;
}

export function findRootCommentId(
  commentId: string,
  parentLookup: Map<string, string | null>
): string {
  let rootId = commentId;
  let parentId = parentLookup.get(rootId) ?? null;

  while (parentId) {
    rootId = parentId;
    parentId = parentLookup.get(rootId) ?? null;
  }

  return rootId;
}
