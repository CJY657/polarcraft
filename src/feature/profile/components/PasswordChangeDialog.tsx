/**
 * Password Change Dialog Component
 * 修改密码对话框组件
 */

import { useState, useEffect, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/utils/classNames';
import { Dialog } from '@/components/ui/dialog';
import { authApi } from '@/lib/auth.service';
import {
  validatePassword,
  getPasswordRequirements,
  preparePasswordForLogin,
  preparePasswordForRegistration,
} from '@/lib/password.util';

interface PasswordChangeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
}

export function PasswordChangeDialog({ isOpen, onClose, username }: PasswordChangeDialogProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(
    null
  );

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setShowPasswords({ current: false, new: false, confirm: false });
      setError('');
      setPasswordStrength(null);
    }
  }, [isOpen]);

  // Validate new password strength on change
  useEffect(() => {
    if (formData.newPassword) {
      const result = validatePassword(formData.newPassword);
      setPasswordStrength(result.strength);
    } else {
      setPasswordStrength(null);
    }
  }, [formData.newPassword]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const getStrengthColor = () => {
    switch (passwordStrength) {
      case 'weak':
        return theme === 'dark' ? 'bg-red-500' : 'bg-red-500';
      case 'medium':
        return theme === 'dark' ? 'bg-yellow-500' : 'bg-yellow-500';
      case 'strong':
        return theme === 'dark' ? 'bg-green-500' : 'bg-green-500';
      default:
        return theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300';
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.currentPassword) {
      setError(t('profile.changePassword.currentPasswordRequired'));
      return;
    }
    if (!formData.newPassword) {
      setError(t('profile.changePassword.newPasswordRequired'));
      return;
    }

    // Validate new password strength
    const validation = validatePassword(formData.newPassword);
    if (!validation.valid) {
      setError(validation.errors[0]);
      return;
    }

    // Check password confirmation
    if (formData.newPassword !== formData.confirmPassword) {
      setError(t('profile.changePassword.passwordMismatch'));
      return;
    }

    setIsLoading(true);
    try {
      // Step 1: Get user salt and hash current password
      const { salt } = await authApi.getUserSalt(username);
      const hashedCurrentPassword = await preparePasswordForLogin(formData.currentPassword, salt);

      // Step 2: Hash new password with new salt
      const { hashedPassword: hashedNewPassword } = await preparePasswordForRegistration(
        formData.newPassword
      );

      // Step 3: Call change password API
      await authApi.changePassword({
        currentPassword: hashedCurrentPassword,
        newPassword: hashedNewPassword,
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const passwordRequirements = getPasswordRequirements();

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
            {t('profile.changePassword.title')}
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
          {/* Current Password */}
          <div>
            <label
              className={cn(
                'block text-sm font-medium mb-1.5',
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              )}
            >
              {t('profile.changePassword.currentPassword')} *
            </label>
            <div className="relative">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={(e) => handleChange('currentPassword', e.target.value)}
                placeholder={t('profile.changePassword.currentPasswordPlaceholder')}
                className={cn(
                  'w-full px-3 py-2 pr-10 rounded-lg border transition-colors',
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                )}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                className={cn(
                  'absolute right-2 top-1/2 -translate-y-1/2 p-1',
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                )}
              >
                {showPasswords.current ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label
              className={cn(
                'block text-sm font-medium mb-1.5',
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              )}
            >
              {t('profile.changePassword.newPassword')} *
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={(e) => handleChange('newPassword', e.target.value)}
                placeholder={t('profile.changePassword.newPasswordPlaceholder')}
                className={cn(
                  'w-full px-3 py-2 pr-10 rounded-lg border transition-colors',
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                )}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                className={cn(
                  'absolute right-2 top-1/2 -translate-y-1/2 p-1',
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                )}
              >
                {showPasswords.new ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {formData.newPassword && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  <div
                    className={cn(
                      'h-1 flex-1 rounded-full transition-colors',
                      passwordStrength
                        ? getStrengthColor()
                        : theme === 'dark'
                          ? 'bg-gray-600'
                          : 'bg-gray-200'
                    )}
                  />
                  <div
                    className={cn(
                      'h-1 flex-1 rounded-full transition-colors',
                      passwordStrength === 'medium' || passwordStrength === 'strong'
                        ? getStrengthColor()
                        : theme === 'dark'
                          ? 'bg-gray-600'
                          : 'bg-gray-200'
                    )}
                  />
                  <div
                    className={cn(
                      'h-1 flex-1 rounded-full transition-colors',
                      passwordStrength === 'strong'
                        ? getStrengthColor()
                        : theme === 'dark'
                          ? 'bg-gray-600'
                          : 'bg-gray-200'
                    )}
                  />
                </div>
                <p
                  className={cn(
                    'text-xs',
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  )}
                >
                  {passwordStrength === 'weak' && t('profile.changePassword.strengthWeak')}
                  {passwordStrength === 'medium' && t('profile.changePassword.strengthMedium')}
                  {passwordStrength === 'strong' && t('profile.changePassword.strengthStrong')}
                </p>
              </div>
            )}

            {/* Password Requirements */}
            <div
              className={cn(
                'mt-2 text-xs space-y-0.5',
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              )}
            >
              {passwordRequirements.map((req, index) => (
                <p key={index}>• {req}</p>
              ))}
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label
              className={cn(
                'block text-sm font-medium mb-1.5',
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              )}
            >
              {t('profile.changePassword.confirmPassword')} *
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                placeholder={t('profile.changePassword.confirmPasswordPlaceholder')}
                className={cn(
                  'w-full px-3 py-2 pr-10 rounded-lg border transition-colors',
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                )}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                className={cn(
                  'absolute right-2 top-1/2 -translate-y-1/2 p-1',
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                )}
              >
                {showPasswords.confirm ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
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
