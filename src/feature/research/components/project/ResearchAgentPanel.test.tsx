// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ResearchAgentPanel } from "./ResearchAgentPanel";

const mockGetProjectAgentMessages = vi.fn();
const mockSendProjectAgentMessage = vi.fn();

vi.mock("@/lib/research.service", () => ({
  researchApi: {
    getProjectAgentMessages: (...args: unknown[]) => mockGetProjectAgentMessages(...args),
    sendProjectAgentMessage: (...args: unknown[]) => mockSendProjectAgentMessage(...args),
  },
}));

vi.mock("../shared/MarkdownRenderer", () => ({
  MarkdownRenderer: ({ content }: { content: string }) => <div data-testid="assistant-markdown">{content}</div>,
}));

function createMessage(overrides: Partial<{
  id: string;
  project_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  model: string | null;
  created_at: string;
}> = {}) {
  return {
    id: "message-1",
    project_id: "project-1",
    user_id: "user-1",
    role: "assistant" as const,
    content: "先明确变量。",
    model: "advisor-model",
    created_at: "2026-06-19T00:00:00.000Z",
    ...overrides,
  };
}

describe("ResearchAgentPanel", () => {
  beforeEach(() => {
    mockGetProjectAgentMessages.mockReset();
    mockSendProjectAgentMessage.mockReset();
  });

  it("loads shared project history and renders assistant Markdown", async () => {
    mockGetProjectAgentMessages.mockResolvedValue({
      enabled: true,
      messages: [createMessage()],
    });

    render(<ResearchAgentPanel projectId="project-1" />);

    expect(await screen.findByText("AI 研究顾问")).toBeTruthy();
    expect(screen.getByTestId("assistant-markdown").textContent).toBe("先明确变量。");
    expect(mockGetProjectAgentMessages).toHaveBeenCalledWith("project-1", 30);
  });

  it("appends user and assistant messages after a send succeeds", async () => {
    mockGetProjectAgentMessages.mockResolvedValue({ enabled: true, messages: [] });
    mockSendProjectAgentMessage.mockResolvedValue({
      user: createMessage({
        id: "user-message",
        role: "user",
        content: "下一步做什么？",
        model: null,
      }),
      assistant: createMessage({
        id: "assistant-message",
        role: "assistant",
        content: "先收敛变量。",
      }),
    });

    render(<ResearchAgentPanel projectId="project-1" />);

    await screen.findByText("还没有顾问消息。");
    fireEvent.change(screen.getByLabelText("AI 顾问消息"), {
      target: { value: "下一步做什么？" },
    });
    fireEvent.click(screen.getByRole("button", { name: "发送" }));

    await waitFor(() => {
      expect(mockSendProjectAgentMessage).toHaveBeenCalledWith("project-1", "下一步做什么？");
    });
    expect(await screen.findByText("下一步做什么？")).toBeTruthy();
    expect(screen.getByText("先收敛变量。")).toBeTruthy();
  });

  it("shows a disabled state when backend AI config is missing", async () => {
    mockGetProjectAgentMessages.mockResolvedValue({ enabled: false, messages: [] });

    render(<ResearchAgentPanel projectId="project-1" />);

    expect(await screen.findByText(/AI 顾问未配置/)).toBeTruthy();
    expect((screen.getByRole("button", { name: "发送" }) as HTMLButtonElement).disabled).toBe(true);
  });
});
