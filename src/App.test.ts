import { describe, expect, it } from "vitest";

import {
  shouldHideGlobalFooter,
  shouldResetScrollOnNavigation,
} from "./App";

describe("shouldHideGlobalFooter", () => {
  it("hides the footer on experiment detail pages", () => {
    expect(shouldHideGlobalFooter("/experiments/course1")).toBe(true);
  });

  it("hides the footer on application detail pages", () => {
    expect(shouldHideGlobalFooter("/applications/course1")).toBe(true);
  });

  it("hides the footer on the applications workspace index", () => {
    expect(shouldHideGlobalFooter("/applications")).toBe(true);
  });

  it("hides the footer on the experiments workspace index", () => {
    expect(shouldHideGlobalFooter("/experiments")).toBe(true);
  });

  it("keeps the footer on unrelated pages", () => {
    expect(shouldHideGlobalFooter("/about")).toBe(false);
  });

  it("hides the footer only on the immersive timeline entrance", () => {
    expect(shouldHideGlobalFooter("/chronicles")).toBe(true);
    expect(shouldHideGlobalFooter("/chronicles/explore")).toBe(false);
  });

  it.each(["optics-book", "em-wave", "polarization-types", "brewster-angle", "birefringence-iceland-spar"])(
    "hides the footer on the %s book route and its legacy query link",
    (id) => {
      expect(shouldHideGlobalFooter(`/demos/${id}`)).toBe(true);
      expect(shouldHideGlobalFooter("/demos", `?demo=${id}`)).toBe(true);
    },
  );

  it("keeps the footer on the gallery, unknown demos, and polarization-state experiments", () => {
    expect(shouldHideGlobalFooter("/demos")).toBe(false);
    expect(shouldHideGlobalFooter("/demos/unknown")).toBe(false);
    expect(shouldHideGlobalFooter("/demos/color-state", "?demo=em-wave")).toBe(false);
    expect(shouldHideGlobalFooter("/demos/visuphy-polarization")).toBe(false);
    expect(shouldHideGlobalFooter("/about", "?demo=em-wave")).toBe(false);
  });
});

describe("shouldResetScrollOnNavigation", () => {
  it("keeps hash destinations in control of cross-page scrolling", () => {
    expect(shouldResetScrollOnNavigation("PUSH", "#discussion-comment-comment-1")).toBe(false);
  });

  it("still resets ordinary forward navigation and preserves browser history scroll", () => {
    expect(shouldResetScrollOnNavigation("PUSH", "")).toBe(true);
    expect(shouldResetScrollOnNavigation("POP", "")).toBe(false);
  });
});
