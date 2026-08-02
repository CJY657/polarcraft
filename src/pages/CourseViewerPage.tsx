/**
 * CourseViewerPage - 实验工作台 / 课件独立查看页面
 *
 * /experiments 与 /experiments/:experimentId 共用同一个工作台：
 * 左侧是 单元 → 实验 → 课件材料 → 文件 的层级目录，右侧是课件与实验数据两个展示区。
 * /applications/:applicationId 仍然使用不带层级导航的原有查看器。
 */

import { Suspense, lazy, useCallback, useEffect, useMemo, type ReactNode } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2, MessageSquarePlus, MessageSquare } from "lucide-react";

import { PersistentHeader } from "@/components/shared";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useCourseDetailStore } from "@/stores/courseStore";
import {
  ExperimentCurriculumTree,
  type ExperimentCurriculumNavigation,
} from "@/feature/course/ExperimentCurriculumTree";
import {
  findFirstExperimentId,
  type ExperimentFile,
} from "@/feature/course/experimentHierarchy";
import { useExperimentHierarchy } from "@/feature/course/useExperimentHierarchy";
import { loadCourseViewerModule } from "@/lib/routePreload";
import { capturePostHogEventOnce } from "@/lib/posthog";

const CourseViewer = lazy(() =>
  loadCourseViewerModule().then((module) => ({ default: module.CourseViewer }))
);

const EMPTY_PRESENTATION_FILES: ExperimentFile[] = [];

function ViewerLoader({ theme }: { theme: "dark" | "light" }) {
  return (
    <div
      className={`min-h-[60vh] flex items-center justify-center ${theme === "dark" ? "bg-slate-900" : "bg-gray-50"}`}
    >
      <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
    </div>
  );
}

/**
 * 还没有选中实验（或实验详情加载/失败）时的工作台骨架：
 * 目录始终可见，右侧提示当前状态。
 */
function ExperimentWorkspaceShell({
  navigation,
  theme,
  isZh,
  children,
}: {
  navigation: ExperimentCurriculumNavigation;
  theme: "dark" | "light";
  isZh: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`flex min-h-[calc(100vh-64px)] flex-col overflow-visible border-t lg:h-[calc(100vh-64px)] lg:flex-row lg:overflow-hidden ${
        theme === "dark" ? "border-slate-700/70 bg-slate-900/40" : "border-slate-200 bg-white/50"
      }`}
    >
      <aside
        className={`persistent-scrollbar w-full flex-shrink-0 overflow-visible border-b lg:h-full lg:w-[236px] lg:overflow-y-auto lg:border-b-0 lg:border-r xl:w-[260px] 2xl:w-[288px] ${
          theme === "dark"
            ? "border-slate-700/70 bg-slate-800/40"
            : "border-slate-200 bg-slate-50/50"
        }`}
      >
        <ExperimentCurriculumTree
          navigation={navigation}
          presentationFiles={EMPTY_PRESENTATION_FILES}
          activePresentationFileId={null}
          onSelectFile={() => undefined}
          theme={theme}
          isZh={isZh}
          idPrefix="curriculum-shell"
        />
      </aside>

      <main className="flex-1 overflow-visible lg:h-full lg:overflow-y-auto persistent-scrollbar">
        <div className="flex min-h-[40vh] items-center justify-center p-8 lg:min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function CourseViewerPage() {
  const { courseId, experimentId, applicationId } = useParams<{
    courseId?: string;
    experimentId?: string;
    applicationId?: string;
  }>();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const resolvedExperimentId = applicationId || experimentId || courseId;

  const { course, mainSlide, media, hyperlinks, isLoading, error, fetchCourse, reset } =
    useCourseDetailStore();

  useEffect(() => {
    if (resolvedExperimentId) {
      fetchCourse(resolvedExperimentId);
    }

    return () => reset();
  }, [fetchCourse, reset, resolvedExperimentId]);

  const isZh = i18n.language.startsWith("zh");
  const isApplicationRoute = location.pathname.startsWith("/applications");
  const isExperimentWorkspace = !isApplicationRoute;
  const viewerRootPath = isApplicationRoute ? "/applications" : "/experiments";
  const isPendingInitialLoad = Boolean(resolvedExperimentId) && !course && !error;
  const getLabel = useCallback(
    (label?: { "zh-CN"?: string; "en-US"?: string }) =>
      label?.[isZh ? "zh-CN" : "en-US"] || label?.["zh-CN"] || label?.["en-US"] || "",
    [isZh],
  );

  const hierarchy = useExperimentHierarchy({ enabled: isExperimentWorkspace, isZh });

  // /experiments 没有实验 ID 时落位到第一个可用实验
  useEffect(() => {
    if (
      !isExperimentWorkspace ||
      resolvedExperimentId ||
      hierarchy.isLoading ||
      hierarchy.error
    ) {
      return;
    }

    const firstExperimentId = findFirstExperimentId(hierarchy.units);
    if (firstExperimentId) {
      navigate(`/experiments/${firstExperimentId}`, { replace: true });
    }
  }, [
    hierarchy.error,
    hierarchy.isLoading,
    hierarchy.units,
    isExperimentWorkspace,
    navigate,
    resolvedExperimentId,
  ]);

  const handleSelectExperiment = useCallback(
    (nextExperimentId: string) => {
      if (nextExperimentId === resolvedExperimentId) {
        return;
      }

      navigate(`/experiments/${nextExperimentId}`);
    },
    [navigate, resolvedExperimentId],
  );

  const navigation = useMemo<ExperimentCurriculumNavigation>(
    () => ({
      units: hierarchy.units,
      activeExperimentId: resolvedExperimentId ?? null,
      isLoading: hierarchy.isLoading,
      error: hierarchy.error,
      onRetry: hierarchy.retry,
      onSelectExperiment: handleSelectExperiment,
    }),
    [
      handleSelectExperiment,
      hierarchy.error,
      hierarchy.isLoading,
      hierarchy.retry,
      hierarchy.units,
      resolvedExperimentId,
    ],
  );

  const fallbackTitle = isZh ? "实验内容" : "Experiments";
  const courseTitle =
    getLabel(course?.title) ||
    (isExperimentWorkspace && !resolvedExperimentId
      ? fallbackTitle
      : isZh
        ? "实验详情"
        : "Experiment");
  const backLabel = isApplicationRoute
    ? isZh
      ? "返回前沿应用"
      : "Back to applications"
    : isZh
      ? "返回实验总览"
      : "Back to experiments";

  useEffect(() => {
    if (!course || isApplicationRoute || course.knowledgeTag !== "optical_device") {
      return;
    }

    navigate(`/applications/${course.id}`, { replace: true });
  }, [course, isApplicationRoute, navigate]);

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

  const courseData = useMemo(() => {
    if (!course) {
      return null;
    }

    return {
      id: course.id,
      unitId: course.unitId,
      title: { "zh-CN": course.title["zh-CN"] || "", "en-US": course.title["en-US"] || "" },
      description: {
        "zh-CN": course.description["zh-CN"] || "",
        "en-US": course.description["en-US"] || "",
      },
      coverImage: course.coverImage,
      color: course.color,
      knowledgeTag: course.knowledgeTag,
      lastUpdated: course.updatedAt,
      mainSlide: mainSlide
        ? {
            id: mainSlide.id,
            url: mainSlide.url,
            title: {
              "zh-CN": mainSlide.title["zh-CN"] || "",
              "en-US": mainSlide.title["en-US"] || "",
            },
            knowledgeTag: mainSlide.knowledgeTag,
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
        knowledgeTag: item.knowledgeTag,
        duration: item.duration,
      })),
    };
  }, [course, hyperlinks, mainSlide, media]);

  const feedbackSearch = useMemo(
    () =>
      course
        ? new URLSearchParams({
            feedback: "experiment",
            courseId: course.id,
            courseTitle,
            originPage: "experiment-viewer",
            originPath: location.pathname,
          }).toString()
        : "",
    [course, courseTitle, location.pathname],
  );

  const isViewerPending = isLoading || isPendingInitialLoad;
  const hasViewerContent = Boolean(course && courseData) && !error && !isViewerPending;

  const renderViewerActions = () => (
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
            theme === "dark" ? "bg-amber-300/18 text-amber-200" : "bg-amber-100 text-amber-700"
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
            theme === "dark" ? "bg-indigo-300/18 text-indigo-200" : "bg-indigo-100 text-indigo-700"
          }`}
        >
          <MessageSquare className="h-4 w-4" />
        </span>
        <span className="hidden sm:inline">{isZh ? "参与讨论" : "Discussion"}</span>
      </button>
    </div>
  );

  const renderWorkspaceFallbackMessage = () => {
    if (isViewerPending) {
      return <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />;
    }

    if (error) {
      return (
        <div className="text-center">
          <p className={`mb-4 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>{error}</p>
          <button
            onClick={() => resolvedExperimentId && fetchCourse(resolvedExperimentId)}
            className="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
          >
            {isZh ? "重新加载" : "Retry"}
          </button>
        </div>
      );
    }

    if (hierarchy.error) {
      return (
        <p className={`text-center ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
          {isZh ? "请在左侧目录重试加载实验内容。" : "Retry loading the curriculum on the left."}
        </p>
      );
    }

    if (!hierarchy.isLoading && findFirstExperimentId(hierarchy.units) === null) {
      return (
        <p className={`text-center ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
          {isZh ? "暂时还没有可进入的实验内容。" : "No experiment content is available yet."}
        </p>
      );
    }

    return <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />;
  };

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-slate-900" : "bg-gray-50"}`}>
      <PersistentHeader
        moduleKey="course"
        moduleName={courseTitle}
        variant="solid"
        compact
        className="sticky top-0 z-40"
      />

      {isExperimentWorkspace ? (
        hasViewerContent && courseData ? (
          <div>
            <Suspense fallback={<ViewerLoader theme={theme} />}>
              <CourseViewer
                course={courseData}
                theme={theme}
                canDownloadResources={user?.role === "admin"}
                backPath={viewerRootPath}
                backLabel={isZh ? "返回" : "Back"}
                navigation={navigation}
              />
            </Suspense>

            {renderViewerActions()}
          </div>
        ) : (
          <ExperimentWorkspaceShell
            navigation={navigation}
            theme={theme}
            isZh={isZh}
          >
            {renderWorkspaceFallbackMessage()}
          </ExperimentWorkspaceShell>
        )
      ) : isViewerPending ? (
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
              onClick={() => navigate(viewerRootPath)}
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
              backPath={viewerRootPath}
              backLabel={isZh ? "返回" : "Back"}
            />
          </Suspense>

          {renderViewerActions()}
        </div>
      )}
    </div>
  );
}
