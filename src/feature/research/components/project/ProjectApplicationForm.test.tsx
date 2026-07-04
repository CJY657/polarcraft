// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
    getUserEducations.mockResolvedValue([]);
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

  it("requires the intended role before submitting an application", async () => {
    getUserEducations.mockReturnValue(new Promise(() => {}));

    render(
      <ProjectApplicationForm
        isOpen
        onClose={vi.fn()}
        project={createPublicProject({ is_recruiting: true })}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "project.application.submit" }));

    expect(await screen.findByText("请填写想承担的角色")).toBeTruthy();
    expect(createApplication).not.toHaveBeenCalled();
  });

  it("defaults to the first missing-role option and submits the cleaned role name", async () => {
    createApplication.mockResolvedValue({});

    render(
      <ProjectApplicationForm
        isOpen
        onClose={vi.fn()}
        project={createPublicProject({
          is_recruiting: true,
          challenge_missing_roles_zh: "缺数据整理 1 人\n缺记录表达 1 人",
          challenge_roles_zh: "观察记录员",
        })}
      />
    );

    const defaultRoleButton = await screen.findByRole("button", { name: "缺数据整理 1 人" });
    expect(defaultRoleButton.getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: "缺记录表达 1 人" }));
    fireEvent.change(screen.getByPlaceholderText("说明你能承担的任务、已有经验或想练习的能力。"), {
      target: { value: "我可以整理记录表达模板" },
    });
    fireEvent.change(screen.getByPlaceholderText("例如：每周 2-3 小时，周末可集中整理"), {
      target: { value: "每周 3 小时" },
    });
    const organizationInput = screen.getAllByRole("textbox").find((element) => (
      (element as HTMLInputElement).value === "" && !(element as HTMLInputElement).placeholder
    ));
    expect(organizationInput).toBeTruthy();
    fireEvent.change(organizationInput!, { target: { value: "某某学校" } });

    fireEvent.click(screen.getByRole("button", { name: "project.application.submit" }));

    await waitFor(() => {
      expect(createApplication).toHaveBeenCalledWith(
        "project-1",
        expect.objectContaining({
          desired_role: "记录表达",
          proposed_contribution: "我可以整理记录表达模板",
          weekly_time_commitment: "每周 3 小时",
          organization: "某某学校",
        })
      );
    });
  });

  it("still requires contribution and weekly time after a role option is selected", async () => {
    render(
      <ProjectApplicationForm
        isOpen
        onClose={vi.fn()}
        project={createPublicProject({
          is_recruiting: true,
          challenge_missing_roles_zh: "缺数据整理 1 人",
        })}
      />
    );

    fireEvent.click(await screen.findByRole("button", { name: "project.application.submit" }));

    expect(await screen.findByText("请填写你可以贡献的内容")).toBeTruthy();
    expect(createApplication).not.toHaveBeenCalled();

    fireEvent.change(screen.getByPlaceholderText("说明你能承担的任务、已有经验或想练习的能力。"), {
      target: { value: "我可以整理数据" },
    });
    fireEvent.click(screen.getByRole("button", { name: "project.application.submit" }));

    expect(await screen.findByText("请填写每周可投入时间")).toBeTruthy();
    expect(createApplication).not.toHaveBeenCalled();
  });
});
