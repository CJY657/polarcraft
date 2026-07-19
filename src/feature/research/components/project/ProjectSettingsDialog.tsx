/**
 * Project Settings Dialog Component
 * 课题设置对话框组件
 */

import { useState, useEffect, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Save, Loader2, Settings } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { profileApi, type ProjectSettings } from '@/lib/profile.service';

interface ProjectSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onSuccess: (settings: ProjectSettings) => void;
}

const fieldLabelClass = 'mb-1.5 block text-base font-medium text-[var(--paper-foreground)]';
const fieldInputClass = 'research-input w-full rounded-[1rem] px-4 py-2.5 text-base';

export function ProjectSettingsDialog({ isOpen, onClose, projectId, onSuccess }: ProjectSettingsDialogProps) {
  const { t } = useTranslation();

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
      <div className="research-panel max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[1.9rem] p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="research-chip flex h-11 w-11 items-center justify-center rounded-2xl">
              <Settings className="h-5 w-5 text-[var(--paper-link)]" />
            </div>
            <h2
              className="text-xl font-semibold text-[var(--paper-foreground)]"
              style={{ fontFamily: 'var(--font-ui-display)' }}
            >
              {t('project.settings.title')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="glass-button rounded-full p-2 text-[var(--glass-text-muted)]"
            aria-label={t('common.cancel')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Loading */}
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--paper-accent)]" />
          </div>
        ) : settings ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Visibility */}
            <div>
              <label className={fieldLabelClass}>
                {t('project.settings.visibility')}
              </label>
              <select
                value={settings.visibility}
                onChange={(e) => setSettings({ ...settings, visibility: e.target.value as ProjectSettings['visibility'] })}
                className={fieldInputClass}
              >
                <option value="private">{t('project.settings.private')}</option>
                <option value="public">{t('project.settings.public')}</option>
                <option value="invite_only">{t('project.settings.inviteOnly')}</option>
              </select>
            </div>

            {/* Membership toggles */}
            <div className="research-panel-soft grid gap-3 rounded-[1.25rem] p-4">
              <label
                htmlFor="require_approval"
                className="flex cursor-pointer items-center gap-3 text-base text-[var(--paper-foreground)]"
              >
                <input
                  type="checkbox"
                  id="require_approval"
                  checked={settings.require_approval}
                  onChange={(e) => setSettings({ ...settings, require_approval: e.target.checked })}
                  className="h-4 w-4 rounded accent-[var(--paper-accent)]"
                />
                {t('project.settings.requireApproval')}
              </label>

              <label
                htmlFor="is_recruiting"
                className="flex cursor-pointer items-center gap-3 text-base text-[var(--paper-foreground)]"
              >
                <input
                  type="checkbox"
                  id="is_recruiting"
                  checked={settings.is_recruiting}
                  onChange={(e) => setSettings({ ...settings, is_recruiting: e.target.checked })}
                  className="h-4 w-4 rounded accent-[var(--paper-accent)]"
                />
                {t('project.settings.isRecruiting')}
              </label>
            </div>

            {/* Recruitment Requirements */}
            <div>
              <label className={fieldLabelClass}>
                {t('project.settings.recruitmentRequirements')}
              </label>
              <textarea
                value={settings.recruitment_requirements || ''}
                onChange={(e) => setSettings({ ...settings, recruitment_requirements: e.target.value })}
                placeholder={t('project.settings.recruitmentRequirementsPlaceholder')}
                rows={3}
                className={`${fieldInputClass} resize-none leading-7`}
              />
            </div>

            {/* Max Members */}
            <div>
              <label className={fieldLabelClass}>
                {t('project.settings.maxMembers')}
              </label>
              <input
                type="number"
                min="1"
                value={settings.max_members || ''}
                onChange={(e) => setSettings({ ...settings, max_members: e.target.value ? parseInt(e.target.value) : null })}
                placeholder={t('project.settings.maxMembersPlaceholder')}
                className={fieldInputClass}
              />
            </div>

            {/* Contact Email */}
            <div>
              <label className={fieldLabelClass}>
                {t('project.settings.contactEmail')}
              </label>
              <input
                type="email"
                value={settings.contact_email || ''}
                onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                placeholder="contact@example.com"
                className={fieldInputClass}
              />
            </div>

            {/* Discussion Channel */}
            <div>
              <label className={fieldLabelClass}>
                {t('project.settings.discussionChannel')}
              </label>
              <input
                type="text"
                value={settings.discussion_channel || ''}
                onChange={(e) => setSettings({ ...settings, discussion_channel: e.target.value })}
                placeholder="如微信群链接"
                className={fieldInputClass}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-[1rem] bg-red-50 px-4 py-3 text-base text-red-600 dark:bg-red-900/30 dark:text-red-300">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="glass-button flex-1 rounded-full px-4 py-2.5 text-base font-medium disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="glass-button glass-button-primary flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {t('common.save')}
              </button>
            </div>
          </form>
        ) : (
          <div className="py-10 text-center text-base text-[var(--glass-text-muted)]">
            {t('common.error')}
          </div>
        )}
      </div>
    </Dialog>
  );
}
