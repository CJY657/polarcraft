import { describe, expect, it } from "vitest";

import { TIMELINE_EVENTS } from "@/data/timeline-events";

import {
  cameraZForProgress,
  eventIndexForProgress,
  FIRST_EVENT_Z,
  heroTransition,
  journeyProgress,
  interpolateSky,
  layoutTimelineEvents,
  markerOpacity,
  READING_DISTANCE,
  progressForEvent,
  scrollProgress,
  scrollTopForProgress,
  smoothProgress,
} from "./immersiveTimeline";

describe("immersive timeline helpers", () => {
  it("keeps the introduction at 600px and gives every event a 700px reading interval", () => {
    const count = layoutTimelineEvents().length;
    expect(scrollTopForProgress(progressForEvent(0, count), count)).toBe(600);
    for (let index = 0; index < count; index++) {
      const progress = progressForEvent(index, count);
      const scrollTop = scrollTopForProgress(progress, count);
      expect(scrollTop).toBeCloseTo(600 + index * 700);
      expect(journeyProgress(scrollTop, count)).toBeCloseTo(progress);
      expect(eventIndexForProgress(journeyProgress(scrollTop, count), count)).toBe(index);
    }
    expect(journeyProgress(-100, count)).toBe(0);
    expect(journeyProgress(100000, count)).toBe(1);
    expect(scrollTopForProgress(-1, count)).toBe(0);
    expect(scrollTopForProgress(2, count)).toBe(26500);
  });

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

  it("clamps scroll progress and stops at the final marker for reading", () => {
    expect(scrollProgress(-20, 2_000, 1_000)).toBe(0);
    expect(scrollProgress(500, 2_000, 1_000)).toBe(0.5);
    expect(scrollProgress(2_000, 2_000, 1_000)).toBe(1);

    const markers = layoutTimelineEvents();
    expect(cameraZForProgress(0, markers.length)).toBe(10);
    expect(cameraZForProgress(1, markers.length)).toBe(
      FIRST_EVENT_Z + READING_DISTANCE - (markers.length - 1) * 8,
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
    expect(markerOpacity(26, 0)).toBe(0);
    expect(markerOpacity(24, 0)).toBe(0.5);
    expect(markerOpacity(22, 0)).toBe(1);
    expect(markerOpacity(12, 0)).toBe(1);
    expect(markerOpacity(11, 0)).toBe(0.5);
    expect(markerOpacity(10, 0)).toBe(0);
    expect(markerOpacity(0, 0)).toBe(0);
  });

  it("positions all 38 events at full opacity, including both endpoints", () => {
    const markers = layoutTimelineEvents();
    markers.forEach((marker, index) => {
      const progress = progressForEvent(index, markers.length);
      expect(eventIndexForProgress(progress, markers.length)).toBe(index);
      expect(cameraZForProgress(progress, markers.length) - marker.z).toBeCloseTo(READING_DISTANCE);
      expect(markerOpacity(cameraZForProgress(progress, markers.length), marker.z, progress)).toBe(1);
    });
    expect(eventIndexForProgress(0, markers.length)).toBe(-1);
    expect(progressForEvent(-1, markers.length)).toBe(progressForEvent(0, markers.length));
    expect(progressForEvent(100, markers.length)).toBe(1);
  });

  it("uses elapsed time instead of refresh rate for easing and never overshoots", () => {
    const advance = (fps: number) => {
      let progress = 0;
      for (let frame = 0; frame < fps; frame++) progress = smoothProgress(progress, 1, 1000 / fps);
      return progress;
    };
    expect(advance(30)).toBeCloseTo(advance(60), 10);
    expect(advance(144)).toBeCloseTo(advance(60), 10);
    expect(smoothProgress(0, 1, 16)).toBeGreaterThan(0);
    expect(smoothProgress(0, 1, 16)).toBeLessThan(1);
    expect(smoothProgress(1, 0, 16)).toBeGreaterThan(0);
    expect(smoothProgress(1, 0, 16)).toBeLessThan(1);
    expect(smoothProgress(0.4, 1, 0)).toBe(0.4);
    expect(smoothProgress(0, 1, 1000 / 60)).toBeCloseTo(0.08);
    expect(smoothProgress(0.4, 1, -1)).toBe(0.4);
  });

  it("keeps a milestone fully readable through 875px of continuous scrolling", () => {
    const markers = layoutTimelineEvents();
    const index = 10;
    const stop = scrollTopForProgress(progressForEvent(index, markers.length), markers.length);
    for (let offset = -350; offset <= 525; offset += 25) {
      const progress = journeyProgress(stop + offset, markers.length);
      const cameraZ = cameraZForProgress(progress, markers.length);
      expect(markerOpacity(cameraZ, markers[index].z, progress)).toBeCloseTo(1);
    }
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
