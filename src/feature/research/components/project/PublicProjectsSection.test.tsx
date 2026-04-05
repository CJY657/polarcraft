// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

describe("PublicProjectsSection", () => {
  beforeEach(() => {
    getPublicProjects.mockReset();
  });

  it("shows pending state instead of a re-applicable action when the user already has a pending application", async () => {
    getPublicProjects.mockResolvedValue([
      {
        id: "project-1",
        name_zh: "偏振成像课题",
        name_en: null,
        description_zh: "研究偏振成像的公开课题",
        description_en: null,
        thumbnail: null,
        status: "active",
        visibility: "public",
        require_approval: true,
        recruitment_requirements: null,
        is_recruiting: true,
        max_members: null,
        member_count: 3,
        is_member: false,
        has_pending_application: true,
        owner_username: "owner",
        owner_avatar_url: null,
        members: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
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
});
