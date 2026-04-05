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
  ApplicationManagementDialog: () => null,
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

vi.mock("../components/project/ProjectDiscussionSection", () => ({
  ProjectDiscussionSection: () => null,
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, isOpen }: { children: unknown; isOpen: boolean }) => (isOpen ? <div>{children}</div> : null),
}));

vi.mock("@/lib/research.service", () => ({
  researchApi: {
    getProject: (...args: unknown[]) => mockGetProject(...args),
    getProjectCanvases: (...args: unknown[]) => mockGetProjectCanvases(...args),
    addProjectMember: (...args: unknown[]) => mockAddProjectMember(...args),
    removeProjectMember: vi.fn(),
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

});
