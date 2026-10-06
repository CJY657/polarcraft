/**
 * Create Project Wizard Component
 * 创建课题向导组件
 */

import { useState, useEffect, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/utils/classNames';
import { Dialog } from '@/components/ui/dialog';
import { ResearchDialogHead, RESEARCH_DIALOG_PANEL } from '../shared/ResearchDialog';
import { profileApi, UserEducation, CreateProjectSettingsInput } from '@/lib/profile.service';
import { formatUserIdentity } from '@/lib/identity';
import { capturePostHogEvent } from '@/lib/posthog';
import TopicReferenceTextarea from '../shared/TopicReferenceTextarea';
import {
  ProjectIssueFieldsEditor,
  emptyProjectIssueFields,
} from './ProjectIssueFieldsEditor';

interface CreateProjectWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (projectId: string) => void;
}

type Step = 1 | 2 | 3;

export function CreateProjectWizard({ isOpen, onClose, onSuccess }: CreateProjectWizardProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [educations, setEducations] = useState<UserEducation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [projectData, setProjectData] = useState({
    name_zh: '',
    name_en: '',
    description_zh: '',
    description_en: '',
    research_questions_zh: '',
    research_hypotheses_zh: '',
    basic_plan_zh: '',
    extended_plan_zh: '',
    ...emptyProjectIssueFields,
    is_public: false,
  });

  const [creatorData, setCreatorData] = useState({
    organization: '',
    education_id: '',
    major: '',
    grade: '',
    useProfile: true,
  });

  const [settings, setSettings] = useState<CreateProjectSettingsInput>({
    visibility: 'private',
    require_approval: true,
    recruitment_requirements: '',
    max_members: undefined,
    is_recruiting: true,
  });

  // Load user educations on mount
  useEffect(() => {
    if (isOpen) {
      profileApi.getUserEducations().then(setEducations).catch(console.error);
    }
  }, [isOpen]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setProjectData({
        name_zh: '',
        name_en: '',
        description_zh: '',
        description_en: '',
        research_questions_zh: '',
        research_hypotheses_zh: '',
        basic_plan_zh: '',
        extended_plan_zh: '',
        ...emptyProjectIssueFields,
        is_public: false,
      });
      setCreatorData({
        organization: '',
        education_id: '',
        major: '',
        grade: '',
        useProfile: true,
      });
      setSettings({
        visibility: 'private',
        require_approval: true,
        recruitment_requirements: '',
        max_members: undefined,
        is_recruiting: true,
      });
      setError('');
    }
  }, [isOpen]);

  // Update creator data when education is selected
  useEffect(() => {
    if (creatorData.useProfile && creatorData.education_id) {
      const selected = educations.find((e) => e.id === creatorData.education_id);
      if (selected) {
        setCreatorData((prev) => ({
          ...prev,
          organization: selected.organization,
          major: selected.major,
        }));
      }
    }
  }, [creatorData.education_id, creatorData.useProfile, educations]);

  const handleNext = () => {
    if (currentStep === 1) {
      if (!projectData.name_zh.trim()) {
        setError(t('project.create.nameRequired') || '请输入课题名称');
        return;
      }
    } else if (currentStep === 2) {
      if (!creatorData.organization.trim()) {
        setError(t('project.create.organizationRequired') || '请输入单位');
        return;
      }
    }
    setError('');
    setCurrentStep((prev) => Math.min(prev + 1, 3) as Step);
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1) as Step);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await profileApi.createProjectWithProfile({
        project: projectData,
        creatorProfile: {
          display_name: formatUserIdentity(user, '') || undefined,
          organization: creatorData.organization,
          education_id: creatorData.education_id || undefined,
          major: creatorData.major || undefined,
          grade: creatorData.grade || undefined,
        },
        settings,
      });

      capturePostHogEvent('research_project_created', {
        project_id: result.id,
        project_name_zh: projectData.name_zh,
      });

      onClose();
      if (onSuccess) {
        onSuccess(result.id);
      } else {
        navigate(`/lab/projects/${result.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const stepLabels = [
    t('project.create.step1'),
    t('project.create.step2'),
    t('project.create.step3'),
  ];

  return (
    <Dialog isOpen={isOpen} onClose={onClose} containerClassName="items-end sm:items-center">
      <div className={cn(RESEARCH_DIALOG_PANEL, "max-h-[min(92dvh,90vh)] overflow-y-auto rounded-t-[1.25rem] p-6 sm:rounded-xl")}>
        <ResearchDialogHead
          title={t('project.create.title')}
          onClose={onClose}
          className="-mx-6 -mt-6 mb-6"
        />

        {/* Step indicators */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {stepLabels.map((label, index) => {
            const stepState =
              currentStep > index + 1 ? "completed" : currentStep === index + 1 ? "current" : "upcoming";
            return (
              <div key={index} className="flex items-center" data-state={stepState}>
                <span className="research-step-dot" aria-hidden="true">
                  {stepState === "completed" ? (
                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                  ) : (
                    index + 1
                  )}
                </span>
                <span
                  className={cn(
                    "ml-2 text-base",
                    stepState === "current"
                      ? "font-bold text-[var(--paper-foreground)]"
                      : stepState === "completed"
                      ? "font-medium text-[var(--paper-foreground)]"
                      : "font-medium text-[var(--research-muted)]"
                  )}
                >
                  {label}
                </span>
                {index < 2 && <ChevronRight className="mx-2 h-4 w-4 text-[var(--research-muted)]" />}
              </div>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="research-error mb-4 rounded-lg p-3 text-base">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-base font-medium mb-1.5 text-[var(--paper-foreground)]">
                  {t('lab.projectName')} (中文) *
                </label>
                <input
                  type="text"
                  value={projectData.name_zh}
                  onChange={(e) => setProjectData({ ...projectData, name_zh: e.target.value })}
                  className="research-input w-full rounded-lg px-3 py-2 text-base"
                />
              </div>

              {/* <div>
                <label className="block text-base font-medium mb-1.5 text-[var(--paper-foreground)]">
                  {t('lab.projectName')} (English)
                </label>
                <input
                  type="text"
                  value={projectData.name_en}
                  onChange={(e) => setProjectData({ ...projectData, name_en: e.target.value })}
                  className="research-input w-full rounded-lg px-3 py-2 text-base"
                />
              </div> */}

              <div>
                <label className="block text-base font-medium mb-1.5 text-[var(--paper-foreground)]">
                  {t('lab.projectDescription')} (中文)
                </label>
                <TopicReferenceTextarea
                  value={projectData.description_zh}
                  onValueChange={(description_zh) => setProjectData({ ...projectData, description_zh })}
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
                  value={projectData.research_questions_zh}
                  onChange={(e) => setProjectData({ ...projectData, research_questions_zh: e.target.value })}
                  rows={3}
                  placeholder="例如：气泡条纹与膜厚变化是否相关？"
                  className="research-input w-full resize-none rounded-lg px-3 py-2 text-base"
                />
              </div>

              <div>
                <label className="block text-base font-medium mb-1.5 text-[var(--paper-foreground)]">
                  研究假设（中文，每行一个）
                </label>
                <textarea
                  value={projectData.research_hypotheses_zh}
                  onChange={(e) => setProjectData({ ...projectData, research_hypotheses_zh: e.target.value })}
                  rows={3}
                  placeholder="例如：明暗图样由球面几何与线偏振耦合产生。"
                  className="research-input w-full resize-none rounded-lg px-3 py-2 text-base"
                />
              </div>

              <div>
                <label className="block text-base font-medium mb-1.5 text-[var(--paper-foreground)]">
                  基础问题与实验（中文）
                </label>
                <textarea
                  value={projectData.basic_plan_zh}
                  onChange={(e) => setProjectData({ ...projectData, basic_plan_zh: e.target.value })}
                  rows={3}
                  placeholder="记录基础实验、变量和第一轮问题。"
                  className="research-input w-full resize-none rounded-lg px-3 py-2 text-base"
                />
              </div>

              <div>
                <label className="block text-base font-medium mb-1.5 text-[var(--paper-foreground)]">
                  拓展问题、假设与实验（中文）
                </label>
                <textarea
                  value={projectData.extended_plan_zh}
                  onChange={(e) => setProjectData({ ...projectData, extended_plan_zh: e.target.value })}
                  rows={3}
                  placeholder="记录可继续验证的假设、延展实验和讨论线索。"
                  className="research-input w-full resize-none rounded-lg px-3 py-2 text-base"
                />
              </div>

              <ProjectIssueFieldsEditor
                value={projectData}
                onChange={setProjectData}
              />
            </div>
          )}

          {/* Step 2: Creator Info */}
          {currentStep === 2 && (
            <div className="space-y-4">
              {/* Organization selector */}
              {educations.length > 0 && (
                <div className="flex items-center gap-4 mb-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={creatorData.useProfile}
                      onChange={() => setCreatorData({ ...creatorData, useProfile: true })}
                      className="w-4 h-4"
                    />
                    <span className="text-base text-[var(--paper-foreground)]">
                      {t('project.application.form.selectFromProfile')}
                    </span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={!creatorData.useProfile}
                      onChange={() => setCreatorData({ ...creatorData, useProfile: false })}
                      className="w-4 h-4"
                    />
                    <span className="text-base text-[var(--paper-foreground)]">
                      {t('project.application.form.enterManually')}
                    </span>
                  </label>
                </div>
              )}

              {creatorData.useProfile && educations.length > 0 ? (
                <div>
                  <label className="block text-base font-medium mb-1.5 text-[var(--paper-foreground)]">
                    {t('project.application.form.organization')}
                  </label>
                  <select
                    value={creatorData.education_id}
                    onChange={(e) => setCreatorData({ ...creatorData, education_id: e.target.value })}
                    className="research-input w-full rounded-lg px-3 py-2 text-base"
                  >
                    <option value="">{t('common.select')}</option>
                    {educations.map((edu) => (
                      <option key={edu.id} value={edu.id}>
                        {edu.organization} - {edu.major}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-base font-medium mb-1.5 text-[var(--paper-foreground)]">
                      {t('project.application.form.organization')} *
                    </label>
                    <input
                      type="text"
                      value={creatorData.organization}
                      onChange={(e) => setCreatorData({ ...creatorData, organization: e.target.value })}
                      className="research-input w-full rounded-lg px-3 py-2 text-base"
                    />
                  </div>

                  <div>
                    <label className="block text-base font-medium mb-1.5 text-[var(--paper-foreground)]">
                      {t('project.application.form.major')}
                    </label>
                    <input
                      type="text"
                      value={creatorData.major}
                      onChange={(e) => setCreatorData({ ...creatorData, major: e.target.value })}
                      className="research-input w-full rounded-lg px-3 py-2 text-base"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-base font-medium mb-1.5 text-[var(--paper-foreground)]">
                  {t('project.application.form.grade')}
                </label>
                <input
                  type="text"
                  value={creatorData.grade}
                  onChange={(e) => setCreatorData({ ...creatorData, grade: e.target.value })}
                  placeholder={t('project.application.form.gradePlaceholder')}
                  className="research-input w-full rounded-lg px-3 py-2 text-base"
                />
              </div>
            </div>
          )}

          {/* Step 3: Settings */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-base font-medium mb-1.5 text-[var(--paper-foreground)]">
                  {t('project.settings.visibility')}
                </label>
                <select
                  value={settings.visibility}
                  onChange={(e) => setSettings({ ...settings, visibility: e.target.value as any })}
                  className="research-input w-full rounded-lg px-3 py-2 text-base"
                >
                  <option value="private">{t('project.settings.private')}</option>
                  <option value="public">{t('project.settings.public')}</option>
                  <option value="invite_only">{t('project.settings.inviteOnly')}</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="require_approval"
                  checked={settings.require_approval}
                  onChange={(e) => setSettings({ ...settings, require_approval: e.target.checked })}
                  className="w-4 h-4"
                />
                <label
                  htmlFor="require_approval"
                  className="text-base text-[var(--paper-foreground)]"
                >
                  {t('project.settings.requireApproval')}
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_recruiting"
                  checked={settings.is_recruiting}
                  onChange={(e) => setSettings({ ...settings, is_recruiting: e.target.checked })}
                  className="w-4 h-4"
                />
                <label
                  htmlFor="is_recruiting"
                  className="text-base text-[var(--paper-foreground)]"
                >
                  {t('project.settings.isRecruiting')}
                </label>
              </div>

              <div>
                <label className="block text-base font-medium mb-1.5 text-[var(--paper-foreground)]">
                  {t('project.settings.recruitmentRequirements')}
                </label>
                <textarea
                  value={settings.recruitment_requirements || ''}
                  onChange={(e) => setSettings({ ...settings, recruitment_requirements: e.target.value })}
                  placeholder={t('project.settings.recruitmentRequirementsPlaceholder')}
                  rows={3}
                  className="research-input w-full resize-none rounded-lg px-3 py-2 text-base"
                />
              </div>

              <div>
                <label className="block text-base font-medium mb-1.5 text-[var(--paper-foreground)]">
                  {t('project.settings.maxMembers')}
                </label>
                <input
                  type="number"
                  min="1"
                  value={settings.max_members || ''}
                  onChange={(e) => setSettings({ ...settings, max_members: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder={t('project.settings.maxMembersPlaceholder')}
                  className="research-input w-full rounded-lg px-3 py-2 text-base"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 flex justify-between border-t border-[var(--research-line)] pt-4">
            <button
              type="button"
              onClick={currentStep === 1 ? onClose : handleBack}
              disabled={isLoading}
              className="research-button rounded-full px-4 py-2 text-base font-medium"
            >
              {currentStep === 1 ? t('common.cancel') : (
                <span className="flex items-center gap-1">
                  <ChevronLeft className="w-4 h-4" />
                  {t('common.back')}
                </span>
              )}
            </button>

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={isLoading}
                className="research-button-primary rounded-full px-4 py-2 text-base font-medium text-white"
              >
                <span className="flex items-center gap-1">
                  {t('common.next')}
                  <ChevronRight className="w-4 h-4" />
                </span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className="research-button-primary rounded-full px-4 py-2 text-base font-medium text-white"
              >
                {isLoading ? t('common.saving') : t('lab.createProject')}
              </button>
            )}
          </div>
        </form>
      </div>
    </Dialog>
  );
}
