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
import type { CourseData, MediaResource, MediaType } from "@/data/courses";

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
  pdf: <FileText className="h-5 w-5" />,
};

// 媒体类型颜色
const MEDIA_TYPE_COLORS: Record<MediaType, string> = {
  pptx: "#F59E0B",
  image: "#8B5CF6",
  video: "#EF4444",
  pdf: "#DC2626",
};

// PPTX Previewer instance type
interface PptxPreviewerInstance {
  preview: (data: ArrayBuffer) => void;
  destroy?: () => void;
}

// PPTX Viewer Component
interface PptxViewerProps {
  url: string;
  theme: "dark" | "light";
}

function PptxViewer({ url, theme }: PptxViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const slideWrapperRef = useRef<HTMLDivElement>(null);
  const previewerRef = useRef<PptxPreviewerInstance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // Track which URL has been loaded to prevent duplicate fetches
  const loadedUrlRef = useRef<string | null>(null);
  const cachedDataRef = useRef<ArrayBuffer | null>(null);

  // 更新幻灯片显示状态 - 只显示当前页
  const updateSlideVisibility = (page: number) => {
    if (!containerRef.current || containerRef.current.children.length < 3) return;

    const pptxWrapper = containerRef.current.children[2] as HTMLDivElement;
    const slides = Array.from(pptxWrapper.children).filter(
      (child) => child instanceof HTMLElement && child.classList.contains("pptx-preview-slide-wrapper")
    );

    slides.forEach((slide, index) => {
      if (slide instanceof HTMLElement) {
        if (index === page - 1) {
          slide.style.display = "block";
        } else {
          slide.style.display = "none";
        }
      }
    });
  };

  // 翻页函数 - 使用 display 控制显示
  const nextPage = () => {
    if (currentPage < totalPages) {
      const targetPage = currentPage + 1;
      updateSlideVisibility(targetPage);
      setCurrentPage(targetPage);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      const targetPage = currentPage - 1;
      updateSlideVisibility(targetPage);
      setCurrentPage(targetPage);
    }
  };

  // 键盘控制翻页
  useEffect(() => {
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
  }, [currentPage, totalPages]);

  // Track container size with ResizeObserver
  useEffect(() => {
    if (!wrapperRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          // Reinitialize previewer with new dimensions
          if (containerRef.current) {
            // Destroy old instance before creating new one
            previewerRef.current?.destroy?.();
            previewerRef.current = null;

            // Always reinit to ensure previewer is updated
            const newPreviewer = init(containerRef.current, {
              width: Math.floor(width),
              height: Math.floor(height),
            });
            previewerRef.current = newPreviewer;
            // Re-render with cached data if available
            if (cachedDataRef.current) {
              newPreviewer.preview(cachedDataRef.current);
            }
            // Apply display styles after render
            setTimeout(() => {
              if (containerRef.current && containerRef.current.children.length >= 3) {
                const pptxWrapper = containerRef.current.children[2] as HTMLDivElement;
                slideWrapperRef.current = pptxWrapper;

                // Set up wrapper for overlapping slides
                pptxWrapper.style.display = "block";
                pptxWrapper.style.position = "relative";
                pptxWrapper.style.width = "100%";
                pptxWrapper.style.height = "100%";
                pptxWrapper.style.overflow = "hidden";

                // Make each slide overlap and occupy full container
                Array.from(pptxWrapper.children).forEach((slide, index) => {
                  if (
                    slide instanceof HTMLElement &&
                    slide.classList.contains("pptx-preview-slide-wrapper")
                  ) {
                    slide.style.position = "absolute";
                    slide.style.top = "0";
                    slide.style.left = "0";
                    slide.style.width = "100%";
                    slide.style.height = "100%";
                    slide.style.overflow = "hidden";
                    slide.style.boxSizing = "border-box";
                    // Show only current page, hide others
                    slide.style.display = index === currentPage - 1 ? "block" : "none";
                    // Ensure inner content doesn't cause overflow
                    const innerContent = slide.firstElementChild;
                    if (innerContent instanceof HTMLElement) {
                      innerContent.style.width = "100%";
                      innerContent.style.height = "100%";
                      innerContent.style.overflow = "hidden";
                    }
                  }
                });
              }
              // Disable overflow on container
              if (containerRef.current) {
                const elements = [
                  containerRef.current,
                  ...Array.from(containerRef.current.querySelectorAll("*")),
                ];
                elements.forEach((el) => {
                  if (el instanceof HTMLElement && el !== slideWrapperRef.current) {
                    el.style.overflow = "hidden";
                  }
                });
              }
            }, 100);
          }
        }
      }
    });

    resizeObserver.observe(wrapperRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Fetch PPTX file only once per URL
  useEffect(() => {
    // Skip if already loading or loaded this URL
    if (loadedUrlRef.current === url) return;

    // Mark this URL as being loaded immediately to prevent duplicate fetches
    loadedUrlRef.current = url;

    const loadPptx = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to load PPTX: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();

        // Cache the data
        cachedDataRef.current = arrayBuffer;

        // Render immediately if previewer exists
        if (previewerRef.current) {
          previewerRef.current.preview(arrayBuffer);
        }

        setIsLoading(false);
      } catch (err) {
        console.error("Error loading PPTX:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setIsLoading(false);
        // Reset loadedUrlRef on error to allow retry
        loadedUrlRef.current = null;
      }
    };

    loadPptx();
  }, [url]);

  // Initialize previewer when container is ready
  useEffect(() => {
    if (!wrapperRef.current || !containerRef.current) return;

    const { width, height } = wrapperRef.current.getBoundingClientRect();
    if (width > 0 && height > 0) {
      previewerRef.current = init(containerRef.current, {
        width: Math.floor(width),
        height: Math.floor(height),
      });

      // If we have cached data, render it immediately
      if (cachedDataRef.current) {
        previewerRef.current.preview(cachedDataRef.current);
      }

      // Apply scrolling styles after render
      setTimeout(() => {
        if (containerRef.current) {
          // First disable overflow on all elements except the wrapper
          const elements = [
            containerRef.current,
            ...Array.from(containerRef.current.querySelectorAll("*")),
          ];
          elements.forEach((el) => {
            if (el instanceof HTMLElement) {
              el.style.overflow = "hidden";
              el.style.overscrollBehavior = "none";
            }
          });

          // Then set up the wrapper for overlapping slides
          if (containerRef.current.children.length >= 3) {
            const pptxWrapper = containerRef.current.children[2] as HTMLDivElement;
            slideWrapperRef.current = pptxWrapper;

            pptxWrapper.style.display = "block";
            pptxWrapper.style.position = "relative";
            pptxWrapper.style.width = "100%";
            pptxWrapper.style.height = "100%";
            pptxWrapper.style.overflow = "hidden";

            // Make each slide overlap and occupy full container
            Array.from(pptxWrapper.children).forEach((slide, index) => {
              if (
                slide instanceof HTMLElement &&
                slide.classList.contains("pptx-preview-slide-wrapper")
              ) {
                slide.style.position = "absolute";
                slide.style.top = "0";
                slide.style.left = "0";
                slide.style.width = "100%";
                slide.style.height = "100%";
                slide.style.overflow = "hidden";
                slide.style.boxSizing = "border-box";
                // Show only current page, hide others
                slide.style.display = index === currentPage - 1 ? "block" : "none";
                const innerContent = slide.firstElementChild;
                if (innerContent instanceof HTMLElement) {
                  innerContent.style.width = "100%";
                  innerContent.style.height = "100%";
                  innerContent.style.overflow = "hidden";
                }
              }
            });
          }
        }
      }, 100);
    }

    return () => {
      previewerRef.current?.destroy?.();
      previewerRef.current = null;
    };
  }, []);

  // Hide first and second children (navigation controls) of pptx-preview
  useEffect(() => {
    if (!containerRef.current || !cachedDataRef.current) return;

    // Hide first and second child elements after rendering
    const hideChildren = () => {
      const container = containerRef.current;
      if (!container) return;

      const children = container.children;
      if (children.length >= 2) {
        (children[0] as HTMLElement).style.display = "none";
        (children[1] as HTMLElement).style.display = "none";
      }
    };

    // Use setTimeout to ensure DOM is updated after preview renders
    const timeoutId = setTimeout(hideChildren, 100);

    return () => clearTimeout(timeoutId);
  }, [cachedDataRef.current]);

  // Disable scrolling in pptx-preview
  useEffect(() => {
    if (!containerRef.current || !cachedDataRef.current) return;

    const disableScrolling = () => {
      const container = containerRef.current;
      if (!container) return;

      // Disable overflow on all elements
      const elements = [container, ...Array.from(container.querySelectorAll("*"))];
      elements.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.style.overflow = "hidden";
          el.style.overscrollBehavior = "none";
        }
      });
    };

    const timeoutId = setTimeout(disableScrolling, 150);

    return () => clearTimeout(timeoutId);
  }, [cachedDataRef.current]);

  // 动态监听并计算 totalPages（基于 pptx-preview-wrapper 的子元素数量）
  useEffect(() => {
    if (!containerRef.current || !cachedDataRef.current) return;

    // 计算幻灯片总数的函数
    const calculateSlideCount = () => {
      if (containerRef.current && containerRef.current.children.length >= 3) {
        const pptxWrapper = containerRef.current.children[2] as HTMLDivElement;
        // 计算 pptx-preview-slide-wrapper 的数量
        const slideWrappers = Array.from(pptxWrapper.children).filter(
          (child) =>
            child instanceof HTMLElement && child.classList.contains("pptx-preview-slide-wrapper"),
        );
        const count = slideWrappers.length;
        if (count > 0) {
          setTotalPages(count);
          // 确保 currentPage 不超出范围
          setCurrentPage((prev) => Math.min(prev, count));
        }
      }
    };

    // 初始计算
    const timeoutId = setTimeout(calculateSlideCount, 200);

    // 使用 MutationObserver 监听 DOM 变化
    const observer = new MutationObserver(() => {
      calculateSlideCount();
    });

    // 观察第三个子元素的变化
    if (containerRef.current.children.length >= 3) {
      const pptxWrapper = containerRef.current.children[2];
      observer.observe(pptxWrapper, {
        childList: true,
        subtree: false,
      });
    }

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [cachedDataRef.current]);

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
      className="relative w-full h-full overflow-hidden"
    >
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
        ref={containerRef}
        className="w-full h-full"
        style={{ overflow: "hidden" }}
      />

      {/* 翻页控制 */}
      {!isLoading && (
        <>
          {/* 页码显示 - 放在顶部中间 */}
          <div
            className={`absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-xs font-medium z-20 ${
              theme === "dark" ? "bg-black/70 text-white" : "bg-white/90 text-gray-900 shadow-lg"
            }`}
          >
            {currentPage} / {totalPages}
          </div>

          {/* 上一页按钮 - 移到左下角 */}
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

          {/* 下一页按钮 - 移到右下角 */}
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

  // 当前媒体索引
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  // 是否全屏
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentMedia = course.media[currentMediaIndex];

  // 获取媒体标题
  const getMediaTitle = (media: MediaResource) => {
    return media.title[i18n.language];
  };

  // 切换全屏
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // 渲染媒体内容
  const renderMedia = (media: MediaResource) => {
    const containerClass = isFullscreen
      ? "fixed inset-0 z-50 bg-black"
      : "w-full aspect-video rounded-xl overflow-hidden";

    switch (media.type) {
      case "pptx":
        const pptxContainerClass = isFullscreen
          ? "fixed inset-0 z-50 bg-black"
          : "w-full rounded-xl overflow-hidden aspect-video";
        return (
          <div className={pptxContainerClass}>
            <PptxViewer
              url={media.url}
              theme={theme}
            />
          </div>
        );

      case "image":
        return (
          <div className={containerClass}>
            <img
              src={media.url}
              alt={getMediaTitle(media)}
              className="h-full w-full object-contain"
            />
          </div>
        );

      case "video":
        return (
          <div className={containerClass}>
            <video
              src={media.url}
              controls
              className="h-full w-full"
            />
          </div>
        );

      case "pdf":
        const pdfContainerClass = isFullscreen
          ? "fixed inset-0 z-50 bg-black"
          : "w-full rounded-xl overflow-hidden aspect-video";
        return (
          <div className={pdfContainerClass}>
            <PdfViewer url={media.url} theme={theme} />
          </div>
        );

      default:
        return (
          <div className={containerClass}>
            <div className="flex h-full w-full items-center justify-center">
              <p className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                {t("page.courses.unsupportedmediatype")}
              </p>
            </div>
          </div>
        );
    }
  };

  if (!currentMedia) {
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl px-4">
      {/* Header */}
      <div className="mb-6">
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

        <div className="flex items-start gap-4">
          <div
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${course.color}20` }}
          >
            <FileText
              className="h-6 w-6"
              style={{ color: course.color }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <h1
              className={`mb-2 text-2xl font-bold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              {course.title[i18n.language]}
            </h1>
            <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
              {course.description[i18n.language]}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Media Viewer */}
        <div className="lg:col-span-3">
          <div className={`rounded-2xl p-4 ${theme === "dark" ? "bg-slate-800/50" : "bg-white"}`}>
            {/* Media */}
            <div className="mb-4">{renderMedia(currentMedia)}</div>

            {/* Media Controls */}
            <div className="flex items-center justify-end gap-2">
                {/* Fullscreen Toggle */}
                <button
                  onClick={toggleFullscreen}
                  className={`rounded-lg p-2 transition-colors ${
                    theme === "dark"
                      ? "text-gray-400 hover:bg-slate-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  title={
                    isFullscreen ? t("page.courses.exitfullscreen") : t("page.courses.fullscreen")
                  }
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-5 w-5" />
                  ) : (
                    <Maximize2 className="h-5 w-5" />
                  )}
                </button>

                {/* Download Media */}
                <button
                  onClick={() => window.open(currentMedia.url, "_blank")}
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

            {/* Media Info */}
            <div
              className="mt-4 border-t pt-4"
              style={{ borderColor: theme === "dark" ? "#334155" : "#e5e7eb" }}
            >
              <div className="mb-3 flex items-center gap-3">
                <div
                  className="rounded-lg p-1.5"
                  style={{ backgroundColor: `${MEDIA_TYPE_COLORS[currentMedia.type]}20` }}
                >
                  <span style={{ color: MEDIA_TYPE_COLORS[currentMedia.type] }}>
                    {MEDIA_TYPE_ICONS[currentMedia.type]}
                  </span>
                </div>
                <div className="flex-1">
                  <h3
                    className={`text-sm font-medium ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {getMediaTitle(currentMedia)}
                  </h3>
                  <p className={`text-xs ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}>
                    {currentMedia.type.toUpperCase()}
                  </p>
                </div>
                {currentMedia.duration && (
                  <div
                    className="flex items-center gap-1 text-xs"
                    style={{ color: course.color }}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                      {Math.floor(currentMedia.duration / 60)}:
                      {(currentMedia.duration % 60).toString().padStart(2, "0")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Empty or can be used for additional info */}
        <div className="lg:col-span-1">
          <div className={`rounded-2xl p-4 ${theme === "dark" ? "bg-slate-800/50" : "bg-white"}`}>
            <h3
              className={`mb-4 text-sm font-bold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              {t("page.courses.resources")}
            </h3>
            <div className="space-y-2">
              {course.media.map((media, index) => (
                <button
                  key={media.id}
                  onClick={() => setCurrentMediaIndex(index)}
                  className={`w-full rounded-lg p-3 text-left transition-all ${
                    currentMediaIndex === index
                      ? "bg-blue-500 text-white"
                      : theme === "dark"
                        ? "hover:bg-slate-700"
                        : "hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      style={{
                        color:
                          currentMediaIndex === index ? "white" : MEDIA_TYPE_COLORS[media.type],
                      }}
                    >
                      {MEDIA_TYPE_ICONS[media.type]}
                    </span>
                    <span
                      className={`truncate text-xs font-medium ${
                        currentMediaIndex === index
                          ? "text-white"
                          : theme === "dark"
                            ? "text-gray-300"
                            : "text-gray-700"
                      }`}
                    >
                      {getMediaTitle(media)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
