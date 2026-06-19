// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProjectWithMembers } from "@/lib/research.service";
import { ResearchProjectPage } from "./ResearchProjectPage";

const mockGetProject = vi.fn();
const mockGetProjectSettings = vi.fn();
const mockGetProjectCanvases = vi.fn();
const mockGetProjectApplications = vi.fn();
const mockAddProjectMember = vi.fn();
const mockDeleteProject = vi.fn();
const mockRemoveProjectMember = vi.fn();
const mockProjectDiscussionSection = vi.fn();
const mockResearchAgentPanel = vi.fn();

vi.mock("@/contexts/ThemeContext", () => ({
  useTheme: () => ({ theme: "light" }),
}));

const mockUseAuth = vi.fn();
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/stores/authDialogStore", () => ({
  useAuthDialogStore: () => vi.fn(),
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
  ProjectEditDialog: () => null,
}));

vi.mock("../components/project/ProjectSettingsDialog", () => ({
  ProjectSettingsDialog: () => null,
}));

vi.mock("../components/project/ProjectApplicationForm", () => ({
  ProjectApplicationForm: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div>application-form</div> : null),
}));

vi.mock("../components/project/ResearchAgentPanel", () => ({
  ResearchAgentPanel: (props: Record<string, unknown>) => {
    mockResearchAgentPanel(props);
    return <div data-testid="research-agent-panel" />;
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
  },
}));

vi.mock("@/lib/profile.service", () => ({
  profileApi: {
    getProjectSettings: (...args: unknown[]) => mockGetProjectSettings(...args),
    getProjectApplications: (...args: unknown[]) => mockGetProjectApplications(...args),
    getPublicProjectById: vi.fn(),
  },
}));

function renderPage(initialEntries: Array<{ pathname: string; state?: unknown }>) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/lab/projects" element={<div>projects-page</div>} />
        <Route path="/lab/projects/:projectId" element={<ResearchProjectPage />} />
      </Routes>
    </MemoryRouter>
  );
}

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

describe("ResearchProjectPage", () => {
  beforeEach(() => {
    mockGetProject.mockReset();
    mockGetProjectSettings.mockReset();
    mockGetProjectCanvases.mockReset();
    mockGetProjectApplications.mockReset();
    mockAddProjectMember.mockReset();
    mockDeleteProject.mockReset();
    mockRemoveProjectMember.mockReset();
    mockProjectDiscussionSection.mockReset();
    mockResearchAgentPanel.mockReset();
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

    expect(await screen.findByText("待恢复成员")).toBeTruthy();
    fireEvent.click(screen.getByTitle("拉回成员"));

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

    expect((await screen.findAllByRole("button", { name: "设置" })).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "编辑" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /申请管理/ })).toBeTruthy();
    expect(screen.getByText("待恢复成员")).toBeTruthy();
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
    expect(mockResearchAgentPanel).toHaveBeenCalledWith({ projectId: "project-1", canClearHistory: true });
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

  it("jumps research information into the discussion subsections", async () => {
    mockGetProject.mockResolvedValue(
      createProject({
        research_questions_zh: "气泡条纹与膜厚变化是否相关？\n明暗图样是否受偏振方向影响？",
        research_hypotheses_zh: "条纹由膜厚变化引起。\n明暗图样由几何与偏振耦合产生。",
        basic_plan_zh: "先做基础观察，再记录变量。",
        extended_plan_zh: "继续验证不同角度下的表现。",
      })
    );

    renderPage([{ pathname: "/lab/projects/project-1" }]);

    expect(await screen.findByText("研究信息")).toBeTruthy();
    expect(screen.getByRole("button", { name: "气泡条纹与膜厚变化是否相关？" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "明暗图样是否受偏振方向影响？" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "条纹由膜厚变化引起。" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "明暗图样由几何与偏振耦合产生。" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "气泡条纹与膜厚变化是否相关？" }));

    await waitFor(() => {
      expect(mockProjectDiscussionSection).toHaveBeenLastCalledWith(
        expect.objectContaining({
          jumpRequest: expect.objectContaining({
            section: "basic",
            index: 0,
            version: 1,
          }),
        })
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "条纹由膜厚变化引起。" }));

    await waitFor(() => {
      expect(mockProjectDiscussionSection).toHaveBeenLastCalledWith(
        expect.objectContaining({
          jumpRequest: expect.objectContaining({
            section: "extended",
            index: 0,
            version: 2,
          }),
        })
      );
    });

    expect(screen.getByText("先做基础观察，再记录变量。")).toBeTruthy();
    expect(screen.getByText("继续验证不同角度下的表现。")).toBeTruthy();
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

    fireEvent.click(screen.getByTitle("移除成员"));
    fireEvent.click(screen.getByRole("button", { name: "确认" }));

    await waitFor(() => {
      expect(mockRemoveProjectMember).toHaveBeenCalledWith("project-1", "member-2");
    });
  });

});
