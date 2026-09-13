// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AnimatedValue, PresetButtons, SliderControl, Toggle } from "./DemoControls";

vi.mock("@/contexts/ThemeContext", () => ({
  useTheme: () => ({ theme: "dark" }),
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ i18n: { language: "en" } }),
}));
vi.mock("@/components/shared/MathText", () => ({ default: ({ text }: { text: string }) => text }));

describe("DemoControls", () => {
  it("labels sliders and exposes a visible progress fill", () => {
    render(<SliderControl label="Angle" value={25} min={0} max={100} onChange={vi.fn()} />);

    const slider = screen.getByRole("slider", { name: "Angle" });
    expect(slider.className).toContain("h-6");
    expect(screen.getByText("25")).not.toBeNull();
    expect(document.querySelector('[style="width: 25%;"]')).not.toBeNull();
  });

  it("supports keyboard and whole-label toggle interaction", () => {
    const onChange = vi.fn();
    render(<Toggle label="Show axes" checked={false} onChange={onChange} />);
    const checkbox = screen.getByRole("checkbox", { name: "Show axes" });

    fireEvent.click(screen.getByText("Show axes"));
    expect(onChange).toHaveBeenCalledWith(true);
    fireEvent.change(checkbox, { target: { checked: true } });
    expect((checkbox as HTMLInputElement).checked).toBe(true);
  });

  it("marks presets and animated bars without width transitions", () => {
    const { container } = render(
      <>
        <PresetButtons options={[{ value: "a", label: { en: "A" } }]} value="a" onChange={vi.fn()} />
        <AnimatedValue label="Energy" value={5} min={0} max={10} showBar />
      </>,
    );
    expect(screen.getByRole("button", { name: "A" }).getAttribute("aria-pressed")).toBe("true");
    expect(container.querySelector('[style*="scaleX(0.5)"]')).not.toBeNull();
    expect(container.querySelector(".origin-left.transition-transform")).not.toBeNull();
  });
});
