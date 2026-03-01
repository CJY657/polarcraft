/**
 * Research Project Page
 * 研究课题页面
 *
 * Displays a single research project with its canvases and settings
 * 显示单个研究课题及其画布和设置
 */

import { useState, useEffect, useMemo } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import {
  Plus,
  Grid3x3,
  ArrowLeft,
  Settings,
  Edit3,
  Users,
  Calendar,
  Loader2,
  Crown,
  Shield,
  Eye,
  Edit,
  Mail,
  Globe,
  UserCheck,
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

interface ProjectWithMembers extends ResearchProject {
  members: ProjectMember[];
}

export function ResearchProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { theme } = useTheme();
  const { user } = useAuth();

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

  // Application count state
  const [pendingApplicationCount, setPendingApplicationCount] = useState(0);

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
          researchApi.getProject(projectId),
          profileApi.getProjectSettings(projectId).catch(() => null),
          researchApi.getProjectCanvases(projectId).catch(() => []),
          profileApi.getProjectApplications(projectId).catch(() => [] as ProjectApplication[]),
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
      owner: "创建者",
      admin: "管理员",
      editor: "编辑者",
      viewer: "查看者",
    };
    return labels[role] || role;
  };

  // Loading state
  if (isLoading) {
    return (
      <div
        className={cn(
          "min-h-screen flex items-center justify-center",
          theme === "dark"
            ? "bg-gradient-to-br from-[#0a0a1a] via-[#1a1a3a] to-[#0a0a2a]"
            : "bg-gradient-to-br from-[#fff5eb] via-[#fef3e2] to-[#fff5eb]"
        )}
      >
        <Loader2
          className={cn(
            "w-8 h-8 animate-spin",
            theme === "dark" ? "text-purple-400" : "text-purple-600"
          )}
        />
      </div>
    );
  }

  // Error state
  if (error && !isExampleProject) {
    return (
      <div
        className={cn(
          "min-h-screen flex items-center justify-center",
          theme === "dark"
            ? "bg-gradient-to-br from-[#0a0a1a] via-[#1a1a3a] to-[#0a0a2a]"
            : "bg-gradient-to-br from-[#fff5eb] via-[#fef3e2] to-[#fff5eb]"
        )}
      >
        <div className="text-center">
          <p className={cn("text-lg mb-4", theme === "dark" ? "text-red-400" : "text-red-600")}>
            {error}
          </p>
          <Link
            to="/lab/projects"
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-colors",
              theme === "dark"
                ? "bg-purple-600 hover:bg-purple-500 text-white"
                : "bg-purple-500 hover:bg-purple-600 text-white"
            )}
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
        name_en: exampleProject?.title["en-US"] || null,
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

  return (
    <div
      className={cn(
        "min-h-screen",
        theme === "dark"
          ? "bg-gradient-to-br from-[#0a0a1a] via-[#1a1a3a] to-[#0a0a2a]"
          : "bg-gradient-to-br from-[#fff5eb] via-[#fef3e2] to-[#fff5eb]"
      )}
    >
      <PersistentHeader
        moduleKey="labGroup"
        moduleNameKey={displayProject.name_zh}
        variant="glass"
        className={cn("sticky top-0 z-40", theme === "dark" ? "bg-slate-900/80" : "bg-white/80")}
        rightContent={
          <div className="flex items-center gap-2">
            {!isExampleProject && isOwnerOrAdmin && (
              <>
                <button
                  onClick={() => setIsSettingsDialogOpen(true)}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    theme === "dark"
                      ? "hover:bg-slate-800 text-gray-400 hover:text-white"
                      : "hover:bg-gray-200 text-gray-600 hover:text-gray-900"
                  )}
                >
                  <Settings className="w-4 h-4" />
                  设置
                </button>
                <button
                  onClick={() => setIsEditDialogOpen(true)}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    theme === "dark"
                      ? "hover:bg-slate-800 text-gray-400 hover:text-white"
                      : "hover:bg-gray-200 text-gray-600 hover:text-gray-900"
                  )}
                >
                  <Edit3 className="w-4 h-4" />
                  编辑
                </button>
              </>
            )}
            <Link
              to="/lab/projects"
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                theme === "dark"
                  ? "hover:bg-slate-800 text-gray-400 hover:text-white"
                  : "hover:bg-gray-200 text-gray-600 hover:text-gray-900"
              )}
            >
              <ArrowLeft className="w-4 h-4" />
              返回
            </Link>
          </div>
        }
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Project Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1
                  className={cn(
                    "text-3xl font-bold",
                    theme === "dark" ? "text-white" : "text-gray-900"
                  )}
                >
                  {displayProject.name_zh}
                </h1>
                <span
                  className={cn(
                    "text-xs px-2 py-1 rounded-full",
                    statusBadge.className
                  )}
                >
                  {statusBadge.label}
                </span>
                {settings?.is_recruiting && (
                  <span
                    className={cn(
                      "text-xs px-2 py-1 rounded-full",
                      theme === "dark"
                        ? "bg-teal-500/20 text-teal-400"
                        : "bg-teal-100 text-teal-600"
                    )}
                  >
                    招募中
                  </span>
                )}
              </div>
              {displayProject.name_en && (
                <p
                  className={cn(
                    "text-lg mb-2",
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  )}
                >
                  {displayProject.name_en}
                </p>
              )}
              {displayProject.description_zh && (
                <p
                  className={cn(
                    "text-sm mb-4",
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  )}
                >
                  {displayProject.description_zh}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm">
                <div
                  className={cn(
                    "flex items-center gap-1",
                    theme === "dark" ? "text-gray-500" : "text-gray-400"
                  )}
                >
                  <Users className="w-4 h-4" />
                  <span>{displayProject.member_count} 成员</span>
                </div>
                <div
                  className={cn(
                    "flex items-center gap-1",
                    theme === "dark" ? "text-gray-500" : "text-gray-400"
                  )}
                >
                  <Grid3x3 className="w-4 h-4" />
                  <span>{displayProject.canvas_count} 画布</span>
                </div>
                <div
                  className={cn(
                    "flex items-center gap-1",
                    theme === "dark" ? "text-gray-500" : "text-gray-400"
                  )}
                >
                  <Calendar className="w-4 h-4" />
                  <span>创建于 {formatDate(displayProject.created_at)}</span>
                </div>
                {displayProject.is_public && (
                  <div
                    className={cn(
                      "flex items-center gap-1",
                      theme === "dark" ? "text-gray-500" : "text-gray-400"
                    )}
                  >
                    <Globe className="w-4 h-4" />
                    <span>公开</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Members Section */}
        {!isExampleProject && project && project.members.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2
                className={cn(
                  "text-xl font-semibold",
                  theme === "dark" ? "text-white" : "text-gray-900"
                )}
              >
                课题成员
              </h2>
              {isOwnerOrAdmin && (
                <button
                  onClick={() => setIsApplicationDialogOpen(true)}
                  className={cn(
                    "relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    theme === "dark"
                      ? "bg-slate-700 hover:bg-slate-600 text-gray-300"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  )}
                >
                  <UserCheck className="w-4 h-4" />
                  申请管理
                  {pendingApplicationCount > 0 && (
                    <span className={cn(
                      "absolute -top-1.5 -right-1.5 min-w-[20px] h-5 flex items-center justify-center px-1.5 rounded-full text-xs font-bold",
                      theme === "dark"
                        ? "bg-yellow-500 text-gray-900"
                        : "bg-yellow-500 text-gray-900"
                    )}>
                      {pendingApplicationCount}
                    </span>
                  )}
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {project.members.map((member) => (
                <div
                  key={member.id}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-xl border transition-colors",
                    theme === "dark"
                      ? "bg-slate-800/50 border-slate-700"
                      : "bg-white border-gray-200"
                  )}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium",
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
                      <span
                        className={cn(
                          "font-medium truncate",
                          theme === "dark" ? "text-white" : "text-gray-900"
                        )}
                      >
                        {member.username}
                      </span>
                      {getRoleIcon(member.role)}
                    </div>
                    <span
                      className={cn(
                        "text-xs",
                        theme === "dark" ? "text-gray-500" : "text-gray-400"
                      )}
                    >
                      {getRoleLabel(member.role)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Canvas Grid */}
        <div className="mb-6 flex items-center justify-between">
          <h2
            className={cn(
              "text-xl font-semibold",
              theme === "dark" ? "text-white" : "text-gray-900"
            )}
          >
            研究画布
          </h2>
          {!isExampleProject && isOwnerOrAdmin && (
            <button
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
                theme === "dark"
                  ? "bg-purple-600 hover:bg-purple-500 text-white"
                  : "bg-purple-500 hover:bg-purple-600 text-white"
              )}
            >
              <Plus className="w-4 h-4" />
              新建画布
            </button>
          )}
        </div>

        {/* Canvas Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Main Canvas */}
          <Link
            to={`/lab/projects/${projectId}/canvases/${canvases[0]?.id || 'main'}`}
            state={isExampleProject ? { exampleProjectId: exampleId } : undefined}
            className={cn(
              "group relative p-6 rounded-xl border-2 transition-all hover:shadow-lg",
              theme === "dark"
                ? "bg-slate-800/50 border-slate-700 hover:border-purple-500"
                : "bg-white border-gray-200 hover:border-purple-400"
            )}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={cn(
                  "p-3 rounded-lg",
                  theme === "dark"
                    ? "bg-purple-500/20 text-purple-400"
                    : "bg-purple-100 text-purple-600"
                )}
              >
                <Grid3x3 className="w-6 h-6" />
              </div>
              <span
                className={cn(
                  "text-xs px-2 py-1 rounded-full",
                  theme === "dark"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-green-100 text-green-600"
                )}
              >
                活跃
              </span>
            </div>
            <h3
              className={cn(
                "text-lg font-semibold mb-2",
                theme === "dark" ? "text-white" : "text-gray-900"
              )}
            >
              主画布
            </h3>
            <p
              className={cn(
                "text-sm mb-4 line-clamp-2",
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              )}
            >
              {displayProject.description_zh || "课题主画布"}
            </p>
            <div
              className={cn(
                "text-xs",
                theme === "dark" ? "text-gray-500" : "text-gray-400"
              )}
            >
              {isExampleProject
                ? `${exampleProject?.nodes.length || 0} 个节点 · ${exampleProject?.edges.length || 0} 条关系`
                : "点击进入画布"}
            </div>
          </Link>
        </div>

        {/* Getting Started Guide */}
        <div className="mt-12 p-6 rounded-xl border-2 border-dashed border-slate-600">
          <h3
            className={cn(
              "text-lg font-semibold mb-4",
              theme === "dark" ? "text-white" : "text-gray-900"
            )}
          >
            开始使用
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                1
              </div>
              <div>
                <h4
                  className={cn(
                    "font-medium mb-1",
                    theme === "dark" ? "text-white" : "text-gray-900"
                  )}
                >
                  创建画布
                </h4>
                <p
                  className={cn(
                    "text-sm",
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  )}
                >
                  为您的研究创建一个新的画布
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                2
              </div>
              <div>
                <h4
                  className={cn(
                    "font-medium mb-1",
                    theme === "dark" ? "text-white" : "text-gray-900"
                  )}
                >
                  添加节点
                </h4>
                <p
                  className={cn(
                    "text-sm",
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  )}
                >
                  添加问题、实验、文献等节点
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                3
              </div>
              <div>
                <h4
                  className={cn(
                    "font-medium mb-1",
                    theme === "dark" ? "text-white" : "text-gray-900"
                  )}
                >
                  建立联系
                </h4>
                <p
                  className={cn(
                    "text-sm",
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  )}
                >
                  用有向边连接节点，构建知识网络
                </p>
              </div>
            </div>
          </div>
        </div>

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
    </div>
  );
}
