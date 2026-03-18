import { useEffect, useState } from 'react';
import { Loader2, MessageCircle, Reply, Send, Trash2 } from 'lucide-react';
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

export function ProjectDiscussionSection({
  projectId,
  canParticipate,
  canModerate = false,
  currentUserId,
}: ProjectDiscussionSectionProps) {
  const [comments, setComments] = useState<ProjectDiscussionComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [newComment, setNewComment] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyError, setReplyError] = useState<string | null>(null);
  const [submittingReplyToId, setSubmittingReplyToId] = useState<string | null>(null);

  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const commentTree = buildCommentTree(comments);
  const starterPrompts = ['问一个概念点', '补充实验现象', '提出改进建议'];

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
    const isRoot = depth === 0;

    return (
      <div
        key={comment.id}
        className={cn(
          'relative',
          isRoot ? 'rounded-[1.6rem] border border-[var(--paper-accent)]/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(247,249,252,0.94))] p-4 shadow-[0_22px_48px_rgba(15,23,42,0.06)] md:p-5' : 'ml-5 border-l border-[var(--paper-accent)]/18 pl-4 sm:ml-8 sm:pl-5'
        )}
      >
        {!isRoot && (
          <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--glass-text-muted)]">
            <span className="h-px w-6 bg-[var(--paper-accent)]/30" />
            Reply
          </div>
        )}

        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--paper-accent)]/15 text-sm font-semibold text-[var(--paper-link)]">
            {(comment.username || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-semibold text-[var(--paper-foreground)]">
                {comment.username || '未命名用户'}
              </span>
              {isRoot && !comment.is_deleted && (
                <span className="rounded-full bg-[var(--paper-accent)]/10 px-2 py-0.5 text-[11px] font-semibold text-[var(--paper-link)]">
                  主留言
                </span>
              )}
              <span className="text-xs text-[var(--glass-text-muted)]">
                {formatCommentTime(comment.created_at)}
              </span>
              {comment.is_deleted && (
                <span className="rounded-full bg-slate-500/10 px-2 py-0.5 text-xs text-[var(--glass-text-muted)]">
                  已删除
                </span>
              )}
            </div>

            <div className="mt-2 text-sm leading-6 text-[var(--paper-foreground)]">
              {comment.is_deleted ? (
                <span className="italic text-[var(--glass-text-muted)]">这条留言已删除</span>
              ) : (
                <p className="whitespace-pre-wrap break-words">{comment.content}</p>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-medium">
              {canParticipate && !comment.is_deleted && (
                <button
                  onClick={() => {
                    setReplyTargetId((current) => (current === comment.id ? null : comment.id));
                    setReplyError(null);
                    setDeleteError(null);
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
            </div>

            {isReplying && canParticipate && (
              <div className="mt-4 rounded-[1.15rem] border border-[var(--paper-accent)]/16 bg-[var(--paper-accent)]/6 p-3">
                <textarea
                  value={replyDraft}
                  onChange={(event) => {
                    const value = event.target.value;
                    setReplyDrafts((current) => ({ ...current, [comment.id]: value }));
                  }}
                  rows={3}
                  maxLength={2000}
                  placeholder="补充你的看法、建议或追问"
                  className="w-full resize-y rounded-[1rem] border border-white/60 bg-white/85 px-3 py-2 text-sm text-[var(--paper-foreground)] outline-none transition focus:border-[var(--paper-accent)]/50 focus:ring-2 focus:ring-[var(--paper-accent)]/15"
                />
                {replyError && (
                  <p className="mt-2 text-xs text-[#b33d3d]">{replyError}</p>
                )}
                <div className="mt-3 flex flex-wrap justify-end gap-2">
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

        {comment.replies.length > 0 && (
          <div className="mt-4 space-y-3">
            {comment.replies.map((reply) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="research-panel mb-8 rounded-[1.9rem] p-5 sm:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="research-kicker mb-2">Discussion</div>
          <h2
            className="text-2xl font-semibold text-[var(--paper-foreground)]"
            style={{ fontFamily: 'var(--font-ui-display)' }}
          >
            课题讨论区
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--glass-text-muted)]">
            参考 Khan Academy 下面那种线程式讨论：先抛主问题，再沿着同一条回复链往下追问。
          </p>
        </div>
        <div className="research-chip inline-flex items-center gap-2 self-start rounded-full px-3 py-1.5 text-xs font-semibold sm:self-auto">
          <MessageCircle className="h-4 w-4 text-[var(--paper-link)]" />
          {comments.length} 条留言
        </div>
      </div>

      <div className="overflow-hidden rounded-[1.6rem] border border-[var(--paper-accent)]/12 bg-[linear-gradient(135deg,rgba(255,248,239,0.9),rgba(244,248,255,0.9))]">
        <div className="grid gap-0 lg:grid-cols-[0.92fr_1.38fr]">
          <div className="border-b border-[var(--paper-accent)]/10 px-5 py-5 lg:border-b-0 lg:border-r">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--paper-link)]">
              Start a discussion
            </div>
            <p className="mt-3 text-lg font-semibold text-[var(--paper-foreground)]">
              先写一条主留言，让后面的回复都围绕同一个问题展开。
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--glass-text-muted)]">
              更像学习社区里的讨论串，而不是零散弹幕。
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {starterPrompts.map((prompt) => (
                <span
                  key={prompt}
                  className="rounded-full border border-[var(--paper-accent)]/14 bg-white/72 px-3 py-1 text-xs font-medium text-[var(--paper-foreground)]"
                >
                  {prompt}
                </span>
              ))}
            </div>
          </div>

          <div className="px-5 py-5">
            <textarea
              value={newComment}
              onChange={(event) => setNewComment(event.target.value)}
              rows={5}
              maxLength={2000}
              disabled={!canParticipate || isSubmitting}
              placeholder={canParticipate ? '例如：这个实验结果为什么会在某个角度突然变化？' : '当前课题暂不开放公开留言'}
              className="w-full resize-y rounded-[1.15rem] border border-white/70 bg-white/92 px-4 py-3 text-sm text-[var(--paper-foreground)] outline-none transition focus:border-[var(--paper-accent)]/45 focus:ring-2 focus:ring-[var(--paper-accent)]/15 disabled:cursor-not-allowed disabled:opacity-70"
            />
            {submitError && (
              <p className="mt-2 text-sm text-[#b33d3d]">{submitError}</p>
            )}
            {!canParticipate && (
              <p className="mt-2 text-sm text-[var(--glass-text-muted)]">
                公开课题或课题成员可以参与讨论；如果只是想协作编辑，请先提交加入申请。
              </p>
            )}
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-xs text-[var(--glass-text-muted)]">
                最多 2000 字，建议一条留言只聚焦一个问题。
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
                发起讨论
              </button>
            </div>
          </div>
        </div>
      </div>

      {deleteError && (
        <div className="mt-4 rounded-[1.2rem] bg-red-50 px-4 py-3 text-sm text-[#b33d3d]">
          {deleteError}
        </div>
      )}

      <div className="mt-6">
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
    </section>
  );
}
