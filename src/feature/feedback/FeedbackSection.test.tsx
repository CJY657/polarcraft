// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthDialogStore } from "@/stores/authDialogStore";

import { FeedbackSection } from "./FeedbackSection";

const mockUseAuth = vi.hoisted(() => vi.fn());
const submitFeedback = vi.hoisted(() => vi.fn());

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/lib/feedback.service", () => ({
  feedbackApi: {
    submit: submitFeedback,
  },
}));

describe("FeedbackSection", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    submitFeedback.mockReset();
    submitFeedback.mockResolvedValue({ id: "feedback-1" });
    useAuthDialogStore.setState({
      isOpen: false,
      mode: "login",
      returnTo: null,
    });
  });

  it("lets anonymous visitors submit feedback without opening the login dialog", async () => {
    render(
      <MemoryRouter initialEntries={["/feedback"]}>
        <FeedbackSection />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText("例如：希望增加实验反馈入口"), {
      target: { value: "希望增加访客反馈入口" },
    });
    fireEvent.change(
      screen.getByPlaceholderText("请描述你对导航、交互、功能、性能或整体流程的改进建议。"),
      {
        target: { value: "希望访客也可以提交反馈，方便先体验再注册。" },
      }
    );
    fireEvent.change(screen.getByPlaceholderText("你的名字或称呼"), {
      target: { value: "Guest" },
    });
    fireEvent.change(screen.getByPlaceholderText("name@example.com"), {
      target: { value: "guest@example.com" },
    });

    fireEvent.click(screen.getByRole("button", { name: /提交反馈/ }));

    await waitFor(() => {
      expect(submitFeedback).toHaveBeenCalledWith({
        category: "product",
        subject: "希望增加访客反馈入口",
        content: "希望访客也可以提交反馈，方便先体验再注册。",
        courseId: undefined,
        courseTitle: undefined,
        sourcePage: "feedback-page",
        pagePath: "/feedback",
        contactName: "Guest",
        contactEmail: "guest@example.com",
      });
    });

    expect(await screen.findByText("反馈已提交，管理员可在后台反馈面板查看。")).toBeDefined();
    expect(useAuthDialogStore.getState().isOpen).toBe(false);
  });
});
