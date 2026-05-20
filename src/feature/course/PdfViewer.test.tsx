// @vitest-environment jsdom

import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import PdfViewer from "./PdfViewer";

const pdfMockState = vi.hoisted(() => ({
  onDocumentLoadSuccess: null as null | ((document: { numPages: number }) => void),
}));

vi.mock("pdfjs-dist/build/pdf.worker.min.mjs?url", () => ({
  default: "mock-pdf-worker",
}));

vi.mock("react-pdf", async () => {
  return {
    pdfjs: {
      GlobalWorkerOptions: {},
      Util: {
        transform: vi.fn(),
      },
    },
    Document: ({
      children,
      onLoadSuccess,
    }: {
      children: React.ReactNode;
      onLoadSuccess?: (document: { numPages: number }) => void;
    }) => {
      pdfMockState.onDocumentLoadSuccess = onLoadSuccess ?? null;

      return <div data-testid="mock-pdf-document">{children}</div>;
    },
    Page: ({
      pageNumber,
    }: {
      pageNumber: number;
    }) => {
      return <div data-testid={`mock-pdf-page-${pageNumber}`}>page {pageNumber}</div>;
    },
  };
});

beforeAll(() => {
  class MockResizeObserver {
    constructor(private readonly callback: ResizeObserverCallback) {}

    observe(target: Element) {
      this.callback(
        [
          {
            target,
            contentRect: {
              width: 390,
              height: 240,
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

  Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", {
    configurable: true,
    value: () => ({
      width: 390,
      height: 240,
      top: 0,
      right: 390,
      bottom: 240,
      left: 0,
      x: 0,
      y: 0,
      toJSON: () => undefined,
    }),
  });
});

beforeEach(() => {
  pdfMockState.onDocumentLoadSuccess = null;
  Object.defineProperty(window, "innerWidth", { configurable: true, value: 1024 });
  Object.defineProperty(window, "innerHeight", { configurable: true, value: 768 });
});

const loadMockPdfDocument = async () => {
  await act(async () => {
    pdfMockState.onDocumentLoadSuccess?.({ numPages: 3 });
  });
};

describe("PdfViewer presentation mode", () => {
  it("keeps ordinary portrait PDFs in scroll mode", async () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 844 });

    const { container } = render(
      <PdfViewer
        url="/slides/ordinary.pdf"
        theme="light"
      />
    );

    await loadMockPdfDocument();

    await waitFor(() => {
      expect(container.querySelectorAll(".pdf-page-wrapper")).toHaveLength(3);
    });

    const pageWrappers = Array.from(
      container.querySelectorAll<HTMLElement>(".pdf-page-wrapper")
    );

    expect(pageWrappers.every((pageWrapper) => pageWrapper.style.display === "")).toBe(true);
  });

  it("shows one slide at a time and advances on slide click in presentation mode", async () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 844 });

    const { container } = render(
      <PdfViewer
        url="/slides/deck-preview.pdf"
        theme="light"
        presentationMode
      />
    );

    await loadMockPdfDocument();

    await waitFor(() => {
      expect(container.querySelectorAll(".pdf-page-wrapper")).toHaveLength(3);
    });

    const pageWrappers = Array.from(
      container.querySelectorAll<HTMLElement>(".pdf-page-wrapper")
    );

    expect(pageWrappers[0].style.display).toBe("flex");
    expect(pageWrappers[1].style.display).toBe("none");
    expect(pageWrappers[2].style.display).toBe("none");

    fireEvent.click(pageWrappers[0]);

    await waitFor(() => {
      expect(pageWrappers[0].style.display).toBe("none");
      expect(pageWrappers[1].style.display).toBe("flex");
      expect(pageWrappers[2].style.display).toBe("none");
    });
  });

  it("does not advance presentation slides on desktop plain clicks", async () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1024 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 768 });

    const { container } = render(
      <PdfViewer
        url="/slides/deck-preview.pdf"
        theme="light"
        presentationMode
      />
    );

    await loadMockPdfDocument();

    await waitFor(() => {
      expect(container.querySelectorAll(".pdf-page-wrapper")).toHaveLength(3);
    });

    const pageWrappers = Array.from(
      container.querySelectorAll<HTMLElement>(".pdf-page-wrapper")
    );

    fireEvent.click(pageWrappers[0]);

    expect(pageWrappers[0].style.display).toBe("flex");
    expect(pageWrappers[1].style.display).toBe("none");
  });

  it("advances presentation slides on phone landscape plain clicks", async () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 844 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 390 });

    const { container } = render(
      <PdfViewer
        url="/slides/deck-preview.pdf"
        theme="light"
        presentationMode
      />
    );

    await loadMockPdfDocument();

    await waitFor(() => {
      expect(container.querySelectorAll(".pdf-page-wrapper")).toHaveLength(3);
    });

    const pageWrappers = Array.from(
      container.querySelectorAll<HTMLElement>(".pdf-page-wrapper")
    );

    fireEvent.click(pageWrappers[0]);

    await waitFor(() => {
      expect(pageWrappers[0].style.display).toBe("none");
      expect(pageWrappers[1].style.display).toBe("flex");
    });
  });

  it("does not double-advance when a mobile swipe is followed by a click", async () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 844 });

    const { container } = render(
      <PdfViewer
        url="/slides/deck-preview.pdf"
        theme="light"
        presentationMode
      />
    );

    await loadMockPdfDocument();

    await waitFor(() => {
      expect(container.querySelectorAll(".pdf-page-wrapper")).toHaveLength(3);
    });

    const pageWrappers = Array.from(
      container.querySelectorAll<HTMLElement>(".pdf-page-wrapper")
    );

    fireEvent.touchStart(pageWrappers[0], {
      touches: [{ clientX: 240 }],
    });
    fireEvent.touchEnd(pageWrappers[0], {
      changedTouches: [{ clientX: 120 }],
    });
    fireEvent.click(pageWrappers[0]);

    await waitFor(() => {
      expect(pageWrappers[0].style.display).toBe("none");
      expect(pageWrappers[1].style.display).toBe("flex");
      expect(pageWrappers[2].style.display).toBe("none");
    });
  });
});
