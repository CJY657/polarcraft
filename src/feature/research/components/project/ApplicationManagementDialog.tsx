/**
 * Application Management Dialog Component
 * 申请管理对话框组件
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X, Clock, User, ChevronDown, ChevronUp, Users, Loader2 } from 'lucide-react';
import { cn } from '@/utils/classNames';
import { Dialog } from '@/components/ui/dialog';
import { ResearchDialogHead, RESEARCH_DIALOG_PANEL } from '../shared/ResearchDialog';
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
      pending: 'research-tint-ochre',
      approved: 'research-tint-mint',
      rejected: 'research-tint-pink',
      withdrawn: 'research-chip',
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
      <div className={cn(RESEARCH_DIALOG_PANEL, "flex max-h-[min(92dvh,90vh)] flex-col rounded-t-[1.25rem] sm:rounded-xl")}>
        {/* Header */}
        <ResearchDialogHead
          title={t('project.application.title')}
          note={pendingApplications.length > 0 ? `${pendingApplications.length} 个待处理申请` : undefined}
          onClose={onClose}
        />

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div role="alert" className="research-error mb-4 rounded-lg p-3 text-base">
              {error}
            </div>
          )}

          {isLoading ? (
            <div
              role="status"
              aria-busy="true"
              className="flex items-center justify-center gap-2 py-8 text-[var(--research-muted)]"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t('common.loading')}</span>
            </div>
          ) : applications.length === 0 ? (
            <div className="py-12 text-center text-[var(--research-muted)]">
              <Users className="mx-auto mb-3 h-12 w-12 text-[var(--research-muted)] opacity-50" />
              <p>{t('profile.application.noApplications')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Pending applications first */}
              {pendingApplications.map((app) => (
                <ApplicationCard
                  key={app.id}
                  application={app}
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
                  <div className="pt-4 pb-2 text-base font-medium text-[var(--research-muted)]">
                    已处理
                  </div>
                  {processedApplications.map((app) => (
                    <ApplicationCard
                      key={app.id}
                      application={app}
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
    <div className="research-panel-soft overflow-hidden rounded-xl">
      {/* Header - always visible */}
      <div
        onClick={onToggleExpand}
        className="flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-[var(--research-chip)]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--research-chip)]">
            {application.avatar_url ? (
              <img
                src={application.avatar_url}
                alt={displayName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="h-5 w-5 text-[var(--research-muted)]" />
            )}
          </div>
          <div>
            <div className="font-medium text-[var(--paper-foreground)]">
              {displayName}
            </div>
            <div className="text-base text-[var(--research-muted)]">
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
            "rounded-full border px-2 py-1 text-sm font-medium",
            getStatusBadge(application.status)
          )}>
            {getStatusText(application.status)}
          </span>
          {expanded ? (
            <ChevronUp className="h-5 w-5 text-[var(--research-muted)]" />
          ) : (
            <ChevronDown className="h-5 w-5 text-[var(--research-muted)]" />
          )}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-[var(--research-line)] px-4 pb-4">
          <div className="pt-4 space-y-3">
            <div>
              <ProjectRoleBadge seed={desiredRole}>
                申请角色：{desiredRole}
              </ProjectRoleBadge>
            </div>

            <div>
              <span className="mb-1 block text-base font-medium text-[var(--research-muted)]">
                可贡献内容:
              </span>
              <p className="whitespace-pre-wrap text-base text-[var(--paper-foreground)]">
                {proposedContribution}
              </p>
            </div>

            <div>
              <span className="text-base font-medium text-[var(--research-muted)]">
                每周可投入时间:
              </span>
              <span className="ml-2 text-[var(--paper-foreground)]">
                {weeklyTimeCommitment}
              </span>
            </div>

            {application.grade && (
              <div>
                <span className="text-base font-medium text-[var(--research-muted)]">
                  {t('project.application.form.grade')}:
                </span>
                <span className="ml-2 text-[var(--paper-foreground)]">
                  {application.grade}
                </span>
              </div>
            )}

            {application.research_experience && (
              <div>
                <span className="mb-1 block text-base font-medium text-[var(--research-muted)]">
                  {t('project.application.form.researchExperience')}:
                </span>
                <p className="whitespace-pre-wrap text-base text-[var(--paper-foreground)]">
                  {application.research_experience}
                </p>
              </div>
            )}

            {application.expertise && (
              <div>
                <span className="mb-1 block text-base font-medium text-[var(--research-muted)]">
                  {t('project.application.form.expertise')}:
                </span>
                <p className="whitespace-pre-wrap text-base text-[var(--paper-foreground)]">
                  {application.expertise}
                </p>
              </div>
            )}

            {application.motivation && (
              <div>
                <span className="mb-1 block text-base font-medium text-[var(--research-muted)]">
                  {t('project.application.form.motivation')}:
                </span>
                <p className="whitespace-pre-wrap text-base text-[var(--paper-foreground)]">
                  {application.motivation}
                </p>
              </div>
            )}

            <div className="text-sm text-[var(--research-muted)]">
              <Clock className="w-3 h-3 inline mr-1" />
              {formatDate(application.created_at)}
            </div>

            {application.review_notes && (
              <div className="rounded-lg bg-[var(--research-chip)] p-2 text-base">
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
                  className="research-button-primary flex flex-1 items-center justify-center gap-1 rounded-full px-3 py-2 text-base font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
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
                  className="research-button-danger flex flex-1 items-center justify-center gap-1 rounded-full px-3 py-2 text-base font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <X className="w-4 h-4" />
                  {t('profile.application.rejected')}
                </button>
              </div>
            )}

            {application.status === 'pending' && isRejecting && (
              <div className="research-panel-soft rounded-xl p-3">
                <label
                  htmlFor={`reject-notes-${application.id}`}
                  className="mb-2 block text-base font-medium text-[var(--paper-foreground)]"
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
                  className="research-input w-full rounded-lg px-3 py-2 text-base"
                />
                <div className="mt-2 flex justify-end gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsRejecting(false);
                    }}
                    disabled={isProcessing}
                    className="research-button rounded-full px-3 py-1.5 text-base font-medium"
                  >
                    取消
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onReject?.(rejectNotes);
                    }}
                    disabled={isProcessing}
                    className="research-button-danger rounded-full px-3 py-1.5 text-base font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
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
