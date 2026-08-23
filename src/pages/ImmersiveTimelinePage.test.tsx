// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import ImmersiveTimelinePage from "./ImmersiveTimelinePage";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ i18n: { language: "zh-CN" } }),
}));

function setMotionPreference(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockReturnValue({
      matches,
      media: "(prefers-reduced-motion: reduce)",
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
}

describe("ImmersiveTimelinePage", () => {
  it("respects reduced motion without requesting a WebGL context", () => {
    setMotionPreference(true);
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);

    render(
      <MemoryRouter>
        <ImmersiveTimelinePage />
      </MemoryRouter>,
    );

    expect(screen.getByText("已根据你的动态效果偏好关闭飞行场景。")).toBeTruthy();
    expect(screen.getByText("穿越偏振光的历史")).toBeTruthy();
    expect(screen.getByRole("link", { name: "查看完整时间线" }).getAttribute("href")).toBe(
      "/chronicles/explore",
    );
    expect(getContext).not.toHaveBeenCalled();
    getContext.mockRestore();
  });

  it("offers the detailed timeline when WebGL is unavailable", async () => {
    setMotionPreference(false);
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);

    render(
      <MemoryRouter>
        <ImmersiveTimelinePage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("此设备无法启动 WebGL 飞行场景。")).toBeTruthy();
    expect(screen.getByRole("link", { name: "直接查看完整时间线" }).getAttribute("href")).toBe(
      "/chronicles/explore",
    );
    getContext.mockRestore();
  });
});
