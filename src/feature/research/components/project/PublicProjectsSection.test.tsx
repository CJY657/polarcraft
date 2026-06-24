// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PublicProject } from "@/lib/profile.service";
import { PublicProjectsSection } from "./PublicProjectsSection";

const getPublicProjects = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: true,
  }),
}));

vi.mock("@/contexts/SystemContext", () => ({
  useSystem: () => ({
    isSystemHealthy: true,
  }),
}));

vi.mock("@/stores/authDialogStore", () => ({
  useAuthDialogStore: () => vi.fn(),
}));

vi.mock("@/lib/profile.service", () => ({
  profileApi: {
    getPublicProjects: (...args: unknown[]) => getPublicProjects(...args),
  },
}));

vi.mock("./ProjectApplicationForm", () => ({
  ProjectApplicationForm: () => null,
}));

function createPublicProject(overrides: Partial<PublicProject>): PublicProject {
  return {
    id: overrides.id ?? "project-id",
    name_zh: overrides.name_zh ?? "默认课题",
    name_en: null,
    description_zh: "研究偏振成像的公开课题",
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

function getCardTitles() {
  return screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent);
}

describe("PublicProjectsSection", () => {
  beforeEach(() => {
    getPublicProjects.mockReset();
  });

  it("shows pending state instead of a re-applicable action when the user already has a pending application", async () => {
    getPublicProjects.mockResolvedValue([
      createPublicProject({
        id: "project-1",
        name_zh: "偏振成像课题",
        require_approval: true,
        is_recruiting: true,
        member_count: 3,
        has_pending_application: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
    ]);

    render(
      <MemoryRouter>
        <PublicProjectsSection />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getPublicProjects).toHaveBeenCalled();
    });

    expect((await screen.findByRole("button", { name: "待审核" })).hasAttribute("disabled")).toBe(true);
  });

  it("sorts all fetched projects before keeping the four-card preview", async () => {
    getPublicProjects.mockResolvedValue([
      createPublicProject({
        id: "project-1",
        name_zh: "招募待审核课题",
        is_recruiting: true,
        member_count: 2,
        has_pending_application: true,
        updated_at: "2026-06-20T00:00:00.000Z",
        created_at: "2026-01-05T00:00:00.000Z",
      }),
      createPublicProject({
        id: "project-2",
        name_zh: "成员最多课题",
        member_count: 10,
        updated_at: "2026-06-01T00:00:00.000Z",
        created_at: "2026-02-01T00:00:00.000Z",
      }),
      createPublicProject({
        id: "project-3",
        name_zh: "最新创建课题",
        member_count: 1,
        updated_at: "2026-06-05T00:00:00.000Z",
        created_at: "2026-06-01T00:00:00.000Z",
      }),
      createPublicProject({
        id: "project-4",
        name_zh: "招募第二课题",
        is_recruiting: true,
        member_count: 7,
        updated_at: "2026-06-10T00:00:00.000Z",
        created_at: "2026-03-01T00:00:00.000Z",
      }),
      createPublicProject({
        id: "project-5",
        name_zh: "预览外高成员课题",
        member_count: 9,
        updated_at: "2026-05-01T00:00:00.000Z",
        created_at: "2026-04-01T00:00:00.000Z",
      }),
    ]);

    render(
      <MemoryRouter>
        <PublicProjectsSection />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getPublicProjects).toHaveBeenCalled();
    });
    await screen.findByRole("heading", { name: "招募待审核课题", level: 3 });

    expect(getCardTitles()).toEqual([
      "招募待审核课题",
      "招募第二课题",
      "最新创建课题",
      "成员最多课题",
    ]);

    fireEvent.change(screen.getByLabelText("排序方式"), {
      target: { value: "member_count" },
    });

    expect(getCardTitles()).toEqual([
      "成员最多课题",
      "预览外高成员课题",
      "招募第二课题",
      "招募待审核课题",
    ]);
    expect((screen.getByRole("button", { name: "待审核" }) as HTMLButtonElement).disabled).toBe(true);
  });
});
