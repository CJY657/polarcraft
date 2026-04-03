import { describe, expect, it } from "vitest";

import { getPreservedPageAfterResize } from "./pdfViewerState";

describe("getPreservedPageAfterResize", () => {
  it("preserves the current page during resize when the page is already valid", () => {
    expect(getPreservedPageAfterResize(2, 5)).toBe(2);
  });

  it("clamps to the last page instead of resetting to page 1", () => {
    expect(getPreservedPageAfterResize(9, 3)).toBe(3);
  });

  it("falls back to page 1 only when there are no pages yet", () => {
    expect(getPreservedPageAfterResize(2, 0)).toBe(1);
  });
});
