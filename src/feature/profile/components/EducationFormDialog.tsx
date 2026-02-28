/**
 * Education Form Dialog Component
 * 教育经历表单对话框组件
 */

import { useState, useEffect, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Calendar } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/utils/classNames';
import { Dialog } from '@/components/ui/Dialog';
import { UserEducation } from '@/lib/profile.service';

interface EducationFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    organization: string;
    major: string;
    start_date: string;
    end_date?: string;
    is_current: boolean;
    degree_level?: string;
  }) => Promise<void>;
  education: UserEducation | null;
  isLoading?: boolean;
}

export function EducationFormDialog({
  isOpen,
  onClose,
  onSubmit,
  education,
  isLoading,
}: EducationFormDialogProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [formData, setFormData] = useState({
    organization: '',
    major: '',
    start_date: '',
    end_date: '',
    is_current: false,
    degree_level: '',
  });
  const [error, setError] = useState('');

  // Reset form when dialog opens/closes or education changes
  useEffect(() => {
    if (isOpen) {
      if (education) {
        // Parse dates from YYYY-MM-DD to YYYY-MM
        const startDate = education.start_date ? education.start_date.substring(0, 7) : '';
        const endDate = education.end_date ? education.end_date.substring(0, 7) : '';
        setFormData({
          organization: education.organization || '',
          major: education.major || '',
          start_date: startDate,
          end_date: endDate,
          is_current: education.is_current || false,
          degree_level: education.degree_level || '',
        });
      } else {
        setFormData({
          organization: '',
          major: '',
          start_date: '',
          end_date: '',
          is_current: false,
          degree_level: '',
        });
      }
      setError('');
    }
  }, [isOpen, education]);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.organization.trim()) {
      setError(t('profile.education.organizationRequired'));
      return;
    }
    if (!formData.major.trim()) {
      setError(t('profile.education.majorRequired'));
      return;
    }
    if (!formData.start_date) {
      setError(t('profile.education.startDateRequired'));
      return;
    }

    try {
      await onSubmit({
        organization: formData.organization.trim(),
        major: formData.major.trim(),
        start_date: formData.start_date,
        end_date: formData.is_current ? undefined : formData.end_date || undefined,
        is_current: formData.is_current,
        degree_level: formData.degree_level || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    }
  };

  // Generate month options for the last 20 years
  const generateMonthOptions = () => {
    const options: { value: string; label: string }[] = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    for (let year = currentYear; year >= currentYear - 20; year--) {
      const maxMonth = year === currentYear ? currentMonth : 12;
      for (let month = maxMonth; month >= 1; month--) {
        const value = `${year}-${String(month).padStart(2, '0')}`;
        options.push({
          value,
          label: `${year}.${String(month).padStart(2, '0')}`,
        });
      }
    }
    return options;
  };

  const monthOptions = generateMonthOptions();

  return (
    <Dialog isOpen={isOpen} onClose={onClose} showCloseButton={false}>
      <div className={cn(
        "w-full max-w-md p-6 rounded-xl",
        theme === "dark" ? "bg-gray-800" : "bg-white"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className={cn(
            "text-xl font-semibold",
            theme === "dark" ? "text-white" : "text-gray-900"
          )}>
            {education ? t('profile.education.edit') : t('profile.education.add')}
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
          {/* Organization */}
          <div>
            <label className={cn(
              "block text-sm font-medium mb-1.5",
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            )}>
              {t('profile.education.organization')} *
            </label>
            <input
              type="text"
              value={formData.organization}
              onChange={(e) => handleChange('organization', e.target.value)}
              placeholder={t('profile.education.organizationPlaceholder')}
              className={cn(
                "w-full px-3 py-2 rounded-lg border transition-colors",
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500"
              )}
            />
          </div>

          {/* Major */}
          <div>
            <label className={cn(
              "block text-sm font-medium mb-1.5",
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            )}>
              {t('profile.education.major')} *
            </label>
            <input
              type="text"
              value={formData.major}
              onChange={(e) => handleChange('major', e.target.value)}
              placeholder={t('profile.education.majorPlaceholder')}
              className={cn(
                "w-full px-3 py-2 rounded-lg border transition-colors",
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500"
              )}
            />
          </div>

          {/* Start Date */}
          <div>
            <label className={cn(
              "block text-sm font-medium mb-1.5",
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            )}>
              {t('profile.education.startDate')} *
            </label>
            <select
              value={formData.start_date}
              onChange={(e) => handleChange('start_date', e.target.value)}
              className={cn(
                "w-full px-3 py-2 rounded-lg border transition-colors",
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                  : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
              )}
            >
              <option value="">{t('profile.education.selectDate')}</option>
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* End Date */}
          <div>
            <label className={cn(
              "block text-sm font-medium mb-1.5",
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            )}>
              {t('profile.education.endDate')}
            </label>
            <select
              value={formData.is_current ? '' : formData.end_date}
              onChange={(e) => handleChange('end_date', e.target.value)}
              disabled={formData.is_current}
              className={cn(
                "w-full px-3 py-2 rounded-lg border transition-colors",
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500 disabled:opacity-50"
                  : "bg-white border-gray-300 text-gray-900 focus:border-blue-500 disabled:opacity-50"
              )}
            >
              <option value="">{t('profile.education.selectDate')}</option>
              {monthOptions
                .filter((opt) => opt.value >= formData.start_date)
                .map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
            </select>
          </div>

          {/* Is Current Checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_current"
              checked={formData.is_current}
              onChange={(e) => handleChange('is_current', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <label
              htmlFor="is_current"
              className={cn(
                "text-sm",
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              )}
            >
              {t('profile.education.isCurrent')}
            </label>
          </div>

          {/* Degree Level */}
          <div>
            <label className={cn(
              "block text-sm font-medium mb-1.5",
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            )}>
              {t('profile.education.degreeLevel')}
            </label>
            <select
              value={formData.degree_level}
              onChange={(e) => handleChange('degree_level', e.target.value)}
              className={cn(
                "w-full px-3 py-2 rounded-lg border transition-colors",
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                  : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
              )}
            >
              <option value="">{t('profile.education.selectDegree')}</option>
              <option value="bachelor">{t('profile.education.bachelor')}</option>
              <option value="master">{t('profile.education.master')}</option>
              <option value="phd">{t('profile.education.phd')}</option>
              <option value="other">{t('profile.education.other')}</option>
            </select>
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
                "flex-1 px-4 py-2 rounded-lg font-medium transition-colors",
                theme === "dark"
                  ? "bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                  : "bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
              )}
            >
              {isLoading ? t('common.saving') : (education ? t('common.save') : t('common.add'))}
            </button>
          </div>
        </form>
      </div>
    </Dialog>
  );
}
