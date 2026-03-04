/**
 * Profile Edit Dialog Component
 * 编辑资料对话框组件
 */

import { useState, useEffect, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/utils/classNames';
import { Dialog } from '@/components/ui/dialog';
import { authApi, UserProfile } from '@/lib/auth.service';

interface ProfileEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: UserProfile | null;
}

export function ProfileEditDialog({
  isOpen,
  onClose,
  onSuccess,
  user,
}: ProfileEditDialogProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
      });
      setError('');
    }
  }, [isOpen, user]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.username.trim()) {
      setError(t('profile.editProfile.usernameRequired'));
      return;
    }
    if (formData.username.trim().length < 3 || formData.username.trim().length > 50) {
      setError(t('profile.editProfile.usernameLength'));
      return;
    }

    // Email validation (if provided)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError(t('profile.editProfile.emailInvalid'));
      return;
    }

    setIsLoading(true);
    try {
      await authApi.updateProfile({
        username: formData.username.trim(),
        email: formData.email.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} showCloseButton={false}>
      <div
        className={cn(
          'w-full max-w-md p-6 rounded-xl',
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2
            className={cn(
              'text-xl font-semibold',
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}
          >
            {t('profile.editProfile.title')}
          </h2>
          <button
            onClick={onClose}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              theme === 'dark'
                ? 'hover:bg-gray-700 text-gray-400'
                : 'hover:bg-gray-100 text-gray-500'
            )}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label
              className={cn(
                'block text-sm font-medium mb-1.5',
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              )}
            >
              {t('profile.editProfile.username')} *
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => handleChange('username', e.target.value)}
              placeholder={t('profile.editProfile.usernamePlaceholder')}
              className={cn(
                'w-full px-3 py-2 rounded-lg border transition-colors',
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
              )}
            />
          </div>

          {/* Email */}
          <div>
            <label
              className={cn(
                'block text-sm font-medium mb-1.5',
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              )}
            >
              {t('profile.editProfile.email')}
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder={t('profile.editProfile.emailPlaceholder')}
              className={cn(
                'w-full px-3 py-2 rounded-lg border transition-colors',
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
              )}
            />
          </div>

          {/* Error */}
          {error && (
            <div
              className={cn(
                'p-3 rounded-lg text-sm',
                theme === 'dark' ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'
              )}
            >
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
                'flex-1 px-4 py-2 rounded-lg font-medium transition-colors',
                theme === 'dark'
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              )}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'flex-1 px-4 py-2 rounded-lg font-medium transition-colors',
                theme === 'dark'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50'
                  : 'bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50'
              )}
            >
              {isLoading ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </Dialog>
  );
}
