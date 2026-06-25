// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import CalciteCasePage from "./CalciteCasePage";
import DevicesPage from "./DevicesPage";

vi.mock("@/components/shared", () => ({
  PersistentHeader: ({ moduleName }: { moduleName?: string }) => (
    <div data-testid="persistent-header">{moduleName}</div>
  ),
}));

describe("DevicesPage", () => {
  it("renders the polarization challenge launcher", () => {
    render(
      <MemoryRouter>
        <DevicesPage />
      </MemoryRouter>
    );

    expect(screen.getAllByText("偏振挑战").length).toBeGreaterThan(0);
    expect(screen.getByText("冰洲石双影迷案：寻找光的隐藏维度")).toBeDefined();
    expect(screen.getByRole("link", { name: /开始挑战/ }).getAttribute("href")).toBe(
      "/devices/calcite-case",
    );
  });
});

describe("CalciteCasePage", () => {
  it("embeds the copied game html", () => {
    render(
      <MemoryRouter>
        <CalciteCasePage />
      </MemoryRouter>
    );

    const iframe = screen.getByTitle("冰洲石双影迷案：寻找光的隐藏维度");

    expect(iframe.getAttribute("src")).toBe("/devices/calcite-case/index.html");
    expect(screen.getByRole("link", { name: /返回偏振挑战/ }).getAttribute("href")).toBe(
      "/devices",
    );
  });
});
