/**
 * Project List Component
 * 课题列表组件
 *
 * Displays user's research projects (left sidebar) and public projects (right section)
 * 左侧显示用户的研究课题列表，右侧显示发现课题
 */

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  WifiOff,
  RefreshCw,
  CheckCircle,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSystem } from "@/contexts/SystemContext";
import { cn } from "@/utils/classNames";
import { PersistentHeader } from "@/components/shared";
import { researchApi, type ResearchProject } from "@/lib/research.service";
import { EXAMPLE_PROJECTS } from "@/data/researchExampleProjects";
import { CreateProjectWizard } from "./CreateProjectWizard";
import { ProjectListSidebar } from "./ProjectListSidebar";
import { PublicProjectsSection } from "./PublicProjectsSection";

export function ProjectList() {
  const { theme } = useTheme();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isSystemHealthy, healthStatus, isChecking, checkHealth } = useSystem();
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
        setError(err instanceof Error ? err.message : "加载课题失败");
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
          : "bg-gradient-to-br from-[#fff5eb] via-[#fef3e2] to-[#fff5eb]"
      )}
    >
      <PersistentHeader
        moduleKey="labGroup"
        moduleNameKey="虚拟课题组"
        variant="glass"
        className={cn("sticky top-0 z-40", theme === "dark" ? "bg-slate-900/80" : "bg-white/80")}
      />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* System Health Banner - Show when not healthy */}
        {!isSystemHealthy && (
          <div
            className={cn(
              "mb-6 rounded-lg p-4 flex items-center justify-between",
              healthDisplay.className.split(" ")[1]
            )}
          >
            <div className="flex items-center gap-3">
              <HealthIcon
                className={cn(
                  "w-5 h-5",
                  healthDisplay.className.split(" ")[0],
                  isChecking && "animate-spin"
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
                isChecking && "opacity-50 cursor-not-allowed"
              )}
            >
              <RefreshCw className={cn("w-4 h-4", isChecking && "animate-spin")} />
              重新检测
            </button>
          </div>
        )}

        {/* Main Content - Left/Right Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar - My Projects */}
          <div className="lg:w-[360px] flex-shrink-0 order-2 lg:order-1">
            <ProjectListSidebar
              projects={projects}
              isLoading={isLoading}
              error={error}
              isAuthenticated={isAuthenticated && !authLoading}
              onCreateProject={() => setIsCreateWizardOpen(true)}
            />
          </div>

          {/* Right Section - Discover Projects */}
          <div className="flex-1 min-w-0 order-1 lg:order-2">
            <PublicProjectsSection />
          </div>
        </div>

        {/* Example Projects Section */}
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-4">
            <div
              className={cn(
                "p-2 rounded-lg",
                theme === "dark" ? "bg-cyan-500/20 text-cyan-400" : "bg-cyan-100 text-cyan-600"
              )}
            >
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2
                className={cn(
                  "text-lg font-semibold",
                  theme === "dark" ? "text-white" : "text-gray-900"
                )}
              >
                示例课题
              </h2>
              <p className={cn("text-xs", theme === "dark" ? "text-gray-400" : "text-gray-600")}>
                探索这些已完成的研究课题
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {EXAMPLE_PROJECTS.map((project) => (
              <Link
                key={project.id}
                to={`/lab/projects/example-${project.id}`}
                className={cn(
                  "group relative overflow-hidden rounded-lg border transition-all hover:shadow-lg",
                  theme === "dark"
                    ? "bg-slate-800 border-slate-700 hover:border-cyan-500"
                    : "bg-white border-gray-200 hover:border-cyan-400"
                )}
              >
                {/* Cover Image */}
                {project.coverImage && (
                  <div className="aspect-video w-full overflow-hidden bg-gradient-to-br from-cyan-500/20 to-purple-500/20">
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
                <div className="p-3">
                  <h3
                    className={cn(
                      "font-medium text-sm mb-1 line-clamp-1 group-hover:text-cyan-400 transition-colors",
                      theme === "dark" ? "text-white" : "text-gray-900"
                    )}
                  >
                    {project.title["zh-CN"]}
                  </h3>
                  <p
                    className={cn(
                      "text-xs line-clamp-2 mb-2",
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    )}
                  >
                    {project.description["zh-CN"]}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs">
                    <div
                      className={cn(
                        "flex items-center gap-1",
                        theme === "dark" ? "text-gray-500" : "text-gray-400"
                      )}
                    >
                      <span>{project.nodes.length} 个节点</span>
                      <span>·</span>
                      <span>{project.edges.length} 条关系</span>
                    </div>
                    <div
                      className={cn(
                        "flex items-center gap-1 font-medium transition-colors",
                        theme === "dark"
                          ? "text-cyan-400 group-hover:text-cyan-300"
                          : "text-cyan-600 group-hover:text-cyan-500"
                      )}
                    >
                      查看
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
