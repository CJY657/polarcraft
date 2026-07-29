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
  ChevronDown,
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

const VERDICT_OPTIONS: Array<{ value: ProjectReviewVerdict; label: string }> = [
  { value: 'approve', label: '建议通过' },
  { value: 'request_changes', label: '建议修改' },
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
          ? 'research-tint-mint'
          : 'research-tint-ochre text-[color-mix(in_srgb,var(--clay-ochre)_72%,var(--paper-foreground))]'
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
    <section className="research-panel mb-8 rounded-3xl p-5 sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            className="text-2xl font-semibold text-[var(--paper-foreground)]"
            style={{ fontFamily: 'var(--font-ui-display)' }}
          >
            同伴评审
          </h2>
          <p className="research-section-note mt-1">其他同学对课题的评审反馈</p>
        </div>

        {isReviewPending && (
          <div className="research-panel-soft flex min-w-[12rem] flex-col gap-2 self-start rounded-2xl px-4 py-3 sm:self-auto">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-semibold uppercase tracking-[0.1em] text-[var(--glass-text-muted)]">
                评审进度
              </span>
              <span
                className={cn(
                  'text-base font-bold',
                  quorumMet ? 'text-[color-mix(in_srgb,var(--clay-teal)_72%,var(--paper-foreground))]' : 'text-[var(--paper-foreground)]'
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
            {quorumMet && (
              <p className="text-sm leading-5 text-[color-mix(in_srgb,var(--clay-teal)_72%,var(--paper-foreground))]">
                已达标，组长可推进到「已展示」
              </p>
            )}
          </div>
        )}
      </div>

      {reviewCriteria?.trim() && (
        <details className="group research-panel-soft mb-4 rounded-2xl px-4 py-3">
          <summary className="flex cursor-pointer select-none list-none items-center gap-2 text-lg font-semibold text-[var(--paper-foreground)] [&::-webkit-details-marker]:hidden">
            <ClipboardCheck className="h-5 w-5 shrink-0 text-[var(--paper-link)]" />
            评审标准
            <ChevronDown className="ml-auto h-4 w-4 shrink-0 text-[var(--glass-text-muted)] transition-transform group-open:rotate-180" />
          </summary>
          <p className="mt-2 whitespace-pre-wrap text-base leading-7 text-[var(--glass-text-muted)]">
            {reviewCriteria.trim()}
          </p>
        </details>
      )}

      {usePublicEndpoint && isReviewPending && (
        <div className="research-panel-soft mb-4 flex items-center gap-3 rounded-2xl px-4 py-3">
          <AlertCircle className="h-4 w-4 shrink-0 text-[var(--paper-link)]" />
          <p className="text-base text-[var(--glass-text-muted)]">登录后即可提交同伴评审。</p>
        </div>
      )}

      {!usePublicEndpoint && isActiveMember && isReviewPending && (
        <div className="research-panel-soft mb-4 flex items-center gap-3 rounded-2xl px-4 py-3">
          <AlertCircle className="h-4 w-4 shrink-0 text-[var(--paper-link)]" />
          <p className="text-base text-[var(--glass-text-muted)]">
            同伴评审由课题组外的同学提交，成员在这里查看结果。
          </p>
        </div>
      )}

      {canSubmitReview && (
        <div className="research-panel-soft mb-5 rounded-2xl p-4">
          <h3 className="text-lg font-semibold text-[var(--paper-foreground)]">
            {myReview ? '修改我的评审' : '提交我的评审'}
          </h3>

          <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="评审结论">
            {VERDICT_OPTIONS.map((option) => {
              const isSelected = verdict === option.value;
              return (
                <label
                  key={option.value}
                  className={cn(
                    'inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-base font-semibold transition',
                    isSelected
                      ? 'border-[var(--paper-accent)] bg-[var(--paper-accent)]/10 text-[var(--paper-foreground)]'
                      : 'border-[var(--glass-stroke)] bg-[var(--glass-chip)] text-[var(--glass-text-muted)] hover:border-[var(--paper-accent)]/45'
                  )}
                >
                  <input
                    type="radio"
                    name="peer-review-verdict"
                    value={option.value}
                    checked={isSelected}
                    onChange={() => setVerdict(option.value)}
                    className="h-4 w-4 shrink-0 accent-[var(--paper-accent)]"
                  />
                  {option.label}
                </label>
              );
            })}
          </div>

          <label className="mt-3 grid gap-2 text-base font-medium text-[var(--paper-foreground)]">
            评审意见
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={4}
              maxLength={MAX_REVIEW_CONTENT_LENGTH}
              placeholder="写下课题做得好的地方、不足之处和具体的改进建议…"
              className="research-input resize-y rounded-xl px-4 py-3 text-base leading-7"
            />
          </label>

          {formError && (
            <div className="research-error mt-3 rounded-2xl px-4 py-3 text-base">
              {formError}
            </div>
          )}

          <div className="mt-4 flex flex-wrap justify-end gap-2">
            {myReview && (
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(true)}
                disabled={isSubmitting || isDeleting}
                className="glass-button inline-flex items-center gap-2 rounded-full px-4 py-2 text-base font-medium text-[var(--color-destructive)] disabled:cursor-not-allowed disabled:opacity-60"
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
      )}

      {isLoading && (
        <div className="grid gap-3">
          {[0, 1].map((item) => (
            <div key={item} className="research-panel-soft h-24 animate-pulse rounded-2xl" />
          ))}
        </div>
      )}

      {!isLoading && loadError && (
        <div className="research-panel-soft rounded-2xl px-5 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 text-[var(--color-destructive)]" />
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
        <div className="research-panel-soft rounded-2xl px-5 py-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--paper-link)]/10 text-[var(--paper-link)]">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <p className="mt-4 text-lg font-semibold text-[var(--paper-foreground)]">还没有收到同伴评审</p>
          {canSubmitReview && (
            <p className="mt-2 text-base text-[var(--glass-text-muted)]">你可以成为第一位评审人。</p>
          )}
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
              <article key={review.id} className="research-panel-soft rounded-2xl p-4">
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
