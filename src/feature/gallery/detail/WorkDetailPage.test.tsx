// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Course } from "@/lib/course.service";

import { GALLERY_RESULTS_UNIT_ID, mapCourseToGalleryWork } from "../courseResults";
import { WorkDetailPage } from "./WorkDetailPage";

const mockGetPublicCourse = vi.hoisted(() => vi.fn());

vi.mock("@/contexts/ThemeContext", () => ({
  useTheme: () => ({ theme: "light" as const }),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: { language: "zh-CN" },
    t: (key: string, options?: { count?: number }) => {
      if (key === "works.tabs.overview") return "简介";
      if (key === "works.tabs.mediaCount") return `媒体资源 (${options?.count ?? 0})`;
      if (key === "works.tabs.recordCount") return `研究记录 (${options?.count ?? 0})`;
      if (key === "works.media.title") return "媒体资源";
      if (key === "works.media.types.image") return "图片";
      if (key === "works.media.types.pdf") return "PDF";
      if (key === "works.media.viewImage") return "查看大图";
      if (key === "works.media.openFile") return "打开文件";
      if (key === "works.overview.title") return "作品简介";
      if (key === "works.overview.projectShowcase") return "图片展示";
      if (key === "works.authors") return "作者";
      if (key === "works.back") return "返回";
      if (key === "works.actions.share") return "分享";
      if (key === "works.actions.viewCount") return `${options?.count ?? 0} 次浏览`;
      if (key === "common.back") return "返回";
      return key;
    },
  }),
}));

vi.mock("@/components/shared", () => ({
  PersistentHeader: () => <header />,
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, isOpen }: { children: ReactNode; isOpen: boolean }) =>
    isOpen ? <div>{children}</div> : null,
}));

vi.mock("@/lib/course.service", () => ({
  courseApi: {
    getPublicCourse: mockGetPublicCourse,
  },
}));

const resultCourse: Course = {
  id: "result-1",
  unitId: GALLERY_RESULTS_UNIT_ID,
  title: { "zh-CN": "偏振海报" },
  description: { "zh-CN": "学生海报成果" },
  color: "#264653",
  knowledgeTag: "student_poster",
  sortOrder: 2,
  media: [
    {
      id: "poster-image",
      type: "image",
      url: "/uploads/courses/gallery-results/image/poster.png",
      title: { "zh-CN": "海报图片" },
      knowledgeTag: "student_poster",
      sortOrder: 0,
    },
  ],
  hyperlinks: [],
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-02T00:00:00.000Z",
};

function renderDetail(initialEntries: Parameters<typeof MemoryRouter>[0]["initialEntries"]) {
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/gallery/work/:workId" element={<WorkDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("WorkDetailPage", () => {
  beforeEach(() => {
    mockGetPublicCourse.mockReset();
    mockGetPublicCourse.mockResolvedValue(resultCourse);
  });

  it("renders an uploaded gallery result from router state", () => {
    const work = mapCourseToGalleryWork(resultCourse);

    renderDetail([
      {
        pathname: `/gallery/work/${work.id}`,
        state: { from: "gallery", work },
      },
    ]);

    expect(screen.getByText("偏振海报")).toBeDefined();
    expect(screen.getByText("学生海报成果")).toBeDefined();
    expect(screen.getByRole("button", { name: "媒体资源 (1)" })).toBeDefined();
    expect(mockGetPublicCourse).not.toHaveBeenCalled();
  });

  it("fetches an uploaded gallery result for direct detail links", async () => {
    renderDetail(["/gallery/work/course:student_poster:result-1"]);

    expect(await screen.findByText("偏振海报")).toBeDefined();
    expect(mockGetPublicCourse).toHaveBeenCalledWith("result-1");
    expect(screen.getByText("学生海报成果")).toBeDefined();
    expect(screen.getByRole("button", { name: "媒体资源 (1)" })).toBeDefined();
  });

  it("opens the media image lightbox from the view image button", () => {
    const work = mapCourseToGalleryWork(resultCourse);

    renderDetail([
      {
        pathname: `/gallery/work/${work.id}`,
        state: { from: "gallery", work },
      },
    ]);

    fireEvent.click(screen.getByRole("button", { name: "媒体资源 (1)" }));
    fireEvent.click(screen.getByRole("button", { name: "查看大图" }));

    expect(screen.getByTestId("discussion-lightbox-image").getAttribute("src")).toBe(
      "/uploads/courses/gallery-results/image/poster.png",
    );
  });
});
