// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PublicProject } from "@/lib/profile.service";
import { ProjectApplicationForm } from "./ProjectApplicationForm";

const getUserEducations = vi.fn();
const createApplication = vi.fn();

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/contexts/ThemeContext", () => ({
  useTheme: () => ({ theme: "light" }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "user-1", username: "candidate" },
  }),
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, isOpen }: { children: unknown; isOpen: boolean }) => (
    isOpen ? <div role="dialog">{children}</div> : null
  ),
}));

vi.mock("@/lib/profile.service", () => ({
  profileApi: {
    getUserEducations: (...args: unknown[]) => getUserEducations(...args),
    createApplication: (...args: unknown[]) => createApplication(...args),
  },
}));

vi.mock("@/lib/posthog", () => ({
  capturePostHogEvent: vi.fn(),
}));

function createPublicProject(overrides: Partial<PublicProject> = {}): PublicProject {
  return {
    id: "project-1",
    name_zh: "停止招募课题",
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

describe("ProjectApplicationForm", () => {
  beforeEach(() => {
    getUserEducations.mockReset();
    createApplication.mockReset();
  });

  it("shows a closed-recruitment warning without loading education options or submitting", () => {
    const onClose = vi.fn();

    render(
      <ProjectApplicationForm
        isOpen
        onClose={onClose}
        project={createPublicProject({ is_recruiting: false })}
      />
    );

    expect(screen.getByText("招募已停止")).toBeTruthy();
    expect(screen.getByText("该课题组已停止招募，暂时不能申请加入。")).toBeTruthy();
    expect(screen.queryByText("project.application.form.displayName")).toBeNull();
    expect(screen.queryByRole("button", { name: "project.application.submit" })).toBeNull();
    expect(getUserEducations).not.toHaveBeenCalled();
    expect(createApplication).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "关闭" }));

    expect(onClose).toHaveBeenCalled();
    expect(createApplication).not.toHaveBeenCalled();
  });
});
