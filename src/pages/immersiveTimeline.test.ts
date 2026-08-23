import { describe, expect, it } from "vitest";

import { TIMELINE_EVENTS } from "@/data/timeline-events";

import {
  cameraZForProgress,
  FIRST_EVENT_Z,
  heroTransition,
  interpolateSky,
  layoutTimelineEvents,
  markerEdgeFade,
  markerOpacity,
  scrollProgress,
} from "./immersiveTimeline";

describe("immersive timeline helpers", () => {
  it("lays out every visible event in stable year order on its track", () => {
    const markers = layoutTimelineEvents();

    expect(markers).toHaveLength(38);
    expect(markers.every(({ event }) => !event.hidden)).toBe(true);
    expect(markers.map(({ event }) => event.year)).toEqual(
      [...markers].map(({ event }) => event.year).sort((a, b) => a - b),
    );
    expect(markers.every(({ event, x }) => x === (event.track === "optics" ? -4 : 4))).toBe(
      true,
    );
    expect(TIMELINE_EVENTS.filter((event) => event.hidden)).toHaveLength(12);
  });

  it("clamps scroll progress and carries the camera past the final marker", () => {
    expect(scrollProgress(-20, 2_000, 1_000)).toBe(0);
    expect(scrollProgress(500, 2_000, 1_000)).toBe(0.5);
    expect(scrollProgress(2_000, 2_000, 1_000)).toBe(1);

    const markers = layoutTimelineEvents();
    expect(cameraZForProgress(0, markers.length)).toBe(10);
    expect(cameraZForProgress(1, markers.length)).toBe(
      FIRST_EVENT_Z - (markers.length - 1) * 8 - 12,
    );
  });

  it("matches the reference hero fade and lift transition", () => {
    expect(heroTransition(0)).toEqual({ opacity: 1, lift: 0 });
    expect(heroTransition(100)).toEqual({ opacity: 1, lift: 20 });
    expect(heroTransition(350)).toEqual({ opacity: 0.5, lift: 70 });
    expect(heroTransition(600)).toEqual({ opacity: 0, lift: 100 });
    expect(heroTransition(1_000)).toEqual({ opacity: 0, lift: 100 });
  });

  it("fades markers in ahead of the camera and out before they pass", () => {
    expect(markerOpacity(6, 0, 0)).toBe(0);
    expect(markerOpacity(12, 0)).toBe(0);
    expect(markerOpacity(9, 0)).toBe(0.5);
    expect(markerOpacity(6, 0)).toBe(1);
    expect(markerOpacity(4, 0)).toBe(1);
    expect(markerOpacity(2, 0)).toBe(0.5);
    expect(markerOpacity(0, 0)).toBe(0);
    expect(markerOpacity(-2, 0)).toBe(0);
  });

  it("fades projected markers before they reach the viewport edge", () => {
    expect(markerEdgeFade(0.7, 0)).toBe(1);
    expect(markerEdgeFade(0.875, 0)).toBe(0.5);
    expect(markerEdgeFade(-1, 0)).toBe(0);
    expect(markerEdgeFade(0, 1.2)).toBe(0);
  });

  it("keeps at most two event markers visible at once", () => {
    const markers = layoutTimelineEvents();
    const finalCameraZ = cameraZForProgress(1, markers.length);

    for (let cameraZ = 10; cameraZ >= finalCameraZ; cameraZ -= 1) {
      const visibleCount = markers.filter(({ z }) => markerOpacity(cameraZ, z) > 0).length;
      expect(visibleCount).toBeLessThanOrEqual(2);
    }
  });

  it("interpolates a complete daylight-to-night-to-day sky cycle", () => {
    const daylight = interpolateSky(0);
    const dusk = interpolateSky(0.3);
    const night = interpolateSky(0.58);

    expect(interpolateSky(1)).toEqual(daylight);
    expect(interpolateSky(0.15).background[0]).toBeCloseTo(
      (daylight.background[0] + dusk.background[0]) / 2,
    );
    expect(night.background[0]).toBeLessThan(dusk.background[0]);
    expect(interpolateSky(-1)).toEqual(daylight);
    expect(interpolateSky(2)).toEqual(daylight);
  });
});
