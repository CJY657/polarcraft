// @vitest-environment jsdom

import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  PendingProjectLeadershipTransfer,
  ProjectWithMembers,
} from "@/lib/research.service";
import type { ProjectSettings, PublicProjectDetail } from "@/lib/profile.service";
import { ResearchProjectPage } from "./ResearchProjectPage";

const mockGetProject = vi.fn();
const mockGetProjectSettings = vi.fn();
const mockGetProjectCanvases = vi.fn();
const mockGetProjectApplications = vi.fn();
const mockGetPublicProjectById = vi.fn();
const mockAddProjectMember = vi.fn();
const mockDeleteProject = vi.fn();
const mockRemoveProjectMember = vi.fn();
const mockNominateProjectLeadershipTransfer = vi.fn();
const mockCancelProjectLeadershipTransfer = vi.fn();
const mockAcceptProjectLeadershipTransfer = vi.fn();
const mockDeclineProjectLeadershipTransfer = vi.fn();
const mockProjectEditDialog = vi.fn();
const mockProjectDiscussionSection = vi.fn();
const mockResearchAgentPanel = vi.fn();
const mockProjectEvidenceSection = vi.fn();
const mockProjectPeerReviewSection = vi.fn();
const mockProjectTasksSection = vi.fn();
const mockProjectActivityFeed = vi.fn();
const openDialog = vi.fn();

vi.mock("@/contexts/ThemeContext", () => ({
  useTheme: () => ({ theme: "light" }),
}));

const mockUseAuth = vi.fn();
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/stores/authDialogStore", () => ({
  useAuthDialogStore: () => openDialog,
}));

vi.mock("@/data/researchExampleProjects", () => ({
  getExampleProjectById: () => undefined,
}));

vi.mock("@/components/shared", () => ({
  PersistentHeader: ({ rightContent }: { rightContent?: unknown }) => <div>{rightContent}</div>,
}));

vi.mock("../components/project/ApplicationManagementDialog", () => ({
  ApplicationManagementDialog: ({ isOpen }: { isOpen: boolean }) => (
    isOpen ? <div>application-management-dialog</div> : null
  ),
}));

vi.mock("../components/project/ProjectEditDialog", () => ({
  ProjectEditDialog: (props: Record<string, unknown>) => {
    mockProjectEditDialog(props);
    return <div data-testid="project-edit-dialog" />;
  },
}));

vi.mock("../components/project/ProjectSettingsDialog", () => ({
  ProjectSettingsDialog: () => null,
}));

vi.mock("../components/project/ProjectApplicationForm", () => ({
  ProjectApplicationForm: ({
    isOpen,
    project,
  }: {
    isOpen: boolean;
    project: { is_recruiting: boolean } | null;
  }) => (
    isOpen
      ? (
        <div role="dialog">
          {project?.is_recruiting === false ? (
            <>
              <h2>招募已停止</h2>
              <p>该课题组已停止招募，暂时不能申请加入。</p>
            </>
          ) : (
            <div>application-form</div>
          )}
        </div>
      )
      : null
  ),
}));

vi.mock("../components/project/ResearchAgentPanel", () => ({
  ResearchAgentPanel: (props: Record<string, unknown>) => {
    mockResearchAgentPanel(props);
    return <div data-testid="research-agent-panel" />;
  },
}));

vi.mock("../components/project/ProjectEvidenceSection", () => ({
  ProjectEvidenceSection: (props: Record<string, unknown>) => {
    mockProjectEvidenceSection(props);
    return <div data-testid="project-evidence-section" />;
  },
}));

vi.mock("../components/project/ProjectPeerReviewSection", () => ({
  ProjectPeerReviewSection: (props: Record<string, unknown>) => {
    mockProjectPeerReviewSection(props);
    return <div data-testid="project-peer-review-section" />;
  },
}));

vi.mock("../components/project/ProjectTasksSection", () => ({
  ProjectTasksSection: (props: Record<string, unknown>) => {
    mockProjectTasksSection(props);
    return <div data-testid="project-tasks-section" />;
  },
}));

vi.mock("../components/project/ProjectActivityFeed", () => ({
  ProjectActivityFeed: (props: Record<string, unknown>) => {
    mockProjectActivityFeed(props);
    return <div data-testid="project-activity-feed" />;
  },
}));

vi.mock("../components/project/ProjectDiscussionSection", () => ({
  ProjectDiscussionSection: (props: Record<string, unknown>) => {
    mockProjectDiscussionSection(props);
    return <div data-testid="project-discussion-section" />;
  },
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, isOpen }: { children: unknown; isOpen: boolean }) => (isOpen ? <div>{children}</div> : null),
}));

vi.mock("@/lib/research.service", () => ({
  researchApi: {
    getProject: (...args: unknown[]) => mockGetProject(...args),
    getProjectCanvases: (...args: unknown[]) => mockGetProjectCanvases(...args),
    addProjectMember: (...args: unknown[]) => mockAddProjectMember(...args),
    deleteProject: (...args: unknown[]) => mockDeleteProject(...args),
    removeProjectMember: (...args: unknown[]) => mockRemoveProjectMember(...args),
    nominateProjectLeadershipTransfer: (...args: unknown[]) => mockNominateProjectLeadershipTransfer(...args),
    cancelProjectLeadershipTransfer: (...args: unknown[]) => mockCancelProjectLeadershipTransfer(...args),
    acceptProjectLeadershipTransfer: (...args: unknown[]) => mockAcceptProjectLeadershipTransfer(...args),
    declineProjectLeadershipTransfer: (...args: unknown[]) => mockDeclineProjectLeadershipTransfer(...args),
  },
}));

vi.mock("@/lib/profile.service", () => ({
  profileApi: {
    getProjectSettings: (...args: unknown[]) => mockGetProjectSettings(...args),
    getProjectApplications: (...args: unknown[]) => mockGetProjectApplications(...args),
    getPublicProjectById: (...args: unknown[]) => mockGetPublicProjectById(...args),
  },
}));

function renderPage(initialEntries: Array<{ pathname: string; hash?: string; state?: unknown }>) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/lab/projects" element={<div>projects-page</div>} />
        <Route path="/lab/projects/:projectId" element={<ResearchProjectPage />} />
      </Routes>
    </MemoryRouter>
  );
}

function SameHashNavigationProbe() {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate("/lab/projects/project-1#discussion-comment-comment-1")}
    >
      same comment notification
    </button>
  );
}

function renderPageWithSameHashProbe() {
  return render(
    <MemoryRouter initialEntries={[{ pathname: "/lab/projects/project-1", hash: "#discussion-comment-comment-1" }]}>
      <Routes>
        <Route
          path="/lab/projects/:projectId"
          element={(
            <>
              <SameHashNavigationProbe />
              <ResearchProjectPage />
            </>
          )}
        />
      </Routes>
    </MemoryRouter>
  );
}

function createProject(overrides: Partial<ProjectWithMembers> = {}): ProjectWithMembers {
  return {
    id: "project-1",
    owner_user_id: "owner-1",
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    members: [
      {
        id: "member-owner",
        project_id: "project-1",
        user_id: "owner-1",
        role: "owner",
        joined_at: new Date().toISOString(),
        username: "组长",
        avatar_url: null,
      },
    ],
    former_members: [],
    has_pending_application: false,
    ...overrides,
  };
}

function createPendingLeadershipTransfer(
  overrides: Partial<PendingProjectLeadershipTransfer> = {}
): PendingProjectLeadershipTransfer {
  return {
    id: "transfer-1",
    outgoing_owner: {
      user_id: "owner-1",
      username: "组长",
      avatar_url: null,
    },
    nominee: {
      user_id: "candidate-1",
      username: "小林",
      avatar_url: null,
    },
    initiator: {
      user_id: "owner-1",
      username: "组长",
      avatar_url: null,
    },
    created_at: "2026-08-05T08:00:00.000Z",
    expires_at: "2026-08-12T08:00:00.000Z",
    can_accept: false,
    can_decline: false,
    can_cancel: false,
    can_replace: false,
    ...overrides,
  };
}

function createLeadershipProject(overrides: Partial<ProjectWithMembers> = {}): ProjectWithMembers {
  return createProject({
    member_count: 3,
    members: [
      {
        id: "member-owner",
        project_id: "project-1",
        user_id: "owner-1",
        role: "owner",
        member_role_label: "课题统筹",
        joined_at: new Date().toISOString(),
        username: "组长",
        avatar_url: null,
      },
      {
        id: "member-candidate",
        project_id: "project-1",
        user_id: "candidate-1",
        role: "member",
        member_role_label: "记录表达",
        joined_at: new Date().toISOString(),
        username: "小林",
        avatar_url: null,
      },
      {
        id: "member-second-candidate",
        project_id: "project-1",
        user_id: "candidate-2",
        role: "member",
        member_role_label: "数据整理",
        joined_at: new Date().toISOString(),
        username: "小周",
        avatar_url: null,
      },
    ],
    ...overrides,
  });
}

function createProjectSettings(overrides: Partial<ProjectSettings> = {}): ProjectSettings {
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

function createPublicProjectDetail(overrides: Partial<PublicProjectDetail> = {}): PublicProjectDetail {
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
    is_recruiting: false,
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

describe("ResearchProjectPage", () => {
  beforeEach(() => {
    mockGetProject.mockReset();
    mockGetProjectSettings.mockReset();
    mockGetProjectCanvases.mockReset();
    mockGetProjectApplications.mockReset();
    mockGetPublicProjectById.mockReset();
    mockAddProjectMember.mockReset();
    mockDeleteProject.mockReset();
    mockRemoveProjectMember.mockReset();
    mockNominateProjectLeadershipTransfer.mockReset();
    mockCancelProjectLeadershipTransfer.mockReset();
    mockAcceptProjectLeadershipTransfer.mockReset();
    mockDeclineProjectLeadershipTransfer.mockReset();
    mockProjectEditDialog.mockReset();
    mockProjectDiscussionSection.mockReset();
    mockResearchAgentPanel.mockReset();
    mockProjectEvidenceSection.mockReset();
    mockProjectPeerReviewSection.mockReset();
    mockProjectTasksSection.mockReset();
    mockProjectActivityFeed.mockReset();
    openDialog.mockReset();
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { id: "owner-1", username: "owner", role: "user" },
      isAuthenticated: true,
      isLoading: false,
    });
    mockGetProjectSettings.mockResolvedValue(null);
    mockGetProjectCanvases.mockResolvedValue([]);
    mockGetProjectApplications.mockResolvedValue([]);
    mockAddProjectMember.mockResolvedValue(undefined);
    mockDeleteProject.mockResolvedValue(undefined);
    mockRemoveProjectMember.mockResolvedValue(undefined);
    mockNominateProjectLeadershipTransfer.mockResolvedValue(undefined);
    mockCancelProjectLeadershipTransfer.mockResolvedValue(undefined);
    mockAcceptProjectLeadershipTransfer.mockResolvedValue(undefined);
    mockDeclineProjectLeadershipTransfer.mockResolvedValue(undefined);
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    });
  });

  it("lets the owner re-add a former member as member", async () => {
    mockGetProject
      .mockResolvedValueOnce(
        createProject({
          former_members: [
            {
              id: "former-1",
              project_id: "project-1",
              user_id: "user-2",
              role: "member",
              active: false,
              joined_at: new Date().toISOString(),
              removed_at: new Date().toISOString(),
              username: "旧成员",
              avatar_url: null,
            },
          ],
        })
      )
      .mockResolvedValueOnce(createProject());

    renderPage([{ pathname: "/lab/projects/project-1" }]);

    expect(await screen.findByText(/已退出成员/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "拉回" }));

    await waitFor(() => {
      expect(mockAddProjectMember).toHaveBeenCalledWith("project-1", "user-2", "member");
    });
    await waitFor(() => {
      expect(mockGetProject).toHaveBeenCalledTimes(2);
    });
  });

  it("shows the delete action for admins and deletes after confirmation", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "admin-1", username: "admin", role: "admin" },
      isAuthenticated: true,
      isLoading: false,
    });
    mockGetProject.mockResolvedValue(
      createProject({
        is_public: false,
        members: [
          {
            id: "member-owner",
            project_id: "project-1",
            user_id: "owner-1",
            role: "owner",
            joined_at: new Date().toISOString(),
            username: "组长",
            avatar_url: null,
          },
        ],
      })
    );

    renderPage([{ pathname: "/lab/projects/project-1" }]);

    fireEvent.click(await screen.findByRole("button", { name: "删除课题" }));
    fireEvent.change(screen.getByLabelText("输入大写 DELETE 以确认删除"), {
      target: { value: "DELETE" },
    });
    fireEvent.click(screen.getByRole("button", { name: "确认删除" }));

    await waitFor(() => {
      expect(mockDeleteProject).toHaveBeenCalledWith("project-1", "DELETE");
    });
  });

  it("shows management controls for admins without project membership", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "admin-1", username: "admin", role: "admin" },
      isAuthenticated: true,
      isLoading: false,
    });
    mockGetProject.mockResolvedValue(
      createProject({
        is_public: false,
        members: [
          {
            id: "member-owner",
            project_id: "project-1",
            user_id: "owner-1",
            role: "owner",
            joined_at: new Date().toISOString(),
            username: "组长",
            avatar_url: null,
          },
        ],
        former_members: [
          {
            id: "former-1",
            project_id: "project-1",
            user_id: "user-2",
            role: "member",
            active: false,
            joined_at: new Date().toISOString(),
            removed_at: new Date().toISOString(),
            username: "旧成员",
            avatar_url: null,
          },
        ],
      })
    );
    mockGetProjectApplications.mockResolvedValue([{ id: "application-1", status: "pending" }]);

    renderPage([{ pathname: "/lab/projects/project-1" }]);

    expect(await screen.findByRole("button", { name: "协作设置" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "编辑信息" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /申请管理/ })).toBeTruthy();
    expect(screen.getByText(/已退出成员/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "删除课题" })).toBeTruthy();
  });

  it("passes discussion participation and moderation rights to admins", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "admin-1", username: "admin", role: "admin" },
      isAuthenticated: true,
      isLoading: false,
    });
    mockGetProject.mockResolvedValue(
      createProject({
        is_public: false,
        members: [
          {
            id: "member-owner",
            project_id: "project-1",
            user_id: "owner-1",
            role: "owner",
            joined_at: new Date().toISOString(),
            username: "组长",
            avatar_url: null,
          },
        ],
      })
    );

    renderPage([{ pathname: "/lab/projects/project-1" }]);

    expect(await screen.findByTestId("project-discussion-section")).toBeTruthy();
    await waitFor(() => {
      expect(mockProjectDiscussionSection).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: "project-1",
          currentUserId: "admin-1",
          canModerate: true,
          canParticipate: true,
        })
      );
    });
  });

  it("renders the AI advisor panel for project members", async () => {
    mockGetProject.mockResolvedValue(createProject());

    renderPage([{ pathname: "/lab/projects/project-1" }]);

    expect(await screen.findByTestId("research-agent-panel")).toBeTruthy();
    expect(screen.queryByText("课题消息")).toBeNull();
    expect(mockResearchAgentPanel).toHaveBeenCalledWith({ projectId: "project-1", canClearHistory: true });
  });

  it("passes evidence management rights for project members", async () => {
    mockGetProject.mockResolvedValue(createProject());

    renderPage([{ pathname: "/lab/projects/project-1" }]);

    expect(await screen.findByTestId("project-evidence-section")).toBeTruthy();
    expect(mockProjectEvidenceSection).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: "project-1",
        canManage: true,
        usePublicEndpoint: false,
        theme: "light",
      })
    );
  });

  it("passes public read-only evidence mode for guest project details", async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    mockGetPublicProjectById.mockResolvedValue(
      createPublicProjectDetail({
        name_zh: "公开课题",
      })
    );

    renderPage([{ pathname: "/lab/projects/project-1" }]);

    expect(await screen.findByTestId("project-evidence-section")).toBeTruthy();
    expect(mockProjectEvidenceSection).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: "project-1",
        canManage: false,
        usePublicEndpoint: true,
      })
    );
  });

  it("renders tasks, activity feed, and member peer-review mode for project members", async () => {
    mockGetProject.mockResolvedValue(createProject({ status: "review_pending" }));

    renderPage([{ pathname: "/lab/projects/project-1" }]);

    expect(await screen.findByTestId("project-tasks-section")).toBeTruthy();
    expect(screen.getByTestId("project-activity-feed")).toBeTruthy();
    expect(mockProjectTasksSection).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: "project-1",
        currentUserId: "owner-1",
        canManage: true,
      })
    );
    expect(mockProjectActivityFeed).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: "project-1", limit: 15 })
    );
    expect(mockProjectPeerReviewSection).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: "project-1",
        projectStatus: "review_pending",
        isActiveMember: true,
        usePublicEndpoint: false,
      })
    );
  });

  it("passes guest peer-review mode and hides member-only sections for guests", async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    mockGetPublicProjectById.mockResolvedValue(
      createPublicProjectDetail({ status: "review_pending" })
    );

    renderPage([{ pathname: "/lab/projects/project-1" }]);

    expect(await screen.findByTestId("project-peer-review-section")).toBeTruthy();
    expect(mockProjectPeerReviewSection).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: "project-1",
        projectStatus: "review_pending",
        isActiveMember: false,
        usePublicEndpoint: true,
      })
    );
    expect(screen.queryByTestId("project-tasks-section")).toBeNull();
    expect(screen.queryByTestId("project-activity-feed")).toBeNull();
  });

  it("scrolls to the peer-review section after a deep-linked project loads", async () => {
    mockGetProject.mockResolvedValue(createProject({ status: "review_pending" }));
    const scrollIntoView = HTMLElement.prototype.scrollIntoView as ReturnType<typeof vi.fn>;

    renderPage([{
      pathname: "/lab/projects/project-1",
      hash: "#project-peer-review",
      state: { readOnly: true },
    }]);

    expect(await screen.findByTestId("project-peer-review-section")).toBeTruthy();
    expect(scrollIntoView).not.toHaveBeenCalled();

    const reviewPanel = document.getElementById("project-panel-review");
    expect(reviewPanel?.hidden).toBe(true);

    const peerReviewProps = mockProjectPeerReviewSection.mock.calls.at(-1)?.[0] as
      | { onContentChange: (hasContent: boolean) => void }
      | undefined;
    act(() => peerReviewProps?.onContentChange(true));

    await waitFor(() => {
      expect(scrollIntoView).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "start",
      });
    });
    expect(reviewPanel?.hidden).toBe(false);
    expect(screen.getByRole("tab", { name: "同伴评审" }).getAttribute("aria-selected")).toBe("true");
    expect(scrollIntoView.mock.contexts[0]).toBe(document.getElementById("project-peer-review"));
  });

  it("renders the full challenge card on the project detail page", async () => {
    mockGetProject.mockResolvedValue(
      createProject({
        challenge_value_zh: "把偏振观察转化为可复核的变量记录。",
        challenge_objectives_zh: "建立变量表\n形成观察结论",
        challenge_beginner_steps_zh: "先拍摄一组偏振图样",
        challenge_min_deliverables_zh: "一份观察记录",
        challenge_review_criteria_zh: "变量明确，证据完整",
        challenge_timeline_zh: "1 周完成入门观察",
        challenge_difficulty: "intermediate",
        challenge_roles_zh: "观察记录员\n数据整理员",
        challenge_missing_roles_zh: "缺数据整理 1 人",
        challenge_progress_zh: "已完成选题",
      })
    );

    renderPage([{ pathname: "/lab/projects/project-1" }]);

    expect(await screen.findByText("挑战卡")).toBeTruthy();
    expect(screen.getByText("进阶")).toBeTruthy();
    expect(screen.getByText("把偏振观察转化为可复核的变量记录。")).toBeTruthy();
    expect(screen.getByText("缺数据整理 1 人")).toBeTruthy();
    expect(screen.getByText("一份观察记录")).toBeTruthy();
  });

  it("shows the current lifecycle stage in the project journey", async () => {
    mockGetProject.mockResolvedValue(createProject({ status: "showcased" }));

    renderPage([{ pathname: "/lab/projects/project-1" }]);

    expect(await screen.findByRole("heading", { name: "课题旅程" })).toBeTruthy();
    const journeyStage = screen.getAllByText("已展示").find((element) => element.closest("li"));
    expect(journeyStage?.closest("li")?.getAttribute("aria-current")).toBe("step");
  });

  it("shows persisted task role labels on member cards", async () => {
    mockGetProject.mockResolvedValue(
      createProject({
        member_count: 2,
        members: [
          {
            id: "member-owner",
            project_id: "project-1",
            user_id: "owner-1",
            role: "owner",
            joined_at: new Date().toISOString(),
            username: "组长",
            avatar_url: null,
          },
          {
            id: "member-candidate",
            project_id: "project-1",
            user_id: "candidate-1",
            role: "member",
            member_role_label: "记录表达",
            joined_at: new Date().toISOString(),
            username: "小林",
            avatar_url: null,
          },
        ],
      })
    );

    renderPage([{ pathname: "/lab/projects/project-1" }]);

    expect(await screen.findByText("团队成员")).toBeTruthy();
    expect(screen.getByText("小林")).toBeTruthy();
    expect(screen.getByText("记录表达")).toBeTruthy();
  });

  it("confirms a leadership nomination before calling the API", async () => {
    mockGetProject.mockResolvedValue(createLeadershipProject());

    renderPage([{ pathname: "/lab/projects/project-1" }]);

    const candidateRow = (await screen.findByText("小林")).closest("li");
    expect(candidateRow).toBeTruthy();
    expect(within(candidateRow!).getByText("记录表达")).toBeTruthy();
    fireEvent.click(within(candidateRow!).getByRole("button", { name: "转让组长" }));

    expect(screen.getByRole("alertdialog", { name: "确认转让组长" })).toBeTruthy();
    expect(screen.getByText(/对方需在 7 天内接受/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "确认转让" }));

    await waitFor(() => {
      expect(mockNominateProjectLeadershipTransfer).toHaveBeenCalledWith("project-1", "candidate-1");
    });
    await waitFor(() => {
      expect(mockGetProject).toHaveBeenCalledTimes(2);
    });
  });

  it("shows nomination errors and lets the owner retry", async () => {
    mockGetProject.mockResolvedValue(createLeadershipProject());
    mockNominateProjectLeadershipTransfer.mockRejectedValue(
      new Error("每小时最多发起 10 次组长转让")
    );

    renderPage([{ pathname: "/lab/projects/project-1" }]);

    const candidateRow = (await screen.findByText("小林")).closest("li");
    fireEvent.click(within(candidateRow!).getByRole("button", { name: "转让组长" }));
    fireEvent.click(screen.getByRole("button", { name: "确认转让" }));

    expect((await screen.findByRole("alert")).textContent).toContain("每小时最多发起 10 次组长转让");
    expect(
      (within(candidateRow!).getByRole("button", { name: "转让组长" }) as HTMLButtonElement).disabled
    ).toBe(false);
  });

  it("lets the nominee immediately accept while preserving task-role labels", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "candidate-1", username: "candidate", role: "user" },
      isAuthenticated: true,
      isLoading: false,
    });
    mockGetProject
      .mockResolvedValueOnce(
        createLeadershipProject({
          pending_leadership_transfer: createPendingLeadershipTransfer({
            can_accept: true,
            can_decline: true,
          }),
        })
      )
      .mockResolvedValueOnce(
        createLeadershipProject({
          owner_user_id: "candidate-1",
          pending_leadership_transfer: null,
        })
      );
    let resolveAccept: (() => void) | undefined;
    mockAcceptProjectLeadershipTransfer.mockImplementation(
      () => new Promise<void>((resolve) => {
        resolveAccept = resolve;
      })
    );

    renderPage([{ pathname: "/lab/projects/project-1" }]);

    const acceptButton = await screen.findByRole("button", { name: "接受" });
    const declineButton = screen.getByRole("button", { name: "拒绝" });
    fireEvent.click(acceptButton);

    await waitFor(() => {
      expect((acceptButton as HTMLButtonElement).disabled).toBe(true);
      expect((declineButton as HTMLButtonElement).disabled).toBe(true);
    });
    act(() => resolveAccept?.());

    await waitFor(() => {
      expect(mockAcceptProjectLeadershipTransfer).toHaveBeenCalledWith("project-1", "transfer-1");
      expect(mockGetProject).toHaveBeenCalledTimes(2);
    });

    const newOwnerRow = screen.getByText("小林").closest("li");
    const outgoingOwnerRow = screen.getByText("课题统筹").closest("li");
    expect(within(newOwnerRow!).getByText("记录表达")).toBeTruthy();
    expect(within(newOwnerRow!).getByText("组长")).toBeTruthy();
    expect(within(outgoingOwnerRow!).getByText("课题统筹")).toBeTruthy();
    expect(within(outgoingOwnerRow!).getByText("成员")).toBeTruthy();
    expect(screen.getByRole("button", { name: "协作设置" })).toBeTruthy();
  });

  it("lets the nominee immediately decline a pending transfer", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "candidate-1", username: "candidate", role: "user" },
      isAuthenticated: true,
      isLoading: false,
    });
    mockGetProject.mockResolvedValue(
      createLeadershipProject({
        pending_leadership_transfer: createPendingLeadershipTransfer({
          can_accept: true,
          can_decline: true,
        }),
      })
    );

    renderPage([{ pathname: "/lab/projects/project-1" }]);

    fireEvent.click(await screen.findByRole("button", { name: "拒绝" }));

    await waitFor(() => {
      expect(mockDeclineProjectLeadershipTransfer).toHaveBeenCalledWith("project-1", "transfer-1");
    });
  });

  it("shows cancel and replace controls to the current leader", async () => {
    mockGetProject.mockResolvedValue(
      createLeadershipProject({
        pending_leadership_transfer: createPendingLeadershipTransfer({
          can_cancel: true,
          can_replace: true,
        }),
      })
    );

    renderPage([{ pathname: "/lab/projects/project-1" }]);

    expect(await screen.findByRole("button", { name: "取消转让" })).toBeTruthy();
    const replacementRow = screen.getByText("小周").closest("li");
    fireEvent.click(within(replacementRow!).getByRole("button", { name: "更换人选" }));

    expect(screen.getByRole("alertdialog", { name: "确认更换组长人选" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "确认更换" }));

    await waitFor(() => {
      expect(mockNominateProjectLeadershipTransfer).toHaveBeenCalledWith("project-1", "candidate-2");
    });
  });

  it("hides pending transfer data from ordinary non-actors", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "candidate-2", username: "candidate-2", role: "user" },
      isAuthenticated: true,
      isLoading: false,
    });
    mockGetProject.mockResolvedValue(
      createLeadershipProject({
        pending_leadership_transfer: createPendingLeadershipTransfer(),
      })
    );

    renderPage([{ pathname: "/lab/projects/project-1" }]);

    await screen.findByText("团队成员");
    expect(screen.queryByText(/已邀请.*接任组长/)).toBeNull();
    expect(screen.queryByRole("button", { name: "接受" })).toBeNull();
    expect(screen.queryByRole("button", { name: "拒绝" })).toBeNull();
    expect(screen.queryByRole("button", { name: "取消转让" })).toBeNull();
    expect(screen.queryByRole("button", { name: "更换人选" })).toBeNull();
  });

  it("scrolls to the member card for leadership-transfer notification links", async () => {
    mockGetProject.mockResolvedValue(createLeadershipProject());
    const scrollIntoView = HTMLElement.prototype.scrollIntoView as ReturnType<typeof vi.fn>;

    renderPage([{ pathname: "/lab/projects/project-1", hash: "#project-members" }]);

    expect(await screen.findByText("团队成员")).toBeTruthy();
    await waitFor(() => {
      expect(scrollIntoView).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "start",
      });
    });
    expect(scrollIntoView.mock.contexts.at(-1)).toBe(document.getElementById("project-members"));
  });

  it("does not render the AI advisor panel for authenticated public non-members", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "candidate-1", username: "candidate", role: "user" },
      isAuthenticated: true,
      isLoading: false,
    });
    mockGetProject.mockResolvedValue(
      createProject({
        members: [
          {
            id: "member-owner",
            project_id: "project-1",
            user_id: "owner-1",
            role: "owner",
            joined_at: new Date().toISOString(),
            username: "组长",
            avatar_url: null,
          },
        ],
      })
    );

    renderPage([{ pathname: "/lab/projects/project-1" }]);

    await screen.findByText("你正在以只读模式浏览这个课题");
    expect(screen.queryByTestId("research-agent-panel")).toBeNull();
    expect(mockResearchAgentPanel).not.toHaveBeenCalled();
  });

  it("opens login for guest join actions and hides management controls", async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    mockGetPublicProjectById.mockResolvedValue(
      createPublicProjectDetail({
        name_zh: "关闭招募公开课题",
        is_recruiting: false,
      })
    );

    renderPage([{ pathname: "/lab/projects/project-1" }]);

    expect(await screen.findByText("关闭招募公开课题")).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: "登录后加入" })[0]);

    expect(openDialog).toHaveBeenCalledWith("login");
    expect(screen.queryByRole("button", { name: "协作设置" })).toBeNull();
    expect(screen.queryByRole("button", { name: "编辑信息" })).toBeNull();
    expect(screen.queryByRole("button", { name: /申请管理/ })).toBeNull();
    expect(mockGetProject).not.toHaveBeenCalled();
  });

  it("shows stopped-recruitment warning for closed authenticated read-only projects", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "candidate-1", username: "candidate", role: "user" },
      isAuthenticated: true,
      isLoading: false,
    });
    mockGetProject.mockResolvedValue(
      createProject({
        members: [
          {
            id: "member-owner",
            project_id: "project-1",
            user_id: "owner-1",
            role: "owner",
            joined_at: new Date().toISOString(),
            username: "组长",
            avatar_url: null,
          },
        ],
      })
    );
    mockGetProjectSettings.mockResolvedValue(createProjectSettings({ is_recruiting: false }));

    renderPage([{ pathname: "/lab/projects/project-1" }]);

    expect(await screen.findByText("你正在以只读模式浏览这个课题")).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: "招募已停止" })[0]);

    expect(await screen.findByText("该课题组已停止招募，暂时不能申请加入。")).toBeTruthy();
    expect(openDialog).not.toHaveBeenCalled();
  });

  it("keeps hypotheses static, manages questions through the editor, and places discussion after evidence", async () => {
    mockGetProject.mockResolvedValue(
      createProject({
        research_questions_zh: "气泡条纹与膜厚变化是否相关？\n明暗图样是否受偏振方向影响？",
        research_hypotheses_zh: "条纹由膜厚变化引起。\n明暗图样由几何与偏振耦合产生。",
        // 挑战卡目标为空时会回退展示研究问题，这里显式给目标避免误判
        challenge_objectives_zh: "建立变量表",
        basic_plan_zh: "先做基础观察，再记录变量。",
        extended_plan_zh: "继续验证不同角度下的表现。",
      })
    );

    renderPage([{ pathname: "/lab/projects/project-1" }]);

    expect(await screen.findByText("研究信息")).toBeTruthy();
    expect(screen.queryByText("气泡条纹与膜厚变化是否相关？")).toBeNull();
    expect(screen.getByText("条纹由膜厚变化引起。")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "条纹由膜厚变化引起。" })).toBeNull();

    expect(screen.getAllByText("先做基础观察，再记录变量。").length).toBeGreaterThan(0);
    expect(screen.getByText("继续验证不同角度下的表现。")).toBeTruthy();

    const researchInfo = screen.getByText("研究信息").closest("section");
    const discussion = screen.getByTestId("project-discussion-section");
    const evidence = screen.getByTestId("project-evidence-section");
    expect(researchInfo?.compareDocumentPosition(evidence) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(evidence.compareDocumentPosition(discussion) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    fireEvent.click(screen.getByRole("tab", { name: "研究设计" }));
    fireEvent.click(screen.getByRole("button", { name: "管理问题" }));

    await waitFor(() => {
      expect(mockProjectEditDialog).toHaveBeenLastCalledWith(
        expect.objectContaining({
          isOpen: true,
          initialFocusField: "questions",
        })
      );
    });
  });

  it("hides the question management shortcut from ordinary members", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "member-1", username: "member", role: "user" },
      isAuthenticated: true,
      isLoading: false,
    });
    mockGetProject.mockResolvedValue(
      createProject({
        research_questions_zh: "核心问题",
        members: [
          ...createProject().members,
          {
            id: "member-1",
            project_id: "project-1",
            user_id: "member-1",
            role: "member",
            joined_at: new Date().toISOString(),
            username: "普通成员",
            avatar_url: null,
          },
        ],
      })
    );

    renderPage([{ pathname: "/lab/projects/project-1" }]);

    expect(await screen.findByText("研究信息")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "管理问题" })).toBeNull();
  });

  it("converts the discussion comments hash into a discussion jump request", async () => {
    mockGetProject.mockResolvedValue(createProject());

    renderPage([{ pathname: "/lab/projects/project-1", hash: "#discussion-comments" }]);

    expect(await screen.findByTestId("project-discussion-section")).toBeTruthy();
    await waitFor(() => {
      expect(mockProjectDiscussionSection).toHaveBeenLastCalledWith(
        expect.objectContaining({
          jumpRequest: expect.objectContaining({
            section: "comments",
            version: 1,
          }),
        })
      );
    });
  });

  it("converts the discussion comment hash into a targeted discussion jump request", async () => {
    mockGetProject.mockResolvedValue(createProject());

    renderPage([{ pathname: "/lab/projects/project-1", hash: "#discussion-comment-comment-1" }]);

    expect(await screen.findByTestId("project-discussion-section")).toBeTruthy();
    await waitFor(() => {
      expect(mockProjectDiscussionSection).toHaveBeenLastCalledWith(
        expect.objectContaining({
          jumpRequest: expect.objectContaining({
            section: "comments",
            commentId: "comment-1",
            version: 1,
          }),
        })
      );
    });
  });

  it("refreshes the targeted discussion jump when navigating to the same comment hash again", async () => {
    mockGetProject.mockResolvedValue(createProject());

    renderPageWithSameHashProbe();

    expect(await screen.findByTestId("project-discussion-section")).toBeTruthy();
    await waitFor(() => {
      expect(mockProjectDiscussionSection).toHaveBeenLastCalledWith(
        expect.objectContaining({
          jumpRequest: expect.objectContaining({
            commentId: "comment-1",
            version: 1,
          }),
        })
      );
    });

    fireEvent.click(screen.getByText("same comment notification"));

    await waitFor(() => {
      expect(mockProjectDiscussionSection).toHaveBeenLastCalledWith(
        expect.objectContaining({
          jumpRequest: expect.objectContaining({
            commentId: "comment-1",
            version: 2,
          }),
        })
      );
    });
  });

  it("allows admins to remove non-owner members without showing them as project members", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "admin-1", username: "admin", role: "admin" },
      isAuthenticated: true,
      isLoading: false,
    });
    mockGetProject
      .mockResolvedValueOnce(
        createProject({
          member_count: 2,
          is_public: false,
          members: [
            {
              id: "member-owner",
              project_id: "project-1",
              user_id: "owner-1",
              role: "owner",
              joined_at: new Date().toISOString(),
              username: "组长",
              avatar_url: null,
            },
            {
              id: "member-2",
              project_id: "project-1",
              user_id: "member-2",
              role: "member",
              joined_at: new Date().toISOString(),
              username: "普通成员",
              avatar_url: null,
            },
          ],
        })
      )
      .mockResolvedValueOnce(createProject());

    renderPage([{ pathname: "/lab/projects/project-1" }]);

    await screen.findByText("普通成员");
    expect(screen.queryByText("admin")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "移除" }));
    fireEvent.click(screen.getByRole("button", { name: "确认" }));

    await waitFor(() => {
      expect(mockRemoveProjectMember).toHaveBeenCalledWith("project-1", "member-2");
    });
  });

});
