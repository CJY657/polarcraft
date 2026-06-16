// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { ProjectCoverDialog } from "./ProjectCoverDialog";
import type { ProjectWithMembers, ResearchProject } from "@/lib/research.service";

const mockGetProjectDiscussionComments = vi.fn();
const mockUploadProjectCoverImage = vi.fn();
const mockUpdateProject = vi.fn();

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, isOpen }: { children: unknown; isOpen: boolean }) =>
    isOpen ? <div>{children}</div> : null,
}));

vi.mock("@/lib/research.service", () => ({
  researchApi: {
    getProjectDiscussionComments: (...args: unknown[]) => mockGetProjectDiscussionComments(...args),
    uploadProjectCoverImage: (...args: unknown[]) => mockUploadProjectCoverImage(...args),
    updateProject: (...args: unknown[]) => mockUpdateProject(...args),
  },
}));

const project: ProjectWithMembers = {
  id: "project-1",
  name_zh: "偏振成像课题",
  name_en: null,
  description_zh: "研究简介",
  description_en: null,
  thumbnail: null,
  cover_image: null,
  status: "active",
  is_public: true,
  allow_guest_comments: false,
  enable_task_board: true,
  member_count: 1,
  canvas_count: 1,
  current_user_role: "owner",
  created_at: "2026-06-01T00:00:00.000Z",
  updated_at: "2026-06-01T00:00:00.000Z",
  members: [],
};

beforeAll(() => {
  Object.defineProperty(URL, "createObjectURL", {
    writable: true,
    value: vi.fn((file: File) => `blob:${file.name}`),
  });

  Object.defineProperty(URL, "revokeObjectURL", {
    writable: true,
    value: vi.fn(),
  });
});

describe("ProjectCoverDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetProjectDiscussionComments.mockResolvedValue([
      {
        id: "comment-1",
        project_id: "project-1",
        user_id: "user-1",
        parent_comment_id: null,
        content: "有图",
        image_urls: ["/uploads/courses/project-discussion-project-1/image/comment-cover.png"],
        video_urls: [],
        is_deleted: false,
        created_at: "2026-06-01T00:00:00.000Z",
        updated_at: "2026-06-01T00:00:00.000Z",
        username: "组员",
        avatar_url: null,
      },
    ]);
    mockUploadProjectCoverImage.mockResolvedValue({
      url: "/uploads/courses/project-cover-project-1/image/uploaded-cover.png",
    });
    mockUpdateProject.mockImplementation(async (_projectId: string, input: Partial<ResearchProject>) => ({
      ...project,
      ...input,
    }));
  });

  it("saves an image from discussion comments as the project cover", async () => {
    const onSuccess = vi.fn();

    render(
      <ProjectCoverDialog
        isOpen
        onClose={vi.fn()}
        project={project}
        onSuccess={onSuccess}
      />
    );

    const commentImage = await screen.findByAltText("讨论区图片");
    fireEvent.click(commentImage.closest("button")!);
    fireEvent.click(screen.getByRole("button", { name: "保存封面" }));

    await waitFor(() => {
      expect(mockUpdateProject).toHaveBeenCalledWith("project-1", {
        thumbnail: "/uploads/courses/project-discussion-project-1/image/comment-cover.png",
      });
    });
    expect(mockUploadProjectCoverImage).not.toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalled();
  });

  it("uploads a selected image before saving the project cover", async () => {
    const onSuccess = vi.fn();
    const { container } = render(
      <ProjectCoverDialog
        isOpen
        onClose={vi.fn()}
        project={project}
        onSuccess={onSuccess}
      />
    );
    const file = new File(["cover-bytes"], "cover.png", { type: "image/png" });
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(fileInput, {
      target: {
        files: [file],
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "保存封面" }));

    await waitFor(() => {
      expect(mockUploadProjectCoverImage).toHaveBeenCalledWith("project-1", file);
    });
    expect(mockUpdateProject).toHaveBeenCalledWith("project-1", {
      thumbnail: "/uploads/courses/project-cover-project-1/image/uploaded-cover.png",
    });
    expect(onSuccess).toHaveBeenCalled();
  });
});
