/**
 * PdfViewer - PDF 查看器
 *
 * 支持横屏 PPT 式翻页和竖屏垂直滚动
 */

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Document,
  Page,
  pdfjs,
} from "react-pdf";
import type { PDFPageProxy } from "pdfjs-dist";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
} from "lucide-react";

import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface PdfViewerProps {
  url: string;
  theme: "dark" | "light";
}

function PdfViewer({ url, theme }: PdfViewerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // PDF 状态
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  const onDocumentLoadSuccess = useCallback(({ numPages: nextNumPages }: { numPages: number }) => {
    setNumPages(nextNumPages);
    setCurrentPage(1);
  }, []);

  // PDF 加载失败
  const onDocumentLoadError = useCallback((err: Error) => {
    console.error("Error loading PDF:", err);
    setError(err.message);
    setIsLoading(false);
  }, []);

  // 横屏模式：翻页控制
  const nextPage = useCallback(() => {
    if (currentPage < numPages) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [currentPage, numPages]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [currentPage]);

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
          className={isLandscape ? "h-full flex items-center justify-center" : ""}
        >
          {isLandscape ? (
            // 横屏模式：只显示当前页
            numPages > 0 && (
              <div className="h-full flex items-center justify-center">
                <Page
                  pageNumber={currentPage}
                  scale={scale}
                  onLoadSuccess={onPageLoadSuccess}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="pdf-page-wrapper"
                />
              </div>
            )
          ) : (
            // 竖屏模式：显示所有页面，垂直滚动
            Array.from({ length: numPages }, (_, index) => (
              <div
                key={index}
                className="pdf-page-wrapper flex justify-center"
              >
                <Page
                  pageNumber={index + 1}
                  scale={scale}
                  onLoadSuccess={index === 0 ? onPageLoadSuccess : undefined}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
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
