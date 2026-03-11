/**
 * CourseViewerPage - 课件独立查看页面
 *
 * 从 URL 参数获取 courseId，渲染 CourseViewer 组件
 * 简洁的全屏布局，无描述、Tab 菜单
 */

import { Suspense, lazy, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCourseDetailStore } from "@/stores/courseStore";
import { Loader2, Upload } from "lucide-react";
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
  const { user } = useAuth();
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
      <div>
        {user?.role === "admin" && (
          <div className="mb-4 w-full px-4 pt-4 xl:px-6">
            <div
              className={`flex flex-col gap-3 rounded-2xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
                theme === "dark"
                  ? "border-cyan-500/30 bg-cyan-500/10"
                  : "border-cyan-200 bg-cyan-50"
              }`}
            >
              <div>
                <p
                  className={`text-sm font-medium ${
                    theme === "dark" ? "text-cyan-200" : "text-cyan-900"
                  }`}
                >
                  仅管理员可上传课程媒体资源
                </p>
                <p
                  className={`text-xs ${
                    theme === "dark" ? "text-cyan-100/80" : "text-cyan-700"
                  }`}
                >
                  使用课程管理页上传视频、图片和 PPT 相关资源。
                </p>
              </div>
              <button
                onClick={() => navigate(`/admin/courses/${course.id}?tab=media`)}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors sm:w-auto ${
                  theme === "dark"
                    ? "bg-cyan-500 text-white hover:bg-cyan-400"
                    : "bg-cyan-600 text-white hover:bg-cyan-700"
                }`}
              >
                <Upload className="h-4 w-4" />
                上传资源
              </button>
            </div>
          </div>
        )}
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
