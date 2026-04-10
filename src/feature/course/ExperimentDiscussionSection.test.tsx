// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ExperimentDiscussionSection } from "./ExperimentDiscussionSection";

const mockGetPublicDiscussionComments = vi.fn();

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: { language: "zh-CN" },
  }),
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, isOpen }: { children: unknown; isOpen: boolean }) =>
    isOpen ? <div>{children}</div> : null,
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: {
      id: "user-1",
      username: "研究员",
      role: "user",
    },
  }),
}));

vi.mock("@/stores/authDialogStore", () => ({
  useAuthDialogStore: (selector: (state: { openDialog: () => void }) => unknown) =>
    selector({
      openDialog: vi.fn(),
    }),
}));

vi.mock("@/lib/course.service", () => ({
  courseApi: {
    getPublicDiscussionComments: (...args: unknown[]) => mockGetPublicDiscussionComments(...args),
  },
}));

function createComment(overrides: Record<string, unknown> = {}) {
  return {
    id: "comment-1",
    courseId: "course-1",
    userId: "user-1",
    parentCommentId: null,
    username: "研究员",
    avatarUrl: null,
    content: "基础讨论",
    imageUrls: [],
    resourceId: null,
    resourceTitle: null,
    isDeleted: false,
    createdAt: "2026-04-10T08:00:00.000Z",
    updatedAt: "2026-04-10T08:00:00.000Z",
    ...overrides,
  };
}

describe("ExperimentDiscussionSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPublicDiscussionComments.mockResolvedValue([]);
  });

  it("resets the lightbox zoom state after closing and reopening an image", async () => {
    mockGetPublicDiscussionComments.mockResolvedValue([
      createComment({
        imageUrls: ["/uploads/discussion-image.png"],
      }),
    ]);

    render(
      <ExperimentDiscussionSection
        courseId="course-1"
        courseTitle="偏振实验"
        theme="light"
      />
    );

    await screen.findByText("基础讨论");

    fireEvent.click(screen.getAllByAltText("研究员 image 1")[0]);

    const zoomButton = await screen.findByRole("button", { name: "放大图片" });
    expect(zoomButton.getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByTestId("discussion-lightbox-image").getAttribute("data-zoomed")).toBe(
      "false"
    );

    fireEvent.click(zoomButton);

    expect(screen.getByRole("button", { name: "还原图片" }).getAttribute("aria-pressed")).toBe(
      "true"
    );
    expect(screen.getByTestId("discussion-lightbox-image").getAttribute("data-zoomed")).toBe(
      "true"
    );

    fireEvent.click(screen.getByRole("button", { name: "关闭大图预览" }));

    await waitFor(() => {
      expect(screen.queryByTestId("discussion-lightbox-image")).toBeNull();
    });

    fireEvent.click(screen.getAllByAltText("研究员 image 1")[0]);

    expect((await screen.findByRole("button", { name: "放大图片" })).getAttribute("aria-pressed")).toBe(
      "false"
    );
    expect(screen.getByTestId("discussion-lightbox-image").getAttribute("data-zoomed")).toBe(
      "false"
    );
  });
});
