// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UnitsPage } from "./UnitsPage";

const { mockUnitStore } = vi.hoisted(() => ({
  mockUnitStore: {
    units: [
      {
        id: "unit1",
        title: { "zh-CN": "第一单元" },
        description: { "zh-CN": "单元描述" },
        color: "#0ea5e9",
        sortOrder: 0,
        courseCount: 2,
        coverImage: "/missing-unit-cover.jpg",
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
    error: null,
    fetchUnits: vi.fn(),
  },
}));

vi.mock("@/contexts/ThemeContext", () => ({
  useTheme: () => ({ theme: "light" as const }),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: { language: "zh-CN" },
  }),
}));

vi.mock("@/components/shared", () => ({
  PersistentHeader: ({ moduleName }: { moduleName?: string }) => <div>{moduleName}</div>,
}));

vi.mock("@/stores/unitStore", () => ({
  useUnitStore: () => mockUnitStore,
}));

describe("UnitsPage", () => {
  beforeEach(() => {
    mockUnitStore.fetchUnits.mockClear();
  });

  it("uses the shared unit icon instead of rendering cover images", () => {
    render(
      <MemoryRouter>
        <UnitsPage />
      </MemoryRouter>
    );

    expect(screen.getByText("第一单元")).toBeDefined();
    expect(screen.queryByRole("img", { name: "第一单元" })).toBeNull();
    expect(document.querySelector('img[src="/missing-unit-cover.jpg"]')).toBeNull();
    expect(mockUnitStore.fetchUnits).toHaveBeenCalledTimes(1);
  });
});
