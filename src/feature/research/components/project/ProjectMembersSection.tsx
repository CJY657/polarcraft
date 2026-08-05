/**
 * Project Members Section
 * 研究团队区块
 *
 * Sidebar rail card: one row per active member, former members folded into a
 * collapsible the owner can expand to pull someone back in.
 */

import { Crown, Loader2 } from "lucide-react";
import { cn } from "@/utils/classNames";
import { formatUserIdentity, getUserIdentityInitial } from "@/lib/identity";
import type {
  FormerProjectMember,
  PendingProjectLeadershipTransfer,
  ProjectMember,
} from "@/lib/research.service";
import type { PublicProjectMember } from "@/lib/profile.service";
import { ResearchSectionCard } from "../shared/ResearchSectionCard";
import {
  formatProjectDate,
  getRoleLabel,
  isProjectMember,
} from "../../pages/researchProjectViewModel";

export function ProjectMembersSection({
  members,
  formerMembers,
  hasProject,
  currentUserId,
  isReadOnlyMode,
  isOwner,
  isAdmin,
  canManageProject,
  pendingApplicationCount,
  restoreMemberError,
  isAddingFormerMemberId,
  pendingLeadershipTransfer,
  leadershipTransferError,
  leadershipTransferAction,
  onOpenApplications,
  onRequestRemoveMember,
  onRestoreFormerMember,
  onRequestLeadershipTransfer,
  onAcceptLeadershipTransfer,
  onDeclineLeadershipTransfer,
  onCancelLeadershipTransfer,
}: {
  members: Array<ProjectMember | PublicProjectMember>;
  formerMembers: FormerProjectMember[];
  hasProject: boolean;
  currentUserId?: string;
  isReadOnlyMode: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  canManageProject: boolean;
  pendingApplicationCount: number;
  restoreMemberError: string | null;
  isAddingFormerMemberId: string | null;
  pendingLeadershipTransfer?: PendingProjectLeadershipTransfer | null;
  leadershipTransferError: string | null;
  leadershipTransferAction: string | null;
  onOpenApplications: () => void;
  onRequestRemoveMember: (member: ProjectMember) => void;
  onRestoreFormerMember: (member: FormerProjectMember) => void;
  onRequestLeadershipTransfer: (member: ProjectMember) => void;
  onAcceptLeadershipTransfer: () => void;
  onDeclineLeadershipTransfer: () => void;
  onCancelLeadershipTransfer: () => void;
}) {
  const isLeadershipTransferPending = leadershipTransferAction !== null;
  const visiblePendingLeadershipTransfer =
    pendingLeadershipTransfer
    && (isOwner || isAdmin || pendingLeadershipTransfer.nominee.user_id === currentUserId)
      ? pendingLeadershipTransfer
      : null;

  return (
    <ResearchSectionCard
      title="团队成员"
      actions={
        <>
          <span className="research-chip rounded-full px-2.5 py-0.5 text-sm font-semibold tabular-nums">
            {members.length}
          </span>
          {canManageProject && (
            <button
              onClick={onOpenApplications}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold",
                pendingApplicationCount > 0
                  ? "glass-button glass-button-primary text-white"
                  : "glass-button"
              )}
            >
              申请管理
              {pendingApplicationCount > 0 && (
                <span className="min-w-[1.25rem] rounded-full bg-white px-1.5 text-xs font-bold tabular-nums text-[var(--clay-pink)]">
                  {pendingApplicationCount}
                </span>
              )}
            </button>
          )}
        </>
      }
    >
      {visiblePendingLeadershipTransfer && (
        <div className="research-tint-ochre mb-3 rounded-lg border px-3 py-3">
          <div className="flex items-start gap-2.5">
            <Crown className="mt-0.5 h-4 w-4 shrink-0 text-[var(--clay-ochre)]" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[var(--paper-foreground)]">
                {formatUserIdentity(visiblePendingLeadershipTransfer.outgoing_owner)} 已邀请{" "}
                {formatUserIdentity(visiblePendingLeadershipTransfer.nominee)} 接任组长
              </p>
              <p className="mt-1 text-xs leading-5 text-[var(--glass-text-muted)]">
                由 {formatUserIdentity(visiblePendingLeadershipTransfer.initiator)} 发起 · 有效期至{" "}
                {new Date(visiblePendingLeadershipTransfer.expires_at).toLocaleString("zh-CN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {(visiblePendingLeadershipTransfer.can_accept
            || visiblePendingLeadershipTransfer.can_decline
            || visiblePendingLeadershipTransfer.can_cancel) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {visiblePendingLeadershipTransfer.can_accept && (
                <button
                  type="button"
                  onClick={onAcceptLeadershipTransfer}
                  disabled={isLeadershipTransferPending}
                  className="glass-button glass-button-primary inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {leadershipTransferAction === "accept" && <Loader2 className="h-3 w-3 animate-spin" />}
                  接受
                </button>
              )}
              {visiblePendingLeadershipTransfer.can_decline && (
                <button
                  type="button"
                  onClick={onDeclineLeadershipTransfer}
                  disabled={isLeadershipTransferPending}
                  className="glass-button inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {leadershipTransferAction === "decline" && <Loader2 className="h-3 w-3 animate-spin" />}
                  拒绝
                </button>
              )}
              {visiblePendingLeadershipTransfer.can_cancel && (
                <button
                  type="button"
                  onClick={onCancelLeadershipTransfer}
                  disabled={isLeadershipTransferPending}
                  className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold text-[var(--color-destructive)] hover:bg-[var(--glass-chip)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {leadershipTransferAction === "cancel" && <Loader2 className="h-3 w-3 animate-spin" />}
                  取消转让
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {leadershipTransferError && (
        <div className="research-error mb-3 rounded-md px-3 py-2 text-sm" role="alert">
          {leadershipTransferError}
        </div>
      )}

      <ul className="grid gap-1">
        {members.map((member) => {
          const isActualProjectMember = isProjectMember(member);
          const isSelf = isActualProjectMember && currentUserId === member.user_id;
          const isSelfRemoval = isSelf && member.role !== "owner";
          const canRemove =
            hasProject
            && isActualProjectMember
            && !isReadOnlyMode
            && (isSelfRemoval || ((isOwner || isAdmin) && member.role !== "owner" && !isSelf));
          const memberKey = isActualProjectMember ? member.id : `${member.username}-${member.role}`;
          const memberRoleLabel = member.member_role_label?.trim();
          const isPendingNominee =
            isActualProjectMember
            && visiblePendingLeadershipTransfer?.nominee.user_id === member.user_id;
          const canNominate =
            hasProject
            && isActualProjectMember
            && !isReadOnlyMode
            && member.active !== false
            && member.role !== "owner"
            && (
              (!visiblePendingLeadershipTransfer && !pendingLeadershipTransfer && (isOwner || isAdmin))
              || Boolean(visiblePendingLeadershipTransfer?.can_replace && !isPendingNominee)
            );
          const nominateAction = isActualProjectMember ? `nominate:${member.user_id}` : "";

          return (
            <li
              key={memberKey}
              className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-[var(--research-head)]"
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
                  member.role === "owner"
                    ? "research-tint-ochre text-[var(--clay-ochre)]"
                    : "border-[var(--research-line)] bg-[var(--glass-chip)] text-[var(--glass-text-muted)]"
                )}
              >
                {getUserIdentityInitial(member)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-[var(--paper-foreground)]">
                  {formatUserIdentity(member)}
                </p>
                {memberRoleLabel && (
                  <p className="truncate text-sm text-[var(--glass-text-muted)]">{memberRoleLabel}</p>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 text-xs font-semibold",
                    member.role === "owner" ? "research-chip research-chip-accent" : "research-chip"
                  )}
                >
                  {getRoleLabel(member.role)}
                </span>
                {(canNominate || canRemove) && (
                  <div className="flex items-center gap-1">
                    {canNominate && (
                      <button
                        type="button"
                        onClick={() => {
                          if (isActualProjectMember) {
                            onRequestLeadershipTransfer(member);
                          }
                        }}
                        disabled={isLeadershipTransferPending}
                        className="glass-button inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {leadershipTransferAction === nominateAction && (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        )}
                        {visiblePendingLeadershipTransfer ? "更换人选" : "转让组长"}
                      </button>
                    )}
                    {canRemove && (
                      <button
                        onClick={() => {
                          if (isActualProjectMember) {
                            onRequestRemoveMember(member);
                          }
                        }}
                        className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-[var(--color-destructive)] hover:bg-[var(--glass-chip)]"
                      >
                        {isSelfRemoval ? "退出" : "移除"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {canManageProject && formerMembers.length > 0 && (
        <details className="mt-3 border-t border-[var(--research-line)] pt-3">
          <summary className="cursor-pointer text-sm font-semibold text-[var(--glass-text-muted)]">
            已退出成员（{formerMembers.length}）
          </summary>

          {restoreMemberError && (
            <div className="research-error mt-2 rounded-md px-3 py-2 text-sm">{restoreMemberError}</div>
          )}

          <ul className="mt-2 grid gap-1">
            {formerMembers.map((member) => (
              <li key={member.id} className="flex items-center gap-2.5 rounded-lg px-2 py-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--research-line)] bg-[var(--glass-chip)] text-sm font-semibold text-[var(--glass-text-muted)]">
                  {getUserIdentityInitial(member)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-medium text-[var(--paper-foreground)]">
                    {formatUserIdentity(member)}
                  </p>
                  <p className="truncate text-sm text-[var(--glass-text-muted)]">
                    {member.removed_at ? `${formatProjectDate(member.removed_at)} 退出` : "已离开课题"}
                  </p>
                </div>
                <button
                  onClick={() => void onRestoreFormerMember(member)}
                  disabled={isAddingFormerMemberId === member.user_id}
                  className="glass-button inline-flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isAddingFormerMemberId === member.user_id && (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  )}
                  拉回
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </ResearchSectionCard>
  );
}
