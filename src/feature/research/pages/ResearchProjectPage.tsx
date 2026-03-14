/**
 * Research Project Page
 * 研究课题页面
 *
 * Displays a single research project with its canvases and settings
 * 显示单个研究课题及其画布和设置
 */

import { useState, useEffect, useMemo } from "react";
import { useParams, Link, Navigate, useLocation } from "react-router-dom";
import {
  Plus,
  Grid3x3,
  ArrowLeft,
  Settings,
  Edit3,
  Loader2,
  Crown,
  Shield,
  Eye,
  Edit,
  Globe,
  UserCheck,
  AlertCircle,
  UserMinus,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/utils/classNames";
import { getExampleProjectById } from "@/data/researchExampleProjects";
import { PersistentHeader } from "@/components/shared";
import { researchApi, type ResearchProject, type ProjectMember, type ResearchCanvas } from "@/lib/research.service";
import { profileApi, type ProjectSettings, type ProjectApplication } from "@/lib/profile.service";
import { ApplicationManagementDialog } from "../components/project/ApplicationManagementDialog";
import { ProjectEditDialog } from "../components/project/ProjectEditDialog";
import { ProjectSettingsDialog } from "../components/project/ProjectSettingsDialog";
import { ProjectApplicationForm } from "../components/project/ProjectApplicationForm";
import { Dialog } from "@/components/ui/dialog";

interface ProjectWithMembers extends ResearchProject {
  members: ProjectMember[];
}

export function ResearchProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const location = useLocation();
  const { theme } = useTheme();
  const { user } = useAuth();

  // 检查是否为只读模式（从导航状态获取）
  const isReadOnlyMode = location.state?.readOnly === true && !projectId?.startsWith("example-");

  // Check if this is an example project
  const isExampleProject = projectId?.startsWith("example-");
  const exampleId = projectId?.replace("example-", "");
  const exampleProject = exampleId ? getExampleProjectById(exampleId) : undefined;

  // State for real projects
  const [project, setProject] = useState<ProjectWithMembers | null>(null);
  const [settings, setSettings] = useState<ProjectSettings | null>(null);
  const [canvases, setCanvases] = useState<ResearchCanvas[]>([]);
  const [isLoading, setIsLoading] = useState(!isExampleProject);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false);
  const [isApplicationFormOpen, setIsApplicationFormOpen] = useState(false);

  // Application count state
  const [pendingApplicationCount, setPendingApplicationCount] = useState(0);

  // Member removal state
  const [memberToRemove, setMemberToRemove] = useState<ProjectMember | null>(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);
  const [removeMemberError, setRemoveMemberError] = useState<string | null>(null);

  // Fetch project data
  useEffect(() => {
    if (isExampleProject || !projectId) {
      setIsLoading(false);
      return;
    }

    async function fetchProjectData() {
      try {
        setIsLoading(true);
        setError(null);
        const [projectData, settingsData, canvasesData, applicationsData] = await Promise.all([
          researchApi.getProject(projectId!),
          profileApi.getProjectSettings(projectId!).catch(() => null),
          researchApi.getProjectCanvases(projectId!).catch(() => []),
          profileApi.getProjectApplications(projectId!).catch(() => [] as ProjectApplication[]),
        ]);
        setProject(projectData);
        setSettings(settingsData);
        setCanvases(canvasesData);
        // Count pending applications
        const pending = applicationsData.filter((a: ProjectApplication) => a.status === 'pending').length;
        setPendingApplicationCount(pending);
      } catch (err) {
        console.error("Failed to fetch project:", err);
        setError(err instanceof Error ? err.message : "加载课题失败");
      } finally {
        setIsLoading(false);
      }
    }

    fetchProjectData();
  }, [projectId, isExampleProject]);

  // Get current user's role in project
  const currentUserRole = useMemo(() => {
    if (!project || !user) return null;
    const member = project.members.find((m) => m.user_id === user.id);
    return member?.role || null;
  }, [project, user]);

  const isOwnerOrAdmin = currentUserRole === "owner" || currentUserRole === "admin";

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
      case "admin":
        return <Shield className="w-4 h-4 text-blue-500" />;
      case "editor":
        return <Edit className="w-4 h-4 text-green-500" />;
      case "viewer":
        return <Eye className="w-4 h-4 text-gray-500" />;
      default:
        return null;
    }
  };

  // Get role label
  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      owner: "组长",
      admin: "管理员",
      editor: "成员",
      viewer: "查看者",
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
      // Refresh project data
      const projectData = await researchApi.getProject(projectId);
      setProject(projectData);
      setMemberToRemove(null);
    } catch (err) {
      console.error("Failed to remove member:", err);
      setRemoveMemberError(err instanceof Error ? err.message : "移除成员失败");
    } finally {
      setIsRemovingMember(false);
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
            className="glass-button glass-button-primary mt-5 inline-flex rounded-full px-5 py-2.5 text-sm font-semibold text-white"
          >
            返回课题列表
          </Link>
        </div>
      </div>
    );
  }

  // Not found state
  if (!isExampleProject && !project) {
    return <Navigate to="/lab/projects" replace />;
  }

  // Get display data
  const displayProject = isExampleProject
    ? {
        id: projectId!,
        name_zh: exampleProject?.title["zh-CN"] || "示例课题",
        name_en: exampleProject?.title.en || null,
        description_zh: exampleProject?.description["zh-CN"] || "",
        description_en: null,
        status: "active" as const,
        is_public: true,
        thumbnail: exampleProject?.coverImage || null,
        member_count: 1,
        canvas_count: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        allow_guest_comments: false,
        enable_task_board: false,
        default_canvas_id: null,
        members: [],
      }
    : project!;

  const statusBadge = getStatusBadge(displayProject.status);
  const primaryCanvasHref = `/lab/projects/${projectId}/canvases/${canvases[0]?.id || "main"}`;
  const primaryCanvasState = isExampleProject
    ? { exampleProjectId: exampleId }
    : { readOnly: isReadOnlyMode };
  const canManageProject = !isExampleProject && isOwnerOrAdmin && !isReadOnlyMode;

  return (
    <div className="research-page min-h-screen">
      <PersistentHeader
        moduleKey="labGroup"
        moduleNameKey={displayProject.name_zh}
        variant="glass"
        className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl dark:bg-slate-900/80"
        rightContent={
          <div className="flex items-center gap-2">
            {canManageProject && (
              <>
                <button
                  onClick={() => setIsSettingsDialogOpen(true)}
                  className="glass-button inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-medium"
                >
                  <Settings className="w-4 h-4" />
                  设置
                </button>
                <button
                  onClick={() => setIsEditDialogOpen(true)}
                  className="glass-button inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-medium"
                >
                  <Edit3 className="w-4 h-4" />
                  编辑
                </button>
              </>
            )}
            <Link
              to="/lab/projects"
              className="glass-button inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-medium"
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
                <p className="text-sm font-semibold text-[var(--paper-foreground)]">你正在以只读模式浏览这个课题</p>
                <p className="mt-1 text-sm text-[var(--glass-text-muted)]">如果想编辑画布或参与协作，请先提交加入申请。</p>
              </div>
            </div>
            <button
              onClick={() => setIsApplicationFormOpen(true)}
              className="glass-button glass-button-primary self-start rounded-full px-4 py-2 text-sm font-semibold text-white sm:self-auto"
            >
              申请加入
            </button>
          </div>
        )}

        {/* Project Header */}
        <section className="research-hero mb-8 rounded-[2.1rem] px-6 py-7 sm:px-8">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="research-kicker">Project Overview</span>
                <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", statusBadge.className)}>
                  {statusBadge.label}
                </span>
                {settings?.is_recruiting && (
                  <span className="research-chip research-chip-accent inline-flex rounded-full px-3 py-1 text-xs font-semibold">
                    招募中
                  </span>
                )}
                {displayProject.is_public && (
                  <span className="research-chip inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium">
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
                <p className="mt-2 text-base text-[var(--glass-text-muted)] sm:text-lg">{displayProject.name_en}</p>
              )}

              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--glass-text-muted)]">
                {displayProject.description_zh || "这个课题还没有补充详细摘要，建议先进入画布查看当前研究结构。"}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to={primaryCanvasHref}
                  state={primaryCanvasState}
                  className="glass-button glass-button-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white"
                >
                  <Grid3x3 className="h-4 w-4" />
                  {isExampleProject ? "打开示例画布" : "进入主画布"}
                </Link>

                {isReadOnlyMode ? (
                  <button
                    onClick={() => setIsApplicationFormOpen(true)}
                    className="glass-button inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium"
                  >
                    申请加入课题
                  </button>
                ) : (
                  canManageProject && (
                    <>
                      <button
                        onClick={() => setIsEditDialogOpen(true)}
                        className="glass-button inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium"
                      >
                        <Edit3 className="h-4 w-4 text-[var(--paper-link)]" />
                        编辑信息
                      </button>
                      <button
                        onClick={() => setIsSettingsDialogOpen(true)}
                        className="glass-button inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium"
                      >
                        <Settings className="h-4 w-4 text-[var(--paper-link)]" />
                        协作设置
                      </button>
                    </>
                  )
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:w-[26rem]">
              <div className="research-metric rounded-[1.45rem] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--glass-text-muted)]">成员</p>
                <p className="mt-2 text-3xl font-semibold text-[var(--paper-foreground)]">{displayProject.member_count}</p>
              </div>
              <div className="research-metric rounded-[1.45rem] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--glass-text-muted)]">画布</p>
                <p className="mt-2 text-3xl font-semibold text-[var(--paper-foreground)]">{displayProject.canvas_count}</p>
              </div>
              <div className="research-metric rounded-[1.45rem] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--glass-text-muted)]">创建时间</p>
                <p className="mt-2 text-base font-semibold text-[var(--paper-foreground)]">{formatDate(displayProject.created_at)}</p>
              </div>
              <div className="research-metric rounded-[1.45rem] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--glass-text-muted)]">协作方式</p>
                <p className="mt-2 text-base font-semibold text-[var(--paper-foreground)]">
                  {isReadOnlyMode ? "访客浏览" : settings?.is_recruiting ? "开放招募" : "组内协作"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Members Section */}
        {!isExampleProject && project && project.members.length > 0 && (
          <section className="research-panel mb-8 rounded-[1.9rem] p-5 sm:p-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="research-kicker mb-2">Research Team</div>
                <h2
                  className="text-2xl font-semibold text-[var(--paper-foreground)]"
                  style={{ fontFamily: "var(--font-ui-display)" }}
                >
                  研究团队
                </h2>
                <p className="mt-2 text-sm leading-6 text-[var(--glass-text-muted)]">
                  角色与权限先说明白，进入画布后协作会更顺。
                </p>
              </div>

              {isOwnerOrAdmin && !isReadOnlyMode && (
                <button
                  onClick={() => setIsApplicationDialogOpen(true)}
                  className={cn(
                    "relative inline-flex items-center gap-2 self-start rounded-full px-4 py-2 text-sm font-medium transition-all sm:self-auto",
                    pendingApplicationCount > 0
                      ? "glass-button glass-button-primary text-white"
                      : "glass-button"
                  )}
                >
                  <UserCheck className="w-4 h-4" />
                  申请管理
                  {pendingApplicationCount > 0 && (
                    <span className={cn(
                      "ml-1 min-w-[22px] h-5.5 flex items-center justify-center px-1.5 rounded-full text-xs font-bold",
                      "bg-white text-amber-600"
                    )}>
                      {pendingApplicationCount}
                    </span>
                  )}
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {project.members.map((member) => {
                // 判断是否可以移除该成员
                const isSelf = user?.id === member.user_id;
                const isSelfRemoval = isSelf && member.role !== 'owner';
                const canRemove = !isReadOnlyMode && (
                  isSelfRemoval || // 成员可以移除自己（退出）
                  (isOwnerOrAdmin && member.role !== 'owner' && !isSelf) // owner/admin 可以移除非 owner 成员
                );

                return (
                  <div
                    key={member.id}
                    className="research-panel-soft flex items-center gap-3 rounded-[1.35rem] p-4"
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium",
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
                      <span className="text-xs text-[var(--glass-text-muted)]">{getRoleLabel(member.role)}</span>
                    </div>
                    {canRemove && (
                      <button
                        onClick={() => setMemberToRemove(member)}
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
          </section>
        )}

        <section className="research-panel rounded-[1.9rem] p-5 sm:p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="research-kicker mb-2">Canvas</div>
              <h2
                className="text-2xl font-semibold text-[var(--paper-foreground)]"
                style={{ fontFamily: "var(--font-ui-display)" }}
              >
                研究画布
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--glass-text-muted)]">
                进入画布前，你已经能在上面看清这个课题的状态、人员和协作方式。
              </p>
            </div>
            {!isExampleProject && isOwnerOrAdmin && !isReadOnlyMode && (
              <button className="glass-button inline-flex items-center gap-2 self-start rounded-full px-4 py-2 text-sm font-medium sm:self-auto">
                <Plus className="w-4 h-4 text-[var(--paper-link)]" />
                新建画布
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Link
              to={primaryCanvasHref}
              state={primaryCanvasState}
              className="research-panel-soft group rounded-[1.65rem] p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--glass-shadow-strong)]"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="research-chip flex h-12 w-12 items-center justify-center rounded-[1.2rem]">
                  <Grid3x3 className="h-6 w-6 text-[var(--paper-link)]" />
                </div>
                <span className="research-chip research-chip-accent inline-flex rounded-full px-3 py-1 text-xs font-semibold">
                  活跃入口
                </span>
              </div>

              <h3
                className="text-lg font-semibold text-[var(--paper-foreground)]"
                style={{ fontFamily: "var(--font-ui-display)" }}
              >
                主画布
              </h3>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--glass-text-muted)]">
                {displayProject.description_zh || "这里承载课题的问题节点、实验设计、文献引用与结论关系。"}
              </p>

              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="research-chip inline-flex rounded-full px-3 py-1">
                  {isExampleProject
                    ? `${exampleProject?.nodes.length || 0} 个节点`
                    : `${displayProject.canvas_count} 张画布`}
                </span>
                <span className="research-chip inline-flex rounded-full px-3 py-1">
                  {isExampleProject
                    ? `${exampleProject?.edges.length || 0} 条关系`
                    : isReadOnlyMode
                      ? "只读查看"
                      : "可编辑"}
                </span>
              </div>

              <div className="mt-5 text-sm font-medium text-[var(--paper-link)]">进入画布开始工作</div>
            </Link>
          </div>

          {/* Getting Started Guide - 只读模式隐藏 */}
          {!isReadOnlyMode && (
            <div className="research-panel-soft mt-8 rounded-[1.6rem] border border-dashed p-5 sm:p-6">
              <h3
                className="text-xl font-semibold text-[var(--paper-foreground)]"
                style={{ fontFamily: "var(--font-ui-display)" }}
              >
                开始使用
              </h3>
              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-sm font-semibold text-amber-500">
                  1
                </div>
                <div>
                    <h4 className="mb-1 font-medium text-[var(--paper-foreground)]">先搭起主画布</h4>
                    <p className="text-sm leading-6 text-[var(--glass-text-muted)]">
                      把当前研究问题作为主入口，避免一开始就把信息铺得过散。
                    </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-sm font-semibold text-blue-500">
                  2
                </div>
                <div>
                    <h4 className="mb-1 font-medium text-[var(--paper-foreground)]">再补问题与证据</h4>
                    <p className="text-sm leading-6 text-[var(--glass-text-muted)]">
                      把问题、实验、文献和结论拆成节点，后续协作时会更容易分工。
                    </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-500/20 text-sm font-semibold text-green-500">
                  3
                </div>
                <div>
                    <h4 className="mb-1 font-medium text-[var(--paper-foreground)]">最后连接研究逻辑</h4>
                    <p className="text-sm leading-6 text-[var(--glass-text-muted)]">
                      用关系边说明“为什么有关联”，这样画布才是研究结构，而不是便签堆积。
                    </p>
                </div>
              </div>
            </div>
            </div>
          )}
        </section>

      </main>

      {/* Application Management Dialog */}
      {!isExampleProject && projectId && isOwnerOrAdmin && (
        <ApplicationManagementDialog
          isOpen={isApplicationDialogOpen}
          onClose={() => setIsApplicationDialogOpen(false)}
          projectId={projectId}
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
            require_approval: settings?.require_approval ?? true,
            recruitment_requirements: settings?.recruitment_requirements ?? null,
            is_recruiting: settings?.is_recruiting ?? false,
            max_members: settings?.max_members ?? null,
            member_count: project.member_count,
            is_member: false,
            owner_username: project.members.find((member) => member.role === "owner")?.username ?? null,
            owner_avatar_url: project.members.find((member) => member.role === "owner")?.avatar_url ?? null,
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
            // 可以在这里添加成功提示或刷新页面
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
                  "text-sm",
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
                "mb-4 p-3 rounded-lg text-sm",
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
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
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
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
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
