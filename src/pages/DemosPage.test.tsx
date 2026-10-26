// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import "@/i18n";
import DemosPage from "./DemosPage";

vi.mock("@/components/shared/PersistentHeader", () => ({
  PersistentHeader: () => <header data-testid="site-header" />,
}));

vi.mock("@/components/ui/AuthThemeSwitcher", () => ({
  AuthThemeSwitcher: () => null,
}));

vi.mock("@/contexts/ThemeContext", () => ({
  useTheme: () => ({ theme: "light" }),
}));

vi.mock("@/hooks/useIsMobile", () => ({
  useIsMobile: () => ({ screenWidth: 1440 }),
}));

vi.mock("@/feature/demos/unit1/ColorStateDemo", () => ({
  ColorStateDemo: () => <div data-testid="color-state">Color state experiment</div>,
}));

vi.mock("@/feature/demos/unit1/VisuPhyPolarizationEmbed", () => ({
  VisuPhyPolarizationEmbed: () => <div data-testid="visuphy-polarization">Optical path simulator</div>,
}));

function CurrentLocation() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}{location.search}</output>;
}

function renderDemo(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/demos/:demoId?" element={<DemosPage />} />
      </Routes>
      <CurrentLocation />
    </MemoryRouter>,
  );
}

const bookRoutes = [
  ["optics-book", 0],
  ["em-wave", 0],
  ["polarization-types", 1],
  ["brewster-angle", 2],
  ["birefringence-iceland-spar", 3],
] as const;

describe("DemosPage book migration", () => {
  it("consolidates optical basics into one book above the two polarization experiments", () => {
    renderDemo("/demos");

    const basics = screen.getByRole("region", { name: "光学基础" });
    const book = within(basics).getByRole("link", { name: /一束光的两种旅程/ });
    expect(book.getAttribute("href")).toBe("/demos/optics-book");
    expect(within(basics).queryAllByRole("button")).toHaveLength(0);
    const polarization = screen.getByRole("region", { name: "偏振态" });
    expect(within(polarization).getAllByRole("button")).toHaveLength(2);
    expect(within(polarization).getByRole("heading", { name: "量糖计与旋光色散" })).toBeDefined();
    expect(within(polarization).getByRole("heading", { name: "3D 偏振光路模拟器" })).toBeDefined();
    expect(document.querySelector("iframe")).toBeNull();

    fireEvent.click(book);
    expect(screen.getByTitle("一束光的两种旅程 · 光学基础实验书")).toBeDefined();
  });

  it.each(bookRoutes)("opens %s in the book at chapter %i without the ordinary demo shell", (id, chapter) => {
    renderDemo(`/demos/${id}`);

    const iframe = screen.getByTitle("一束光的两种旅程 · 光学基础实验书");
    expect(iframe.getAttribute("src")).toBe(`/optics-book/index.html?chapter=${chapter}`);
    expect(screen.queryByTestId("site-header")).toBeNull();
    expect(document.querySelector("aside")).toBeNull();
    expect(screen.queryByRole("heading", { name: "演示目录" })).toBeNull();
  });

  it.each(bookRoutes)("preserves legacy query links for %s and their other parameters", async (id, chapter) => {
    renderDemo(`/demos?demo=${id}&from=course`);

    await waitFor(() => {
      expect(screen.getByTestId("location").textContent).toBe(`/demos/${id}?from=course`);
    });
    expect(screen.getByTitle("一束光的两种旅程 · 光学基础实验书").getAttribute("src"))
      .toBe(`/optics-book/index.html?chapter=${chapter}`);
  });

  it.each(["color-state", "visuphy-polarization"])("retains the %s experiment and normal demo shell", (id) => {
    renderDemo(`/demos/${id}?demo=em-wave`);

    expect(screen.getByTestId(id)).toBeDefined();
    expect(screen.getByTestId("site-header")).toBeDefined();
    expect(screen.getByRole("navigation", { name: "演示目录" })).toBeDefined();
    expect(screen.queryByTitle("一束光的两种旅程 · 光学基础实验书")).toBeNull();
  });

  it("keeps the gallery fallback for an unknown demo", () => {
    renderDemo("/demos/toString");

    expect(screen.getByRole("region", { name: "光学基础" })).toBeDefined();
    expect(screen.queryByTitle("一束光的两种旅程 · 光学基础实验书")).toBeNull();
  });

  it("removes the root scrollbar gutter only while the fullscreen book is mounted", () => {
    document.documentElement.style.scrollbarGutter = "stable";
    const { unmount } = renderDemo("/demos/optics-book");

    expect(document.documentElement.style.scrollbarGutter).toBe("auto");
    unmount();
    expect(document.documentElement.style.scrollbarGutter).toBe("stable");
    document.documentElement.style.scrollbarGutter = "";
  });
});
