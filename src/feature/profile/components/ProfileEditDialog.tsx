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
import { authApi, type UserProfile, type UserType } from '@/lib/auth.service';

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

  const [formData, setFormData] = useState<{
    username: string;
    realName: string;
    showRealNamePublicly: boolean;
    email: string;
    userType: UserType | '';
  }>({
    username: '',
    realName: '',
    showRealNamePublicly: false,
    email: '',
    userType: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [verificationNotice, setVerificationNotice] = useState('');

  const handleResendVerification = async () => {
    setIsResending(true);
    setVerificationNotice('');
    try {
      setVerificationNotice(await authApi.sendVerificationEmail());
    } catch (err) {
      setVerificationNotice(err instanceof Error ? err.message : '验证邮件发送失败');
    } finally {
      setIsResending(false);
    }
  };

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        username: user.username || '',
        realName: user.real_name || '',
        showRealNamePublicly: user.show_real_name_publicly === true,
        email: user.email || '',
        userType: user.user_type || '',
      });
      setError('');
      setVerificationNotice('');
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
    if (!formData.realName.trim()) {
      setError(t('profile.editProfile.realNameRequired', '请输入真实姓名'));
      return;
    }
    if (!formData.userType) {
      setError('请选择账号身份');
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
        real_name: formData.realName.trim(),
        show_real_name_publicly: formData.showRealNamePublicly,
        email: formData.email.trim() || undefined,
        user_type: formData.userType,
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
    <Dialog isOpen={isOpen} onClose={onClose}>
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
              {t('profile.editProfile.username', '用户名')} *
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

          {/* Real name */}
          <div>
            <label
              className={cn(
                'block text-sm font-medium mb-1.5',
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              )}
            >
              {t('profile.editProfile.realName', '真实姓名')} *
            </label>
            <input
              type="text"
              value={formData.realName}
              onChange={(e) => handleChange('realName', e.target.value)}
              placeholder={t('profile.editProfile.realNamePlaceholder', '请输入真实姓名')}
              className={cn(
                'w-full px-3 py-2 rounded-lg border transition-colors',
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
              )}
            />
          </div>

          <div>
            <label
              htmlFor="profile-user-type"
              className={cn(
                'block text-sm font-medium mb-1.5',
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              )}
            >
              账号身份 *
            </label>
            <select
              id="profile-user-type"
              value={formData.userType}
              required
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  userType: e.target.value as UserType,
                }));
                setError('');
              }}
              className={cn(
                'w-full px-3 py-2 rounded-lg border transition-colors',
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                  : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
              )}
            >
              <option value="" disabled>请选择账号身份</option>
              <option value="student">学生</option>
              <option value="teacher">教师</option>
            </select>
          </div>

          <label
            className={cn(
              'flex items-center gap-2 text-sm',
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            )}
          >
            <input
              type="checkbox"
              checked={formData.showRealNamePublicly}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  showRealNamePublicly: e.target.checked,
                }))
              }
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>{t('profile.editProfile.showRealNamePublicly', '公开显示真实姓名')}</span>
          </label>

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
            {user?.email && !user.email_verified && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 font-medium',
                    theme === 'dark'
                      ? 'bg-amber-900/40 text-amber-300'
                      : 'bg-amber-50 text-amber-700'
                  )}
                >
                  未验证
                </span>
                <button
                  type="button"
                  onClick={() => void handleResendVerification()}
                  disabled={isResending}
                  className={cn(
                    'underline underline-offset-2 transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                    theme === 'dark'
                      ? 'text-blue-300 hover:text-blue-200'
                      : 'text-blue-600 hover:text-blue-700'
                  )}
                >
                  {isResending ? '发送中...' : '重新发送验证邮件'}
                </button>
                {verificationNotice && (
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                    {verificationNotice}
                  </span>
                )}
              </div>
            )}
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
