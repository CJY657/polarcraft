/**
 * UnitViewer - 单元内容查看器
 *
 * 桌面端优先展示单元导览，右侧显示课程入口
 */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, Minimize2, FileText } from "lucide-react";
import { cn } from "@/utils/classNames";
import PdfViewer from "@/feature/course/PdfViewer";
import { CourseSelector } from "./CourseSelector";
import type { Unit, UnitMainSlide, UnitCourse } from "@/lib/unit.service";

interface UnitViewerProps {
  unit: Unit;
  mainSlide: UnitMainSlide | null;
  courses: UnitCourse[];
  onBack: () => void;
  theme: "dark" | "light";
}

export function UnitViewer({ unit, mainSlide, courses, onBack, theme }: UnitViewerProps) {
  const { i18n } = useTranslation();
  const [isMainSlideFullscreen, setIsMainSlideFullscreen] = useState(false);

  const isZh = i18n.language === "zh-CN";

  // Get localized label
  const getLabel = (label: { "zh-CN"?: string; "en-US"?: string }) => {
    return label[isZh ? "zh-CN" : "en-US"] || label["zh-CN"] || label["en-US"] || "";
  };

  // ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMainSlideFullscreen) {
        setIsMainSlideFullscreen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMainSlideFullscreen]);

  // Render main slide (PDF)
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
          hyperlinks={[]} // Unit PDF doesn't have hyperlinks
          onHyperlinkClick={() => {}}
          onFullscreenClick={isFullscreenMode ? undefined : () => setIsMainSlideFullscreen(true)}
        />
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4">
      {/* Back button */}
      <button
        onClick={onBack}
        className={cn(
          "mb-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 transition-all duration-200",
          theme === "dark"
            ? "text-gray-400 hover:bg-slate-800 hover:text-white"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        )}
      >
        <ChevronLeft className="h-4 w-4" />
        <span>{isZh ? "返回课程总览" : "Back to Course Overview"}</span>
      </button>

      <section
        className={cn(
          "mb-6 rounded-[1.9rem] border p-5 sm:p-6",
          theme === "dark"
            ? "border-slate-800 bg-slate-950/68 text-white"
            : "border-slate-200 bg-white/94 text-gray-900 shadow-sm",
        )}
        style={{
          backgroundColor: theme === "dark" ? `${unit.color}0d` : undefined,
          borderColor: theme === "dark" ? `${unit.color}28` : undefined,
        }}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p
              className={cn(
                "text-[11px] font-semibold uppercase tracking-[0.22em]",
                theme === "dark" ? "text-slate-400" : "text-slate-500",
              )}
            >
              {isZh ? "课程总览 / 单元 / 课程" : "Course overview / Unit / Course"}
            </p>
            <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{getLabel(unit.title)}</h1>
            {unit.description && (
              <p
                className={cn(
                  "mt-3 max-w-2xl text-sm leading-7 sm:text-[15px]",
                  theme === "dark" ? "text-slate-300" : "text-gray-600",
                )}
              >
                {getLabel(unit.description)}
              </p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div
              className={cn(
                "rounded-2xl border px-4 py-3",
                theme === "dark"
                  ? "border-slate-800 bg-slate-900/75"
                  : "border-slate-200 bg-slate-50/90",
              )}
            >
              <p className={cn("text-xs", theme === "dark" ? "text-slate-400" : "text-slate-500")}>
                {isZh ? "步骤 1" : "Step 1"}
              </p>
              <p className="mt-1 text-sm font-semibold">{isZh ? "查看单元导览" : "Review unit overview"}</p>
            </div>
            <div
              className={cn(
                "rounded-2xl border px-4 py-3",
                theme === "dark"
                  ? "border-slate-800 bg-slate-900/75"
                  : "border-slate-200 bg-slate-50/90",
              )}
            >
              <p className={cn("text-xs", theme === "dark" ? "text-slate-400" : "text-slate-500")}>
                {isZh ? "步骤 2" : "Step 2"}
              </p>
              <p className="mt-1 text-sm font-semibold">
                {isZh ? `进入 ${courses.length} 门课程` : `Open ${courses.length} courses`}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        {mainSlide ? (
          <section
            className={cn(
              "min-w-0 rounded-[1.8rem] border p-4 sm:p-5",
              theme === "dark"
                ? "border-slate-800 bg-slate-950/72"
                : "border-slate-200 bg-white/94 shadow-sm",
            )}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p
                  className={cn(
                    "text-[11px] font-semibold uppercase tracking-[0.2em]",
                    theme === "dark" ? "text-slate-500" : "text-slate-400",
                  )}
                >
                  {isZh ? "步骤 1" : "Step 1"}
                </p>
                <h2 className="mt-2 text-lg font-semibold">{isZh ? "单元导览" : "Unit Overview"}</h2>
                <p className={cn("mt-1 text-sm", theme === "dark" ? "text-slate-400" : "text-slate-600")}>
                  {isZh ? "先浏览单元主课件，再进入具体课程。" : "Review the unit slide deck before entering a specific course."}
                </p>
              </div>
            </div>
            <div className="aspect-video">{renderMainSlide()}</div>
          </section>
        ) : (
          <section
            className={cn(
              "aspect-video min-w-0 rounded-[1.8rem] border p-4 sm:p-5",
              theme === "dark"
                ? "border-slate-800 bg-slate-950/72"
                : "border-slate-200 bg-slate-50/90",
            )}
          >
            <div className="mb-4">
              <p
                className={cn(
                  "text-[11px] font-semibold uppercase tracking-[0.2em]",
                  theme === "dark" ? "text-slate-500" : "text-slate-400",
                )}
              >
                {isZh ? "步骤 1" : "Step 1"}
              </p>
              <h2 className="mt-2 text-lg font-semibold">{isZh ? "单元导览" : "Unit Overview"}</h2>
            </div>
            <div className="flex h-full items-center justify-center text-center">
              <div>
                <FileText
                  className={cn(
                    "mx-auto mb-4 h-16 w-16",
                    theme === "dark" ? "text-gray-600" : "text-gray-400",
                  )}
                />
                <p className={cn("text-sm", theme === "dark" ? "text-gray-400" : "text-gray-500")}>
                  {isZh ? "暂无单元导览课件" : "No unit overview available"}
                </p>
              </div>
            </div>
          </section>
        )}

        <aside
          className={cn(
            "rounded-[1.8rem] border p-4 sm:p-5 lg:sticky lg:top-6",
            theme === "dark"
              ? "border-slate-800 bg-slate-950/72"
              : "border-slate-200 bg-white/94 shadow-sm",
          )}
        >
          <CourseSelector
            unitId={unit.id}
            courses={courses}
            unitColor={unit.color}
            layout="sidebar"
          />
        </aside>
      </div>

      {/* Main PDF fullscreen mode */}
      {isMainSlideFullscreen && mainSlide && (
        <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
          <button
            onClick={() => setIsMainSlideFullscreen(false)}
            className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors"
            title={isZh ? "退出全屏" : "Exit Fullscreen"}
          >
            <Minimize2 className="h-5 w-5" />
          </button>
          <div className="w-full h-full">{renderMainSlide(true)}</div>
        </div>
      )}
    </div>
  );
}

export default UnitViewer;
