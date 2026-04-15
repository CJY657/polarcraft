// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ProjectListItem } from "./ProjectListItem";

const baseProject = {
  id: "project-1",
  name_zh: "偏振成像课题",
  name_en: null,
  description_zh: "研究偏振信息在成像中的应用。",
  description_en: null,
  thumbnail: null,
  status: "active" as const,
  is_public: false,
  allow_guest_comments: false,
  enable_task_board: true,
  member_count: 3,
  canvas_count: 2,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  current_user_role: "owner" as const,
};

describe("ProjectListItem", () => {
  it("shows the delete flow only when deletion is allowed", () => {
    render(
      <MemoryRouter>
        <ProjectListItem project={baseProject} />
      </MemoryRouter>
    );

    expect(screen.queryByRole("button", { name: "删除课题" })).toBeNull();
  });

  it("confirms deletion through the inline danger panel", async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);

    render(
      <MemoryRouter>
        <ProjectListItem project={baseProject} canDelete onDelete={onDelete} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: "删除课题" }));
    expect(screen.getByText("确认删除「偏振成像课题」")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "确认删除" }));

    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledWith(baseProject);
    });
  });
});
