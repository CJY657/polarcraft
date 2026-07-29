/**
 * Research Project Page
 * 研究课题页面
 *
 * Displays a single research project with its members and settings
 * 显示单个研究课题及其成员和设置
 */

import { lazy, Suspense, useState, useEffect, useMemo, useCallback } from "react";
import { useParams, Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Settings,
  Edit3,
  Loader2,
  Globe,
  AlertCircle,
  ImagePlus,
} from "lucide-react";
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
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
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
  }, [projectId]);

  // Highlight the section nav pill matching the section currently in view
  useEffect(() => {
    if (isLoading || typeof IntersectionObserver === "undefined") {
      return;
    }

    const sectionIds = [
      "project-challenge",
      "project-research-info",
      "project-evidence",
      "project-peer-review",
      "project-tasks",
      "project-members",
      "project-discussion",
    ];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActiveSectionId(visible[0].target.id);
        }
      },
      { rootMargin: "-25% 0px -65% 0px" }
    );

    for (const id of sectionIds) {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    }

    return () => observer.disconnect();
  }, [isLoading, projectId]);

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
          <section className="research-hero rounded-3xl p-5 sm:p-7 lg:p-8">
            <div className="relative grid animate-pulse gap-8 motion-reduce:animate-none lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)] lg:items-center">
              <div>
                <div className="h-7 w-52 rounded-full bg-[var(--glass-chip)]" />
                <div className="mt-5 h-11 w-4/5 rounded-xl bg-[var(--glass-chip)]" />
                <div className="mt-3 h-11 w-3/5 rounded-xl bg-[var(--glass-chip)]" />
                <div className="mt-6 h-5 w-full rounded bg-[var(--glass-chip)]" />
                <div className="mt-3 h-5 w-4/5 rounded bg-[var(--glass-chip)]" />
                <div className="mt-7 flex gap-3">
                  <div className="h-11 w-32 rounded-full bg-[var(--glass-chip)]" />
                  <div className="h-11 w-28 rounded-full bg-[var(--glass-chip)]" />
                </div>
              </div>
              <div className="aspect-[16/9] rounded-2xl bg-[var(--glass-chip)]" />
            </div>

            <div className="relative mt-6 grid animate-pulse gap-3 motion-reduce:animate-none sm:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="research-metric h-20 rounded-2xl" />
              ))}
            </div>
          </section>

          <div className="mt-5 flex items-center justify-center gap-3 text-[var(--glass-text-muted)]" role="status">
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
        <div className="research-panel max-w-md rounded-3xl px-8 py-8 text-center">
          <p className="research-error rounded-2xl px-4 py-3 text-lg">{error}</p>
          <Link
            to="/lab/projects"
            className="glass-button glass-button-primary mt-5 inline-flex rounded-full px-5 py-2.5 text-base font-semibold text-white"
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
  const projectSectionLinks = [
    { href: "#project-challenge", label: "挑战概览" },
    ...(showResearchInfo ? [{ href: "#project-research-info", label: "研究设计" }] : []),
    ...(canShowDiscussionSection ? [{ href: "#project-discussion", label: "参与讨论" }] : []),
    ...(canShowEvidenceSection ? [{ href: "#project-evidence", label: "课题证据" }] : []),
    ...(canShowPeerReviewSection && hasPeerReviewContent
      ? [{ href: "#project-peer-review", label: "同伴评审" }]
      : []),
    ...(canShowTasksSection ? [{ href: "#project-tasks", label: "任务分工" }] : []),
    ...(showMembersRail ? [{ href: "#project-members", label: "团队成员" }] : []),
  ];

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
          <div className="research-panel-soft mb-6 flex flex-col gap-4 rounded-3xl p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="research-chip flex h-10 w-10 items-center justify-center rounded-xl">
                <AlertCircle className="h-4 w-4 text-[var(--paper-link)]" />
              </div>
              <p className="text-base font-semibold text-[var(--paper-foreground)]">
                {isPublicGuestMode ? "你正在浏览公开课题详情" : "你正在以只读模式浏览这个课题"}
              </p>
            </div>
            <button
              onClick={handleApplyAction}
              disabled={applyButtonDisabled}
              className="glass-button glass-button-primary w-full self-start rounded-full px-4 py-2.5 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:self-auto"
            >
              {applyBannerButtonLabel}
            </button>
          </div>
        )}

        {/* Project Header */}
        <section className="research-hero mb-6 rounded-3xl p-5 sm:p-7 lg:p-8">
          <div className="relative z-[1] grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)] lg:items-center">
            <div className="min-w-0 py-1">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="research-kicker">课题详情</span>
                <ProjectLifecycleBadges
                  status={displayProject.status}
                  isDormant={displayProject.is_dormant}
                />
                {displayIsRecruiting && (
                  <span className="research-chip research-chip-accent inline-flex rounded-full px-3 py-1 text-sm font-semibold">
                    招募中
                  </span>
                )}
                {displayProject.is_public && (
                  <span className="research-chip inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium">
                    <Globe className="h-3.5 w-3.5" />
                    公开课题
                  </span>
                )}
              </div>

              <h1
                className="text-balance text-[clamp(2rem,4vw,3.3rem)] font-semibold leading-[1.06] text-[var(--paper-foreground)]"
                style={{ fontFamily: "var(--font-ui-display)" }}
              >
                {displayProject.name_zh}
              </h1>

              {displayProject.name_en && (
                <p className="mt-2 text-lg text-[var(--glass-text-muted)]">{displayProject.name_en}</p>
              )}

              <p className="mt-3 max-w-2xl text-lg leading-7 text-[var(--glass-text-muted)]">
                {displayProject.description_zh || "这个课题还没有写摘要。"}
              </p>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
                {isReadOnlyMode ? (
                  <button
                    onClick={handleApplyAction}
                    disabled={applyButtonDisabled}
                    className="glass-button glass-button-primary inline-flex w-full items-center justify-center rounded-full px-5 py-2.5 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {applyButtonLabel}
                  </button>
                ) : (
                  <>
                    {canManageProject && (
                      <>
                        <button
                          onClick={() => setIsCoverDialogOpen(true)}
                          className="glass-button inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-base font-medium sm:w-auto"
                        >
                          <ImagePlus className="h-4 w-4 text-[var(--paper-link)]" />
                          管理封面
                        </button>
                        <button
                          onClick={() => openEditDialog()}
                          className="glass-button inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-base font-medium sm:w-auto"
                        >
                          <Edit3 className="h-4 w-4 text-[var(--paper-link)]" />
                          编辑信息
                        </button>
                        <button
                          onClick={() => setIsSettingsDialogOpen(true)}
                          className="glass-button inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-base font-medium sm:w-auto"
                        >
                          <Settings className="h-4 w-4 text-[var(--paper-link)]" />
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
                  </>
                )}
              </div>
            </div>

            <div className="min-w-0">
              <div className="rounded-2xl border border-[var(--glass-stroke)] bg-[var(--glass-panel-soft)] p-2 shadow-[var(--glass-shadow)]">
                <ProjectCoverImage
                  src={displayProject.thumbnail || displayProject.cover_image}
                  alt={displayProject.name_zh}
                  className="aspect-[16/9] w-full rounded-xl"
                />
              </div>
            </div>
          </div>

          <dl className="relative z-[1] mt-4 grid gap-3 sm:grid-cols-3">
            <div className="research-metric flex min-h-20 flex-col justify-center gap-1 rounded-2xl px-5 py-3">
              <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--glass-text-muted)]">成员</dt>
              <dd className="text-2xl font-bold tabular-nums text-[var(--paper-foreground)]">{displayProject.member_count}</dd>
            </div>
            <div className="research-metric flex min-h-20 flex-col justify-center gap-1 rounded-2xl px-5 py-3">
              <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--glass-text-muted)]">创建时间</dt>
              <dd className="text-base font-semibold tabular-nums text-[var(--paper-foreground)]">{formatDate(displayProject.created_at)}</dd>
            </div>
            <div className="research-metric flex min-h-20 flex-col justify-center gap-1 rounded-2xl px-5 py-3">
              <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--glass-text-muted)]">协作方式</dt>
              <dd className="text-base font-semibold text-[var(--paper-foreground)]">
                {isPublicGuestMode ? "公开浏览" : isReadOnlyMode ? "访客浏览" : displayIsRecruiting ? "开放招募" : "组内协作"}
              </dd>
            </div>
          </dl>

          <div
            id="project-lifecycle"
            className="relative z-[1] mt-4 scroll-mt-36 border-t border-[var(--glass-stroke)] pt-3"
          >
            <ProjectLifecycleJourney status={displayProject.status} variant="compact" />
          </div>
        </section>

        <nav
          aria-label="课题内容导航"
          className="research-panel-soft sticky top-20 z-30 mb-6 overflow-x-auto rounded-3xl p-2 backdrop-blur-xl"
        >
          <div className="flex min-w-max items-center gap-1.5">
            {projectSectionLinks.map((section) => {
              const isActive = section.href === `#${activeSectionId}`;
              return (
                <a
                  key={section.href}
                  href={section.href}
                  aria-current={isActive ? "true" : undefined}
                  className={`inline-flex min-h-11 items-center whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors hover:bg-[var(--glass-chip)] hover:text-[var(--paper-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--paper-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper-bg)] ${
                    isActive
                      ? "bg-[var(--glass-chip)] text-[var(--paper-foreground)]"
                      : "text-[var(--glass-text-muted)]"
                  }`}
                >
                  {section.label}
                </a>
              );
            })}
          </div>
        </nav>

        <div
          className={
            showMembersRail
              ? "lg:grid lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start lg:gap-6"
              : undefined
          }
        >
          <div className="min-w-0">
            <div id="project-challenge" className="scroll-mt-36">
              <ProjectChallengeDetail
                project={{
                  ...displayProject,
                  recruitment_requirements: displayRecruitmentRequirements,
                  is_recruiting: displayIsRecruiting,
                }}
              />
            </div>

            {showResearchInfo && (
              <div id="project-research-info" className="scroll-mt-36">
                <ResearchInfoSection
                  outline={researchOutline}
                  canManageQuestions={canManageProject}
                  onManageQuestions={() => openEditDialog('questions')}
                />
              </div>
            )}

            {canShowDiscussionSection && projectId && (
              <div id="project-discussion" className="scroll-mt-36">
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

            {canShowEvidenceSection && projectId && (
              <div id="project-evidence" className="scroll-mt-36">
                <ProjectEvidenceSection
                  projectId={projectId}
                  canManage={canManageEvidence}
                  usePublicEndpoint={Boolean(publicProject && !project)}
                  theme={theme === "dark" ? "dark" : "light"}
                />
              </div>
            )}

            {canShowPeerReviewSection && projectId && (
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
            )}

            {canShowTasksSection && projectId && project && (
              <div id="project-tasks" className="scroll-mt-36">
                <ProjectTasksSection
                  projectId={projectId}
                  members={project.members}
                  currentUserId={user?.id}
                  canManage={isOwner || isAdmin}
                  theme={theme === "dark" ? "dark" : "light"}
                />
              </div>
            )}

          </div>

          {showMembersRail && (
            <aside
              id="project-members"
              className="scroll-mt-36 lg:sticky lg:top-36 lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto"
            >
              <ProjectMembersSection
                variant="rail"
                members={displayMembers}
                formerMembers={formerMembers}
                hasProject={!!project}
                currentUserId={user?.id}
                theme={theme === "dark" ? "dark" : "light"}
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
