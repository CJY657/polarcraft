/**
 * Profile Page (Personal Center)
 * 个人中心页面
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Mail, Calendar, FileText, Edit, KeyRound } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/utils/classNames';
import { PersistentHeader } from '@/components/shared/PersistentHeader';
import { EducationTimeline } from '@/feature/profile/components/EducationTimeline';
import { ProfileEditDialog } from '@/feature/profile/components/ProfileEditDialog';
import { PasswordChangeDialog } from '@/feature/profile/components/PasswordChangeDialog';
import { useProfileStore } from '@/stores/profileStore';

export default function ProfilePage() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { user, refreshUser } = useAuth();
  const {
    educations,
    applications,
    isLoading,
    error,
    fetchEducations,
    addEducation,
    updateEducation,
    deleteEducation,
    fetchApplications,
    withdrawApplication,
    clearError,
  } = useProfileStore();

  // Dialog states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  useEffect(() => {
    fetchEducations();
    fetchApplications();
  }, [fetchEducations, fetchApplications]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: theme === 'dark'
        ? 'bg-yellow-900/50 text-yellow-400'
        : 'bg-yellow-100 text-yellow-700',
      approved: theme === 'dark'
        ? 'bg-green-900/50 text-green-400'
        : 'bg-green-100 text-green-700',
      rejected: theme === 'dark'
        ? 'bg-red-900/50 text-red-400'
        : 'bg-red-100 text-red-700',
      withdrawn: theme === 'dark'
        ? 'bg-gray-700 text-gray-400'
        : 'bg-gray-100 text-gray-500',
    };
    return styles[status] || styles.pending;
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      pending: t('profile.application.pending'),
      approved: t('profile.application.approved'),
      rejected: t('profile.application.rejected'),
      withdrawn: t('profile.application.withdrawn'),
    };
    return texts[status] || status;
  };

  return (
    <div className={cn(
      "min-h-screen",
      theme === "dark"
        ? "bg-gradient-to-br from-[#0a0a1a] via-[#1a1a3a] to-[#0a0a2a]"
        : "bg-gradient-to-br from-[#fff5eb] via-[#fef3e2] to-[#fff5eb]"
    )}>
      <PersistentHeader
        moduleKey="profile"
        moduleNameKey={t('profile.title')}
        variant="glass"
      />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Error Alert */}
        {error && (
          <div className={cn(
            "mb-6 p-4 rounded-lg flex items-center justify-between",
            theme === "dark" ? "bg-red-900/30 text-red-400" : "bg-red-50 text-red-600"
          )}>
            <span>{error}</span>
            <button onClick={clearError} className="text-sm underline">
              {t('common.close')}
            </button>
          </div>
        )}

        {/* User Info Card */}
        <div className={cn(
          "p-6 rounded-xl border mb-6",
          theme === "dark"
            ? "bg-gray-800/50 border-gray-700"
            : "bg-white border-gray-200"
        )}>
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center",
              theme === "dark" ? "bg-gray-700" : "bg-gray-100"
            )}>
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.username}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className={cn(
                  "w-8 h-8",
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                )} />
              )}
            </div>

            {/* User Details */}
            <div className="flex-1">
              <h1 className={cn(
                "text-2xl font-bold mb-2",
                theme === "dark" ? "text-white" : "text-gray-900"
              )}>
                {user?.username}
              </h1>

              <div className="space-y-1.5">
                {user?.email && (
                  <div className={cn(
                    "flex items-center gap-2 text-sm",
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  )}>
                    <Mail className="w-4 h-4" />
                    <span>{user.email}</span>
                    {user.email_verified && (
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-xs",
                        theme === "dark"
                          ? "bg-green-900/50 text-green-400"
                          : "bg-green-100 text-green-700"
                      )}>
                        {t('profile.verified')}
                      </span>
                    )}
                  </div>
                )}

                <div className={cn(
                  "flex items-center gap-2 text-sm",
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                )}>
                  <Calendar className="w-4 h-4" />
                  <span>{t('profile.joinedAt')} {formatDate(user?.created_at || '')}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditDialogOpen(true)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  theme === "dark"
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                )}
              >
                <Edit className="w-4 h-4" />
                {t('profile.editProfile.button')}
              </button>
              <button
                onClick={() => setIsPasswordDialogOpen(true)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  theme === "dark"
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                )}
              >
                <KeyRound className="w-4 h-4" />
                {t('profile.changePassword.button')}
              </button>
            </div>
          </div>
        </div>

        {/* Education Section */}
        <div className={cn(
          "p-6 rounded-xl border mb-6",
          theme === "dark"
            ? "bg-gray-800/50 border-gray-700"
            : "bg-white border-gray-200"
        )}>
          <EducationTimeline
            educations={educations}
            onAdd={addEducation}
            onUpdate={updateEducation}
            onDelete={deleteEducation}
            isLoading={isLoading}
          />
        </div>

        {/* Applications Section */}
        <div className={cn(
          "p-6 rounded-xl border",
          theme === "dark"
            ? "bg-gray-800/50 border-gray-700"
            : "bg-white border-gray-200"
        )}>
          <h3 className={cn(
            "text-lg font-semibold mb-4",
            theme === "dark" ? "text-white" : "text-gray-900"
          )}>
            {t('profile.application.myApplications')}
          </h3>

          {applications.length === 0 ? (
            <div className={cn(
              "text-center py-6",
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            )}>
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>{t('profile.application.noApplications')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className={cn(
                    "p-4 rounded-lg border",
                    theme === "dark"
                      ? "bg-gray-700/50 border-gray-600"
                      : "bg-gray-50 border-gray-200"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2.5">
                        <span className={cn(
                          "font-medium",
                          theme === "dark" ? "text-white" : "text-gray-900"
                        )}>
                          {app.project_name || t('profile.application.unknownProject')}
                        </span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          getStatusBadge(app.status)
                        )}>
                          {getStatusText(app.status)}
                        </span>
                      </div>

                      <div className={cn(
                        "text-sm",
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      )}>
                        {t('profile.application.appliedAt')} {formatDate(app.created_at)}
                      </div>

                      {app.review_notes && (
                        <div className={cn(
                          "mt-2 text-sm p-2 rounded",
                          theme === "dark" ? "bg-gray-600/50" : "bg-gray-100"
                        )}>
                          {t('profile.application.reviewNotes')}: {app.review_notes}
                        </div>
                      )}
                    </div>

                    {app.status === 'pending' && (
                      <button
                        onClick={() => withdrawApplication(app.id)}
                        disabled={isLoading}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-sm transition-colors",
                          theme === "dark"
                            ? "bg-gray-600 hover:bg-gray-500 text-gray-300"
                            : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                        )}
                      >
                        {t('profile.application.withdraw')}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Edit Profile Dialog */}
      <ProfileEditDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSuccess={refreshUser}
        user={user}
      />

      {/* Change Password Dialog */}
      <PasswordChangeDialog
        isOpen={isPasswordDialogOpen}
        onClose={() => setIsPasswordDialogOpen(false)}
        username={user?.username || ''}
      />
    </div>
  );
}
