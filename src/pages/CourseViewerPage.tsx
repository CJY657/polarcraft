/**
 * CourseViewerPage - 课件独立查看页面
 *
 * 从 URL 参数获取 courseId，渲染 CourseViewer 组件
 * 顶部保留站点导航与实验返回入口
 */

import { Suspense, lazy, useEffect } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2, MessageSquarePlus, MessageSquare } from "lucide-react";

import { PersistentHeader } from "@/components/shared";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useCourseDetailStore } from "@/stores/courseStore";
import { loadCourseViewerModule } from "@/lib/routePreload";
import { capturePostHogEventOnce } from "@/lib/posthog";

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
  const location = useLocation();
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

  useEffect(() => {
    if (!course) {
      return;
    }

    capturePostHogEventOnce(`experiment_opened:${location.key}:${course.id}`, "experiment_opened", {
      experiment_id: course.id,
      experiment_title_zh: course.title["zh-CN"] || undefined,
      experiment_title_en: course.title["en-US"] || undefined,
      unit_id: course.unitId,
      route: location.pathname,
    });
  }, [course, location.key, location.pathname]);

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

  const feedbackSearch = course
    ? new URLSearchParams({
        feedback: "experiment",
        courseId: course.id,
        courseTitle,
        originPage: "experiment-viewer",
        originPath: location.pathname,
      }).toString()
    : "";

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
          <Suspense fallback={<ViewerLoader theme={theme} />}>
            <CourseViewer
              course={courseData}
              theme={theme}
              canDownloadResources={user?.role === "admin"}
            />
          </Suspense>

          <div className="fixed bottom-6 right-6 z-30 flex flex-col gap-3">
            <Link
              to={`/feedback?${feedbackSearch}#feedback`}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold shadow-[0_14px_36px_rgba(15,23,42,0.18)] backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(15,23,42,0.24)] sm:px-4 ${
                theme === "dark"
                  ? "border-amber-300/30 bg-slate-950/88 text-amber-100 hover:border-amber-300/50 hover:bg-slate-900"
                  : "border-amber-200 bg-white/92 text-amber-900 hover:border-amber-300 hover:bg-white"
              }`}
              aria-label={isZh ? "提交实验反馈" : "Submit experiment feedback"}
            >
              <span
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${
                  theme === "dark"
                    ? "bg-amber-300/18 text-amber-200"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                <MessageSquarePlus className="h-4 w-4" />
              </span>
              <span className="hidden sm:inline">{isZh ? "实验反馈" : "Feedback"}</span>
            </Link>

            <button
              onClick={() => {
                const discussionElement = document.getElementById("experiment-discussion");
                discussionElement?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold shadow-[0_14px_36px_rgba(15,23,42,0.18)] backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(15,23,42,0.24)] sm:px-4 ${
                theme === "dark"
                  ? "border-indigo-300/30 bg-indigo-950/88 text-indigo-100 hover:border-indigo-300/50 hover:bg-indigo-900"
                  : "border-indigo-200 bg-white/92 text-indigo-900 hover:border-indigo-300 hover:bg-white"
              }`}
              aria-label={isZh ? "跳转至实验讨论" : "Go to discussion"}
            >
              <span
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${
                  theme === "dark"
                    ? "bg-indigo-300/18 text-indigo-200"
                    : "bg-indigo-100 text-indigo-700"
                }`}
              >
                <MessageSquare className="h-4 w-4" />
              </span>
              <span className="hidden sm:inline">{isZh ? "参与讨论" : "Discussion"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
