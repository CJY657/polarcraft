// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PublicProject } from "@/lib/profile.service";
import { PublicProjectExplorePage } from "./PublicProjectExplorePage";

const getPublicProjects = vi.fn();
const openDialog = vi.fn();
const mockUseAuth = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/contexts/SystemContext", () => ({
  useSystem: () => ({
    isSystemHealthy: true,
  }),
}));

vi.mock("@/components/shared", () => ({
  PersistentHeader: () => <header />,
}));

vi.mock("@/stores/authDialogStore", () => ({
  useAuthDialogStore: () => openDialog,
}));

vi.mock("@/lib/profile.service", () => ({
  profileApi: {
    getPublicProjects: (...args: unknown[]) => getPublicProjects(...args),
  },
}));

vi.mock("../components/project/CreateProjectWizard", () => ({
  CreateProjectWizard: () => null,
}));

vi.mock("../components/project/ProjectApplicationForm", () => ({
  ProjectApplicationForm: ({
    isOpen,
    project,
  }: {
    isOpen: boolean;
    project: PublicProject | null;
  }) => (
    isOpen && project?.is_recruiting === false
      ? (
        <div role="dialog">
          <h2>招募已停止</h2>
          <p>该课题组已停止招募，暂时不能申请加入。</p>
        </div>
      )
      : null
  ),
}));

vi.mock("../components/shared/ProjectCoverImage", () => ({
  ProjectCoverImage: ({ alt }: { alt: string }) => <div data-testid={`project-cover-${alt}`} />,
}));

function createPublicProject(overrides: Partial<PublicProject>): PublicProject {
  return {
    id: overrides.id ?? "project-id",
    name_zh: overrides.name_zh ?? "默认课题",
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
    owner_username: "owner",
    owner_avatar_url: null,
    members: [],
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function getCardTitles(container: HTMLElement) {
  return Array.from(container.querySelectorAll("article h2")).map((heading) => heading.textContent);
}

describe("PublicProjectExplorePage", () => {
  beforeEach(() => {
    getPublicProjects.mockReset();
    openDialog.mockReset();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });
  });

  it("reorders rendered cards when switching display modes without refetching", async () => {
    getPublicProjects.mockResolvedValue([
      createPublicProject({
        id: "project-1",
        name_zh: "推荐更新课题",
        is_recruiting: true,
        challenge_roles_zh: "观察记录员\n数据整理员",
        challenge_missing_roles_zh: "缺数据整理 1 人",
        challenge_beginner_steps_zh: "先记录第一轮变量",
        member_count: 2,
        updated_at: "2026-06-20T00:00:00.000Z",
        created_at: "2026-02-01T00:00:00.000Z",
      }),
      createPublicProject({
        id: "project-2",
        name_zh: "成员最多课题",
        member_count: 9,
        updated_at: "2026-06-10T00:00:00.000Z",
        created_at: "2026-03-01T00:00:00.000Z",
      }),
      createPublicProject({
        id: "project-3",
        name_zh: "最新创建课题",
        member_count: 1,
        updated_at: "2026-06-01T00:00:00.000Z",
        created_at: "2026-06-10T00:00:00.000Z",
      }),
      createPublicProject({
        id: "project-4",
        name_zh: "招募旧课题",
        is_recruiting: true,
        member_count: 5,
        updated_at: "2026-06-01T00:00:00.000Z",
        created_at: "2026-01-01T00:00:00.000Z",
      }),
    ]);

    const { container } = render(
      <MemoryRouter>
        <PublicProjectExplorePage />
      </MemoryRouter>
    );

    await screen.findByText("推荐更新课题", {}, { timeout: 2000 });
    expect(screen.getByText("观察记录员")).toBeTruthy();
    expect(screen.getAllByText("当前缺口").length).toBeGreaterThan(0);
    expect(screen.getByText("缺数据整理 1 人")).toBeTruthy();
    expect(screen.getByText("先记录第一轮变量")).toBeTruthy();
    expect(getCardTitles(container)).toEqual([
      "推荐更新课题",
      "招募旧课题",
      "成员最多课题",
      "最新创建课题",
    ]);

    fireEvent.change(screen.getByLabelText("排序方式"), {
      target: { value: "member_count" },
    });

    expect(getCardTitles(container)).toEqual([
      "成员最多课题",
      "招募旧课题",
      "推荐更新课题",
      "最新创建课题",
    ]);

    fireEvent.change(screen.getByLabelText("排序方式"), {
      target: { value: "created_desc" },
    });

    expect(getCardTitles(container)).toEqual([
      "最新创建课题",
      "成员最多课题",
      "推荐更新课题",
      "招募旧课题",
    ]);
    await waitFor(() => {
      expect(getPublicProjects).toHaveBeenCalledTimes(1);
    });
  });

  it("opens the stopped-recruitment warning for closed guest cards without login", async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });
    getPublicProjects.mockResolvedValue([
      createPublicProject({
        id: "project-closed",
        name_zh: "停止招募课题",
        is_recruiting: false,
      }),
      createPublicProject({
        id: "project-pending",
        name_zh: "待审核课题",
        is_recruiting: true,
        has_pending_application: true,
      }),
    ]);

    render(
      <MemoryRouter>
        <PublicProjectExplorePage />
      </MemoryRouter>
    );

    await screen.findByText("停止招募课题");
    expect((screen.getByRole("button", { name: "待审核" }) as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "招募已停止" }));

    expect(await screen.findByText("该课题组已停止招募，暂时不能申请加入。")).toBeTruthy();
    expect(openDialog).not.toHaveBeenCalled();
  });
});
