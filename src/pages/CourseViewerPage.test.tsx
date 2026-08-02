// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { KnowledgeTag } from "@/lib/course.service";

import CourseViewerPage from "./CourseViewerPage";

const fetchCourse = vi.fn();
const reset = vi.fn();
const authState = vi.hoisted(() => ({
  user: null as null | { role: "user" | "admin" },
}));

const { mockGetPublicUnits, mockGetPublicUnitCourses, mockCoursesByUnit } = vi.hoisted(() => ({
  mockGetPublicUnits: vi.fn(),
  mockGetPublicUnitCourses: vi.fn(),
  mockCoursesByUnit: {
    unit1: [
      {
        id: "device1",
        title: { "zh-CN": "缪勒显微镜" },
        description: { "zh-CN": "光学设备" },
        color: "#0ea5e9",
        knowledgeTag: "optical_device",
      },
      {
        id: "course1",
        title: { "zh-CN": "冰洲石实验" },
        description: { "zh-CN": "观察双折射" },
        color: "#0ea5e9",
        knowledgeTag: "foundation",
      },
    ],
    unit2: [
      {
        id: "course3",
        title: { "zh-CN": "色偏振" },
        description: { "zh-CN": "观察应力色彩" },
        color: "#f97316",
        knowledgeTag: "foundation",
      },
    ],
  },
}));

const defaultCourse = {
  id: "course1",
  unitId: "unit1",
  title: { "zh-CN": "冰洲石实验" },
  description: { "zh-CN": "观察双折射与偏振现象" },
  color: "#0ea5e9",
  knowledgeTag: "foundation" as KnowledgeTag,
  updatedAt: "2026-03-14T00:00:00.000Z",
};

const courseStoreState: {
  course: typeof defaultCourse | null;
  mainSlide: unknown;
  media: unknown[];
  hyperlinks: unknown[];
  isLoading: boolean;
  error: string | null;
  fetchCourse: typeof fetchCourse;
  reset: typeof reset;
} = {
  course: { ...defaultCourse },
  mainSlide: {
    id: "slide-1",
    url: "/slides/course1.pdf",
    title: { "zh-CN": "主课件" },
    knowledgeTag: "foundation" as const,
  },
  media: [
    {
      id: "ppt-1",
      type: "pptx" as const,
      url: "/media/course1-extra.pptx",
      title: { "zh-CN": "补充课件" },
      knowledgeTag: "foundation" as const,
    },
    {
      id: "video-1",
      type: "video" as const,
      url: "/media/course1-video.mp4",
      title: { "zh-CN": "实验视频" },
      knowledgeTag: "foundation" as const,
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
  useAuth: () => ({ user: authState.user }),
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

vi.mock("@/lib/unit.service", () => ({
  unitApi: {
    getPublicUnits: mockGetPublicUnits,
    getPublicUnitCourses: mockGetPublicUnitCourses,
  },
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
    CourseViewer: ({
      course,
      canDownloadResources,
      backPath,
      navigation,
    }: {
      course: { id: string };
      canDownloadResources?: boolean;
      backPath?: string;
      navigation?: {
        units: Array<{ id: string; experiments: Array<{ id: string; title: Record<string, string> }> }>;
        activeExperimentId: string | null;
        onSelectExperiment: (experimentId: string) => void;
      };
    }) => (
      <div>
        <div>
          mock-viewer-{course.id}-download-{String(canDownloadResources)}-back-{backPath}
        </div>
        {navigation ? (
          <div>
            <div data-testid="nav-active">{navigation.activeExperimentId}</div>
            <div data-testid="nav-units">{navigation.units.length}</div>
            {navigation.units.flatMap((unit) =>
              unit.experiments.map((experiment) => (
                <button
                  key={experiment.id}
                  onClick={() => navigation.onSelectExperiment(experiment.id)}
                >
                  select-{experiment.id}
                </button>
              ))
            )}
          </div>
        ) : (
          <div data-testid="nav-absent">no-navigation</div>
        )}
      </div>
    ),
  }),
}));

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderPage(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <LocationProbe />
      <Routes>
        <Route path="/experiments" element={<CourseViewerPage />} />
        <Route path="/experiments/:experimentId" element={<CourseViewerPage />} />
        <Route path="/applications/:applicationId" element={<CourseViewerPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("CourseViewerPage", () => {
  beforeEach(() => {
    fetchCourse.mockReset();
    reset.mockReset();
    authState.user = null;
    courseStoreState.course = { ...defaultCourse };
    courseStoreState.error = null;
    courseStoreState.isLoading = false;
    mockGetPublicUnits.mockReset();
    mockGetPublicUnitCourses.mockReset();
    mockGetPublicUnits.mockResolvedValue([
      { id: "unit1", title: { "zh-CN": "第一单元" }, color: "#0ea5e9", sortOrder: 0 },
      { id: "unit2", title: { "zh-CN": "第二单元" }, color: "#f97316", sortOrder: 1 },
    ]);
    mockGetPublicUnitCourses.mockImplementation((unitId: keyof typeof mockCoursesByUnit) =>
      Promise.resolve(mockCoursesByUnit[unitId] ?? [])
    );
  });

  it("loads the experiment viewer page with the current course context", async () => {
    renderPage("/experiments/course1");

    expect(fetchCourse).toHaveBeenCalledWith("course1");
    expect(screen.getByText("冰洲石实验")).toBeDefined();
    expect(
      await screen.findByText("mock-viewer-course1-download-false-back-/experiments")
    ).toBeDefined();
  });

  it("allows only admin users to receive download-enabled viewer props", async () => {
    authState.user = { role: "admin" };

    renderPage("/experiments/course1");

    expect(
      await screen.findByText("mock-viewer-course1-download-true-back-/experiments")
    ).toBeDefined();
  });

  it("sends /experiments to the first foundation experiment", async () => {
    courseStoreState.course = null;

    renderPage("/experiments");

    await waitFor(() => {
      expect(screen.getByTestId("location").textContent).toBe("/experiments/course1");
    });
    expect(fetchCourse).toHaveBeenCalledWith("course1");
  });

  it("opens a deep link with the matching active experiment in the hierarchy", async () => {
    renderPage("/experiments/course3");

    expect(fetchCourse).toHaveBeenCalledWith("course3");
    await waitFor(() => {
      expect(screen.getByTestId("nav-active").textContent).toBe("course3");
    });
    expect(screen.getByTestId("nav-units").textContent).toBe("2");
  });

  it("navigates and fetches details when another experiment is selected", async () => {
    renderPage("/experiments/course1");

    const selectButton = await screen.findByRole("button", { name: "select-course3" });
    fetchCourse.mockClear();

    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByTestId("location").textContent).toBe("/experiments/course3");
    });
    expect(fetchCourse).toHaveBeenCalledWith("course3");
  });

  it("still redirects optical-device content to the applications viewer", async () => {
    courseStoreState.course = { ...defaultCourse, knowledgeTag: "optical_device" };

    renderPage("/experiments/course1");

    await waitFor(() => {
      expect(screen.getByTestId("location").textContent).toBe("/applications/course1");
    });
    expect(await screen.findByTestId("nav-absent")).toBeDefined();
  });

  it("keeps the applications viewer free of hierarchy navigation", async () => {
    renderPage("/applications/course1");

    expect(await screen.findByTestId("nav-absent")).toBeDefined();
    expect(mockGetPublicUnits).not.toHaveBeenCalled();
    expect(
      screen.getByText("mock-viewer-course1-download-false-back-/applications")
    ).toBeDefined();
  });

  it("shows an inline retry when the curriculum fails to load", async () => {
    courseStoreState.course = null;
    mockGetPublicUnits.mockRejectedValue(new Error("网络异常"));

    renderPage("/experiments");

    expect(await screen.findByTestId("curriculum-error")).toBeDefined();
    expect(screen.getByRole("alert").textContent).toContain("网络异常");
    expect(screen.getByTestId("location").textContent).toBe("/experiments");

    mockGetPublicUnits.mockResolvedValue([
      { id: "unit2", title: { "zh-CN": "第二单元" }, color: "#f97316", sortOrder: 0 },
    ]);
    fireEvent.click(screen.getByRole("button", { name: /重新加载/ }));

    await waitFor(() => {
      expect(screen.getByTestId("location").textContent).toBe("/experiments/course3");
    });
  });

  it("shows an empty state when no foundation experiments exist", async () => {
    courseStoreState.course = null;
    mockGetPublicUnitCourses.mockResolvedValue([]);

    renderPage("/experiments");

    expect(await screen.findByTestId("curriculum-empty")).toBeDefined();
    expect(screen.getByText("暂时还没有可进入的实验内容。")).toBeDefined();
    expect(screen.getByTestId("location").textContent).toBe("/experiments");
  });
});
