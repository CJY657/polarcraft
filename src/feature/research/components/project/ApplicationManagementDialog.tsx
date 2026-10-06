/**
 * Application Management Dialog Component
 * 申请管理对话框组件
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X, Clock, User, ChevronDown, ChevronUp, Users, Loader2 } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/utils/classNames';
import { Dialog } from '@/components/ui/dialog';
import { profileApi, ProjectApplication } from '@/lib/profile.service';
import { formatUserIdentity } from '@/lib/identity';
import { ProjectRoleBadge } from './ProjectRoleBadge';

interface ApplicationManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onStatusChange?: () => void | Promise<void>;
}

export function ApplicationManagementDialog({
  isOpen,
  onClose,
  projectId,
  onStatusChange,
}: ApplicationManagementDialogProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [applications, setApplications] = useState<ProjectApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadApplications();
    }
  }, [projectId, isOpen]);

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
      await onStatusChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (applicationId: string, notes: string) => {
    setProcessingId(applicationId);
    try {
      await profileApi.updateApplicationStatus(applicationId, 'rejected', notes.trim() || undefined);
      setApplications((prev) =>
        prev.map((a) =>
          a.id === applicationId
            ? { ...a, status: 'rejected' as const, review_notes: notes.trim() || null }
            : a
        )
      );
      await onStatusChange?.();
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

  return (
    <Dialog isOpen={isOpen} onClose={onClose} containerClassName="items-end sm:items-center">
      <div className={cn(
        "w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col rounded-t-[1.25rem] sm:rounded-xl",
        theme === "dark" ? "bg-gray-800" : "bg-white"
      )}>
        {/* Header */}
        <div className={cn(
          "flex items-center justify-between p-4 border-b flex-shrink-0",
          theme === "dark" ? "border-gray-700" : "border-gray-200"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              theme === "dark" ? "bg-teal-500/20 text-teal-400" : "bg-teal-100 text-teal-600"
            )}>
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className={cn(
                "text-lg font-bold",
                theme === "dark" ? "text-white" : "text-gray-900"
              )}>
                {t('project.application.title')}
              </h2>
              {pendingApplications.length > 0 && (
                <p className={cn(
                  "text-base",
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                )}>
                  {pendingApplications.length} 个待处理申请
                </p>
              )}
            </div>
          </div>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div role="alert" className={cn(
              "mb-4 p-3 rounded-lg text-base",
              theme === "dark" ? "bg-red-900/30 text-red-400" : "bg-red-50 text-red-600"
            )}>
              {error}
            </div>
          )}

          {isLoading ? (
            <div
              role="status"
              aria-busy="true"
              className={cn(
                "flex items-center justify-center gap-2 py-8",
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              )}
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t('common.loading')}</span>
            </div>
          ) : applications.length === 0 ? (
            <div className={cn(
              "text-center py-12",
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            )}>
              <Users className={cn(
                "w-12 h-12 mx-auto mb-3 opacity-50",
                theme === "dark" ? "text-gray-600" : "text-gray-300"
              )} />
              <p>{t('profile.application.noApplications')}</p>
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
                  onReject={(notes: string) => handleReject(app.id, notes)}
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
                    "text-base font-medium pt-4 pb-2",
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
      </div>
    </Dialog>
  );
}

// Application Card sub-component
interface ApplicationCardProps {
  application: ProjectApplication;
  theme: string;
  expanded: boolean;
  onToggleExpand: () => void;
  onApprove?: () => void;
  onReject?: (notes: string) => void;
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
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');
  const desiredRole = application.desired_role || application.expertise || '未填写';
  const proposedContribution = application.proposed_contribution || application.motivation || '未填写';
  const weeklyTimeCommitment = application.weekly_time_commitment || '未填写';
  const displayName = formatUserIdentity(application, application.display_name);

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
                alt={displayName}
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
              {displayName}
            </div>
            <div className={cn(
              "text-base",
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            )}>
              {application.organization}
              {application.major && ` · ${application.major}`}
            </div>
            <ProjectRoleBadge seed={desiredRole} className="mt-2">
              申请角色：{desiredRole}
            </ProjectRoleBadge>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={cn(
            "px-2 py-1 rounded-full text-sm font-medium",
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
            <div>
              <ProjectRoleBadge seed={desiredRole}>
                申请角色：{desiredRole}
              </ProjectRoleBadge>
            </div>

            <div>
              <span className={cn(
                "text-base font-medium block mb-1",
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              )}>
                可贡献内容:
              </span>
              <p className={cn(
                "text-base whitespace-pre-wrap",
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              )}>
                {proposedContribution}
              </p>
            </div>

            <div>
              <span className={cn(
                "text-base font-medium",
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              )}>
                每周可投入时间:
              </span>
              <span className={cn(
                "ml-2",
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              )}>
                {weeklyTimeCommitment}
              </span>
            </div>

            {application.grade && (
              <div>
                <span className={cn(
                  "text-base font-medium",
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
                  "text-base font-medium block mb-1",
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                )}>
                  {t('project.application.form.researchExperience')}:
                </span>
                <p className={cn(
                  "text-base whitespace-pre-wrap",
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                )}>
                  {application.research_experience}
                </p>
              </div>
            )}

            {application.expertise && (
              <div>
                <span className={cn(
                  "text-base font-medium block mb-1",
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                )}>
                  {t('project.application.form.expertise')}:
                </span>
                <p className={cn(
                  "text-base whitespace-pre-wrap",
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                )}>
                  {application.expertise}
                </p>
              </div>
            )}

            {application.motivation && (
              <div>
                <span className={cn(
                  "text-base font-medium block mb-1",
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                )}>
                  {t('project.application.form.motivation')}:
                </span>
                <p className={cn(
                  "text-base whitespace-pre-wrap",
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                )}>
                  {application.motivation}
                </p>
              </div>
            )}

            <div className={cn(
              "text-sm",
              theme === "dark" ? "text-gray-500" : "text-gray-400"
            )}>
              <Clock className="w-3 h-3 inline mr-1" />
              {formatDate(application.created_at)}
            </div>

            {application.review_notes && (
              <div className={cn(
                "p-2 rounded text-base",
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
                    "flex-1 px-3 py-2 rounded-lg text-base font-medium flex items-center justify-center gap-1 transition-colors",
                    theme === "dark"
                      ? "bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                      : "bg-green-500 hover:bg-green-600 text-white disabled:opacity-50"
                  )}
                >
                  <Check className="w-4 h-4" />
                  通过为 {desiredRole} 成员
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsRejecting(true);
                  }}
                  disabled={isProcessing}
                  className={cn(
                    "flex-1 px-3 py-2 rounded-lg text-base font-medium flex items-center justify-center gap-1 transition-colors",
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

            {application.status === 'pending' && isRejecting && (
              <div
                className={cn(
                  "rounded-lg border p-3",
                  theme === "dark" ? "border-gray-600 bg-gray-800/60" : "border-gray-200 bg-white"
                )}
              >
                <label
                  htmlFor={`reject-notes-${application.id}`}
                  className={cn(
                    "mb-2 block text-base font-medium",
                    theme === "dark" ? "text-gray-300" : "text-gray-600"
                  )}
                >
                  {t('profile.application.reviewNotes') || '审核备注（可选）'}
                </label>
                <textarea
                  id={`reject-notes-${application.id}`}
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  rows={3}
                  disabled={isProcessing}
                  placeholder="可填写拒绝原因，申请人可见（选填）"
                  className={cn(
                    "w-full rounded-lg border px-3 py-2 text-base outline-none transition-colors focus:border-teal-500",
                    theme === "dark"
                      ? "border-gray-600 bg-gray-900/60 text-gray-200 placeholder:text-gray-500"
                      : "border-gray-300 bg-white text-gray-800 placeholder:text-gray-400"
                  )}
                />
                <div className="mt-2 flex justify-end gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsRejecting(false);
                    }}
                    disabled={isProcessing}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-base font-medium transition-colors",
                      theme === "dark"
                        ? "bg-gray-600 text-gray-200 hover:bg-gray-500"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    )}
                  >
                    取消
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onReject?.(rejectNotes);
                    }}
                    disabled={isProcessing}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-base font-medium text-white transition-colors disabled:opacity-50",
                      theme === "dark"
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-red-500 hover:bg-red-600"
                    )}
                  >
                    {isProcessing ? '处理中…' : '拒绝申请'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
