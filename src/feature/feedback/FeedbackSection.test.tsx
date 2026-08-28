// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthDialogStore } from "@/stores/authDialogStore";

import { FeedbackSection } from "./FeedbackSection";

const mockUseAuth = vi.hoisted(() => vi.fn());
const submitFeedback = vi.hoisted(() => vi.fn());
const createObjectURL = vi.hoisted(() => vi.fn(() => 'blob:feedback-preview'));
const revokeObjectURL = vi.hoisted(() => vi.fn());

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
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });
    createObjectURL.mockClear();
    revokeObjectURL.mockClear();
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

    fireEvent.change(screen.getByPlaceholderText("一句话概括"), {
      target: { value: "希望增加访客反馈入口" },
    });
    fireEvent.change(screen.getByPlaceholderText("详细描述..."), {
      target: { value: "希望访客也可以提交反馈，方便先体验再注册。" },
    });
    fireEvent.change(screen.getByPlaceholderText("如何称呼"), {
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
        imageFile: undefined,
      });
    });

    expect(await screen.findByText("反馈已提交，管理员可在后台反馈面板查看。")).toBeDefined();
    expect(useAuthDialogStore.getState().isOpen).toBe(false);
  });

  it("previews an optional image, submits it, and clears the preview after success", async () => {
    render(
      <MemoryRouter initialEntries={["/feedback"]}>
        <FeedbackSection />
      </MemoryRouter>
    );

    const imageFile = new File(["image bytes"], "experiment.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("选择图片"), {
      target: { files: [imageFile] },
    });

    expect(screen.getByAltText("待上传图片预览")).toBeDefined();
    expect(screen.getByText("experiment.png")).toBeDefined();

    fireEvent.change(screen.getByPlaceholderText("一句话概括"), {
      target: { value: "建议增加截图反馈" },
    });
    fireEvent.change(screen.getByPlaceholderText("详细描述..."), {
      target: { value: "这张截图可以帮助管理员快速定位页面显示问题。" },
    });
    fireEvent.click(screen.getByRole("button", { name: /提交反馈/ }));

    await waitFor(() =>
      expect(submitFeedback).toHaveBeenCalledWith(
        expect.objectContaining({ imageFile })
      )
    );
    await waitFor(() => expect(screen.queryByAltText("待上传图片预览")).toBeNull());
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:feedback-preview");
  });

  it("rejects invalid replacements and clears stale submission state", async () => {
    render(
      <MemoryRouter initialEntries={["/feedback"]}>
        <FeedbackSection />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText("一句话概括"), {
      target: { value: "先提交一条反馈" },
    });
    fireEvent.change(screen.getByPlaceholderText("详细描述..."), {
      target: { value: "这条反馈用于确认后续图片错误不会保留成功提示。" },
    });
    fireEvent.click(screen.getByRole("button", { name: /提交反馈/ }));
    expect(await screen.findByText("反馈已提交，管理员可在后台反馈面板查看。")).toBeDefined();

    const input = screen.getByLabelText("选择图片");
    const disguisedFile = new File(["not an image"], "payload.html", { type: "image/png" });
    fireEvent.change(input, {
      target: { files: [disguisedFile] },
    });
    expect(screen.queryByText("反馈已提交，管理员可在后台反馈面板查看。")).toBeNull();

    fireEvent.change(input, {
      target: { files: [new File(["image"], "kept.png", { type: "image/png" })] },
    });
    expect(screen.getByAltText("待上传图片预览")).toBeDefined();

    fireEvent.change(input, {
      target: { files: [disguisedFile] },
    });

    expect(screen.getByRole("alert").textContent).toContain("请选择 JPG、PNG 或 WebP 图片");
    expect(screen.queryByAltText("待上传图片预览")).toBeNull();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:feedback-preview");
  });
});
