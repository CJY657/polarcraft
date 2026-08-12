import { describe, expect, it } from "vitest";

import {
  shouldHideGlobalFooter,
  shouldRequireStudentAuth,
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
});

describe("shouldRequireStudentAuth", () => {
  it("requires login for protected student routes", () => {
    expect(shouldRequireStudentAuth("/experiments")).toBe(true);
    expect(shouldRequireStudentAuth("/experiments/course1")).toBe(true);
    expect(shouldRequireStudentAuth("/applications")).toBe(true);
    expect(shouldRequireStudentAuth("/applications/course1")).toBe(true);
    expect(shouldRequireStudentAuth("/units")).toBe(true);
    expect(shouldRequireStudentAuth("/units/unit1")).toBe(true);
    expect(shouldRequireStudentAuth("/profile")).toBe(true);
    expect(shouldRequireStudentAuth("/inbox")).toBe(true);
    expect(shouldRequireStudentAuth("/pulse")).toBe(true);
    expect(shouldRequireStudentAuth("/lab")).toBe(true);
    expect(shouldRequireStudentAuth("/lab/projects")).toBe(true);
    expect(shouldRequireStudentAuth("/lab/projects/project-1/settings")).toBe(true);
  });

  it("keeps public pages accessible without login", () => {
    expect(shouldRequireStudentAuth("/")).toBe(false);
    expect(shouldRequireStudentAuth("/about")).toBe(false);
    expect(shouldRequireStudentAuth("/gallery")).toBe(false);
    expect(shouldRequireStudentAuth("/demos")).toBe(false);
    expect(shouldRequireStudentAuth("/demos/em-wave")).toBe(false);
    expect(shouldRequireStudentAuth("/feedback")).toBe(false);
    expect(shouldRequireStudentAuth("/lab/explore")).toBe(false);
    expect(shouldRequireStudentAuth("/lab/projects/project-1")).toBe(false);
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
