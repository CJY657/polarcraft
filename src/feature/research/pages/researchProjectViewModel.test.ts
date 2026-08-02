import { describe, expect, it } from "vitest";
import type { UserProfile } from "@/lib/auth.service";
import type { ProjectWithMembers } from "@/lib/research.service";
import type { ProjectSettings, PublicProjectDetail } from "@/lib/profile.service";
import {
  buildResearchProjectViewModel,
  buildApplicationProjectFromProject,
  getApplyButtonState,
  getRoleLabel,
  isProjectMember,
  splitResearchItems,
} from "./researchProjectViewModel";

function createProject(overrides: Partial<ProjectWithMembers> = {}): ProjectWithMembers {
  return {
    id: "project-1",
    name_zh: "偏振课题",
    name_en: null,
    description_zh: "课题简介",
    description_en: null,
    research_questions_zh: null,
    research_hypotheses_zh: null,
    basic_plan_zh: null,
    extended_plan_zh: null,
    thumbnail: null,
    status: "active",
    is_public: true,
    allow_guest_comments: false,
    enable_task_board: true,
    default_canvas_id: null,
    member_count: 1,
    canvas_count: 0,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-02T00:00:00.000Z",
    members: [
      {
        id: "member-owner",
        project_id: "project-1",
        user_id: "owner-1",
        role: "owner",
        joined_at: "2026-01-01T00:00:00.000Z",
        username: "组长",
        nickname: "阿组",
        avatar_url: null,
      },
    ],
    former_members: [],
    has_pending_application: false,
    ...overrides,
  } as ProjectWithMembers;
}

function createUser(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: "owner-1",
    username: "组长",
    nickname: null,
    real_name: null,
    show_real_name_publicly: false,
    role: "user",
    avatar_url: null,
    email: null,
    email_verified: false,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    last_login_at: null,
    ...overrides,
  };
}

function createSettings(overrides: Partial<ProjectSettings> = {}): ProjectSettings {
  return {
    id: "settings-1",
    project_id: "project-1",
    visibility: "public",
    require_approval: true,
    recruitment_requirements: null,
    max_members: null,
    recruitment_deadline: null,
    is_recruiting: true,
    contact_email: null,
    discussion_channel: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function createPublicProject(overrides: Partial<PublicProjectDetail> = {}): PublicProjectDetail {
  return {
    id: "project-1",
    name_zh: "公开课题",
    name_en: null,
    description_zh: "公开课题简介",
    description_en: null,
    thumbnail: null,
    status: "active",
    visibility: "public",
    require_approval: true,
    recruitment_requirements: null,
    is_recruiting: true,
    max_members: null,
    member_count: 1,
    is_member: false,
    has_pending_application: false,
    owner_username: "组长",
    owner_avatar_url: null,
    members: [{ username: "组长", avatar_url: null, role: "owner" }],
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    is_public: true,
    allow_guest_comments: false,
    enable_task_board: false,
    ...overrides,
  };
}

describe("splitResearchItems", () => {
  it("splits on newlines and drops blank entries", () => {
    expect(splitResearchItems("问题一\n\n 问题二 \r\n问题三")).toEqual([
      "问题一",
      "问题二",
      "问题三",
    ]);
  });

  it("returns an empty array for nullish input", () => {
    expect(splitResearchItems(null)).toEqual([]);
    expect(splitResearchItems(undefined)).toEqual([]);
  });
});

describe("getRoleLabel", () => {
  it("maps known roles to Chinese labels", () => {
    expect(getRoleLabel("owner")).toBe("组长");
    expect(getRoleLabel("member")).toBe("成员");
    expect(getRoleLabel("editor")).toBe("成员");
  });

  it("falls back to the raw role for unknown values", () => {
    expect(getRoleLabel("mystery")).toBe("mystery");
  });
});

describe("isProjectMember", () => {
  it("distinguishes authenticated members from public members", () => {
    const project = createProject();
    expect(isProjectMember(project.members[0])).toBe(true);
    expect(
      isProjectMember({ username: "访客", avatar_url: null, role: "member" })
    ).toBe(false);
  });
});

describe("getApplyButtonState", () => {
  it("prefers guest labels in public guest mode", () => {
    expect(
      getApplyButtonState({
        isPublicGuestMode: true,
        hasPendingApplication: false,
        isRecruitmentClosed: false,
      })
    ).toEqual({
      buttonLabel: "登录后申请加入",
      bannerButtonLabel: "登录后加入",
      disabled: false,
    });
  });

  it("marks pending applications as submitted and disabled", () => {
    expect(
      getApplyButtonState({
        isPublicGuestMode: false,
        hasPendingApplication: true,
        isRecruitmentClosed: false,
      })
    ).toEqual({
      buttonLabel: "申请已提交",
      bannerButtonLabel: "申请已提交",
      disabled: true,
    });
  });

  it("shows recruitment-closed labels without disabling", () => {
    expect(
      getApplyButtonState({
        isPublicGuestMode: false,
        hasPendingApplication: false,
        isRecruitmentClosed: true,
      })
    ).toEqual({
      buttonLabel: "招募已停止",
      bannerButtonLabel: "招募已停止",
      disabled: false,
    });
  });
});

describe("buildApplicationProjectFromProject", () => {
  it("adapts an authenticated project into the public application shape", () => {
    const project = createProject();
    const result = buildApplicationProjectFromProject(project, {
      requireApproval: true,
      recruitmentRequirements: "需要基础光学知识",
      isRecruitmentClosed: false,
      maxMembers: 6,
    });

    expect(result).toMatchObject({
      id: "project-1",
      visibility: "public",
      require_approval: true,
      recruitment_requirements: "需要基础光学知识",
      is_recruiting: true,
      max_members: 6,
      is_member: false,
      owner_username: "组长",
      owner_nickname: "阿组",
    });
    expect(result.members).toHaveLength(1);
    expect(result.members[0]).toMatchObject({ username: "组长", role: "owner" });
  });

  it("marks recruitment closed as not recruiting", () => {
    const result = buildApplicationProjectFromProject(createProject(), {
      requireApproval: false,
      recruitmentRequirements: null,
      isRecruitmentClosed: true,
      maxMembers: null,
    });

    expect(result.is_recruiting).toBe(false);
    expect(result.max_members).toBeNull();
  });
});

describe("buildResearchProjectViewModel", () => {
  it("projects authenticated owner data into a single set of capabilities and tabs", () => {
    const project = createProject({
      research_questions_zh: "核心问题",
      basic_plan_zh: "基础计划",
    });
    const result = buildResearchProjectViewModel({
      projectId: "project-1",
      isExampleProject: false,
      project,
      publicProject: null,
      settings: createSettings(),
      user: createUser(),
      isAuthenticated: true,
      isAuthLoading: false,
      isReadOnlyRoute: false,
      activeTab: "design",
      hasPeerReviewContent: false,
    });

    expect(result.displayProject).toBe(project);
    expect(result).toMatchObject({
      isOwner: true,
      isMember: true,
      isReadOnlyMode: false,
      canManageProject: true,
      canDeleteProject: true,
      canManageEvidence: true,
      canShowDiscussionSection: true,
      canShowTasksSection: true,
      canShowAgentPanel: true,
      currentTab: "design",
      usePublicEndpoint: false,
    });
    expect(result.projectTabs.map((tab) => tab.id)).toEqual([
      "overview",
      "design",
      "evidence",
      "tasks",
      "discussion",
    ]);
    expect(result.researchOutline).toMatchObject({
      topicSummary: "课题简介",
      questions: ["核心问题"],
      basicPlan: "基础计划",
    });
  });

  it("projects public guest data into the public read-only boundary", () => {
    const publicProject = createPublicProject();
    const result = buildResearchProjectViewModel({
      projectId: "project-1",
      isExampleProject: false,
      project: null,
      publicProject,
      settings: null,
      user: null,
      isAuthenticated: false,
      isAuthLoading: false,
      isReadOnlyRoute: false,
      activeTab: "tasks",
      hasPeerReviewContent: true,
    });

    expect(result.displayProject).toBe(publicProject);
    expect(result.applicationProject).toBe(publicProject);
    expect(result).toMatchObject({
      isPublicGuestMode: true,
      isReadOnlyMode: true,
      backHref: "/lab/explore",
      applyButtonLabel: "登录后申请加入",
      applyBannerButtonLabel: "登录后加入",
      canManageProject: false,
      canShowEvidenceSection: true,
      canShowPeerReviewSection: true,
      canShowTasksSection: false,
      canShowDiscussionSection: false,
      currentTab: "overview",
      usePublicEndpoint: true,
    });
    expect(result.projectTabs.map((tab) => tab.id)).toEqual([
      "overview",
      "design",
      "evidence",
      "review",
    ]);
  });
});
