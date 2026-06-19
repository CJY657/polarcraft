// @vitest-environment jsdom

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MarkdownRenderer } from "./MarkdownRenderer";

describe("MarkdownRenderer", () => {
  it("renders inline and display math with KaTeX", () => {
    const { container } = render(
      <MarkdownRenderer content={"内联 $E=mc^2$，块级：\n\n$$\\int_0^1 x\\,dx$$\n\n以及 \\(a^2+b^2=c^2\\)。"} />
    );

    expect(container.querySelectorAll(".katex").length).toBeGreaterThanOrEqual(3);
    expect(container.querySelector(".katex-display")).toBeTruthy();
  });

  it("keeps math-looking text inside code as code", () => {
    const { container } = render(<MarkdownRenderer content={"`$E=mc^2$`"} />);

    expect(container.querySelector(".katex")).toBeNull();
    expect(container.querySelector("code")?.textContent).toBe("$E=mc^2$");
  });
});
