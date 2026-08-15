/**
 * Meeting Minutes Dialog
 * 会议纪要归档弹窗
 *
 * 组长粘贴会议文字记录或上传记录文件（txt/md 自动读入文本框）→ 勾选实到成员 →
 * AI 生成结构化纪要与表现评分 → 预览可编辑 → 确认归档。
 * AI 未配置或生成失败时可切换为手动撰写（不产生 AI 评分）。
 */

import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { FileText, Loader2, PenLine, Sparkles, X } from 'lucide-react';

import { Dialog } from '@/components/ui/dialog';
import { cn } from '@/utils/classNames';
import { ApiRequestError } from '@/lib/api';
import { formatUserIdentity } from '@/lib/identity';
import {
  researchApi,
  type MeetingAiScore,
  type MeetingRecordFileCategory,
  type MeetingRecordFileUploadResult,
  type ProjectMeeting,
  type ProjectMember,
} from '@/lib/research.service';

const MAX_MEETING_RAW_NOTES_LENGTH = 20000;
const MAX_MEETING_MINUTES_LENGTH = 10000;

/** 按扩展名映射上传类别；txt/md 同时读入文本框供 AI 使用 */
const RECORD_FILE_CATEGORY_BY_EXTENSION: Record<string, MeetingRecordFileCategory> = {
  txt: 'document',
  md: 'document',
  doc: 'document',
  docx: 'document',
  pdf: 'pdf',
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  gif: 'image',
  webp: 'image',
};

const TEXT_FILE_EXTENSIONS = new Set(['txt', 'md']);

interface MeetingMinutesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  meeting: ProjectMeeting;
  members: ProjectMember[];
  /** 归档成功后由父组件重新拉取会议列表 */
  onSuccess: () => Promise<void> | void;
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(reader.error ?? new Error('读取文件失败'));
    reader.readAsText(file);
  });
}

export function MeetingMinutesDialog({
  isOpen,
  onClose,
  projectId,
  meeting,
  members,
  onSuccess,
}: MeetingMinutesDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rawNotes, setRawNotes] = useState('');
  const [recordFile, setRecordFile] = useState<MeetingRecordFileUploadResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [attendeeIds, setAttendeeIds] = useState<string[]>([]);

  const [minutesContent, setMinutesContent] = useState('');
  const [aiScores, setAiScores] = useState<MeetingAiScore[]>([]);
  const [generatedByAi, setGeneratedByAi] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const [isArchiving, setIsArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setRawNotes('');
    setRecordFile(null);
    setUploadError(null);
    // 默认全选在册成员，组长按实到勾选
    setAttendeeIds(members.map((member) => member.user_id));
    setMinutesContent('');
    setAiScores([]);
    setGeneratedByAi(false);
    setIsEditorOpen(false);
    setGenerateError(null);
    setArchiveError(null);
  }, [isOpen, members, meeting.id]);

  const isBusy = isUploading || isGenerating || isArchiving;

  const handleClose = () => {
    if (!isBusy) {
      onClose();
    }
  };

  const getMemberName = (userId: string): string => {
    const member = members.find((item) => item.user_id === userId);
    return member ? formatUserIdentity(member, member.username || '成员') : '成员';
  };

  const toggleAttendee = (userId: string) => {
    setAttendeeIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    );
  };

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    const category = RECORD_FILE_CATEGORY_BY_EXTENSION[extension];
    if (!category) {
      setUploadError('暂不支持该文件格式，请上传 txt / md / doc / docx / pdf 或图片文件');
      input.value = '';
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      if (TEXT_FILE_EXTENSIONS.has(extension)) {
        const text = (await readFileAsText(file)).trim();
        if (text) {
          setRawNotes((current) => {
            const merged = current.trim() ? `${current}\n${text}` : text;
            return merged.slice(0, MAX_MEETING_RAW_NOTES_LENGTH);
          });
        }
      }

      const result = await researchApi.uploadMeetingRecordFile(projectId, category, file);
      setRecordFile(result);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : '上传会议记录文件失败');
    } finally {
      setIsUploading(false);
      input.value = '';
    }
  }

  async function handleGenerate() {
    const trimmedNotes = rawNotes.trim();
    if (!trimmedNotes) {
      setGenerateError('请先粘贴会议文字记录（txt/md 文件会自动读入文本框）');
      return;
    }
    if (attendeeIds.length === 0) {
      setGenerateError('请至少勾选一位实到成员');
      return;
    }

    setIsGenerating(true);
    setGenerateError(null);

    try {
      const preview = await researchApi.generateMeetingMinutes(projectId, meeting.id, {
        raw_notes: trimmedNotes,
        attendee_ids: attendeeIds,
      });
      setMinutesContent(preview.minutes_content.slice(0, MAX_MEETING_MINUTES_LENGTH));
      setAiScores(preview.ai_scores ?? []);
      setGeneratedByAi(true);
      setIsEditorOpen(true);
    } catch (err) {
      const isAdvisorDisabled = err instanceof ApiRequestError && err.code === 'AI_ADVISOR_DISABLED';
      setGenerateError(
        isAdvisorDisabled
          ? 'AI 顾问未配置，已切换为手动撰写模式。'
          : `${err instanceof Error ? err.message : 'AI 生成纪要失败'}，可改用手动撰写。`
      );
      // 优雅降级：AI 不可用时打开手动撰写编辑器
      setGeneratedByAi(false);
      setAiScores([]);
      setIsEditorOpen(true);
    } finally {
      setIsGenerating(false);
    }
  }

  function handleManualMode() {
    setGeneratedByAi(false);
    setAiScores([]);
    setIsEditorOpen(true);
  }

  async function handleArchive() {
    const content = minutesContent.trim();
    if (!content) {
      setArchiveError('请填写纪要内容');
      return;
    }
    if (content.length > MAX_MEETING_MINUTES_LENGTH) {
      setArchiveError(`纪要内容不能超过 ${MAX_MEETING_MINUTES_LENGTH} 字`);
      return;
    }
    const trimmedNotes = rawNotes.trim();
    if (!trimmedNotes && !recordFile) {
      setArchiveError('请粘贴文字记录或上传记录文件，原始记录将随会议一并保存');
      return;
    }
    if (attendeeIds.length === 0) {
      setArchiveError('请至少勾选一位实到成员');
      return;
    }

    setIsArchiving(true);
    setArchiveError(null);

    // 生成后若调整了实到勾选，剔除已不在实到名单中的 AI 评分（与服务端校验一致）
    const scoresForArchive = generatedByAi
      ? aiScores.filter((score) => attendeeIds.includes(score.user_id))
      : [];

    try {
      await researchApi.archiveMeetingMinutes(projectId, meeting.id, {
        content,
        attendee_ids: attendeeIds,
        ai_scores: scoresForArchive.length > 0 ? scoresForArchive : null,
        generated_by_ai: generatedByAi,
        raw_notes: trimmedNotes || null,
        raw_file: recordFile
          ? {
              url: recordFile.url,
              original_name: recordFile.originalName,
              mime_type: recordFile.mimeType,
              size: recordFile.size,
            }
          : null,
      });
      await onSuccess();
      onClose();
    } catch (err) {
      setArchiveError(err instanceof Error ? err.message : '归档会议纪要失败');
    } finally {
      setIsArchiving(false);
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      closeOnOverlayClick={!isBusy}
      closeOnEsc={!isBusy}
      className="max-w-2xl overflow-hidden rounded-xl border-[1.5px] border-[var(--research-edge)] bg-[var(--research-surface)] shadow-[var(--research-lift)]"
    >
      <div className="flex items-start justify-between gap-3 border-b border-[var(--research-line)] bg-[var(--research-head)] px-5 py-4">
        <div className="min-w-0">
          <h2
            className="truncate text-lg font-semibold text-[var(--paper-foreground)]"
            style={{ fontFamily: 'var(--font-ui-display)' }}
          >
            整理会议纪要 · {meeting.title}
          </h2>
          <p className="research-section-note mt-0.5">
            原始记录会随会议保存并对组内可见；归档后会议标记为已完成，并开启成员互评
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

      <div className="grid max-h-[min(72vh,40rem)] gap-4 overflow-y-auto px-5 py-4">
        {/* ① 原始记录 */}
        <section className="grid gap-2">
          <h3 className="text-base font-semibold text-[var(--paper-foreground)]">① 会议原始记录</h3>
          <textarea
            value={rawNotes}
            onChange={(event) => setRawNotes(event.target.value)}
            maxLength={MAX_MEETING_RAW_NOTES_LENGTH}
            rows={7}
            aria-label="会议文字记录"
            placeholder="粘贴会议讨论的文字记录或笔记（上限 20000 字）……"
            disabled={isBusy}
            className="research-input resize-y rounded-md px-3.5 py-2.5 text-base leading-6"
          />
          <div className="flex flex-wrap items-center gap-2.5">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.doc,.docx,.pdf,image/*"
              onChange={(event) => void handleFileChange(event)}
              aria-label="上传会议记录文件"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isBusy}
              className="glass-button inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              {isUploading ? '上传中…' : '上传记录文件'}
            </button>
            <span className="text-sm text-[var(--glass-text-muted)]">
              支持 txt / md / doc / docx / pdf / 图片；txt 与 md 会自动读入文本框
            </span>
          </div>
          {recordFile && (
            <p className="inline-flex flex-wrap items-center gap-2 text-base text-[var(--paper-foreground)]">
              <FileText className="h-4 w-4 shrink-0 text-[var(--glass-text-muted)]" />
              <span className="font-medium">{recordFile.originalName}</span>
              <button
                type="button"
                onClick={() => setRecordFile(null)}
                disabled={isBusy}
                aria-label={`移除记录文件 ${recordFile.originalName}`}
                className="rounded-md px-1.5 py-0.5 text-sm font-semibold text-[var(--color-destructive)] hover:bg-[var(--glass-chip)]"
              >
                移除
              </button>
            </p>
          )}
          {uploadError && (
            <p className="research-error rounded-md px-4 py-2.5 text-base">{uploadError}</p>
          )}
        </section>

        {/* ② 实到成员 */}
        <section className="grid gap-2">
          <h3 className="text-base font-semibold text-[var(--paper-foreground)]">
            ② 勾选实到成员
            <span className="ml-2 text-sm font-normal text-[var(--glass-text-muted)]">
              已选 {attendeeIds.length} / {members.length} 人
            </span>
          </h3>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {members.map((member) => {
              const name = formatUserIdentity(member, member.username || '成员');
              return (
                <label
                  key={member.user_id}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md border border-[var(--research-line)] px-3.5 py-2.5 text-base text-[var(--paper-foreground)] hover:bg-[var(--research-head)]"
                >
                  <input
                    type="checkbox"
                    checked={attendeeIds.includes(member.user_id)}
                    onChange={() => toggleAttendee(member.user_id)}
                    aria-label={`实到成员 ${name}`}
                    disabled={isBusy}
                    className="h-4 w-4 accent-[var(--paper-accent)]"
                  />
                  {name}
                </label>
              );
            })}
          </div>
        </section>

        {/* ③ 生成 / 手动撰写 */}
        <section className="grid gap-2">
          <h3 className="text-base font-semibold text-[var(--paper-foreground)]">③ 生成结构化纪要</h3>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={isBusy}
              className="glass-button glass-button-primary inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isGenerating ? '生成中…' : 'AI 生成纪要'}
            </button>
            <button
              type="button"
              onClick={handleManualMode}
              disabled={isBusy}
              className="glass-button inline-flex items-center gap-1.5 rounded-md px-4 py-2.5 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              <PenLine className="h-4 w-4" />
              手动撰写
            </button>
          </div>
          {generateError && (
            <p className="research-error rounded-md px-4 py-2.5 text-base">{generateError}</p>
          )}
        </section>

        {/* ④ 预览编辑与归档 */}
        {isEditorOpen && (
          <section className="grid gap-2.5">
            <h3 className="text-base font-semibold text-[var(--paper-foreground)]">
              ④ 纪要预览（可编辑）
              <span
                className={cn(
                  'ml-2 inline-flex rounded-md px-2 py-0.5 text-xs font-semibold',
                  generatedByAi ? 'research-chip research-chip-accent' : 'research-chip'
                )}
              >
                {generatedByAi ? 'AI 生成' : '手动撰写'}
              </span>
            </h3>
            <textarea
              value={minutesContent}
              onChange={(event) => setMinutesContent(event.target.value)}
              maxLength={MAX_MEETING_MINUTES_LENGTH}
              rows={10}
              aria-label="纪要内容"
              placeholder="议题、讨论要点、结论与决议、行动项（负责人）、参会情况……"
              disabled={isArchiving}
              className="research-input resize-y rounded-md px-3.5 py-2.5 text-base leading-6"
            />

            {generatedByAi && aiScores.length > 0 && (
              <div className="rounded-[0.625rem] border border-[var(--research-line)]">
                <p className="border-b border-[var(--research-line)] bg-[var(--research-head)] px-4 py-2.5 text-sm font-semibold text-[var(--paper-foreground)]">
                  AI 表现评分（随纪要一并归档；成员仅可见自己的评分）
                </p>
                <ul className="divide-y divide-[var(--research-line)]">
                  {aiScores.map((score) => (
                    <li key={score.user_id} className="flex items-start gap-3 px-4 py-2.5">
                      <span className="research-chip shrink-0 rounded-md px-2.5 py-1 text-sm font-bold tabular-nums">
                        {score.score} 分
                      </span>
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-[var(--paper-foreground)]">
                          {getMemberName(score.user_id)}
                        </p>
                        {score.comment && (
                          <p className="mt-0.5 text-base leading-6 text-[var(--glass-text-muted)]">
                            {score.comment}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {archiveError && (
              <p className="research-error rounded-md px-4 py-2.5 text-base">{archiveError}</p>
            )}

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={handleClose}
                disabled={isBusy}
                className="glass-button rounded-md px-4 py-2.5 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => void handleArchive()}
                disabled={isBusy}
                className="glass-button glass-button-primary inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isArchiving && <Loader2 className="h-4 w-4 animate-spin" />}
                确认归档
              </button>
            </div>
          </section>
        )}
      </div>
    </Dialog>
  );
}
