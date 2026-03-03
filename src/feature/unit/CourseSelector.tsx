/**
 * CourseSelector Component
 * 课程选择器组件
 *
 * Displays a list of courses for a unit
 * 显示单元下的课程列表
 */

import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils/classNames";
import { BookOpen, Play, FileText, ImageIcon, ChevronRight } from "lucide-react";
import type { UnitCourse } from "@/lib/unit.service";

interface CourseSelectorProps {
  unitId: string;
  courses: UnitCourse[];
  unitColor: string;
}

export function CourseSelector({ unitId, courses, unitColor }: CourseSelectorProps) {
  const { theme } = useTheme();
  const { i18n } = useTranslation();
  const navigate = useNavigate();

  const isZh = i18n.language === "zh-CN";

  const getLabel = (label: { "zh-CN"?: string; "en-US"?: string }) => {
    return label[isZh ? "zh-CN" : "en-US"] || label["zh-CN"] || label["en-US"] || "";
  };

  if (courses.length === 0) {
    return (
      <div
        className={cn(
          "text-center py-10 rounded-xl",
          theme === "dark" ? "bg-slate-800/50" : "bg-gray-50"
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

  return (
    <div className="space-y-3">
      {/* Section title */}
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5" style={{ color: unitColor }} />
        <h3
          className={cn("text-lg font-semibold", theme === "dark" ? "text-white" : "text-gray-900")}
        >
          {isZh ? "选择课程" : "Select Course"}
        </h3>
        <span
          className={cn(
            "text-sm px-2 py-0.5 rounded-full",
            theme === "dark" ? "bg-slate-700 text-gray-300" : "bg-gray-200 text-gray-600"
          )}
        >
          {courses.length}
        </span>
      </div>

      {/* Course list */}
      <div
        className={cn(
          "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",
        )}
      >
        {courses.map((course) => (
          <div
            key={course.id}
            onClick={() => navigate(`/units/${unitId}/courses/${course.id}`)}
            className={cn(
              "group rounded-xl p-4 transition-all duration-200 cursor-pointer hover:scale-[1.02]",
              theme === "dark"
                ? "bg-slate-800/70 hover:bg-slate-700/70 border border-slate-700"
                : "bg-white hover:bg-gray-50 border border-gray-200 shadow-sm hover:shadow"
            )}
          >
            {/* Course header */}
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${course.color}20` }}
              >
                {course.mainSlide ? (
                  <FileText className="w-5 h-5" style={{ color: course.color }} />
                ) : (
                  <BookOpen className="w-5 h-5" style={{ color: course.color }} />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4
                  className={cn(
                    "font-medium mb-1 truncate",
                    theme === "dark" ? "text-white" : "text-gray-900"
                  )}
                >
                  {getLabel(course.title)}
                </h4>
                <p
                  className={cn(
                    "text-xs line-clamp-2",
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  )}
                >
                  {getLabel(course.description)}
                </p>
              </div>

              {/* Arrow */}
              <ChevronRight
                className={cn(
                  "w-5 h-5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity",
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                )}
              />
            </div>

            {/* Course stats */}
            {(course.mainSlide || course.mediaCount) && (
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-dashed border-gray-700/30">
                {course.mainSlide && (
                  <div
                    className="flex items-center gap-1 text-xs"
                    style={{ color: course.color }}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{isZh ? "课件" : "Slides"}</span>
                  </div>
                )}
                {course.mediaCount !== undefined && course.mediaCount > 0 && (
                  <div
                    className="flex items-center gap-1 text-xs"
                    style={{ color: course.color }}
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>
                      {course.mediaCount} {isZh ? "媒体" : "media"}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default CourseSelector;
