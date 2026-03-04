/**
 * My Projects Page
 * 我的研究项目页面
 *
 * Displays only the user's own research projects
 * 只展示用户自己的研究项目
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  WifiOff,
  RefreshCw,
  CheckCircle,
  FolderOpen,
  Plus,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSystem } from "@/contexts/SystemContext";
import { cn } from "@/utils/classNames";
import { PersistentHeader } from "@/components/shared";
import { researchApi, type ResearchProject } from "@/lib/research.service";
import { CreateProjectWizard } from "../components/project/CreateProjectWizard";
import { ProjectListItem } from "../components/project/ProjectListItem";

export function MyProjectsPage() {
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

  // Not authenticated state
  if (!authLoading && !isAuthenticated) {
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
          moduleNameKey="我的研究项目"
          variant="glass"
          className={cn("sticky top-0 z-40", theme === "dark" ? "bg-slate-900/80" : "bg-white/80")}
        />

        <main className="max-w-5xl mx-auto px-4 py-8">
          <div
            className={cn(
              "text-center py-16 rounded-xl border-2",
              theme === "dark"
                ? "bg-slate-800/50 border-slate-700"
                : "bg-white border-gray-200"
            )}
          >
            <FolderOpen
              className={cn(
                "w-16 h-16 mx-auto mb-4",
                theme === "dark" ? "text-gray-500" : "text-gray-400"
              )}
            />
            <h2
              className={cn(
                "text-xl font-semibold mb-2",
                theme === "dark" ? "text-white" : "text-gray-900"
              )}
            >
              请先登录
            </h2>
            <p className={cn("mb-6", theme === "dark" ? "text-gray-400" : "text-gray-600")}>
              登录后即可查看和管理您的研究项目
            </p>
          </div>
        </main>
      </div>
    );
  }

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
        moduleNameKey="我的研究项目"
        variant="glass"
        className={cn("sticky top-0 z-40", theme === "dark" ? "bg-slate-900/80" : "bg-white/80")}
      />

      <main className="max-w-5xl mx-auto px-4 py-6">
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

        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1
              className={cn(
                "text-2xl font-bold",
                theme === "dark" ? "text-white" : "text-gray-900"
              )}
            >
              我的研究项目
            </h1>
            <p className={cn("text-sm mt-1", theme === "dark" ? "text-gray-400" : "text-gray-600")}>
              管理和查看您参与的所有研究课题
            </p>
          </div>

          {/* Create Project Button */}
          <button
            onClick={() => setIsCreateWizardOpen(true)}
            disabled={!isSystemHealthy}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
              theme === "dark"
                ? "bg-cyan-500 hover:bg-cyan-400 text-slate-900"
                : "bg-cyan-500 hover:bg-cyan-600 text-white",
              !isSystemHealthy && "opacity-50 cursor-not-allowed"
            )}
          >
            <Plus className="w-5 h-5" />
            创建新课题
          </button>
        </div>

        {/* Projects List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  "animate-pulse rounded-xl p-4",
                  theme === "dark" ? "bg-slate-800" : "bg-gray-100"
                )}
              >
                <div
                  className={cn(
                    "h-5 w-1/3 rounded mb-3",
                    theme === "dark" ? "bg-slate-700" : "bg-gray-200"
                  )}
                />
                <div
                  className={cn(
                    "h-4 w-2/3 rounded mb-2",
                    theme === "dark" ? "bg-slate-700" : "bg-gray-200"
                  )}
                />
                <div
                  className={cn("h-3 w-1/2 rounded", theme === "dark" ? "bg-slate-700" : "bg-gray-200")}
                />
              </div>
            ))}
          </div>
        ) : error ? (
          <div
            className={cn(
              "text-center py-12 rounded-xl border-2",
              theme === "dark"
                ? "bg-red-900/20 border-red-800 text-red-400"
                : "bg-red-50 border-red-200 text-red-600"
            )}
          >
            <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
            <p className="font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className={cn(
                "mt-4 px-4 py-2 rounded-lg text-sm font-medium",
                theme === "dark"
                  ? "bg-red-800 hover:bg-red-700 text-white"
                  : "bg-red-100 hover:bg-red-200 text-red-700"
              )}
            >
              重试
            </button>
          </div>
        ) : projects.length === 0 ? (
          <div
            className={cn(
              "text-center py-16 rounded-xl border-2",
              theme === "dark"
                ? "bg-slate-800/50 border-slate-700"
                : "bg-white border-gray-200"
            )}
          >
            <FolderOpen
              className={cn(
                "w-16 h-16 mx-auto mb-4",
                theme === "dark" ? "text-gray-500" : "text-gray-400"
              )}
            />
            <h2
              className={cn(
                "text-xl font-semibold mb-2",
                theme === "dark" ? "text-white" : "text-gray-900"
              )}
            >
              暂无研究项目
            </h2>
            <p className={cn("mb-6", theme === "dark" ? "text-gray-400" : "text-gray-600")}>
              创建您的第一个研究课题，开始探索知识图谱
            </p>
            <button
              onClick={() => setIsCreateWizardOpen(true)}
              disabled={!isSystemHealthy}
              className={cn(
                "inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all",
                theme === "dark"
                  ? "bg-cyan-500 hover:bg-cyan-400 text-slate-900"
                  : "bg-cyan-500 hover:bg-cyan-600 text-white",
                !isSystemHealthy && "opacity-50 cursor-not-allowed"
              )}
            >
              <Plus className="w-5 h-5" />
              创建第一个课题
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <ProjectListItem key={project.id} project={project} />
            ))}
          </div>
        )}
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

export default MyProjectsPage;
