/**
 * PdfViewer - PDF 查看器
 *
 * 支持横屏 PPT 式翻页和竖屏垂直滚动
 * 支持在 PDF 上渲染可点击的超链接区域
 */

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Document,
  Page,
  pdfjs,
} from "react-pdf";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
  Maximize2,
} from "lucide-react";
import type { MediaResource, PdfHyperlink } from "@/data/courses";
import {
  buildMediaReferenceMap,
  extractReferenceKeysFromText,
  normalizeMediaReferenceText,
} from "./mediaReference";

import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface PdfTextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
}

interface PdfTextLine {
  left: number;
  top: number;
  right: number;
  bottom: number;
  centerY: number;
  text: string;
}

const PDF_REFERENCE_OVERLAY_PADDING = 8;

function isPdfTextItem(item: unknown): item is PdfTextItem {
  return (
    typeof item === "object" &&
    item !== null &&
    "str" in item &&
    typeof (item as { str?: unknown }).str === "string" &&
    "transform" in item &&
    Array.isArray((item as { transform?: unknown }).transform)
  );
}

function appendItemToLine(lines: PdfTextLine[], item: PdfTextLine) {
  const lineThreshold = Math.max(10, (item.bottom - item.top) * 0.6);
  const existingLine = lines.find(
    (line) => Math.abs(line.centerY - item.centerY) <= lineThreshold
  );

  if (!existingLine) {
    lines.push(item);
    return;
  }

  existingLine.left = Math.min(existingLine.left, item.left);
  existingLine.top = Math.min(existingLine.top, item.top);
  existingLine.right = Math.max(existingLine.right, item.right);
  existingLine.bottom = Math.max(existingLine.bottom, item.bottom);
  existingLine.centerY = (existingLine.top + existingLine.bottom) / 2;
  existingLine.text += item.text;
}

async function detectReferenceHyperlinks(
  pdfDocument: PDFDocumentProxy,
  mediaList: MediaResource[]
): Promise<PdfHyperlink[]> {
  if (mediaList.length === 0) {
    return [];
  }

  const referenceMap = buildMediaReferenceMap(mediaList);
  if (Object.keys(referenceMap).length === 0) {
    return [];
  }

  const detectedLinks: PdfHyperlink[] = [];

  for (let pageIndex = 0; pageIndex < pdfDocument.numPages; pageIndex += 1) {
    const pageNumber = pageIndex + 1;
    const page = await pdfDocument.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1 });
    const textContent = await page.getTextContent();
    const lines: PdfTextLine[] = [];
    const textItems: PdfTextLine[] = [];

    textContent.items.forEach((rawItem) => {
      if (!isPdfTextItem(rawItem)) {
        return;
      }

      const transformed = pdfjs.Util.transform(viewport.transform, rawItem.transform);
      const width = Math.max(0, rawItem.width);
      const height = Math.max(0, rawItem.height);
      const left = transformed[4];
      const top = transformed[5] - height;

      textItems.push({
        left,
        top,
        right: left + width,
        bottom: top + height,
        centerY: top + height / 2,
        text: rawItem.str,
      });
    });

    textItems
      .sort((a, b) => {
        if (Math.abs(a.top - b.top) > 4) {
          return a.top - b.top;
        }
        return a.left - b.left;
      })
      .forEach((item) => appendItemToLine(lines, item));

    lines.forEach((line, lineIndex) => {
      const normalizedText = normalizeMediaReferenceText(line.text);
      const referenceKeys = extractReferenceKeysFromText(normalizedText);

      if (referenceKeys.length === 0) {
        return;
      }

      referenceKeys.forEach((referenceKey, referenceIndex) => {
        const targetMediaId = referenceMap[referenceKey];
        if (!targetMediaId) {
          return;
        }

        const left = Math.max(0, line.left - PDF_REFERENCE_OVERLAY_PADDING);
        const top = Math.max(0, line.top - PDF_REFERENCE_OVERLAY_PADDING);
        const right = Math.min(viewport.width, line.right + PDF_REFERENCE_OVERLAY_PADDING);
        const bottom = Math.min(viewport.height, line.bottom + PDF_REFERENCE_OVERLAY_PADDING);
        const width = Math.max(0, right - left);
        const height = Math.max(0, bottom - top);

        detectedLinks.push({
          id: `pdf-auto-${pageNumber}-${lineIndex}-${referenceIndex}-${targetMediaId}`,
          page: pageNumber,
          x: (left + width / 2) / viewport.width,
          y: (top + height / 2) / viewport.height,
          width: width / viewport.width,
          height: height / viewport.height,
          targetMediaId,
        });
      });
    });
  }

  return detectedLinks;
}

interface PdfViewerProps {
  url: string;
  theme: "dark" | "light";
  /** PDF 上的超链接区域 */
  hyperlinks?: PdfHyperlink[];
  /** Used to auto-detect clickable video/photo references from PDF text */
  mediaList?: MediaResource[];
  /** 点击超链接的回调 */
  onHyperlinkClick?: (targetMediaId: string) => void;
  /** 点击全屏按钮的回调 */
  onFullscreenClick?: () => void;
  /** 当前需要联动到课件页的媒体 */
  linkedMediaId?: string | null;
  /** 相同媒体重复选择时用于触发重新联动 */
  linkedMediaNonce?: number;
  /** 当前正在播放/激活的媒体 ID */
  activeMediaId?: string | null;
}

function PdfViewer({
  url,
  theme,
  hyperlinks = [],
  mediaList = [],
  onHyperlinkClick,
  onFullscreenClick,
  linkedMediaId = null,
  linkedMediaNonce = 0,
  activeMediaId = null,
}: PdfViewerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // PDF 状态
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detectedHyperlinks, setDetectedHyperlinks] = useState<PdfHyperlink[]>([]);

  // 页面尺寸状态
  const [pageDimensions, setPageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [scale, setScale] = useState<number>(1);

  // 屏幕方向检测
  const [isLandscape, setIsLandscape] = useState<boolean>(
    typeof window !== "undefined" ? window.innerWidth > window.innerHeight : false
  );

  // 监听屏幕方向变化
  useEffect(() => {
    const handleResize = () => {
      const landscape = window.innerWidth > window.innerHeight;
      setIsLandscape(landscape);
      setCurrentPage(1);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 计算自适应缩放比例
  useEffect(() => {
    if (!wrapperRef.current || !pageDimensions) return;

    const calculateScale = () => {
      const container = wrapperRef.current!;
      const { width: containerWidth, height: containerHeight } = container.getBoundingClientRect();
      const { width: pageWidth, height: pageHeight } = pageDimensions;

      let newScale = 1;

      if (isLandscape) {
        // 横屏模式：占满整个容器
        const scaleX = containerWidth / pageWidth;
        const scaleY = containerHeight / pageHeight;
        newScale = Math.min(scaleX, scaleY);
      } else {
        // 竖屏模式：占满容器宽度
        newScale = containerWidth / pageWidth;
      }

      setScale(Math.max(0.1, newScale));
    };

    calculateScale();

    const resizeObserver = new ResizeObserver(calculateScale);
    resizeObserver.observe(wrapperRef.current);

    return () => resizeObserver.disconnect();
  }, [isLandscape, pageDimensions]);

  // 获取页面尺寸
  const onPageLoadSuccess = useCallback((page: PDFPageProxy) => {
    const { width, height } = page.getViewport({ scale: 1 });
    setPageDimensions({ width, height });
    setIsLoading(false);
  }, []);

  // PDF 加载成功
  const onDocumentLoadSuccess = useCallback((nextPdf: PDFDocumentProxy) => {
    setPdfDocument(nextPdf);
    setDetectedHyperlinks([]);
    setError(null);
    setNumPages(nextPdf.numPages);
    setCurrentPage(1);
  }, []);

  // PDF 加载失败
  const onDocumentLoadError = useCallback((err: Error) => {
    console.error("Error loading PDF:", err);
    setError(err.message);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    setPdfDocument(null);
    setDetectedHyperlinks([]);
    setError(null);
    setNumPages(0);
    setCurrentPage(1);
    setIsLoading(true);
  }, [url]);

  useEffect(() => {
    let isCancelled = false;

    const loadDetectedHyperlinks = async () => {
      if (!pdfDocument || mediaList.length === 0 || hyperlinks.length > 0) {
        setDetectedHyperlinks([]);
        return;
      }

      try {
        const links = await detectReferenceHyperlinks(pdfDocument, mediaList);
        if (!isCancelled) {
          setDetectedHyperlinks(links);
        }
      } catch (detectionError) {
        console.error("Error detecting PDF reference hyperlinks:", detectionError);
        if (!isCancelled) {
          setDetectedHyperlinks([]);
        }
      }
    };

    void loadDetectedHyperlinks();

    return () => {
      isCancelled = true;
    };
  }, [hyperlinks.length, mediaList, pdfDocument]);

  const goToPage = useCallback((page: number) => {
    if (numPages <= 0) {
      return;
    }

    const safePage = Math.min(Math.max(page, 1), numPages);
    setCurrentPage(safePage);

    if (isLandscape || !scrollContainerRef.current) {
      return;
    }

    const pageWrappers = scrollContainerRef.current.querySelectorAll<HTMLElement>(".pdf-page-wrapper");
    const targetPage = pageWrappers[safePage - 1];
    if (!targetPage) {
      return;
    }

    window.requestAnimationFrame(() => {
      targetPage.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [isLandscape, numPages]);

  // 横屏模式：翻页控制
  const nextPage = useCallback(() => {
    if (currentPage < numPages) {
      goToPage(currentPage + 1);
    }
  }, [currentPage, goToPage, numPages]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  }, [currentPage, goToPage]);

  // 键盘控制（横屏模式）
  useEffect(() => {
    if (!isLandscape) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        nextPage();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        prevPage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLandscape, nextPage, prevPage]);

  // 竖屏模式：滚动时更新当前页码
  useEffect(() => {
    if (isLandscape || !scrollContainerRef.current) return;

    const scrollContainer = scrollContainerRef.current;
    const pages = scrollContainer.querySelectorAll(".pdf-page-wrapper");

    const handleScroll = () => {
      const scrollTop = scrollContainer.scrollTop;
      const containerHeight = scrollContainer.clientHeight;

      let currentPageNum = 1;
      pages.forEach((page, index) => {
        const pageTop = (page as HTMLElement).offsetTop;

        if (scrollTop >= pageTop - containerHeight / 2) {
          currentPageNum = index + 1;
        }
      });

      setCurrentPage(currentPageNum);
    };

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, [isLandscape, numPages]);

  // 横屏模式：滚轮翻页
  useEffect(() => {
    if (!isLandscape || !scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    let wheelTimeout: ReturnType<typeof setTimeout> | null = null;
    let scrollAccumulator = 0;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      scrollAccumulator += e.deltaY;

      if (wheelTimeout) clearTimeout(wheelTimeout);

      wheelTimeout = setTimeout(() => {
        if (Math.abs(scrollAccumulator) > 50) {
          if (scrollAccumulator > 0) {
            nextPage();
          } else {
            prevPage();
          }
          scrollAccumulator = 0;
        }
      }, 100);
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
      if (wheelTimeout) clearTimeout(wheelTimeout);
    };
  }, [isLandscape, nextPage, prevPage]);

  // 触摸滑动支持
  const [touchStart, setTouchStart] = useState<number>(0);
  const activeHyperlinks = hyperlinks.length > 0 ? hyperlinks : detectedHyperlinks;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isLandscape) return;

    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        nextPage();
      } else {
        prevPage();
      }
    }
  }, [isLandscape, touchStart, nextPage, prevPage]);

  useEffect(() => {
    if (!linkedMediaId || linkedMediaNonce <= 0) {
      return;
    }

    const targetHyperlink = activeHyperlinks.find(
      (hyperlink) => hyperlink.targetMediaId === linkedMediaId
    );

    if (!targetHyperlink) {
      return;
    }

    goToPage(targetHyperlink.page);
  }, [activeHyperlinks, goToPage, linkedMediaId, linkedMediaNonce]);

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-900">
        <div className="text-center p-8">
          <FileText className="mx-auto mb-4 h-16 w-16 text-red-500" />
          <p className={`mb-4 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
            Failed to load PDF
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className="relative w-full h-full overflow-hidden"
    >
      <style>
        {`
          .pdf-course-hotspot {
            transform: translateY(0) scale(1);
            transition:
              transform 200ms ease,
              box-shadow 200ms ease,
              border-color 200ms ease,
              background-color 200ms ease,
              opacity 200ms ease;
          }

          .pdf-course-hotspot:hover,
          .pdf-course-hotspot:focus-visible,
          .pdf-course-hotspot-active {
            transform: translateY(-6px) scale(1.02);
          }

          .pdf-course-hotspot-active {
            animation: hotspot-pulse 2s infinite ease-in-out;
          }

          @keyframes hotspot-pulse {
            0%, 100% {
              box-shadow: 0 12px 32px rgba(34, 211, 238, 0.2);
            }
            50% {
              box-shadow: 0 16px 40px rgba(34, 211, 238, 0.35);
            }
          }

          .pdf-course-hotspot-dot {
            transition: transform 200ms ease, opacity 200ms ease;
          }

          .pdf-course-hotspot:hover .pdf-course-hotspot-dot,
          .pdf-course-hotspot:focus-visible .pdf-course-hotspot-dot,
          .pdf-course-hotspot-active .pdf-course-hotspot-dot {
            transform: translateY(-2px) scale(1.18);
            opacity: 1;
          }
        `}
      </style>

      {/* 加载状态 */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-amber-500" />
            <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
              Loading PDF...
            </p>
          </div>
        </div>
      )}

      {/* PDF 内容容器 */}
      <div
        ref={scrollContainerRef}
        className={`w-full h-full ${isLandscape ? "overflow-hidden" : "overflow-y-auto"}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={null}
          error={null}
          className={isLandscape ? "h-full w-full relative" : ""}
        >
          {isLandscape ? (
            // 横屏模式：预渲染所有页面，只显示当前页
            numPages > 0 && (
              <div className="h-full w-full relative flex items-center justify-center">
                {Array.from({ length: numPages }, (_, index) => (
                  <div
                    key={index}
                    className="pdf-page-wrapper absolute flex items-center justify-center"
                    style={{
                      display: index + 1 === currentPage ? "flex" : "none",
                    }}
                  >
                    <div className="relative">
                      <Page
                        key={`page-${index + 1}-${scale.toFixed(2)}`}
                        pageNumber={index + 1}
                        scale={scale}
                        onLoadSuccess={index === 0 ? onPageLoadSuccess : undefined}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                      />
                      {/* 超链接覆盖层 */}
                      {index + 1 === currentPage && activeHyperlinks.length > 0 && (
                        <div className="absolute inset-0 pointer-events-none">
                          {activeHyperlinks
                            .filter((h) => h.page === currentPage)
                            .map((hyperlink) => (
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
                                  className={`pdf-course-hotspot group relative h-full w-full overflow-hidden rounded-2xl border pointer-events-auto transition-all ${
                                    hyperlink.targetMediaId === activeMediaId
                                      ? `pdf-course-hotspot-active ${
                                          theme === "dark"
                                            ? "border-cyan-300 bg-cyan-400/25 shadow-[0_12px_32px_rgba(34,211,238,0.3)]"
                                            : "border-cyan-500 bg-cyan-400/20 shadow-[0_12px_32px_rgba(14,165,233,0.25)]"
                                        }`
                                      : theme === "dark"
                                        ? "border-transparent bg-transparent shadow-none hover:border-cyan-100/85 hover:bg-cyan-300/18 hover:shadow-[0_20px_48px_rgba(34,211,238,0.24)] focus-visible:border-cyan-100/85 focus-visible:bg-cyan-300/18 focus-visible:shadow-[0_20px_48px_rgba(34,211,238,0.24)]"
                                        : "border-transparent bg-transparent shadow-none hover:border-cyan-500/80 hover:bg-cyan-400/18 hover:shadow-[0_18px_42px_rgba(14,165,233,0.2)] focus-visible:border-cyan-500/80 focus-visible:bg-cyan-400/18 focus-visible:shadow-[0_18px_42px_rgba(14,165,233,0.2)]"
                                  }`}
                                  onClick={() => onHyperlinkClick?.(hyperlink.targetMediaId)}
                                  title={hyperlink.targetMediaId}
                                >
                                  <span
                                    className={`pointer-events-none absolute inset-[2px] rounded-[14px] opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 ${
                                      theme === "dark"
                                        ? "bg-gradient-to-br from-cyan-200/12 via-cyan-300/6 to-transparent"
                                        : "bg-gradient-to-br from-cyan-100/60 via-white/50 to-transparent"
                                    }`}
                                  />
                                  <span
                                    className={`pdf-course-hotspot-dot pointer-events-none absolute right-2 top-2 h-2.5 w-2.5 rounded-full opacity-0 ${
                                      theme === "dark" ? "bg-cyan-200 shadow-[0_0_16px_rgba(103,232,249,0.7)]" : "bg-cyan-500 shadow-[0_0_14px_rgba(6,182,212,0.45)]"
                                    }`}
                                  />
                                </button>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            // 竖屏模式：显示所有页面，垂直滚动
            Array.from({ length: numPages }, (_, index) => (
              <div
                key={index}
                className="pdf-page-wrapper flex justify-center"
              >
                <div className="relative">
                  <Page
                    key={`page-${index + 1}-${scale.toFixed(2)}`}
                    pageNumber={index + 1}
                    scale={scale}
                    onLoadSuccess={index === 0 ? onPageLoadSuccess : undefined}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                  {/* 超链接覆盖层 */}
                  {activeHyperlinks.length > 0 && (
                    <div className="absolute inset-0 pointer-events-none">
                      {activeHyperlinks
                        .filter((h) => h.page === index + 1)
                        .map((hyperlink) => (
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
                              className={`pdf-course-hotspot group relative h-full w-full overflow-hidden rounded-2xl border pointer-events-auto transition-all ${
                                hyperlink.targetMediaId === activeMediaId
                                  ? `pdf-course-hotspot-active ${
                                      theme === "dark"
                                        ? "border-cyan-300 bg-cyan-400/25 shadow-[0_12px_32px_rgba(34,211,238,0.3)]"
                                        : "border-cyan-500 bg-cyan-400/20 shadow-[0_12px_32px_rgba(14,165,233,0.25)]"
                                    }`
                                  : theme === "dark"
                                    ? "border-transparent bg-transparent shadow-none hover:border-cyan-100/85 hover:bg-cyan-300/18 hover:shadow-[0_20px_48px_rgba(34,211,238,0.24)] focus-visible:border-cyan-100/85 focus-visible:bg-cyan-300/18 focus-visible:shadow-[0_20px_48px_rgba(34,211,238,0.24)]"
                                    : "border-transparent bg-transparent shadow-none hover:border-cyan-500/80 hover:bg-cyan-400/18 hover:shadow-[0_18px_42px_rgba(14,165,233,0.2)] focus-visible:border-cyan-500/80 focus-visible:bg-cyan-400/18 focus-visible:shadow-[0_18px_42px_rgba(14,165,233,0.2)]"
                              }`}
                              onClick={() => onHyperlinkClick?.(hyperlink.targetMediaId)}
                              title={hyperlink.targetMediaId}
                            >
                              <span
                                className={`pointer-events-none absolute inset-[2px] rounded-[14px] opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 ${
                                  theme === "dark"
                                    ? "bg-gradient-to-br from-cyan-200/12 via-cyan-300/6 to-transparent"
                                    : "bg-gradient-to-br from-cyan-100/60 via-white/50 to-transparent"
                                }`}
                              />
                              <span
                                className={`pdf-course-hotspot-dot pointer-events-none absolute right-2 top-2 h-2.5 w-2.5 rounded-full opacity-0 ${
                                  theme === "dark" ? "bg-cyan-200 shadow-[0_0_16px_rgba(103,232,249,0.7)]" : "bg-cyan-500 shadow-[0_0_14px_rgba(6,182,212,0.45)]"
                                }`}
                              />
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </Document>
      </div>

      {/* 横屏模式：翻页控制 */}
      {isLandscape && !isLoading && numPages > 0 && (
        <>
          {/* 页码显示 */}
          <div
            className={`absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-xs font-medium z-20 ${
              theme === "dark"
                ? "bg-black/70 text-white"
                : "bg-white/90 text-gray-900 shadow-lg"
            }`}
          >
            {currentPage} / {numPages}
          </div>

          {/* 全屏按钮 */}
          {onFullscreenClick && (
            <button
              onClick={onFullscreenClick}
              className={`absolute top-2 right-2 p-2 rounded-full transition-all z-20 ${
                theme === "dark"
                  ? "bg-black/70 text-white hover:bg-black/90"
                  : "bg-white/90 text-gray-900 shadow-lg hover:bg-white"
              }`}
              title="全屏"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          )}

          {/* 上一页按钮 */}
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

          {/* 下一页按钮 */}
          <button
            onClick={nextPage}
            disabled={currentPage >= numPages}
            className={`absolute right-2 bottom-2 p-2 rounded-full transition-all z-20 ${
              currentPage >= numPages
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

      {/* 竖屏模式：页码显示 */}
      {!isLandscape && !isLoading && numPages > 0 && (
        <div
          className={`fixed bottom-4 right-4 px-3 py-1.5 rounded-full text-xs font-medium z-20 ${
            theme === "dark"
              ? "bg-black/70 text-white"
              : "bg-white/90 text-gray-900 shadow-lg"
          }`}
        >
          {currentPage} / {numPages}
        </div>
      )}
    </div>
  );
}

export default PdfViewer;
