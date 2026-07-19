/**
 * Project Peer Review Section
 * 课题同伴评审区块
 *
 * 待评审阶段收集组外同伴的评审意见；达到 2 份后组长才能把课题推进到已展示。
 * 评审在课题展示后仍然保留，作为公开的评审记录。
 */

import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  PenLine,
  RefreshCw,
  Send,
  Trash2,
} from 'lucide-react';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { cn } from '@/utils/classNames';
import { formatUserIdentity, getUserIdentityInitial } from '@/lib/identity';
import {
  researchApi,
  type ProjectReview,
  type ProjectReviewVerdict,
} from '@/lib/research.service';
import { profileApi } from '@/lib/profile.service';

const PROJECT_REVIEW_QUORUM = 2;
const MAX_REVIEW_CONTENT_LENGTH = 2000;

const VERDICT_OPTIONS: Array<{ value: ProjectReviewVerdict; label: string; description: string }> = [
  { value: 'approve', label: '建议通过', description: '课题达到了评审标准，可以进入展示' },
  { value: 'request_changes', label: '建议修改', description: '还有需要补充或改进的地方' },
];

interface ProjectPeerReviewSectionProps {
  projectId: string;
  projectStatus: string;
  reviewCriteria?: string | null;
  currentUserId?: string;
  /** 当前用户是否是本课题的在册成员（成员只能查看，不能评审） */
  isActiveMember: boolean;
  usePublicEndpoint?: boolean;
  theme?: 'light' | 'dark';
  /** 通知页面本区块是否有内容可展示（用于导航条目的显隐） */
  onContentChange?: (hasContent: boolean) => void;
}

function formatReviewTime(value: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function VerdictChip({ verdict }: { verdict: ProjectReviewVerdict }) {
  const isApprove = verdict === 'approve';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold',
        isApprove
          ? 'bg-emerald-500/12 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
          : 'bg-amber-500/12 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
      )}
    >
      {isApprove ? <CheckCircle2 className="h-4 w-4" /> : <PenLine className="h-4 w-4" />}
      {isApprove ? '建议通过' : '建议修改'}
    </span>
  );
}

export function ProjectPeerReviewSection({
  projectId,
  projectStatus,
  reviewCriteria,
  currentUserId,
  isActiveMember,
  usePublicEndpoint = false,
  theme = 'light',
  onContentChange,
}: ProjectPeerReviewSectionProps) {
  const [reviews, setReviews] = useState<ProjectReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [verdict, setVerdict] = useState<ProjectReviewVerdict>('approve');
  const [content, setContent] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isReviewPending = projectStatus === 'review_pending';
  const myReview = currentUserId
    ? reviews.find((review) => review.reviewer_id === currentUserId) ?? null
    : null;
  const canSubmitReview = Boolean(
    !usePublicEndpoint && currentUserId && !isActiveMember && isReviewPending
  );

  const loadReviews = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const items = usePublicEndpoint
        ? await profileApi.getPublicProjectReviews(projectId)
        : await researchApi.getProjectReviews(projectId);
      setReviews(items);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : '加载同伴评审失败');
    } finally {
      setIsLoading(false);
    }
  }, [projectId, usePublicEndpoint]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  // 已有评审时把表单预填为自己的评审，便于直接修改
  useEffect(() => {
    if (myReview) {
      setVerdict(myReview.verdict);
      setContent(myReview.content);
    }
  }, [myReview?.id, myReview?.updated_at]);

  const hasContent = isReviewPending || reviews.length > 0;

  useEffect(() => {
    onContentChange?.(hasContent && !isLoading);
  }, [hasContent, isLoading, onContentChange]);

  async function handleSubmit() {
    const trimmed = content.trim();
    if (!trimmed) {
      setFormError('请填写评审意见');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      await researchApi.upsertMyProjectReview(projectId, { verdict, content: trimmed });
      await loadReviews();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '提交评审失败');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteMyReview() {
    if (!myReview) {
      return;
    }

    setIsDeleting(true);

    try {
      await researchApi.deleteProjectReview(myReview.id);
      setVerdict('approve');
      setContent('');
      setIsDeleteConfirmOpen(false);
      await loadReviews();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '删除评审失败');
      setIsDeleteConfirmOpen(false);
    } finally {
      setIsDeleting(false);
    }
  }

  // 非待评审阶段且没有历史评审时整块隐藏（例如旧的已展示课题）
  if (!hasContent && !isLoading) {
    return null;
  }

  if (!isReviewPending && isLoading) {
    return null;
  }

  const receivedCount = reviews.length;
  const quorumMet = receivedCount >= PROJECT_REVIEW_QUORUM;

  return (
    <section className="research-panel mb-4 rounded-[1.6rem] p-4 sm:p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            className="text-2xl font-semibold text-[var(--paper-foreground)]"
            style={{ fontFamily: 'var(--font-ui-display)' }}
          >
            同伴评审
          </h2>
          <p className="mt-1 text-base leading-6 text-[var(--glass-text-muted)]">
            {isReviewPending
              ? '课题正在等待组外同伴评审，收到足够评审后才能进入展示。'
              : '这些是课题在待评审阶段收到的同伴评审记录。'}
          </p>
        </div>

        {isReviewPending && (
          <div className="research-panel-soft flex min-w-[13rem] flex-col gap-2 self-start rounded-[1.25rem] px-4 py-3 sm:self-auto">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold uppercase tracking-[0.1em] text-[var(--glass-text-muted)]">
                评审进度
              </span>
              <span
                className={cn(
                  'text-base font-bold',
                  quorumMet ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--paper-foreground)]'
                )}
              >
                {Math.min(receivedCount, PROJECT_REVIEW_QUORUM)} / {PROJECT_REVIEW_QUORUM}
              </span>
            </div>
            <div className="flex gap-1.5" aria-hidden="true">
              {Array.from({ length: PROJECT_REVIEW_QUORUM }, (_, slot) => (
                <span
                  key={slot}
                  className={cn(
                    'h-2 flex-1 rounded-full transition-colors',
                    slot < receivedCount ? 'bg-[var(--paper-accent)]' : 'bg-[var(--glass-chip)]'
                  )}
                />
              ))}
            </div>
            <p className="text-sm leading-5 text-[var(--glass-text-muted)]">
              {quorumMet
                ? '评审数量已达标，组长可以推进到「已展示」。'
                : `已收到 ${receivedCount} 份评审，还差 ${PROJECT_REVIEW_QUORUM - receivedCount} 份。`}
            </p>
          </div>
        )}
      </div>

      {reviewCriteria?.trim() && (
        <div className="research-panel-soft mb-4 rounded-[1.35rem] p-4">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 shrink-0 text-[var(--paper-link)]" />
            <h3 className="text-lg font-semibold text-[var(--paper-foreground)]">评审标准</h3>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-base leading-7 text-[var(--glass-text-muted)]">
            {reviewCriteria.trim()}
          </p>
        </div>
      )}

      {usePublicEndpoint && isReviewPending && (
        <div className="research-panel-soft mb-4 flex items-start gap-3 rounded-[1.25rem] px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--paper-link)]" />
          <p className="text-base leading-6 text-[var(--glass-text-muted)]">
            登录后就可以对照评审标准提交你的同伴评审。
          </p>
        </div>
      )}

      {!usePublicEndpoint && isActiveMember && isReviewPending && (
        <div className="research-panel-soft mb-4 flex items-start gap-3 rounded-[1.25rem] px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--paper-link)]" />
          <p className="text-base leading-6 text-[var(--glass-text-muted)]">
            同伴评审由课题组外的同学提交，组内成员在这里查看收到的意见即可。
          </p>
        </div>
      )}

      {canSubmitReview && (
        <div className="research-panel-soft mb-5 rounded-[1.35rem] p-4">
          <h3 className="text-lg font-semibold text-[var(--paper-foreground)]">
            {myReview ? '修改我的评审' : '提交我的评审'}
          </h3>
          <p className="mt-1 text-base text-[var(--glass-text-muted)]">
            对照上方评审标准，先选结论，再写清楚理由和建议。
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="评审结论">
            {VERDICT_OPTIONS.map((option) => {
              const isSelected = verdict === option.value;
              return (
                <label
                  key={option.value}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-[1.15rem] border px-4 py-3 transition',
                    isSelected
                      ? 'border-[var(--paper-accent)] bg-[var(--paper-accent)]/10 shadow-sm'
                      : 'border-[var(--glass-stroke)] bg-white/55 hover:border-[var(--paper-accent)]/45 dark:bg-slate-900/35'
                  )}
                >
                  <input
                    type="radio"
                    name="peer-review-verdict"
                    value={option.value}
                    checked={isSelected}
                    onChange={() => setVerdict(option.value)}
                    className="mt-1.5 h-4 w-4 shrink-0 accent-[var(--paper-accent)]"
                  />
                  <span className="min-w-0">
                    <span className="block text-base font-semibold text-[var(--paper-foreground)]">
                      {option.label}
                    </span>
                    <span className="mt-0.5 block text-sm leading-5 text-[var(--glass-text-muted)]">
                      {option.description}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>

          <label className="mt-4 grid gap-2 text-base font-medium text-[var(--paper-foreground)]">
            评审意见
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={4}
              maxLength={MAX_REVIEW_CONTENT_LENGTH}
              placeholder="写下课题做得好的地方、不足之处和具体的改进建议…"
              className="resize-y rounded-[1rem] border border-[var(--glass-stroke)] bg-white/70 px-4 py-3 text-base leading-7 text-[var(--paper-foreground)] outline-none transition focus:border-[var(--paper-link)] dark:bg-slate-900/50"
            />
          </label>

          {formError && (
            <div className="mt-3 rounded-[1rem] bg-red-50 px-4 py-3 text-base text-red-600 dark:bg-red-900/30 dark:text-red-300">
              {formError}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-[var(--glass-text-muted)]">
              最多 {MAX_REVIEW_CONTENT_LENGTH} 字，评审提交后可以再修改
            </span>
            <div className="flex flex-wrap gap-2">
              {myReview && (
                <button
                  type="button"
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  disabled={isSubmitting || isDeleting}
                  className="glass-button inline-flex items-center gap-2 rounded-full px-4 py-2 text-base font-medium text-[#a24432] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                  删除我的评审
                </button>
              )}
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={isSubmitting}
                className="glass-button glass-button-primary inline-flex items-center gap-2 rounded-full px-5 py-2 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {myReview ? '更新评审' : '提交评审'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="grid gap-3">
          {[0, 1].map((item) => (
            <div key={item} className="research-panel-soft h-24 animate-pulse rounded-[1.35rem]" />
          ))}
        </div>
      )}

      {!isLoading && loadError && (
        <div className="research-panel-soft rounded-[1.35rem] px-5 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 text-[#b33d3d]" />
              <div>
                <p className="text-base font-semibold text-[var(--paper-foreground)]">同伴评审加载失败</p>
                <p className="mt-1 text-base text-[var(--glass-text-muted)]">{loadError}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void loadReviews()}
              className="glass-button inline-flex items-center justify-center gap-2 self-start rounded-full px-4 py-2 text-base font-medium sm:self-auto"
            >
              <RefreshCw className="h-4 w-4 text-[var(--paper-link)]" />
              重试
            </button>
          </div>
        </div>
      )}

      {!isLoading && !loadError && reviews.length === 0 && (
        <div className="research-panel-soft rounded-[1.35rem] px-5 py-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--paper-link)]/10 text-[var(--paper-link)]">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <p className="mt-4 text-lg font-semibold text-[var(--paper-foreground)]">还没有收到同伴评审</p>
          <p className="mx-auto mt-2 max-w-md text-base leading-6 text-[var(--glass-text-muted)]">
            {canSubmitReview
              ? '你可以成为第一位评审人，帮这个课题组看看成果是否达标。'
              : '可以邀请其他课题组的同学来阅读成果并提交评审。'}
          </p>
        </div>
      )}

      {!isLoading && !loadError && reviews.length > 0 && (
        <div className="grid gap-3">
          {reviews.map((review) => {
            const reviewerName = formatUserIdentity(
              {
                username: review.reviewer_username,
                nickname: review.reviewer_nickname,
                real_name: review.reviewer_real_name,
                show_real_name_publicly: review.reviewer_show_real_name_publicly,
              },
              '同伴评审人'
            );
            const isMine = currentUserId === review.reviewer_id;
            const isEdited = review.updated_at !== review.created_at;

            return (
              <article key={review.id} className="research-panel-soft rounded-[1.35rem] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--paper-accent)]/15 text-base font-semibold text-[var(--paper-link)]">
                      {getUserIdentityInitial({ username: review.reviewer_username }, '评')}
                    </div>
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-base font-semibold text-[var(--paper-foreground)]">
                        <span className="truncate">{reviewerName}</span>
                        {isMine && (
                          <span className="research-chip rounded-full px-2 py-0.5 text-xs font-semibold">我的评审</span>
                        )}
                      </p>
                      <p className="text-sm text-[var(--glass-text-muted)]">
                        {formatReviewTime(review.updated_at)}
                        {isEdited && ' · 已修改'}
                      </p>
                    </div>
                  </div>
                  <VerdictChip verdict={review.verdict} />
                </div>

                <p className="mt-3 whitespace-pre-wrap text-base leading-7 text-[var(--paper-foreground)]">
                  {review.content}
                </p>
              </article>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={isDeleteConfirmOpen}
        title="删除我的评审？"
        description="删除后课题的评审计数会同步减少，之后仍可以重新提交。"
        confirmLabel="确认删除"
        cancelLabel="取消"
        onConfirm={() => void handleDeleteMyReview()}
        onCancel={() => {
          if (!isDeleting) {
            setIsDeleteConfirmOpen(false);
          }
        }}
        isPending={isDeleting}
        theme={theme}
      />
    </section>
  );
}
