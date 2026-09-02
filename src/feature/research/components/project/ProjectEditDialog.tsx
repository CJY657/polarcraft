/**
 * Project Edit Dialog Component
 * 课题编辑对话框组件
 */

import { useState, useEffect, FormEvent, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Save, Loader2 } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/utils/classNames';
import { Dialog } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { researchApi, type ResearchProject } from '@/lib/research.service';
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
  const { theme } = useTheme();
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
      <Dialog isOpen={isOpen} onClose={onClose}>
        <div className={cn(
        "w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 rounded-xl",
        theme === "dark" ? "bg-gray-800" : "bg-white"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className={cn(
            "text-xl font-bold",
            theme === "dark" ? "text-white" : "text-gray-900"
          )}>
            {t('project.edit.title')}
          </h2>
          <button
            onClick={onClose}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              theme === "dark"
                ? "hover:bg-gray-700 text-gray-400"
                : "hover:bg-gray-100 text-gray-500"
            )}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Project Name (Chinese) */}
          <div>
            <label className={cn(
              "block text-base font-medium mb-1.5",
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            )}>
              {t('lab.projectName')} (中文) *
            </label>
            <input
              type="text"
              value={formData.name_zh}
              onChange={(e) => setFormData({ ...formData, name_zh: e.target.value })}
              className={cn(
                "w-full px-3 py-2 rounded-lg border transition-colors",
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                  : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
              )}
            />
          </div>

          {/* Project Name (English) */}
          {/* <div>
            <label className={cn(
              "block text-base font-medium mb-1.5",
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            )}>
              {t('lab.projectName')} (English)
            </label>
            <input
              type="text"
              value={formData.name_en}
              onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
              className={cn(
                "w-full px-3 py-2 rounded-lg border transition-colors",
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                  : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
              )}
            />
          </div> */}

          {/* Description (Chinese) */}
          <div>
            <label className={cn(
              "block text-base font-medium mb-1.5",
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            )}>
              {t('lab.projectDescription')} (中文)
            </label>
            <textarea
              value={formData.description_zh}
              onChange={(e) => setFormData({ ...formData, description_zh: e.target.value })}
              rows={4}
              className={cn(
                "w-full px-3 py-2 rounded-lg border transition-colors resize-none",
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                  : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
              )}
            />
          </div>

          <div>
            <label className={cn(
              "block text-base font-medium mb-1.5",
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            )}>
              研究问题（中文，每行一个）
            </label>
            <textarea
              ref={questionsInputRef}
              aria-label="研究问题（中文，每行一个）"
              value={formData.research_questions_zh}
              onChange={(e) => setFormData({ ...formData, research_questions_zh: e.target.value })}
              rows={3}
              className={cn(
                "w-full px-3 py-2 rounded-lg border transition-colors resize-none",
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                  : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
              )}
            />
          </div>

          <div>
            <label className={cn(
              "block text-base font-medium mb-1.5",
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            )}>
              研究假设（中文，每行一个）
            </label>
            <textarea
              value={formData.research_hypotheses_zh}
              onChange={(e) => setFormData({ ...formData, research_hypotheses_zh: e.target.value })}
              rows={3}
              className={cn(
                "w-full px-3 py-2 rounded-lg border transition-colors resize-none",
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                  : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
              )}
            />
          </div>

          <div>
            <label className={cn(
              "block text-base font-medium mb-1.5",
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            )}>
              基础问题与实验（中文）
            </label>
            <textarea
              value={formData.basic_plan_zh}
              onChange={(e) => setFormData({ ...formData, basic_plan_zh: e.target.value })}
              rows={3}
              className={cn(
                "w-full px-3 py-2 rounded-lg border transition-colors resize-none",
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                  : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
              )}
            />
          </div>

          <div>
            <label className={cn(
              "block text-base font-medium mb-1.5",
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            )}>
              拓展问题、假设与实验（中文）
            </label>
            <textarea
              value={formData.extended_plan_zh}
              onChange={(e) => setFormData({ ...formData, extended_plan_zh: e.target.value })}
              rows={3}
              className={cn(
                "w-full px-3 py-2 rounded-lg border transition-colors resize-none",
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                  : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
              )}
            />
          </div>

          <ProjectIssueFieldsEditor
            value={formData}
            onChange={setFormData}
            theme={theme}
          />

          {/* Description (English) */}
          {/* <div>
            <label className={cn(
              "block text-base font-medium mb-1.5",
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            )}>
              {t('lab.projectDescription')} (English)
            </label>
            <textarea
              value={formData.description_en}
              onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
              rows={4}
              className={cn(
                "w-full px-3 py-2 rounded-lg border transition-colors resize-none",
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                  : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
              )}
            />
          </div> */}

          {/* Status */}
          <div>
            <label htmlFor="project-status" className={cn(
              "block text-base font-medium mb-1.5",
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            )}>
              {t('project.edit.status')}
            </label>
            <select
              id="project-status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
              className={cn(
                "w-full px-3 py-2 rounded-lg border transition-colors",
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                  : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
              )}
            >
              {getProjectStatusControlOptions(project.status, user?.role === 'admin').map((option) => (
                <option key={option.value} value={option.value} disabled={option.disabled}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Hint about visibility */}
          <div className={cn(
            "p-3 rounded-lg text-base",
            theme === "dark" ? "bg-blue-900/30 text-blue-300" : "bg-blue-50 text-blue-700"
          )}>
            <p>{t('project.edit.visibilityHint')}</p>
          </div>

          {/* Error */}
          {error && (
            <div className={cn(
              "p-3 rounded-lg text-base",
              theme === "dark" ? "bg-red-900/30 text-red-400" : "bg-red-50 text-red-600"
            )}>
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className={cn(
                "flex-1 px-4 py-2 rounded-lg font-medium transition-colors",
                theme === "dark"
                  ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              )}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2",
                theme === "dark"
                  ? "bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                  : "bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
              )}
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

      <ConfirmDialog
        open={isAdvanceConfirmationOpen}
        title="确认推进课题阶段？"
        description="推进后你将无法自行回退，只有管理员可以回退课题进度。请确认当前阶段工作已经完成。"
        confirmLabel="仍然推进"
        cancelLabel="再想想"
        isPending={isLoading}
        theme={theme}
        onCancel={() => setIsAdvanceConfirmationOpen(false)}
        onConfirm={() => {
          setIsAdvanceConfirmationOpen(false);
          void submitProjectUpdate();
        }}
      />
    </>
  );
}
