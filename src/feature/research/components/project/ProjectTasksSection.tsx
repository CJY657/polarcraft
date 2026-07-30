/**
 * Project Tasks Section
 * 课题任务分工区块
 *
 * 成员在这里拆解任务、认领负责人、跟踪完成进度（待办 / 进行中 / 已完成）。
 * 任务创建与完成会写入课题活动日志，并计入课题活跃度。
 */

import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Loader2 } from 'lucide-react';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { cn } from '@/utils/classNames';
import { formatUserIdentity, getUserIdentityInitial } from '@/lib/identity';
import {
  researchApi,
  type ProjectMember,
  type ProjectTask,
  type ProjectTaskStatus,
} from '@/lib/research.service';
import { ResearchSectionCard } from '../shared/ResearchSectionCard';

const MAX_TASK_TITLE_LENGTH = 200;

const TASK_STATUS_LABELS: Record<ProjectTaskStatus, string> = {
  todo: '待办',
  doing: '进行中',
  done: '已完成',
};

interface ProjectTasksSectionProps {
  projectId: string;
  members: ProjectMember[];
  currentUserId?: string;
  /** 组长或管理员可以删除任何任务；普通成员只能删除自己创建的 */
  canManage: boolean;
  theme?: 'light' | 'dark';
}

function getTodayDateString(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function formatDueDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const sameYear = date.getFullYear() === new Date().getFullYear();
  return new Intl.DateTimeFormat('zh-CN', {
    ...(sameYear ? {} : { year: 'numeric' }),
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function isTaskOverdue(task: ProjectTask, today: string): boolean {
  return Boolean(task.due_date) && task.status !== 'done' && (task.due_date as string) < today;
}

export function ProjectTasksSection({
  projectId,
  members,
  currentUserId,
  canManage,
  theme = 'light',
}: ProjectTasksSectionProps) {
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [newAssigneeId, setNewAssigneeId] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectTask | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const today = getTodayDateString();

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const items = await researchApi.getProjectTasks(projectId);
      setTasks(items);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : '加载任务列表失败');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  async function handleCreateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = newTitle.trim();
    if (!title) {
      setActionError('请填写任务标题');
      return;
    }

    setIsCreating(true);
    setActionError(null);

    try {
      await researchApi.createProjectTask(projectId, {
        title,
        assignee_user_id: newAssigneeId || null,
        due_date: newDueDate || null,
      });
      setNewTitle('');
      setNewAssigneeId('');
      setNewDueDate('');
      await loadTasks();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '创建任务失败');
    } finally {
      setIsCreating(false);
    }
  }

  async function handleMoveTask(task: ProjectTask, nextStatus: ProjectTaskStatus) {
    setBusyTaskId(task.id);
    setActionError(null);

    try {
      await researchApi.updateProjectTask(task.id, { status: nextStatus });
      await loadTasks();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '更新任务失败');
    } finally {
      setBusyTaskId(null);
    }
  }

  async function handleDeleteTask() {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);
    setActionError(null);

    try {
      await researchApi.deleteProjectTask(deleteTarget.id);
      setDeleteTarget(null);
      await loadTasks();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '删除任务失败');
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  }

  function canDeleteTask(task: ProjectTask): boolean {
    return canManage || task.created_by === currentUserId;
  }

  function renderMoveActions(task: ProjectTask) {
    const isBusy = busyTaskId === task.id;
    const linkClass =
      'inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold text-[var(--paper-foreground)] hover:bg-[var(--research-head)] disabled:cursor-not-allowed disabled:opacity-60';

    if (task.status === 'todo') {
      return (
        <button
          type="button"
          onClick={() => void handleMoveTask(task, 'doing')}
          disabled={isBusy}
          className={linkClass}
        >
          {isBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          开始
        </button>
      );
    }

    if (task.status === 'doing') {
      return (
        <>
          <button
            type="button"
            onClick={() => void handleMoveTask(task, 'todo')}
            disabled={isBusy}
            className={linkClass}
          >
            退回
          </button>
          <button
            type="button"
            onClick={() => void handleMoveTask(task, 'done')}
            disabled={isBusy}
            className={linkClass}
          >
            {isBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            完成
          </button>
        </>
      );
    }

    return (
      <button
        type="button"
        onClick={() => void handleMoveTask(task, 'doing')}
        disabled={isBusy}
        className={linkClass}
      >
        {isBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        重开
      </button>
    );
  }

  const statusCounts = {
    todo: tasks.filter((task) => task.status === 'todo').length,
    doing: tasks.filter((task) => task.status === 'doing').length,
    done: tasks.filter((task) => task.status === 'done').length,
  };

  return (
    <ResearchSectionCard
      title="任务分工"
      note="课题任务与认领情况"
      flush
      actions={
        tasks.length > 0 && (
          <span className="research-chip rounded-md px-3 py-1 text-sm font-semibold tabular-nums">
            {statusCounts.doing} 进行中 · {statusCounts.todo} 待办 · {statusCounts.done} 已完成
          </span>
        )
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
            <p className="text-base font-semibold text-[var(--paper-foreground)]">任务列表加载失败</p>
            <p className="mt-1 text-base text-[var(--glass-text-muted)]">{loadError}</p>
          </div>
          <button
            type="button"
            onClick={() => void loadTasks()}
            className="glass-button inline-flex shrink-0 items-center justify-center self-start rounded-md px-4 py-2 text-base font-semibold sm:self-auto"
          >
            重试
          </button>
        </div>
      )}

      {!isLoading && !loadError && tasks.length === 0 && (
        <div className="px-5 py-8 text-center">
          <p className="text-lg font-semibold text-[var(--paper-foreground)]">还没有任务</p>
          <p className="mt-2 text-base text-[var(--glass-text-muted)]">
            在下方添加第一个任务，从最小的一步开始。
          </p>
        </div>
      )}

      {!isLoading && !loadError && tasks.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[38rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-[var(--research-line)] text-sm font-semibold text-[var(--glass-text-muted)]">
                <th className="px-5 py-2.5 font-semibold">任务内容</th>
                <th className="px-3 py-2.5 font-semibold">负责人</th>
                <th className="px-3 py-2.5 font-semibold">截止日期</th>
                <th className="px-3 py-2.5 font-semibold">状态</th>
                <th className="px-5 py-2.5 text-right font-semibold">操作</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => {
                const overdue = isTaskOverdue(task, today);
                const assigneeName = task.assignee_user_id
                  ? formatUserIdentity(
                      {
                        username: task.assignee_username,
                        nickname: task.assignee_nickname,
                        real_name: task.assignee_real_name,
                        show_real_name_publicly: task.assignee_show_real_name_publicly,
                      },
                      '成员'
                    )
                  : null;

                return (
                  <tr
                    key={task.id}
                    className="border-b border-[var(--research-line)] last:border-b-0 hover:bg-[var(--research-head)]"
                  >
                    <td
                      className={cn(
                        'px-5 py-3 text-base font-medium leading-6',
                        task.status === 'done'
                          ? 'text-[var(--glass-text-muted)]'
                          : 'text-[var(--paper-foreground)]'
                      )}
                    >
                      {task.title}
                    </td>
                    <td className="px-3 py-3 text-base text-[var(--paper-foreground)]">
                      {assigneeName ? (
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--research-line)] bg-[var(--glass-chip)] text-xs font-semibold text-[var(--glass-text-muted)]">
                            {getUserIdentityInitial({ username: task.assignee_username }, '成')}
                          </span>
                          {assigneeName}
                        </span>
                      ) : (
                        <span className="text-[var(--glass-text-muted)]">待认领</span>
                      )}
                    </td>
                    <td
                      className={cn(
                        'whitespace-nowrap px-3 py-3 text-base tabular-nums',
                        overdue
                          ? 'font-semibold text-[var(--color-destructive)]'
                          : 'text-[var(--glass-text-muted)]'
                      )}
                    >
                      {task.due_date ? formatDueDate(task.due_date) : '—'}
                      {overdue && ' · 逾期'}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={cn(
                          'inline-flex whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold',
                          task.status === 'doing' && 'research-chip research-chip-accent',
                          task.status === 'done' && 'research-tint-mint border',
                          task.status === 'todo' && 'research-chip'
                        )}
                      >
                        {TASK_STATUS_LABELS[task.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {renderMoveActions(task)}
                        {canDeleteTask(task) && (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(task)}
                            className="rounded-md px-2 py-1 text-sm font-semibold text-[var(--color-destructive)] hover:bg-[var(--glass-chip)]"
                            aria-label={`删除任务 ${task.title}`}
                          >
                            删除
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <form
        onSubmit={handleCreateTask}
        className="flex flex-col gap-2.5 border-t border-[var(--research-line)] bg-[var(--research-head)] px-5 py-4 lg:flex-row lg:items-center"
      >
        <input
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          maxLength={MAX_TASK_TITLE_LENGTH}
          placeholder="任务内容，如：整理第一轮偏振观察数据"
          aria-label="任务标题"
          disabled={isCreating}
          className="research-input min-w-0 flex-1 rounded-md px-3.5 py-2.5 text-base"
        />
        <select
          value={newAssigneeId}
          onChange={(event) => setNewAssigneeId(event.target.value)}
          aria-label="负责人"
          disabled={isCreating}
          className="research-input rounded-md px-3.5 py-2.5 text-base"
        >
          <option value="">暂不指定</option>
          {members.map((member) => (
            <option key={member.user_id} value={member.user_id}>
              {formatUserIdentity(member, member.username || '成员')}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={newDueDate}
          onChange={(event) => setNewDueDate(event.target.value)}
          aria-label="截止日期"
          disabled={isCreating}
          className="research-input rounded-md px-3.5 py-2.5 text-base"
        />
        <button
          type="submit"
          disabled={isCreating}
          className="glass-button glass-button-primary inline-flex shrink-0 items-center justify-center gap-2 rounded-md px-5 py-2.5 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
          添加任务
        </button>
      </form>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="删除这个任务？"
        description={deleteTarget ? `「${deleteTarget.title}」删除后无法恢复。` : '删除后无法恢复。'}
        confirmLabel="确认删除"
        cancelLabel="取消"
        onConfirm={() => void handleDeleteTask()}
        onCancel={() => {
          if (!isDeleting) {
            setDeleteTarget(null);
          }
        }}
        isPending={isDeleting}
        theme={theme}
      />
    </ResearchSectionCard>
  );
}
