// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDemoCanvas, type DemoCanvasFrame } from "./useDemoCanvas";

function Canvas({ draw, paused = false, timeScale = 1 }: {
  draw: (frame: DemoCanvasFrame) => void;
  paused?: boolean;
  timeScale?: number;
}) {
  const ref = useDemoCanvas({ width: 640, height: 320, draw, paused, timeScale });
  return <div><canvas ref={ref} /></div>;
}

describe("demo canvas playback", () => {
  let frames: Map<number, FrameRequestCallback>;
  let hidden: boolean;
  let motion: { matches: boolean; addEventListener: ReturnType<typeof vi.fn>; removeEventListener: ReturnType<typeof vi.fn> };
  let resize: () => void;

  const tick = (timestamp: number) => act(() => {
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach(callback => callback(timestamp));
  });

  beforeEach(() => {
    frames = new Map();
    hidden = false;
    let id = 0;
    motion = { matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() };
    vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => {
      frames.set(++id, callback);
      return id;
    }));
    vi.stubGlobal("cancelAnimationFrame", vi.fn((frameId: number) => frames.delete(frameId)));
    vi.stubGlobal("matchMedia", vi.fn(() => motion));
    vi.stubGlobal("devicePixelRatio", 2);
    vi.stubGlobal("ResizeObserver", class {
      constructor(callback: () => void) { resize = callback; }
      observe() {}
      disconnect() {}
    });
    vi.spyOn(document, "hidden", "get").mockImplementation(() => hidden);
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(320);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      setTransform: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("keeps the wavefront frozen while paused, redraws controls, and resumes without a jump", () => {
    const draw = vi.fn();
    const view = render(<Canvas draw={draw} timeScale={2} />);
    tick(100);
    tick(125);
    expect(draw.mock.lastCall?.[0].time).toBeCloseTo(0.05);

    view.rerender(<Canvas draw={draw} paused timeScale={2} />);
    tick(150);
    expect(draw.mock.lastCall?.[0]).toMatchObject({ time: 0.05, dt: 0 });
    expect(frames.size).toBe(0);

    const updatedDraw = vi.fn();
    view.rerender(<Canvas draw={updatedDraw} paused timeScale={2} />);
    tick(5000);
    expect(updatedDraw.mock.lastCall?.[0].time).toBeCloseTo(0.05);
    expect(frames.size).toBe(0);

    view.rerender(<Canvas draw={updatedDraw} timeScale={2} />);
    tick(5100);
    expect(updatedDraw.mock.lastCall?.[0].time).toBeCloseTo(0.05);
    tick(5125);
    expect(updatedDraw.mock.lastCall?.[0].time).toBeCloseTo(0.1);
    tick(9000);
    expect(updatedDraw.mock.lastCall?.[0].time).toBeCloseTo(0.2);

    view.unmount();
    expect(frames.size).toBe(0);
  });

  it("stops for reduced motion and hidden tabs while preserving resize and parameter redraws", () => {
    motion.matches = true;
    const draw = vi.fn();
    const view = render(<Canvas draw={draw} />);
    const canvas = view.container.querySelector("canvas")!;
    tick(100);
    expect(draw.mock.lastCall?.[0].time).toBe(0);
    expect(frames.size).toBe(0);
    expect([canvas.width, canvas.height]).toEqual([640, 320]);
    expect([canvas.style.width, canvas.style.height]).toEqual(["320px", "160px"]);

    act(() => resize());
    tick(500);
    expect(draw).toHaveBeenCalledTimes(2);
    expect(frames.size).toBe(0);

    motion.matches = false;
    act(() => motion.addEventListener.mock.calls[0][1]());
    tick(1000);
    tick(1025);
    expect(draw.mock.lastCall?.[0].time).toBeCloseTo(0.025);

    hidden = true;
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(frames.size).toBe(0);
    hidden = false;
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    tick(10000);
    expect(draw.mock.lastCall?.[0].time).toBeCloseTo(0.025);
    tick(10025);
    expect(draw.mock.lastCall?.[0].time).toBeCloseTo(0.05);

    motion.matches = true;
    act(() => motion.addEventListener.mock.calls[0][1]());
    tick(10050);
    expect(draw.mock.lastCall?.[0].time).toBeCloseTo(0.05);
    expect(frames.size).toBe(0);
    view.unmount();
    expect(motion.removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
  });
});
