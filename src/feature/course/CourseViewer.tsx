/**
 * CourseViewer - 课程内容查看器
 *
 * 支持显示 PPTX、图片、视频等多种媒体类型
 */

import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
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
  MessageSquare,
} from "lucide-react";
import type { CourseData, MediaResource, MediaType, PdfHyperlink } from "@/data/courses";
import {
  buildMediaReferenceMap,
  extractReferenceKeysFromText,
  normalizeMediaReferenceText,
} from "./mediaReference";
import { ExperimentDiscussionSection } from "./ExperimentDiscussionSection";
import { getPptPdfFallbackUrl, hasPdfSidecar } from "./pptMedia";
import { resolveApiEndpoint } from "@/lib/api";
import { getKnowledgeTagLabel, normalizeKnowledgeTag } from "@/lib/course.service";

const PdfViewer = lazy(() => import("./PdfViewer"));

interface CourseViewerProps {
  course: CourseData;
  theme: "dark" | "light";
  canDownloadResources?: boolean;
  backPath?: string;
  backLabel?: string;
}

// 媒体类型图标映射
const MEDIA_TYPE_ICONS: Record<MediaType, React.ReactNode> = {
  pptx: <FileText className="h-5 w-5" />,
  pdf: <FileText className="h-5 w-5" />,
  image: <ImageIcon className="h-5 w-5" />,
  video: <Play className="h-5 w-5" />,
};

// 媒体类型颜色
const MEDIA_TYPE_COLORS: Record<MediaType, string> = {
  pptx: "#F59E0B",
  pdf: "#DC2626",
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

type PptxPreviewModule = typeof import("pptx-preview");

const DEFAULT_PPT_ASPECT_RATIO = 16 / 9;
const MOBILE_PRESENTATION_MAX_WIDTH = 767;
let pptxPreviewModulePromise: Promise<PptxPreviewModule> | null = null;
const OPTIMIZED_UNIT2_VIDEO_FILENAMES = new Set([
  "实验-保鲜膜拉伸-平行偏振系统-旋转样品视频.mp4",
  "实验-保鲜膜拉伸-正交偏振系统-旋转样品视频.mp4",
  "实验-打火机烧玻璃-正交偏振系统-长时间观察视频.mp4",
  "实验-透明胶条-平行偏振系统-旋转样品视频.mp4",
  "实验-透明胶条-正交偏振系统-旋转样品视频.mp4",
  "实验-透明胶条（重叠阵列）-正交偏振系统-旋转样品视频.mp4",
  "文创-学院logo-正交偏振系统-旋转样品视频.mp4",
  "文创-辛普森一家丽莎-正交偏振系统-旋转样品视频.mp4",
  "文创-辛普森一家巴特-正交偏振系统-旋转样品视频.mp4",
]);

function loadPptxPreviewModule() {
  if (!pptxPreviewModulePromise) {
    pptxPreviewModulePromise = import("pptx-preview");
  }

  return pptxPreviewModulePromise;
}

function getPreferredMediaUrl(media: MediaResource) {
  if (media.type !== "video") {
    return media.url;
  }

  const matchedFilename = media.url.match(/\/courses\/unit2\/([^/?#]+\.mp4)(?:[?#].*)?$/)?.[1];
  if (!matchedFilename) {
    return media.url;
  }

  let decodedFilename = matchedFilename;
  try {
    decodedFilename = decodeURIComponent(matchedFilename);
  } catch {
    decodedFilename = matchedFilename;
  }

  if (!OPTIMIZED_UNIT2_VIDEO_FILENAMES.has(decodedFilename)) {
    return media.url;
  }

  return `/videos/chromatic-polarization/${decodedFilename}`;
}

function fitPresentationSize(width: number, height: number, aspectRatio: number) {
  if (width <= 0 || height <= 0) {
    return { width: 0, height: 0 };
  }

  const widthFirstHeight = width / aspectRatio;

  // Prefer filling the available width so the slide doesn't leave a thin strip
  // on the right edge when the aspect-ratio mismatch is only slight.
  if (widthFirstHeight <= height * 1.1) {
    return {
      width: Math.max(0, Math.floor(width)),
      height: Math.max(0, Math.floor(widthFirstHeight)),
    };
  }

  const fittedWidth = Math.min(width, height * aspectRatio);
  const fittedHeight = fittedWidth / aspectRatio;

  return {
    width: Math.max(0, Math.floor(fittedWidth)),
    height: Math.max(0, Math.floor(fittedHeight)),
  };
}

function isMobilePresentationViewport() {
  return (
    typeof window !== "undefined" &&
    Math.min(window.innerWidth, window.innerHeight) <= MOBILE_PRESENTATION_MAX_WIDTH
  );
}

function collectReferenceKeysFromPptNode(
  node: unknown,
  referenceKeys: Set<string>,
  visited: WeakSet<object>,
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

function buildPptReferencePageMap(documentInfo: PptxDocument, mediaList: MediaResource[]) {
  const referenceMap = buildMediaReferenceMap(mediaList);
  if (Object.keys(referenceMap).length === 0) {
    return {};
  }

  const pageMap: Record<string, number> = {};

  documentInfo.slides?.forEach((slide, slideIndex) => {
    const foundReferenceKeys = new Set<string>();
    collectReferenceKeysFromPptNode(
      slide.nodes ?? slide,
      foundReferenceKeys,
      new WeakSet<object>(),
    );

    foundReferenceKeys.forEach((referenceKey) => {
      const targetMediaId = referenceMap[referenceKey];
      if (targetMediaId && pageMap[targetMediaId] == null) {
        pageMap[targetMediaId] = slideIndex + 1;
      }
    });
  });

  return pageMap;
}

async function detectPptReferencePageMap(arrayBuffer: ArrayBuffer, mediaList: MediaResource[]) {
  if (mediaList.length === 0) {
    return {};
  }

  const scratchHost = document.createElement("div");
  const { init } = await loadPptxPreviewModule();
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
  downloadUrl?: string;
  canDownload?: boolean;
  preferredPdfUrl?: string;
  theme: "dark" | "light";
  hyperlinks?: PdfHyperlink[];
  onHyperlinkClick?: (targetMediaId: string) => void;
  getHyperlinkTitle?: (targetMediaId: string) => string;
  mediaList?: MediaResource[];
  linkedMediaId?: string | null;
  linkedMediaNonce?: number;
  activeMediaId?: string | null;
  /** Controlled presentation fullscreen (owned by CourseViewer deck frame). */
  isFullscreen?: boolean;
  onFullscreenClick?: () => void;
}

function PptxViewer({
  url,
  downloadUrl,
  canDownload = false,
  preferredPdfUrl,
  theme,
  hyperlinks = [],
  onHyperlinkClick,
  getHyperlinkTitle,
  mediaList = [],
  linkedMediaId = null,
  linkedMediaNonce = 0,
  activeMediaId = null,
  isFullscreen = false,
  onFullscreenClick,
}: PptxViewerProps) {
  const { t } = useTranslation();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previewerRef = useRef<PptxPreviewerInstance | null>(null);
  const renderVersionRef = useRef(0);
  const renderPresentationRef = useRef<
    (arrayBuffer: ArrayBuffer, preferredPage?: number) => Promise<void>
  >(async () => {});
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
  const [isMobilePresentation, setIsMobilePresentation] = useState(isMobilePresentationViewport);
  const currentPageHyperlinks = hyperlinks.filter((hyperlink) => hyperlink.page === currentPage);
  const mediaReferenceSignature = mediaList
    .map(
      (media) =>
        `${media.id}:${media.url}:${media.title["zh-CN"] || ""}:${media.title["en-US"] || ""}`,
    )
    .join("|");

  const cachedDataRef = useRef<ArrayBuffer | null>(null);
  mediaReferenceMapRef.current = buildMediaReferenceMap(mediaList);
  currentPageRef.current = currentPage;

  const getLinkedMediaPage = (targetMediaId: string) => {
    const configuredHyperlink = hyperlinks.find(
      (hyperlink) => hyperlink.targetMediaId === targetMediaId,
    );
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
    const handleResize = () => {
      setIsMobilePresentation(isMobilePresentationViewport());
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    let isCancelled = false;
    const nextPdfFallbackUrl = preferredPdfUrl || getPptPdfFallbackUrl(url);

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
  }, [mediaReferenceSignature, preferredPdfUrl, url]);

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
      previewWrapper.style.padding = "0";
    }

    container
      .querySelectorAll<HTMLElement>(".pptx-preview-wrapper-next, .pptx-preview-wrapper-pagination")
      .forEach((element) => {
        element.style.display = "none";
      });

    container
      .querySelectorAll<HTMLElement>(".pptx-preview-slide-wrapper")
      .forEach((slideWrapper) => {
        slideWrapper.style.width = "100%";
        slideWrapper.style.height = "100%";
        slideWrapper.style.margin = "0";
        slideWrapper.style.background = "transparent";
        slideWrapper.style.overflow = "hidden";
        slideWrapper.style.borderRadius = "0";
        slideWrapper.style.boxShadow = "none";
      });

    container
      .querySelectorAll<HTMLElement>(".pptx-preview-slide-wrapper p")
      .forEach((paragraph) => {
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
          getHyperlinkTitleRef.current?.(targetMediaId) || targetMediaId,
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
        aspectRatio,
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
    if (renderMode !== "pptx" || !linkedMediaId || linkedMediaNonce <= 0 || totalPages <= 0) {
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
    let isDisposed = false;

    const initializePreviewer = async () => {
      const container = containerRef.current;
      if (!container) {
        return;
      }

      const { init } = await loadPptxPreviewModule();
      if (isDisposed || containerRef.current !== container) {
        return;
      }

      previewerRef.current = init(container, {
        width: stageSize.width,
        height: stageSize.height,
        mode: "slide",
      });

      if (cachedDataRef.current) {
        await renderPresentationRef.current(cachedDataRef.current, currentPageRef.current);
      }
    };

    void initializePreviewer();

    return () => {
      isDisposed = true;
      previewerRef.current?.destroy?.();
      previewerRef.current = null;
    };
  }, [renderMode, stageSize.height, stageSize.width]);

  const renderPdfFallback = () => {
    if (!pdfFallbackUrl) {
      return null;
    }

    return (
      <Suspense
        fallback={
          <ViewerModuleLoader
            theme={theme}
            message="Loading PDF viewer..."
          />
        }
      >
        <PdfViewer
          url={pdfFallbackUrl}
          theme={theme}
          presentationMode
          hyperlinks={hyperlinks}
          onHyperlinkClick={onHyperlinkClick}
          mediaList={mediaList}
          linkedMediaId={linkedMediaId}
          linkedMediaNonce={linkedMediaNonce}
          onFullscreenClick={
            onFullscreenClick && !isFullscreen ? onFullscreenClick : undefined
          }
        />
      </Suspense>
    );
  };

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
    return <div className="h-full w-full overflow-hidden">{renderPdfFallback()}</div>;
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-900">
        <div className="text-center p-8">
          <FileText className="mx-auto mb-4 h-16 w-16 text-red-500" />
          <p className={`mb-4 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
            Failed to load presentation
          </p>
          {canDownload && downloadUrl && (
            <button
              onClick={() => window.open(downloadUrl, "_blank", "noopener,noreferrer")}
              className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
            >
              <Download className="mr-1 inline h-4 w-4" />
              Download PPTX
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className="pptx-linked-deck relative flex h-full w-full items-center justify-center overflow-visible"
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

          .course-hotspot {
            transition: all 400ms cubic-bezier(0.2, 0.8, 0.2, 1);
            border: 2px solid transparent;
            transform: translateZ(0); /* Force GPU acceleration */
          }

          .course-hotspot:hover,
          .course-hotspot-active {
            background-color: rgba(34, 211, 238, 0.1);
            border-color: rgba(34, 211, 238, 0.5);
            backdrop-filter: blur(4px);
            box-shadow: 
              inset 0 0 25px rgba(34, 211, 238, 0.15),
              0 0 20px rgba(34, 211, 238, 0.25);
          }

          @keyframes hotspot-pulse {
            0% { box-shadow: 0 0 0 0 rgba(34, 211, 238, 0.5); }
            70% { box-shadow: 0 0 0 12px rgba(34, 211, 238, 0); }
            100% { box-shadow: 0 0 0 0 rgba(34, 211, 238, 0); }
          }

          .course-hotspot-dot {
            transition: all 300ms ease;
            position: absolute;
            right: 10px;
            top: 10px;
            opacity: 0.6;
          }

          .course-hotspot:hover .course-hotspot-dot,
          .course-hotspot-active .course-hotspot-dot {
            opacity: 1;
            transform: scale(1.25);
            animation: hotspot-pulse 2s infinite;
          }

          .hotspot-tooltip {
            position: absolute;
            bottom: calc(100% + 12px);
            left: 50%;
            transform: translateX(-50%) scale(0.9);
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(12px);
            color: white;
            padding: 8px 14px;
            border-radius: 10px;
            font-size: 13px;
            font-weight: 600;
            white-space: nowrap;
            opacity: 0;
            pointer-events: none;
            transition: all 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
            box-shadow: 0 15px 35px -5px rgba(0, 0, 0, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.15);
            z-index: 50;
          }

          /* Small arrow for tooltip */
          .hotspot-tooltip::after {
            content: "";
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            border-width: 6px;
            border-style: solid;
            border-color: rgba(15, 23, 42, 0.95) transparent transparent transparent;
          }

          .course-hotspot:hover .hotspot-tooltip {
            opacity: 1;
            transform: translateX(-50%) scale(1);
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
        className={`relative flex max-h-full max-w-full items-center justify-center overflow-hidden rounded-[28px] border transition-all duration-500 ${
          theme === "dark"
            ? "border-slate-700/80 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_rgba(15,23,42,0.92)_62%)] shadow-2xl shadow-black/40"
            : "border-slate-200 bg-[radial-gradient(circle_at_top,_rgba(125,211,252,0.28),_rgba(255,255,255,0.98)_62%)] shadow-xl shadow-slate-200/50"
        }`}
        onClick={() => {
          if (isMobilePresentation && currentPage < totalPages) {
            nextPage();
          }
        }}
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
                  className={`course-hotspot group relative h-full w-full overflow-visible rounded-2xl pointer-events-auto bg-transparent ${
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
                >
                  <div className="hotspot-tooltip">
                    {getHyperlinkTitle?.(hyperlink.targetMediaId) || hyperlink.targetMediaId}
                  </div>
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

          {onFullscreenClick && !isFullscreen && (
            <button
              type="button"
              data-testid="ppt-deck-fullscreen"
              onClick={(event) => {
                event.stopPropagation();
                onFullscreenClick();
              }}
              className={`absolute top-2 right-2 p-2 rounded-full transition-all z-20 ${
                theme === "dark"
                  ? "bg-black/70 text-white hover:bg-black/90"
                  : "bg-white/90 text-gray-900 shadow-lg hover:bg-white"
              }`}
              title={t("page.courses.fullscreen")}
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          )}

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

function ViewerModuleLoader({ theme, message }: { theme: "dark" | "light"; message: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-slate-900">
      <div className="text-center">
        <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-amber-500" />
        <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
          {message}
        </p>
      </div>
    </div>
  );
}

export function CourseViewer({
  course,
  theme,
  canDownloadResources = false,
  backPath = "/experiments",
  backLabel,
}: CourseViewerProps) {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language.startsWith("zh");
  const courseTitle =
    course.title[i18n.language] || course.title["zh-CN"] || course.title["en-US"] || "";
  const fallbackKnowledgeTag = normalizeKnowledgeTag(course.knowledgeTag);
  const getResourceKnowledgeTag = (resource?: { knowledgeTag?: typeof fallbackKnowledgeTag }) =>
    normalizeKnowledgeTag(resource?.knowledgeTag ?? fallbackKnowledgeTag);
  const renderKnowledgeTagBadge = (knowledgeTag = fallbackKnowledgeTag) => (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${
        knowledgeTag === "optical_device"
          ? theme === "dark"
            ? "border-teal-300/30 bg-teal-400/10 text-teal-200"
            : "border-teal-200 bg-teal-50 text-teal-700"
          : theme === "dark"
            ? "border-blue-300/25 bg-blue-400/10 text-blue-200"
            : "border-blue-200 bg-blue-50 text-blue-700"
      }`}
    >
      {getKnowledgeTagLabel(knowledgeTag, isZh)}
    </span>
  );
  const getMediaDownloadUrl = (media: MediaResource) =>
    resolveApiEndpoint(`/api/courses/media/${encodeURIComponent(media.id)}/download`);
  const getMainSlideDownloadUrl = () =>
    resolveApiEndpoint(`/api/courses/${encodeURIComponent(course.id)}/main-slide/download`);
  const openDownloadUrl = (downloadUrl: string) => {
    window.open(downloadUrl, "_blank", "noopener,noreferrer");
  };

  // 当前选中的媒体（用于超链接联动和非 PPT 降级布局）
  const [selectedMedia, setSelectedMedia] = useState<MediaResource | null>(null);
  // 当前选中的 PPT 资源（用于中间课件区）
  const [selectedPptMedia, setSelectedPptMedia] = useState<MediaResource | null>(null);
  // 预览区是否全屏
  const [isFullscreen, setIsFullscreen] = useState(false);
  // 主 PDF 是否全屏
  const [isMainSlideFullscreen, setIsMainSlideFullscreen] = useState(false);
  // PPT 课件演示是否全屏
  const [isPptFullscreen, setIsPptFullscreen] = useState(false);
  const [previewPlaybackKey, setPreviewPlaybackKey] = useState(0);
  const [shouldAutoplayPreview, setShouldAutoplayPreview] = useState(false);
  const [linkedMediaId, setLinkedMediaId] = useState<string | null>(null);
  const [linkedMediaNonce, setLinkedMediaNonce] = useState(0);
  const [discussionQuestionResource, setDiscussionQuestionResource] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [discussionQuestionSignal, setDiscussionQuestionSignal] = useState(0);
  const previewSurfaceRef = useRef<HTMLDivElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const playbackPositionRef = useRef<Record<string, number>>({});

  // 获取主 PDF（直接从 mainSlide 字段获取）
  const mainSlide = course.mainSlide;

  // 获取媒体资源列表（PDF 已分离，不再需要过滤）
  const mediaList = course.media;
  const pptMediaList = mediaList.filter((media) => media.type === "pptx");
  const previewMediaList = mediaList.filter((media) => media.type !== "pptx");
  const videoMediaList = previewMediaList.filter((media) => media.type === "video");
  const imageMediaList = previewMediaList.filter((media) => media.type === "image");
  const pdfMediaList = previewMediaList.filter((media) => media.type === "pdf");
  const hasPptxLayout = pptMediaList.length > 0;
  const activePptMedia = selectedPptMedia ?? pptMediaList[0] ?? null;
  const defaultPreviewMedia =
    previewMediaList.find((media) => media.type === "video") ?? previewMediaList[0] ?? null;
  const activePreviewMedia = selectedMedia ?? defaultPreviewMedia;
  const activeHighlightedMediaId = activePreviewMedia?.id ?? null;
  const mediaSignature = mediaList.map((media) => media.id).join("|");
  const resourceSummaryChips = [
    {
      key: "pptx",
      count: pptMediaList.length,
      label: isZh ? "个PPT" : "PPT",
      icon: <FileText className="h-3 w-3" />,
      className:
        theme === "dark"
          ? "border-amber-400/20 bg-amber-500/10 text-amber-200"
          : "border-amber-200 bg-amber-50 text-amber-700",
    },
    {
      key: "video",
      count: videoMediaList.length,
      label: isZh ? "个视频" : "videos",
      icon: <Play className="h-3 w-3" />,
      className:
        theme === "dark"
          ? "border-rose-400/20 bg-rose-500/10 text-rose-200"
          : "border-rose-200 bg-rose-50 text-rose-700",
    },
    {
      key: "pdf",
      count: pdfMediaList.length,
      label: isZh ? "份PDF" : "PDFs",
      icon: <FileText className="h-3 w-3" />,
      className:
        theme === "dark"
          ? "border-red-400/20 bg-red-500/10 text-red-200"
          : "border-red-200 bg-red-50 text-red-700",
    },
    {
      key: "image",
      count: imageMediaList.length,
      label: isZh ? "张图片" : "images",
      icon: <ImageIcon className="h-3 w-3" />,
      className:
        theme === "dark"
          ? "border-slate-700/80 bg-slate-800/80 text-slate-300"
          : "border-slate-200 bg-slate-100/90 text-slate-600",
    },
  ].filter((chip) => chip.count > 0);
  const resourceSections = [
    {
      id: "pptx",
      title: isZh ? "PPT 课件" : "Presentation decks",
      description: isZh ? "优先查看主课件与讲解页" : "Main teaching decks first",
      items: pptMediaList,
      accent: MEDIA_TYPE_COLORS.pptx,
      priority: "primary",
    },
    {
      id: "video",
      title: isZh ? "视频重点" : "Video highlights",
      description: isZh ? "建议优先预览的视频素材" : "Recommended clips to preview",
      items: videoMediaList,
      accent: MEDIA_TYPE_COLORS.video,
      priority: "primary",
    },
    {
      id: "pdf",
      title: isZh ? "PDF 资料" : "PDF resources",
      description: isZh ? "报告、海报或补充资料" : "Reports, posters, or supporting files",
      items: pdfMediaList,
      accent: MEDIA_TYPE_COLORS.pdf,
      priority: "secondary",
    },
    {
      id: "image",
      title: isZh ? "补充图片" : "Reference images",
      description: isZh ? "用于辅助说明的图片资源" : "Supporting visual references",
      items: imageMediaList,
      accent: MEDIA_TYPE_COLORS.image,
      priority: "secondary",
    },
  ].filter((section) => section.items.length > 0);

  // 获取超链接列表
  const hyperlinks = course.hyperlinks || [];
  const getHyperlinksForPpt = (pptMediaId: string | null) => {
    if (!pptMediaId) {
      return [];
    }

    const hasSinglePpt = pptMediaList.length === 1;
    return hyperlinks.filter((hyperlink) => {
      if (hyperlink.sourceMediaId) {
        return hyperlink.sourceMediaId === pptMediaId;
      }

      return hasSinglePpt;
    });
  };
  const activePptHyperlinks = getHyperlinksForPpt(activePptMedia?.id ?? null);

  // 获取媒体标题
  const getMediaTitle = (media: MediaResource | { title: Record<string, string> }) => {
    return media.title[i18n.language] || media.title["zh-CN"] || media.title["en-US"] || "";
  };

  const focusDiscussionForResource = (media: MediaResource | null) => {
    if (!media) {
      return;
    }

    setDiscussionQuestionResource({
      id: media.id,
      title: getMediaTitle(media),
    });
    setDiscussionQuestionSignal((current) => current + 1);

    const discussionElement = document.getElementById("experiment-discussion");
    discussionElement?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const getMediaTypeLabel = (type: MediaType) => {
    if (isZh) {
      if (type === "pptx") return "PPT";
      if (type === "pdf") return "PDF";
      if (type === "image") return "图片";
      return "视频";
    }

    if (type === "pptx") return "PPT";
    if (type === "pdf") return "PDF";
    if (type === "image") return "Image";
    return "Video";
  };

  const getHyperlinkTitle = (targetMediaId: string) => {
    const media = mediaList.find((item) => item.id === targetMediaId);
    return media ? getMediaTitle(media) : targetMediaId;
  };

  const persistPreviewPlaybackPosition = () => {
    const currentPreviewMedia = activePreviewMedia;
    const video = previewVideoRef.current;
    if (!currentPreviewMedia || currentPreviewMedia.type !== "video" || !video) {
      return;
    }

    playbackPositionRef.current[currentPreviewMedia.id] = video.currentTime;
  };

  const restorePreviewPlaybackPosition = (mediaId: string) => {
    const video = previewVideoRef.current;
    if (!video) {
      return;
    }

    const savedTime = playbackPositionRef.current[mediaId];
    if (savedTime == null || Number.isNaN(savedTime) || savedTime <= 0) {
      return;
    }

    const applySavedTime = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : savedTime;
      const clampedTime = Math.min(savedTime, Math.max(duration - 0.1, 0));
      if (!Number.isFinite(clampedTime) || clampedTime < 0) {
        return;
      }
      video.currentTime = clampedTime;
    };

    if (video.readyState >= 1) {
      applySavedTime();
      return;
    }

    video.addEventListener("loadedmetadata", applySavedTime, { once: true });
  };

  const handleMediaSelect = (
    media: MediaResource,
    options: { autoplay?: boolean; restart?: boolean; syncDeck?: boolean } = {},
  ) => {
    if (media.type === "pptx") {
      setSelectedPptMedia(media);
      return;
    }

    const shouldSyncDeck = options.syncDeck ?? false;
    persistPreviewPlaybackPosition();

    if (media.type === "video") {
      setShouldAutoplayPreview(options.autoplay ?? true);
      if (options.restart) {
        playbackPositionRef.current[media.id] = 0;
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

  // 处理讨论区资源点击 - 跳转到对应资源
  const handleDiscussionResourceClick = (resourceId: string) => {
    const media = mediaList.find((m) => m.id === resourceId);
    if (media) {
      handleMediaSelect(media, {
        autoplay: media.type === "video",
        restart: false,
        syncDeck: true,
      });
      // 滚动到预览区域
      const previewSection = document.getElementById("preview-surface");
      if (previewSection) {
        previewSection.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  // 切换下方预览区全屏
  const toggleFullscreen = async () => {
    const previewSurface = previewSurfaceRef.current;
    if (!previewSurface) {
      return;
    }

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await previewSurface.requestFullscreen();
      }
    } catch (error) {
      console.error("Failed to toggle preview fullscreen:", error);
    }
  };

  useEffect(() => {
    if (!hasPptxLayout) {
      setSelectedPptMedia(null);
      setSelectedMedia(null);
      setIsFullscreen(false);
      setIsPptFullscreen(false);
      setShouldAutoplayPreview(false);
      setLinkedMediaId(null);
      setLinkedMediaNonce(0);
      setDiscussionQuestionResource(null);
      setDiscussionQuestionSignal(0);
      return;
    }

    const initialPreviewMedia =
      previewMediaList.find((media) => media.type === "video") ?? previewMediaList[0] ?? null;

    setSelectedPptMedia(pptMediaList[0] ?? null);
    setSelectedMedia(initialPreviewMedia);
    setIsMainSlideFullscreen(false);
    setIsPptFullscreen(false);
    setPreviewPlaybackKey(0);
    setShouldAutoplayPreview(false);
    setLinkedMediaId(null);
    setLinkedMediaNonce(0);
    setDiscussionQuestionResource(null);
    setDiscussionQuestionSignal(0);
  }, [course.id, hasPptxLayout, mediaSignature]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenElement = document.fullscreenElement;
      const previewSurface = previewSurfaceRef.current;
      const isPreviewFullscreen = Boolean(
        fullscreenElement &&
        previewSurface &&
        (fullscreenElement === previewSurface || previewSurface.contains(fullscreenElement)),
      );

      setIsFullscreen(isPreviewFullscreen);

      if (!isPreviewFullscreen) {
        persistPreviewPlaybackPosition();
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [activePreviewMedia?.id, activePreviewMedia?.type]);

  // ESC 键退出主 PDF / PPT 全屏
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") {
        return;
      }

      if (isPptFullscreen) {
        setIsPptFullscreen(false);
        return;
      }

      if (isMainSlideFullscreen) {
        setIsMainSlideFullscreen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMainSlideFullscreen, isPptFullscreen]);

  // 全屏演示时锁定页面滚动
  useEffect(() => {
    if (!isPptFullscreen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isPptFullscreen]);

  useEffect(() => {
    if (activePreviewMedia?.type !== "video") {
      previewVideoRef.current = null;
      return;
    }

    restorePreviewPlaybackPosition(activePreviewMedia.id);
  }, [activePreviewMedia, previewPlaybackKey]);

  // 渲染主 PDF 内容
  const renderMainSlide = (isFullscreenMode = false) => {
    if (!mainSlide) return null;

    const containerClass = isFullscreenMode
      ? "w-full h-full"
      : "w-full h-full rounded-xl overflow-hidden";

    return (
      <div className={containerClass}>
        <Suspense
          fallback={
            <ViewerModuleLoader
              theme={theme}
              message="Loading PDF viewer..."
            />
          }
        >
          <PdfViewer
            url={mainSlide.url}
            theme={theme}
            onHyperlinkClick={handleHyperlinkClick}
            onFullscreenClick={isFullscreenMode ? undefined : () => setIsMainSlideFullscreen(true)}
          />
        </Suspense>
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
              downloadUrl={getMediaDownloadUrl(media)}
              canDownload={canDownloadResources}
              preferredPdfUrl={media.previewPdfUrl}
              theme={theme}
              mediaList={previewMediaList}
              activeMediaId={activeHighlightedMediaId}
            />
          );

        case "image":
          return (
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={
                isZh
                  ? `打开完整图片：${getMediaTitle(media)}`
                  : `Open full image: ${getMediaTitle(media)}`
              }
              onContextMenu={(event) => {
                if (!canDownloadResources) {
                  event.preventDefault();
                }
              }}
              className={`relative flex h-full w-full items-center justify-center border-0 bg-transparent p-0 ${
                isFullscreen ? "cursor-zoom-out" : "cursor-zoom-in"
              }`}
            >
              <img
                src={media.url}
                alt={getMediaTitle(media)}
                loading="lazy"
                decoding="async"
                className={
                  isFullscreen
                    ? "block h-full w-full bg-black object-contain"
                    : `block h-auto w-auto max-h-full max-w-full rounded-[28px] border bg-black transition-all duration-500 ${
                        theme === "dark"
                          ? "border-slate-700/80 shadow-2xl shadow-black/40"
                          : "border-slate-200 shadow-xl shadow-slate-200/50"
                      }`
                }
              />
            </button>
          );

        case "pdf":
          return (
            <div className="h-full w-full overflow-hidden rounded-[28px]">
              <Suspense
                fallback={
                  <ViewerModuleLoader
                    theme={theme}
                    message="Loading PDF viewer..."
                  />
                }
              >
                <PdfViewer
                  url={media.url}
                  theme={theme}
                  onFullscreenClick={isFullscreen ? undefined : toggleFullscreen}
                />
              </Suspense>
            </div>
          );

        case "video":
          return (
            <video
              ref={previewVideoRef}
              key={`${media.id}-${previewPlaybackKey}`}
              src={getPreferredMediaUrl(media)}
              controls
              controlsList="nodownload noremoteplayback"
              playsInline
              autoPlay={shouldAutoplayPreview}
              preload="metadata"
              onContextMenu={(event) => {
                if (!canDownloadResources) {
                  event.preventDefault();
                }
              }}
              className={
                isFullscreen
                  ? "block h-full w-full bg-black object-contain"
                  : `block h-auto w-auto max-h-full max-w-full rounded-[28px] border bg-black transition-all duration-500 ${
                      theme === "dark"
                        ? "border-slate-700/80 shadow-2xl shadow-black/40"
                        : "border-slate-200 shadow-xl shadow-slate-200/50"
                    }`
              }
              onLoadedMetadata={() => restorePreviewPlaybackPosition(media.id)}
              onTimeUpdate={() => {
                if (!previewVideoRef.current) {
                  return;
                }
                playbackPositionRef.current[media.id] = previewVideoRef.current.currentTime;
              }}
              onPause={() => {
                if (!previewVideoRef.current) {
                  return;
                }
                playbackPositionRef.current[media.id] = previewVideoRef.current.currentTime;
              }}
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

    return (
      <div
        ref={previewSurfaceRef}
        id="preview-surface"
        className={`flex h-full w-full items-center justify-center overflow-visible ${isFullscreen ? "bg-black" : ""}`}
      >
        {renderMediaBody()}
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* 上方区域：主 PDF 永久显示 */}
      {!hasPptxLayout && mainSlide && (
        <div
          className={`rounded-2xl p-4 mb-6 ${theme === "dark" ? "bg-slate-800/50" : "bg-white"}`}
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            {renderKnowledgeTagBadge(getResourceKnowledgeTag(mainSlide))}
            {canDownloadResources && (
              <button
                onClick={() => openDownloadUrl(getMainSlideDownloadUrl())}
                className={`rounded-xl p-2.5 transition-all hover:scale-110 active:scale-95 ${
                  theme === "dark"
                    ? "text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700"
                    : "text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm"
                }`}
                title={t("page.courses.download")}
              >
                <Download className="h-5 w-5" />
              </button>
            )}
          </div>
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
          className={`flex min-h-[calc(100vh-64px)] flex-col overflow-visible border-t transition-all duration-300 lg:h-[calc(100vh-64px)] lg:flex-row lg:overflow-hidden ${
            theme === "dark"
              ? "border-slate-700/70 bg-slate-900/40"
              : "border-slate-200 bg-white/50"
          }`}
        >
          {/* 左侧固定边栏：资源总览 */}
          <aside
            className={`persistent-scrollbar w-full flex-shrink-0 overflow-visible border-b transition-all duration-300 lg:h-full lg:w-[236px] lg:overflow-y-auto lg:border-b-0 lg:border-r xl:w-[260px] 2xl:w-[288px] ${
              theme === "dark"
                ? "border-slate-700/70 bg-slate-800/40"
                : "border-slate-200 bg-slate-50/50"
            }`}
          >
            <div className="p-4 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <div
                      className={`h-1 w-6 rounded-full ${
                        theme === "dark" ? "bg-amber-400/60" : "bg-amber-600/60"
                      }`}
                    />
                    <p
                      className={`text-[11px] font-bold uppercase tracking-[0.18em] ${
                        theme === "dark" ? "text-amber-300/90" : "text-amber-700"
                      }`}
                    >
                      {isZh ? "资源总览" : "Resources"}
                    </p>
                  </div>
                  <h2
                    className={`text-xl font-bold leading-tight ${
                      theme === "dark" ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {courseTitle}
                  </h2>
                </div>
                <Link
                  to={backPath}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold shadow-sm transition-all hover:scale-105 active:scale-95 ${
                    theme === "dark"
                      ? "bg-slate-700 text-slate-200 hover:bg-slate-600"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  {backLabel || (isZh ? "返回" : "Back")}
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {resourceSummaryChips.map((chip) => (
                  <div
                    key={chip.key}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold shadow-sm transition-all hover:scale-[1.03] ${chip.className}`}
                  >
                    <span className="opacity-80">{chip.icon}</span>
                    <span>
                      <span className="text-xs">{chip.count}</span> {chip.label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-2 space-y-4">
                {resourceSections.map((section) => (
                  <div
                    key={section.id}
                    className={`rounded-[20px] border transition-all duration-300 ${
                      section.priority === "primary"
                        ? theme === "dark"
                          ? "border-slate-600/80 bg-slate-900/72 p-3 shadow-lg shadow-black/15"
                          : "border-slate-200 bg-white p-3 shadow-md shadow-slate-200/45"
                        : theme === "dark"
                          ? "border-slate-700/75 bg-slate-900/40 p-2.5"
                          : "border-slate-200/90 bg-white/80 p-2.5 shadow-sm"
                    }`}
                  >
                    <div className="mb-2.5 flex items-start justify-between gap-2 px-1">
                      <div>
                        <div
                          className={`mb-2 rounded-full ${
                            section.priority === "primary" ? "h-1.5 w-12" : "h-1 w-8 opacity-70"
                          }`}
                          style={{ backgroundColor: section.accent }}
                        />
                        <p
                          className="text-[13px] font-bold"
                          style={{ color: section.accent }}
                        >
                          {section.title}
                        </p>
                        <p
                          className={`mt-0.5 line-clamp-1 text-[10px] leading-4 font-medium ${
                            section.priority === "primary"
                              ? theme === "dark"
                                ? "text-slate-300"
                                : "text-slate-600"
                              : theme === "dark"
                                ? "text-slate-400"
                                : "text-slate-500"
                          }`}
                        >
                          {section.description}
                        </p>
                      </div>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{
                          backgroundColor: `${section.accent}18`,
                          color: section.accent,
                        }}
                      >
                        {section.items.length}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {section.items.map((media) => {
                        const isPrimarySection = section.priority === "primary";
                        const isCurrentPpt = media.id === activePptMedia?.id;
                        const isCurrentPreview =
                          media.type === "pptx" ? false : media.id === activePreviewMedia?.id;
                        const isActive = isCurrentPpt || isCurrentPreview;

                        return (
                          <button
                            key={media.id}
                            onClick={() => handleMediaSelect(media)}
                            className={`group relative w-full rounded-[14px] border text-left transition-all duration-300 ${
                              isActive
                                ? theme === "dark"
                                  ? "border-slate-500 bg-slate-700/80 shadow-md shadow-slate-950/40"
                                  : "border-slate-300 bg-white shadow-md shadow-slate-200/50"
                                : theme === "dark"
                                  ? "border-slate-700 bg-slate-800/70 hover:border-slate-600 hover:bg-slate-750"
                                  : "border-slate-100 bg-white/60 hover:border-slate-200 hover:bg-white"
                            } ${isPrimarySection ? "px-2.5 py-2.5" : "px-2 py-2"} hover:-translate-y-0.5`}
                          >
                            <div className="flex items-start gap-2.5">
                              <div
                                className={`flex flex-shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${
                                  isPrimarySection ? "h-8 w-8" : "h-7 w-7"
                                }`}
                                style={{
                                  backgroundColor: isActive
                                    ? `${MEDIA_TYPE_COLORS[media.type]}24`
                                    : `${MEDIA_TYPE_COLORS[media.type]}12`,
                                  color: MEDIA_TYPE_COLORS[media.type],
                                }}
                              >
                                <span className="scale-90">{MEDIA_TYPE_ICONS[media.type]}</span>
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <p
                                    className={`line-clamp-2 font-bold ${
                                      isPrimarySection
                                        ? "text-[12px] leading-[1.2rem]"
                                        : "text-[11px] leading-[1.1rem]"
                                    } ${theme === "dark" ? "text-white" : "text-slate-900"}`}
                                  >
                                    {getMediaTitle(media)}
                                  </p>
                                </div>

                                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                  {renderKnowledgeTagBadge(getResourceKnowledgeTag(media))}
                                  <span
                                    className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                                    style={{
                                      backgroundColor: `${MEDIA_TYPE_COLORS[media.type]}18`,
                                      color: MEDIA_TYPE_COLORS[media.type],
                                    }}
                                  >
                                    {getMediaTypeLabel(media.type)}
                                  </span>
                                  {media.duration && (
                                    <span
                                      className={`inline-flex items-center gap-1 text-[10px] font-medium ${
                                        theme === "dark" ? "text-slate-400" : "text-slate-500"
                                      }`}
                                    >
                                      <Clock className="h-3 w-3" />
                                      {Math.floor(media.duration / 60)}:
                                      {(media.duration % 60).toString().padStart(2, "0")}
                                    </span>
                                  )}
                                </div>

                                {isCurrentPreview && (
                                  <div className="mt-1.5">
                                    <span className="rounded-full bg-cyan-500/15 px-1.5 py-0.5 text-[9px] font-bold text-cyan-500 uppercase tracking-wider">
                                      {isZh ? "正在预览" : "Previewing"}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => {
                    const discussionElement = document.getElementById("experiment-discussion");
                    discussionElement?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className={`w-full rounded-[20px] border p-4 text-left transition-all duration-300 hover:-translate-y-1 ${
                    theme === "dark"
                      ? "border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20"
                      : "border-indigo-200 bg-indigo-50 hover:bg-indigo-100 shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                      <p
                        className={`text-[13px] font-bold ${theme === "dark" ? "text-indigo-200" : "text-indigo-900"}`}
                      >
                        {isZh ? "参与讨论" : "Join Discussion"}
                      </p>
                      <p
                        className={`text-[10px] font-medium opacity-80 ${theme === "dark" ? "text-indigo-300" : "text-indigo-700"}`}
                      >
                        {isZh ? "与同学老师实时互动" : "Discuss with classmates"}
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </aside>

          {/* 右侧：主内容区域（包括演示、视频和讨论） */}
          <main className="flex-1 overflow-visible lg:h-full lg:overflow-y-auto persistent-scrollbar">
            <div className="mx-auto max-w-[1720px] space-y-4 p-3 lg:p-4">
              {/* 第一行：演示 + 视频 */}
              <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.84fr)] 2xl:grid-cols-[minmax(0,1.26fr)_minmax(400px,0.8fr)]">
                {/* 课件演示区域 */}
                <section className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3 px-1">
                    <div>
                      <h3
                        className={`text-xl font-bold tracking-tight ${
                          theme === "dark" ? "text-white" : "text-slate-900"
                        }`}
                      >
                        {activePptMedia
                          ? getMediaTitle(activePptMedia)
                          : isZh
                            ? "暂无课件"
                            : "No deck"}
                      </h3>
                      {activePptMedia ? (
                        <div className="mt-2">
                          {renderKnowledgeTagBadge(getResourceKnowledgeTag(activePptMedia))}
                        </div>
                      ) : null}
                    </div>

                    {activePptMedia && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          data-testid="ppt-fullscreen-toggle"
                          onClick={() => setIsPptFullscreen((current) => !current)}
                          className={`rounded-xl p-2.5 transition-all hover:scale-110 active:scale-95 ${
                            theme === "dark"
                              ? "text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700"
                              : "text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm"
                          }`}
                          title={
                            isPptFullscreen
                              ? t("page.courses.exitfullscreen")
                              : t("page.courses.fullscreen")
                          }
                        >
                          {isPptFullscreen ? (
                            <Minimize2 className="h-5 w-5" />
                          ) : (
                            <Maximize2 className="h-5 w-5" />
                          )}
                        </button>
                        {canDownloadResources && (
                          <button
                            onClick={() => openDownloadUrl(getMediaDownloadUrl(activePptMedia))}
                            className={`rounded-xl p-2.5 transition-all hover:scale-110 active:scale-95 ${
                              theme === "dark"
                                ? "text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700"
                                : "text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm"
                            }`}
                            title={t("page.courses.download")}
                          >
                            <Download className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div
                    className={
                      isPptFullscreen
                        ? "fixed inset-0 z-[9999] flex items-center justify-center bg-black"
                        : "flex h-[clamp(188px,58vw,276px)] max-h-[calc(100svh-12rem)] items-center justify-center overflow-visible transition-all duration-500 sm:h-[clamp(220px,54vw,340px)] md:h-[380px] lg:h-[460px] lg:max-h-none xl:h-[500px] 2xl:h-[560px]"
                    }
                  >
                    {isPptFullscreen && (
                      <button
                        type="button"
                        data-testid="ppt-fullscreen-exit"
                        onClick={() => setIsPptFullscreen(false)}
                        className="absolute top-4 right-4 z-20 rounded-lg bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
                        title={t("page.courses.exitfullscreen")}
                      >
                        <Minimize2 className="h-5 w-5" />
                      </button>
                    )}
                    {activePptMedia ? (
                      <PptxViewer
                        key={activePptMedia.id}
                        url={activePptMedia.url}
                        downloadUrl={getMediaDownloadUrl(activePptMedia)}
                        canDownload={canDownloadResources}
                        preferredPdfUrl={activePptMedia.previewPdfUrl}
                        theme={theme}
                        hyperlinks={activePptHyperlinks}
                        onHyperlinkClick={handleHyperlinkClick}
                        getHyperlinkTitle={getHyperlinkTitle}
                        mediaList={previewMediaList}
                        linkedMediaId={linkedMediaId}
                        linkedMediaNonce={linkedMediaNonce}
                        activeMediaId={activeHighlightedMediaId}
                        isFullscreen={isPptFullscreen}
                        onFullscreenClick={() => setIsPptFullscreen((current) => !current)}
                      />
                    ) : (
                      <div
                        className={`flex h-full w-full items-center justify-center p-12 text-center rounded-[28px] border transition-all duration-500 ${
                          theme === "dark"
                            ? "border-slate-700/80 bg-slate-950/80 shadow-2xl shadow-black/40"
                            : "border-slate-200 bg-white shadow-xl shadow-slate-200/50"
                        }`}
                      >
                        <div>
                          <FileText
                            className={`mx-auto mb-4 h-12 w-12 opacity-20 ${theme === "dark" ? "text-white" : "text-slate-900"}`}
                          />
                          <p
                            className={`text-sm font-medium ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}
                          >
                            {isZh ? "当前课程没有可播放的 PPT 课件" : "No presentation available"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* 资源预览区域 */}
                <section className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3 px-1">
                    <div>
                      <h3
                        className={`text-lg font-bold tracking-tight ${
                          theme === "dark" ? "text-white" : "text-slate-900"
                        }`}
                      >
                        {activePreviewMedia
                          ? getMediaTitle(activePreviewMedia)
                          : isZh
                            ? "暂无实验媒体"
                            : "No experiment media"}
                      </h3>
                    </div>

                    {activePreviewMedia && (
                      <div className="flex items-center gap-2">
                        {(activePreviewMedia.type === "video" ||
                          activePreviewMedia.type === "image") && (
                          <button
                            data-testid="preview-fullscreen-toggle"
                            onClick={toggleFullscreen}
                            className={`rounded-xl p-2.5 transition-all hover:scale-110 active:scale-95 ${
                              theme === "dark"
                                ? "text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700"
                                : "text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm"
                            }`}
                            title={
                              isFullscreen
                                ? t("page.courses.exitfullscreen")
                                : t("page.courses.fullscreen")
                            }
                          >
                            {isFullscreen ? (
                              <Minimize2 className="h-5 w-5" />
                            ) : (
                              <Maximize2 className="h-5 w-5" />
                            )}
                          </button>
                        )}
                        {canDownloadResources && (
                          <button
                            onClick={() => openDownloadUrl(getMediaDownloadUrl(activePreviewMedia))}
                            className={`rounded-xl p-2.5 transition-all hover:scale-110 active:scale-95 ${
                              theme === "dark"
                                ? "text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700"
                                : "text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm"
                            }`}
                            title={t("page.courses.download")}
                          >
                            <Download className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div
                    className="aspect-video lg:aspect-auto lg:h-[380px] xl:h-[420px] 2xl:h-[480px] flex items-center justify-center overflow-visible transition-all duration-500"
                  >
                    {activePreviewMedia ? (
                      renderMedia(activePreviewMedia)
                    ) : (
                      <div
                        className={`flex h-full w-full items-center justify-center px-12 text-center rounded-[28px] border transition-all duration-500 ${
                          theme === "dark"
                            ? "border-slate-700/80 bg-slate-950/80 shadow-2xl shadow-black/40"
                            : "border-slate-200 bg-white shadow-xl shadow-slate-200/50"
                        }`}
                      >
                        <div className="max-w-[240px]">
                          <div
                            className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl opacity-20 ${theme === "dark" ? "bg-white/10 text-white" : "bg-slate-900/10 text-slate-900"}`}
                          >
                            <Play className="h-8 w-8" />
                          </div>
                          <p
                            className={`text-sm font-medium leading-relaxed ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}
                          >
                            {isZh
                              ? "当前课程没有可播放的媒体资源。"
                              : "This course does not include a playable media resource."}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 媒体详情卡片 */}
                  <div
                    className={`rounded-[22px] border px-4 py-3 transition-all duration-300 ${
                      theme === "dark"
                        ? "border-slate-700/80 bg-slate-900/80 shadow-lg shadow-black/20"
                        : "border-slate-200 bg-white/95 shadow-md shadow-slate-200/40"
                    }`}
                  >
                    {activePreviewMedia ? (
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          {renderKnowledgeTagBadge(getResourceKnowledgeTag(activePreviewMedia))}
                          <span
                            className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
                            style={{
                              backgroundColor: `${MEDIA_TYPE_COLORS[activePreviewMedia.type]}18`,
                              color: MEDIA_TYPE_COLORS[activePreviewMedia.type],
                            }}
                          >
                            {getMediaTypeLabel(activePreviewMedia.type)}
                          </span>
                          {activePreviewMedia.type === "video" && activePreviewMedia.duration && (
                            <span
                              className={`inline-flex items-center gap-1.5 text-xs font-bold ${
                                theme === "dark" ? "text-slate-400" : "text-slate-500"
                              }`}
                            >
                              <Clock className="h-3.5 w-3.5" />
                              {Math.floor(activePreviewMedia.duration / 60)}:
                              {(activePreviewMedia.duration % 60).toString().padStart(2, "0")}
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => focusDiscussionForResource(activePreviewMedia)}
                          className={`text-[11px] font-bold flex items-center gap-1.5 transition-colors ${
                            theme === "dark"
                              ? "text-cyan-400 hover:text-cyan-300"
                              : "text-cyan-600 hover:text-cyan-700"
                          }`}
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          {isZh ? "对此资源提问" : "Ask about this"}
                        </button>
                      </div>
                    ) : (
                      <p
                        className={`text-sm font-medium ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}
                      >
                        {isZh ? "当前没有可展示的媒体信息。" : "No media metadata available."}
                      </p>
                    )}
                  </div>
                </section>
              </div>

              {/* 第二行：意见反馈 / 讨论区 */}
              <div
                id="experiment-discussion"
                className="pt-4 border-t border-slate-200 dark:border-slate-700/60 mt-4"
              >
                <div className="rounded-[24px] overflow-hidden shadow-sm">
                  <ExperimentDiscussionSection
                    courseId={course.id}
                    courseTitle={courseTitle}
                    theme={theme}
                    accentColor={course.color}
                    questionResource={discussionQuestionResource}
                    questionSignal={discussionQuestionSignal}
                    onResourceClick={handleDiscussionResourceClick}
                  />
                </div>
              </div>
            </div>
          </main>
        </div>
      )}

      {/* 下方区域：非 PPT 布局时的降级显示 */}
      {!hasPptxLayout && mediaList.length > 0 && (
        <div className="max-w-[1400px] mx-auto p-4 lg:p-6 space-y-6">
          <div
            className={`rounded-3xl p-6 ${theme === "dark" ? "bg-slate-800/50" : "bg-white shadow-sm border border-slate-100"}`}
          >
            <div className="flex flex-col lg:flex-row gap-6">
              {/* 左侧：资源列表 */}
              <div className="w-full lg:w-64 flex-shrink-0 space-y-1.5 max-h-[60vh] overflow-y-auto persistent-scrollbar pr-2">
                <p
                  className={`text-[10px] font-bold uppercase tracking-wider mb-3 px-2 ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}
                >
                  {isZh ? "可选资源" : "Available Media"}
                </p>
                {mediaList.map((media) => (
                  <button
                    key={media.id}
                    onClick={() => handleMediaSelect(media)}
                    className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-300 ${
                      selectedMedia?.id === media.id
                        ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30 -translate-y-0.5"
                        : theme === "dark"
                          ? "bg-slate-700/50 hover:bg-slate-700 text-slate-300"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <div
                      className="rounded-lg p-1.5 flex-shrink-0"
                      style={{
                        backgroundColor:
                          selectedMedia?.id === media.id
                            ? "rgba(255,255,255,0.2)"
                            : `${MEDIA_TYPE_COLORS[media.type]}20`,
                      }}
                    >
                      <span
                        className="scale-90 inline-block"
                        style={{
                          color:
                            selectedMedia?.id === media.id
                              ? "white"
                              : MEDIA_TYPE_COLORS[media.type],
                        }}
                      >
                        {MEDIA_TYPE_ICONS[media.type]}
                      </span>
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <span className="block text-xs font-bold truncate">
                        {getMediaTitle(media)}
                      </span>
                      <span className="mt-1 inline-flex">
                        {renderKnowledgeTagBadge(getResourceKnowledgeTag(media))}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* 右侧：预览区域 */}
              <div className="flex-1 min-w-0">
                {selectedMedia ? (
                  <div className="space-y-4">
                    <div className="aspect-video flex items-center justify-center overflow-visible">
                      {renderMedia(selectedMedia)}
                    </div>
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-4">
                        <div
                          className="rounded-xl p-2"
                          style={{ backgroundColor: `${MEDIA_TYPE_COLORS[selectedMedia.type]}15` }}
                        >
                          <span style={{ color: MEDIA_TYPE_COLORS[selectedMedia.type] }}>
                            {MEDIA_TYPE_ICONS[selectedMedia.type]}
                          </span>
                        </div>
                        <div>
                          <h3
                            className={`text-base font-bold ${theme === "dark" ? "text-white" : "text-slate-900"}`}
                          >
                            {getMediaTitle(selectedMedia)}
                          </h3>
                          <div className="mt-1">
                            {renderKnowledgeTagBadge(getResourceKnowledgeTag(selectedMedia))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => focusDiscussionForResource(selectedMedia)}
                          className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                            theme === "dark"
                              ? "bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30"
                              : "bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
                          }`}
                        >
                          {isZh ? "对此资源提问" : "Ask about this"}
                        </button>
                        <button
                          onClick={toggleFullscreen}
                          className={`rounded-xl p-2.5 transition-colors ${
                            theme === "dark"
                              ? "bg-slate-700 text-slate-300"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          <Maximize2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video flex items-center justify-center rounded-[24px] border-2 border-dashed border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-medium opacity-40">选择资源查看预览</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 讨论区 - 降级布局时也在下方 */}
          <div
            id="experiment-discussion"
            className="pt-4"
          >
            <ExperimentDiscussionSection
              courseId={course.id}
              courseTitle={courseTitle}
              theme={theme}
              accentColor={course.color}
              questionResource={discussionQuestionResource}
              questionSignal={discussionQuestionSignal}
              onResourceClick={handleDiscussionResourceClick}
            />
          </div>
        </div>
      )}
    </div>
  );
}
