import { useEffect, useState } from 'react';
import { ChevronDown, Loader2, MessageCircle, Reply, Send, Trash2 } from 'lucide-react';
import { cn } from '@/utils/classNames';
import { researchApi, type ProjectDiscussionComment } from '@/lib/research.service';

interface ProjectDiscussionSectionProps {
  projectId: string;
  canParticipate: boolean;
  canModerate?: boolean;
  currentUserId?: string;
}

interface DiscussionTreeComment extends ProjectDiscussionComment {
  replies: DiscussionTreeComment[];
}

function formatCommentTime(value: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function buildCommentTree(comments: ProjectDiscussionComment[]): DiscussionTreeComment[] {
  const grouped = new Map<string | null, ProjectDiscussionComment[]>();

  for (const comment of comments) {
    const siblings = grouped.get(comment.parent_comment_id) ?? [];
    siblings.push(comment);
    grouped.set(comment.parent_comment_id, siblings);
  }

  const buildBranch = (parentId: string | null): DiscussionTreeComment[] => {
    const siblings = [...(grouped.get(parentId) ?? [])];
    siblings.sort((left, right) => {
      const leftTime = new Date(left.created_at).getTime();
      const rightTime = new Date(right.created_at).getTime();
      return parentId === null ? rightTime - leftTime : leftTime - rightTime;
    });

    return siblings.map((comment) => ({
      ...comment,
      replies: buildBranch(comment.id),
    }));
  };

  return buildBranch(null);
}

function countReplies(comment: DiscussionTreeComment): number {
  return comment.replies.reduce((total, reply) => total + 1 + countReplies(reply), 0);
}

function buildParentCommentLookup(
  comments: ProjectDiscussionComment[]
): Map<string, string | null> {
  const parentLookup = new Map<string, string | null>();

  for (const comment of comments) {
    parentLookup.set(comment.id, comment.parent_comment_id ?? null);
  }

  return parentLookup;
}

function expandCommentAncestors(
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

export function ProjectDiscussionSection({
  projectId,
  canParticipate,
  canModerate = false,
  currentUserId,
}: ProjectDiscussionSectionProps) {
  const [comments, setComments] = useState<ProjectDiscussionComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isDiscussionOpen, setIsDiscussionOpen] = useState(false);

  const [newComment, setNewComment] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyError, setReplyError] = useState<string | null>(null);
  const [submittingReplyToId, setSubmittingReplyToId] = useState<string | null>(null);

  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [expandedCommentIds, setExpandedCommentIds] = useState<Record<string, boolean>>({});

  const commentTree = buildCommentTree(comments);
  const parentCommentLookup = buildParentCommentLookup(comments);
  const summaryComments = commentTree.slice(0, 3);

  async function loadComments() {
    try {
      setIsLoading(true);
      setLoadError(null);
      const data = await researchApi.getProjectDiscussionComments(projectId);
      setComments(data);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : '加载讨论区失败');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    setIsDiscussionOpen(false);
    setNewComment('');
    setSubmitError(null);
    setReplyTargetId(null);
    setReplyDrafts({});
    setReplyError(null);
    setDeleteError(null);
    setExpandedCommentIds({});
    void loadComments();
  }, [projectId]);

  async function handleSubmitComment() {
    const content = newComment.trim();
    if (!content) {
      setSubmitError('请输入留言内容');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      await researchApi.addProjectDiscussionComment(projectId, { content });
      setNewComment('');
      setIsDiscussionOpen(true);
      await loadComments();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '发布留言失败');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmitReply(parentCommentId: string) {
    const content = (replyDrafts[parentCommentId] ?? '').trim();
    if (!content) {
      setReplyError('请输入回复内容');
      return;
    }

    try {
      setSubmittingReplyToId(parentCommentId);
      setReplyError(null);
      await researchApi.addProjectDiscussionComment(projectId, {
        content,
        parentCommentId,
      });
      setReplyDrafts((current) => ({ ...current, [parentCommentId]: '' }));
      setReplyTargetId(null);
      setExpandedCommentIds((current) => ({
        ...current,
        ...expandCommentAncestors(parentCommentId, parentCommentLookup),
      }));
      setIsDiscussionOpen(true);
      await loadComments();
    } catch (error) {
      setReplyError(error instanceof Error ? error.message : '回复失败');
    } finally {
      setSubmittingReplyToId(null);
    }
  }

  async function handleDeleteComment(commentId: string) {
    try {
      setDeletingCommentId(commentId);
      setDeleteError(null);
      await researchApi.deleteProjectDiscussionComment(commentId);
      await loadComments();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : '删除留言失败');
    } finally {
      setDeletingCommentId(null);
    }
  }

  function canDeleteComment(comment: ProjectDiscussionComment): boolean {
    if (comment.is_deleted) {
      return false;
    }

    return currentUserId === comment.user_id || canModerate;
  }

  function renderComment(comment: DiscussionTreeComment, depth = 0) {
    const isReplying = replyTargetId === comment.id;
    const replyDraft = replyDrafts[comment.id] ?? '';
    const hasReplies = comment.replies.length > 0;
    const totalReplyCount = countReplies(comment);
    const isRepliesExpanded = expandedCommentIds[comment.id] ?? depth > 0;

    return (
      <div
        key={comment.id}
        className={cn(
          'relative',
          depth === 0 ? 'rounded-[1.25rem] border border-[var(--paper-accent)]/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(247,249,252,0.96))] p-3.5 shadow-[0_12px_28px_rgba(15,23,42,0.05)] md:p-4' : 'ml-4 border-l border-[var(--paper-accent)]/16 pl-3.5 sm:ml-6 sm:pl-4'
        )}
      >
        <div className="flex items-start gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--paper-accent)]/15 text-xs font-semibold text-[var(--paper-link)]">
            {(comment.username || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-sm font-semibold text-[var(--paper-foreground)]">
                {comment.username || '未命名用户'}
              </span>
              <span className="text-xs text-[var(--glass-text-muted)]">
                {formatCommentTime(comment.created_at)}
              </span>
              {comment.is_deleted && (
                <span className="rounded-full bg-slate-500/10 px-2 py-0.5 text-xs text-[var(--glass-text-muted)]">
                  已删除
                </span>
              )}
            </div>

            <div className="mt-1.5 text-sm leading-6 text-[var(--paper-foreground)]">
              {comment.is_deleted ? (
                <span className="italic text-[var(--glass-text-muted)]">这条留言已删除</span>
              ) : (
                <p className="whitespace-pre-wrap break-words">{comment.content}</p>
              )}
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs font-medium">
              {canParticipate && !comment.is_deleted && (
                <button
                  onClick={() => {
                    setExpandedCommentIds((current) => ({
                      ...current,
                      ...expandCommentAncestors(comment.id, parentCommentLookup),
                    }));
                    setReplyTargetId((current) => (current === comment.id ? null : comment.id));
                    setReplyError(null);
                    setDeleteError(null);
                    setIsDiscussionOpen(true);
                  }}
                  className="inline-flex items-center gap-1 text-[var(--paper-link)] transition-opacity hover:opacity-80"
                >
                  <Reply className="h-3.5 w-3.5" />
                  回复
                </button>
              )}

              {canDeleteComment(comment) && (
                <button
                  onClick={() => void handleDeleteComment(comment.id)}
                  disabled={deletingCommentId === comment.id}
                  className="inline-flex items-center gap-1 text-[#b33d3d] transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletingCommentId === comment.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  删除
                </button>
              )}

              {hasReplies && (
                <button
                  onClick={() => {
                    setExpandedCommentIds((current) => ({
                      ...current,
                      [comment.id]: !(current[comment.id] ?? depth > 0),
                    }));
                  }}
                  className="inline-flex items-center gap-1 rounded-full bg-[var(--paper-accent)]/10 px-2.5 py-1 text-[var(--paper-link)] transition-colors hover:bg-[var(--paper-accent)]/16"
                >
                  {isRepliesExpanded ? `收起 ${totalReplyCount} 条回复` : `展开 ${totalReplyCount} 条回复`}
                  <ChevronDown
                    className={cn(
                      'h-3.5 w-3.5 transition-transform duration-200',
                      isRepliesExpanded && 'rotate-180'
                    )}
                  />
                </button>
              )}
            </div>

            {isReplying && canParticipate && (
              <div className="mt-3 rounded-[1rem] border border-[var(--paper-accent)]/14 bg-[var(--paper-accent)]/6 p-2.5">
                <textarea
                  value={replyDraft}
                  onChange={(event) => {
                    const value = event.target.value;
                    setReplyDrafts((current) => ({ ...current, [comment.id]: value }));
                  }}
                  rows={2}
                  maxLength={2000}
                  placeholder="补充你的看法、建议或追问"
                  className="w-full resize-y rounded-[0.9rem] border border-white/60 bg-white/88 px-3 py-2 text-sm text-[var(--paper-foreground)] outline-none transition focus:border-[var(--paper-accent)]/50 focus:ring-2 focus:ring-[var(--paper-accent)]/15"
                />
                {replyError && (
                  <p className="mt-2 text-xs text-[#b33d3d]">{replyError}</p>
                )}
                <div className="mt-2.5 flex flex-wrap justify-end gap-2">
                  <button
                    onClick={() => {
                      setReplyTargetId(null);
                      setReplyError(null);
                    }}
                    className="glass-button rounded-full px-3 py-1.5 text-xs font-medium"
                  >
                    收起
                  </button>
                  <button
                    onClick={() => void handleSubmitReply(comment.id)}
                    disabled={submittingReplyToId === comment.id}
                    className="glass-button glass-button-primary inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {submittingReplyToId === comment.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    发送回复
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {hasReplies && isRepliesExpanded && (
          <div className="mt-3 space-y-2.5">
            {comment.replies.map((reply) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="research-panel mb-8 rounded-[1.9rem] p-5 sm:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="research-kicker mb-2">Discussion</div>
          <h2
            className="text-2xl font-semibold text-[var(--paper-foreground)]"
            style={{ fontFamily: 'var(--font-ui-display)' }}
          >
            课题讨论区
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <div className="research-chip inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold">
            <MessageCircle className="h-4 w-4 text-[var(--paper-link)]" />
            {comments.length} 条留言
          </div>
          <button
            type="button"
            onClick={() => setIsDiscussionOpen((current) => !current)}
            aria-expanded={isDiscussionOpen}
            className="glass-button inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
          >
            {isDiscussionOpen ? '收起讨论区' : '展开讨论区'}
            <ChevronDown
              className={cn(
                'h-4 w-4 text-[var(--paper-link)] transition-transform duration-200',
                isDiscussionOpen && 'rotate-180'
              )}
            />
          </button>
        </div>
      </div>

      {!isDiscussionOpen && (
        <button
          type="button"
          onClick={() => setIsDiscussionOpen(true)}
          className="group w-full overflow-hidden rounded-[1.6rem] border border-[var(--paper-accent)]/12 bg-[linear-gradient(135deg,rgba(255,248,239,0.76),rgba(244,248,255,0.88))] px-5 py-4 text-left transition hover:border-[var(--paper-accent)]/20 hover:shadow-[0_18px_42px_rgba(15,23,42,0.05)]"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--paper-link)]">
                Discussion Preview
              </div>
              <p className="mt-2 text-base font-semibold text-[var(--paper-foreground)]">
                {isLoading
                  ? '正在同步讨论区内容'
                  : commentTree.length === 0
                  ? '讨论区已收起，展开后可以发起第一条讨论'
                  : '讨论区已收起，展开后查看完整留言和回复'}
              </p>
              <p className="mt-1 text-sm text-[var(--glass-text-muted)]">
                {loadError
                  ? loadError
                  : commentTree.length === 0
                  ? '像抖音评论区一样，平时收起来，需要时再点开。'
                  : `当前有 ${comments.length} 条留言，最近的讨论会优先显示在上面。`}
              </p>
            </div>

            <div className="flex items-center gap-3 md:justify-end">
              {summaryComments.length > 0 && (
                <div className="flex -space-x-2">
                  {summaryComments.map((comment) => (
                    <div
                      key={comment.id}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-[var(--paper-accent)]/16 text-xs font-semibold text-[var(--paper-link)] shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
                    >
                      {(comment.username || 'U').charAt(0).toUpperCase()}
                    </div>
                  ))}
                </div>
              )}

              <div className="inline-flex items-center gap-2 rounded-full bg-white/82 px-3 py-2 text-sm font-medium text-[var(--paper-foreground)]">
                点此展开
                <ChevronDown className="h-4 w-4 text-[var(--paper-link)] transition-transform duration-200 group-hover:translate-y-0.5" />
              </div>
            </div>
          </div>

          {summaryComments.length > 0 && (
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {summaryComments.map((comment) => (
                <div
                  key={comment.id}
                  className="rounded-[1.2rem] border border-white/60 bg-white/76 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-semibold text-[var(--paper-foreground)]">
                      {comment.username || '未命名用户'}
                    </span>
                    <span className="text-[11px] text-[var(--glass-text-muted)]">
                      {formatCommentTime(comment.created_at)}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--glass-text-muted)]">
                    {comment.is_deleted ? '这条留言已删除' : comment.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </button>
      )}

      {isDiscussionOpen && (
        <>
          <div className="rounded-[1.25rem] border border-[var(--paper-accent)]/12 bg-[linear-gradient(135deg,rgba(255,248,239,0.88),rgba(244,248,255,0.92))] p-4 sm:p-5">
            <textarea
              value={newComment}
              onChange={(event) => setNewComment(event.target.value)}
              rows={3}
              maxLength={2000}
              disabled={!canParticipate || isSubmitting}
              placeholder={canParticipate ? '写下你的问题、观察或建议…' : '当前课题暂不开放公开留言'}
              className="w-full resize-y rounded-[1rem] border border-white/70 bg-white/94 px-4 py-3 text-sm text-[var(--paper-foreground)] outline-none transition focus:border-[var(--paper-accent)]/45 focus:ring-2 focus:ring-[var(--paper-accent)]/15 disabled:cursor-not-allowed disabled:opacity-70"
            />
            {submitError && (
              <p className="mt-2 text-sm text-[#b33d3d]">{submitError}</p>
            )}
            {!canParticipate && (
              <p className="mt-2 text-sm text-[var(--glass-text-muted)]">
                公开课题或课题成员可以参与讨论。
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-[var(--glass-text-muted)]">
                最多 2000 字
              </span>
              <button
                onClick={() => void handleSubmitComment()}
                disabled={!canParticipate || isSubmitting}
                className="glass-button glass-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                发布
              </button>
            </div>
          </div>

          {deleteError && (
            <div className="mt-4 rounded-[1.2rem] bg-red-50 px-4 py-3 text-sm text-[#b33d3d]">
              {deleteError}
            </div>
          )}

          <div className="mt-4">
            {isLoading ? (
              <div className="research-panel-soft flex items-center justify-center gap-3 rounded-[1.4rem] px-4 py-8 text-sm text-[var(--glass-text-muted)]">
                <Loader2 className="h-4 w-4 animate-spin" />
                正在加载讨论内容
              </div>
            ) : loadError ? (
              <div className="rounded-[1.4rem] bg-red-50 px-4 py-4 text-sm text-[#b33d3d]">
                {loadError}
              </div>
            ) : commentTree.length === 0 ? (
              <div className="research-panel-soft rounded-[1.4rem] px-4 py-8 text-center">
                <p className="text-sm font-medium text-[var(--paper-foreground)]">还没有人开场</p>
                <p className="mt-2 text-sm text-[var(--glass-text-muted)]">
                  先抛一个明确问题，后面的回复自然会形成一条清楚的讨论线。
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {commentTree.map((comment) => renderComment(comment))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
