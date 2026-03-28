import { describe, expect, it } from "vitest";

import { shouldHideGlobalFooter } from "./App";

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
