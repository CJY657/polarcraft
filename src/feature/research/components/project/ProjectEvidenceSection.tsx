import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ExternalLink,
  FileText,
  GripVertical,
  Image as ImageIcon,
  Link2,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Star,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  researchApi,
  type ProjectEvidence,
  type ProjectEvidenceAttachment,
  type ProjectEvidenceAttachmentCategory,
  type ProjectEvidenceType,
  type UpsertProjectEvidenceInput,
} from '@/lib/research.service';
import { profileApi } from '@/lib/profile.service';
import { formatResearchDateTime } from '@/lib/datetime.util';
import { formatUserIdentity } from '@/lib/identity';
import { capturePostHogEvent } from '@/lib/posthog';
import { ResearchSectionCard } from '../shared/ResearchSectionCard';

interface ProjectEvidenceSectionProps {
  projectId: string;
  canManage: boolean;
  usePublicEndpoint?: boolean;
  theme?: 'light' | 'dark';
}

type EvidenceFormMode = 'create' | 'edit';

interface EvidenceFormState {
  title: string;
  evidenceType: ProjectEvidenceType;
  description: string;
  externalUrl: string;
  attachmentNote: string;
}

type DraftAttachment =
  | { id: string; status: 'saved'; attachment: ProjectEvidenceAttachment }
  | { id: string; status: 'pending'; file: File; category: ProjectEvidenceAttachmentCategory };

interface EvidenceOrderItemProps {
  evidence: ProjectEvidence;
  index: number;
  isSaving: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

const MAX_EVIDENCE_ATTACHMENTS = 10;
let draftAttachmentSequence = 0;

const EVIDENCE_TYPE_OPTIONS: Array<{ value: ProjectEvidenceType; label: string }> = [
  { value: 'image_observation', label: '图像观察' },
  { value: 'data_table', label: '数据表格' },
  { value: 'source_literature', label: '来源文献' },
  { value: 'experiment_log', label: '实验记录' },
  { value: 'code_prototype', label: '代码原型' },
  { value: 'failure_record', label: '失败记录' },
  { value: 'other', label: '其他' },
];

const EVIDENCE_TYPE_LABELS = Object.fromEntries(
  EVIDENCE_TYPE_OPTIONS.map((item) => [item.value, item.label])
) as Record<ProjectEvidenceType, string>;

const emptyFormState: EvidenceFormState = {
  title: '',
  evidenceType: 'image_observation',
  description: '',
  externalUrl: '',
  attachmentNote: '',
};

function formatFileSize(bytes: number | null): string | null {
  if (bytes === null || !Number.isFinite(bytes)) {
    return null;
  }

  if (bytes === 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${Number(value.toFixed(value >= 10 || exponent === 0 ? 0 : 1))} ${units[exponent]}`;
}

function getAttachmentCategory(file: File): ProjectEvidenceAttachmentCategory | null {
  const filename = file.name.toLowerCase();

  if (file.type.startsWith('image/') || /\.(jpe?g|png|gif|webp)$/i.test(filename)) {
    return 'image';
  }

  if (file.type.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(filename)) {
    return 'video';
  }

  if (file.type === 'application/pdf' || /\.pdf$/i.test(filename)) {
    return 'pdf';
  }

  if (
    file.type.includes('presentation')
    || /\.(pptx?|ppsx?)$/i.test(filename)
  ) {
    return 'pptx';
  }

  return null;
}

function getEvidenceAttachments(evidence: ProjectEvidence): ProjectEvidenceAttachment[] {
  if (Array.isArray(evidence.attachments)) {
    return evidence.attachments;
  }

  return evidence.attachment_url
    ? [{
        url: evidence.attachment_url,
        original_name: evidence.attachment_original_name,
        size: evidence.attachment_size,
        mime_type: evidence.attachment_mime_type,
        category: evidence.attachment_category,
      }]
    : [];
}

function getAttachmentLabel(attachment: ProjectEvidenceAttachment): string {
  return attachment.original_name || attachment.url || '研究附件';
}

function createDraftAttachmentId(): string {
  draftAttachmentSequence += 1;
  return `evidence-attachment-${draftAttachmentSequence}`;
}

function buildDraftAttachments(evidence?: ProjectEvidence | null): DraftAttachment[] {
  return evidence
    ? getEvidenceAttachments(evidence).map((attachment) => ({
        id: createDraftAttachmentId(),
        status: 'saved' as const,
        attachment,
      }))
    : [];
}

function buildFormState(evidence?: ProjectEvidence | null): EvidenceFormState {
  if (!evidence) {
    return emptyFormState;
  }

  return {
    title: evidence.title,
    evidenceType: evidence.evidence_type,
    description: evidence.description || '',
    externalUrl: evidence.external_url || '',
    attachmentNote: evidence.attachment_note || '',
  };
}

function EvidenceOrderItem({
  evidence,
  index,
  isSaving,
  isLast,
  onMoveUp,
  onMoveDown,
}: EvidenceOrderItemProps) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      as="div"
      value={evidence}
      dragListener={false}
      dragControls={dragControls}
      whileDrag={{ scale: 1.01, boxShadow: '0 18px 40px rgba(15, 23, 42, 0.18)' }}
      className="research-panel-soft flex items-center gap-3 rounded-2xl p-3"
    >
      <button
        type="button"
        aria-label={`拖动排序 ${evidence.title}`}
        onPointerDown={(event) => {
          if (!isSaving) {
            dragControls.start(event);
          }
        }}
        disabled={isSaving}
        className="glass-button flex h-10 w-10 shrink-0 touch-none items-center justify-center rounded-xl text-[var(--glass-text-muted)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="w-7 shrink-0 text-center text-sm font-semibold text-[var(--glass-text-muted)]">
        {index + 1}
      </span>
      <span className="min-w-0 flex-1 truncate text-base font-semibold text-[var(--paper-foreground)]">
        {evidence.title}
      </span>
      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={isSaving || index === 0}
          className="glass-button rounded-full p-2 text-[var(--glass-text-muted)] disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={`上移证据 ${evidence.title}`}
        >
          <ArrowUp className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={isSaving || isLast}
          className="glass-button rounded-full p-2 text-[var(--glass-text-muted)] disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={`下移证据 ${evidence.title}`}
        >
          <ArrowDown className="h-4 w-4" />
        </button>
      </div>
    </Reorder.Item>
  );
}

export function ProjectEvidenceSection({
  projectId,
  canManage,
  usePublicEndpoint = false,
  theme = 'light',
}: ProjectEvidenceSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [evidenceItems, setEvidenceItems] = useState<ProjectEvidence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<EvidenceFormMode>('create');
  const [editingEvidence, setEditingEvidence] = useState<ProjectEvidence | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formState, setFormState] = useState<EvidenceFormState>(emptyFormState);
  const [draftAttachments, setDraftAttachments] = useState<DraftAttachment[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ completed: number; total: number } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [orderedEvidence, setOrderedEvidence] = useState<ProjectEvidence[]>([]);
  const [expectedEvidenceIds, setExpectedEvidenceIds] = useState<string[]>([]);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectEvidence | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadEvidence = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const items = usePublicEndpoint
        ? await profileApi.getPublicProjectEvidence(projectId)
        : await researchApi.getProjectEvidence(projectId);
      setEvidenceItems(items);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : '加载证据库失败');
    } finally {
      setIsLoading(false);
    }
  }, [projectId, usePublicEndpoint]);

  useEffect(() => {
    void loadEvidence();
  }, [loadEvidence]);

  function openCreateForm() {
    setFormMode('create');
    setEditingEvidence(null);
    setFormState({ ...emptyFormState });
    setDraftAttachments([]);
    setUploadProgress(null);
    setFormError(null);
    setIsFormOpen(true);
  }

  function openEditForm(evidence: ProjectEvidence) {
    setFormMode('edit');
    setEditingEvidence(evidence);
    setFormState(buildFormState(evidence));
    setDraftAttachments(buildDraftAttachments(evidence));
    setUploadProgress(null);
    setFormError(null);
    setIsFormOpen(true);
  }

  function closeForm(options: { force?: boolean } = {}) {
    if (isSaving && !options.force) {
      return;
    }

    setIsFormOpen(false);
    setEditingEvidence(null);
    setDraftAttachments([]);
    setUploadProgress(null);
    setFormError(null);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';

    if (files.length === 0) {
      return;
    }

    const unsupportedFile = files.find((file) => !getAttachmentCategory(file));
    if (unsupportedFile) {
      setFormError('当前附件仅支持图片、视频、PDF 和 PPTX 文件');
      return;
    }
    if (draftAttachments.length + files.length > MAX_EVIDENCE_ATTACHMENTS) {
      setFormError(`每条证据最多保留 ${MAX_EVIDENCE_ATTACHMENTS} 个附件`);
      return;
    }

    setDraftAttachments((attachments) => [
      ...attachments,
      ...files.map((file) => ({
        id: createDraftAttachmentId(),
        status: 'pending' as const,
        file,
        category: getAttachmentCategory(file) as ProjectEvidenceAttachmentCategory,
      })),
    ]);
    setFormError(null);
  }

  function removeDraftAttachment(attachmentId: string) {
    setDraftAttachments((attachments) => attachments.filter((attachment) => attachment.id !== attachmentId));
  }

  function moveDraftAttachment(attachmentId: string, offset: number) {
    setDraftAttachments((attachments) => {
      const index = attachments.findIndex((attachment) => attachment.id === attachmentId);
      const nextIndex = index + offset;
      if (index < 0 || nextIndex < 0 || nextIndex >= attachments.length) {
        return attachments;
      }

      const next = [...attachments];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  }

  function moveEvidence(index: number, direction: -1 | 1) {
    setOrderedEvidence((items) => {
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= items.length) {
        return items;
      }

      const next = [...items];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  }

  function beginEvidenceReorder() {
    if (!canManage || evidenceItems.length < 2) {
      return;
    }

    setIsFormOpen(false);
    setOrderedEvidence([...evidenceItems]);
    setExpectedEvidenceIds(evidenceItems.map((evidence) => evidence.id));
    setOrderError(null);
    setIsReordering(true);
  }

  function cancelEvidenceReorder() {
    if (isSavingOrder) {
      return;
    }
    setIsReordering(false);
    setOrderError(null);
  }

  async function saveEvidenceOrder() {
    if (!isReordering) {
      return;
    }

    setIsSavingOrder(true);
    setOrderError(null);
    try {
      const saved = await researchApi.reorderProjectEvidence(projectId, {
        expectedEvidenceIds,
        evidenceIds: orderedEvidence.map((evidence) => evidence.id),
      });
      setEvidenceItems(Array.isArray(saved) && saved.length > 0 ? saved : orderedEvidence);
      setIsReordering(false);
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : '保存证据顺序失败，请刷新后重试');
    } finally {
      setIsSavingOrder(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canManage) {
      return;
    }

    const title = formState.title.trim();
    if (!title) {
      setFormError('请填写证据标题');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      let workingAttachments = [...draftAttachments];
      const pendingAttachments = workingAttachments.filter((
        attachment
      ): attachment is Extract<DraftAttachment, { status: 'pending' }> => attachment.status === 'pending');
      setUploadProgress(pendingAttachments.length > 0 ? { completed: 1, total: pendingAttachments.length } : null);

      for (let index = 0; index < pendingAttachments.length; index += 1) {
        const pendingAttachment = pendingAttachments[index];
        setUploadProgress({ completed: index + 1, total: pendingAttachments.length });
        const uploaded = await researchApi.uploadProjectEvidenceAttachment(
          projectId,
          pendingAttachment.category,
          pendingAttachment.file
        );
        const savedAttachment: DraftAttachment = {
          id: pendingAttachment.id,
          status: 'saved',
          attachment: {
            url: uploaded.url,
            original_name: uploaded.originalName,
            size: uploaded.size,
            mime_type: uploaded.mimeType,
            category: uploaded.category,
          },
        };
        workingAttachments = workingAttachments.map((attachment) => (
          attachment.id === pendingAttachment.id ? savedAttachment : attachment
        ));
        setDraftAttachments(workingAttachments);
      }

      const attachments = workingAttachments
        .filter((attachment): attachment is Extract<DraftAttachment, { status: 'saved' }> => (
          attachment.status === 'saved'
        ))
        .map((attachment) => attachment.attachment);
      const payload: UpsertProjectEvidenceInput = {
        title,
        evidence_type: formState.evidenceType,
        description: formState.description.trim() || null,
        external_url: formState.externalUrl.trim() || null,
        attachment_note: formState.attachmentNote.trim() || null,
        attachments,
      };

      if (formMode === 'edit' && editingEvidence) {
        await researchApi.updateProjectEvidence(projectId, editingEvidence.id, payload);
      } else {
        await researchApi.createProjectEvidence(projectId, payload);
        capturePostHogEvent('research_evidence_submitted', {
          project_id: projectId,
          has_attachment: attachments.length > 0,
        });
      }

      await loadEvidence();
      closeForm({ force: true });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '保存证据失败');
    } finally {
      setIsSaving(false);
      setUploadProgress(null);
    }
  }

  async function handleDeleteEvidence() {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);

    try {
      await researchApi.deleteProjectEvidence(projectId, deleteTarget.id);
      await loadEvidence();
      setDeleteTarget(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : '删除证据失败');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <ResearchSectionCard
      title="证据库"
      note="实验记录、数据与阶段性成果"
      actions={
        canManage && (
          <div className="flex flex-wrap items-center justify-end gap-2">
            {isReordering ? (
              <>
                <button
                  type="button"
                  onClick={cancelEvidenceReorder}
                  disabled={isSavingOrder}
                  className="glass-button inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => void saveEvidenceOrder()}
                  disabled={isSavingOrder}
                  className="glass-button glass-button-primary inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingOrder && <Loader2 className="h-4 w-4 animate-spin" />}
                  保存顺序
                </button>
              </>
            ) : evidenceItems.length >= 2 ? (
              <button
                type="button"
                onClick={beginEvidenceReorder}
                className="glass-button inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold"
              >
                <GripVertical className="h-4 w-4" />
                调整顺序
              </button>
            ) : null}
            {!isReordering && (
              <button
                type="button"
                onClick={openCreateForm}
                className="glass-button glass-button-primary inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold text-white"
              >
                新增证据
              </button>
            )}
          </div>
        )
      }
    >
      {!canManage && (
        <p className="research-panel-soft mb-4 rounded-md px-4 py-3 text-base leading-6 text-[var(--glass-text-muted)]">
          只读浏览：新增和编辑证据仅对课题成员开放。
        </p>
      )}

      {isFormOpen && canManage && (
        <form onSubmit={handleSubmit} className="research-panel-soft mb-5 rounded-2xl p-4">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-[var(--paper-foreground)]">
                {formMode === 'edit' ? '编辑研究证据' : '新增研究证据'}
              </h3>
              <p className="mt-1 text-base text-[var(--glass-text-muted)]">
                附件可选，不支持的表格文件可先用外部链接或附件说明记录。
              </p>
            </div>
            <button
              type="button"
              onClick={() => closeForm()}
              disabled={isSaving}
              className="glass-button rounded-full p-2 text-[var(--glass-text-muted)] disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="关闭证据表单"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-base font-medium text-[var(--paper-foreground)]">
              标题
              <input
                value={formState.title}
                onChange={(event) => setFormState((state) => ({ ...state, title: event.target.value }))}
                maxLength={120}
                className="research-input rounded-xl px-4 py-3 text-base"
                required
              />
            </label>

            <label className="grid gap-2 text-base font-medium text-[var(--paper-foreground)]">
              证据类型
              <select
                value={formState.evidenceType}
                onChange={(event) => (
                  setFormState((state) => ({
                    ...state,
                    evidenceType: event.target.value as ProjectEvidenceType,
                  }))
                )}
                className="research-input rounded-xl px-4 py-3 text-base"
              >
                {EVIDENCE_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-base font-medium text-[var(--paper-foreground)] md:col-span-2">
              过程说明
              <textarea
                value={formState.description}
                onChange={(event) => setFormState((state) => ({ ...state, description: event.target.value }))}
                rows={4}
                maxLength={4000}
                className="research-input resize-y rounded-xl px-4 py-3 text-base leading-7"
              />
            </label>

            <label className="grid gap-2 text-base font-medium text-[var(--paper-foreground)]">
              外部链接
              <input
                value={formState.externalUrl}
                onChange={(event) => setFormState((state) => ({ ...state, externalUrl: event.target.value }))}
                maxLength={1000}
                inputMode="url"
                className="research-input rounded-xl px-4 py-3 text-base"
              />
            </label>

            <label className="grid gap-2 text-base font-medium text-[var(--paper-foreground)]">
              附件说明
              <input
                value={formState.attachmentNote}
                onChange={(event) => setFormState((state) => ({ ...state, attachmentNote: event.target.value }))}
                maxLength={1000}
                className="research-input rounded-xl px-4 py-3 text-base"
              />
            </label>
          </div>

          <div className="mt-4 rounded-2xl border border-[var(--glass-stroke)] bg-[var(--glass-chip)] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-base font-semibold text-[var(--paper-foreground)]">可选附件上传</p>
                <p className="mt-1 text-sm text-[var(--glass-text-muted)]">支持图片、视频、PDF、PPTX。</p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSaving}
                className="glass-button inline-flex items-center justify-center gap-2 self-start rounded-full px-4 py-2 text-base font-medium disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
              >
                <UploadCloud className="h-4 w-4 text-[var(--paper-link)]" />
                选择附件
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime,application/pdf,.ppt,.pptx"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="mt-4 flex items-center justify-between gap-3 text-sm text-[var(--glass-text-muted)]">
              <span>附件队列</span>
              <span>{draftAttachments.length}/{MAX_EVIDENCE_ATTACHMENTS}</span>
            </div>

            {draftAttachments.length > 0 && (
              <Reorder.Group
                axis="y"
                as="div"
                values={draftAttachments}
                onReorder={setDraftAttachments}
                className="mt-2 grid gap-2"
              >
                {draftAttachments.map((draftAttachment, index) => {
                  const attachmentName = draftAttachment.status === 'pending'
                    ? draftAttachment.file.name
                    : getAttachmentLabel(draftAttachment.attachment);
                  const attachmentSize = draftAttachment.status === 'pending'
                    ? draftAttachment.file.size
                    : draftAttachment.attachment.size;
                  const isPrimary = index === 0;

                  return (
                    <Reorder.Item
                      key={draftAttachment.id}
                      as="div"
                      value={draftAttachment}
                      className="flex min-w-0 items-center gap-2 rounded-xl border border-[var(--glass-stroke)] bg-[var(--glass-chip)] px-3 py-2"
                    >
                      <FileText className="h-4 w-4 shrink-0 text-[var(--paper-link)]" />
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-[var(--paper-foreground)]">
                          <span className="max-w-full truncate">{attachmentName}</span>
                          <span className="shrink-0 text-[var(--glass-text-muted)]">
                            {isPrimary ? '主附件' : '支持材料'}
                          </span>
                          {draftAttachment.status === 'pending' && (
                            <span className="shrink-0 text-[var(--paper-link)]">待上传</span>
                          )}
                        </div>
                        <span className="text-xs text-[var(--glass-text-muted)]">
                          {formatFileSize(attachmentSize)}
                        </span>
                      </div>
                      {!isPrimary && (
                        <button
                          type="button"
                          onClick={() => moveDraftAttachment(draftAttachment.id, -index)}
                          disabled={isSaving}
                          className="glass-button rounded-full p-2 text-[var(--paper-link)] disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={`设为主附件 ${attachmentName}`}
                        >
                          <Star className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => moveDraftAttachment(draftAttachment.id, -1)}
                        disabled={isSaving || isPrimary}
                        className="glass-button rounded-full p-2 text-[var(--glass-text-muted)] disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={`上移附件 ${attachmentName}`}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveDraftAttachment(draftAttachment.id, 1)}
                        disabled={isSaving || index === draftAttachments.length - 1}
                        className="glass-button rounded-full p-2 text-[var(--glass-text-muted)] disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={`下移附件 ${attachmentName}`}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeDraftAttachment(draftAttachment.id)}
                        disabled={isSaving}
                        className="glass-button rounded-full p-2 text-[var(--color-destructive)] disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={`移除附件 ${attachmentName}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </Reorder.Item>
                  );
                })}
              </Reorder.Group>
            )}

            {uploadProgress && (
              <div className="mt-3 inline-flex items-center gap-2 text-sm text-[var(--paper-link)]">
                <Loader2 className="h-4 w-4 animate-spin" />
                正在上传 {uploadProgress.completed}/{uploadProgress.total}
              </div>
            )}
          </div>

          {formError && (
            <div className="research-error mt-4 rounded-2xl px-4 py-3 text-base">
              {formError}
            </div>
          )}

          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => closeForm()}
              disabled={isSaving}
              className="glass-button rounded-full px-5 py-2.5 text-base font-medium disabled:cursor-not-allowed disabled:opacity-60"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="glass-button glass-button-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSaving ? '保存中...' : '保存证据'}
            </button>
          </div>
        </form>
      )}

      {isLoading && (
        <div className="grid gap-3 md:grid-cols-2">
          {[0, 1].map((item) => (
            <div key={item} className="research-panel-soft h-36 animate-pulse rounded-2xl" />
          ))}
        </div>
      )}

      {!isLoading && loadError && (
        <div className="research-panel-soft rounded-2xl px-5 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 text-[var(--color-destructive)]" />
              <div>
                <p className="text-base font-semibold text-[var(--paper-foreground)]">证据库加载失败</p>
                <p className="mt-1 text-base text-[var(--glass-text-muted)]">{loadError}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void loadEvidence()}
              className="glass-button inline-flex items-center justify-center gap-2 self-start rounded-full px-4 py-2 text-base font-medium sm:self-auto"
            >
              <RefreshCw className="h-4 w-4 text-[var(--paper-link)]" />
              重试
            </button>
          </div>
        </div>
      )}

      {!isLoading && !loadError && evidenceItems.length === 0 && (
        <div className="research-panel-soft rounded-2xl px-5 py-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--paper-link)]/10 text-[var(--paper-link)]">
            <ImageIcon className="h-5 w-5" />
          </div>
          <p className="mt-4 text-lg font-semibold text-[var(--paper-foreground)]">
            {canManage ? '还没有研究证据' : '该课题还没有公开沉淀的研究证据'}
          </p>
          {canManage && (
            <button
              type="button"
              onClick={openCreateForm}
              className="glass-button glass-button-primary mt-4 inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-base font-semibold text-white"
            >
              <Plus className="h-4 w-4" />
              上传第一条研究证据
            </button>
          )}
        </div>
      )}

      {!isLoading && !loadError && isReordering && orderedEvidence.length > 0 && (
        <div className="grid gap-3">
          <Reorder.Group
            axis="y"
            as="div"
            values={orderedEvidence}
            onReorder={setOrderedEvidence}
            className="grid gap-3"
          >
            {orderedEvidence.map((evidence, index) => (
              <EvidenceOrderItem
                key={evidence.id}
                evidence={evidence}
                index={index}
                isSaving={isSavingOrder}
                isLast={index === orderedEvidence.length - 1}
                onMoveUp={() => moveEvidence(index, -1)}
                onMoveDown={() => moveEvidence(index, 1)}
              />
            ))}
          </Reorder.Group>
          {orderError && (
            <div className="research-error rounded-2xl px-4 py-3 text-base">
              {orderError}
            </div>
          )}
        </div>
      )}

      {!isLoading && !loadError && !isReordering && evidenceItems.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {evidenceItems.map((evidence) => {
            const attachments = getEvidenceAttachments(evidence);
            const hasAttachment = attachments.length > 0;

            return (
              <article key={evidence.id} className="research-panel-soft rounded-2xl p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="research-chip inline-flex rounded-full px-3 py-1 text-sm font-medium">
                      {EVIDENCE_TYPE_LABELS[evidence.evidence_type] || '其他'}
                    </span>
                    <h3 className="mt-3 text-lg font-semibold leading-6 text-[var(--paper-foreground)]">
                      {evidence.title}
                    </h3>
                  </div>

                  {canManage && (
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => openEditForm(evidence)}
                        className="glass-button rounded-full p-2 text-[var(--paper-link)]"
                        aria-label={`编辑证据 ${evidence.title}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(evidence)}
                        className="glass-button rounded-full p-2 text-[var(--color-destructive)]"
                        aria-label={`删除证据 ${evidence.title}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {evidence.description && (
                  <p className="whitespace-pre-wrap text-base leading-7 text-[var(--glass-text-muted)]">
                    {evidence.description}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2 text-sm text-[var(--glass-text-muted)]">
                  <span>
                    {formatUserIdentity({
                      username: evidence.creator_username,
                      nickname: evidence.creator_nickname,
                      real_name: evidence.creator_real_name,
                      show_real_name_publicly: evidence.creator_show_real_name_publicly,
                    }, '成员')}
                  </span>
                  <span>{formatResearchDateTime(evidence.created_at)}</span>
                </div>

                {(evidence.external_url || hasAttachment) && (
                  <div className="mt-4 grid gap-2">
                    {evidence.external_url && (
                      <a
                        href={evidence.external_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-w-0 items-center gap-2 rounded-full bg-[var(--glass-chip)] px-3 py-2 text-base font-medium text-[var(--paper-link)] transition hover:bg-[var(--paper-accent-soft)]"
                      >
                        <Link2 className="h-4 w-4 shrink-0" />
                        <span className="truncate">查看外部链接</span>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                      </a>
                    )}
                    {attachments.map((attachment, index) => {
                      const fileSize = formatFileSize(attachment.size);
                      return (
                        <a
                          key={`${evidence.id}-${attachment.url}`}
                          href={attachment.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-w-0 items-center gap-2 rounded-full bg-[var(--glass-chip)] px-3 py-2 text-base font-medium text-[var(--paper-link)] transition hover:bg-[var(--paper-accent-soft)]"
                        >
                          <FileText className="h-4 w-4 shrink-0" />
                          <span className="truncate">{getAttachmentLabel(attachment)}</span>
                          <span className="shrink-0 text-sm text-[var(--glass-text-muted)]">
                            {index === 0 ? '主附件' : '支持材料'}
                          </span>
                          {fileSize && <span className="shrink-0 text-sm text-[var(--glass-text-muted)]">{fileSize}</span>}
                        </a>
                      );
                    })}
                  </div>
                )}

                {evidence.attachment_note && (
                  <p className="mt-3 rounded-2xl bg-[var(--glass-chip)] px-3 py-2 text-sm leading-6 text-[var(--glass-text-muted)]">
                    {evidence.attachment_note}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="删除这条证据？"
        description="删除后无法恢复，后续引用可能失去依据。"
        confirmLabel="确认删除"
        cancelLabel="取消"
        onConfirm={() => void handleDeleteEvidence()}
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
