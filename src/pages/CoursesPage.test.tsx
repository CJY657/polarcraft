// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CoursesPage } from "./CoursesPage";

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
      },
      {
        id: "course2",
        title: { "zh-CN": "反射偏振" },
        description: { "zh-CN": "观察布儒斯特角" },
        color: "#0ea5e9",
      },
    ],
    unit2: [
      {
        id: "course3",
        title: { "zh-CN": "色偏振" },
        description: { "zh-CN": "观察应力色彩" },
        color: "#f97316",
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
    t: (key: string) => (key === "page.courses.title" ? "实验内容" : key),
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
  CourseSelector: ({ courses }: { courses: unknown[] }) => (
    <div>course-selector-{courses.length}</div>
  ),
}));

describe("CoursesPage", () => {
  beforeEach(() => {
    mockGetPublicUnitCourses.mockReset();
    mockGetPublicUnitCourses.mockImplementation((unitId: keyof typeof mockCoursesByUnit) =>
      Promise.resolve(mockCoursesByUnit[unitId] ?? []),
    );
  });

  it("renders a prominent link back to the home page", async () => {
    render(
      <MemoryRouter>
        <CoursesPage />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: "返回主页" }).getAttribute("href")).toBe("/");
    await waitFor(() => {
      expect(mockGetPublicUnitCourses).toHaveBeenCalled();
    });
  });

  it("defaults to all experiments and loads every unit on first render", async () => {
    render(
      <MemoryRouter>
        <CoursesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockGetPublicUnitCourses).toHaveBeenCalledWith("unit1");
      expect(mockGetPublicUnitCourses).toHaveBeenCalledWith("unit2");
    });
    expect(mockGetPublicUnitCourses).toHaveBeenCalledTimes(2);

    expect(screen.getByText("查看全部实验")).toBeDefined();
    expect(screen.getAllByText("3 个实验").length).toBeGreaterThan(0);
    expect(screen.getAllByText("章节结构").length).toBe(2);
    expect(screen.getByText("冰洲石实验")).toBeDefined();
    expect(screen.getByText("反射偏振")).toBeDefined();
    expect(screen.getByText("色偏振")).toBeDefined();
    expect(screen.getByText("course-selector-3")).toBeDefined();
  });

  it("can switch from a unit back to all experiments", async () => {
    render(
      <MemoryRouter>
        <CoursesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockGetPublicUnitCourses).toHaveBeenCalledWith("unit1");
      expect(mockGetPublicUnitCourses).toHaveBeenCalledWith("unit2");
    });
    expect(mockGetPublicUnitCourses).toHaveBeenCalledTimes(2);

    mockGetPublicUnitCourses.mockClear();

    fireEvent.click(screen.getByRole("button", { name: /第一单元/i }));

    await waitFor(() => {
      expect(screen.getByText("course-selector-2")).toBeDefined();
    });
    expect(mockGetPublicUnitCourses).not.toHaveBeenCalled();

    mockGetPublicUnitCourses.mockClear();

    fireEvent.click(screen.getByRole("button", { name: /查看全部实验/i }));

    await waitFor(() => {
      expect(screen.getByText("course-selector-3")).toBeDefined();
    });
    expect(mockGetPublicUnitCourses).not.toHaveBeenCalled();
  });
});
