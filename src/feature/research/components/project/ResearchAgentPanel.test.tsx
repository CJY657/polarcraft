// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ResearchAgentPanel } from "./ResearchAgentPanel";

const mockGetProjectAgentMessages = vi.fn();
const mockSendProjectAgentMessage = vi.fn();
const mockClearProjectAgentMessages = vi.fn();

vi.mock("@/lib/research.service", () => ({
  researchApi: {
    getProjectAgentMessages: (...args: unknown[]) => mockGetProjectAgentMessages(...args),
    sendProjectAgentMessage: (...args: unknown[]) => mockSendProjectAgentMessage(...args),
    clearProjectAgentMessages: (...args: unknown[]) => mockClearProjectAgentMessages(...args),
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
  username: string;
  avatar_url: string | null;
}> = {}) {
  return {
    id: "message-1",
    project_id: "project-1",
    user_id: "user-1",
    role: "assistant" as const,
    content: "先明确变量。",
    model: "advisor-model",
    created_at: "2026-06-19T00:00:00.000Z",
    username: "成员",
    avatar_url: null,
    ...overrides,
  };
}

function openAdvisor() {
  fireEvent.click(screen.getByRole("button", { name: "打开 AI 研究顾问" }));
}

describe("ResearchAgentPanel", () => {
  beforeEach(() => {
    mockGetProjectAgentMessages.mockReset();
    mockSendProjectAgentMessage.mockReset();
    mockClearProjectAgentMessages.mockReset();
    mockClearProjectAgentMessages.mockResolvedValue({ deletedCount: 1 });
  });

  it("starts as a launcher-only widget", async () => {
    mockGetProjectAgentMessages.mockResolvedValue({ enabled: true, messages: [] });

    render(<ResearchAgentPanel projectId="project-1" />);

    expect(screen.getByRole("button", { name: "打开 AI 研究顾问" })).toBeTruthy();
    expect(screen.queryByLabelText("AI 顾问消息")).toBeNull();
    expect(screen.queryByText("还没有顾问消息。")).toBeNull();
    await waitFor(() => {
      expect(mockGetProjectAgentMessages).toHaveBeenCalledWith("project-1", 30);
    });
  });

  it("opens the advisor panel from the launcher", async () => {
    mockGetProjectAgentMessages.mockResolvedValue({ enabled: true, messages: [] });

    render(<ResearchAgentPanel projectId="project-1" />);

    openAdvisor();
    expect(await screen.findByText("还没有顾问消息。")).toBeTruthy();
    expect(screen.getByRole("button", { name: "收起 AI 研究顾问" })).toBeTruthy();
  });

  it("loads shared project history and renders assistant Markdown", async () => {
    mockGetProjectAgentMessages.mockResolvedValue({
      enabled: true,
      messages: [createMessage()],
    });

    render(<ResearchAgentPanel projectId="project-1" />);

    openAdvisor();
    expect(await screen.findByRole("heading", { name: "AI 研究顾问" })).toBeTruthy();
    expect((await screen.findByTestId("assistant-markdown")).textContent).toBe("先明确变量。");
    expect(mockGetProjectAgentMessages).toHaveBeenCalledWith("project-1", 30);
  });

  it("minimizes the advisor panel back to the launcher", async () => {
    mockGetProjectAgentMessages.mockResolvedValue({ enabled: true, messages: [] });

    render(<ResearchAgentPanel projectId="project-1" />);

    openAdvisor();
    expect(await screen.findByText("还没有顾问消息。")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "收起 AI 研究顾问" }));
    expect(screen.queryByText("还没有顾问消息。")).toBeNull();
    expect(screen.getByRole("button", { name: "打开 AI 研究顾问" })).toBeTruthy();
  });

  it("shows a loading state after opening while history loads", async () => {
    let resolveLoad: (value: unknown) => void = () => {};
    mockGetProjectAgentMessages.mockReturnValue(
      new Promise((resolve) => {
        resolveLoad = resolve;
      })
    );

    render(<ResearchAgentPanel projectId="project-1" />);

    openAdvisor();
    expect(screen.getByRole("status", { name: "载入顾问历史" })).toBeTruthy();
    resolveLoad({ enabled: true, messages: [] });
    expect(await screen.findByText("还没有顾问消息。")).toBeTruthy();
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

    openAdvisor();
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

  it("shows a thinking row while the assistant response is pending", async () => {
    let resolveSend: (value: unknown) => void = () => {};
    mockGetProjectAgentMessages.mockResolvedValue({ enabled: true, messages: [] });
    mockSendProjectAgentMessage.mockReturnValue(
      new Promise((resolve) => {
        resolveSend = resolve;
      })
    );

    render(<ResearchAgentPanel projectId="project-1" />);

    openAdvisor();
    await screen.findByText("还没有顾问消息。");
    fireEvent.change(screen.getByLabelText("AI 顾问消息"), {
      target: { value: "下一步做什么？" },
    });
    fireEvent.click(screen.getByRole("button", { name: "发送" }));

    expect(await screen.findByText("思考中...")).toBeTruthy();
    resolveSend({
      user: createMessage({
        id: "user-message",
        role: "user",
        content: "下一步做什么？",
        model: null,
        username: "小李",
      }),
      assistant: createMessage({
        id: "assistant-message",
        role: "assistant",
        content: "先收敛变量。",
      }),
    });
    expect(await screen.findByText("先收敛变量。")).toBeTruthy();
    await waitFor(() => {
      expect(screen.queryByText("思考中...")).toBeNull();
    });
  });

  it("renders the asking member username for user messages", async () => {
    mockGetProjectAgentMessages.mockResolvedValue({
      enabled: true,
      messages: [
        createMessage({
          id: "user-message",
          role: "user",
          content: "这个变量怎么控？",
          model: null,
          username: "小李",
        }),
      ],
    });

    render(<ResearchAgentPanel projectId="project-1" />);

    openAdvisor();
    expect(await screen.findByText("小李")).toBeTruthy();
    expect(screen.getByText("这个变量怎么控？")).toBeTruthy();
  });

  it("shows clear history only for managers and clears after confirmation", async () => {
    mockGetProjectAgentMessages.mockResolvedValue({
      enabled: true,
      messages: [
        createMessage({
          id: "user-message",
          role: "user",
          content: "旧问题",
          model: null,
        }),
      ],
    });

    const { rerender } = render(<ResearchAgentPanel projectId="project-1" />);

    openAdvisor();
    expect(await screen.findByText("旧问题")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "清空历史" })).toBeNull();

    rerender(<ResearchAgentPanel projectId="project-1" canClearHistory />);
    fireEvent.click(screen.getByRole("button", { name: "清空历史" }));
    fireEvent.click(screen.getByRole("button", { name: "清空" }));

    await waitFor(() => {
      expect(mockClearProjectAgentMessages).toHaveBeenCalledWith("project-1");
    });
    expect(await screen.findByText("还没有顾问消息。")).toBeTruthy();
  });

  it("shows a disabled state when backend AI config is missing", async () => {
    mockGetProjectAgentMessages.mockResolvedValue({ enabled: false, messages: [] });

    render(<ResearchAgentPanel projectId="project-1" />);

    openAdvisor();
    expect(await screen.findByText(/AI 顾问未配置/)).toBeTruthy();
    expect((screen.getByRole("button", { name: "发送" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("keeps the max message length validation", async () => {
    mockGetProjectAgentMessages.mockResolvedValue({ enabled: true, messages: [] });

    render(<ResearchAgentPanel projectId="project-1" />);

    openAdvisor();
    await screen.findByText("还没有顾问消息。");
    fireEvent.change(screen.getByLabelText("AI 顾问消息"), {
      target: { value: "x".repeat(2001) },
    });
    fireEvent.click(screen.getByRole("button", { name: "发送" }));

    expect(await screen.findByText("消息不能超过 2000 字")).toBeTruthy();
    expect(mockSendProjectAgentMessage).not.toHaveBeenCalled();
  });
});
