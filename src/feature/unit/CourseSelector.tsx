/**
 * CourseSelector Component
 * 课程选择器组件
 *
 * Displays a list of courses for a unit
 * 显示单元下的课程列表
 */

import { Link } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils/classNames";
import { preloadCourseViewerRoute } from "@/lib/routePreload";
import { BookOpen, Play, FileText, ChevronRight } from "lucide-react";
import type { UnitCourse } from "@/lib/unit.service";

interface CourseSelectorProps {
  unitId: string;
  courses: UnitCourse[];
  unitColor: string;
  layout?: "grid" | "sidebar";
  title?: string;
  description?: string;
  showHeader?: boolean;
}

export function CourseSelector({
  unitId,
  courses,
  unitColor,
  layout = "grid",
  title,
  description,
  showHeader = true,
}: CourseSelectorProps) {
  const { theme } = useTheme();
  const { i18n } = useTranslation();

  const isZh = i18n.language === "zh-CN";
  const isSidebar = layout === "sidebar";

  const getLabel = (label: { "zh-CN"?: string; "en-US"?: string }) => {
    return label[isZh ? "zh-CN" : "en-US"] || label["zh-CN"] || label["en-US"] || "";
  };

  const getCourseHref = (courseId: string) => `/units/${unitId}/courses/${courseId}`;

  if (courses.length === 0) {
    return (
      <div
        className={cn(
          "rounded-[1.5rem] border px-5 py-10 text-center",
          theme === "dark"
            ? "border-slate-800 bg-slate-900/60"
            : "border-slate-200 bg-slate-50/90",
        )}
      >
        <BookOpen
          className={cn(
            "w-10 h-10 mx-auto mb-3",
            theme === "dark" ? "text-gray-600" : "text-gray-400"
          )}
        />
        <p className={cn("text-sm", theme === "dark" ? "text-gray-400" : "text-gray-600")}>
          {isZh ? "该单元暂无课程" : "No courses in this unit"}
        </p>
      </div>
    );
  }

  const sectionTitle =
    title ||
    (isSidebar
      ? isZh
        ? "步骤 2 · 进入课程"
        : "Step 2 · Open a Course"
      : isZh
        ? "单元内课程"
        : "Courses in This Unit");

  const sectionDescription =
    description ||
    (isSidebar
      ? isZh
        ? "先浏览单元导览，再进入下面的具体课程。每门课程都属于当前单元。"
        : "Review the unit overview first, then enter a course. Every course below belongs to this unit."
      : isZh
        ? "下面的课程都属于当前单元，进入后查看具体课件与媒体资源。"
        : "Each course below belongs to the selected unit and opens into detailed slides and media.");

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" style={{ color: unitColor }} />
              <h3
                className={cn(
                  "text-lg font-semibold",
                  theme === "dark" ? "text-white" : "text-gray-900",
                )}
              >
                {sectionTitle}
              </h3>
            </div>
            <p className={cn("mt-2 text-sm leading-6", theme === "dark" ? "text-slate-400" : "text-slate-600")}>
              {sectionDescription}
            </p>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-sm font-semibold",
              theme === "dark"
                ? "border-slate-700 bg-slate-900/85 text-slate-300"
                : "border-slate-200 bg-slate-50 text-slate-600",
            )}
          >
            {courses.length}
          </span>
        </div>
      )}

      <div
        className={cn(
          "overflow-hidden rounded-[1.5rem] border",
          theme === "dark"
            ? "border-slate-800 bg-slate-950/65"
            : "border-slate-200 bg-white/92",
        )}
      >
        <div className={cn("divide-y", theme === "dark" ? "divide-slate-800" : "divide-slate-200")}>
          {courses.map((course, index) => (
            <Link
              key={course.id}
              to={getCourseHref(course.id)}
              onPointerEnter={preloadCourseViewerRoute}
              onFocus={preloadCourseViewerRoute}
              onTouchStart={preloadCourseViewerRoute}
              className={cn(
                "group block px-4 py-4 transition-colors sm:px-5",
                theme === "dark" ? "hover:bg-slate-900/85" : "hover:bg-slate-50/90",
              )}
            >
              <div className={cn("flex flex-col gap-3", isSidebar ? "sm:gap-3" : "sm:gap-4")}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div
                      className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                      style={{ backgroundColor: `${course.color}18` }}
                    >
                      {course.mainSlide ? (
                        <FileText className="w-5 h-5" style={{ color: course.color }} />
                      ) : (
                        <BookOpen className="w-5 h-5" style={{ color: course.color }} />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p
                        className={cn(
                          "text-[11px] font-semibold uppercase tracking-[0.18em]",
                          theme === "dark" ? "text-slate-500" : "text-slate-400",
                        )}
                      >
                        {isZh ? `课程 ${String(index + 1).padStart(2, "0")}` : `Course ${String(index + 1).padStart(2, "0")}`}
                      </p>
                      <h4
                        className={cn(
                          "mt-1 font-semibold",
                          isSidebar ? "text-sm leading-6" : "text-base leading-6",
                          theme === "dark" ? "text-white" : "text-gray-900",
                        )}
                      >
                        {getLabel(course.title)}
                      </h4>
                      <p
                        className={cn(
                          "mt-1 text-sm leading-6",
                          isSidebar ? "line-clamp-3" : "line-clamp-2",
                          theme === "dark" ? "text-slate-400" : "text-slate-600",
                        )}
                      >
                        {getLabel(course.description)}
                      </p>
                    </div>
                  </div>

                  <span
                    className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold"
                    style={{ color: course.color }}
                  >
                    {isZh ? "进入课程" : "Open"}
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>

                {(course.mainSlide || course.mediaCount) && (
                  <div className="flex flex-wrap gap-2">
                    {course.mainSlide && (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
                          theme === "dark"
                            ? "border-slate-700 bg-slate-900/85 text-slate-300"
                            : "border-slate-200 bg-slate-50 text-slate-600",
                        )}
                      >
                        <FileText className="w-3.5 h-3.5" style={{ color: course.color }} />
                        {isZh ? "课程课件" : "Slides"}
                      </span>
                    )}
                    {course.mediaCount !== undefined && course.mediaCount > 0 && (
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
                        style={{
                          color: theme === "dark" ? "#f8fafc" : course.color,
                          backgroundColor: theme === "dark" ? `${course.color}20` : `${course.color}10`,
                          borderColor: theme === "dark" ? `${course.color}36` : `${course.color}20`,
                        }}
                      >
                        <Play className="w-3.5 h-3.5" />
                        {course.mediaCount} {isZh ? "个媒体资源" : "media"}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CourseSelector;
