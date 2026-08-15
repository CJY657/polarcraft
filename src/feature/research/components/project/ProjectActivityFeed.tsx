/**
 * Project Activity Feed
 * 课题最近动态
 *
 * 在成员栏下方展示活动日志的最近若干条记录（阶段变更、讨论、任务、评审等），
 * 让成员回到课题页时能快速看到「组里最近发生了什么」。
 */

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

import { formatUserIdentity, getUserIdentityInitial } from '@/lib/identity';
import { researchApi, type ProjectActivityItem } from '@/lib/research.service';
import { getProjectStatusMeta } from '../../projectLifecycle';
import { ResearchSectionCard } from '../shared/ResearchSectionCard';

const DEFAULT_ACTIVITY_LIMIT = 15;

interface ProjectActivityFeedProps {
  projectId: string;
  limit?: number;
}

export function getActivityLabel(item: ProjectActivityItem): string {
  const changes = (item.changes ?? {}) as Record<string, unknown>;

  switch (item.action) {
    case 'project_status_changed': {
      const from = getProjectStatusMeta(String(changes.from_status ?? '')).label;
      const to = getProjectStatusMeta(String(changes.to_status ?? '')).label;
      return `把课题阶段从「${from}」推进到「${to}」`;
    }
    case 'add_comment':
      return changes.parent_comment_id ? '回复了讨论留言' : '发布了讨论留言';
    case 'task_created':
      return typeof changes.title === 'string' && changes.title
        ? `创建了任务「${changes.title}」`
        : '创建了任务';
    case 'task_completed':
      return typeof changes.title === 'string' && changes.title
        ? `完成了任务「${changes.title}」`
        : '完成了任务';
    case 'review_submitted':
      return '提交了同伴评审';
    case 'meeting_scheduled':
      return typeof changes.title === 'string' && changes.title
        ? `安排了会议「${changes.title}」`
        : '安排了会议';
    case 'meeting_minutes_archived':
      return typeof changes.title === 'string' && changes.title
        ? `归档了会议纪要「${changes.title}」`
        : '归档了会议纪要';
    case 'project_leadership_transferred':
      return '接受转让并成为新组长';
    case 'create_node':
      return '添加了画布节点';
    case 'delete_node':
      return '移除了画布节点';
    case 'create_edge':
      return '添加了画布关联';
    default:
      return '更新了课题内容';
  }
}

function formatActivityTime(value: string): string {
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) {
    return '';
  }

  const diffMinutes = Math.floor((Date.now() - time) / 60_000);
  if (diffMinutes < 1) {
    return '刚刚';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} 分钟前`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} 小时前`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays} 天前`;
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

export function ProjectActivityFeed({ projectId, limit = DEFAULT_ACTIVITY_LIMIT }: ProjectActivityFeedProps) {
  const [activities, setActivities] = useState<ProjectActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadActivities = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const items = await researchApi.getProjectActivity(projectId, limit);
      setActivities(items);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : '加载最近动态失败');
    } finally {
      setIsLoading(false);
    }
  }, [projectId, limit]);

  useEffect(() => {
    void loadActivities();
  }, [loadActivities]);

  return (
    <ResearchSectionCard
      title="最近动态"
      actions={
        <button
          type="button"
          onClick={() => void loadActivities()}
          disabled={isLoading}
          className="glass-button rounded-md p-1.5 text-[var(--glass-text-muted)] disabled:cursor-not-allowed disabled:opacity-60"
          aria-label="刷新最近动态"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      }
    >
      {isLoading && (
        <div className="grid gap-2">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-12 animate-pulse rounded-lg bg-[var(--research-head)]" />
          ))}
        </div>
      )}

      {!isLoading && loadError && (
        <p className="research-panel-soft rounded-md px-3 py-2.5 text-base text-[var(--glass-text-muted)]">
          {loadError}
        </p>
      )}

      {!isLoading && !loadError && activities.length === 0 && (
        <p className="research-panel-soft rounded-md px-3 py-3 text-base leading-6 text-[var(--glass-text-muted)]">
          还没有动态记录。
        </p>
      )}

      {!isLoading && !loadError && activities.length > 0 && (
        <ol className="grid gap-0.5">
          {activities.map((item) => {
            const actorName = formatUserIdentity(item, '成员');

            return (
              <li
                key={item.id}
                className="flex items-start gap-2.5 rounded-lg px-2 py-2 hover:bg-[var(--research-head)]"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--research-line)] bg-[var(--glass-chip)] text-sm font-semibold text-[var(--glass-text-muted)]">
                  {getUserIdentityInitial(item, '员')}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="break-words text-base leading-6 text-[var(--paper-foreground)]">
                    <span className="font-semibold">{actorName}</span>{' '}
                    <span className="text-[var(--glass-text-muted)]">{getActivityLabel(item)}</span>
                  </p>
                  <p className="mt-0.5 text-sm text-[var(--glass-text-muted)]">
                    {formatActivityTime(item.created_at)}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </ResearchSectionCard>
  );
}
