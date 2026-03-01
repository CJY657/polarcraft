/**
 * Application Management Panel Component
 * 申请管理面板组件
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X, Clock, User, ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/utils/classNames';
import { profileApi, ProjectApplication } from '@/lib/profile.service';

interface ApplicationManagementPanelProps {
  projectId: string;
  isOwnerOrAdmin: boolean;
}

export function ApplicationManagementPanel({
  projectId,
  isOwnerOrAdmin,
}: ApplicationManagementPanelProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [applications, setApplications] = useState<ProjectApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadApplications();
  }, [projectId]);

  const loadApplications = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await profileApi.getProjectApplications(projectId);
      setApplications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (applicationId: string) => {
    setProcessingId(applicationId);
    try {
      await profileApi.updateApplicationStatus(applicationId, 'approved');
      setApplications((prev) =>
        prev.map((a) =>
          a.id === applicationId ? { ...a, status: 'approved' as const } : a
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (applicationId: string) => {
    const notes = prompt(t('profile.application.reviewNotes') || '审核备注（可选）');
    if (notes === null) return; // Cancelled

    setProcessingId(applicationId);
    try {
      await profileApi.updateApplicationStatus(applicationId, 'rejected', notes || undefined);
      setApplications((prev) =>
        prev.map((a) =>
          a.id === applicationId
            ? { ...a, status: 'rejected' as const, review_notes: notes || null }
            : a
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setProcessingId(null);
    }
  };

  const pendingApplications = applications.filter((a) => a.status === 'pending');
  const processedApplications = applications.filter((a) => a.status !== 'pending');

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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOwnerOrAdmin) {
    return null;
  }

  return (
    <div className={cn(
      "rounded-xl border p-6",
      theme === "dark"
        ? "bg-gray-800/50 border-gray-700"
        : "bg-white border-gray-200"
    )}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={cn(
          "text-lg font-semibold",
          theme === "dark" ? "text-white" : "text-gray-900"
        )}>
          {t('project.application.title')}
        </h3>
        {pendingApplications.length > 0 && (
          <span className={cn(
            "px-2 py-1 rounded-full text-sm font-medium",
            theme === "dark"
              ? "bg-yellow-900/50 text-yellow-400"
              : "bg-yellow-100 text-yellow-700"
          )}>
            {pendingApplications.length} {t('profile.application.pending')}
          </span>
        )}
      </div>

      {error && (
        <div className={cn(
          "mb-4 p-3 rounded-lg text-sm",
          theme === "dark" ? "bg-red-900/30 text-red-400" : "bg-red-50 text-red-600"
        )}>
          {error}
        </div>
      )}

      {isLoading ? (
        <div className={cn(
          "text-center py-8",
          theme === "dark" ? "text-gray-400" : "text-gray-500"
        )}>
          {t('common.loading')}
        </div>
      ) : applications.length === 0 ? (
        <div className={cn(
          "text-center py-8",
          theme === "dark" ? "text-gray-400" : "text-gray-500"
        )}>
          {t('profile.application.noApplications')}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Pending applications first */}
          {pendingApplications.map((app) => (
            <ApplicationCard
              key={app.id}
              application={app}
              theme={theme}
              expanded={expandedId === app.id}
              onToggleExpand={() => setExpandedId(expandedId === app.id ? null : app.id)}
              onApprove={() => handleApprove(app.id)}
              onReject={() => handleReject(app.id)}
              isProcessing={processingId === app.id}
              getStatusBadge={getStatusBadge}
              getStatusText={getStatusText}
              formatDate={formatDate}
              t={t}
            />
          ))}

          {/* Processed applications */}
          {processedApplications.length > 0 && (
            <>
              <div className={cn(
                "text-sm font-medium pt-4 pb-2",
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              )}>
                已处理
              </div>
              {processedApplications.map((app) => (
                <ApplicationCard
                  key={app.id}
                  application={app}
                  theme={theme}
                  expanded={expandedId === app.id}
                  onToggleExpand={() => setExpandedId(expandedId === app.id ? null : app.id)}
                  getStatusBadge={getStatusBadge}
                  getStatusText={getStatusText}
                  formatDate={formatDate}
                  t={t}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Application Card sub-component
interface ApplicationCardProps {
  application: ProjectApplication;
  theme: string;
  expanded: boolean;
  onToggleExpand: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  isProcessing?: boolean;
  getStatusBadge: (status: string) => string;
  getStatusText: (status: string) => string;
  formatDate: (date: string) => string;
  t: (key: string) => string;
}

function ApplicationCard({
  application,
  theme,
  expanded,
  onToggleExpand,
  onApprove,
  onReject,
  isProcessing,
  getStatusBadge,
  getStatusText,
  formatDate,
  t,
}: ApplicationCardProps) {
  return (
    <div className={cn(
      "rounded-lg border overflow-hidden",
      theme === "dark"
        ? "bg-gray-700/50 border-gray-600"
        : "bg-gray-50 border-gray-200"
    )}>
      {/* Header - always visible */}
      <div
        onClick={onToggleExpand}
        className={cn(
          "p-4 cursor-pointer flex items-center justify-between",
          theme === "dark" ? "hover:bg-gray-600/50" : "hover:bg-gray-100"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            theme === "dark" ? "bg-gray-600" : "bg-gray-200"
          )}>
            {application.avatar_url ? (
              <img
                src={application.avatar_url}
                alt={application.display_name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className={cn(
                "w-5 h-5",
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              )} />
            )}
          </div>
          <div>
            <div className={cn(
              "font-medium",
              theme === "dark" ? "text-white" : "text-gray-900"
            )}>
              {application.display_name}
              {application.username && application.username !== application.display_name && (
                <span className={cn(
                  "text-sm ml-2",
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                )}>
                  (@{application.username})
                </span>
              )}
            </div>
            <div className={cn(
              "text-sm",
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            )}>
              {application.organization}
              {application.major && ` · ${application.major}`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={cn(
            "px-2 py-1 rounded-full text-xs font-medium",
            getStatusBadge(application.status)
          )}>
            {getStatusText(application.status)}
          </span>
          {expanded ? (
            <ChevronUp className={cn(
              "w-5 h-5",
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            )} />
          ) : (
            <ChevronDown className={cn(
              "w-5 h-5",
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            )} />
          )}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className={cn(
          "px-4 pb-4 border-t",
          theme === "dark" ? "border-gray-600" : "border-gray-200"
        )}>
          <div className="pt-4 space-y-3">
            {application.grade && (
              <div>
                <span className={cn(
                  "text-sm font-medium",
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                )}>
                  {t('project.application.form.grade')}:
                </span>
                <span className={cn(
                  "ml-2",
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                )}>
                  {application.grade}
                </span>
              </div>
            )}

            {application.research_experience && (
              <div>
                <span className={cn(
                  "text-sm font-medium block mb-1",
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                )}>
                  {t('project.application.form.researchExperience')}:
                </span>
                <p className={cn(
                  "text-sm whitespace-pre-wrap",
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                )}>
                  {application.research_experience}
                </p>
              </div>
            )}

            {application.expertise && (
              <div>
                <span className={cn(
                  "text-sm font-medium block mb-1",
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                )}>
                  {t('project.application.form.expertise')}:
                </span>
                <p className={cn(
                  "text-sm whitespace-pre-wrap",
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                )}>
                  {application.expertise}
                </p>
              </div>
            )}

            {application.motivation && (
              <div>
                <span className={cn(
                  "text-sm font-medium block mb-1",
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                )}>
                  {t('project.application.form.motivation')}:
                </span>
                <p className={cn(
                  "text-sm whitespace-pre-wrap",
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                )}>
                  {application.motivation}
                </p>
              </div>
            )}

            <div className={cn(
              "text-xs",
              theme === "dark" ? "text-gray-500" : "text-gray-400"
            )}>
              <Clock className="w-3 h-3 inline mr-1" />
              {formatDate(application.created_at)}
            </div>

            {application.review_notes && (
              <div className={cn(
                "p-2 rounded text-sm",
                theme === "dark" ? "bg-gray-600/50" : "bg-gray-200"
              )}>
                <span className="font-medium">{t('profile.application.reviewNotes')}: </span>
                {application.review_notes}
              </div>
            )}

            {/* Action buttons for pending applications */}
            {application.status === 'pending' && onApprove && onReject && (
              <div className="flex gap-2 pt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onApprove();
                  }}
                  disabled={isProcessing}
                  className={cn(
                    "flex-1 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 transition-colors",
                    theme === "dark"
                      ? "bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                      : "bg-green-500 hover:bg-green-600 text-white disabled:opacity-50"
                  )}
                >
                  <Check className="w-4 h-4" />
                  {t('profile.application.approved')}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onReject();
                  }}
                  disabled={isProcessing}
                  className={cn(
                    "flex-1 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 transition-colors",
                    theme === "dark"
                      ? "bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                      : "bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
                  )}
                >
                  <X className="w-4 h-4" />
                  {t('profile.application.rejected')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
