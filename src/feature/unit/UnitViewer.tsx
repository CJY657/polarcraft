/**
 * UnitViewer - 单元内容查看器
 *
 * 上方显示单元主PDF，下方显示课程选择器
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronLeft, Minimize2, FileText, Loader2 } from "lucide-react";
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
  const navigate = useNavigate();
  const [isMainSlideFullscreen, setIsMainSlideFullscreen] = useState(false);

  const isZh = i18n.language === "zh-CN";

  // Get localized label
  const getLabel = (label: { "zh-CN"?: string; "en-US"?: string }) => {
    return label[isZh ? "zh-CN" : "en-US"] || label["zh-CN"] || label["en-US"] || "";
  };

  // Handle course selection - navigate to course viewer
  const handleSelectCourse = (courseId: string) => {
    navigate(`/units/${unit.id}/courses/${courseId}`);
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
    <div className="mx-auto max-w-6xl px-4">
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
        <span>{isZh ? "返回单元列表" : "Back to Units"}</span>
      </button>

      {/* Unit title */}
      <div className="mb-4">
        <h1
          className={cn(
            "text-2xl font-bold",
            theme === "dark" ? "text-white" : "text-gray-900"
          )}
        >
          {getLabel(unit.title)}
        </h1>
        {unit.description && (
          <p
            className={cn(
              "mt-1 text-sm",
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            )}
          >
            {getLabel(unit.description)}
          </p>
        )}
      </div>

      {/* Upper area: Unit main PDF */}
      {mainSlide ? (
        <div
          className={cn(
            "rounded-2xl p-4 mb-6",
            theme === "dark" ? "bg-slate-800/50" : "bg-white shadow-sm"
          )}
        >
          <div className="aspect-video">{renderMainSlide()}</div>
        </div>
      ) : (
        <div
          className={cn(
            "rounded-2xl p-4 mb-6 aspect-video flex items-center justify-center",
            theme === "dark" ? "bg-slate-800/50" : "bg-gray-50"
          )}
        >
          <div className="text-center">
            <FileText
              className={cn(
                "w-16 h-16 mx-auto mb-4",
                theme === "dark" ? "text-gray-600" : "text-gray-400"
              )}
            />
            <p className={cn("text-sm", theme === "dark" ? "text-gray-400" : "text-gray-500")}>
              {isZh ? "暂无主课件" : "No main slide available"}
            </p>
          </div>
        </div>
      )}

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

      {/* Lower area: Course selector */}
      <div
        className={cn(
          "rounded-2xl p-4",
          theme === "dark" ? "bg-slate-800/50" : "bg-white shadow-sm"
        )}
      >
        <CourseSelector
          unitId={unit.id}
          courses={courses}
          unitColor={unit.color}
        />
      </div>
    </div>
  );
}

export default UnitViewer;
