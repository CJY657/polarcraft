/**
 * Units Page - Experiment Units List
 * 单元页面 - 实验课单元列表
 *
 * Displays all experiment units with PDF slides and course selections
 * 展示所有实验课单元，包含PDF课件和课程选择
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/utils/classNames";
import { PersistentHeader } from "@/components/shared";
import { BookOpen, FileText, Loader2, Layers } from "lucide-react";
import { useUnitStore } from "@/stores/unitStore";

export function UnitsPage() {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const { units, isLoading, error, fetchUnits } = useUnitStore();

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  const isZh = i18n.language === "zh-CN";

  // Helper to get localized label
  const getLabel = (label: { "zh-CN"?: string; "en-US"?: string }) => {
    return label[isZh ? "zh-CN" : "en-US"] || label["zh-CN"] || label["en-US"] || "";
  };

  return (
    <div
      className={cn(
        "min-h-screen",
        theme === "dark"
          ? "bg-gradient-to-br from-[#0a0a1a] via-[#1a1a3a] to-[#0a0a2a]"
          : "bg-gradient-to-br from-[#fffbeb] via-[#fef3c7] to-[#fffbeb]"
      )}
    >
      {/* Header with Persistent Logo */}
      <PersistentHeader
        moduleKey="units"
        moduleName={isZh ? "实验课单元" : "Experiment Units"}
        variant="glass"
        className={cn(
          "sticky top-0 z-40",
          theme === "dark"
            ? "bg-slate-900/80 border-b border-slate-700"
            : "bg-white/80 border-b border-gray-200"
        )}
      />

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Hero section */}
        <div className="text-center mb-8">
          <h2
            className={cn(
              "text-2xl sm:text-3xl font-bold mb-3",
              theme === "dark" ? "text-white" : "text-gray-900"
            )}
          >
            {isZh ? "实验课单元" : "Experiment Units"}
          </h2>
          <p
            className={cn(
              "text-base max-w-3xl mx-auto mb-4",
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            )}
          >
            {isZh
              ? "选择一个单元开始学习，每个单元包含主课件和相关课程"
              : "Select a unit to start learning. Each unit contains main slides and related courses."}
          </p>
        </div>

        {/* Error state */}
        {error && (
          <div className="text-center py-10">
            <p className={cn("text-red-500", theme === "dark" ? "text-red-400" : "text-red-600")}>
              {error}
            </p>
            <button
              onClick={() => fetchUnits()}
              className="mt-4 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {isZh ? "重试" : "Retry"}
            </button>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && units.length === 0 && (
          <div className="text-center py-20">
            <Layers
              className={cn(
                "w-12 h-12 mx-auto mb-4",
                theme === "dark" ? "text-gray-600" : "text-gray-400"
              )}
            />
            <p className={cn("text-lg", theme === "dark" ? "text-gray-400" : "text-gray-600")}>
              {isZh ? "暂无单元" : "No units available"}
            </p>
          </div>
        )}

        {/* Units grid */}
        {!isLoading && !error && units.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {units.map((unit) => (
              <div
                key={unit.id}
                onClick={() => navigate(`/units/${unit.id}`)}
                className={cn(
                  "group rounded-2xl transition-all duration-300 overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-xl",
                  theme === "dark"
                    ? "bg-slate-800/50 border-2 border-slate-700 hover:border-slate-500"
                    : "bg-white shadow-sm hover:shadow-lg"
                )}
              >
                {/* Cover Image */}
                <div className="relative h-40 overflow-hidden">
                  {unit.coverImage ? (
                    <img
                      src={unit.coverImage}
                      alt={getLabel(unit.title)}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      <div
                        className="absolute inset-0"
                        style={{
                          background: `linear-gradient(135deg, ${unit.color}40 0%, ${unit.color}10 100%)`,
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div
                          className="w-16 h-16 rounded-2xl flex items-center justify-center"
                          style={{ backgroundColor: `${unit.color}30` }}
                        >
                          <Layers className="w-8 h-8" style={{ color: unit.color }} />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  {/* Title */}
                  <h3
                    className={cn(
                      "text-lg font-bold mb-2 line-clamp-2",
                      theme === "dark" ? "text-white" : "text-gray-900"
                    )}
                  >
                    {getLabel(unit.title)}
                  </h3>

                  {/* Description */}
                  <p
                    className={cn(
                      "text-sm mb-4 line-clamp-2",
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    )}
                  >
                    {getLabel(unit.description)}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs">
                    {unit.mainSlide && (
                      <div
                        className="flex items-center gap-1.5"
                        style={{ color: unit.color }}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>{isZh ? "主课件" : "Slides"}</span>
                      </div>
                    )}
                    <div
                      className="flex items-center gap-1.5"
                      style={{ color: unit.color }}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>
                        {unit.courseCount || 0} {isZh ? "课程" : "Courses"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default UnitsPage;
