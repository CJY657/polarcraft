/**
 * Project Edit Dialog Component
 * 课题编辑对话框组件
 */

import { useState, useEffect, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Save, Loader2 } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/utils/classNames';
import { Dialog } from '@/components/ui/dialog';
import { researchApi, type ResearchProject, type UpdateProjectInput } from '@/lib/research.service';

interface ProjectEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: ResearchProject | null;
  onSuccess: (project: ResearchProject) => void;
}

export function ProjectEditDialog({ isOpen, onClose, project, onSuccess }: ProjectEditDialogProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [formData, setFormData] = useState({
    name_zh: '',
    name_en: '',
    description_zh: '',
    description_en: '',
    status: 'active' as const,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize form data when project changes
  useEffect(() => {
    if (project) {
      setFormData({
        name_zh: project.name_zh || '',
        name_en: project.name_en || '',
        description_zh: project.description_zh || '',
        description_en: project.description_en || '',
        status: project.status || 'active',
      });
    }
    setError('');
  }, [project, isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!project) return;

    if (!formData.name_zh.trim()) {
      setError(t('project.create.nameRequired') || '请输入课题名称');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const updatedProject = await researchApi.updateProject(project.id, {
        name_zh: formData.name_zh,
        name_en: formData.name_en || undefined,
        description_zh: formData.description_zh || undefined,
        description_en: formData.description_en || undefined,
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

  if (!project) return null;

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
              "block text-sm font-medium mb-1.5",
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
              "block text-sm font-medium mb-1.5",
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
              "block text-sm font-medium mb-1.5",
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

          {/* Description (English) */}
          {/* <div>
            <label className={cn(
              "block text-sm font-medium mb-1.5",
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
            <label className={cn(
              "block text-sm font-medium mb-1.5",
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            )}>
              {t('project.edit.status')}
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className={cn(
                "w-full px-3 py-2 rounded-lg border transition-colors",
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                  : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
              )}
            >
              <option value="draft">{t('project.status.draft')}</option>
              <option value="active">{t('project.status.active')}</option>
              <option value="completed">{t('project.status.completed')}</option>
              <option value="archived">{t('project.status.archived')}</option>
            </select>
          </div>

          {/* Hint about visibility */}
          <div className={cn(
            "p-3 rounded-lg text-sm",
            theme === "dark" ? "bg-blue-900/30 text-blue-300" : "bg-blue-50 text-blue-700"
          )}>
            <p>{t('project.edit.visibilityHint')}</p>
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
  );
}
