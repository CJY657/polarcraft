/**
 * Project Edit Dialog Component
 * 课题编辑对话框组件
 */

import { useState, useEffect, FormEvent, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/utils/classNames';
import { Dialog } from '@/components/ui/dialog';
import { ResearchConfirmDialog } from '../shared/ResearchConfirmDialog';
import { ResearchDialogHead, RESEARCH_DIALOG_PANEL } from '../shared/ResearchDialog';
import { researchApi, type ResearchProject } from '@/lib/research.service';
import TopicReferenceTextarea from '../shared/TopicReferenceTextarea';
import {
  getProjectStatusControlOptions,
  PROJECT_LIFECYCLE_STATUSES,
  type ProjectStatus,
} from '../../projectLifecycle';
import {
  ProjectIssueFieldsEditor,
  emptyProjectIssueFields,
} from './ProjectIssueFieldsEditor';

interface ProjectEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: ResearchProject | null;
  onSuccess: (project: ResearchProject) => void;
  initialFocusField?: 'questions';
}

export function ProjectEditDialog({
  isOpen,
  onClose,
  project,
  onSuccess,
  initialFocusField,
}: ProjectEditDialogProps) {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name_zh: '',
    name_en: '',
    description_zh: '',
    description_en: '',
    research_questions_zh: '',
    research_hypotheses_zh: '',
    basic_plan_zh: '',
    extended_plan_zh: '',
    ...emptyProjectIssueFields,
    status: 'active' as ResearchProject['status'],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAdvanceConfirmationOpen, setIsAdvanceConfirmationOpen] = useState(false);
  const questionsInputRef = useRef<HTMLTextAreaElement | null>(null);

  // Initialize form data when project changes
  useEffect(() => {
    if (project) {
      setFormData({
        name_zh: project.name_zh || '',
        name_en: project.name_en || '',
        description_zh: project.description_zh || '',
        description_en: project.description_en || '',
        research_questions_zh: project.research_questions_zh || '',
        research_hypotheses_zh: project.research_hypotheses_zh || '',
        basic_plan_zh: project.basic_plan_zh || '',
        extended_plan_zh: project.extended_plan_zh || '',
        challenge_value_zh: project.challenge_value_zh || '',
        challenge_objectives_zh: project.challenge_objectives_zh || '',
        challenge_beginner_steps_zh: project.challenge_beginner_steps_zh || '',
        challenge_min_deliverables_zh: project.challenge_min_deliverables_zh || '',
        challenge_review_criteria_zh: project.challenge_review_criteria_zh || '',
        challenge_timeline_zh: project.challenge_timeline_zh || '',
        challenge_difficulty: project.challenge_difficulty || 'beginner',
        challenge_roles_zh: project.challenge_roles_zh || '',
        challenge_missing_roles_zh: project.challenge_missing_roles_zh || '',
        challenge_progress_zh: project.challenge_progress_zh || '',
        status: project.status || 'active',
      });
    }
    setError('');
    setIsAdvanceConfirmationOpen(false);
  }, [project, isOpen]);

  useEffect(() => {
    if (isOpen && initialFocusField === 'questions') {
      questionsInputRef.current?.focus();
    }
  }, [initialFocusField, isOpen]);

  const submitProjectUpdate = async () => {
    if (!project) return;

    setError('');
    setIsLoading(true);

    try {
      const updatedProject = await researchApi.updateProject(project.id, {
        name_zh: formData.name_zh,
        name_en: formData.name_en || undefined,
        description_zh: formData.description_zh || undefined,
        description_en: formData.description_en || undefined,
        research_questions_zh: formData.research_questions_zh,
        research_hypotheses_zh: formData.research_hypotheses_zh,
        basic_plan_zh: formData.basic_plan_zh,
        extended_plan_zh: formData.extended_plan_zh,
        challenge_value_zh: formData.challenge_value_zh,
        challenge_objectives_zh: formData.challenge_objectives_zh,
        challenge_beginner_steps_zh: formData.challenge_beginner_steps_zh,
        challenge_min_deliverables_zh: formData.challenge_min_deliverables_zh,
        challenge_review_criteria_zh: formData.challenge_review_criteria_zh,
        challenge_timeline_zh: formData.challenge_timeline_zh,
        challenge_difficulty: formData.challenge_difficulty,
        challenge_roles_zh: formData.challenge_roles_zh,
        challenge_missing_roles_zh: formData.challenge_missing_roles_zh,
        challenge_progress_zh: formData.challenge_progress_zh,
        status: formData.status,
      });

      onSuccess(updatedProject);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!project) return;

    if (!formData.name_zh.trim()) {
      setError(t('project.create.nameRequired') || '请输入课题名称');
      return;
    }

    const currentStatusIndex = PROJECT_LIFECYCLE_STATUSES.indexOf(project.status);
    const nextStatusIndex = PROJECT_LIFECYCLE_STATUSES.indexOf(formData.status);
    const isOrdinaryUserAdvancing = user?.role !== 'admin' && nextStatusIndex > currentStatusIndex;

    if (isOrdinaryUserAdvancing) {
      setIsAdvanceConfirmationOpen(true);
      return;
    }

    void submitProjectUpdate();
  };

  if (!project) return null;

  return (
    <>
      <Dialog isOpen={isOpen} onClose={onClose} containerClassName="items-end sm:items-center">
        <div className={cn(RESEARCH_DIALOG_PANEL, "max-w-lg max-h-[min(92dvh,90vh)] overflow-y-auto rounded-t-[1.25rem] p-6 sm:rounded-xl")}>
        <ResearchDialogHead
          title={t('project.edit.title')}
          onClose={onClose}
          className="-mx-6 -mt-6 mb-6"
        />

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Project Name (Chinese) */}
          <div>
            <label className="block text-base font-medium mb-1.5 text-[var(--paper-foreground)]">
              {t('lab.projectName')} (中文) *
            </label>
            <input
              type="text"
              value={formData.name_zh}
              onChange={(e) => setFormData({ ...formData, name_zh: e.target.value })}
              className="research-input w-full rounded-lg px-3 py-2 text-base"
            />
          </div>

          {/* Project Name (English) */}
          {/* <div>
            <label className="block text-base font-medium mb-1.5 text-[var(--paper-foreground)]">
              {t('lab.projectName')} (English)
            </label>
            <input
              type="text"
              value={formData.name_en}
              onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
              className="research-input w-full rounded-lg px-3 py-2 text-base"
            />
          </div> */}

          {/* Description (Chinese) */}
          <div>
            <label className="block text-base font-medium mb-1.5 text-[var(--paper-foreground)]">
              {t('lab.projectDescription')} (中文)
            </label>
            <TopicReferenceTextarea
              value={formData.description_zh}
              onValueChange={(description_zh) => setFormData({ ...formData, description_zh })}
              excludeProjectId={project?.id}
              references={project?.references}
              placeholder="输入 @ 可引用其他议题"
              rows={4}
              className="research-input w-full resize-none rounded-lg px-3 py-2 text-base"
            />
          </div>

          <div>
            <label className="block text-base font-medium mb-1.5 text-[var(--paper-foreground)]">
              研究问题（中文，每行一个）
            </label>
            <textarea
              ref={questionsInputRef}
              aria-label="研究问题（中文，每行一个）"
              value={formData.research_questions_zh}
              onChange={(e) => setFormData({ ...formData, research_questions_zh: e.target.value })}
              rows={3}
              className="research-input w-full resize-none rounded-lg px-3 py-2 text-base"
            />
          </div>

          <div>
            <label className="block text-base font-medium mb-1.5 text-[var(--paper-foreground)]">
              研究假设（中文，每行一个）
            </label>
            <textarea
              value={formData.research_hypotheses_zh}
              onChange={(e) => setFormData({ ...formData, research_hypotheses_zh: e.target.value })}
              rows={3}
              className="research-input w-full resize-none rounded-lg px-3 py-2 text-base"
            />
          </div>

          <div>
            <label className="block text-base font-medium mb-1.5 text-[var(--paper-foreground)]">
              基础问题与实验（中文）
            </label>
            <textarea
              value={formData.basic_plan_zh}
              onChange={(e) => setFormData({ ...formData, basic_plan_zh: e.target.value })}
              rows={3}
              className="research-input w-full resize-none rounded-lg px-3 py-2 text-base"
            />
          </div>

          <div>
            <label className="block text-base font-medium mb-1.5 text-[var(--paper-foreground)]">
              拓展问题、假设与实验（中文）
            </label>
            <textarea
              value={formData.extended_plan_zh}
              onChange={(e) => setFormData({ ...formData, extended_plan_zh: e.target.value })}
              rows={3}
              className="research-input w-full resize-none rounded-lg px-3 py-2 text-base"
            />
          </div>

          <ProjectIssueFieldsEditor
            value={formData}
            onChange={setFormData}
          />

          {/* Description (English) */}
          {/* <div>
            <label className="block text-base font-medium mb-1.5 text-[var(--paper-foreground)]">
              {t('lab.projectDescription')} (English)
            </label>
            <textarea
              value={formData.description_en}
              onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
              rows={4}
              className="research-input w-full resize-none rounded-lg px-3 py-2 text-base"
            />
          </div> */}

          {/* Status */}
          <div>
            <label htmlFor="project-status" className="block text-base font-medium mb-1.5 text-[var(--paper-foreground)]">
              {t('project.edit.status')}
            </label>
            <select
              id="project-status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
              className="research-input w-full rounded-lg px-3 py-2 text-base"
            >
              {getProjectStatusControlOptions(project.status, user?.role === 'admin').map((option) => (
                <option key={option.value} value={option.value} disabled={option.disabled}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Hint about visibility */}
          <div className="research-tint-lavender rounded-lg border p-3 text-base">
            <p>{t('project.edit.visibilityHint')}</p>
          </div>

          {/* Error */}
          {error && (
            <div className="research-error rounded-lg p-3 text-base">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="research-button flex-1 rounded-full px-4 py-2 text-base font-medium"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="research-button-primary flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-base font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {t('common.save')}
            </button>
          </div>
        </form>
        </div>
      </Dialog>

      <ResearchConfirmDialog
        open={isAdvanceConfirmationOpen}
        title="确认推进课题阶段？"
        description="推进后你将无法自行回退，只有管理员可以回退课题进度。请确认当前阶段工作已经完成。"
        confirmLabel="仍然推进"
        cancelLabel="再想想"
        isPending={isLoading}
        onCancel={() => setIsAdvanceConfirmationOpen(false)}
        onConfirm={() => {
          setIsAdvanceConfirmationOpen(false);
          void submitProjectUpdate();
        }}
      />
    </>
  );
}
