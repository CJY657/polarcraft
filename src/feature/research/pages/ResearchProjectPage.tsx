/**
 * Research Project Page
 * 研究课题页面
 *
 * Displays a single research project with its members and settings
 * 显示单个研究课题及其成员和设置
 */

import { lazy, Suspense, useState, useEffect, useMemo, useCallback } from "react";
import { useParams, Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown, Loader2 } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { getExampleProjectById } from "@/data/researchExampleProjects";
import { PersistentHeader } from "@/components/shared";
import {
  researchApi,
  type ProjectWithMembers,
  type ProjectMember,
  type FormerProjectMember,
} from "@/lib/research.service";
import {
  profileApi,
  type ProjectSettings,
  type ProjectApplication,
  type PublicProject,
  type PublicProjectDetail,
  type PublicProjectMember,
} from "@/lib/profile.service";
import { ProjectDeleteAction } from "../components/project/ProjectDeleteAction";
import { ProjectChallengeDetail } from "../components/project/ProjectChallengeCards";
import { ProjectEvidenceSection } from "../components/project/ProjectEvidenceSection";
import { ProjectPeerReviewSection } from "../components/project/ProjectPeerReviewSection";
import { ProjectTasksSection } from "../components/project/ProjectTasksSection";
import { ProjectActivityFeed } from "../components/project/ProjectActivityFeed";
import { ResearchAgentPanel } from "../components/project/ResearchAgentPanel";
import {
  hasResearchOutline,
  ResearchInfoSection,
} from "../components/project/ResearchInfoSection";
import { ProjectMembersSection } from "../components/project/ProjectMembersSection";
import { RemoveMemberDialog } from "../components/project/RemoveMemberDialog";
import { ProjectCoverImage } from "../components/shared/ProjectCoverImage";
import {
  ProjectDiscussionSection,
  type ProjectDiscussionJumpRequest,
  type ProjectDiscussionOutline,
} from "../components/project/ProjectDiscussionSection";
import { useAuthDialogStore } from "@/stores/authDialogStore";
import { ProjectLifecycleBadges, ProjectLifecycleJourney } from "../projectLifecycle";
import {
  buildApplicationProjectFromProject,
  formatProjectDate,
  getApplyButtonState,
  splitResearchItems,
} from "./researchProjectViewModel";

const ApplicationManagementDialog = lazy(() =>
  import("../components/project/ApplicationManagementDialog").then((module) => ({
    default: module.ApplicationManagementDialog,
  }))
);
const ProjectEditDialog = lazy(() =>
  import("../components/project/ProjectEditDialog").then((module) => ({ default: module.ProjectEditDialog }))
);
const ProjectCoverDialog = lazy(() =>
  import("../components/project/ProjectCoverDialog").then((module) => ({ default: module.ProjectCoverDialog }))
);
const ProjectSettingsDialog = lazy(() =>
  import("../components/project/ProjectSettingsDialog").then((module) => ({ default: module.ProjectSettingsDialog }))
);
const ProjectApplicationForm = lazy(() =>
  import("../components/project/ProjectApplicationForm").then((module) => ({ default: module.ProjectApplicationForm }))
);

export function ResearchProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const openDialog = useAuthDialogStore((state) => state.openDialog);

  // Check if this is an example project
  const isExampleProject = projectId?.startsWith("example-");
  const exampleId = projectId?.replace("example-", "");
  const exampleProject = exampleId ? getExampleProjectById(exampleId) : undefined;

  // State for real projects
  const [project, setProject] = useState<ProjectWithMembers | null>(null);
  const [publicProject, setPublicProject] = useState<PublicProjectDetail | null>(null);
  const [settings, setSettings] = useState<ProjectSettings | null>(null);
  const [isLoading, setIsLoading] = useState(!isExampleProject);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editDialogInitialFocus, setEditDialogInitialFocus] = useState<'questions' | undefined>();
  const [isCoverDialogOpen, setIsCoverDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false);
  const [isApplicationFormOpen, setIsApplicationFormOpen] = useState(false);

  // Application count state
  const [pendingApplicationCount, setPendingApplicationCount] = useState(0);

  // Member removal state
  const [memberToRemove, setMemberToRemove] = useState<ProjectMember | null>(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);
  const [removeMemberError, setRemoveMemberError] = useState<string | null>(null);
  const [isAddingFormerMemberId, setIsAddingFormerMemberId] = useState<string | null>(null);
  const [restoreMemberError, setRestoreMemberError] = useState<string | null>(null);
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const [discussionJumpRequest, setDiscussionJumpRequest] = useState<ProjectDiscussionJumpRequest | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [hasPeerReviewContent, setHasPeerReviewContent] = useState(false);
  const handlePeerReviewContentChange = useCallback((hasContent: boolean) => {
    setHasPeerReviewContent(hasContent);
  }, []);

  const isPublicGuestMode = !isExampleProject && !authLoading && !isAuthenticated;
  const isAdmin = user?.role === "admin";
  const currentUserRole = useMemo(() => {
    if (!project || !user) return null;
    const member = project.members.find((m) => m.user_id === user.id);
    return member?.role || null;
  }, [project, user]);
  const isReadOnlyMode =
    !projectId?.startsWith("example-")
    && !isAdmin
    && (location.state?.readOnly === true || isPublicGuestMode || (!!project && isAuthenticated && !currentUserRole));
  const backHref = isReadOnlyMode || isPublicGuestMode ? "/lab/explore" : "/lab/projects";
  const loadAuthenticatedProjectData = useCallback(async (targetProjectId: string) => {
    const [projectData, settingsData, applicationsData] = await Promise.all([
      researchApi.getProject(targetProjectId),
      profileApi.getProjectSettings(targetProjectId).catch(() => null),
      profileApi.getProjectApplications(targetProjectId).catch(() => [] as ProjectApplication[]),
    ]);

    setProject(projectData);
    setPublicProject(null);
    setSettings(settingsData);
    setPendingApplicationCount(applicationsData.filter((application) => application.status === "pending").length);
  }, []);

  const refreshProjectData = useCallback(async () => {
    if (!projectId || !isAuthenticated) return;

    try {
      setError(null);
      await loadAuthenticatedProjectData(projectId);
    } catch (err) {
      console.error("Failed to refresh project:", err);
      setError(err instanceof Error ? err.message : "加载课题失败");
    }
  }, [isAuthenticated, loadAuthenticatedProjectData, projectId]);

  useEffect(() => {
    setDiscussionJumpRequest(null);
    setActiveTab("overview");
    setIsDescriptionExpanded(false);
  }, [projectId]);

  useEffect(() => {
    const commentHashPrefix = "#discussion-comment-";

    if (location.hash !== "#discussion-comments" && !location.hash.startsWith(commentHashPrefix)) {
      return;
    }

    const commentId = location.hash.startsWith(commentHashPrefix)
      ? location.hash.slice(commentHashPrefix.length)
      : undefined;

    if (commentId === "") {
      return;
    }

    setActiveTab("discussion");
    setDiscussionJumpRequest((current) => ({
      section: "comments",
      commentId,
      version: (current?.version ?? 0) + 1,
    }));
  }, [location.hash, location.key, location.state?.notificationJumpAt, projectId]);

  // Fetch project data
  useEffect(() => {
    if (isExampleProject || !projectId) {
      setIsLoading(false);
      return;
    }

    if (authLoading) {
      return;
    }

    async function fetchProjectData() {
      const targetProjectId = projectId;

      if (!targetProjectId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        setProject(null);
        setPublicProject(null);
        setSettings(null);
        setPendingApplicationCount(0);
        setHasPeerReviewContent(false);

        if (!isAuthenticated) {
          const publicProjectData = await profileApi.getPublicProjectById(targetProjectId);
          setPublicProject(publicProjectData);
          return;
        }

        await loadAuthenticatedProjectData(targetProjectId);
      } catch (err) {
        console.error("Failed to fetch project:", err);
        setError(err instanceof Error ? err.message : "加载课题失败");
      } finally {
        setIsLoading(false);
      }
    }

    void fetchProjectData();
  }, [projectId, isAuthenticated, authLoading, isExampleProject, loadAuthenticatedProjectData]);

  useEffect(() => {
    if (isLoading || location.hash !== "#project-peer-review") {
      return;
    }

    setActiveTab("review");
    document.getElementById("project-peer-review")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [isLoading, location.hash, location.key, projectId]);

  const isOwner = currentUserRole === "owner";
  const isMember = currentUserRole === "member" || isOwner;

  const formatDate = formatProjectDate;

  // Handle member removal
  const handleRemoveMember = async () => {
    if (!memberToRemove || !projectId) return;

    setIsRemovingMember(true);
    setRemoveMemberError(null);
    try {
      await researchApi.removeProjectMember(projectId, memberToRemove.user_id);
      await refreshProjectData();
      setMemberToRemove(null);
    } catch (err) {
      console.error("Failed to remove member:", err);
      setRemoveMemberError(err instanceof Error ? err.message : "移除成员失败");
    } finally {
      setIsRemovingMember(false);
    }
  };

  const handleRestoreFormerMember = async (member: FormerProjectMember) => {
    if (!projectId) return;

    setIsAddingFormerMemberId(member.user_id);
    setRestoreMemberError(null);
    try {
      await researchApi.addProjectMember(projectId, member.user_id, "member");
      await refreshProjectData();
    } catch (err) {
      console.error("Failed to restore member:", err);
      setRestoreMemberError(err instanceof Error ? err.message : "拉回成员失败");
    } finally {
      setIsAddingFormerMemberId(null);
    }
  };

  const handleDeleteProject = async (confirmationText: string) => {
    if (!projectId) {
      throw new Error("课题不存在");
    }

    setIsDeletingProject(true);

    try {
      await researchApi.deleteProject(projectId, confirmationText);
      navigate("/lab/projects", { replace: true });
    } catch (err) {
      setIsDeletingProject(false);
      throw (err instanceof Error ? err : new Error("删除课题失败"));
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="research-page min-h-screen">
        <main className="research-shell py-6 md:py-8" aria-busy="true">
          <div className="grid animate-pulse gap-7 motion-reduce:animate-none lg:grid-cols-[minmax(0,1fr)_21rem]">
            <div>
              <div className="h-6 w-52 rounded-full bg-[var(--research-head)]" />
              <div className="mt-5 h-9 w-4/5 rounded-lg bg-[var(--research-head)]" />
              <div className="mt-3 h-9 w-3/5 rounded-lg bg-[var(--research-head)]" />
              <div className="mt-6 h-5 w-full rounded bg-[var(--research-head)]" />
              <div className="mt-3 h-5 w-4/5 rounded bg-[var(--research-head)]" />
              <div className="mt-6 h-16 rounded-[0.625rem] bg-[var(--research-head)]" />
              <div className="mt-6 flex gap-3">
                <div className="h-11 w-32 rounded-md bg-[var(--research-head)]" />
                <div className="h-11 w-28 rounded-md bg-[var(--research-head)]" />
              </div>
            </div>
            <div className="aspect-[16/9] rounded-xl bg-[var(--research-head)]" />
          </div>

          <div className="mt-7 flex items-center justify-center gap-3 text-[var(--glass-text-muted)]" role="status">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--paper-accent)] motion-reduce:animate-none" />
            <span className="text-base font-medium">正在加载课题详情...</span>
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (error && !isExampleProject) {
    return (
      <div className="research-page flex min-h-screen items-center justify-center px-6">
        <div className="research-card max-w-md px-8 py-8 text-center">
          <p className="research-error rounded-lg px-4 py-3 text-lg">{error}</p>
          <Link
            to="/lab/projects"
            className="glass-button glass-button-primary mt-5 inline-flex rounded-md px-5 py-2.5 text-base font-semibold text-white"
          >
            返回课题列表
          </Link>
        </div>
      </div>
    );
  }

  // Not found state
  if (!isExampleProject && !project && !publicProject) {
    return <Navigate to={backHref} replace />;
  }

  // Get display data
  const displayProject = isExampleProject
    ? {
        id: projectId!,
        name_zh: exampleProject?.title["zh-CN"] || "示例课题",
        name_en: exampleProject?.title.en || null,
        description_zh: exampleProject?.description["zh-CN"] || "",
        description_en: null,
        research_questions_zh: null,
        research_hypotheses_zh: null,
        basic_plan_zh: null,
        extended_plan_zh: null,
        challenge_review_criteria_zh: null,
        status: "active" as const,
        is_public: true,
        thumbnail: exampleProject?.coverImage || null,
        member_count: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        allow_guest_comments: false,
        enable_task_board: false,
        members: [],
      }
    : publicProject || project!;

  const displayMembers: Array<ProjectMember | PublicProjectMember> = project?.members || publicProject?.members || [];
  const formerMembers = project?.former_members ?? [];
  const displayIsRecruiting = settings?.is_recruiting ?? publicProject?.is_recruiting ?? false;
  const displayRequireApproval = settings?.require_approval ?? publicProject?.require_approval ?? true;
  const displayRecruitmentRequirements =
    settings?.recruitment_requirements ?? publicProject?.recruitment_requirements ?? null;
  const hasPendingApplication = project?.has_pending_application ?? publicProject?.has_pending_application ?? false;
  const isRecruitmentClosed = settings?.is_recruiting === false || publicProject?.is_recruiting === false;
  const applicationProject: PublicProject | null =
    publicProject
    ?? (project
      ? buildApplicationProjectFromProject(project, {
          requireApproval: displayRequireApproval,
          recruitmentRequirements: displayRecruitmentRequirements,
          isRecruitmentClosed,
          maxMembers: settings?.max_members ?? null,
        })
      : null);
  const {
    buttonLabel: applyButtonLabel,
    bannerButtonLabel: applyBannerButtonLabel,
    disabled: applyButtonDisabled,
  } = getApplyButtonState({ isPublicGuestMode, hasPendingApplication, isRecruitmentClosed });

  const canManageProject = !isExampleProject && (isOwner || isAdmin) && !isReadOnlyMode;
  const canDeleteProject = !isExampleProject && !isReadOnlyMode && Boolean(project) && (isOwner || isAdmin);
  const canParticipateInDiscussion = !isExampleProject && Boolean(user && (isMember || isAdmin));
  const canShowDiscussionSection = !isExampleProject && Boolean(projectId && project && isAuthenticated && canParticipateInDiscussion);
  const canShowAgentPanel = canShowDiscussionSection;
  const canManageEvidence = !isExampleProject && Boolean(projectId && project && !isReadOnlyMode && (isMember || isAdmin));
  const canShowEvidenceSection = !isExampleProject && Boolean(projectId && (project || publicProject));
  const canShowPeerReviewSection = canShowEvidenceSection;
  const canShowTasksSection = canShowDiscussionSection;
  const researchOutline: ProjectDiscussionOutline = {
    topicSummary: displayProject.description_zh || "",
    questions: splitResearchItems(displayProject.research_questions_zh),
    hypotheses: splitResearchItems(displayProject.research_hypotheses_zh),
    basicPlan: displayProject.basic_plan_zh || "",
    extendedPlan: displayProject.extended_plan_zh || "",
  };
  const showResearchInfo = hasResearchOutline(researchOutline);
  const showMembersRail = !isExampleProject && displayMembers.length > 0;
  const projectTabs = [
    { id: "overview", label: "挑战概览" },
    ...(showResearchInfo ? [{ id: "design", label: "研究设计" }] : []),
    ...(canShowEvidenceSection ? [{ id: "evidence", label: "课题证据" }] : []),
    ...(canShowPeerReviewSection && hasPeerReviewContent ? [{ id: "review", label: "同伴评审" }] : []),
    ...(canShowTasksSection ? [{ id: "tasks", label: "任务分工" }] : []),
    ...(canShowDiscussionSection ? [{ id: "discussion", label: "参与讨论" }] : []),
  ];
  // A tab can disappear when rights or content change; keep the selection valid.
  const currentTab = projectTabs.some((tab) => tab.id === activeTab) ? activeTab : "overview";
  const descriptionText = displayProject.description_zh || "这个课题还没有写摘要。";
  // No measuring: past this length the four-line clamp reliably kicks in.
  const isDescriptionClampable = descriptionText.length > 150;

  const handleApplyAction = () => {
    if (hasPendingApplication) {
      return;
    }

    if (isPublicGuestMode) {
      openDialog("login");
      return;
    }

    setIsApplicationFormOpen(true);
  };

  const openEditDialog = (initialFocus?: 'questions') => {
    setEditDialogInitialFocus(initialFocus);
    setIsEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditDialogInitialFocus(undefined);
  };

  return (
    <div className="research-page min-h-screen">
      <PersistentHeader
        moduleKey="labGroup"
        variant="glass"
        showBreadcrumb={false}
        className="sticky top-0 z-40 bg-[var(--glass-panel)] text-[var(--paper-foreground)] backdrop-blur-xl [&_.bg-clay-surface-card]:bg-[var(--glass-chip)] [&_.text-clay-ink]:text-[var(--paper-foreground)] [&_.text-clay-muted]:text-[var(--glass-text-muted)]"
        rightContent={
          <Link
            to={backHref}
            className="glass-button inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-base font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </Link>
        }
      />

      <main className="research-shell py-6 md:py-8">
        {/* 只读模式提示 */}
        {isReadOnlyMode && (
          <div className="research-tint-ochre mb-7 flex flex-col gap-4 rounded-[0.625rem] border-[1.5px] px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-base font-semibold text-[var(--paper-foreground)]">
              {isPublicGuestMode ? "你正在浏览公开课题详情" : "你正在以只读模式浏览这个课题"}
            </p>
            <button
              onClick={handleApplyAction}
              disabled={applyButtonDisabled}
              className="glass-button glass-button-primary w-full self-start rounded-md px-4 py-2 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:self-auto"
            >
              {applyBannerButtonLabel}
            </button>
          </div>
        )}

        {/* Project Header — compact hero, cover demoted to the side column */}
        <section className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_21rem]">
          <div className="min-w-0">
            <div className="mb-3.5 flex flex-wrap items-center gap-2">
              <span className="research-kicker mr-1">课题详情</span>
              <ProjectLifecycleBadges
                status={displayProject.status}
                isDormant={displayProject.is_dormant}
              />
              {displayIsRecruiting && (
                <span className="research-chip research-chip-accent inline-flex rounded-md px-2.5 py-1 text-xs font-semibold">
                  招募中
                </span>
              )}
              {displayProject.is_public && (
                <span className="research-chip inline-flex rounded-md px-2.5 py-1 text-xs font-medium">
                  公开课题
                </span>
              )}
            </div>

            <h1
              className="text-balance text-[clamp(1.6rem,2.6vw,2.15rem)] font-bold leading-[1.28] text-[var(--paper-foreground)]"
              style={{ fontFamily: "var(--font-ui-display)" }}
            >
              {displayProject.name_zh}
            </h1>

            {displayProject.name_en && (
              <p className="mt-2.5 text-base italic leading-6 text-[var(--glass-text-muted)]">
                {displayProject.name_en}
              </p>
            )}

            <p
              className={`mt-4 max-w-[62ch] text-base leading-7 text-[var(--paper-foreground)] ${
                isDescriptionClampable && !isDescriptionExpanded ? "line-clamp-4" : ""
              }`}
            >
              {descriptionText}
            </p>
            {isDescriptionClampable && (
              <button
                type="button"
                onClick={() => setIsDescriptionExpanded((expanded) => !expanded)}
                aria-expanded={isDescriptionExpanded}
                className="mt-2 inline-flex items-center gap-1.5 border-b-[1.5px] border-[var(--paper-accent)] pb-0.5 text-sm font-semibold text-[var(--paper-foreground)]"
              >
                {isDescriptionExpanded ? "收起简介" : "展开完整简介"}
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${isDescriptionExpanded ? "rotate-180" : ""}`}
                />
              </button>
            )}

            {/* 内联元信息（替代原三张大指标卡） */}
            <dl className="research-meta mt-5.5">
              <div className="flex items-baseline gap-2">
                <dt className="text-sm font-medium text-[var(--glass-text-muted)]">成员</dt>
                <dd className="text-sm font-semibold text-[var(--paper-foreground)]">
                  <span className="text-base font-extrabold tabular-nums text-[var(--clay-pink)]">
                    {displayProject.member_count}
                  </span>{" "}
                  人
                </dd>
              </div>
              <div className="flex items-baseline gap-2">
                <dt className="text-sm font-medium text-[var(--glass-text-muted)]">创建时间</dt>
                <dd className="text-sm font-semibold tabular-nums text-[var(--paper-foreground)]">
                  {formatDate(displayProject.created_at)}
                </dd>
              </div>
              <div className="flex items-baseline gap-2">
                <dt className="text-sm font-medium text-[var(--glass-text-muted)]">协作方式</dt>
                <dd className="text-sm font-semibold text-[var(--paper-foreground)]">
                  {isPublicGuestMode
                    ? "公开浏览"
                    : isReadOnlyMode
                      ? "访客浏览"
                      : displayIsRecruiting
                        ? `开放招募${displayRequireApproval ? " · 需审批" : ""}`
                        : "组内协作"}
                </dd>
              </div>
            </dl>

            {/* 操作区：主 CTA 与管理操作分组 */}
            <div className="mt-5.5 flex flex-wrap items-center gap-2.5">
              {isReadOnlyMode ? (
                <button
                  onClick={handleApplyAction}
                  disabled={applyButtonDisabled}
                  className="glass-button glass-button-primary inline-flex w-full items-center justify-center rounded-md px-5 py-3 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {applyButtonLabel}
                </button>
              ) : (
                (canManageProject || canDeleteProject) && (
                  <div className="flex flex-wrap items-center gap-2">
                    {canManageProject && (
                      <>
                        <button
                          onClick={() => setIsCoverDialogOpen(true)}
                          className="glass-button inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold"
                        >
                          管理封面
                        </button>
                        <button
                          onClick={() => openEditDialog()}
                          className="glass-button inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold"
                        >
                          编辑信息
                        </button>
                        <button
                          onClick={() => setIsSettingsDialogOpen(true)}
                          className="glass-button inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold"
                        >
                          协作设置
                        </button>
                      </>
                    )}
                    {canDeleteProject && (
                      <ProjectDeleteAction
                        projectName={displayProject.name_zh}
                        onDelete={handleDeleteProject}
                        isDeleting={isDeletingProject}
                      />
                    )}
                  </div>
                )
              )}
            </div>
          </div>

          <figure className="m-0 lg:max-w-none">
            <ProjectCoverImage
              src={displayProject.thumbnail || displayProject.cover_image}
              alt={displayProject.name_zh}
              className="aspect-[16/9] w-full rounded-xl border-[1.5px] border-[var(--research-edge)] shadow-[var(--research-lift)]"
            />
            <figcaption className="mt-2.5 text-center text-xs italic text-[var(--glass-text-muted)]">
              课题封面
            </figcaption>
          </figure>
        </section>

        {/* 生命周期：独立一行的细长步骤条 */}
        <section
          id="project-lifecycle"
          aria-label="课题生命周期"
          className="research-card mt-7 scroll-mt-36 overflow-x-auto px-5 py-4"
        >
          <ProjectLifecycleJourney status={displayProject.status} variant="compact" />
        </section>

        <div className="mt-7 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-7">
          <div className="min-w-0">
            <div
              role="tablist"
              aria-label="课题内容导航"
              className="research-tabbar sticky top-20 z-30 mb-5"
            >
              {projectTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`project-tab-${tab.id}`}
                  aria-selected={currentTab === tab.id}
                  aria-controls={`project-panel-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className="research-tab"
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div
              role="tabpanel"
              id="project-panel-overview"
              aria-labelledby="project-tab-overview"
              hidden={currentTab !== "overview"}
            >
              <ProjectChallengeDetail
                project={{
                  ...displayProject,
                  recruitment_requirements: displayRecruitmentRequirements,
                  is_recruiting: displayIsRecruiting,
                }}
              />
            </div>

            {showResearchInfo && (
              <div
                role="tabpanel"
                id="project-panel-design"
                aria-labelledby="project-tab-design"
                hidden={currentTab !== "design"}
              >
                <ResearchInfoSection
                  outline={researchOutline}
                  canManageQuestions={canManageProject}
                  onManageQuestions={() => openEditDialog('questions')}
                />
              </div>
            )}

            {canShowEvidenceSection && projectId && (
              <div
                role="tabpanel"
                id="project-panel-evidence"
                aria-labelledby="project-tab-evidence"
                hidden={currentTab !== "evidence"}
              >
                <ProjectEvidenceSection
                  projectId={projectId}
                  canManage={canManageEvidence}
                  usePublicEndpoint={Boolean(publicProject && !project)}
                  theme={theme === "dark" ? "dark" : "light"}
                />
              </div>
            )}

            {/* Always mounted: the section itself reports whether its tab is worth showing. */}
            {canShowPeerReviewSection && projectId && (
              <div
                role="tabpanel"
                id="project-panel-review"
                aria-labelledby="project-tab-review"
                hidden={currentTab !== "review"}
              >
                <div id="project-peer-review" className="scroll-mt-36">
                  <ProjectPeerReviewSection
                    projectId={projectId}
                    projectStatus={displayProject.status}
                    reviewCriteria={displayProject.challenge_review_criteria_zh}
                    currentUserId={user?.id}
                    isActiveMember={isMember}
                    usePublicEndpoint={Boolean(publicProject && !project)}
                    theme={theme === "dark" ? "dark" : "light"}
                    onContentChange={handlePeerReviewContentChange}
                  />
                </div>
              </div>
            )}

            {canShowTasksSection && projectId && project && (
              <div
                role="tabpanel"
                id="project-panel-tasks"
                aria-labelledby="project-tab-tasks"
                hidden={currentTab !== "tasks"}
              >
                <ProjectTasksSection
                  projectId={projectId}
                  members={project.members}
                  currentUserId={user?.id}
                  canManage={isOwner || isAdmin}
                  theme={theme === "dark" ? "dark" : "light"}
                />
              </div>
            )}

            {canShowDiscussionSection && projectId && (
              <div
                role="tabpanel"
                id="project-panel-discussion"
                aria-labelledby="project-tab-discussion"
                hidden={currentTab !== "discussion"}
              >
                <ProjectDiscussionSection
                  projectId={projectId}
                  currentUserId={user?.id}
                  canModerate={isOwner || isAdmin}
                  canParticipate={canParticipateInDiscussion}
                  outline={researchOutline}
                  jumpRequest={discussionJumpRequest}
                />
              </div>
            )}
          </div>

          {showMembersRail && (
            <aside id="project-members" className="mt-6 flex flex-col gap-5 scroll-mt-36 lg:mt-0">
              <ProjectMembersSection
                members={displayMembers}
                formerMembers={formerMembers}
                hasProject={!!project}
                currentUserId={user?.id}
                isReadOnlyMode={isReadOnlyMode}
                isOwner={isOwner}
                isAdmin={isAdmin}
                canManageProject={canManageProject}
                pendingApplicationCount={pendingApplicationCount}
                restoreMemberError={restoreMemberError}
                isAddingFormerMemberId={isAddingFormerMemberId}
                onOpenApplications={() => setIsApplicationDialogOpen(true)}
                onRequestRemoveMember={setMemberToRemove}
                onRestoreFormerMember={handleRestoreFormerMember}
              />

              {canShowDiscussionSection && projectId && (
                <ProjectActivityFeed projectId={projectId} limit={15} />
              )}
            </aside>
          )}
        </div>

        {canShowAgentPanel && projectId && (
          <ResearchAgentPanel projectId={projectId} canClearHistory={canManageProject} />
        )}

      </main>

      <Suspense fallback={null}>
        {/* Application Management Dialog */}
        {!isExampleProject && projectId && canManageProject && isApplicationDialogOpen && (
          <ApplicationManagementDialog
            isOpen={isApplicationDialogOpen}
            onClose={() => setIsApplicationDialogOpen(false)}
            projectId={projectId}
            onStatusChange={() => void refreshProjectData()}
          />
        )}

        {/* Edit Dialog */}
        {!isExampleProject && project && isEditDialogOpen && (
          <ProjectEditDialog
            isOpen={isEditDialogOpen}
            onClose={closeEditDialog}
            project={project}
            initialFocusField={editDialogInitialFocus}
            onSuccess={(updatedProject) => {
              setProject({ ...project, ...updatedProject });
            }}
          />
        )}

        {/* Cover Dialog */}
        {!isExampleProject && project && canManageProject && isCoverDialogOpen && (
          <ProjectCoverDialog
            isOpen={isCoverDialogOpen}
            onClose={() => setIsCoverDialogOpen(false)}
            project={project}
            onSuccess={(updatedProject) => {
              setProject({ ...project, ...updatedProject });
            }}
          />
        )}

        {/* Settings Dialog */}
        {!isExampleProject && projectId && isSettingsDialogOpen && (
          <ProjectSettingsDialog
            isOpen={isSettingsDialogOpen}
            onClose={() => setIsSettingsDialogOpen(false)}
            projectId={projectId}
            onSuccess={(updatedSettings) => {
              setSettings(updatedSettings);
            }}
          />
        )}

        {/* Application Form for Read-Only Mode */}
        {isReadOnlyMode && applicationProject && isApplicationFormOpen && (
          <ProjectApplicationForm
            isOpen={isApplicationFormOpen}
            onClose={() => setIsApplicationFormOpen(false)}
            project={applicationProject}
            onSuccess={() => {
              setIsApplicationFormOpen(false);
              if (project) {
                void refreshProjectData();
              }
            }}
          />
        )}
      </Suspense>

      {/* Remove Member Confirmation Dialog */}
      {memberToRemove && (
        <RemoveMemberDialog
          member={memberToRemove}
          isSelf={user?.id === memberToRemove.user_id}
          theme={theme === "dark" ? "dark" : "light"}
          error={removeMemberError}
          isRemoving={isRemovingMember}
          onCancel={() => {
            setMemberToRemove(null);
            setRemoveMemberError(null);
          }}
          onConfirm={handleRemoveMember}
        />
      )}
    </div>
  );
}
