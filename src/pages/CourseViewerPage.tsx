/**
 * CourseViewerPage - 课件独立查看页面
 *
 * 从 URL 参数获取 courseId，渲染 CourseViewer 组件
 * 简洁的全屏布局，无描述、Tab 菜单
 */

import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { PersistentHeader } from "@/components/shared";
import { CourseViewer } from "@/feature/course/CourseViewer";
import { COURSE_DATA } from "@/data/courses";
import { cn } from "@/utils/classNames";

export default function CourseViewerPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const course = COURSE_DATA.find((c) => c.id === courseId);

  if (!course) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${theme === "dark" ? "bg-slate-900" : "bg-gray-50"}`}
      >
        <PersistentHeader />
        <div className="text-center">
          <p className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"} mb-4`}>
            课程不存在
          </p>
          <button
            onClick={() => navigate("/courses")}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            返回课程列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-slate-900" : "bg-gray-50"}`}>
      <PersistentHeader
        moduleKey="courses"
        moduleName={course.title["zh-CN"]}
        variant="glass"
        className={cn(
          "sticky top-0 z-40",
          theme === "dark"
            ? "bg-slate-900/80 border-b border-slate-700"
            : "bg-white/80 border-b border-gray-200",
        )}
      />
      <div className="pt-4 pb-8">
        <CourseViewer
          course={course}
          onBack={() => navigate("/courses")}
          theme={theme}
        />
      </div>
    </div>
  );
}
