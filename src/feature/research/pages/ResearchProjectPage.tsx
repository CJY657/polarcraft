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
import { ResearchAgentPanel } from "../components/project/ResearchAgentPanel";
import { ResearchInfoSection } from "../components/project/ResearchInfoSection";
import { ProjectMembersSection } from "../components/project/ProjectMembersSection";
import { RemoveMemberDialog } from "../components/project/RemoveMemberDialog";
import {
  ProjectDiscussionSection,
  type ProjectDiscussionJumpRequest,
  type ProjectDiscussionJumpTarget,
  type ProjectDiscussionOutline,
} from "../components/project/ProjectDiscussionSection";
import { useAuthDialogStore } from "@/stores/authDialogStore";
import { ProjectLifecycleBadges } from "../projectLifecycle";
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
  const researchOutline: ProjectDiscussionOutline = {
    topicSummary: displayProject.description_zh || "",
    questions: splitResearchItems(displayProject.research_questions_zh),
    hypotheses: splitResearchItems(displayProject.research_hypotheses_zh),
    basicPlan: displayProject.basic_plan_zh || "",
    extendedPlan: displayProject.extended_plan_zh || "",
  };

  const handleApplyAction = () => {
    if (hasPendingApplication) {
      return;
    }

    if (isPublicGuestMode) {
      openDialog("login");
      return;
    }

    if (isRecruitmentClosed) {
      setIsApplicationFormOpen(true);
      return;
    }

    setIsApplicationFormOpen(true);
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

            <div className="flex flex-col gap-3 xl:w-[22rem]">
              <div className="research-metric flex items-center justify-between rounded-[1.2rem] px-5 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--glass-text-muted)]">成员</p>
                <p className="text-2xl font-bold text-[var(--paper-foreground)]">{displayProject.member_count}</p>
              </div>
              <div className="research-metric flex items-center justify-between rounded-[1.2rem] px-5 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--glass-text-muted)]">创建时间</p>
                <p className="text-base font-semibold text-[var(--paper-foreground)]">{formatDate(displayProject.created_at)}</p>
              </div>
              <div className="research-metric flex items-center justify-between rounded-[1.2rem] px-5 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--glass-text-muted)]">协作方式</p>
                <p className="text-base font-semibold text-[var(--paper-foreground)]">
                  {isPublicGuestMode ? "公开浏览" : isReadOnlyMode ? "访客浏览" : displayIsRecruiting ? "开放招募" : "组内协作"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <ProjectChallengeDetail
          project={{
            ...displayProject,
            recruitment_requirements: displayRecruitmentRequirements,
            is_recruiting: displayIsRecruiting,
          }}
        />

        <ResearchInfoSection
          outline={researchOutline}
          canJumpToDiscussion={canShowDiscussionSection}
          onJumpToDiscussion={handleJumpToDiscussion}
        />

        {canShowEvidenceSection && projectId && (
          <ProjectEvidenceSection
            projectId={projectId}
            canManage={canManageEvidence}
            usePublicEndpoint={Boolean(publicProject && !project)}
            theme={theme === "dark" ? "dark" : "light"}
          />
        )}

        {canShowAgentPanel && projectId && (
          <ResearchAgentPanel projectId={projectId} canClearHistory={canManageProject} />
        )}

        {/* Members Section */}
        {!isExampleProject && displayMembers.length > 0 && (
          <ProjectMembersSection
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
            onClose={() => setIsEditDialogOpen(false)}
            project={project}
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
