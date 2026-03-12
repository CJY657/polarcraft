// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { CourseSelector } from "./CourseSelector";

vi.mock("@/contexts/ThemeContext", () => ({
  useTheme: () => ({ theme: "light" as const }),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: { language: "zh-CN" },
  }),
}));

vi.mock("@/lib/routePreload", () => ({
  preloadCourseViewerRoute: vi.fn(),
}));

describe("CourseSelector", () => {
  it("navigates to the course viewer route when a course card is clicked", () => {
    render(
      <MemoryRouter initialEntries={["/units/unit1"]}>
        <Routes>
          <Route
            path="/units/:unitId"
            element={
              <CourseSelector
                unitId="unit1"
                unitColor="#0ea5e9"
                layout="sidebar"
                courses={[
                  {
                    id: "course1",
                    unitId: "unit1",
                    title: { "zh-CN": "课程一" },
                    description: { "zh-CN": "测试课程" },
                    color: "#0ea5e9",
                    mainSlide: {
                      id: "slide1",
                      url: "/slides/course1.pdf",
                      title: { "zh-CN": "主课件" },
                    },
                    mediaCount: 3,
                    createdAt: "2026-03-12T00:00:00.000Z",
                    updatedAt: "2026-03-12T00:00:00.000Z",
                  },
                ]}
              />
            }
          />
          <Route
            path="/units/:unitId/courses/:courseId"
            element={<div>Course Viewer Page</div>}
          />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("link", { name: /课程一/i }));

    expect(screen.getByText("Course Viewer Page")).toBeDefined();
  });
});
