// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApplicationsPage } from "./ApplicationsPage";

const { mockUnitStore, mockGetPublicUnitCourses, mockCoursesByUnit } = vi.hoisted(() => ({
  mockUnitStore: {
    units: [
      {
        id: "unit1",
        title: { "zh-CN": "第一单元" },
        description: { "zh-CN": "单元描述" },
        color: "#0ea5e9",
        sortOrder: 0,
        courseCount: 2,
      },
      {
        id: "unit2",
        title: { "zh-CN": "第二单元" },
        description: { "zh-CN": "单元描述" },
        color: "#f97316",
        sortOrder: 1,
        courseCount: 1,
      },
    ],
    isLoading: false,
    fetchUnits: vi.fn(),
  },
  mockGetPublicUnitCourses: vi.fn(() => new Promise(() => {})),
  mockCoursesByUnit: {
    unit1: [
      {
        id: "course1",
        title: { "zh-CN": "冰洲石实验" },
        description: { "zh-CN": "观察双折射" },
        color: "#0ea5e9",
        knowledgeTag: "foundation",
      },
      {
        id: "course2",
        title: { "zh-CN": "缪勒显微镜" },
        description: { "zh-CN": "观察设备应用" },
        color: "#0ea5e9",
        knowledgeTag: "optical_device",
      },
    ],
    unit2: [
      {
        id: "course3",
        title: { "zh-CN": "偏振散射仪" },
        description: { "zh-CN": "前沿检测设备" },
        color: "#f97316",
        knowledgeTag: "optical_device",
      },
    ],
  },
}));

vi.mock("@/contexts/ThemeContext", () => ({
  useTheme: () => ({ theme: "light" as const }),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: { language: "zh-CN" },
    t: (key: string) => key,
  }),
}));

vi.mock("@/components/shared", () => ({
  PersistentHeader: ({ moduleName }: { moduleName?: string }) => <div>{moduleName}</div>,
}));

vi.mock("@/stores/unitStore", () => ({
  useUnitStore: () => mockUnitStore,
}));

vi.mock("@/lib/unit.service", () => ({
  unitApi: {
    getPublicUnitCourses: mockGetPublicUnitCourses,
  },
}));

vi.mock("@/feature/unit/CourseSelector", () => ({
  CourseSelector: ({
    courses,
    basePath,
    tone,
  }: {
    courses: Array<{ title: { "zh-CN"?: string } }>;
    basePath: string;
    tone?: string;
  }) => (
    <div>
      <div data-testid="selector-count">course-selector-{basePath}-{courses.length}</div>
      <div data-testid="selector-tone">{tone || "legacy"}</div>
      {courses.map((course) => (
        <span key={course.title["zh-CN"]}>{course.title["zh-CN"]}</span>
      ))}
    </div>
  ),
}));

describe("ApplicationsPage", () => {
  beforeEach(() => {
    mockGetPublicUnitCourses.mockReset();
    mockGetPublicUnitCourses.mockImplementation((unitId: keyof typeof mockCoursesByUnit) =>
      Promise.resolve(mockCoursesByUnit[unitId] ?? []),
    );
  });

  it("shows only optical-device content on the applications shelf", async () => {
    render(
      <MemoryRouter>
        <ApplicationsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockGetPublicUnitCourses).toHaveBeenCalledWith("unit1");
      expect(mockGetPublicUnitCourses).toHaveBeenCalledWith("unit2");
    });

    expect(screen.getAllByText("前沿应用").length).toBeGreaterThan(0);
    expect(screen.queryByTestId("experiments-clay-shell")).toBeNull();
    expect(screen.getByTestId("applications-clay-shell")).toBeDefined();
    expect(screen.getAllByText("2 个应用").length).toBeGreaterThan(0);
    expect(screen.queryByText("冰洲石实验")).toBeNull();
    expect(screen.getAllByText("缪勒显微镜").length).toBeGreaterThan(0);
    expect(screen.getAllByText("偏振散射仪").length).toBeGreaterThan(0);
    expect(screen.getByTestId("selector-count").textContent).toBe("course-selector-/applications-2");
    expect(screen.getByTestId("selector-tone").textContent).toBe("clay");
  });
});
