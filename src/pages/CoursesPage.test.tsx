// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { CoursesPage } from "./CoursesPage";

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
  useUnitStore: () => ({
    units: [
      {
        id: "unit1",
        title: { "zh-CN": "第一单元" },
        description: { "zh-CN": "单元描述" },
        color: "#0ea5e9",
        sortOrder: 0,
        courseCount: 2,
      },
    ],
    isLoading: false,
    fetchUnits: vi.fn(),
  }),
}));

vi.mock("@/lib/unit.service", () => ({
  unitApi: {
    getPublicUnitCourses: vi.fn(() => new Promise(() => {})),
  },
}));

vi.mock("@/feature/unit/CourseSelector", () => ({
  CourseSelector: () => <div>course-selector</div>,
}));

describe("CoursesPage", () => {
  it("renders a prominent link back to the home page", () => {
    render(
      <MemoryRouter>
        <CoursesPage />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: "返回主页" }).getAttribute("href")).toBe("/");
  });
});
