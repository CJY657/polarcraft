/**
 * Meeting Rating Dialog
 * 会议成员互评弹窗
 *
 * 实到成员在这里对其他实到成员打 1–5 星并附可选短评。
 * 评价对被评人匿名呈现（只见平均星级与匿名短评），可随时修改。
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Star, X } from 'lucide-react';

import { Dialog } from '@/components/ui/dialog';
import { cn } from '@/utils/classNames';
import { formatUserIdentity, getUserIdentityInitial } from '@/lib/identity';
import {
  researchApi,
  type ProjectMeeting,
  type ProjectMember,
} from '@/lib/research.service';

const MAX_RATING_COMMENT_LENGTH = 200;
const STAR_VALUES = [1, 2, 3, 4, 5];

interface RatingDraft {
  score: number;
  comment: string;
}

interface MeetingRatingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  meeting: ProjectMeeting;
  members: ProjectMember[];
  currentUserId?: string;
}

export function MeetingRatingDialog({
  isOpen,
  onClose,
  projectId,
  meeting,
  members,
  currentUserId,
}: MeetingRatingDialogProps) {
  const [drafts, setDrafts] = useState<Record<string, RatingDraft>>({});
  const [savedRateeIds, setSavedRateeIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savingRateeId, setSavingRateeId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fellowAttendeeIds = useMemo(
    () => meeting.attendee_ids.filter((userId) => userId !== currentUserId),
    [meeting.attendee_ids, currentUserId]
  );

  const membersById = useMemo(() => {
    const map = new Map<string, ProjectMember>();
    for (const member of members) {
      map.set(member.user_id, member);
    }
    return map;
  }, [members]);

  const loadMyRatings = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const view = await researchApi.getMeetingRatings(projectId, meeting.id);
      const nextDrafts: Record<string, RatingDraft> = {};
      for (const row of view.my_given) {
        nextDrafts[row.ratee_id] = { score: row.score, comment: row.comment ?? '' };
      }
      setDrafts(nextDrafts);
      setSavedRateeIds(new Set(view.my_given.map((row) => row.ratee_id)));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : '获取互评结果失败');
    } finally {
      setIsLoading(false);
    }
  }, [projectId, meeting.id]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setSaveError(null);
    void loadMyRatings();
  }, [isOpen, loadMyRatings]);

  const isBusy = savingRateeId !== null;

  const handleClose = () => {
    if (!isBusy) {
      onClose();
    }
  };

  const updateDraft = (rateeId: string, patch: Partial<RatingDraft>) => {
    setDrafts((current) => {
      const existing = current[rateeId] ?? { score: 0, comment: '' };
      return { ...current, [rateeId]: { ...existing, ...patch } };
    });
  };

  async function handleSave(rateeId: string, name: string) {
    const draft = drafts[rateeId];
    if (!draft || draft.score < 1) {
      setSaveError(`请先为 ${name} 选择 1–5 星评分`);
      return;
    }

    setSavingRateeId(rateeId);
    setSaveError(null);

    try {
      await researchApi.upsertMyMeetingRating(projectId, meeting.id, {
        ratee_id: rateeId,
        score: draft.score,
        comment: draft.comment.trim() || null,
      });

      // 提交后重取服务端结果刷新该行（不清空其他行未保存的草稿）
      const view = await researchApi.getMeetingRatings(projectId, meeting.id);
      setSavedRateeIds(new Set(view.my_given.map((row) => row.ratee_id)));
      const savedRow = view.my_given.find((row) => row.ratee_id === rateeId);
      if (savedRow) {
        setDrafts((current) => ({
          ...current,
          [rateeId]: { score: savedRow.score, comment: savedRow.comment ?? '' },
        }));
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : '提交互评失败');
    } finally {
      setSavingRateeId(null);
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      closeOnOverlayClick={!isBusy}
      closeOnEsc={!isBusy}
      className="max-w-xl overflow-hidden rounded-xl border-[1.5px] border-[var(--research-edge)] bg-[var(--research-surface)] shadow-[var(--research-lift)]"
    >
      <div className="flex items-start justify-between gap-3 border-b border-[var(--research-line)] bg-[var(--research-head)] px-5 py-4">
        <div className="min-w-0">
          <h2
            className="truncate text-lg font-semibold text-[var(--paper-foreground)]"
            style={{ fontFamily: 'var(--font-ui-display)' }}
          >
            成员互评 · {meeting.title}
          </h2>
          <p className="research-section-note mt-0.5">
            对每位实到成员打 1–5 星并附可选短评；评价匿名呈现，可随时修改
          </p>
        </div>
        <button
          type="button"
          onClick={handleClose}
          aria-label="关闭"
          className="rounded-md p-1.5 text-[var(--glass-text-muted)] hover:bg-[var(--glass-chip)]"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="max-h-[min(72vh,36rem)] overflow-y-auto">
        {saveError && (
          <p className="research-error mx-5 mt-4 rounded-md px-4 py-2.5 text-base">{saveError}</p>
        )}

        {isLoading && (
          <div className="flex items-center justify-center gap-3 px-5 py-10 text-[var(--glass-text-muted)]" role="status">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--paper-accent)]" />
            <span className="text-base font-medium">正在加载互评数据...</span>
          </div>
        )}

        {!isLoading && loadError && (
          <div className="flex flex-col gap-3 px-5 py-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-base text-[var(--glass-text-muted)]">{loadError}</p>
            <button
              type="button"
              onClick={() => void loadMyRatings()}
              className="glass-button inline-flex shrink-0 items-center justify-center self-start rounded-md px-4 py-2 text-base font-semibold sm:self-auto"
            >
              重试
            </button>
          </div>
        )}

        {!isLoading && !loadError && fellowAttendeeIds.length === 0 && (
          <p className="px-5 py-8 text-center text-base text-[var(--glass-text-muted)]">
            本次会议没有其他实到成员，无需互评。
          </p>
        )}

        {!isLoading && !loadError && fellowAttendeeIds.length > 0 && (
          <ul className="divide-y divide-[var(--research-line)]">
            {fellowAttendeeIds.map((userId) => {
              const member = membersById.get(userId);
              const name = member ? formatUserIdentity(member, member.username || '成员') : '成员';
              const draft = drafts[userId] ?? { score: 0, comment: '' };
              const isSaving = savingRateeId === userId;

              return (
                <li key={userId} className="grid gap-2.5 px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--research-line)] bg-[var(--glass-chip)] text-sm font-semibold text-[var(--glass-text-muted)]">
                      {getUserIdentityInitial(member, '成')}
                    </span>
                    <span className="text-base font-semibold text-[var(--paper-foreground)]">{name}</span>
                    {savedRateeIds.has(userId) && (
                      <span className="research-chip rounded-md px-2 py-0.5 text-xs font-semibold">已评</span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={`给 ${name} 打分`}>
                    {STAR_VALUES.map((value) => {
                      const filled = draft.score >= value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => updateDraft(userId, { score: value })}
                          disabled={isBusy}
                          aria-label={`给 ${name} 打 ${value} 星`}
                          aria-pressed={filled}
                          className="rounded-md p-1 hover:bg-[var(--research-head)] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Star
                            className={cn(
                              'h-6 w-6',
                              filled
                                ? 'fill-current text-[var(--clay-ochre)]'
                                : 'text-[var(--glass-text-muted)]'
                            )}
                          />
                        </button>
                      );
                    })}
                    {draft.score > 0 && (
                      <span className="ml-1 text-base font-semibold tabular-nums text-[var(--paper-foreground)]">
                        {draft.score} 星
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      value={draft.comment}
                      onChange={(event) => updateDraft(userId, { comment: event.target.value })}
                      maxLength={MAX_RATING_COMMENT_LENGTH}
                      placeholder="可选短评（200 字以内，匿名呈现）"
                      aria-label={`给 ${name} 的短评`}
                      disabled={isBusy}
                      className="research-input min-w-0 flex-1 rounded-md px-3.5 py-2.5 text-base"
                    />
                    <button
                      type="button"
                      onClick={() => void handleSave(userId, name)}
                      disabled={isBusy || draft.score < 1}
                      aria-label={`保存对 ${name} 的互评`}
                      className="glass-button glass-button-primary inline-flex shrink-0 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                      {savedRateeIds.has(userId) ? '更新' : '保存'}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="border-t border-[var(--research-line)] bg-[var(--research-head)] px-5 py-3.5 text-right">
        <button
          type="button"
          onClick={handleClose}
          disabled={isBusy}
          className="glass-button rounded-md px-4 py-2 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        >
          完成
        </button>
      </div>
    </Dialog>
  );
}
