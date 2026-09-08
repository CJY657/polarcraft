// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TopicReferenceText, { splitTopicReferences } from "./TopicReferenceText";
import { readMentionQuery } from "./TopicReferenceTextarea";

const REFERENCES = [
  { number: 42, project_id: "project-42", name_zh: "偏振糖量计标定", name_en: null },
];

function renderText(text: string, references = REFERENCES) {
  return render(
    <MemoryRouter>
      <TopicReferenceText text={text} references={references} />
    </MemoryRouter>
  );
}

describe("splitTopicReferences", () => {
  it("splits references out of surrounding text without losing characters", () => {
    expect(splitTopicReferences("本课题延续 #42 的方法。")).toEqual([
      { type: "text", value: "本课题延续 " },
      { type: "reference", number: 42 },
      { type: "text", value: " 的方法。" },
    ]);
  });

  it("leaves headings and mid-word hashes alone", () => {
    for (const text of ["# 1 标题", "## 2", "issue#3", "#4abc"]) {
      expect(splitTopicReferences(text)).toEqual([{ type: "text", value: text }]);
    }
  });
});

describe("TopicReferenceText", () => {
  it("renders a resolved reference as a link carrying the current title", () => {
    renderText("延续 #42 的方法");

    const chip = screen.getByRole("link", { name: /偏振糖量计标定/ });
    expect(chip.getAttribute("href")).toBe("/lab/projects/project-42");
    expect(chip.textContent).toContain("#42");
  });

  it("keeps an unresolvable reference as literal text, revealing nothing", () => {
    const { container } = renderText("延续 #99 的方法", REFERENCES);

    expect(container.querySelector("a")).toBeNull();
    expect(container.textContent).toBe("延续 #99 的方法");
  });

  it("renders plain text unchanged when there are no references", () => {
    const { container } = render(
      <MemoryRouter>
        <TopicReferenceText text="延续 #42 的方法" references={[]} />
      </MemoryRouter>
    );

    expect(container.querySelector("a")).toBeNull();
    expect(container.textContent).toBe("延续 #42 的方法");
  });
});

describe("readMentionQuery", () => {
  it("opens on a fresh @ and tracks what follows it", () => {
    expect(readMentionQuery("看 @偏振", 5)).toEqual({ start: 2, query: "偏振" });
    expect(readMentionQuery("@", 1)).toEqual({ start: 0, query: "" });
  });

  it("never triggers inside an email address", () => {
    expect(readMentionQuery("teacher@school.edu", 18)).toBeNull();
    expect(readMentionQuery("a@b", 3)).toBeNull();
  });

  it("closes once the query runs past a space, newline or an inserted reference", () => {
    expect(readMentionQuery("@偏振 光", 5)).toBeNull();
    expect(readMentionQuery("@偏振\n", 4)).toBeNull();
    expect(readMentionQuery("@#42", 4)).toBeNull();
  });

  it("gives up on absurdly long queries rather than searching on every keystroke", () => {
    expect(readMentionQuery(`@${"字".repeat(41)}`, 42)).toBeNull();
  });

  it("returns null when the caret is before any @", () => {
    expect(readMentionQuery("没有引用", 4)).toBeNull();
  });
});
