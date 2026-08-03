// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import CalciteCasePage from "./CalciteCasePage";
import DevicesPage from "./DevicesPage";

vi.mock("@/components/shared", () => ({
  PersistentHeader: ({ moduleName }: { moduleName?: string }) => (
    <div data-testid="persistent-header">{moduleName}</div>
  ),
}));

vi.mock("@/contexts/ThemeContext", () => ({
  useTheme: () => ({ theme: "light" as const }),
}));

describe("DevicesPage", () => {
  it("renders the polarization challenge launcher", () => {
    render(
      <MemoryRouter initialEntries={["/devices"]}>
        <DevicesPage />
      </MemoryRouter>
    );

    expect(screen.getAllByText("偏振挑战").length).toBeGreaterThan(0);
    expect(screen.getByText("冰洲石双影迷案：寻找光的隐藏维度")).toBeDefined();
    expect(screen.getByRole("link", { name: /开始挑战/ }).getAttribute("href")).toBe(
      "/devices/calcite-case",
    );
    expect(screen.getByTestId("devices-curriculum-tree")).toBeDefined();
    expect(screen.getByRole("button", { name: /偏振挑战/ }).getAttribute("aria-expanded")).toBe(
      "true",
    );
    expect(screen.getByRole("link", { name: "挑战总览" }).getAttribute("aria-current")).toBe(
      "page",
    );
  });

  it("opens the Module 2 curriculum drawer on mobile", async () => {
    render(
      <MemoryRouter initialEntries={["/devices"]}>
        <DevicesPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId("devices-curriculum-drawer-trigger"));

    expect(screen.getByRole("dialog", { name: "挑战目录" })).toBeDefined();
    expect(screen.getAllByTestId("devices-curriculum-tree")).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "挑战总览" })[1].getAttribute("aria-current")).toBe(
      "page",
    );

    fireEvent.click(screen.getAllByRole("link", { name: "冰洲石双影迷案" })[1]);

    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "挑战目录" })).toBeNull();
    });
  });
});

describe("CalciteCasePage", () => {
  it("embeds the copied game html", () => {
    render(
      <MemoryRouter initialEntries={["/devices/calcite-case"]}>
        <CalciteCasePage />
      </MemoryRouter>
    );

    const iframe = screen.getByTitle("冰洲石双影迷案：寻找光的隐藏维度");

    expect(iframe.getAttribute("src")).toBe("/devices/calcite-case/index.html");
    expect(screen.getByRole("link", { name: /返回偏振挑战/ }).getAttribute("href")).toBe(
      "/devices",
    );
    expect(
      screen.getByRole("link", { name: "冰洲石双影迷案" }).getAttribute("aria-current"),
    ).toBe("page");
    expect(screen.getByRole("link", { name: "挑战总览" }).getAttribute("href")).toBe(
      "/devices",
    );
  });
});
