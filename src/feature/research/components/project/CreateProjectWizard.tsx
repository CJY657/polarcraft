/**
 * Create Project Wizard Component
 * 创建项目向导组件
 */

import { useState, useEffect, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Check, Info } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/utils/classNames';
import { Dialog } from '@/components/ui/Dialog';
import { profileApi, UserEducation, CreateProjectSettingsInput } from '@/lib/profile.service';
import { researchApi } from '@/lib/research.service';

interface CreateProjectWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (projectId: string) => void;
}

type Step = 1 | 2 | 3;

export function CreateProjectWizard({ isOpen, onClose, onSuccess }: CreateProjectWizardProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
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
    is_public: false,
  });

  const [creatorData, setCreatorData] = useState({
    display_name: '',
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
      // Pre-fill display name
      if (user?.username) {
        setCreatorData((prev) => ({ ...prev, display_name: user.username }));
      }
    }
  }, [isOpen, user?.username]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setProjectData({
        name_zh: '',
        name_en: '',
        description_zh: '',
        description_en: '',
        is_public: false,
      });
      setCreatorData({
        display_name: user?.username || '',
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
  }, [isOpen, user?.username]);

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
        setError(t('project.create.nameRequired') || '请输入项目名称');
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
          display_name: creatorData.display_name || user?.username,
          organization: creatorData.organization,
          education_id: creatorData.education_id || undefined,
          major: creatorData.major || undefined,
          grade: creatorData.grade || undefined,
        },
        settings,
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
    <Dialog isOpen={isOpen} onClose={onClose} showCloseButton={false}>
      <div className={cn(
        "w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-xl",
        theme === "dark" ? "bg-gray-800" : "bg-white"
      )}>
        {/* Header */}
        <div className="mb-6">
          <h2 className={cn(
            "text-2xl font-bold",
            theme === "dark" ? "text-white" : "text-gray-900"
          )}>
            {t('project.create.title')}
          </h2>

          {/* Step indicators */}
          <div className="flex items-center gap-2 mt-4">
            {stepLabels.map((label, index) => (
              <div key={index} className="flex items-center">
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors",
                  currentStep > index + 1
                    ? "bg-green-500 text-white"
                    : currentStep === index + 1
                    ? theme === "dark"
                      ? "bg-blue-600 text-white"
                      : "bg-blue-500 text-white"
                    : theme === "dark"
                    ? "bg-gray-700 text-gray-400"
                    : "bg-gray-200 text-gray-500"
                )}>
                  {currentStep > index + 1 ? <Check className="w-4 h-4" /> : index + 1}
                </div>
                <span className={cn(
                  "ml-2 text-sm",
                  currentStep === index + 1
                    ? theme === "dark" ? "text-white" : "text-gray-900"
                    : theme === "dark" ? "text-gray-400" : "text-gray-500"
                )}>
                  {label}
                </span>
                {index < 2 && (
                  <ChevronRight className={cn(
                    "w-4 h-4 mx-2",
                    theme === "dark" ? "text-gray-600" : "text-gray-300"
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className={cn(
            "mb-4 p-3 rounded-lg text-sm",
            theme === "dark" ? "bg-red-900/30 text-red-400" : "bg-red-50 text-red-600"
          )}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className={cn(
                  "block text-sm font-medium mb-1.5",
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                )}>
                  {t('lab.projectName')} (中文) *
                </label>
                <input
                  type="text"
                  value={projectData.name_zh}
                  onChange={(e) => setProjectData({ ...projectData, name_zh: e.target.value })}
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
                  {t('lab.projectName')} (English)
                </label>
                <input
                  type="text"
                  value={projectData.name_en}
                  onChange={(e) => setProjectData({ ...projectData, name_en: e.target.value })}
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
                  {t('lab.projectDescription')} (中文)
                </label>
                <textarea
                  value={projectData.description_zh}
                  onChange={(e) => setProjectData({ ...projectData, description_zh: e.target.value })}
                  rows={4}
                  className={cn(
                    "w-full px-3 py-2 rounded-lg border transition-colors resize-none",
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                      : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                  )}
                />
              </div>
            </div>
          )}

          {/* Step 2: Creator Info */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <label className={cn(
                  "block text-sm font-medium mb-1.5",
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                )}>
                  {t('project.application.form.displayName')}
                </label>
                <input
                  type="text"
                  value={creatorData.display_name}
                  onChange={(e) => setCreatorData({ ...creatorData, display_name: e.target.value })}
                  className={cn(
                    "w-full px-3 py-2 rounded-lg border transition-colors",
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                      : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                  )}
                />
              </div>

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
                      checked={!creatorData.useProfile}
                      onChange={() => setCreatorData({ ...creatorData, useProfile: false })}
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

              {creatorData.useProfile && educations.length > 0 ? (
                <div>
                  <label className={cn(
                    "block text-sm font-medium mb-1.5",
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  )}>
                    {t('project.application.form.organization')}
                  </label>
                  <select
                    value={creatorData.education_id}
                    onChange={(e) => setCreatorData({ ...creatorData, education_id: e.target.value })}
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
                      value={creatorData.organization}
                      onChange={(e) => setCreatorData({ ...creatorData, organization: e.target.value })}
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
                      value={creatorData.major}
                      onChange={(e) => setCreatorData({ ...creatorData, major: e.target.value })}
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

              <div>
                <label className={cn(
                  "block text-sm font-medium mb-1.5",
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                )}>
                  {t('project.application.form.grade')}
                </label>
                <input
                  type="text"
                  value={creatorData.grade}
                  onChange={(e) => setCreatorData({ ...creatorData, grade: e.target.value })}
                  placeholder={t('project.application.form.gradePlaceholder')}
                  className={cn(
                    "w-full px-3 py-2 rounded-lg border transition-colors",
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500"
                  )}
                />
              </div>
            </div>
          )}

          {/* Step 3: Settings */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <label className={cn(
                  "block text-sm font-medium mb-1.5",
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                )}>
                  {t('project.settings.visibility')}
                </label>
                <select
                  value={settings.visibility}
                  onChange={(e) => setSettings({ ...settings, visibility: e.target.value as any })}
                  className={cn(
                    "w-full px-3 py-2 rounded-lg border transition-colors",
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                      : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                  )}
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
                  className={cn(
                    "text-sm",
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  )}
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
                  className={cn(
                    "text-sm",
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  )}
                >
                  {t('project.settings.isRecruiting')}
                </label>
              </div>

              <div>
                <label className={cn(
                  "block text-sm font-medium mb-1.5",
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                )}>
                  {t('project.settings.recruitmentRequirements')}
                </label>
                <textarea
                  value={settings.recruitment_requirements || ''}
                  onChange={(e) => setSettings({ ...settings, recruitment_requirements: e.target.value })}
                  placeholder={t('project.settings.recruitmentRequirementsPlaceholder')}
                  rows={3}
                  className={cn(
                    "w-full px-3 py-2 rounded-lg border transition-colors resize-none",
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500"
                  )}
                />
              </div>

              <div>
                <label className={cn(
                  "block text-sm font-medium mb-1.5",
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                )}>
                  {t('project.settings.maxMembers')}
                </label>
                <input
                  type="number"
                  min="1"
                  value={settings.max_members || ''}
                  onChange={(e) => setSettings({ ...settings, max_members: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder={t('project.settings.maxMembersPlaceholder')}
                  className={cn(
                    "w-full px-3 py-2 rounded-lg border transition-colors",
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500"
                  )}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={currentStep === 1 ? onClose : handleBack}
              disabled={isLoading}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-colors",
                theme === "dark"
                  ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              )}
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
                className={cn(
                  "px-4 py-2 rounded-lg font-medium transition-colors",
                  theme === "dark"
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                )}
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
                className={cn(
                  "px-4 py-2 rounded-lg font-medium transition-colors",
                  theme === "dark"
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-green-500 hover:bg-green-600 text-white"
                )}
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
