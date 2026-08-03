/**
 * CourseViewerPage - 实验与前沿应用层级工作台
 *
 * /experiments 与 /applications 按 knowledgeTag 分流，但共用同一套：
 * 单元 → 内容条目 → 课件材料 / 实验数据 → 文件。
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
import { normalizeKnowledgeTag, type KnowledgeTag } from "@/lib/course.service";
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
          experimentalDataFiles={EMPTY_PRESENTATION_FILES}
          activePresentationFileId={null}
          activeExperimentalDataFileId={null}
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
  const resolvedContentId = applicationId || experimentId || courseId;

  const { course, mainSlide, media, hyperlinks, isLoading, error, fetchCourse, reset } =
    useCourseDetailStore();

  useEffect(() => {
    if (resolvedContentId) {
      fetchCourse(resolvedContentId);
    }

    return () => reset();
  }, [fetchCourse, reset, resolvedContentId]);

  const isZh = i18n.language.startsWith("zh");
  const isApplicationRoute = location.pathname.startsWith("/applications");
  const viewerRootPath = isApplicationRoute ? "/applications" : "/experiments";
  const workspaceKnowledgeTag: KnowledgeTag = isApplicationRoute
    ? "optical_device"
    : "foundation";
  const isPendingInitialLoad = Boolean(resolvedContentId) && !course && !error;
  const getLabel = useCallback(
    (label?: { "zh-CN"?: string; "en-US"?: string }) =>
      label?.[isZh ? "zh-CN" : "en-US"] || label?.["zh-CN"] || label?.["en-US"] || "",
    [isZh],
  );

  const hierarchy = useExperimentHierarchy({
    enabled: true,
    isZh,
    knowledgeTag: workspaceKnowledgeTag,
  });
  const hierarchyMatchesWorkspace = hierarchy.loadedKnowledgeTag === workspaceKnowledgeTag;
  const hierarchyUnits = hierarchyMatchesWorkspace ? hierarchy.units : [];
  const hierarchyIsLoading = hierarchy.isLoading || !hierarchyMatchesWorkspace;
  const hierarchyError = hierarchyMatchesWorkspace ? hierarchy.error : null;

  // 模块根路径没有内容 ID 时，落位到该分类下第一个可用条目
  useEffect(() => {
    if (resolvedContentId || hierarchyIsLoading || hierarchyError) {
      return;
    }

    const firstExperimentId = findFirstExperimentId(hierarchyUnits);
    if (firstExperimentId) {
      navigate(`${viewerRootPath}/${firstExperimentId}`, { replace: true });
    }
  }, [
    hierarchyError,
    hierarchyIsLoading,
    hierarchyUnits,
    navigate,
    resolvedContentId,
    viewerRootPath,
  ]);

  const handleSelectExperiment = useCallback(
    (nextExperimentId: string) => {
      if (nextExperimentId === resolvedContentId) {
        return;
      }

      navigate(`${viewerRootPath}/${nextExperimentId}`);
    },
    [navigate, resolvedContentId, viewerRootPath],
  );

  const navigation = useMemo<ExperimentCurriculumNavigation>(
    () => ({
      units: hierarchyUnits,
      activeExperimentId: resolvedContentId ?? null,
      isLoading: hierarchyIsLoading,
      error: hierarchyError,
      onRetry: hierarchy.retry,
      onSelectExperiment: handleSelectExperiment,
      contentKind: isApplicationRoute ? "application" : "experiment",
    }),
    [
      handleSelectExperiment,
      hierarchy.retry,
      hierarchyError,
      hierarchyIsLoading,
      hierarchyUnits,
      isApplicationRoute,
      resolvedContentId,
    ],
  );

  const fallbackTitle = isApplicationRoute
    ? isZh
      ? "前沿应用"
      : "Frontier Applications"
    : isZh
      ? "实验内容"
      : "Experiments";
  const detailFallbackTitle = isApplicationRoute
    ? isZh
      ? "应用详情"
      : "Application"
    : isZh
      ? "实验详情"
      : "Experiment";
  const courseKnowledgeTag = course ? normalizeKnowledgeTag(course.knowledgeTag) : null;
  const isCourseInCurrentWorkspace = courseKnowledgeTag === workspaceKnowledgeTag;
  const courseTitle =
    (isCourseInCurrentWorkspace ? getLabel(course?.title) : "") ||
    (!resolvedContentId ? fallbackTitle : detailFallbackTitle);

  useEffect(() => {
    if (!course || isCourseInCurrentWorkspace) {
      return;
    }

    if (courseKnowledgeTag === "foundation") {
      navigate(`/experiments/${course.id}`, { replace: true });
      return;
    }

    if (courseKnowledgeTag === "optical_device") {
      navigate(`/applications/${course.id}`, { replace: true });
      return;
    }

    navigate(viewerRootPath, { replace: true });
  }, [
    course,
    courseKnowledgeTag,
    isCourseInCurrentWorkspace,
    navigate,
    viewerRootPath,
  ]);

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
  const hasViewerContent =
    Boolean(course && courseData) &&
    isCourseInCurrentWorkspace &&
    !error &&
    !isViewerPending;

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
            onClick={() => resolvedContentId && fetchCourse(resolvedContentId)}
            className="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
          >
            {isZh ? "重新加载" : "Retry"}
          </button>
        </div>
      );
    }

    if (hierarchyError) {
      return (
        <p className={`text-center ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
          {isApplicationRoute
            ? isZh
              ? "请在左侧目录重试加载前沿应用。"
              : "Retry loading the applications on the left."
            : isZh
              ? "请在左侧目录重试加载实验内容。"
              : "Retry loading the curriculum on the left."}
        </p>
      );
    }

    if (!hierarchyIsLoading && findFirstExperimentId(hierarchyUnits) === null) {
      return (
        <p className={`text-center ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
          {isApplicationRoute
            ? isZh
              ? "暂时还没有可进入的前沿应用。"
              : "No frontier applications are available yet."
            : isZh
              ? "暂时还没有可进入的实验内容。"
              : "No experiment content is available yet."}
        </p>
      );
    }

    return <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />;
  };

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-slate-900" : "bg-gray-50"}`}>
      <PersistentHeader
        moduleKey={isApplicationRoute ? "applications" : "course"}
        moduleName={courseTitle}
        variant="solid"
        compact
        className="sticky top-0 z-40"
      />

      {hasViewerContent && courseData ? (
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
        <ExperimentWorkspaceShell navigation={navigation} theme={theme} isZh={isZh}>
          {renderWorkspaceFallbackMessage()}
        </ExperimentWorkspaceShell>
      )}
    </div>
  );
}
