/**
 * Project Members Section
 * 研究团队区块
 *
 * Renders the active member grid and the former-member restore grid. Extracted
 * from ResearchProjectPage; markup and class names are unchanged.
 */

import {
  Crown,
  Loader2,
  UserCheck,
  UserMinus,
  UserPlus,
} from "lucide-react";
import { cn } from "@/utils/classNames";
import { formatUserIdentity, getUserIdentityInitial } from "@/lib/identity";
import type { FormerProjectMember, ProjectMember } from "@/lib/research.service";
import type { PublicProjectMember } from "@/lib/profile.service";
import { ProjectRoleBadge } from "./ProjectRoleBadge";
import {
  formatProjectDate,
  getRoleLabel,
  isProjectMember,
} from "../../pages/researchProjectViewModel";

function getRoleIcon(role: string) {
  switch (role) {
    case "owner":
      return <Crown className="w-4 h-4 text-amber-500" />;
    case "member":
    case "admin":
    case "editor":
    case "viewer":
      return <UserCheck className="w-4 h-4 text-blue-500" />;
    default:
      return null;
  }
}

export function ProjectMembersSection({
  members,
  formerMembers,
  hasProject,
  currentUserId,
  theme,
  isReadOnlyMode,
  isOwner,
  isAdmin,
  canManageProject,
  pendingApplicationCount,
  restoreMemberError,
  isAddingFormerMemberId,
  onOpenApplications,
  onRequestRemoveMember,
  onRestoreFormerMember,
  variant = "full",
}: {
  members: Array<ProjectMember | PublicProjectMember>;
  formerMembers: FormerProjectMember[];
  hasProject: boolean;
  currentUserId?: string;
  theme: "dark" | "light";
  isReadOnlyMode: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  canManageProject: boolean;
  pendingApplicationCount: number;
  restoreMemberError: string | null;
  isAddingFormerMemberId: string | null;
  onOpenApplications: () => void;
  onRequestRemoveMember: (member: ProjectMember) => void;
  onRestoreFormerMember: (member: FormerProjectMember) => void;
  /** "rail" renders single-column member cards for the narrow desktop sidebar */
  variant?: "full" | "rail";
}) {
  const memberGridClass = cn(
    "grid grid-cols-1 gap-4",
    variant === "full" && "md:grid-cols-2 lg:grid-cols-3"
  );

  return (
    <section className="research-panel mb-4 rounded-[1.6rem] p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            className="text-xl font-semibold text-[var(--paper-foreground)]"
            style={{ fontFamily: "var(--font-ui-display)" }}
          >
            研究团队
          </h2>
        </div>

        {canManageProject && (
          <button
            onClick={onOpenApplications}
            className={cn(
              "relative inline-flex items-center gap-2 self-start rounded-full px-3 py-1.5 text-sm font-medium transition-all sm:self-auto",
              pendingApplicationCount > 0
                ? "glass-button glass-button-primary text-white"
                : "glass-button"
            )}
          >
            <UserCheck className="w-4 h-4" />
            申请管理
            {pendingApplicationCount > 0 && (
              <span className={cn(
                "ml-1 min-w-[22px] h-5.5 flex items-center justify-center px-1.5 rounded-full text-sm font-bold",
                "bg-white text-amber-600"
              )}>
                {pendingApplicationCount}
              </span>
            )}
          </button>
        )}
      </div>
      <div className={memberGridClass}>
        {members.map((member) => {
          // 判断是否可以移除该成员
          const isActualProjectMember = isProjectMember(member);
          const isSelf = isActualProjectMember && currentUserId === member.user_id;
          const isSelfRemoval = isSelf && member.role !== 'owner';
          const canRemove = hasProject && isActualProjectMember && !isReadOnlyMode && (
            isSelfRemoval || // 成员可以移除自己（退出）
            ((isOwner || isAdmin) && member.role !== 'owner' && !isSelf) // 组长或管理员可以移除其他成员
          );
          const memberKey = isActualProjectMember ? member.id : `${member.username}-${member.role}`;
          const memberRoleLabel = member.member_role_label?.trim();
          const memberDisplayName = formatUserIdentity(member);

          return (
            <div
              key={memberKey}
              className="research-panel-soft flex items-center gap-3 rounded-[1.25rem] p-3"
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full text-base font-medium",
                  member.role === "owner"
                    ? "bg-amber-500/20 text-amber-500"
                    : theme === "dark"
                    ? "bg-gray-700 text-gray-300"
                    : "bg-gray-100 text-gray-600"
                )}
              >
                {getUserIdentityInitial(member)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium text-[var(--paper-foreground)]">{memberDisplayName}</span>
                  {getRoleIcon(member.role)}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-[var(--glass-text-muted)]">{getRoleLabel(member.role)}</span>
                  {memberRoleLabel && (
                    <ProjectRoleBadge seed={memberRoleLabel} className="px-2.5 py-0.5 text-xs">
                      {memberRoleLabel}
                    </ProjectRoleBadge>
                  )}
                </div>
              </div>
              {canRemove && (
                <button
                  onClick={() => {
                    if (isActualProjectMember) {
                      onRequestRemoveMember(member);
                    }
                  }}
                  className="glass-button rounded-full p-2 text-[#b33d3d]"
                  title={isSelfRemoval ? "退出课题组" : "移除成员"}
                >
                  <UserMinus className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {canManageProject && formerMembers.length > 0 && (
        <div className="mt-6 border-t border-[var(--glass-stroke)] pt-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-[var(--paper-foreground)]">待恢复成员</h3>
            <p className="mt-1 text-base text-[var(--glass-text-muted)]">
              这些成员曾加入过本课题，组长可以将他们重新拉回，恢复后统一为成员权限。
            </p>
          </div>

          {restoreMemberError && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-base text-red-600 dark:bg-red-900/30 dark:text-red-400">
              {restoreMemberError}
            </div>
          )}

          <div className={memberGridClass}>
            {formerMembers.map((member) => {
              const memberDisplayName = formatUserIdentity(member);
              return (
              <div
                key={member.id}
                className="research-panel-soft flex items-center gap-3 rounded-[1.35rem] p-4"
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full text-base font-medium",
                    theme === "dark" ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"
                  )}
                >
                  {getUserIdentityInitial(member)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-[var(--paper-foreground)]">{memberDisplayName}</div>
                  <div className="text-sm text-[var(--glass-text-muted)]">
                    上次身份：{getRoleLabel(member.role)}
                  </div>
                  <div className="text-sm text-[var(--glass-text-muted)]">
                    {member.removed_at ? `移除于 ${formatProjectDate(member.removed_at)}` : "已离开课题"}
                  </div>
                </div>
                <button
                  onClick={() => void onRestoreFormerMember(member)}
                  disabled={isAddingFormerMemberId === member.user_id}
                  className="glass-button rounded-full p-2 text-[var(--paper-link)] disabled:cursor-not-allowed disabled:opacity-60"
                  title="拉回成员"
                >
                  {isAddingFormerMemberId === member.user_id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                </button>
              </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
