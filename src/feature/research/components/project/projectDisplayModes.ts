import type { PublicProject } from "@/lib/profile.service";

export type ProjectDisplayMode = "recommended" | "member_count" | "created_desc" | "created_asc";

export const PROJECT_DISPLAY_MODE_OPTIONS: Array<{ value: ProjectDisplayMode; label: string }> = [
  { value: "recommended", label: "推荐优先" },
  { value: "member_count", label: "成员最多" },
  { value: "created_desc", label: "最新创建" },
  { value: "created_asc", label: "最早创建" },
];

function getTime(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

function compareDateDesc(left: string | null | undefined, right: string | null | undefined) {
  const leftTime = getTime(left);
  const rightTime = getTime(right);

  if (leftTime === null && rightTime === null) {
    return 0;
  }
  if (leftTime === null) {
    return 1;
  }
  if (rightTime === null) {
    return -1;
  }

  return rightTime - leftTime;
}

function compareDateAsc(left: string | null | undefined, right: string | null | undefined) {
  const leftTime = getTime(left);
  const rightTime = getTime(right);

  if (leftTime === null && rightTime === null) {
    return 0;
  }
  if (leftTime === null) {
    return 1;
  }
  if (rightTime === null) {
    return -1;
  }

  return leftTime - rightTime;
}

function compareStableTies(left: PublicProject, right: PublicProject) {
  return (
    Number(right.is_recruiting) - Number(left.is_recruiting) ||
    compareDateDesc(left.updated_at, right.updated_at) ||
    compareDateDesc(left.created_at, right.created_at) ||
    left.name_zh.localeCompare(right.name_zh, "zh-CN")
  );
}

function compareProjects(left: PublicProject, right: PublicProject, mode: ProjectDisplayMode) {
  if (mode === "member_count") {
    return right.member_count - left.member_count || compareStableTies(left, right);
  }

  if (mode === "created_desc") {
    return compareDateDesc(left.created_at, right.created_at) || compareStableTies(left, right);
  }

  if (mode === "created_asc") {
    return compareDateAsc(left.created_at, right.created_at) || compareStableTies(left, right);
  }

  return compareStableTies(left, right);
}

export function sortPublicProjectsByDisplayMode(projects: PublicProject[], mode: ProjectDisplayMode) {
  return [...projects].sort((left, right) => compareProjects(left, right, mode));
}
