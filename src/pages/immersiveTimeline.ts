import { TIMELINE_EVENTS, type TimelineEvent } from "@/data/timeline-events";

export const EVENT_SPACING = 8;
export const FIRST_EVENT_Z = -20;

export interface ImmersiveTimelineMarker {
  event: TimelineEvent;
  x: number;
  y: number;
  z: number;
}

export type SkyColor = readonly [number, number, number];

export interface SkyState {
  background: SkyColor;
  fog: SkyColor;
}

export interface HeroTransition {
  opacity: number;
  lift: number;
}

const SKY_STOPS: ReadonlyArray<{ progress: number; state: SkyState }> = [
  { progress: 0, state: { background: [0.31, 0.51, 0.67], fog: [0.67, 0.7, 0.67] } },
  { progress: 0.3, state: { background: [0.42, 0.25, 0.34], fog: [0.72, 0.4, 0.3] } },
  { progress: 0.58, state: { background: [0.025, 0.075, 0.14], fog: [0.06, 0.14, 0.2] } },
  { progress: 0.82, state: { background: [0.34, 0.3, 0.42], fog: [0.76, 0.49, 0.36] } },
  { progress: 1, state: { background: [0.31, 0.51, 0.67], fog: [0.67, 0.7, 0.67] } },
];

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export function layoutTimelineEvents(
  events: readonly TimelineEvent[] = TIMELINE_EVENTS,
): ImmersiveTimelineMarker[] {
  return events
    .filter((event) => !event.hidden)
    .map((event, sourceIndex) => ({ event, sourceIndex }))
    .sort((a, b) => a.event.year - b.event.year || a.sourceIndex - b.sourceIndex)
    .map(({ event }, index) => ({
      event,
      x: event.track === "optics" ? -4 : 4,
      y: 1.4 + Math.sin(index * 0.8) * 0.9,
      z: FIRST_EVENT_Z - index * EVENT_SPACING,
    }));
}

export function scrollProgress(
  scrollTop: number,
  scrollHeight: number,
  viewportHeight: number,
): number {
  const scrollableDistance = scrollHeight - viewportHeight;
  return scrollableDistance > 0 ? clamp01(scrollTop / scrollableDistance) : 0;
}

export function cameraZForProgress(progress: number, eventCount: number): number {
  const lastEventZ = FIRST_EVENT_Z - Math.max(0, eventCount - 1) * EVENT_SPACING;
  return 10 + (lastEventZ - 12 - 10) * clamp01(progress);
}

export function heroTransition(scrollY: number): HeroTransition {
  const scrollTop = Math.max(0, scrollY);
  return {
    opacity: scrollTop <= 100 ? 1 : clamp01(1 - (scrollTop - 100) / 500),
    lift: Math.min(scrollTop * 0.2, 100),
  };
}

export function markerOpacity(cameraZ: number, markerZ: number, journeyProgress = 1): number {
  const distanceAhead = cameraZ - markerZ;
  const sceneReveal = clamp01((journeyProgress - 0.06) / 0.06);

  if (distanceAhead <= 0 || distanceAhead >= 12) return 0;
  if (distanceAhead < 4) return (distanceAhead / 4) * sceneReveal;
  if (distanceAhead <= 6) return sceneReveal;
  return (1 - (distanceAhead - 6) / 6) * sceneReveal;
}

export function markerEdgeFade(projectedX: number, projectedY: number): number {
  const edge = Math.max(Math.abs(projectedX), Math.abs(projectedY));
  return clamp01((1 - edge) / 0.25);
}

const mixColor = (from: SkyColor, to: SkyColor, amount: number): SkyColor => [
  from[0] + (to[0] - from[0]) * amount,
  from[1] + (to[1] - from[1]) * amount,
  from[2] + (to[2] - from[2]) * amount,
];

export function interpolateSky(progress: number): SkyState {
  const value = clamp01(progress);
  const nextIndex = SKY_STOPS.findIndex((stop) => stop.progress >= value);

  if (nextIndex <= 0) return SKY_STOPS[0].state;

  const from = SKY_STOPS[nextIndex - 1];
  const to = SKY_STOPS[nextIndex];
  const amount = (value - from.progress) / (to.progress - from.progress);

  return {
    background: mixColor(from.state.background, to.state.background, amount),
    fog: mixColor(from.state.fog, to.state.fog, amount),
  };
}
