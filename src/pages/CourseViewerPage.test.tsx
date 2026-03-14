// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CourseViewerPage from "./CourseViewerPage";

const fetchCourse = vi.fn();
const reset = vi.fn();

const courseStoreState = {
  course: {
    id: "course1",
    unitId: "unit1",
    title: { "zh-CN": "冰洲石实验" },
    description: { "zh-CN": "观察双折射与偏振现象" },
    color: "#0ea5e9",
    updatedAt: "2026-03-14T00:00:00.000Z",
  },
  mainSlide: {
    id: "slide-1",
    url: "/slides/course1.pdf",
    title: { "zh-CN": "主课件" },
  },
  media: [
    {
      id: "ppt-1",
      type: "pptx" as const,
      url: "/media/course1-extra.pptx",
      title: { "zh-CN": "补充课件" },
    },
    {
      id: "video-1",
      type: "video" as const,
      url: "/media/course1-video.mp4",
      title: { "zh-CN": "实验视频" },
      duration: 28,
    },
  ],
  hyperlinks: [],
  isLoading: false,
  error: null,
  fetchCourse,
  reset,
};

vi.mock("@/contexts/ThemeContext", () => ({
  useTheme: () => ({ theme: "light" as const }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: { language: "zh-CN" },
    t: (key: string) => key,
  }),
}));

vi.mock("@/stores/courseStore", () => ({
  useCourseDetailStore: () => courseStoreState,
}));

vi.mock("@/components/shared", () => ({
  PersistentHeader: ({
    moduleName,
    rightContent,
  }: {
    moduleName?: string;
    rightContent?: unknown;
  }) => (
    <div>
      <div>{moduleName}</div>
      <div>{rightContent}</div>
    </div>
  ),
}));

vi.mock("@/lib/routePreload", () => ({
  loadCourseViewerModule: async () => ({
    CourseViewer: ({ course }: { course: { id: string } }) => <div>mock-viewer-{course.id}</div>,
  }),
}));

describe("CourseViewerPage", () => {
  beforeEach(() => {
    fetchCourse.mockReset();
    reset.mockReset();
  });

  it("loads the experiment viewer page with the current course context", async () => {
    render(
      <MemoryRouter initialEntries={["/experiments/course1"]}>
        <Routes>
          <Route path="/experiments/:experimentId" element={<CourseViewerPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(fetchCourse).toHaveBeenCalledWith("course1");
    expect(screen.getByText("冰洲石实验")).toBeDefined();
    expect(await screen.findByText("mock-viewer-course1")).toBeDefined();
  });
});
