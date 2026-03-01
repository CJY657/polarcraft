/**
 * Project List Component
 * 项目列表组件
 *
 * Displays user's research projects and example projects
 * 显示用户的研究项目和示例项目
 */

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  FlaskConical,
  BookOpen,
  ArrowRight,
  LogIn,
  Loader2,
  Users,
  LayoutGrid,
  AlertTriangle,
  WifiOff,
  RefreshCw,
  CheckCircle,
  Search,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSystem } from "@/contexts/SystemContext";
import { cn } from "@/utils/classNames";
import { EXAMPLE_PROJECTS } from "@/data/researchExampleProjects";
import { PersistentHeader } from "@/components/shared";
import { researchApi, type ResearchProject } from "@/lib/research.service";
import { useAuthDialogStore } from "@/stores/authDialogStore";
import { CreateProjectWizard } from "./CreateProjectWizard";

export function ProjectList() {
  const { theme } = useTheme();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isSystemHealthy, healthStatus, isChecking, checkHealth } = useSystem();
  const openDialog = useAuthDialogStore((state) => state.openDialog);
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateWizardOpen, setIsCreateWizardOpen] = useState(false);

  // Get health status display configuration
  const getHealthDisplay = () => {
    switch (healthStatus) {
      case "healthy":
        return {
          icon: CheckCircle,
          text: "系统正常",
          className:
            theme === "dark" ? "text-green-400 bg-green-500/10" : "text-green-600 bg-green-100",
        };
      case "unhealthy":
        return {
          icon: AlertTriangle,
          text: "系统异常",
          className:
            theme === "dark" ? "text-amber-400 bg-amber-500/10" : "text-amber-600 bg-amber-100",
        };
      case "offline":
        return {
          icon: WifiOff,
          text: "服务器离线",
          className: theme === "dark" ? "text-red-400 bg-red-500/10" : "text-red-600 bg-red-100",
        };
      default:
        return {
          icon: RefreshCw,
          text: "检测中...",
          className:
            theme === "dark" ? "text-gray-400 bg-gray-500/10" : "text-gray-500 bg-gray-100",
        };
    }
  };

  const healthDisplay = getHealthDisplay();
  const HealthIcon = healthDisplay.icon;

  // Fetch projects when authenticated
  useEffect(() => {
    async function fetchProjects() {
      if (!isAuthenticated) return;

      try {
        setIsLoading(true);
        setError(null);
        const data = await researchApi.getUserProjects();
        setProjects(data);
      } catch (err) {
        console.error("Failed to fetch projects:", err);
        setError(err instanceof Error ? err.message : "加载项目失败");
      } finally {
        setIsLoading(false);
      }
    }

    fetchProjects();
  }, [isAuthenticated]);

  return (
    <div
      className={cn(
        "min-h-screen",
        theme === "dark"
          ? "bg-gradient-to-br from-[#0a0a1a] via-[#1a1a3a] to-[#0a0a2a]"
          : "bg-gradient-to-br from-[#fff5eb] via-[#fef3e2] to-[#fff5eb]",
      )}
    >
      <PersistentHeader
        moduleKey="labGroup"
        moduleNameKey="虚拟课题组"
        variant="glass"
        className={cn("sticky top-0 z-40", theme === "dark" ? "bg-slate-900/80" : "bg-white/80")}
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* System Health Banner - Show when not healthy and authenticated */}
        {!isSystemHealthy && (
          <div
            className={cn(
              "mb-6 rounded-lg p-4 flex items-center justify-between",
              healthDisplay.className.split(" ")[1],
            )}
          >
            <div className="flex items-center gap-3">
              <HealthIcon
                className={cn(
                  "w-5 h-5",
                  healthDisplay.className.split(" ")[0],
                  isChecking && "animate-spin",
                )}
              />
              <div>
                <p className={cn("font-medium", healthDisplay.className.split(" ")[0])}>
                  {healthDisplay.text}
                </p>
                <p className={cn("text-sm", theme === "dark" ? "text-gray-400" : "text-gray-500")}>
                  部分功能不可用
                </p>
              </div>
            </div>
            <button
              onClick={() => checkHealth()}
              disabled={isChecking}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-opacity",
                healthDisplay.className,
                isChecking && "opacity-50 cursor-not-allowed",
              )}
            >
              <RefreshCw className={cn("w-4 h-4", isChecking && "animate-spin")} />
              重新检测
            </button>
          </div>
        )}

        {/* My Projects Section - Only shown when authenticated */}
        {isSystemHealthy && isAuthenticated ? (
          <>
            {/* Page Header */}
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "p-3 rounded-xl",
                    theme === "dark"
                      ? "bg-purple-500/20 text-purple-400"
                      : "bg-purple-100 text-purple-600",
                  )}
                >
                  <FlaskConical className="w-6 h-6" />
                </div>
                <div>
                  <h1
                    className={cn(
                      "text-3xl font-bold",
                      theme === "dark" ? "text-white" : "text-gray-900",
                    )}
                  >
                    我的研究项目
                  </h1>
                  <p
                    className={cn("text-sm", theme === "dark" ? "text-gray-400" : "text-gray-600")}
                  >
                    管理和创建虚拟课题组项目
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  to="/lab/explore"
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
                    theme === "dark"
                      ? "bg-slate-700 hover:bg-slate-600 text-gray-300"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  )}
                >
                  <Search className="w-4 h-4" />
                  发现项目
                </Link>
                <button
                  onClick={() => setIsCreateWizardOpen(true)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
                    theme === "dark"
                      ? "bg-purple-600 hover:bg-purple-500 text-white"
                      : "bg-purple-500 hover:bg-purple-600 text-white"
                  )}
                >
                  <Plus className="w-4 h-4" />
                  新建项目
                </button>
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2
                  className={cn(
                    "w-8 h-8 animate-spin",
                    theme === "dark" ? "text-purple-400" : "text-purple-600",
                  )}
                />
                <p
                  className={cn(
                    "mt-4 text-sm",
                    theme === "dark" ? "text-gray-400" : "text-gray-600",
                  )}
                >
                  加载项目中...
                </p>
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div
                className={cn(
                  "rounded-lg p-4 mb-8",
                  theme === "dark"
                    ? "bg-red-900/20 border border-red-800"
                    : "bg-red-50 border border-red-200",
                )}
              >
                <p className={theme === "dark" ? "text-red-400" : "text-red-600"}>{error}</p>
              </div>
            )}

            {/* Projects Grid or Empty State */}
            {!isLoading &&
              !error &&
              (projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                  {projects.map((project) => (
                    <Link
                      key={project.id}
                      to={`/lab/projects/${project.id}`}
                      className={cn(
                        "group relative overflow-hidden rounded-xl border-2 transition-all hover:shadow-xl",
                        theme === "dark"
                          ? "bg-slate-800 border-slate-700 hover:border-purple-500"
                          : "bg-white border-gray-200 hover:border-purple-400",
                      )}
                    >
                      {/* Thumbnail or Placeholder */}
                      <div className="aspect-video w-full overflow-hidden bg-gradient-to-br from-purple-500/20 to-cyan-500/20">
                        {project.thumbnail ? (
                          <img
                            src={project.thumbnail}
                            alt={project.name_zh}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FlaskConical
                              className={cn(
                                "w-12 h-12",
                                theme === "dark" ? "text-slate-600" : "text-gray-300",
                              )}
                            />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h3
                          className={cn(
                            "font-semibold mb-2 line-clamp-2 group-hover:text-purple-400 transition-colors",
                            theme === "dark" ? "text-white" : "text-gray-900",
                          )}
                        >
                          {project.name_zh}
                        </h3>
                        <p
                          className={cn(
                            "text-sm line-clamp-3 mb-4",
                            theme === "dark" ? "text-gray-400" : "text-gray-600",
                          )}
                        >
                          {project.description_zh || "暂无描述"}
                        </p>

                        {/* Stats */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "flex items-center gap-1",
                                theme === "dark" ? "text-gray-500" : "text-gray-400",
                              )}
                            >
                              <Users className="w-3 h-3" />
                              <span>{project.member_count} 成员</span>
                            </div>
                            <div
                              className={cn(
                                "flex items-center gap-1",
                                theme === "dark" ? "text-gray-500" : "text-gray-400",
                              )}
                            >
                              <LayoutGrid className="w-3 h-3" />
                              <span>{project.canvas_count} 画布</span>
                            </div>
                          </div>
                          <div
                            className={cn(
                              "flex items-center gap-1 font-medium transition-colors",
                              theme === "dark"
                                ? "text-purple-400 group-hover:text-purple-300"
                                : "text-purple-600 group-hover:text-purple-500",
                            )}
                          >
                            查看详情
                            <ArrowRight className="w-3 h-3" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                /* Empty State */
                <div className="flex flex-col items-center justify-center py-16 mb-16">
                  <div
                    className={cn(
                      "w-24 h-24 rounded-full flex items-center justify-center mb-4",
                      theme === "dark"
                        ? "bg-slate-800/50 border-2 border-dashed border-slate-700"
                        : "bg-gray-100 border-2 border-dashed border-gray-300",
                    )}
                  >
                    <FlaskConical
                      className={cn(
                        "w-12 h-12",
                        theme === "dark" ? "text-slate-600" : "text-gray-400",
                      )}
                    />
                  </div>
                  <h3
                    className={cn(
                      "text-xl font-semibold mb-2",
                      theme === "dark" ? "text-white" : "text-gray-900",
                    )}
                  >
                    还没有研究项目
                  </h3>
                  <p
                    className={cn(
                      "text-sm mb-6 text-center max-w-md",
                      theme === "dark" ? "text-gray-400" : "text-gray-600",
                    )}
                  >
                    创建您的第一个虚拟课题组项目，开始探索偏振光学的奥秘
                  </p>
                  <button
                    onClick={() => setIsCreateWizardOpen(true)}
                    className={cn(
                      "flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors",
                      theme === "dark"
                        ? "bg-purple-600 hover:bg-purple-500 text-white"
                        : "bg-purple-500 hover:bg-purple-600 text-white",
                    )}
                  >
                    <Plus className="w-5 h-5" />
                    创建项目
                  </button>
                </div>
              ))}
          </>
        ) : (
          /* Login Prompt - Shown when not authenticated */
          isSystemHealthy &&
          !authLoading && (
            <div className="mb-16">
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "p-3 rounded-xl",
                      theme === "dark"
                        ? "bg-purple-500/20 text-purple-400"
                        : "bg-purple-100 text-purple-600",
                    )}
                  >
                    <FlaskConical className="w-6 h-6" />
                  </div>
                  <div>
                    <h1
                      className={cn(
                        "text-3xl font-bold",
                        theme === "dark" ? "text-white" : "text-gray-900",
                      )}
                    >
                      我的研究项目
                    </h1>
                    <p
                      className={cn(
                        "text-sm",
                        theme === "dark" ? "text-gray-400" : "text-gray-600",
                      )}
                    >
                      管理和创建虚拟课题组项目
                    </p>
                  </div>
                </div>

                <Link
                  to="/lab/explore"
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
                    theme === "dark"
                      ? "bg-slate-700 hover:bg-slate-600 text-gray-300"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  )}
                >
                  <Search className="w-4 h-4" />
                  发现项目
                </Link>
              </div>

              {/* Login Prompt Card */}
              <div
                className={cn(
                  "rounded-xl border-2 p-8 text-center max-w-md mx-auto",
                  theme === "dark"
                    ? "bg-slate-800/50 border-slate-700"
                    : "bg-white border-gray-200",
                )}
              >
                <div
                  className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4",
                    theme === "dark" ? "bg-purple-500/20" : "bg-purple-100",
                  )}
                >
                  <LogIn
                    className={cn(
                      "w-8 h-8",
                      theme === "dark" ? "text-purple-400" : "text-purple-600",
                    )}
                  />
                </div>
                <h3
                  className={cn(
                    "text-lg font-semibold mb-2",
                    theme === "dark" ? "text-white" : "text-gray-900",
                  )}
                >
                  登录后查看您的项目
                </h3>
                <p
                  className={cn(
                    "text-sm mb-6",
                    theme === "dark" ? "text-gray-400" : "text-gray-600",
                  )}
                >
                  登录您的账户以查看和管理您的研究项目
                </p>
                <button
                  onClick={() => openDialog('login')}
                  className={cn(
                    "inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors",
                    theme === "dark"
                      ? "bg-purple-600 hover:bg-purple-500 text-white"
                      : "bg-purple-500 hover:bg-purple-600 text-white",
                  )}
                >
                  <LogIn className="w-4 h-4" />
                  立即登录
                </button>
              </div>
            </div>
          )
        )}

        {/* Example Projects Section - Always visible */}
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-6">
            <div
              className={cn(
                "p-2 rounded-lg",
                theme === "dark" ? "bg-cyan-500/20 text-cyan-400" : "bg-cyan-100 text-cyan-600",
              )}
            >
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2
                className={cn(
                  "text-xl font-semibold",
                  theme === "dark" ? "text-white" : "text-gray-900",
                )}
              >
                示例项目
              </h2>
              <p className={cn("text-sm", theme === "dark" ? "text-gray-400" : "text-gray-600")}>
                探索这些已完成的研究项目，了解虚拟课题组的使用方法
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {EXAMPLE_PROJECTS.map((project) => (
              <Link
                key={project.id}
                to={`/lab/projects/example-${project.id}`}
                className={cn(
                  "group relative overflow-hidden rounded-xl border-2 transition-all hover:shadow-xl",
                  theme === "dark"
                    ? "bg-slate-800 border-slate-700 hover:border-purple-500"
                    : "bg-white border-gray-200 hover:border-purple-400",
                )}
              >
                {/* Cover Image */}
                {project.coverImage && (
                  <div className="aspect-video w-full overflow-hidden bg-gradient-to-br from-purple-500/20 to-cyan-500/20">
                    <img
                      src={project.coverImage}
                      alt={project.title["zh-CN"]}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.src =
                          'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%234a5568"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="12" font-family="sans-serif"%3ENo Image%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  </div>
                )}

                {/* Content */}
                <div className="p-4">
                  <h3
                    className={cn(
                      "font-semibold mb-2 line-clamp-2 group-hover:text-purple-400 transition-colors",
                      theme === "dark" ? "text-white" : "text-gray-900",
                    )}
                  >
                    {project.title["zh-CN"]}
                  </h3>
                  <p
                    className={cn(
                      "text-sm line-clamp-3 mb-4",
                      theme === "dark" ? "text-gray-400" : "text-gray-600",
                    )}
                  >
                    {project.description["zh-CN"]}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs">
                    <div
                      className={cn(
                        "flex items-center gap-1",
                        theme === "dark" ? "text-gray-500" : "text-gray-400",
                      )}
                    >
                      <span>{project.nodes.length} 个节点</span>
                      <span>•</span>
                      <span>{project.edges.length} 条关系</span>
                    </div>
                    <div
                      className={cn(
                        "flex items-center gap-1 font-medium transition-colors",
                        theme === "dark"
                          ? "text-purple-400 group-hover:text-purple-300"
                          : "text-purple-600 group-hover:text-purple-500",
                      )}
                    >
                      查看详情
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* Create Project Wizard Dialog */}
      <CreateProjectWizard
        isOpen={isCreateWizardOpen}
        onClose={() => setIsCreateWizardOpen(false)}
        onSuccess={(projectId) => {
          setIsCreateWizardOpen(false);
          navigate(`/lab/projects/${projectId}`);
        }}
      />
    </div>
  );
}
