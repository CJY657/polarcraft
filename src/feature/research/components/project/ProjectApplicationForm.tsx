/**
 * Project Application Form Component
 * 课题申请表单组件
 */

import { useState, useEffect, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, X } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/utils/classNames';
import { Dialog } from '@/components/ui/dialog';
import { profileApi, UserEducation, PublicProject } from '@/lib/profile.service';

interface ProjectApplicationFormProps {
  isOpen: boolean;
  onClose: () => void;
  project: PublicProject | null;
  onSuccess?: () => void;
}

export function ProjectApplicationForm({
  isOpen,
  onClose,
  project,
  onSuccess,
}: ProjectApplicationFormProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { user } = useAuth();

  const [educations, setEducations] = useState<UserEducation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    display_name: '',
    organization: '',
    education_id: '',
    major: '',
    grade: '',
    research_experience: '',
    expertise: '',
    motivation: '',
    useProfile: true,
  });

  // Load user educations on mount
  useEffect(() => {
    if (isOpen) {
      profileApi.getUserEducations().then(setEducations).catch(console.error);
      // Pre-fill display name
      if (user?.username) {
        setFormData((prev) => ({ ...prev, display_name: user.username }));
      }
    }
  }, [isOpen, user?.username]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        display_name: user?.username || '',
        organization: '',
        education_id: '',
        major: '',
        grade: '',
        research_experience: '',
        expertise: '',
        motivation: '',
        useProfile: true,
      });
      setError('');
      setSuccess(false);
    }
  }, [isOpen, user?.username]);

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
    setIsLoading(true);

    if (!project) {
      setError('课题不存在');
      setIsLoading(false);
      return;
    }

    if (!formData.organization.trim()) {
      setError(t('project.create.organizationRequired') || '请输入单位');
      setIsLoading(false);
      return;
    }

    try {
      await profileApi.createApplication(project.id, {
        display_name: formData.display_name || user?.username || '',
        organization: formData.organization,
        education_id: formData.education_id || undefined,
        major: formData.major || undefined,
        grade: formData.grade || undefined,
        research_experience: formData.research_experience || undefined,
        expertise: formData.expertise || undefined,
        motivation: formData.motivation || undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!project) return null;

  return (
    <Dialog isOpen={isOpen} onClose={onClose} showCloseButton={false}>
      <div className={cn(
        "w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 rounded-xl",
        theme === "dark" ? "bg-gray-800" : "bg-white"
      )}>
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className={cn(
              "text-xl font-bold",
              theme === "dark" ? "text-white" : "text-gray-900"
            )}>
              {t('project.application.title')}
            </h2>
            <p className={cn(
              "text-sm mt-1",
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            )}>
              {project.name_zh}
            </p>
          </div>
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

        {/* Recruitment requirements */}
        {project.recruitment_requirements && (
          <div className={cn(
            "mb-4 p-3 rounded-lg",
            theme === "dark" ? "bg-blue-900/30 text-blue-300" : "bg-blue-50 text-blue-700"
          )}>
            <div className="font-medium mb-1">{t('project.settings.recruitmentRequirements')}</div>
            <div className="text-sm whitespace-pre-wrap">{project.recruitment_requirements}</div>
          </div>
        )}

        {/* Success message */}
        {success ? (
          <div className={cn(
            "p-6 rounded-lg text-center",
            theme === "dark" ? "bg-green-900/30 text-green-400" : "bg-green-50 text-green-600"
          )}>
            <div className="text-lg font-medium mb-2">
              {project.require_approval
                ? t('project.application.success')
                : t('project.application.successAutoApproved')}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Display Name */}
            <div>
              <label className={cn(
                "block text-sm font-medium mb-1.5",
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              )}>
                {t('project.application.form.displayName')}
              </label>
              <input
                type="text"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder={t('project.application.form.displayNamePlaceholder')}
                className={cn(
                  "w-full px-3 py-2 rounded-lg border transition-colors",
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500"
                )}
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
                  <span className={cn(
                    "text-sm",
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  )}>
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
                  <span className={cn(
                    "text-sm",
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  )}>
                    {t('project.application.form.enterManually')}
                  </span>
                </label>
              </div>
            )}

            {formData.useProfile && educations.length > 0 ? (
              <div>
                <label className={cn(
                  "block text-sm font-medium mb-1.5",
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                )}>
                  {t('project.application.form.organization')}
                </label>
                <select
                  value={formData.education_id}
                  onChange={(e) => setFormData({ ...formData, education_id: e.target.value })}
                  className={cn(
                    "w-full px-3 py-2 rounded-lg border transition-colors",
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                      : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                  )}
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
                  <label className={cn(
                    "block text-sm font-medium mb-1.5",
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  )}>
                    {t('project.application.form.organization')} *
                  </label>
                  <input
                    type="text"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    className={cn(
                      "w-full px-3 py-2 rounded-lg border transition-colors",
                      theme === "dark"
                        ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                        : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                    )}
                  />
                </div>

                <div>
                  <label className={cn(
                    "block text-sm font-medium mb-1.5",
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  )}>
                    {t('project.application.form.major')}
                  </label>
                  <input
                    type="text"
                    value={formData.major}
                    onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                    className={cn(
                      "w-full px-3 py-2 rounded-lg border transition-colors",
                      theme === "dark"
                        ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                        : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                    )}
                  />
                </div>
              </>
            )}

            {/* Grade */}
            <div>
              <label className={cn(
                "block text-sm font-medium mb-1.5",
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              )}>
                {t('project.application.form.grade')}
              </label>
              <input
                type="text"
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                placeholder={t('project.application.form.gradePlaceholder')}
                className={cn(
                  "w-full px-3 py-2 rounded-lg border transition-colors",
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500"
                )}
              />
            </div>

            {/* Research Experience */}
            <div>
              <label className={cn(
                "block text-sm font-medium mb-1.5",
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              )}>
                {t('project.application.form.researchExperience')}
              </label>
              <textarea
                value={formData.research_experience}
                onChange={(e) => setFormData({ ...formData, research_experience: e.target.value })}
                placeholder={t('project.application.form.researchExperiencePlaceholder')}
                rows={3}
                className={cn(
                  "w-full px-3 py-2 rounded-lg border transition-colors resize-none",
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500"
                )}
              />
            </div>

            {/* Expertise */}
            <div>
              <label className={cn(
                "block text-sm font-medium mb-1.5",
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              )}>
                {t('project.application.form.expertise')}
              </label>
              <textarea
                value={formData.expertise}
                onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
                placeholder={t('project.application.form.expertisePlaceholder')}
                rows={2}
                className={cn(
                  "w-full px-3 py-2 rounded-lg border transition-colors resize-none",
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500"
                )}
              />
            </div>

            {/* Motivation */}
            <div>
              <label className={cn(
                "block text-sm font-medium mb-1.5",
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              )}>
                {t('project.application.form.motivation')}
              </label>
              <textarea
                value={formData.motivation}
                onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                placeholder={t('project.application.form.motivationPlaceholder')}
                rows={3}
                className={cn(
                  "w-full px-3 py-2 rounded-lg border transition-colors resize-none",
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500"
                )}
              />
            </div>

            {/* Error */}
            {error && (
              <div className={cn(
                "p-3 rounded-lg text-sm",
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
