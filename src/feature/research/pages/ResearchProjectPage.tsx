/**
 * Research Project Page
 * 研究课题页面
 *
 * Displays a single research project with its members and settings
 * 显示单个研究课题及其成员和设置
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import type { ReactNode } from "react";
import { useParams, Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Settings,
  Edit3,
  Loader2,
  Crown,
  Globe,
  UserCheck,
  AlertCircle,
  UserMinus,
  UserPlus,
  BookOpen,
  FlaskConical,
  HelpCircle,
  Lightbulb,
  ListChecks,
  ImagePlus,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/utils/classNames";
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
  type PublicProjectDetail,
  type PublicProjectMember,
} from "@/lib/profile.service";
import { ApplicationManagementDialog } from "../components/project/ApplicationManagementDialog";
import { ProjectDeleteAction } from "../components/project/ProjectDeleteAction";
import { ProjectEditDialog } from "../components/project/ProjectEditDialog";
import { ProjectCoverDialog } from "../components/project/ProjectCoverDialog";
import { ProjectSettingsDialog } from "../components/project/ProjectSettingsDialog";
import { ProjectApplicationForm } from "../components/project/ProjectApplicationForm";
import { ResearchAgentPanel } from "../components/project/ResearchAgentPanel";
import { ProjectMessagesPanel } from "../components/project/ProjectMessagesPanel";
import {
  ProjectDiscussionSection,
  type ProjectDiscussionJumpRequest,
  type ProjectDiscussionJumpTarget,
  type ProjectDiscussionOutline,
} from "../components/project/ProjectDiscussionSection";
import { Dialog } from "@/components/ui/dialog";
import { useAuthDialogStore } from "@/stores/authDialogStore";

function isProjectMember(member: ProjectMember | PublicProjectMember): member is ProjectMember {
  return "user_id" in member && "id" in member;
}

function splitResearchItems(value?: string | null): string[] {
  return (value ?? '')
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function hasResearchOutline(outline: ProjectDiscussionOutline): boolean {
  return Boolean(
    outline.topicSummary.trim()
      || outline.basicPlan?.trim()
      || outline.extendedPlan?.trim()
      || outline.questions.length > 0
      || outline.hypotheses.length > 0
  );
}

function ResearchInfoSection({
  outline,
  canJumpToDiscussion,
  onJumpToDiscussion,
}: {
  outline: ProjectDiscussionOutline;
  canJumpToDiscussion: boolean;
  onJumpToDiscussion: (target: ProjectDiscussionJumpTarget) => void;
}) {
  const hasQuestions = outline.questions.length > 0;
  const hasHypotheses = outline.hypotheses.length > 0;
  const hasPlans = Boolean(outline.basicPlan?.trim() || outline.extendedPlan?.trim());

  if (!hasResearchOutline(outline)) {
    return null;
  }

  const renderJumpItem = (
    label: string,
    target: ProjectDiscussionJumpTarget,
    icon: ReactNode,
    toneClass: string
  ) => {
    const className = cn(
      "group flex min-h-[4rem] items-start gap-3 rounded-[1.1rem] border px-3.5 py-3 text-left transition",
      toneClass,
      canJumpToDiscussion && "hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,23,42,0.07)]"
    );

    const content = (
      <>
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/70">
          {icon}
        </span>
        <span className="min-w-0 flex-1 text-base font-medium leading-6 text-[var(--paper-foreground)]">
          {label}
        </span>
      </>
    );

    if (!canJumpToDiscussion) {
      return <div className={className}>{content}</div>;
    }

    return (
      <button type="button" onClick={() => onJumpToDiscussion(target)} className={className}>
        {content}
      </button>
    );
  };

  return (
    <section className="research-panel mb-8 rounded-[1.9rem] p-5 sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            className="text-2xl font-semibold text-[var(--paper-foreground)]"
            style={{ fontFamily: "var(--font-ui-display)" }}
          >
            研究信息
          </h2>
        </div>
        <span className="research-chip inline-flex items-center gap-2 self-start rounded-full px-3 py-1.5 text-sm font-medium sm:self-auto">
          <ListChecks className="h-3.5 w-3.5" />
          问题与假设索引
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.9fr)]">
        <div className="research-panel-soft rounded-[1.35rem] p-4">
          <div className="mb-3 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[var(--paper-link)]" />
            <h3 className="text-base font-semibold text-[var(--paper-foreground)]">研究主题简述</h3>
          </div>
          <p className="whitespace-pre-wrap text-base leading-7 text-[var(--glass-text-muted)]">
            {outline.topicSummary || "这个课题还没有补充详细摘要。"}
          </p>
        </div>

        {hasPlans && (
          <div className="grid gap-3">
            {outline.basicPlan?.trim() && (
              <div className="research-panel-soft rounded-[1.35rem] p-4">
                <div className="mb-2 flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-[var(--paper-link)]" />
                  <h3 className="text-base font-semibold text-[var(--paper-foreground)]">基础实验与问题</h3>
                </div>
                <p className="whitespace-pre-wrap text-base leading-7 text-[var(--glass-text-muted)]">
                  {outline.basicPlan}
                </p>
              </div>
            )}
            {outline.extendedPlan?.trim() && (
              <div className="research-panel-soft rounded-[1.35rem] p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-[var(--paper-link)]" />
                  <h3 className="text-base font-semibold text-[var(--paper-foreground)]">拓展问题、假设与实验</h3>
                </div>
                <p className="whitespace-pre-wrap text-base leading-7 text-[var(--glass-text-muted)]">
                  {outline.extendedPlan}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {(hasQuestions || hasHypotheses) && (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {outline.questions.map((question, index) => (
            <div key={`question-${index}`}>
              {renderJumpItem(
                question,
                { section: "basic", index },
                <HelpCircle className="h-4 w-4 text-[var(--paper-link)]" />,
                "border-[var(--paper-accent)]/14 bg-[var(--paper-accent)]/7"
              )}
            </div>
          ))}
          {outline.hypotheses.map((hypothesis, index) => (
            <div key={`hypothesis-${index}`}>
              {renderJumpItem(
                hypothesis,
                { section: "extended", index },
                <Lightbulb className="h-4 w-4 text-[var(--paper-link)]" />,
                "border-[#d7994c]/20 bg-[#d7994c]/8"
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

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

  useEffect(() => {
    if (location.hash !== "#discussion-comments") {
      return;
    }

    setDiscussionJumpRequest((current) => ({
      section: "comments",
      version: (current?.version ?? 0) + 1,
    }));
  }, [location.hash, projectId]);

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

  const isOwner = currentUserRole === "owner";
  const isMember = currentUserRole === "member" || isOwner;

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      draft: {
        label: "草稿",
        className: theme === "dark" ? "bg-gray-500/20 text-gray-400" : "bg-gray-100 text-gray-600",
      },
      active: {
        label: "进行中",
        className: theme === "dark" ? "bg-green-500/20 text-green-400" : "bg-green-100 text-green-600",
      },
      completed: {
        label: "已完成",
        className: theme === "dark" ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-600",
      },
      archived: {
        label: "已归档",
        className: theme === "dark" ? "bg-amber-500/20 text-amber-400" : "bg-amber-100 text-amber-600",
      },
    };
    return statusConfig[status] || statusConfig.draft;
  };

  // Get role icon
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="w-4 h-4 text-amber-500" />;
      case "member":
      case "admin":
      case "editor":
      case "viewer":
        return <UserCheck className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  // Get role label
  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      owner: "组长",
      member: "成员",
      admin: "成员",
      editor: "成员",
      viewer: "成员",
    };
    return labels[role] || role;
  };

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
      <div className="research-page flex min-h-screen items-center justify-center px-6">
        <div className="research-panel flex min-w-[240px] items-center justify-center rounded-[1.8rem] px-8 py-8">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--paper-accent)]" />
        </div>
      </div>
    );
  }

  // Error state
  if (error && !isExampleProject) {
    return (
      <div className="research-page flex min-h-screen items-center justify-center px-6">
        <div className="research-panel max-w-md rounded-[1.9rem] px-8 py-8 text-center">
          <p className="text-lg text-[#b33d3d]">{error}</p>
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
  const projectOwner = project?.members.find((member) => member.role === "owner") ?? null;
  const applyButtonLabel = isPublicGuestMode
    ? "登录后申请加入"
    : hasPendingApplication
      ? "申请已提交"
      : "申请加入课题";
  const applyBannerButtonLabel = isPublicGuestMode
    ? "登录后加入"
    : hasPendingApplication
      ? "申请已提交"
      : "申请加入";
  const applyButtonDisabled = !isPublicGuestMode && hasPendingApplication;

  const statusBadge = getStatusBadge(displayProject.status);
  const canManageProject = !isExampleProject && (isOwner || isAdmin) && !isReadOnlyMode;
  const canDeleteProject = !isExampleProject && !isReadOnlyMode && Boolean(project) && (isOwner || isAdmin);
  const canParticipateInDiscussion = !isExampleProject && Boolean(user && (isMember || isAdmin));
  const canShowDiscussionSection = !isExampleProject && Boolean(projectId && project && isAuthenticated && canParticipateInDiscussion);
  const canShowMessagesPanel = canShowDiscussionSection;
  const canShowAgentPanel = canShowDiscussionSection;
  const researchOutline: ProjectDiscussionOutline = {
    topicSummary: displayProject.description_zh || "",
    questions: splitResearchItems(displayProject.research_questions_zh),
    hypotheses: splitResearchItems(displayProject.research_hypotheses_zh),
    basicPlan: displayProject.basic_plan_zh || "",
    extendedPlan: displayProject.extended_plan_zh || "",
  };

  const handleApplyAction = () => {
    if (isPublicGuestMode) {
      openDialog("login");
      return;
    }

    if (!hasPendingApplication) {
      setIsApplicationFormOpen(true);
    }
  };

  const handleJumpToDiscussion = (target: ProjectDiscussionJumpTarget) => {
    setDiscussionJumpRequest((current) => ({
      ...target,
      version: (current?.version ?? 0) + 1,
    }));
  };

  return (
    <div className="research-page min-h-screen">
      <PersistentHeader
        moduleKey="labGroup"
        variant="glass"
        showBreadcrumb={false}
        className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl dark:bg-slate-900/80"
        rightContent={
          <div className="flex items-center gap-2">
            {canManageProject && (
              <>
                <button
                  onClick={() => setIsCoverDialogOpen(true)}
                  className="glass-button inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-base font-medium"
                >
                  <ImagePlus className="w-4 h-4" />
                  封面
                </button>
                <button
                  onClick={() => setIsSettingsDialogOpen(true)}
                  className="glass-button inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-base font-medium"
                >
                  <Settings className="w-4 h-4" />
                  设置
                </button>
                <button
                  onClick={() => setIsEditDialogOpen(true)}
                  className="glass-button inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-base font-medium"
                >
                  <Edit3 className="w-4 h-4" />
                  编辑
                </button>
              </>
            )}
            <Link
              to={backHref}
              className="glass-button inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-base font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              返回
            </Link>
          </div>
        }
      />

      <main className="research-shell py-6 md:py-8">
        {/* 只读模式提示 */}
        {isReadOnlyMode && (
          <div className="research-panel-soft mb-6 flex flex-col gap-4 rounded-[1.5rem] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="research-chip flex h-10 w-10 items-center justify-center rounded-2xl">
                <AlertCircle className="h-4 w-4 text-[var(--paper-link)]" />
              </div>
              <div>
                <p className="text-base font-semibold text-[var(--paper-foreground)]">
                  {isPublicGuestMode ? "你正在浏览公开课题详情" : "你正在以只读模式浏览这个课题"}
                </p>
                <p className="mt-1 text-base text-[var(--glass-text-muted)]">
                  {isPublicGuestMode
                    ? "未登录时可以先看课题信息和成员，想申请加入时再登录。"
                    : "如果想参与讨论或协作，请先提交加入申请。"}
                </p>
              </div>
            </div>
            <button
              onClick={handleApplyAction}
              disabled={applyButtonDisabled}
              className="glass-button glass-button-primary self-start rounded-full px-4 py-2 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
            >
              {applyBannerButtonLabel}
            </button>
          </div>
        )}

        {/* Project Header */}
        <section className="research-hero mb-8 rounded-[2.1rem] px-6 py-7 sm:px-8">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="research-kicker">课题详情</span>
                <span className={cn("rounded-full px-3 py-1 text-sm font-semibold", statusBadge.className)}>
                  {statusBadge.label}
                </span>
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
                className="text-[clamp(2rem,4vw,3.3rem)] font-semibold leading-[1.06] text-[var(--paper-foreground)]"
                style={{ fontFamily: "var(--font-ui-display)" }}
              >
                {displayProject.name_zh}
              </h1>

              {displayProject.name_en && (
                <p className="mt-2 text-lg text-[var(--glass-text-muted)] sm:text-lg">{displayProject.name_en}</p>
              )}

              <p className="mt-4 max-w-2xl text-lg leading-7 text-[var(--glass-text-muted)]">
                {displayProject.description_zh || "这个课题还没有补充详细摘要。"}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {isReadOnlyMode ? (
                  <button
                    onClick={handleApplyAction}
                    disabled={applyButtonDisabled}
                    className="glass-button glass-button-primary inline-flex items-center justify-center rounded-full px-5 py-2.5 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {applyButtonLabel}
                  </button>
                ) : (
                  <>
                    {canManageProject && (
                      <>
                        <button
                          onClick={() => setIsCoverDialogOpen(true)}
                          className="glass-button inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-base font-medium"
                        >
                          <ImagePlus className="h-4 w-4 text-[var(--paper-link)]" />
                          管理封面
                        </button>
                        <button
                          onClick={() => setIsEditDialogOpen(true)}
                          className="glass-button inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-base font-medium"
                        >
                          <Edit3 className="h-4 w-4 text-[var(--paper-link)]" />
                          编辑信息
                        </button>
                        <button
                          onClick={() => setIsSettingsDialogOpen(true)}
                          className="glass-button inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-base font-medium"
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

            <div className="grid gap-3 sm:grid-cols-2 xl:w-[26rem]">
              <div className="research-metric rounded-[1.45rem] p-4">
                <p className="text-sm uppercase tracking-[0.16em] text-[var(--glass-text-muted)]">成员</p>
                <p className="mt-2 text-3xl font-semibold text-[var(--paper-foreground)]">{displayProject.member_count}</p>
              </div>
              <div className="research-metric rounded-[1.45rem] p-4">
                <p className="text-sm uppercase tracking-[0.16em] text-[var(--glass-text-muted)]">创建时间</p>
                <p className="mt-2 text-lg font-semibold text-[var(--paper-foreground)]">{formatDate(displayProject.created_at)}</p>
              </div>
              <div className="research-metric rounded-[1.45rem] p-4 sm:col-span-2">
                <p className="text-sm uppercase tracking-[0.16em] text-[var(--glass-text-muted)]">协作方式</p>
                <p className="mt-2 text-lg font-semibold text-[var(--paper-foreground)]">
                  {isPublicGuestMode ? "公开浏览" : isReadOnlyMode ? "访客浏览" : displayIsRecruiting ? "开放招募" : "组内协作"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <ResearchInfoSection
          outline={researchOutline}
          canJumpToDiscussion={canShowDiscussionSection}
          onJumpToDiscussion={handleJumpToDiscussion}
        />

        {canShowMessagesPanel && projectId && (
          <ProjectMessagesPanel
            projectId={projectId}
            currentUserId={user?.id}
            canAnnounce={canManageProject}
          />
        )}

        {canShowAgentPanel && projectId && (
          <ResearchAgentPanel projectId={projectId} canClearHistory={canManageProject} />
        )}

        {/* Members Section */}
        {!isExampleProject && displayMembers.length > 0 && (
          <section className="research-panel mb-8 rounded-[1.9rem] p-5 sm:p-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2
                  className="text-2xl font-semibold text-[var(--paper-foreground)]"
                  style={{ fontFamily: "var(--font-ui-display)" }}
                >
                  研究团队
                </h2>
                <p className="mt-2 text-base leading-6 text-[var(--glass-text-muted)]">
                  角色与权限说明白，协作会更顺。
                </p>
              </div>

              {canManageProject && (
                <button
                  onClick={() => setIsApplicationDialogOpen(true)}
                  className={cn(
                    "relative inline-flex items-center gap-2 self-start rounded-full px-4 py-2 text-base font-medium transition-all sm:self-auto",
                    pendingApplicationCount > 0
                      ? "glass-button glass-button-primary text-white"
                      : "glass-button"
                  )}
                >
                  <UserCheck className="w-4 h-4" />
                  申请管理
                  {pendingApplicationCount > 0 && (
                    <span className={cn(
                      "ml-1 min-w-[22px] h-5.5 flex items-center justify-center px-1.5 rounded-full text-sm font-bold",
                      "bg-white text-amber-600"
                    )}>
                      {pendingApplicationCount}
                    </span>
                  )}
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {displayMembers.map((member) => {
                // 判断是否可以移除该成员
                const isActualProjectMember = isProjectMember(member);
                const isSelf = isActualProjectMember && user?.id === member.user_id;
                const isSelfRemoval = isSelf && member.role !== 'owner';
                const canRemove = !!project && isActualProjectMember && !isReadOnlyMode && (
                  isSelfRemoval || // 成员可以移除自己（退出）
                  ((isOwner || isAdmin) && member.role !== 'owner' && !isSelf) // 组长或管理员可以移除其他成员
                );
                const memberKey = isActualProjectMember ? member.id : `${member.username}-${member.role}`;

                return (
                  <div
                    key={memberKey}
                    className="research-panel-soft flex items-center gap-3 rounded-[1.35rem] p-4"
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full text-base font-medium",
                        member.role === "owner"
                          ? "bg-amber-500/20 text-amber-500"
                          : theme === "dark"
                          ? "bg-gray-700 text-gray-300"
                          : "bg-gray-100 text-gray-600"
                      )}
                    >
                      {member.username?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium text-[var(--paper-foreground)]">{member.username}</span>
                        {getRoleIcon(member.role)}
                      </div>
                      <span className="text-sm text-[var(--glass-text-muted)]">{getRoleLabel(member.role)}</span>
                    </div>
                    {canRemove && (
                      <button
                        onClick={() => {
                          if (isActualProjectMember) {
                            setMemberToRemove(member);
                          }
                        }}
                        className="glass-button rounded-full p-2 text-[#b33d3d]"
                        title={isSelfRemoval ? "退出课题组" : "移除成员"}
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {canManageProject && formerMembers.length > 0 && (
              <div className="mt-6 border-t border-[var(--glass-stroke)] pt-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-[var(--paper-foreground)]">待恢复成员</h3>
                  <p className="mt-1 text-base text-[var(--glass-text-muted)]">
                    这些成员曾加入过本课题，组长可以将他们重新拉回，恢复后统一为成员权限。
                  </p>
                </div>

                {restoreMemberError && (
                  <div className="mb-4 rounded-lg bg-red-50 p-3 text-base text-red-600 dark:bg-red-900/30 dark:text-red-400">
                    {restoreMemberError}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {formerMembers.map((member) => (
                    <div
                      key={member.id}
                      className="research-panel-soft flex items-center gap-3 rounded-[1.35rem] p-4"
                    >
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-full text-base font-medium",
                          theme === "dark" ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"
                        )}
                      >
                        {member.username?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-[var(--paper-foreground)]">{member.username}</div>
                        <div className="text-sm text-[var(--glass-text-muted)]">
                          上次身份：{getRoleLabel(member.role)}
                        </div>
                        <div className="text-sm text-[var(--glass-text-muted)]">
                          {member.removed_at ? `移除于 ${formatDate(member.removed_at)}` : "已离开课题"}
                        </div>
                      </div>
                      <button
                        onClick={() => void handleRestoreFormerMember(member)}
                        disabled={isAddingFormerMemberId === member.user_id}
                        className="glass-button rounded-full p-2 text-[var(--paper-link)] disabled:cursor-not-allowed disabled:opacity-60"
                        title="拉回成员"
                      >
                        {isAddingFormerMemberId === member.user_id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <UserPlus className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {canShowDiscussionSection && projectId && (
          <ProjectDiscussionSection
            projectId={projectId}
            currentUserId={user?.id}
            canModerate={isOwner || isAdmin}
            canParticipate={canParticipateInDiscussion}
            outline={researchOutline}
            jumpRequest={discussionJumpRequest}
          />
        )}

      </main>

      {/* Application Management Dialog */}
      {!isExampleProject && projectId && canManageProject && (
        <ApplicationManagementDialog
          isOpen={isApplicationDialogOpen}
          onClose={() => setIsApplicationDialogOpen(false)}
          projectId={projectId}
          onStatusChange={() => void refreshProjectData()}
        />
      )}

      {/* Edit Dialog */}
      {!isExampleProject && project && (
        <ProjectEditDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          project={project}
          onSuccess={(updatedProject) => {
            setProject({ ...project, ...updatedProject });
          }}
        />
      )}

      {/* Cover Dialog */}
      {!isExampleProject && project && canManageProject && (
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
      {!isExampleProject && projectId && (
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
      {isReadOnlyMode && project && (
        <ProjectApplicationForm
          isOpen={isApplicationFormOpen}
          onClose={() => setIsApplicationFormOpen(false)}
          project={{
            id: project.id,
            name_zh: project.name_zh,
            name_en: project.name_en,
            description_zh: project.description_zh,
            description_en: project.description_en,
            thumbnail: project.thumbnail,
            status: project.status,
            visibility: 'public' as const,
            require_approval: displayRequireApproval,
            recruitment_requirements: displayRecruitmentRequirements,
            is_recruiting: displayIsRecruiting,
            max_members: settings?.max_members ?? null,
            member_count: project.member_count,
            is_member: false,
            owner_username: projectOwner?.username ?? null,
            owner_avatar_url: projectOwner?.avatar_url ?? null,
            members: project.members.map((member) => ({
              username: member.username,
              avatar_url: member.avatar_url,
              role: member.role,
            })),
            created_at: project.created_at,
            updated_at: project.updated_at,
          }}
          onSuccess={() => {
            setIsApplicationFormOpen(false);
            void refreshProjectData();
          }}
        />
      )}

      {/* Remove Member Confirmation Dialog */}
      {memberToRemove && (
        <Dialog isOpen={true} onClose={() => setMemberToRemove(null)} showCloseButton={false}>
          <div className={cn(
            "w-full max-w-md p-6 rounded-xl",
            theme === "dark" ? "bg-gray-800" : "bg-white"
          )}>
            <div className="flex items-center gap-3 mb-4">
              <div className={cn(
                "p-2 rounded-lg",
                theme === "dark" ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-600"
              )}>
                <UserMinus className="w-5 h-5" />
              </div>
              <div>
                <h3 className={cn(
                  "text-lg font-semibold",
                  theme === "dark" ? "text-white" : "text-gray-900"
                )}>
                  {user?.id === memberToRemove.user_id ? "退出课题组" : "移除成员"}
                </h3>
                <p className={cn(
                  "text-base",
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                )}>
                  {user?.id === memberToRemove.user_id
                    ? "确定要退出该课题组吗？"
                    : `确定要将 ${memberToRemove.username} 从课题组移除吗？`
                  }
                </p>
              </div>
            </div>

            {removeMemberError && (
              <div className={cn(
                "mb-4 p-3 rounded-lg text-base",
                theme === "dark" ? "bg-red-900/30 text-red-400" : "bg-red-50 text-red-600"
              )}>
                {removeMemberError}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setMemberToRemove(null);
                  setRemoveMemberError(null);
                }}
                disabled={isRemovingMember}
                className={cn(
                  "px-4 py-2 rounded-lg text-base font-medium transition-colors",
                  theme === "dark"
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700",
                  isRemovingMember && "opacity-50 cursor-not-allowed"
                )}
              >
                取消
              </button>
              <button
                onClick={handleRemoveMember}
                disabled={isRemovingMember}
                className={cn(
                  "px-4 py-2 rounded-lg text-base font-medium transition-colors flex items-center gap-2",
                  theme === "dark"
                    ? "bg-red-600 hover:bg-red-500 text-white"
                    : "bg-red-500 hover:bg-red-600 text-white",
                  isRemovingMember && "opacity-50 cursor-not-allowed"
                )}
              >
                {isRemovingMember && <Loader2 className="w-4 h-4 animate-spin" />}
                {isRemovingMember ? "处理中..." : "确认"}
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
