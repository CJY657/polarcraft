/**
 * CourseViewer - 课程内容查看器
 *
 * 支持显示 PPTX、图片、视频等多种媒体类型
 */

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Image as ImageIcon,
  FileText,
  Download,
  Maximize2,
  Minimize2,
  Clock,
  Loader2,
} from "lucide-react";
import type { CourseData, MediaResource, MediaType, PdfHyperlink } from "@/data/courses";
import {
  buildMediaReferenceMap,
  extractReferenceKeysFromText,
  normalizeMediaReferenceText,
} from "./mediaReference";

// PPTX Previewer component using pptx-preview
import { init } from "pptx-preview";
import PdfViewer from "./PdfViewer";

interface CourseViewerProps {
  course: CourseData;
  onBack: () => void;
  theme: "dark" | "light";
}

// 媒体类型图标映射
const MEDIA_TYPE_ICONS: Record<MediaType, React.ReactNode> = {
  pptx: <FileText className="h-5 w-5" />,
  image: <ImageIcon className="h-5 w-5" />,
  video: <Play className="h-5 w-5" />,
};

// 媒体类型颜色
const MEDIA_TYPE_COLORS: Record<MediaType, string> = {
  pptx: "#F59E0B",
  image: "#8B5CF6",
  video: "#EF4444",
};

// PPTX Previewer instance type
interface PptxPreviewerInstance {
  preview: (data: ArrayBuffer) => Promise<unknown>;
  load?: (data: ArrayBuffer) => Promise<unknown>;
  renderSingleSlide?: (pageIndex: number) => void;
  destroy?: () => void;
}

interface PptxSlide {
  nodes?: unknown[];
}

interface PptxDocument {
  width?: number;
  height?: number;
  slides?: PptxSlide[];
}

type PptRenderMode = "checking" | "pdf" | "pptx";

const DEFAULT_PPT_ASPECT_RATIO = 16 / 9;
function fitPresentationSize(width: number, height: number, aspectRatio: number) {
  if (width <= 0 || height <= 0) {
    return { width: 0, height: 0 };
  }

  const fittedWidth = Math.min(width, height * aspectRatio);
  const fittedHeight = fittedWidth / aspectRatio;

  return {
    width: Math.max(0, Math.floor(fittedWidth)),
    height: Math.max(0, Math.floor(fittedHeight)),
  };
}

function getPptPdfFallbackUrl(url: string) {
  if (!/\.(pptx?|ppt)(?=(?:[?#].*)?$)/i.test(url)) {
    return null;
  }

  return url.replace(/\.(pptx?|ppt)(?=(?:[?#].*)?$)/i, ".pdf");
}

async function hasPdfSidecar(url: string) {
  const classifyPdfResponse = (response: Response) => {
    const contentType = response.headers.get("content-type")?.toLowerCase() || "";

    if (contentType.includes("application/pdf")) {
      return true;
    }

    if (contentType.startsWith("text/html")) {
      return false;
    }

    if (contentType.startsWith("text/")) {
      return false;
    }

    return null;
  };

  const hasPdfSignature = async (response: Response) => {
    try {
      const buffer = await response.arrayBuffer();
      const signature = new Uint8Array(buffer.slice(0, 5));
      return String.fromCharCode(...signature) === "%PDF-";
    } catch {
      return false;
    }
  };

  try {
    const headResponse = await fetch(url, { method: "HEAD" });
    const headClassification = classifyPdfResponse(headResponse);

    if (headResponse.ok && headClassification === true) {
      return true;
    }

    if (headResponse.ok && headClassification === false) {
      return false;
    }

    if (headResponse.status !== 405 && headResponse.status !== 501) {
      return false;
    }
  } catch {
    // Some hosts block HEAD; retry with GET below.
  }

  try {
    const getResponse = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        Range: "bytes=0-4",
      },
    });

    if (!getResponse.ok) {
      return false;
    }

    const getClassification = classifyPdfResponse(getResponse);
    if (getClassification !== null) {
      return getClassification;
    }

    return hasPdfSignature(getResponse);
  } catch {
    return false;
  }
}

function collectReferenceKeysFromPptNode(
  node: unknown,
  referenceKeys: Set<string>,
  visited: WeakSet<object>
) {
  if (typeof node === "string") {
    extractReferenceKeysFromText(node).forEach((referenceKey) => {
      referenceKeys.add(referenceKey);
    });
    return;
  }

  if (!node || typeof node !== "object") {
    return;
  }

  if (visited.has(node)) {
    return;
  }

  visited.add(node);

  if (Array.isArray(node)) {
    node.forEach((item) => collectReferenceKeysFromPptNode(item, referenceKeys, visited));
    return;
  }

  const record = node as Record<string, unknown>;

  collectReferenceKeysFromPptNode(record.text, referenceKeys, visited);
  collectReferenceKeysFromPptNode(record.textBody, referenceKeys, visited);
  collectReferenceKeysFromPptNode(record.paragraphs, referenceKeys, visited);
  collectReferenceKeysFromPptNode(record.rows, referenceKeys, visited);
  collectReferenceKeysFromPptNode(record.nodes, referenceKeys, visited);
  collectReferenceKeysFromPptNode(record.children, referenceKeys, visited);
}

function buildPptReferencePageMap(
  documentInfo: PptxDocument,
  mediaList: MediaResource[]
) {
  const referenceMap = buildMediaReferenceMap(mediaList);
  if (Object.keys(referenceMap).length === 0) {
    return {};
  }

  const pageMap: Record<string, number> = {};

  documentInfo.slides?.forEach((slide, slideIndex) => {
    const foundReferenceKeys = new Set<string>();
    collectReferenceKeysFromPptNode(slide.nodes ?? slide, foundReferenceKeys, new WeakSet<object>());

    foundReferenceKeys.forEach((referenceKey) => {
      const targetMediaId = referenceMap[referenceKey];
      if (targetMediaId && pageMap[targetMediaId] == null) {
        pageMap[targetMediaId] = slideIndex + 1;
      }
    });
  });

  return pageMap;
}

async function detectPptReferencePageMap(
  arrayBuffer: ArrayBuffer,
  mediaList: MediaResource[]
) {
  if (mediaList.length === 0) {
    return {};
  }

  const scratchHost = document.createElement("div");
  const scratchPreviewer = init(scratchHost, {
    width: 1,
    height: 1,
    mode: "slide",
  }) as PptxPreviewerInstance;

  try {
    const documentInfo = (await scratchPreviewer.load?.(arrayBuffer)) as PptxDocument | undefined;
    if (!documentInfo) {
      return {};
    }

    return buildPptReferencePageMap(documentInfo, mediaList);
  } finally {
    scratchPreviewer.destroy?.();
    scratchHost.remove();
  }
}

// PPTX Viewer Component
interface PptxViewerProps {
  url: string;
  theme: "dark" | "light";
  hyperlinks?: PdfHyperlink[];
  onHyperlinkClick?: (targetMediaId: string) => void;
  getHyperlinkTitle?: (targetMediaId: string) => string;
  mediaList?: MediaResource[];
  linkedMediaId?: string | null;
  linkedMediaNonce?: number;
  activeMediaId?: string | null;
}

function PptxViewer({
  url,
  theme,
  hyperlinks = [],
  onHyperlinkClick,
  getHyperlinkTitle,
  mediaList = [],
  linkedMediaId = null,
  linkedMediaNonce = 0,
  activeMediaId = null,
}: PptxViewerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previewerRef = useRef<PptxPreviewerInstance | null>(null);
  const renderVersionRef = useRef(0);
  const renderPresentationRef = useRef<(arrayBuffer: ArrayBuffer, preferredPage?: number) => Promise<void>>(
    async () => {}
  );
  const currentPageRef = useRef(1);
  const onHyperlinkClickRef = useRef(onHyperlinkClick);
  const getHyperlinkTitleRef = useRef(getHyperlinkTitle);
  const mediaReferenceMapRef = useRef<Record<string, string>>({});
  const [aspectRatio, setAspectRatio] = useState(DEFAULT_PPT_ASPECT_RATIO);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [renderMode, setRenderMode] = useState<PptRenderMode>("checking");
  const [pdfFallbackUrl, setPdfFallbackUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [detectedPageMap, setDetectedPageMap] = useState<Record<string, number>>({});
  const currentPageHyperlinks = hyperlinks.filter((hyperlink) => hyperlink.page === currentPage);
  const mediaReferenceSignature = mediaList
    .map((media) => `${media.id}:${media.url}:${media.title["zh-CN"] || ""}:${media.title["en-US"] || ""}`)
    .join("|");

  const cachedDataRef = useRef<ArrayBuffer | null>(null);
  mediaReferenceMapRef.current = buildMediaReferenceMap(mediaList);
  currentPageRef.current = currentPage;

  const getLinkedMediaPage = (targetMediaId: string) => {
    const configuredHyperlink = hyperlinks.find((hyperlink) => hyperlink.targetMediaId === targetMediaId);
    if (configuredHyperlink) {
      return configuredHyperlink.page;
    }

    return detectedPageMap[targetMediaId] ?? null;
  };

  useEffect(() => {
    onHyperlinkClickRef.current = onHyperlinkClick;
    getHyperlinkTitleRef.current = getHyperlinkTitle;
  }, [onHyperlinkClick, getHyperlinkTitle]);

  useEffect(() => {
    let isCancelled = false;
    const nextPdfFallbackUrl = getPptPdfFallbackUrl(url);

    cachedDataRef.current = null;
    renderVersionRef.current += 1;
    setAspectRatio(DEFAULT_PPT_ASPECT_RATIO);
    setStageSize({ width: 0, height: 0 });
    setCurrentPage(1);
    setTotalPages(0);
    setDetectedPageMap({});
    setError(null);
    setIsLoading(true);
    setPdfFallbackUrl(nextPdfFallbackUrl);
    setRenderMode("checking");

    const detectRenderMode = async () => {
      if (!nextPdfFallbackUrl) {
        if (!isCancelled) {
          setRenderMode("pptx");
        }
        return;
      }

      const hasPdfFallback = await hasPdfSidecar(nextPdfFallbackUrl);
      if (!isCancelled && hasPdfFallback) {
        setRenderMode("pdf");
        setIsLoading(false);
        return;
      }

      if (!isCancelled) {
        setRenderMode("pptx");
      }
    };

    void detectRenderMode();

    return () => {
      isCancelled = true;
    };
  }, [mediaReferenceSignature, url]);

  useEffect(() => {
    if (renderMode === "pptx") {
      return;
    }

    previewerRef.current?.destroy?.();
    previewerRef.current = null;

    if (containerRef.current) {
      containerRef.current.innerHTML = "";
    }
  }, [renderMode]);

  useEffect(() => {
    if (renderMode !== "pptx" || !containerRef.current) {
      return;
    }

    const container = containerRef.current;
    const handleNativeLinkClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest("a");
      if (!anchor || !container.contains(anchor)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const normalizedText = normalizeMediaReferenceText(anchor.textContent || "");
      const [referenceKey] = extractReferenceKeysFromText(normalizedText);
      const targetMediaId = referenceKey ? mediaReferenceMapRef.current[referenceKey] : null;

      if (targetMediaId) {
        onHyperlinkClickRef.current?.(targetMediaId);
      }
    };

    container.addEventListener("click", handleNativeLinkClick, true);

    return () => {
      container.removeEventListener("click", handleNativeLinkClick, true);
    };
  }, [mediaReferenceSignature, renderMode]);

  const decorateRenderedSlide = () => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const previewWrapper = container.querySelector<HTMLElement>(".pptx-preview-wrapper");
    if (previewWrapper) {
      previewWrapper.style.width = "100%";
      previewWrapper.style.height = "100%";
      previewWrapper.style.margin = "0";
      previewWrapper.style.background = "transparent";
      previewWrapper.style.overflow = "hidden";
    }

    container
      .querySelectorAll<HTMLElement>(".pptx-preview-wrapper-next, .pptx-preview-wrapper-pagination")
      .forEach((element) => {
        element.style.display = "none";
      });

    container.querySelectorAll<HTMLElement>(".pptx-preview-slide-wrapper").forEach((slideWrapper) => {
      slideWrapper.style.margin = "0 auto";
      slideWrapper.style.background = "transparent";
      slideWrapper.style.overflow = "hidden";
      slideWrapper.style.borderRadius = "22px";
      slideWrapper.style.boxShadow = "0 28px 80px rgba(15, 23, 42, 0.18)";
    });

    container.querySelectorAll<HTMLElement>(".pptx-preview-slide-wrapper p").forEach((paragraph) => {
      const normalizedText = (paragraph.textContent || "").replace(/\s+/g, "");
      const [referenceKey] = extractReferenceKeysFromText(normalizedText);
      const targetMediaId = referenceKey ? mediaReferenceMapRef.current[referenceKey] : null;

      if (!targetMediaId) {
        paragraph.classList.remove("pptx-linked-paragraph");
        paragraph.classList.remove("pptx-linked-paragraph-active");
        paragraph.onclick = null;
        paragraph.onkeydown = null;
        paragraph.removeAttribute("role");
        paragraph.removeAttribute("tabindex");
        paragraph.removeAttribute("title");
        paragraph.removeAttribute("data-target-media-id");
        return;
      }

      paragraph.classList.add("pptx-linked-paragraph");
      paragraph.classList.remove("pptx-linked-paragraph-active");
      paragraph.dataset.targetMediaId = targetMediaId;
      paragraph.setAttribute("role", "button");
      paragraph.setAttribute("tabindex", "0");
      paragraph.setAttribute(
        "title",
        getHyperlinkTitleRef.current?.(targetMediaId) || targetMediaId
      );
      paragraph.onclick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        onHyperlinkClickRef.current?.(targetMediaId);
      };
      paragraph.onkeydown = (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          event.stopPropagation();
          onHyperlinkClickRef.current?.(targetMediaId);
        }
      };
    });
  };

  const syncRenderedPage = (page: number) => {
    previewerRef.current?.renderSingleSlide?.(page - 1);
    window.requestAnimationFrame(() => {
      decorateRenderedSlide();
    });
  };

  renderPresentationRef.current = async (arrayBuffer: ArrayBuffer, preferredPage = 1) => {
    const previewer = previewerRef.current;
    if (!previewer) {
      return;
    }

    const renderVersion = ++renderVersionRef.current;

    try {
      const documentInfo = (await previewer.preview(arrayBuffer)) as PptxDocument;

      if (renderVersion !== renderVersionRef.current) {
        return;
      }

      const nextAspectRatio =
        documentInfo.width && documentInfo.height
          ? documentInfo.width / documentInfo.height
          : DEFAULT_PPT_ASPECT_RATIO;
      const slideCount = documentInfo.slides?.length ?? 0;
      const safePage = Math.min(Math.max(preferredPage, 1), Math.max(slideCount, 1));

      if (Math.abs(nextAspectRatio - aspectRatio) > 0.001) {
        setAspectRatio(nextAspectRatio);
      }

      setTotalPages(slideCount);
      setCurrentPage(safePage);
      syncRenderedPage(safePage);
      setIsLoading(false);
    } catch (err) {
      console.error("Error rendering PPTX:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setIsLoading(false);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      const targetPage = currentPage + 1;
      setCurrentPage(targetPage);
      syncRenderedPage(targetPage);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      const targetPage = currentPage - 1;
      setCurrentPage(targetPage);
      syncRenderedPage(targetPage);
    }
  };

  const setLinkedParagraphActive = (targetMediaId: string, isActive: boolean) => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    container.querySelectorAll<HTMLElement>(".pptx-linked-paragraph").forEach((paragraph) => {
      const matchesTarget = paragraph.dataset.targetMediaId === targetMediaId;
      paragraph.classList.toggle("pptx-linked-paragraph-active", matchesTarget && isActive);
    });
  };

  // 键盘控制翻页
  useEffect(() => {
    if (renderMode !== "pptx") {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        if (currentPage < totalPages) {
          nextPage();
        }
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        if (currentPage > 1) {
          prevPage();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPage, nextPage, prevPage, renderMode, totalPages]);

  useEffect(() => {
    if (renderMode !== "pptx" || !wrapperRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      const nextStageSize = fitPresentationSize(
        entry.contentRect.width,
        entry.contentRect.height,
        aspectRatio
      );

      setStageSize((previousSize) => {
        if (
          previousSize.width === nextStageSize.width &&
          previousSize.height === nextStageSize.height
        ) {
          return previousSize;
        }

        return nextStageSize;
      });
    });

    resizeObserver.observe(wrapperRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [aspectRatio, renderMode]);

  useEffect(() => {
    if (renderMode !== "pptx") {
      return;
    }

    let isCancelled = false;

    const loadPptx = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to load PPTX: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();

        cachedDataRef.current = arrayBuffer;

        if (mediaList.length > 0) {
          try {
            const nextPageMap = await detectPptReferencePageMap(arrayBuffer, mediaList);
            if (!isCancelled) {
              setDetectedPageMap(nextPageMap);
            }
          } catch (detectionError) {
            console.error("Error detecting PPTX reference pages:", detectionError);
            if (!isCancelled) {
              setDetectedPageMap({});
            }
          }
        }

        if (!isCancelled && previewerRef.current) {
          await renderPresentationRef.current(arrayBuffer, 1);
        }
      } catch (err) {
        console.error("Error loading PPTX:", err);
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
          setIsLoading(false);
        }
      }
    };

    void loadPptx();

    return () => {
      isCancelled = true;
    };
  }, [mediaReferenceSignature, renderMode, url]);

  useEffect(() => {
    if (
      renderMode !== "pptx" ||
      !linkedMediaId ||
      linkedMediaNonce <= 0 ||
      totalPages <= 0
    ) {
      return;
    }

    const targetPage = getLinkedMediaPage(linkedMediaId);
    if (!targetPage) {
      return;
    }

    const safePage = Math.min(Math.max(targetPage, 1), totalPages);
    setCurrentPage(safePage);
    syncRenderedPage(safePage);
  }, [detectedPageMap, hyperlinks, linkedMediaId, linkedMediaNonce, renderMode, totalPages]);

  useEffect(() => {
    if (
      renderMode !== "pptx" ||
      !containerRef.current ||
      stageSize.width <= 0 ||
      stageSize.height <= 0
    ) {
      return;
    }

    previewerRef.current?.destroy?.();
    previewerRef.current = null;
    containerRef.current.innerHTML = "";

    previewerRef.current = init(containerRef.current, {
      width: stageSize.width,
      height: stageSize.height,
      mode: "slide",
    });

    if (cachedDataRef.current) {
      void renderPresentationRef.current(cachedDataRef.current, currentPageRef.current);
    }

    return () => {
      previewerRef.current?.destroy?.();
      previewerRef.current = null;
    };
  }, [renderMode, stageSize.height, stageSize.width]);

  if (renderMode === "checking") {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-900">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-amber-500" />
          <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
            Loading presentation...
          </p>
        </div>
      </div>
    );
  }

  if (renderMode === "pdf" && pdfFallbackUrl) {
    return (
      <div className="h-full w-full overflow-hidden">
        <PdfViewer
          url={pdfFallbackUrl}
          theme={theme}
          hyperlinks={hyperlinks}
          onHyperlinkClick={onHyperlinkClick}
          mediaList={mediaList}
          linkedMediaId={linkedMediaId}
          linkedMediaNonce={linkedMediaNonce}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-900">
        <div className="text-center p-8">
          <FileText className="mx-auto mb-4 h-16 w-16 text-red-500" />
          <p className={`mb-4 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
            Failed to load presentation
          </p>
          <button
            onClick={() => window.open(url, "_blank")}
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
          >
            <Download className="mr-1 inline h-4 w-4" />
            Download PPTX
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className="pptx-linked-deck relative flex h-full w-full items-center justify-center overflow-hidden p-4 md:p-6"
    >
      <style>
        {`
          .pptx-linked-deck .pptx-linked-paragraph {
            cursor: pointer;
            transform: translate3d(0, 0, 0);
            transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
            will-change: transform;
          }

          .pptx-linked-deck .pptx-linked-paragraph:hover,
          .pptx-linked-deck .pptx-linked-paragraph-active,
          .pptx-linked-deck .pptx-linked-paragraph:focus-visible {
            transform: translate3d(0, -4px, 0);
          }

          .course-hotspot {
            transition: all 220ms cubic-bezier(0.22, 1, 0.36, 1);
          }

          .course-hotspot:hover,
          .course-hotspot-active {
            background-color: rgba(34, 211, 238, 0.12);
            box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
            transform: translateY(-4px);
            border: 1.5px solid rgba(34, 211, 238, 0.4);
          }

          .course-hotspot-active {
            animation: pptx-hotspot-pulse 2s infinite ease-in-out;
            background-color: rgba(34, 211, 238, 0.18);
            border-color: rgba(34, 211, 238, 0.6);
          }

          @keyframes pptx-hotspot-pulse {
            0%, 100% {
              box-shadow: 0 8px 20px rgba(34, 211, 238, 0.15);
            }
            50% {
              box-shadow: 0 12px 28px rgba(34, 211, 238, 0.3);
            }
          }

          .course-hotspot-dot {
            transition: all 200ms ease;
            opacity: 0;
            transform: scale(0.5);
          }

          .course-hotspot:hover .course-hotspot-dot,
          .course-hotspot-active .course-hotspot-dot {
            opacity: 1;
            transform: scale(1);
          }
        `}
      </style>

      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-amber-500" />
            <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
              Loading presentation...
            </p>
          </div>
        </div>
      )}

      <div
        className={`relative flex max-h-full max-w-full items-center justify-center overflow-hidden rounded-[28px] border ${
          theme === "dark"
            ? "border-slate-700/80 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_rgba(15,23,42,0.92)_62%)]"
            : "border-slate-200 bg-[radial-gradient(circle_at_top,_rgba(125,211,252,0.28),_rgba(255,255,255,0.98)_62%)]"
        }`}
        style={{
          width: `${stageSize.width}px`,
          height: `${stageSize.height}px`,
          minHeight: stageSize.height > 0 ? `${stageSize.height}px` : undefined,
        }}
      >
        <div
          ref={containerRef}
          className="h-full w-full"
          style={{ overflow: "hidden" }}
        />

        {!isLoading && currentPageHyperlinks.length > 0 && (
          <div className="pointer-events-none absolute inset-0 z-10">
            {currentPageHyperlinks.map((hyperlink) => (
              <div
                key={hyperlink.id}
                className="absolute pointer-events-none"
                style={{
                  left: `${hyperlink.x * 100}%`,
                  top: `${hyperlink.y * 100}%`,
                  width: `${hyperlink.width * 100}%`,
                  height: `${hyperlink.height * 100}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <button
                  type="button"
                  className={`course-hotspot group relative h-full w-full overflow-hidden rounded-2xl pointer-events-auto bg-transparent ${
                    hyperlink.targetMediaId === activeMediaId ? "course-hotspot-active" : ""
                  }`}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onHyperlinkClick?.(hyperlink.targetMediaId);
                  }}
                  onPointerEnter={() => setLinkedParagraphActive(hyperlink.targetMediaId, true)}
                  onPointerLeave={() => setLinkedParagraphActive(hyperlink.targetMediaId, false)}
                  onFocus={() => setLinkedParagraphActive(hyperlink.targetMediaId, true)}
                  onBlur={() => setLinkedParagraphActive(hyperlink.targetMediaId, false)}
                  title={getHyperlinkTitle?.(hyperlink.targetMediaId) || hyperlink.targetMediaId}
                >
                  <span
                    className={`course-hotspot-dot pointer-events-none absolute right-2 top-2 h-2.5 w-2.5 rounded-full ${
                      theme === "dark"
                        ? "bg-cyan-200 shadow-[0_0_12px_rgba(103,232,249,0.8)]"
                        : "bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {!isLoading && (
        <>
          <div
            className={`absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-xs font-medium z-20 ${
              theme === "dark" ? "bg-black/70 text-white" : "bg-white/90 text-gray-900 shadow-lg"
            }`}
          >
            {currentPage} / {totalPages}
          </div>

          <button
            onClick={prevPage}
            disabled={currentPage <= 1}
            className={`absolute left-2 bottom-2 p-2 rounded-full transition-all z-20 ${
              currentPage <= 1
                ? "opacity-30 cursor-not-allowed"
                : theme === "dark"
                  ? "bg-black/70 text-white hover:bg-black/90"
                  : "bg-white/90 text-gray-900 shadow-lg hover:bg-white"
            }`}
            title="上一页"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            onClick={nextPage}
            disabled={currentPage >= totalPages}
            className={`absolute right-2 bottom-2 p-2 rounded-full transition-all z-20 ${
              currentPage >= totalPages
                ? "opacity-30 cursor-not-allowed"
                : theme === "dark"
                  ? "bg-black/70 text-white hover:bg-black/90"
                  : "bg-white/90 text-gray-900 shadow-lg hover:bg-white"
            }`}
            title="下一页"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}
    </div>
  );
}

export function CourseViewer({ course, onBack, theme }: CourseViewerProps) {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language.startsWith("zh");

  // 当前选中的媒体（用于下方预览区）
  const [selectedMedia, setSelectedMedia] = useState<MediaResource | null>(null);
  // 当前选中的 PPT 资源（用于中间课件区）
  const [selectedPptMedia, setSelectedPptMedia] = useState<MediaResource | null>(null);
  // 下方预览区是否全屏
  const [isFullscreen, setIsFullscreen] = useState(false);
  // 主 PDF 是否全屏
  const [isMainSlideFullscreen, setIsMainSlideFullscreen] = useState(false);
  const [previewPlaybackKey, setPreviewPlaybackKey] = useState(0);
  const [shouldAutoplayPreview, setShouldAutoplayPreview] = useState(false);
  const [linkedMediaId, setLinkedMediaId] = useState<string | null>(null);
  const [linkedMediaNonce, setLinkedMediaNonce] = useState(0);

  // 获取主 PDF（直接从 mainSlide 字段获取）
  const mainSlide = course.mainSlide;

  // 获取媒体资源列表（PDF 已分离，不再需要过滤）
  const mediaList = course.media;
  const pptMediaList = mediaList.filter((media) => media.type === "pptx");
  const previewMediaList = mediaList.filter((media) => media.type !== "pptx");
  const videoMediaList = previewMediaList.filter((media) => media.type === "video");
  const imageMediaList = previewMediaList.filter((media) => media.type === "image");
  const hasPptxLayout = pptMediaList.length > 0;
  const activePptMedia = selectedPptMedia ?? pptMediaList[0] ?? null;
  const activePreviewMedia = hasPptxLayout
    ? selectedMedia ?? previewMediaList.find((media) => media.type === "video") ?? previewMediaList[0] ?? null
    : selectedMedia;
  const mediaSignature = mediaList.map((media) => media.id).join("|");
  const resourceSections = [
    {
      id: "pptx",
      title: isZh ? "PPT 课件" : "Presentation decks",
      description: isZh ? "优先查看主课件与讲解页" : "Main teaching decks first",
      items: pptMediaList,
      accent: MEDIA_TYPE_COLORS.pptx,
    },
    {
      id: "video",
      title: isZh ? "视频重点" : "Video highlights",
      description: isZh ? "建议优先预览的视频素材" : "Recommended clips to preview",
      items: videoMediaList,
      accent: MEDIA_TYPE_COLORS.video,
    },
    {
      id: "image",
      title: isZh ? "补充图片" : "Reference images",
      description: isZh ? "用于辅助说明的图片资源" : "Supporting visual references",
      items: imageMediaList,
      accent: MEDIA_TYPE_COLORS.image,
    },
  ].filter((section) => section.items.length > 0);

  // 获取超链接列表
  const hyperlinks = course.hyperlinks || [];

  // 获取媒体标题
  const getMediaTitle = (media: MediaResource | { title: Record<string, string> }) => {
    return media.title[i18n.language] || media.title["zh-CN"] || media.title["en-US"] || "";
  };

  const getMediaTypeLabel = (type: MediaType) => {
    if (isZh) {
      if (type === "pptx") return "PPT";
      if (type === "image") return "图片";
      return "视频";
    }

    if (type === "pptx") return "PPT";
    if (type === "image") return "Image";
    return "Video";
  };

  const getHyperlinkTitle = (targetMediaId: string) => {
    const media = mediaList.find((item) => item.id === targetMediaId);
    return media ? getMediaTitle(media) : targetMediaId;
  };

  const handleMediaSelect = (
    media: MediaResource,
    options: { autoplay?: boolean; restart?: boolean; syncDeck?: boolean } = {}
  ) => {
    if (media.type === "pptx") {
      setSelectedPptMedia(media);
      return;
    }

    const shouldSyncDeck = options.syncDeck ?? true;

    if (media.type === "video") {
      setShouldAutoplayPreview(options.autoplay ?? true);
      if (options.restart || selectedMedia?.id === media.id) {
        setPreviewPlaybackKey((previousKey) => previousKey + 1);
      }
    } else {
      setShouldAutoplayPreview(false);
    }

    setSelectedMedia(media);

    if (shouldSyncDeck) {
      setLinkedMediaId(media.id);
      setLinkedMediaNonce((previousNonce) => previousNonce + 1);
    }
  };

  // 处理超链接点击
  const handleHyperlinkClick = (targetMediaId: string) => {
    const media = mediaList.find((m) => m.id === targetMediaId);
    if (media) {
      handleMediaSelect(media, {
        autoplay: media.type === "video",
        restart: true,
        syncDeck: false,
      });
    }
  };

  // 切换下方预览区全屏
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    if (!hasPptxLayout) {
      setSelectedPptMedia(null);
      setSelectedMedia(null);
      setIsFullscreen(false);
      setShouldAutoplayPreview(false);
      setLinkedMediaId(null);
      setLinkedMediaNonce(0);
      return;
    }

    setSelectedPptMedia(pptMediaList[0] ?? null);
    setSelectedMedia(
      previewMediaList.find((media) => media.type === "video") ?? previewMediaList[0] ?? null
    );
    setIsFullscreen(false);
    setIsMainSlideFullscreen(false);
    setPreviewPlaybackKey(0);
    setShouldAutoplayPreview(false);
    setLinkedMediaId(null);
    setLinkedMediaNonce(0);
  }, [course.id, mediaSignature, hasPptxLayout]);

  // ESC 键退出全屏
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isMainSlideFullscreen) {
          setIsMainSlideFullscreen(false);
        } else if (isFullscreen) {
          setIsFullscreen(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, isMainSlideFullscreen]);

  // 渲染主 PDF 内容
  const renderMainSlide = (isFullscreenMode = false) => {
    if (!mainSlide) return null;

    const containerClass = isFullscreenMode
      ? "w-full h-full"
      : "w-full h-full rounded-xl overflow-hidden";

    return (
      <div className={containerClass}>
        <PdfViewer
          url={mainSlide.url}
          theme={theme}
          hyperlinks={hyperlinks}
          mediaList={mediaList}
          onHyperlinkClick={handleHyperlinkClick}
          onFullscreenClick={isFullscreenMode ? undefined : () => setIsMainSlideFullscreen(true)}
        />
      </div>
    );
  };

  // 渲染媒体内容
  const renderMedia = (media: MediaResource | null) => {
    if (!media) return null;

    const renderMediaBody = () => {
      switch (media.type) {
        case "pptx":
          return (
            <PptxViewer
              url={media.url}
              theme={theme}
              mediaList={previewMediaList}
              activeMediaId={activePreviewMedia?.id}
            />
          );

        case "image":
          return (
            <img
              src={media.url}
              alt={getMediaTitle(media)}
              className="h-full w-full object-contain"
            />
          );

        case "video":
          return (
            <video
              key={`${media.id}-${previewPlaybackKey}`}
              src={media.url}
              controls
              playsInline
              autoPlay={shouldAutoplayPreview}
              preload="metadata"
              className="h-full w-full bg-black object-contain"
            />
          );

        default:
          return (
            <div className="flex h-full w-full items-center justify-center">
              <p className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                {t("page.courses.unsupportedmediatype")}
              </p>
            </div>
          );
      }
    };

    if (isFullscreen) {
      return (
        <div className="fixed inset-0 z-[9999] bg-black">
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute right-4 top-4 z-20 rounded-lg bg-black/60 p-2 text-white transition-colors hover:bg-black/80"
            title={t("page.courses.exitfullscreen")}
          >
            <Minimize2 className="h-5 w-5" />
          </button>
          <div className="h-full w-full">{renderMediaBody()}</div>
        </div>
      );
    }

    return <div className="h-full w-full rounded-xl overflow-hidden">{renderMediaBody()}</div>;
  };

  return (
    <div className="mx-auto max-w-[1540px] px-4 sm:px-5 xl:px-6 2xl:pr-10">
      {/* 返回按钮 */}
      <button
        onClick={onBack}
        className={`mb-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 transition-all duration-200 ${
          theme === "dark"
            ? "text-gray-400 hover:bg-slate-800 hover:text-white"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`}
      >
        <ChevronLeft className="h-4 w-4" />
        <span>{t("page.courses.backtocourses")}</span>
      </button>

      {/* 上方区域：主 PDF 永久显示 */}
      {!hasPptxLayout && mainSlide && (
        <div className={`rounded-2xl p-4 mb-6 ${theme === "dark" ? "bg-slate-800/50" : "bg-white"}`}>
          <div className="aspect-video">{renderMainSlide()}</div>
        </div>
      )}

      {/* 主 PDF 全屏模式 */}
      {isMainSlideFullscreen && mainSlide && (
        <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
          <button
            onClick={() => setIsMainSlideFullscreen(false)}
            className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors"
            title={t("page.courses.exitfullscreen")}
          >
            <Minimize2 className="h-5 w-5" />
          </button>
          <div className="w-full h-full">{renderMainSlide(true)}</div>
        </div>
      )}

      {hasPptxLayout && (
        <div
          className={`rounded-[28px] border p-3 sm:p-4 shadow-[0_20px_80px_rgba(15,23,42,0.08)] ${
            theme === "dark"
              ? "border-slate-700/70 bg-slate-900/70"
              : "border-slate-200 bg-white/95"
          }`}
        >
          <div className="grid items-start gap-4 xl:grid-cols-[252px_minmax(0,1.08fr)_minmax(280px,0.8fr)] 2xl:grid-cols-[264px_minmax(0,1.08fr)_320px]">
            <aside
              className={`rounded-[24px] border p-4 xl:h-[68vh] ${
                theme === "dark"
                  ? "border-slate-700/70 bg-slate-800/70"
                  : "border-slate-200 bg-slate-50/95"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p
                    className={`text-xs font-semibold uppercase tracking-[0.18em] ${
                      theme === "dark" ? "text-amber-300/80" : "text-amber-700"
                    }`}
                  >
                    {isZh ? "资源总览" : "Resources"}
                  </p>
                  <h2
                    className={`mt-2 text-lg font-semibold ${
                      theme === "dark" ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {course.title["zh-CN"] || course.title["en-US"]}
                  </h2>
                </div>
                <div
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    theme === "dark" ? "bg-slate-700 text-slate-200" : "bg-white text-slate-600"
                  }`}
                >
                  {mediaList.length} {isZh ? "项" : "items"}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div
                  className={`rounded-2xl border px-3 py-3 ${
                    theme === "dark"
                      ? "border-amber-400/20 bg-amber-500/10"
                      : "border-amber-200 bg-amber-50/80"
                  }`}
                >
                  <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${theme === "dark" ? "text-amber-200/80" : "text-amber-700"}`}>
                    {isZh ? "PPT" : "Decks"}
                  </p>
                  <p className={`mt-1 text-xl font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                    {pptMediaList.length}
                  </p>
                </div>
                <div
                  className={`rounded-2xl border px-3 py-3 ${
                    theme === "dark"
                      ? "border-rose-400/20 bg-rose-500/10"
                      : "border-rose-200 bg-rose-50/80"
                  }`}
                >
                  <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${theme === "dark" ? "text-rose-200/80" : "text-rose-700"}`}>
                    {isZh ? "视频" : "Videos"}
                  </p>
                  <p className={`mt-1 text-xl font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                    {videoMediaList.length}
                  </p>
                </div>
              </div>

              <div className="mt-4 max-h-[45vh] space-y-3 overflow-y-auto pr-1 xl:h-[calc(100%-8.5rem)] xl:max-h-none">
                {resourceSections.map((section) => (
                  <div
                    key={section.id}
                    className={`rounded-[22px] border p-3 ${
                      theme === "dark"
                        ? "border-slate-700/80 bg-slate-900/55"
                        : "border-slate-200 bg-white/90"
                    }`}
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: section.accent }}>
                          {section.title}
                        </p>
                        <p className={`mt-1 text-[11px] leading-5 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                          {section.description}
                        </p>
                      </div>
                      <span
                        className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={{
                          backgroundColor: `${section.accent}18`,
                          color: section.accent,
                        }}
                      >
                        {section.items.length}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {section.items.map((media) => {
                        const isCurrentPpt = media.id === activePptMedia?.id;
                        const isCurrentPreview = media.id === activePreviewMedia?.id;
                        const isActive = isCurrentPpt || isCurrentPreview;

                        return (
                          <button
                            key={media.id}
                            onClick={() => handleMediaSelect(media)}
                            className={`w-full rounded-2xl border px-3 py-3 text-left transition-all duration-300 ${
                              isActive
                                ? theme === "dark"
                                  ? "border-slate-500 bg-slate-700/80 shadow-lg shadow-slate-950/20"
                                  : "border-slate-300 bg-white shadow-sm"
                                : theme === "dark"
                                  ? "border-slate-700 bg-slate-800/70 hover:border-slate-600 hover:bg-slate-800"
                                  : "border-slate-200 bg-white/80 hover:border-slate-300 hover:bg-white"
                            } ${media.type !== "image" ? "hover:-translate-y-0.5 hover:shadow-lg" : "hover:shadow-md"}`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                                style={{
                                  backgroundColor: isActive
                                    ? `${MEDIA_TYPE_COLORS[media.type]}24`
                                    : `${MEDIA_TYPE_COLORS[media.type]}16`,
                                  color: MEDIA_TYPE_COLORS[media.type],
                                }}
                              >
                                {MEDIA_TYPE_ICONS[media.type]}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <p
                                    className={`line-clamp-2 text-sm font-semibold ${
                                      theme === "dark" ? "text-white" : "text-slate-900"
                                    }`}
                                  >
                                    {getMediaTitle(media)}
                                  </p>
                                </div>

                                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                  <span
                                    className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                                    style={{
                                      backgroundColor: `${MEDIA_TYPE_COLORS[media.type]}18`,
                                      color: MEDIA_TYPE_COLORS[media.type],
                                    }}
                                  >
                                    {getMediaTypeLabel(media.type)}
                                  </span>
                                  {media.duration && (
                                    <span
                                      className={`inline-flex items-center gap-1 text-[11px] ${
                                        theme === "dark" ? "text-slate-400" : "text-slate-500"
                                      }`}
                                    >
                                      <Clock className="h-3 w-3" />
                                      {Math.floor(media.duration / 60)}:
                                      {(media.duration % 60).toString().padStart(2, "0")}
                                    </span>
                                  )}
                                </div>

                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {isCurrentPpt && (
                                    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-500">
                                      {isZh ? "中间课件" : "Center deck"}
                                    </span>
                                  )}
                                  {isCurrentPreview && (
                                    <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-[11px] font-medium text-cyan-500">
                                      {isZh ? "右侧预览" : "Right preview"}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </aside>

            <section
              className={`rounded-[24px] border p-4 xl:h-[68vh] ${
                theme === "dark"
                  ? "border-slate-700/70 bg-slate-800/55"
                  : "border-slate-200 bg-slate-50/70"
              }`}
            >
              <div className="mx-auto flex h-full w-full max-w-[860px] flex-col">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p
                      className={`text-xs font-semibold uppercase tracking-[0.18em] ${
                        theme === "dark" ? "text-amber-300/80" : "text-amber-700"
                      }`}
                    >
                      {isZh ? "课件演示" : "Presentation"}
                    </p>
                    <h3
                      className={`mt-2 text-xl font-semibold ${
                        theme === "dark" ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {activePptMedia ? getMediaTitle(activePptMedia) : isZh ? "暂无课件" : "No deck"}
                    </h3>
                    <p className={`mt-2 text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                      {isZh
                        ? "左侧选择图片或视频时，会同步切换右侧预览和当前课件页；若课件中配置了可点击区域，也会反向联动。"
                        : "Selecting media from the left will sync both the right preview and the active deck page. Clickable overlays in the deck also work in reverse."}
                    </p>
                  </div>

                  {activePptMedia && (
                    <button
                      onClick={() => window.open(activePptMedia.url, "_blank")}
                      className={`rounded-xl p-2 transition-colors ${
                        theme === "dark"
                          ? "text-slate-300 hover:bg-slate-700"
                          : "text-slate-600 hover:bg-white"
                      }`}
                      title={t("page.courses.download")}
                    >
                      <Download className="h-5 w-5" />
                    </button>
                  )}
                </div>

                <div
                  className={`min-h-[340px] flex-1 overflow-hidden rounded-[22px] border ${
                    theme === "dark"
                      ? "border-slate-700 bg-slate-950/70"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  {activePptMedia ? (
                    <PptxViewer
                      key={activePptMedia.id}
                      url={activePptMedia.url}
                      theme={theme}
                      hyperlinks={hyperlinks}
                      onHyperlinkClick={handleHyperlinkClick}
                      getHyperlinkTitle={getHyperlinkTitle}
                      mediaList={previewMediaList}
                      linkedMediaId={linkedMediaId}
                      linkedMediaNonce={linkedMediaNonce}
                      activeMediaId={activePreviewMedia?.id}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <p className={theme === "dark" ? "text-slate-400" : "text-slate-500"}>
                        {isZh ? "当前课程没有可播放的 PPT 课件" : "No presentation available"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section
              className={`rounded-[24px] border p-4 xl:h-[68vh] ${
                theme === "dark"
                  ? "border-slate-700/70 bg-slate-800/55"
                  : "border-slate-200 bg-slate-50/70"
              }`}
            >
              <div className="mx-auto flex h-full w-full max-w-[420px] flex-col">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p
                      className={`text-xs font-semibold uppercase tracking-[0.18em] ${
                        theme === "dark" ? "text-cyan-300/80" : "text-cyan-700"
                      }`}
                    >
                      {isZh ? "对应资源" : "Preview"}
                    </p>
                    <h3
                      className={`mt-2 text-lg font-semibold ${
                        theme === "dark" ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {activePreviewMedia
                        ? getMediaTitle(activePreviewMedia)
                        : isZh
                          ? "从左侧选择视频或图片"
                          : "Select a video or image"}
                    </h3>
                    <p className={`mt-2 text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                      {isZh
                        ? "视频资源会优先显示在这里，图片则作为补充说明。"
                        : "Videos are prioritized here, while images stay as supporting references."}
                    </p>
                  </div>

                  {activePreviewMedia && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={toggleFullscreen}
                        className={`rounded-xl p-2 transition-colors ${
                          theme === "dark"
                            ? "text-slate-300 hover:bg-slate-700"
                            : "text-slate-600 hover:bg-white"
                        }`}
                        title={isFullscreen ? t("page.courses.exitfullscreen") : t("page.courses.fullscreen")}
                      >
                        {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                      </button>
                      <button
                        onClick={() => window.open(activePreviewMedia.url, "_blank")}
                        className={`rounded-xl p-2 transition-colors ${
                          theme === "dark"
                            ? "text-slate-300 hover:bg-slate-700"
                            : "text-slate-600 hover:bg-white"
                        }`}
                        title={t("page.courses.download")}
                      >
                        <Download className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>

                <div
                  className={`min-h-[280px] flex-1 overflow-hidden rounded-[22px] border ${
                    theme === "dark"
                      ? "border-slate-700 bg-slate-950/70"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  {activePreviewMedia ? (
                    renderMedia(activePreviewMedia)
                  ) : (
                    <div className="flex h-full items-center justify-center px-6 text-center">
                      <p className={theme === "dark" ? "text-slate-400" : "text-slate-500"}>
                        {isZh
                          ? "左侧选择任意视频或图片后，会在这里同步播放。"
                          : "Pick a video or image from the left to preview it here."}
                      </p>
                    </div>
                  )}
                </div>

                <div
                  className={`mt-4 rounded-[20px] border px-4 py-3 ${
                    theme === "dark"
                      ? "border-slate-700 bg-slate-900/70"
                      : "border-slate-200 bg-white/90"
                  }`}
                >
                  {activePreviewMedia ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="rounded-full px-2.5 py-1 text-xs font-medium"
                        style={{
                          backgroundColor: `${MEDIA_TYPE_COLORS[activePreviewMedia.type]}18`,
                          color: MEDIA_TYPE_COLORS[activePreviewMedia.type],
                        }}
                      >
                        {getMediaTypeLabel(activePreviewMedia.type)}
                      </span>
                      {activePreviewMedia.duration && (
                        <span
                          className={`inline-flex items-center gap-1 text-xs ${
                            theme === "dark" ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          <Clock className="h-3.5 w-3.5" />
                          {Math.floor(activePreviewMedia.duration / 60)}:
                          {(activePreviewMedia.duration % 60).toString().padStart(2, "0")}
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                      {isZh ? "当前没有右侧预览资源。" : "No preview media selected."}
                    </p>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* 下方区域：媒体资源列表 + 预览区（左右布局） */}
      {!hasPptxLayout && mediaList.length > 0 && (
        <div className={`rounded-2xl p-4 ${theme === "dark" ? "bg-slate-800/50" : "bg-white"}`}>
          <div className="flex gap-4">
            {/* 左侧：资源列表 */}
            <div className="w-52 flex-shrink-0 space-y-1 max-h-[60vh] overflow-y-auto">
              {mediaList.map((media) => (
                <button
                  key={media.id}
                  onClick={() => handleMediaSelect(media)}
                  className={`w-full flex items-center gap-2 rounded-lg px-2.5 py-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                    selectedMedia?.id === media.id
                      ? "bg-blue-500 text-white"
                      : theme === "dark"
                        ? "bg-slate-700 hover:bg-slate-600"
                        : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  <div
                    className="rounded p-1"
                    style={{
                      backgroundColor:
                        selectedMedia?.id === media.id
                          ? "rgba(255,255,255,0.2)"
                          : `${MEDIA_TYPE_COLORS[media.type]}20`,
                    }}
                  >
                    <span
                      className="scale-75 inline-block"
                      style={{
                        color: selectedMedia?.id === media.id ? "white" : MEDIA_TYPE_COLORS[media.type],
                      }}
                    >
                      {MEDIA_TYPE_ICONS[media.type]}
                    </span>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <span
                      className={`block text-xs font-medium truncate ${
                        selectedMedia?.id === media.id
                          ? "text-white"
                          : theme === "dark"
                            ? "text-gray-300"
                            : "text-gray-700"
                      }`}
                    >
                      {getMediaTitle(media)}
                    </span>
                    {media.duration && (
                      <div
                        className="flex items-center gap-0.5 text-[10px] mt-0.5"
                        style={{
                          color: selectedMedia?.id === media.id ? "rgba(255,255,255,0.8)" : course.color,
                        }}
                      >
                        <Clock className="h-2.5 w-2.5" />
                        <span>
                          {Math.floor(media.duration / 60)}:{(media.duration % 60).toString().padStart(2, "0")}
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* 右侧：选中媒体的预览区域 */}
            <div className="flex-1 min-w-0">
              {selectedMedia ? (
                <div>
                  {/* 媒体预览 */}
                  <div className="aspect-video mb-3">{renderMedia(selectedMedia)}</div>

                  {/* 媒体详情 - 置于下方 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="rounded-lg p-1.5"
                        style={{ backgroundColor: `${MEDIA_TYPE_COLORS[selectedMedia.type]}20` }}
                      >
                        <span style={{ color: MEDIA_TYPE_COLORS[selectedMedia.type] }}>
                          {MEDIA_TYPE_ICONS[selectedMedia.type]}
                        </span>
                      </div>
                      <div>
                        <h3
                          className={`text-sm font-medium ${
                            theme === "dark" ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {getMediaTitle(selectedMedia)}
                        </h3>
                        {selectedMedia.duration && (
                          <div
                            className="flex items-center gap-1 text-xs"
                            style={{ color: course.color }}
                          >
                            <Clock className="h-3 w-3" />
                            <span>
                              {Math.floor(selectedMedia.duration / 60)}:
                              {(selectedMedia.duration % 60).toString().padStart(2, "0")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={toggleFullscreen}
                        className={`rounded-lg p-2 transition-colors ${
                          theme === "dark"
                            ? "text-gray-400 hover:bg-slate-700"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                        title={isFullscreen ? t("page.courses.exitfullscreen") : t("page.courses.fullscreen")}
                      >
                        {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                      </button>
                      <button
                        onClick={() => window.open(selectedMedia.url, "_blank")}
                        className={`rounded-lg p-2 transition-colors ${
                          theme === "dark"
                            ? "text-gray-400 hover:bg-slate-700"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                        title={t("page.courses.download")}
                      >
                        <Download className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="aspect-video flex items-center justify-center rounded-xl border-2 border-dashed">
                  <p className={theme === "dark" ? "text-gray-500" : "text-gray-400"}>
                    {t("page.courses.selectmedia") || "选择媒体资源查看"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
