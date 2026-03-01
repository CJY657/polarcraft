/**
 * Project Settings Dialog Component
 * 课题设置对话框组件
 */

import { useState, useEffect, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Save, Loader2 } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/utils/classNames';
import { Dialog } from '@/components/ui/dialog';
import { profileApi, type ProjectSettings } from '@/lib/profile.service';

interface ProjectSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onSuccess: (settings: ProjectSettings) => void;
}

export function ProjectSettingsDialog({ isOpen, onClose, projectId, onSuccess }: ProjectSettingsDialogProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [settings, setSettings] = useState<ProjectSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Load settings on open
  useEffect(() => {
    if (isOpen && projectId) {
      setIsLoading(true);
      profileApi.getProjectSettings(projectId)
        .then(setSettings)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
    setError('');
  }, [isOpen, projectId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setError('');
    setIsSaving(true);

    try {
      const updatedSettings = await profileApi.updateProjectSettings(projectId, {
        visibility: settings.visibility,
        require_approval: settings.require_approval,
        recruitment_requirements: settings.recruitment_requirements || undefined,
        max_members: settings.max_members || undefined,
        is_recruiting: settings.is_recruiting,
        contact_email: settings.contact_email || undefined,
        discussion_channel: settings.discussion_channel || undefined,
      });

      onSuccess(updatedSettings);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} showCloseButton={false}>
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
            {t('project.settings.title')}
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

        {/* Loading */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className={cn(
              "w-6 h-6 animate-spin",
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            )} />
          </div>
        ) : settings ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Visibility */}
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

            {/* Require Approval */}
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

            {/* Is Recruiting */}
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

            {/* Recruitment Requirements */}
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

            {/* Max Members */}
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
                onChange={(e) => setSettings({ ...settings, max_members: e.target.value ? parseInt(e.target.value) : null })}
                placeholder={t('project.settings.maxMembersPlaceholder')}
                className={cn(
                  "w-full px-3 py-2 rounded-lg border transition-colors",
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500"
                )}
              />
            </div>

            {/* Contact Email */}
            <div>
              <label className={cn(
                "block text-sm font-medium mb-1.5",
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              )}>
                {t('project.settings.contactEmail')}
              </label>
              <input
                type="email"
                value={settings.contact_email || ''}
                onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                placeholder="contact@example.com"
                className={cn(
                  "w-full px-3 py-2 rounded-lg border transition-colors",
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500"
                )}
              />
            </div>

            {/* Discussion Channel */}
            <div>
              <label className={cn(
                "block text-sm font-medium mb-1.5",
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              )}>
                {t('project.settings.discussionChannel')}
              </label>
              <input
                type="text"
                value={settings.discussion_channel || ''}
                onChange={(e) => setSettings({ ...settings, discussion_channel: e.target.value })}
                placeholder="如微信群链接"
                className={cn(
                  "w-full px-3 py-2 rounded-lg border transition-colors",
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
                disabled={isSaving}
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
                disabled={isSaving}
                className={cn(
                  "flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2",
                  theme === "dark"
                    ? "bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                    : "bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
                )}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {t('common.save')}
              </button>
            </div>
          </form>
        ) : (
          <div className={cn(
            "text-center py-8",
            theme === "dark" ? "text-gray-400" : "text-gray-500"
          )}>
            {t('common.error')}
          </div>
        )}
      </div>
    </Dialog>
  );
}
