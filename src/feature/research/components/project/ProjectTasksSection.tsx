/**
 * Project Tasks Section
 * 课题任务分工区块
 *
 * 成员在这里拆解任务、认领负责人、跟踪完成进度（待办 / 进行中 / 已完成）。
 * 任务创建与完成会写入课题活动日志，并计入课题活跃度。
 */

import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  AlertCircle,
  CalendarDays,
  Check,
  CircleDashed,
  ListTodo,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
  Undo2,
} from 'lucide-react';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { cn } from '@/utils/classNames';
import { formatUserIdentity, getUserIdentityInitial } from '@/lib/identity';
import {
  researchApi,
  type ProjectMember,
  type ProjectTask,
  type ProjectTaskStatus,
} from '@/lib/research.service';

const MAX_TASK_TITLE_LENGTH = 200;

const TASK_STATUS_GROUPS: Array<{
  status: ProjectTaskStatus;
  label: string;
  hint: string;
}> = [
  { status: 'todo', label: '待办', hint: '还没有开始的任务' },
  { status: 'doing', label: '进行中', hint: '正在推进的任务' },
  { status: 'done', label: '已完成', hint: '已经交付的任务' },
];

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
    const moveButtonClass =
      'glass-button inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60';

    if (task.status === 'todo') {
      return (
        <button
          type="button"
          onClick={() => void handleMoveTask(task, 'doing')}
          disabled={isBusy}
          className={moveButtonClass}
        >
          {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5 text-[var(--paper-link)]" />}
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
            className={moveButtonClass}
          >
            <Undo2 className="h-3.5 w-3.5 text-[var(--glass-text-muted)]" />
            退回待办
          </button>
          <button
            type="button"
            onClick={() => void handleMoveTask(task, 'done')}
            disabled={isBusy}
            className="glass-button glass-button-primary inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
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
        className={moveButtonClass}
      >
        {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5 text-[var(--paper-link)]" />}
        重新打开
      </button>
    );
  }

  const doneCount = tasks.filter((task) => task.status === 'done').length;

  return (
    <section className="research-panel mb-4 rounded-[1.6rem] p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            className="text-2xl font-semibold text-[var(--paper-foreground)]"
            style={{ fontFamily: 'var(--font-ui-display)' }}
          >
            任务分工
          </h2>
          <p className="mt-1 text-base leading-6 text-[var(--glass-text-muted)]">
            把研究计划拆成可以认领的小任务，谁负责、做到哪一步一目了然。
          </p>
        </div>

        {tasks.length > 0 && (
          <span className="research-chip inline-flex items-center gap-2 self-start rounded-full px-4 py-1.5 text-sm font-semibold sm:self-auto">
            <ListTodo className="h-4 w-4 text-[var(--paper-link)]" />
            已完成 {doneCount} / {tasks.length}
          </span>
        )}
      </div>

      <form onSubmit={handleCreateTask} className="research-panel-soft mb-4 rounded-[1.35rem] p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(11rem,auto)_minmax(10rem,auto)_auto] lg:items-end">
          <label className="grid gap-1.5 text-sm font-semibold uppercase tracking-[0.08em] text-[var(--glass-text-muted)]">
            任务标题
            <input
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              maxLength={MAX_TASK_TITLE_LENGTH}
              placeholder="例如：整理第一轮偏振观察数据"
              disabled={isCreating}
              className="research-input rounded-[1rem] px-4 py-2.5 text-base normal-case tracking-normal"
            />
          </label>

          <label className="grid gap-1.5 text-sm font-semibold uppercase tracking-[0.08em] text-[var(--glass-text-muted)]">
            负责人
            <select
              value={newAssigneeId}
              onChange={(event) => setNewAssigneeId(event.target.value)}
              disabled={isCreating}
              className="research-input rounded-[1rem] px-4 py-2.5 text-base normal-case tracking-normal"
            >
              <option value="">暂不指定</option>
              {members.map((member) => (
                <option key={member.user_id} value={member.user_id}>
                  {formatUserIdentity(member, member.username || '成员')}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1.5 text-sm font-semibold uppercase tracking-[0.08em] text-[var(--glass-text-muted)]">
            截止日期（可选）
            <input
              type="date"
              value={newDueDate}
              onChange={(event) => setNewDueDate(event.target.value)}
              disabled={isCreating}
              className="research-input rounded-[1rem] px-4 py-2.5 text-base normal-case tracking-normal"
            />
          </label>

          <button
            type="submit"
            disabled={isCreating}
            className="glass-button glass-button-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            添加任务
          </button>
        </div>
      </form>

      {actionError && (
        <div className="mb-4 rounded-[1rem] bg-red-50 px-4 py-3 text-base text-red-600 dark:bg-red-900/30 dark:text-red-300">
          {actionError}
        </div>
      )}

      {isLoading && (
        <div className="grid gap-3 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="research-panel-soft h-40 animate-pulse rounded-[1.35rem]" />
          ))}
        </div>
      )}

      {!isLoading && loadError && (
        <div className="research-panel-soft rounded-[1.35rem] px-5 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 text-[#b33d3d]" />
              <div>
                <p className="text-base font-semibold text-[var(--paper-foreground)]">任务列表加载失败</p>
                <p className="mt-1 text-base text-[var(--glass-text-muted)]">{loadError}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void loadTasks()}
              className="glass-button inline-flex items-center justify-center gap-2 self-start rounded-full px-4 py-2 text-base font-medium sm:self-auto"
            >
              <RefreshCw className="h-4 w-4 text-[var(--paper-link)]" />
              重试
            </button>
          </div>
        </div>
      )}

      {!isLoading && !loadError && tasks.length === 0 && (
        <div className="research-panel-soft rounded-[1.35rem] px-5 py-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--paper-link)]/10 text-[var(--paper-link)]">
            <ListTodo className="h-5 w-5" />
          </div>
          <p className="mt-4 text-lg font-semibold text-[var(--paper-foreground)]">还没有任务</p>
          <p className="mx-auto mt-2 max-w-md text-base leading-6 text-[var(--glass-text-muted)]">
            从最小的一步开始拆解：一次观察、一张数据表、一段说明文字，都可以是一个任务。
          </p>
        </div>
      )}

      {!isLoading && !loadError && tasks.length > 0 && (
        <div className="grid items-start gap-3 lg:grid-cols-3">
          {TASK_STATUS_GROUPS.map((group) => {
            const groupTasks = tasks.filter((task) => task.status === group.status);

            return (
              <div key={group.status} className="research-panel-soft rounded-[1.35rem] p-3">
                <div className="mb-3 flex items-center justify-between gap-2 px-1">
                  <h3 className="flex items-center gap-2 text-base font-semibold text-[var(--paper-foreground)]">
                    {group.status === 'done' ? (
                      <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <CircleDashed className="h-4 w-4 text-[var(--paper-link)]" />
                    )}
                    {group.label}
                  </h3>
                  <span className="research-chip rounded-full px-2.5 py-0.5 text-sm font-semibold">
                    {groupTasks.length}
                  </span>
                </div>

                {groupTasks.length === 0 ? (
                  <p className="rounded-[1rem] px-3 py-4 text-center text-sm text-[var(--glass-text-muted)]">
                    {group.hint}
                  </p>
                ) : (
                  <ul className="grid gap-2.5">
                    {groupTasks.map((task) => {
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
                        <li
                          key={task.id}
                          className="rounded-[1.15rem] border border-[var(--glass-stroke)] bg-white/60 p-3 shadow-sm dark:bg-slate-900/40"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={cn(
                                'min-w-0 break-words text-base font-semibold leading-6',
                                task.status === 'done'
                                  ? 'text-[var(--glass-text-muted)]'
                                  : 'text-[var(--paper-foreground)]'
                              )}
                            >
                              {task.title}
                            </p>
                            {canDeleteTask(task) && (
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(task)}
                                className="glass-button shrink-0 rounded-full p-1.5 text-[#a24432]"
                                aria-label={`删除任务 ${task.title}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>

                          {(assigneeName || task.due_date) && (
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              {assigneeName && (
                                <span className="research-chip inline-flex items-center gap-1.5 rounded-full py-0.5 pl-0.5 pr-2.5 text-sm font-medium">
                                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--paper-accent)]/15 text-xs font-semibold text-[var(--paper-link)]">
                                    {getUserIdentityInitial({ username: task.assignee_username }, '成')}
                                  </span>
                                  {assigneeName}
                                </span>
                              )}
                              {task.due_date && (
                                <span
                                  className={cn(
                                    'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-medium',
                                    overdue
                                      ? 'bg-red-500/12 font-semibold text-red-600 dark:bg-red-500/20 dark:text-red-300'
                                      : 'research-chip'
                                  )}
                                >
                                  <CalendarDays className="h-3.5 w-3.5" />
                                  {formatDueDate(task.due_date)}
                                  {overdue && ' · 已逾期'}
                                </span>
                              )}
                            </div>
                          )}

                          <div className="mt-2.5 flex flex-wrap items-center gap-2">
                            {renderMoveActions(task)}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

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
    </section>
  );
}
