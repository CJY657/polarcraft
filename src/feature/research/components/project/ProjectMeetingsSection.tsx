/**
 * Project Meetings Section
 * 课题例会区块
 *
 * 组长在这里排期例会、归档 AI 纪要；全体组员查看会议安排、归档纪要、
 * 自己的 AI 表现分与互评聚合，并通过表现榜了解组内头部排名与自己的位次。
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarPlus, ChevronDown, Download, Loader2, Star, Trophy } from 'lucide-react';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { cn } from '@/utils/classNames';
import { formatDateTime } from '@/lib/datetime.util';
import { formatUserIdentity, getUserIdentityInitial } from '@/lib/identity';
import {
  researchApi,
  type MeetingRatingsView,
  type ProjectLeaderboard,
  type ProjectLeaderboardEntry,
  type ProjectMeeting,
  type ProjectMeetingStatus,
  type ProjectMember,
} from '@/lib/research.service';
import { ResearchSectionCard } from '../shared/ResearchSectionCard';
import { MeetingScheduleDialog } from './MeetingScheduleDialog';
import { MeetingMinutesDialog } from './MeetingMinutesDialog';
import { MeetingRatingDialog } from './MeetingRatingDialog';

const DAY_IN_MS = 86_400_000;

const MEETING_STATUS_LABELS: Record<ProjectMeetingStatus, string> = {
  scheduled: '待举行',
  completed: '已完成',
  cancelled: '已取消',
};

interface ProjectMeetingsSectionProps {
  projectId: string;
  members: ProjectMember[];
  currentUserId?: string;
  /** 组长或管理员可以排期、编辑、取消会议与归档纪要 */
  canManage: boolean;
  theme?: 'light' | 'dark';
}

function MeetingStatusChip({ status }: { status: ProjectMeetingStatus }) {
  return (
    <span
      className={cn(
        'inline-flex whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold',
        status === 'scheduled' && 'research-chip research-chip-accent',
        status === 'completed' && 'research-tint-mint border',
        status === 'cancelled' && 'research-chip'
      )}
    >
      {MEETING_STATUS_LABELS[status]}
    </span>
  );
}

function LeaderboardRow({
  entry,
  highlight,
}: {
  entry: ProjectLeaderboardEntry;
  highlight: boolean;
}) {
  const name = formatUserIdentity(entry, entry.username || '成员');

  return (
    <li className="flex items-center gap-3">
      <span className="w-14 shrink-0 text-base font-bold tabular-nums text-[var(--paper-foreground)]">
        第 {entry.rank} 名
      </span>
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold',
          highlight
            ? 'research-tint-ochre text-[var(--clay-ochre)]'
            : 'border-[var(--research-line)] bg-[var(--glass-chip)] text-[var(--glass-text-muted)]'
        )}
      >
        {getUserIdentityInitial(entry, '成')}
      </span>
      <span className="min-w-0 flex-1 truncate text-base font-semibold text-[var(--paper-foreground)]">
        {name}
      </span>
      <span className="shrink-0 text-base font-bold tabular-nums text-[var(--paper-foreground)]">
        {`综合 ${entry.composite.toFixed(1)} / 5`}
      </span>
    </li>
  );
}

export function ProjectMeetingsSection({
  projectId,
  members,
  currentUserId,
  canManage,
  theme = 'light',
}: ProjectMeetingsSectionProps) {
  const [meetings, setMeetings] = useState<ProjectMeeting[]>([]);
  const [leaderboard, setLeaderboard] = useState<ProjectLeaderboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isFullBoardOpen, setIsFullBoardOpen] = useState(false);

  // 展开的会议详情（单会议端点返回纪要全文与原始记录）
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ProjectMeeting | null>(null);
  const [ratings, setRatings] = useState<MeetingRatingsView | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailVersion, setDetailVersion] = useState(0);

  // 弹窗状态
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<ProjectMeeting | null>(null);
  const [minutesMeeting, setMinutesMeeting] = useState<ProjectMeeting | null>(null);
  const [ratingMeeting, setRatingMeeting] = useState<ProjectMeeting | null>(null);
  const [cancelTarget, setCancelTarget] = useState<ProjectMeeting | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const membersById = useMemo(() => {
    const map = new Map<string, ProjectMember>();
    for (const member of members) {
      map.set(member.user_id, member);
    }
    return map;
  }, [members]);

  const getMemberName = useCallback(
    (userId: string): string => {
      const member = membersById.get(userId);
      return member ? formatUserIdentity(member, member.username || '成员') : '成员';
    },
    [membersById]
  );

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const [meetingList, board] = await Promise.all([
        researchApi.getProjectMeetings(projectId),
        // 表现榜失败不阻塞会议列表，降级为「暂无表现数据」
        researchApi.getProjectLeaderboard(projectId).catch(() => null),
      ]);
      setMeetings(meetingList);
      setLeaderboard(board);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : '加载会议列表失败');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  // 会议列表变化（含各类变更后的重取）时同步刷新展开的详情
  useEffect(() => {
    if (!expandedId) {
      setDetail(null);
      setRatings(null);
      setDetailError(null);
      return;
    }

    const meeting = meetings.find((item) => item.id === expandedId);
    if (!meeting) {
      setDetail(null);
      setRatings(null);
      return;
    }

    let cancelled = false;
    setIsDetailLoading(true);
    setDetailError(null);

    void (async () => {
      try {
        const [detailData, ratingsData] = await Promise.all([
          researchApi.getProjectMeeting(projectId, meeting.id),
          meeting.status === 'completed'
            ? researchApi.getMeetingRatings(projectId, meeting.id).catch(() => null)
            : Promise.resolve(null),
        ]);
        if (cancelled) return;
        setDetail(detailData);
        setRatings(ratingsData);
      } catch (err) {
        if (cancelled) return;
        setDetailError(err instanceof Error ? err.message : '获取会议详情失败');
      } finally {
        if (!cancelled) {
          setIsDetailLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [expandedId, meetings, projectId, detailVersion]);

  // 时间相关派生值每次渲染直接计算（组内会议量级很小，无需缓存）
  const nowMs = Date.now();
  const upcomingMeeting =
    meetings
      .filter(
        (meeting) =>
          meeting.status === 'scheduled' && new Date(meeting.scheduled_at).getTime() > nowMs
      )
      .sort(
        (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
      )[0] ?? null;

  const listMeetings = meetings
    .filter((meeting) => meeting.id !== upcomingMeeting?.id)
    .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());

  const pastMeetingTimes = meetings
    .filter((meeting) => meeting.status !== 'cancelled')
    .map((meeting) => new Date(meeting.scheduled_at).getTime())
    .filter((time) => Number.isFinite(time) && time <= nowMs);
  const daysSinceLastMeeting =
    pastMeetingTimes.length === 0
      ? null
      : Math.max(0, Math.floor((nowMs - Math.max(...pastMeetingTimes)) / DAY_IN_MS));

  const showSchedulePrompt = canManage && !isLoading && !loadError && !upcomingMeeting;

  const handleMutated = useCallback(async () => {
    await load();
  }, [load]);

  const openCreateDialog = () => {
    setEditingMeeting(null);
    setIsScheduleDialogOpen(true);
  };

  const openEditDialog = (meeting: ProjectMeeting) => {
    setEditingMeeting(meeting);
    setIsScheduleDialogOpen(true);
  };

  const toggleExpanded = (meetingId: string) => {
    setExpandedId((current) => (current === meetingId ? null : meetingId));
  };

  async function handleCancelMeeting() {
    if (!cancelTarget) {
      return;
    }

    setIsCancelling(true);
    setActionError(null);

    try {
      await researchApi.updateProjectMeeting(projectId, cancelTarget.id, { status: 'cancelled' });
      setCancelTarget(null);
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '取消会议失败');
      setCancelTarget(null);
    } finally {
      setIsCancelling(false);
    }
  }

  function canRateMeeting(meeting: ProjectMeeting): boolean {
    return (
      meeting.status === 'completed'
      && Boolean(currentUserId)
      && meeting.attendee_ids.includes(currentUserId as string)
    );
  }

  function formatMeetingMeta(meeting: ProjectMeeting): string {
    const parts = [formatDateTime(meeting.scheduled_at)];
    if (meeting.duration_minutes) {
      parts.push(`${meeting.duration_minutes} 分钟`);
    }
    if (meeting.location) {
      parts.push(meeting.location);
    }
    return parts.join(' · ');
  }

  function renderMeetingActions(meeting: ProjectMeeting) {
    const linkClass =
      'inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold text-[var(--paper-foreground)] hover:bg-[var(--research-head)]';

    return (
      <>
        {canManage && meeting.status === 'scheduled' && (
          <>
            <button type="button" onClick={() => openEditDialog(meeting)} className={linkClass}>
              编辑
            </button>
            <button
              type="button"
              onClick={() => setCancelTarget(meeting)}
              className={cn(linkClass, 'text-[var(--color-destructive)]')}
            >
              取消
            </button>
            <button
              type="button"
              onClick={() => setMinutesMeeting(meeting)}
              className={cn(linkClass, 'text-[var(--clay-pink)]')}
            >
              整理纪要
            </button>
          </>
        )}
        {canRateMeeting(meeting) && (
          <button
            type="button"
            onClick={() => setRatingMeeting(meeting)}
            className={cn(linkClass, 'text-[var(--clay-pink)]')}
          >
            去互评
          </button>
        )}
      </>
    );
  }

  function renderMeetingDetail(meeting: ProjectMeeting) {
    return (
      <div className="border-t border-[var(--research-line)] px-5 py-4">
        {isDetailLoading && (
          <div className="flex items-center gap-3 text-[var(--glass-text-muted)]" role="status">
            <Loader2 className="h-4 w-4 animate-spin text-[var(--paper-accent)]" />
            <span className="text-base font-medium">正在加载会议详情...</span>
          </div>
        )}

        {!isDetailLoading && detailError && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-base text-[var(--glass-text-muted)]">{detailError}</p>
            <button
              type="button"
              onClick={() => setDetailVersion((version) => version + 1)}
              className="glass-button inline-flex shrink-0 items-center justify-center self-start rounded-md px-4 py-2 text-base font-semibold sm:self-auto"
            >
              重试
            </button>
          </div>
        )}

        {!isDetailLoading && !detailError && detail && detail.id === meeting.id && (
          <div className="grid gap-4">
            {detail.agenda && (
              <div>
                <h4 className="text-sm font-semibold text-[var(--glass-text-muted)]">议程</h4>
                <p className="mt-1 whitespace-pre-wrap text-base leading-7 text-[var(--paper-foreground)]">
                  {detail.agenda}
                </p>
              </div>
            )}

            {detail.minutes?.content ? (
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-semibold text-[var(--glass-text-muted)]">会议纪要</h4>
                  <span className="research-chip rounded-md px-2 py-0.5 text-xs font-semibold">
                    {detail.minutes.generated_by_ai ? 'AI 生成' : '手动撰写'}
                  </span>
                  <span className="text-xs text-[var(--glass-text-muted)]">
                    归档于 {formatDateTime(detail.minutes.archived_at)}
                  </span>
                </div>
                <p className="mt-1.5 whitespace-pre-wrap rounded-md border border-[var(--research-line)] bg-[var(--research-head)] px-4 py-3 text-base leading-7 text-[var(--paper-foreground)]">
                  {detail.minutes.content}
                </p>
              </div>
            ) : (
              meeting.status !== 'cancelled' && (
                <p className="text-base text-[var(--glass-text-muted)]">会议纪要尚未归档。</p>
              )
            )}

            {(detail.raw_notes || detail.raw_file) && (
              <div>
                <h4 className="text-sm font-semibold text-[var(--glass-text-muted)]">原始记录</h4>
                {detail.raw_notes && (
                  <p className="mt-1.5 max-h-56 overflow-y-auto whitespace-pre-wrap rounded-md border border-[var(--research-line)] px-4 py-3 text-base leading-7 text-[var(--paper-foreground)]">
                    {detail.raw_notes}
                  </p>
                )}
                {detail.raw_file && (
                  <a
                    href={detail.raw_file.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 text-base font-semibold text-[var(--paper-foreground)] underline decoration-[var(--paper-accent)] underline-offset-4"
                  >
                    <Download className="h-4 w-4" />
                    {detail.raw_file.original_name ?? '会议记录文件'}
                  </a>
                )}
              </div>
            )}

            {detail.ai_scores && detail.ai_scores.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-[var(--glass-text-muted)]">AI 表现分</h4>
                <ul className="mt-1.5 grid gap-1.5">
                  {detail.ai_scores.map((score) => (
                    <li
                      key={score.user_id}
                      className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-base text-[var(--paper-foreground)]"
                    >
                      <span className="font-semibold">
                        {getMemberName(score.user_id)}
                        {score.user_id === currentUserId ? '（我）' : ''}
                      </span>
                      <span className="font-bold tabular-nums text-[var(--clay-pink)]">
                        {score.score} 分
                      </span>
                      {score.comment && (
                        <span className="text-[var(--glass-text-muted)]">{score.comment}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {ratings && ratings.aggregates.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-[var(--glass-text-muted)]">组内互评</h4>
                <ul className="mt-1.5 grid gap-1.5">
                  {ratings.aggregates.map((aggregate) => (
                    <li
                      key={aggregate.ratee_id}
                      className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-base text-[var(--paper-foreground)]"
                    >
                      <span className="font-semibold">{getMemberName(aggregate.ratee_id)}</span>
                      <span className="inline-flex items-center gap-1 font-bold tabular-nums">
                        <Star className="h-4 w-4 fill-current text-[var(--clay-ochre)]" />
                        {aggregate.avg.toFixed(1)}
                      </span>
                      <span className="text-[var(--glass-text-muted)]">{aggregate.count} 人评分</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {ratings && ratings.my_received_comments.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-[var(--glass-text-muted)]">
                  我收到的匿名短评
                </h4>
                <ul className="mt-1.5 grid gap-1.5">
                  {ratings.my_received_comments.map((comment, index) => (
                    <li
                      key={index}
                      className="rounded-md bg-[var(--glass-chip)] px-3.5 py-2 text-base leading-6 text-[var(--paper-foreground)]"
                    >
                      “{comment}”
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  const topEntries = leaderboard?.top ?? [];
  const myStanding = leaderboard?.me ?? null;
  const fullBoard = leaderboard?.all ?? null;

  return (
    <ResearchSectionCard
      title="会议"
      note="例会排期、AI 纪要归档与成员表现"
      flush
      actions={
        canManage && !isLoading && !showSchedulePrompt ? (
          <button
            type="button"
            onClick={openCreateDialog}
            className="glass-button inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-base font-semibold"
          >
            <CalendarPlus className="h-4 w-4" />
            安排会议
          </button>
        ) : undefined
      }
    >
      {actionError && (
        <div className="research-error mx-5 mt-4 rounded-md px-4 py-2.5 text-base">{actionError}</div>
      )}

      {isLoading && (
        <div className="grid gap-2 p-5">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-11 animate-pulse rounded-lg bg-[var(--research-head)]" />
          ))}
        </div>
      )}

      {!isLoading && loadError && (
        <div className="flex flex-col gap-3 px-5 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-base font-semibold text-[var(--paper-foreground)]">会议列表加载失败</p>
            <p className="mt-1 text-base text-[var(--glass-text-muted)]">{loadError}</p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="glass-button inline-flex shrink-0 items-center justify-center self-start rounded-md px-4 py-2 text-base font-semibold sm:self-auto"
          >
            重试
          </button>
        </div>
      )}

      {!isLoading && !loadError && (
        <>
          {/* 表现榜：Top 3 公示 + 我的名次 */}
          <div className="border-b border-[var(--research-line)] px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="inline-flex items-center gap-1.5 text-base font-semibold text-[var(--paper-foreground)]">
                <Trophy className="h-4 w-4 text-[var(--clay-ochre)]" />
                表现榜
              </h3>
              {canManage && fullBoard && fullBoard.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsFullBoardOpen((open) => !open)}
                  aria-expanded={isFullBoardOpen}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold text-[var(--paper-foreground)] hover:bg-[var(--research-head)]"
                >
                  {isFullBoardOpen ? '收起完整榜单' : '展开完整榜单'}
                  <ChevronDown
                    className={cn('h-3.5 w-3.5 transition-transform', isFullBoardOpen && 'rotate-180')}
                  />
                </button>
              )}
            </div>

            {topEntries.length === 0 ? (
              <p className="mt-2 text-base text-[var(--glass-text-muted)]">
                暂无表现数据：归档会议纪要并完成互评后，这里会出现组内表现排名。
              </p>
            ) : (
              <>
                <ol className="mt-3 grid gap-2.5">
                  {topEntries.map((entry) => (
                    <LeaderboardRow key={entry.user_id} entry={entry} highlight />
                  ))}
                </ol>

                {myStanding && (
                  <p className="mt-3 border-t border-dashed border-[var(--research-line)] pt-3 text-base font-semibold text-[var(--paper-foreground)]">
                    {`我的名次：第 ${myStanding.rank} 名 · 综合 ${myStanding.composite.toFixed(1)} / 5`}
                  </p>
                )}

                {isFullBoardOpen && fullBoard && fullBoard.length > 0 && (
                  <div className="mt-3 rounded-[0.625rem] border border-[var(--research-line)] px-4 py-3">
                    <p className="text-sm font-semibold text-[var(--glass-text-muted)]">完整榜单</p>
                    <ol className="mt-2 grid gap-2">
                      {fullBoard.map((entry) => (
                        <LeaderboardRow key={entry.user_id} entry={entry} highlight={entry.rank <= 3} />
                      ))}
                    </ol>
                  </div>
                )}
              </>
            )}
          </div>

          {/* 组长督促提示：没有已排期的未来会议 */}
          {showSchedulePrompt && (
            <div className="research-tint-ochre mx-5 mt-4 flex flex-col gap-3 rounded-[0.625rem] border-[1.5px] px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-base font-semibold text-[var(--paper-foreground)]">
                {daysSinceLastMeeting === null
                  ? '尚未安排第一次讨论'
                  : `距上次会议已 ${daysSinceLastMeeting} 天，尚未安排下次讨论`}
              </p>
              <button
                type="button"
                onClick={openCreateDialog}
                className="glass-button glass-button-primary inline-flex shrink-0 items-center gap-1.5 self-start rounded-md px-4 py-2 text-base font-semibold text-white sm:self-auto"
              >
                <CalendarPlus className="h-4 w-4" />
                安排会议
              </button>
            </div>
          )}

          {/* 下次会议高亮卡 */}
          {upcomingMeeting && (
            <div className="research-tint-peach mx-5 mt-4 rounded-[0.625rem] border-[1.5px] px-5 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="research-kicker">下次会议</span>
                <MeetingStatusChip status={upcomingMeeting.status} />
              </div>
              <p className="mt-2 text-lg font-bold leading-7 text-[var(--paper-foreground)]">
                {upcomingMeeting.title}
              </p>
              <p className="mt-1 text-base tabular-nums text-[var(--paper-foreground)]">
                {formatMeetingMeta(upcomingMeeting)}
              </p>
              {upcomingMeeting.agenda && (
                <p className="mt-2 whitespace-pre-wrap text-base leading-7 text-[var(--glass-text-muted)]">
                  {upcomingMeeting.agenda}
                </p>
              )}
              {canManage && (
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  {renderMeetingActions(upcomingMeeting)}
                </div>
              )}
            </div>
          )}

          {/* 会议列表 */}
          {meetings.length === 0 && (
            <div className="px-5 py-8 text-center">
              <p className="text-lg font-semibold text-[var(--paper-foreground)]">还没有会议</p>
              <p className="mt-2 text-base text-[var(--glass-text-muted)]">
                {canManage
                  ? '安排第一次例会，让讨论定期发生。'
                  : '等组长安排第一次例会后，这里会显示会议安排与纪要。'}
              </p>
            </div>
          )}
          {listMeetings.length > 0 && (
            <ul className="mt-4 divide-y divide-[var(--research-line)] border-t border-[var(--research-line)]">
              {listMeetings.map((meeting) => {
                const isExpanded = expandedId === meeting.id;

                return (
                  <li key={meeting.id}>
                    <div className="flex flex-col gap-2 px-5 py-3.5 hover:bg-[var(--research-head)] sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <MeetingStatusChip status={meeting.status} />
                          <span
                            className={cn(
                              'text-base font-semibold',
                              meeting.status === 'cancelled'
                                ? 'text-[var(--glass-text-muted)] line-through'
                                : 'text-[var(--paper-foreground)]'
                            )}
                          >
                            {meeting.title}
                          </span>
                        </div>
                        <p className="mt-1 text-sm tabular-nums text-[var(--glass-text-muted)]">
                          {formatMeetingMeta(meeting)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {renderMeetingActions(meeting)}
                        <button
                          type="button"
                          onClick={() => toggleExpanded(meeting.id)}
                          aria-expanded={isExpanded}
                          aria-label={`会议详情 ${meeting.title}`}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold text-[var(--paper-foreground)] hover:bg-[var(--glass-chip)]"
                        >
                          详情
                          <ChevronDown
                            className={cn('h-3.5 w-3.5 transition-transform', isExpanded && 'rotate-180')}
                          />
                        </button>
                      </div>
                    </div>
                    {isExpanded && renderMeetingDetail(meeting)}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      <MeetingScheduleDialog
        isOpen={isScheduleDialogOpen}
        onClose={() => {
          setIsScheduleDialogOpen(false);
          setEditingMeeting(null);
        }}
        projectId={projectId}
        meeting={editingMeeting}
        onSuccess={handleMutated}
      />

      {minutesMeeting && (
        <MeetingMinutesDialog
          isOpen
          onClose={() => setMinutesMeeting(null)}
          projectId={projectId}
          meeting={minutesMeeting}
          members={members}
          onSuccess={handleMutated}
        />
      )}

      {ratingMeeting && (
        <MeetingRatingDialog
          isOpen
          onClose={() => {
            setRatingMeeting(null);
            // 互评提交后刷新聚合与表现榜
            void load();
          }}
          projectId={projectId}
          meeting={ratingMeeting}
          members={members}
          currentUserId={currentUserId}
        />
      )}

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="取消这场会议？"
        description={
          cancelTarget
            ? `「${cancelTarget.title}」取消后会保留记录并通知全体组员，无法恢复为待举行。`
            : undefined
        }
        confirmLabel="确认取消会议"
        cancelLabel="返回"
        onConfirm={() => void handleCancelMeeting()}
        onCancel={() => {
          if (!isCancelling) {
            setCancelTarget(null);
          }
        }}
        isPending={isCancelling}
        theme={theme}
      />
    </ResearchSectionCard>
  );
}
