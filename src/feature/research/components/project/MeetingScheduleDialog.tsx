/**
 * Meeting Schedule Dialog
 * 会议排期弹窗
 *
 * 组长（或管理员）在这里创建或编辑例会：主题、时间、时长、地点/链接与议程。
 * 创建与修改会由服务端通知全体组员。
 */

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Loader2, X } from 'lucide-react';

import { Dialog } from '@/components/ui/dialog';
import { researchApi, type ProjectMeeting } from '@/lib/research.service';

const MAX_MEETING_TITLE_LENGTH = 100;
const MAX_MEETING_LOCATION_LENGTH = 200;
const MAX_MEETING_AGENDA_LENGTH = 2000;
const MIN_MEETING_DURATION_MINUTES = 5;
const MAX_MEETING_DURATION_MINUTES = 600;

interface MeetingScheduleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  /** 传入会议时为编辑模式，否则为创建模式 */
  meeting?: ProjectMeeting | null;
  /** 成功后由父组件重新拉取会议列表 */
  onSuccess: () => Promise<void> | void;
}

/** ISO 时间转 datetime-local 输入值（本地时区，精确到分钟） */
function toDatetimeLocalValue(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export function MeetingScheduleDialog({
  isOpen,
  onClose,
  projectId,
  meeting = null,
  onSuccess,
}: MeetingScheduleDialogProps) {
  const isEditMode = Boolean(meeting);

  const [title, setTitle] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [location, setLocation] = useState('');
  const [agenda, setAgenda] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setTitle(meeting?.title ?? '');
    setScheduledAt(meeting ? toDatetimeLocalValue(meeting.scheduled_at) : '');
    setDurationMinutes(meeting?.duration_minutes ? String(meeting.duration_minutes) : '');
    setLocation(meeting?.location ?? '');
    setAgenda(meeting?.agenda ?? '');
    setError(null);
  }, [isOpen, meeting]);

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('请填写会议主题');
      return;
    }
    if (trimmedTitle.length > MAX_MEETING_TITLE_LENGTH) {
      setError(`会议主题不能超过 ${MAX_MEETING_TITLE_LENGTH} 字`);
      return;
    }
    if (!scheduledAt) {
      setError('请选择会议开始时间');
      return;
    }
    const scheduledDate = new Date(scheduledAt);
    if (Number.isNaN(scheduledDate.getTime())) {
      setError('会议开始时间格式不正确');
      return;
    }

    let duration: number | null = null;
    if (durationMinutes.trim()) {
      duration = Number(durationMinutes);
      if (
        !Number.isInteger(duration)
        || duration < MIN_MEETING_DURATION_MINUTES
        || duration > MAX_MEETING_DURATION_MINUTES
      ) {
        setError(`时长需为 ${MIN_MEETING_DURATION_MINUTES}–${MAX_MEETING_DURATION_MINUTES} 的整数分钟`);
        return;
      }
    }

    const trimmedLocation = location.trim();
    if (trimmedLocation.length > MAX_MEETING_LOCATION_LENGTH) {
      setError(`地点或链接不能超过 ${MAX_MEETING_LOCATION_LENGTH} 字`);
      return;
    }

    const trimmedAgenda = agenda.trim();
    if (trimmedAgenda.length > MAX_MEETING_AGENDA_LENGTH) {
      setError(`议程不能超过 ${MAX_MEETING_AGENDA_LENGTH} 字`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        title: trimmedTitle,
        scheduled_at: scheduledDate.toISOString(),
        duration_minutes: duration,
        location: trimmedLocation || null,
        agenda: trimmedAgenda || null,
      };

      if (meeting) {
        await researchApi.updateProjectMeeting(projectId, meeting.id, payload);
      } else {
        await researchApi.createProjectMeeting(projectId, payload);
      }

      await onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : isEditMode ? '更新会议失败' : '创建会议失败');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      closeOnOverlayClick={!isSubmitting}
      closeOnEsc={!isSubmitting}
      className="max-w-lg overflow-hidden rounded-xl border-[1.5px] border-[var(--research-edge)] bg-[var(--research-surface)] shadow-[var(--research-lift)]"
    >
      <div className="flex items-start justify-between gap-3 border-b border-[var(--research-line)] bg-[var(--research-head)] px-5 py-4">
        <div>
          <h2
            className="text-lg font-semibold text-[var(--paper-foreground)]"
            style={{ fontFamily: 'var(--font-ui-display)' }}
          >
            {isEditMode ? '编辑会议' : '安排会议'}
          </h2>
          <p className="research-section-note mt-0.5">
            {isEditMode ? '调整后将通知全体组员' : '线下例会排期，创建后将通知全体组员'}
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

      <form onSubmit={handleSubmit} className="grid gap-3.5 px-5 py-4">
        {error && <div className="research-error rounded-md px-4 py-2.5 text-base">{error}</div>}

        <label className="grid gap-1.5 text-sm font-semibold text-[var(--paper-foreground)]">
          会议主题
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={MAX_MEETING_TITLE_LENGTH}
            placeholder="如：第 3 次例会——数据分析进展讨论"
            disabled={isSubmitting}
            className="research-input rounded-md px-3.5 py-2.5 text-base font-normal"
          />
        </label>

        <div className="grid gap-3.5 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-semibold text-[var(--paper-foreground)]">
            开始时间
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
              disabled={isSubmitting}
              className="research-input rounded-md px-3.5 py-2.5 text-base font-normal"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold text-[var(--paper-foreground)]">
            时长（分钟，可选）
            <input
              type="number"
              value={durationMinutes}
              onChange={(event) => setDurationMinutes(event.target.value)}
              min={MIN_MEETING_DURATION_MINUTES}
              max={MAX_MEETING_DURATION_MINUTES}
              step={5}
              placeholder="如：60"
              disabled={isSubmitting}
              className="research-input rounded-md px-3.5 py-2.5 text-base font-normal"
            />
          </label>
        </div>

        <label className="grid gap-1.5 text-sm font-semibold text-[var(--paper-foreground)]">
          地点或线上链接（可选）
          <input
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            maxLength={MAX_MEETING_LOCATION_LENGTH}
            placeholder="如：物理楼 302 教室"
            disabled={isSubmitting}
            className="research-input rounded-md px-3.5 py-2.5 text-base font-normal"
          />
        </label>

        <label className="grid gap-1.5 text-sm font-semibold text-[var(--paper-foreground)]">
          议程（可选）
          <textarea
            value={agenda}
            onChange={(event) => setAgenda(event.target.value)}
            maxLength={MAX_MEETING_AGENDA_LENGTH}
            rows={4}
            placeholder="每行一条议程，如：&#10;1. 上次行动项检查&#10;2. 本周实验数据讨论"
            disabled={isSubmitting}
            className="research-input resize-y rounded-md px-3.5 py-2.5 text-base font-normal leading-6"
          />
        </label>

        <div className="mt-1 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="glass-button rounded-md px-4 py-2.5 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="glass-button glass-button-primary inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEditMode ? '保存修改' : '创建会议'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
