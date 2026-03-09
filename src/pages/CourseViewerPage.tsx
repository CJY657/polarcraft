/**
 * CourseViewerPage - 课件独立查看页面
 *
 * 从 URL 参数获取 courseId，渲染 CourseViewer 组件
 * 简洁的全屏布局，无描述、Tab 菜单
 */

import { Suspense, lazy, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { useCourseDetailStore } from "@/stores/courseStore";
import { Loader2 } from "lucide-react";
import { loadCourseViewerModule } from "@/lib/routePreload";

const CourseViewer = lazy(() =>
  loadCourseViewerModule().then((module) => ({ default: module.CourseViewer }))
);

function ViewerLoader({ theme }: { theme: "dark" | "light" }) {
  return (
    <div
      className={`min-h-[60vh] flex items-center justify-center ${theme === "dark" ? "bg-slate-900" : "bg-gray-50"}`}
    >
      <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
    </div>
  );
}

export default function CourseViewerPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const { course, mainSlide, media, hyperlinks, isLoading, error, fetchCourse, reset } =
    useCourseDetailStore();

  useEffect(() => {
    if (courseId) {
      fetchCourse(courseId);
    }
    return () => reset();
  }, [courseId, fetchCourse, reset]);

  if (isLoading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${theme === "dark" ? "bg-slate-900" : "bg-gray-50"}`}
      >
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${theme === "dark" ? "bg-slate-900" : "bg-gray-50"}`}
      >
        <div className="text-center">
          <p className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"} mb-4`}>
            {error || "课程不存在"}
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

  // Transform data to match CourseViewer expected format
  const courseData = {
    id: course.id,
    unitId: course.unitId,
    title: { "zh-CN": course.title["zh-CN"] || "", "en-US": course.title["en-US"] || "" },
    description: { "zh-CN": course.description["zh-CN"] || "", "en-US": course.description["en-US"] || "" },
    coverImage: course.coverImage,
    color: course.color,
    lastUpdated: course.updatedAt,
    mainSlide: mainSlide
      ? {
          id: mainSlide.id,
          url: mainSlide.url,
          title: { "zh-CN": mainSlide.title["zh-CN"] || "", "en-US": mainSlide.title["en-US"] || "" },
        }
      : undefined,
    hyperlinks: hyperlinks.map((h) => ({
      id: h.id,
      page: h.page,
      x: h.x,
      y: h.y,
      width: h.width,
      height: h.height,
      targetMediaId: h.targetMediaId,
    })),
    media: media.map((m) => ({
      id: m.id,
      type: m.type,
      url: m.url,
      title: { "zh-CN": m.title["zh-CN"] || "", "en-US": m.title["en-US"] || "" },
      duration: m.duration,
    })),
  };

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-slate-900" : "bg-gray-50"}`}>
      <div className="pt-4 pb-8">
        <Suspense fallback={<ViewerLoader theme={theme} />}>
          <CourseViewer
            course={courseData}
            onBack={() => navigate(`/units/${course.unitId}`)}
            theme={theme}
          />
        </Suspense>
      </div>
    </div>
  );
}
