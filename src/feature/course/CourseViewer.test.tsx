// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import type { CourseData } from "@/data/courses";

import { CourseViewer } from "./CourseViewer";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: { language: "zh-CN" },
    t: (key: string) => key,
  }),
}));

vi.mock("./PdfViewer", () => ({
  default: ({
    url,
    onHyperlinkClick,
  }: {
    url: string;
    onHyperlinkClick?: (targetMediaId: string) => void;
  }) => (
    <button data-testid={`mock-pdf-viewer:${url}`} onClick={() => onHyperlinkClick?.("image-1")}>
      mock-pdf-viewer
    </button>
  ),
}));

vi.mock("./ExperimentDiscussionSection", () => ({
  ExperimentDiscussionSection: () => <div data-testid="mock-discussion">mock-discussion</div>,
}));

vi.mock("./pptMedia", () => ({
  getPptPdfFallbackUrl: () => null,
  hasPdfSidecar: async () => false,
}));

vi.mock("pptx-preview", () => ({
  init: () => ({
    preview: async () => ({
      width: 1600,
      height: 900,
      slides: [{ nodes: [] }, { nodes: [] }],
    }),
    load: async () => ({
      width: 1600,
      height: 900,
      slides: [{ nodes: [] }, { nodes: [] }],
    }),
    renderSingleSlide: () => undefined,
    destroy: () => undefined,
  }),
}));

const courseFixture: CourseData = {
  id: "course-media",
  unitId: "unit-media",
  title: { "zh-CN": "媒体联动实验" },
  description: { "zh-CN": "测试课程" },
  color: "#0ea5e9",
  lastUpdated: "2026-04-03T00:00:00.000Z",
  mainSlide: {
    id: "main-slide",
    url: "/slides/main.pdf",
    title: { "zh-CN": "主课件" },
  },
  media: [
    {
      id: "ppt-1",
      type: "pptx",
      url: "/media/course-deck.pptx",
      title: { "zh-CN": "补充课件" },
    },
    {
      id: "video-1",
      type: "video",
      url: "/media/experiment-video.mp4",
      title: { "zh-CN": "实验视频" },
      duration: 90,
    },
    {
      id: "image-1",
      type: "image",
      url: "/media/experiment-image.jpg",
      title: { "zh-CN": "实验图片" },
    },
  ],
  hyperlinks: [],
};

beforeAll(() => {
  class MockResizeObserver {
    constructor(private readonly callback: ResizeObserverCallback) {}

    observe() {
      this.callback(
        [
          {
            contentRect: {
              width: 1280,
              height: 720,
            },
          } as ResizeObserverEntry,
        ],
        this as unknown as ResizeObserver
      );
    }

    disconnect() {
      return undefined;
    }

    unobserve() {
      return undefined;
    }
  }

  Object.defineProperty(globalThis, "ResizeObserver", {
    configurable: true,
    writable: true,
    value: MockResizeObserver,
  });

  Object.defineProperty(globalThis, "requestAnimationFrame", {
    configurable: true,
    writable: true,
    value: (callback: FrameRequestCallback) => window.setTimeout(() => callback(0), 0),
  });

  Object.defineProperty(document, "fullscreenElement", {
    configurable: true,
    writable: true,
    value: null,
  });

  Object.defineProperty(HTMLElement.prototype, "requestFullscreen", {
    configurable: true,
    writable: true,
    value: vi.fn(async function requestFullscreen(this: HTMLElement) {
      Object.defineProperty(document, "fullscreenElement", {
        configurable: true,
        writable: true,
        value: this,
      });
      document.dispatchEvent(new Event("fullscreenchange"));
    }),
  });

  Object.defineProperty(document, "exitFullscreen", {
    configurable: true,
    writable: true,
    value: vi.fn(async () => {
      Object.defineProperty(document, "fullscreenElement", {
        configurable: true,
        writable: true,
        value: null,
      });
      document.dispatchEvent(new Event("fullscreenchange"));
    }),
  });

  Object.defineProperty(HTMLMediaElement.prototype, "play", {
    configurable: true,
    writable: true,
    value: vi.fn().mockResolvedValue(undefined),
  });

  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    writable: true,
    value: vi.fn(),
  });
});

beforeEach(() => {
  vi.restoreAllMocks();
  global.fetch = vi.fn(async () => ({
    ok: true,
    status: 200,
    statusText: "OK",
    headers: new Headers({
      "content-type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    }),
    arrayBuffer: async () => new ArrayBuffer(8),
  })) as typeof fetch;
});

describe("CourseViewer media preview regressions", () => {
  it("lets the experiment resource and media areas flow on mobile while keeping desktop split scrolling", async () => {
    const { container } = render(
      <MemoryRouter>
        <CourseViewer course={courseFixture} theme="light" />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /实验视频/ })).toBeTruthy();
    });

    const resourceSidebar = container.querySelector("aside");
    const mediaContent = container.querySelector("main");
    const layoutShell = resourceSidebar?.parentElement;

    expect(layoutShell?.className).toContain("overflow-visible");
    expect(layoutShell?.className).toContain("lg:overflow-hidden");
    expect(layoutShell?.className).toContain("lg:h-[calc(100vh-64px)]");
    expect(resourceSidebar?.className).toContain("overflow-visible");
    expect(resourceSidebar?.className).toContain("lg:overflow-y-auto");
    expect(mediaContent?.className).toContain("overflow-visible");
    expect(mediaContent?.className).toContain("lg:overflow-y-auto");
  });

  it("renders images in the same main preview area used by video", async () => {
    render(
      <MemoryRouter>
        <CourseViewer course={courseFixture} theme="light" />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /实验视频/ })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: /实验图片/ }));

    await waitFor(() => {
      expect(screen.getByAltText("实验图片")).toBeTruthy();
    });

    expect(document.querySelector("video")).toBeNull();
    expect(screen.getByTitle("page.courses.fullscreen")).toBeTruthy();
  });

  it("uses optimized unit 2 video sources even when course URLs are encoded", async () => {
    const encodedUnit2VideoUrl = encodeURI(
      "/courses/unit2/实验-透明胶条-正交偏振系统-旋转样品视频.mp4"
    );
    const encodedVideoCourse: CourseData = {
      ...courseFixture,
      media: [
        courseFixture.media[0],
        {
          id: "unit2-video-encoded",
          type: "video",
          url: encodedUnit2VideoUrl,
          title: { "zh-CN": "编码视频" },
          duration: 21,
        },
      ],
    };

    const { container } = render(
      <MemoryRouter>
        <CourseViewer course={encodedVideoCourse} theme="light" />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(container.querySelector("video")).toBeTruthy();
    });

    expect(container.querySelector("video")?.getAttribute("src")).toBe(
      "/videos/chromatic-polarization/实验-透明胶条-正交偏振系统-旋转样品视频.mp4"
    );
  });

  it("does not move the deck page when selecting media from the resource list", async () => {
    const linkedCourse: CourseData = {
      ...courseFixture,
      hyperlinks: [
        {
          id: "ppt-image-link",
          sourceMediaId: "ppt-1",
          page: 2,
          x: 0.5,
          y: 0.5,
          width: 0.2,
          height: 0.2,
          targetMediaId: "image-1",
        },
      ],
    };

    render(
      <MemoryRouter>
        <CourseViewer course={linkedCourse} theme="light" />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("1 / 2")).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: /实验图片/ }));

    await waitFor(() => {
      expect(screen.getByAltText("实验图片")).toBeTruthy();
    });

    expect(screen.getByText("1 / 2")).toBeTruthy();
    expect(screen.queryByText("2 / 2")).toBeNull();
  });

  it("hides course resource download controls for non-admin viewers", async () => {
    render(
      <MemoryRouter>
        <CourseViewer course={courseFixture} theme="light" />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /实验视频/ })).toBeTruthy();
    });

    expect(screen.queryByTitle("page.courses.download")).toBeNull();
  });

  it("opens admin download endpoints instead of raw resource URLs for admins", async () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    render(
      <MemoryRouter>
        <CourseViewer course={courseFixture} theme="light" canDownloadResources />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByTitle("page.courses.download")).toHaveLength(2);
    });

    const [pptDownloadButton, previewDownloadButton] =
      screen.getAllByTitle("page.courses.download");

    fireEvent.click(pptDownloadButton);
    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining("/api/courses/media/ppt-1/download"),
      "_blank",
      "noopener,noreferrer"
    );

    fireEvent.click(previewDownloadButton);
    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining("/api/courses/media/video-1/download"),
      "_blank",
      "noopener,noreferrer"
    );
  });

  it("restores video playback position after switching to an image and back", async () => {
    const { container } = render(
      <MemoryRouter>
        <CourseViewer course={courseFixture} theme="light" />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(container.querySelector("video")).toBeTruthy();
    });

    const firstVideo = container.querySelector("video") as HTMLVideoElement;
    Object.defineProperty(firstVideo, "duration", {
      configurable: true,
      writable: true,
      value: 120,
    });
    Object.defineProperty(firstVideo, "currentTime", {
      configurable: true,
      writable: true,
      value: 18,
    });
    fireEvent.timeUpdate(firstVideo);

    fireEvent.click(screen.getByRole("button", { name: /实验图片/ }));
    await waitFor(() => {
      expect(screen.getByAltText("实验图片")).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: /实验视频/ }));

    await waitFor(
      () => {
        expect(screen.getByTitle("page.courses.fullscreen")).toBeTruthy();
        expect(container.querySelector("video")).toBeTruthy();
      },
      { timeout: 10000 }
    );

    const restoredVideo = container.querySelector("video") as HTMLVideoElement;
    Object.defineProperty(restoredVideo, "duration", {
      configurable: true,
      writable: true,
      value: 120,
    });

    fireEvent.loadedMetadata(restoredVideo);

    expect(restoredVideo.currentTime).toBeCloseTo(18, 1);
  }, 15000);

  it("keeps the same video element and playback position across page-button fullscreen toggles", async () => {
    const { container } = render(
      <MemoryRouter>
        <CourseViewer course={courseFixture} theme="light" />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(container.querySelector("video")).toBeTruthy();
    });

    const initialVideo = container.querySelector("video") as HTMLVideoElement;
    Object.defineProperty(initialVideo, "currentTime", {
      configurable: true,
      writable: true,
      value: 24,
    });
    fireEvent.timeUpdate(initialVideo);

    fireEvent.click(screen.getByTitle("page.courses.fullscreen"));

    await waitFor(() => {
      expect(screen.getByTitle("page.courses.exitfullscreen")).toBeTruthy();
    });

    const fullscreenVideo = container.querySelector("video") as HTMLVideoElement;
    expect(fullscreenVideo).toBe(initialVideo);
    expect(fullscreenVideo.currentTime).toBe(24);

    fireEvent.click(screen.getByTitle("page.courses.exitfullscreen"));

    await waitFor(() => {
      expect(screen.getByTitle("page.courses.fullscreen")).toBeTruthy();
    });

    const restoredVideo = container.querySelector("video") as HTMLVideoElement;
    expect(restoredVideo).toBe(initialVideo);
    expect(restoredVideo.currentTime).toBe(24);
  });
});
