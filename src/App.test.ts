import { describe, expect, it } from "vitest";

import { shouldHideGlobalFooter, shouldRequireStudentAuth } from "./App";

describe("shouldHideGlobalFooter", () => {
  it("hides the footer on experiment detail pages", () => {
    expect(shouldHideGlobalFooter("/experiments/course1")).toBe(true);
  });

  it("keeps the footer on the experiments index", () => {
    expect(shouldHideGlobalFooter("/experiments")).toBe(false);
  });

  it("keeps the footer on unrelated pages", () => {
    expect(shouldHideGlobalFooter("/about")).toBe(false);
  });
});

describe("shouldRequireStudentAuth", () => {
  it("requires login for protected student routes", () => {
    expect(shouldRequireStudentAuth("/experiments")).toBe(true);
    expect(shouldRequireStudentAuth("/experiments/course1")).toBe(true);
    expect(shouldRequireStudentAuth("/units")).toBe(true);
    expect(shouldRequireStudentAuth("/units/unit1")).toBe(true);
    expect(shouldRequireStudentAuth("/feedback")).toBe(true);
    expect(shouldRequireStudentAuth("/profile")).toBe(true);
    expect(shouldRequireStudentAuth("/inbox")).toBe(true);
    expect(shouldRequireStudentAuth("/lab/explore")).toBe(true);
  });

  it("keeps public pages accessible without login", () => {
    expect(shouldRequireStudentAuth("/")).toBe(false);
    expect(shouldRequireStudentAuth("/about")).toBe(false);
    expect(shouldRequireStudentAuth("/gallery")).toBe(false);
    expect(shouldRequireStudentAuth("/demos")).toBe(false);
    expect(shouldRequireStudentAuth("/demos/em-wave")).toBe(false);
  });
});
