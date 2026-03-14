/**
 * CourseViewerPage - 课件独立查看页面
 *
 * 从 URL 参数获取 courseId，渲染 CourseViewer 组件
 * 顶部保留站点导航与实验返回入口
 */

import { Suspense, lazy, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2, Upload } from "lucide-react";

import { PersistentHeader } from "@/components/shared";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCourseDetailStore } from "@/stores/courseStore";
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
  const { courseId, experimentId } = useParams<{ courseId?: string; experimentId?: string }>();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const resolvedExperimentId = experimentId || courseId;

  const { course, mainSlide, media, hyperlinks, isLoading, error, fetchCourse, reset } =
    useCourseDetailStore();

  useEffect(() => {
    if (resolvedExperimentId) {
      fetchCourse(resolvedExperimentId);
    }

    return () => reset();
  }, [fetchCourse, reset, resolvedExperimentId]);

  const isZh = i18n.language.startsWith("zh");
  const isPendingInitialLoad = Boolean(resolvedExperimentId) && !course && !error;
  const getLabel = (label?: { "zh-CN"?: string; "en-US"?: string }) =>
    label?.[isZh ? "zh-CN" : "en-US"] || label?.["zh-CN"] || label?.["en-US"] || "";

  const courseTitle = getLabel(course?.title) || (isZh ? "实验详情" : "Experiment");
  const backLabel = isZh ? "返回实验总览" : "Back to experiments";

  const courseData = course
    ? {
        id: course.id,
        unitId: course.unitId,
        title: { "zh-CN": course.title["zh-CN"] || "", "en-US": course.title["en-US"] || "" },
        description: {
          "zh-CN": course.description["zh-CN"] || "",
          "en-US": course.description["en-US"] || "",
        },
        coverImage: course.coverImage,
        color: course.color,
        lastUpdated: course.updatedAt,
        mainSlide: mainSlide
          ? {
              id: mainSlide.id,
              url: mainSlide.url,
              title: {
                "zh-CN": mainSlide.title["zh-CN"] || "",
                "en-US": mainSlide.title["en-US"] || "",
              },
            }
          : undefined,
        hyperlinks: hyperlinks.map((hyperlink) => ({
          id: hyperlink.id,
          sourceMediaId: hyperlink.sourceMediaId,
          page: hyperlink.page,
          x: hyperlink.x,
          y: hyperlink.y,
          width: hyperlink.width,
          height: hyperlink.height,
          targetMediaId: hyperlink.targetMediaId,
        })),
        media: media.map((item) => ({
          id: item.id,
          type: item.type,
          url: item.url,
          previewPdfUrl: item.previewPdfUrl,
          title: { "zh-CN": item.title["zh-CN"] || "", "en-US": item.title["en-US"] || "" },
          duration: item.duration,
        })),
      }
    : null;

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-slate-900" : "bg-gray-50"}`}>
      <PersistentHeader
        moduleKey="course"
        moduleName={courseTitle}
        variant="solid"
        compact
        className="sticky top-0 z-40"
      />

      {isLoading || isPendingInitialLoad ? (
        <div
          className={`min-h-[calc(100vh-64px)] flex items-center justify-center ${theme === "dark" ? "bg-slate-900" : "bg-gray-50"}`}
        >
          <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
        </div>
      ) : error || !course || !courseData ? (
        <div
          className={`min-h-[calc(100vh-64px)] flex items-center justify-center ${theme === "dark" ? "bg-slate-900" : "bg-gray-50"}`}
        >
          <div className="text-center">
            <p className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"} mb-4`}>
              {error || (isZh ? "实验不存在" : "Experiment not found")}
            </p>
            <button
              onClick={() => navigate("/experiments")}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              {backLabel}
            </button>
          </div>
        </div>
      ) : (
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
                    仅管理员可上传实验媒体资源
                  </p>
                  <p
                    className={`text-xs ${
                      theme === "dark" ? "text-cyan-100/80" : "text-cyan-700"
                    }`}
                  >
                    使用实验管理页上传视频、图片和 PPT 相关资源。
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/admin/experiments/${course.id}?tab=media`)}
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
            <CourseViewer course={courseData} theme={theme} />
          </Suspense>
        </div>
      )}
    </div>
  );
}
