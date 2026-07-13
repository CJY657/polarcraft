/**
 * Research project page view-model helpers
 * 研究课题页面视图模型辅助函数
 *
 * Pure, presentation-agnostic helpers extracted from ResearchProjectPage so the
 * page component stays focused on orchestration and the logic stays unit-testable.
 */

import type { ProjectMember, ProjectWithMembers } from "@/lib/research.service";
import type { PublicProject, PublicProjectMember } from "@/lib/profile.service";

const ROLE_LABELS: Record<string, string> = {
  owner: "组长",
  member: "成员",
  admin: "成员",
  editor: "成员",
  viewer: "成员",
};

/** Narrow a member union down to a real (authenticated) project member. */
export function isProjectMember(
  member: ProjectMember | PublicProjectMember
): member is ProjectMember {
  return "user_id" in member && "id" in member;
}

/** Split newline-delimited research text into trimmed, non-empty items. */
export function splitResearchItems(value?: string | null): string[] {
  return (value ?? "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

/** Human-readable label for a member role, defaulting to the raw role. */
export function getRoleLabel(role: string): string {
  return ROLE_LABELS[role] || role;
}

/** Format an ISO date string into a localized zh-CN long date. */
export function formatProjectDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export interface ApplyButtonStateInput {
  isPublicGuestMode: boolean;
  hasPendingApplication: boolean;
  isRecruitmentClosed: boolean;
}

export interface ApplyButtonState {
  buttonLabel: string;
  bannerButtonLabel: string;
  disabled: boolean;
}

/** Labels and disabled state for the "apply to join" actions. */
export function getApplyButtonState({
  isPublicGuestMode,
  hasPendingApplication,
  isRecruitmentClosed,
}: ApplyButtonStateInput): ApplyButtonState {
  const resolveLabel = (guestLabel: string, defaultLabel: string) => {
    if (isPublicGuestMode) return guestLabel;
    if (hasPendingApplication) return "申请已提交";
    if (isRecruitmentClosed) return "招募已停止";
    return defaultLabel;
  };

  return {
    buttonLabel: resolveLabel("登录后申请加入", "申请加入课题"),
    bannerButtonLabel: resolveLabel("登录后加入", "申请加入"),
    disabled: !isPublicGuestMode && hasPendingApplication,
  };
}

export interface ApplicationProjectOptions {
  requireApproval: boolean;
  recruitmentRequirements: string | null;
  isRecruitmentClosed: boolean;
  maxMembers: number | null;
}

/**
 * Adapt an authenticated project into the PublicProject shape the application
 * form consumes. Public projects already match this shape and skip this path.
 */
export function buildApplicationProjectFromProject(
  project: ProjectWithMembers,
  { requireApproval, recruitmentRequirements, isRecruitmentClosed, maxMembers }: ApplicationProjectOptions
): PublicProject {
  const projectOwner = project.members.find((member) => member.role === "owner") ?? null;

  return {
    id: project.id,
    name_zh: project.name_zh,
    name_en: project.name_en,
    description_zh: project.description_zh,
    description_en: project.description_en,
    research_questions_zh: project.research_questions_zh,
    research_hypotheses_zh: project.research_hypotheses_zh,
    basic_plan_zh: project.basic_plan_zh,
    extended_plan_zh: project.extended_plan_zh,
    challenge_value_zh: project.challenge_value_zh,
    challenge_objectives_zh: project.challenge_objectives_zh,
    challenge_beginner_steps_zh: project.challenge_beginner_steps_zh,
    challenge_min_deliverables_zh: project.challenge_min_deliverables_zh,
    challenge_review_criteria_zh: project.challenge_review_criteria_zh,
    challenge_timeline_zh: project.challenge_timeline_zh,
    challenge_difficulty: project.challenge_difficulty,
    challenge_roles_zh: project.challenge_roles_zh,
    challenge_missing_roles_zh: project.challenge_missing_roles_zh,
    challenge_progress_zh: project.challenge_progress_zh,
    thumbnail: project.thumbnail,
    status: project.status,
    visibility: "public" as const,
    require_approval: requireApproval,
    recruitment_requirements: recruitmentRequirements,
    is_recruiting: !isRecruitmentClosed,
    max_members: maxMembers,
    member_count: project.member_count,
    is_member: false,
    has_pending_application: project.has_pending_application,
    owner_username: projectOwner?.username ?? null,
    owner_nickname: projectOwner?.nickname ?? null,
    owner_real_name: projectOwner?.real_name ?? null,
    owner_show_real_name_publicly: projectOwner?.show_real_name_publicly ?? false,
    owner_avatar_url: projectOwner?.avatar_url ?? null,
    members: project.members.map((member) => ({
      username: member.username,
      nickname: member.nickname ?? null,
      real_name: member.real_name ?? null,
      show_real_name_publicly: member.show_real_name_publicly ?? false,
      avatar_url: member.avatar_url,
      role: member.role,
      member_role_label: member.member_role_label ?? null,
    })),
    created_at: project.created_at,
    updated_at: project.updated_at,
  };
}
