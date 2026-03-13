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
  it("navigates to the experiment viewer route when an experiment card is clicked", () => {
    render(
      <MemoryRouter initialEntries={["/experiments"]}>
        <Routes>
          <Route
            path="/experiments"
            element={
              <CourseSelector
                unitColor="#0ea5e9"
                layout="sidebar"
                courses={[
                  {
                    id: "course1",
                    title: { "zh-CN": "实验一" },
                    description: { "zh-CN": "测试实验" },
                    color: "#0ea5e9",
                    mainSlide: {
                      id: "slide1",
                      url: "/slides/course1.pdf",
                      title: { "zh-CN": "主课件" },
                    },
                    mediaCount: 3,
                  },
                ]}
              />
            }
          />
          <Route
            path="/experiments/:experimentId"
            element={<div>Course Viewer Page</div>}
          />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("link", { name: /实验一/i }));

    expect(screen.getByText("Course Viewer Page")).toBeDefined();
  });
});
