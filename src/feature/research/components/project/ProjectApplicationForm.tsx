/**
 * Project Application Form Component
 * 课题申请表单组件
 */

import { useState, useEffect, useMemo, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/utils/classNames';
import { Dialog } from '@/components/ui/dialog';
import { ResearchDialogHead, RESEARCH_DIALOG_PANEL } from '../shared/ResearchDialog';
import { profileApi, UserEducation, PublicProject } from '@/lib/profile.service';
import { formatUserIdentity } from '@/lib/identity';
import { capturePostHogEvent } from '@/lib/posthog';
import { getProjectIssueRoleOptions } from './projectIssue';
import { getProjectRoleBadgeStyle } from './ProjectRoleBadge';

interface ProjectApplicationFormProps {
  isOpen: boolean;
  onClose: () => void;
  project: PublicProject | null;
  onSuccess?: () => void;
}

const CLOSED_RECRUITMENT_TITLE = '招募已停止';
const CLOSED_RECRUITMENT_MESSAGE = '该课题组已停止招募，暂时不能申请加入。';

function isClosedRecruitmentError(err: unknown) {
  if (!(err instanceof Error)) return false;
  return err.message.includes('暂未招募') || err.message.includes('NOT_RECRUITING');
}

export function ProjectApplicationForm({
  isOpen,
  onClose,
  project,
  onSuccess,
}: ProjectApplicationFormProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isRecruitmentClosed = project?.is_recruiting === false;
  const roleOptions = useMemo(() => project ? getProjectIssueRoleOptions(project) : [], [project]);
  const defaultRole = roleOptions[0]?.value || '';
  const userDisplayName = useMemo(
    () => formatUserIdentity(user, ''),
    [user?.nickname, user?.real_name, user?.show_real_name_publicly, user?.username]
  );

  const [educations, setEducations] = useState<UserEducation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    organization: '',
    education_id: '',
    major: '',
    grade: '',
    desired_role: '',
    proposed_contribution: '',
    weekly_time_commitment: '',
    research_experience: '',
    expertise: '',
    motivation: '',
    useProfile: true,
  });

  // Load user educations on mount
  useEffect(() => {
    if (isOpen) {
      if (isRecruitmentClosed) {
        setEducations([]);
        return;
      }

      profileApi.getUserEducations().then(setEducations).catch(console.error);
    }
  }, [isOpen, isRecruitmentClosed]);

  useEffect(() => {
    if (!isOpen || !project || isRecruitmentClosed) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      desired_role: defaultRole,
    }));
  }, [defaultRole, isOpen, isRecruitmentClosed, project?.id]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        organization: '',
        education_id: '',
        major: '',
        grade: '',
        desired_role: '',
        proposed_contribution: '',
        weekly_time_commitment: '',
        research_experience: '',
        expertise: '',
        motivation: '',
        useProfile: true,
      });
      setError('');
      setSuccess(false);
    }
  }, [isOpen]);

  // Update form data when education is selected
  useEffect(() => {
    if (formData.useProfile && formData.education_id) {
      const selected = educations.find((e) => e.id === formData.education_id);
      if (selected) {
        setFormData((prev) => ({
          ...prev,
          organization: selected.organization,
          major: selected.major,
        }));
      }
    }
  }, [formData.education_id, formData.useProfile, educations]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!project) {
      setError('课题不存在');
      return;
    }

    if (project.is_recruiting === false) {
      setError(CLOSED_RECRUITMENT_MESSAGE);
      return;
    }

    if (!formData.desired_role.trim()) {
      setError('请填写想承担的角色');
      return;
    }

    if (!formData.proposed_contribution.trim()) {
      setError('请填写你可以贡献的内容');
      return;
    }

    if (!formData.weekly_time_commitment.trim()) {
      setError('请填写每周可投入时间');
      return;
    }

    if (!formData.organization.trim()) {
      setError(t('project.create.organizationRequired') || '请输入单位');
      return;
    }

    setIsLoading(true);

    try {
      await profileApi.createApplication(project.id, {
        display_name: userDisplayName || undefined,
        organization: formData.organization,
        desired_role: formData.desired_role.trim(),
        proposed_contribution: formData.proposed_contribution.trim(),
        weekly_time_commitment: formData.weekly_time_commitment.trim(),
        education_id: formData.education_id || undefined,
        major: formData.major || undefined,
        grade: formData.grade || undefined,
        research_experience: formData.research_experience || undefined,
        expertise: formData.expertise || undefined,
        motivation: formData.motivation || undefined,
      });

      capturePostHogEvent('project_application_submitted', {
        project_id: project.id,
        project_name_zh: project.name_zh,
        project_name_en: project.name_en || undefined,
        require_approval: project.require_approval,
        organization: formData.organization,
        desired_role: formData.desired_role.trim(),
        weekly_time_commitment: formData.weekly_time_commitment.trim(),
        has_education_id: Boolean(formData.education_id),
        used_profile_education: formData.useProfile,
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err) {
      setError(isClosedRecruitmentError(err) ? CLOSED_RECRUITMENT_MESSAGE : err instanceof Error ? err.message : t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!project) return null;

  return (
    <Dialog isOpen={isOpen} onClose={onClose} containerClassName="items-end sm:items-center">
      <div className={cn(RESEARCH_DIALOG_PANEL, "max-w-lg max-h-[min(92dvh,90vh)] overflow-y-auto rounded-t-[1.25rem] p-6 sm:rounded-xl")}>
        <ResearchDialogHead
          title={t('project.application.title')}
          note={project.name_zh}
          onClose={onClose}
          closeLabel="关闭申请弹窗"
          className="-mx-6 -mt-6 mb-6"
        />

        {/* Recruitment requirements */}
        {project.recruitment_requirements && (
          <div className="research-tint-lavender mb-4 rounded-lg border p-3">
            <div className="font-medium mb-1">{t('project.settings.recruitmentRequirements')}</div>
            <div className="text-base whitespace-pre-wrap">{project.recruitment_requirements}</div>
          </div>
        )}

        {/* Success message */}
        {isRecruitmentClosed ? (
          <div className="space-y-5">
            <div className="research-tint-ochre rounded-2xl border-[1.5px] p-4 text-[var(--paper-foreground)]">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--research-chip)]">
                  <AlertTriangle className="h-5 w-5 text-[var(--clay-ochre)]" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold">{CLOSED_RECRUITMENT_TITLE}</h3>
                  <p className="mt-1 text-base leading-6">{CLOSED_RECRUITMENT_MESSAGE}</p>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="research-button min-h-11 w-full rounded-full px-4 py-2.5 text-base font-semibold"
            >
              关闭
            </button>
          </div>
        ) : success ? (
          <div className="research-tint-mint rounded-lg border p-6 text-center">
            <div className="text-lg font-medium mb-2">
              {project.require_approval
                ? t('project.application.success')
                : t('project.application.successAutoApproved')}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <p className="block text-base font-medium mb-1.5 text-[var(--paper-foreground)]">
                想承担的角色 *
              </p>
              {roleOptions.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2" aria-label="可申请角色">
                  {roleOptions.map((option, index) => {
                    const isSelected = formData.desired_role === option.value;

                    return (
                      <button
                        key={option.id}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => setFormData({ ...formData, desired_role: option.value })}
                        className={cn(
                          "min-h-10 rounded-full border px-3 py-1.5 text-sm font-semibold transition-all",
                          isSelected && "shadow-[0_8px_18px_rgba(15,23,42,0.12)]"
                        )}
                        style={getProjectRoleBadgeStyle(index, { selected: isSelected })}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              )}
              <label className={cn(
                "mb-1.5 block text-sm font-medium text-[var(--research-muted)]",
                roleOptions.length === 0 && "sr-only"
              )}>
                {roleOptions.length > 0 ? "其他角色" : "想承担的角色"}
              </label>
              <input
                type="text"
                value={formData.desired_role}
                onChange={(e) => setFormData({ ...formData, desired_role: e.target.value })}
                placeholder="例如：观察记录员、数据整理员、实验复核员"
                className="research-input w-full rounded-lg px-3 py-2 text-base"
              />
            </div>

            <div>
              <label className="block text-base font-medium mb-1.5 text-[var(--paper-foreground)]">
                你可以贡献什么 *
              </label>
              <textarea
                value={formData.proposed_contribution}
                onChange={(e) => setFormData({ ...formData, proposed_contribution: e.target.value })}
                placeholder="说明你能承担的任务、已有经验或想练习的能力。"
                rows={3}
                className="research-input w-full resize-none rounded-lg px-3 py-2 text-base"
              />
            </div>

            <div>
              <label className="block text-base font-medium mb-1.5 text-[var(--paper-foreground)]">
                每周可投入时间 *
              </label>
              <input
                type="text"
                value={formData.weekly_time_commitment}
                onChange={(e) => setFormData({ ...formData, weekly_time_commitment: e.target.value })}
                placeholder="例如：每周 2-3 小时，周末可集中整理"
                className="research-input w-full rounded-lg px-3 py-2 text-base"
              />
            </div>

            {/* Organization selector */}
            {educations.length > 0 && (
              <div className="flex items-center gap-4 mb-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={formData.useProfile}
                    onChange={() => setFormData({ ...formData, useProfile: true })}
                    className="w-4 h-4"
                  />
                  <span className="text-base text-[var(--paper-foreground)]">
                    {t('project.application.form.selectFromProfile')}
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={!formData.useProfile}
                    onChange={() => setFormData({ ...formData, useProfile: false })}
                    className="w-4 h-4"
                  />
                  <span className="text-base text-[var(--paper-foreground)]">
                    {t('project.application.form.enterManually')}
                  </span>
                </label>
              </div>
            )}

            {formData.useProfile && educations.length > 0 ? (
              <div>
                <label className="block text-base font-medium mb-1.5 text-[var(--paper-foreground)]">
                  {t('project.application.form.organization')}
                </label>
                <select
                  value={formData.education_id}
                  onChange={(e) => setFormData({ ...formData, education_id: e.target.value })}
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
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    className="research-input w-full rounded-lg px-3 py-2 text-base"
                  />
                </div>

                <div>
                  <label className="block text-base font-medium mb-1.5 text-[var(--paper-foreground)]">
                    {t('project.application.form.major')}
                  </label>
                  <input
                    type="text"
                    value={formData.major}
                    onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                    className="research-input w-full rounded-lg px-3 py-2 text-base"
                  />
                </div>
              </>
            )}

            {/* Grade */}
            <div>
              <label className="block text-base font-medium mb-1.5 text-[var(--paper-foreground)]">
                {t('project.application.form.grade')}
              </label>
              <input
                type="text"
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                placeholder={t('project.application.form.gradePlaceholder')}
                className="research-input w-full rounded-lg px-3 py-2 text-base"
              />
            </div>

            {/* Research Experience */}
            <div>
              <label className="block text-base font-medium mb-1.5 text-[var(--paper-foreground)]">
                {t('project.application.form.researchExperience')}
              </label>
              <textarea
                value={formData.research_experience}
                onChange={(e) => setFormData({ ...formData, research_experience: e.target.value })}
                placeholder={t('project.application.form.researchExperiencePlaceholder')}
                rows={3}
                className="research-input w-full resize-none rounded-lg px-3 py-2 text-base"
              />
            </div>

            {/* Expertise */}
            <div>
              <label className="block text-base font-medium mb-1.5 text-[var(--paper-foreground)]">
                {t('project.application.form.expertise')}
              </label>
              <textarea
                value={formData.expertise}
                onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
                placeholder={t('project.application.form.expertisePlaceholder')}
                rows={2}
                className="research-input w-full resize-none rounded-lg px-3 py-2 text-base"
              />
            </div>

            {/* Motivation */}
            <div>
              <label className="block text-base font-medium mb-1.5 text-[var(--paper-foreground)]">
                {t('project.application.form.motivation')}
              </label>
              <textarea
                value={formData.motivation}
                onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                placeholder={t('project.application.form.motivationPlaceholder')}
                rows={3}
                className="research-input w-full resize-none rounded-lg px-3 py-2 text-base"
              />
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
                  t('common.loading')
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {t('project.application.submit')}
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </Dialog>
  );
}
