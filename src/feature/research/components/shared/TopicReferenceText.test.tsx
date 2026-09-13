// @vitest-environment jsdom
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TopicReferenceText, { splitTopicReferences } from "./TopicReferenceText";
import TopicReferenceTextarea, { hydrateEditor, readMentionQuery, serializeEditor } from "./TopicReferenceTextarea";
import { researchApi } from "@/lib/research.service";

vi.mock("@/lib/research.service", () => ({
  researchApi: {
    searchTopicReferenceCandidates: vi.fn(),
  },
}));

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
    expect(chip.textContent).toBe("偏振糖量计标定");
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

describe("TopicReferenceTextarea", () => {
  const searchCandidates = vi.mocked(researchApi.searchTopicReferenceCandidates);

  beforeEach(() => {
    searchCandidates.mockReset();
  });

  function Harness({ initial = "", references }: { initial?: string; references?: typeof REFERENCES }) {
    const [value, setValue] = useState(initial);
    return (
      <>
        <TopicReferenceTextarea aria-label="议题引用" value={value} onValueChange={setValue} references={references} />
        <output data-testid="value">{value}</output>
      </>
    );
  }

  function typeInto(editor: HTMLElement, text: string) {
    editor.replaceChildren(document.createTextNode(text));
    const node = editor.firstChild as Text;
    const range = document.createRange();
    range.setStart(node, text.length);
    range.collapse(true);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
    fireEvent.input(editor);
  }

  it("serialises chips back to #N and hydrates #N into chips", () => {
    const root = document.createElement("div");
    hydrateEditor(root, "见 #42 和 #7\n下一行", REFERENCES);

    expect(root.querySelectorAll("[data-issue]")).toHaveLength(1);
    expect(root.querySelector("[data-issue='42']")?.textContent).toBe("偏振糖量计标定");
    expect(root.textContent).toContain("#7");
    expect(serializeEditor(root)).toBe("见 #42 和 #7\n下一行");
  });

  it("inserts a name chip when Enter is pressed before candidates finish loading", async () => {
    searchCandidates.mockResolvedValue([
      { id: "project-42", issue_number: 42, name_zh: "偏振糖量计标定", name_en: null },
    ]);
    render(<Harness />);
    const editor = screen.getByLabelText("议题引用");

    typeInto(editor, "@偏振");
    fireEvent.keyDown(editor, { key: "Enter" });

    await waitFor(() => expect(searchCandidates).toHaveBeenCalledWith({ query: "偏振", excludeProjectId: undefined }));
    await waitFor(() => expect(screen.getByTestId("value").textContent).toBe("#42 "));
    expect(editor.querySelector("[data-issue='42']")?.textContent).toBe("偏振糖量计标定");
    expect(editor.textContent).not.toContain("@");
  });

  it("hides candidates that have no issue number", async () => {
    searchCandidates.mockResolvedValue([
      { id: "legacy", issue_number: null, name_zh: "旧课题", name_en: null },
      { id: "project-42", issue_number: 42, name_zh: "偏振糖量计标定", name_en: null },
    ]);
    render(<Harness />);
    typeInto(screen.getByLabelText("议题引用"), "@");

    await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(1));
    expect(screen.queryByText("旧课题")).toBeNull();
  });

  it("removes a whole chip with one Backspace", () => {
    render(<Harness initial="#42 后文" references={REFERENCES} />);
    const editor = screen.getByLabelText("议题引用");
    const after = editor.querySelector("[data-issue]")!.nextSibling as Text;

    const range = document.createRange();
    range.setStart(after, 0);
    range.collapse(true);
    window.getSelection()!.removeAllRanges();
    window.getSelection()!.addRange(range);
    fireEvent.keyDown(editor, { key: "Backspace" });

    expect(editor.querySelector("[data-issue]")).toBeNull();
    expect(screen.getByTestId("value").textContent).toBe(" 后文");
  });
});
