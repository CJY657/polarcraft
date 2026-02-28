/**
 * Public Project Explore Page
 * 公开项目浏览页面
 *
 * Displays public projects that users can apply to join
 * 显示用户可以申请加入的公开项目
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Filter,
  Users,
  Clock,
  FlaskConical,
  Loader2,
  LogIn,
  AlertCircle,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSystem } from "@/contexts/SystemContext";
import { cn } from "@/utils/classNames";
import { PersistentHeader } from "@/components/shared";
import { profileApi, type PublicProject } from "@/lib/profile.service";
import { ProjectApplicationForm } from "../components/project/ProjectApplicationForm";
import { useAuthDialogStore } from "@/stores/authDialogStore";

export function PublicProjectExplorePage() {
  const { theme } = useTheme();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isSystemHealthy } = useSystem();
  const openDialog = useAuthDialogStore((state) => state.openDialog);

  const [projects, setProjects] = useState<PublicProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recruitingOnly, setRecruitingOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<PublicProject | null>(null);
  const [isApplicationFormOpen, setIsApplicationFormOpen] = useState(false);

  // Load public projects
  useEffect(() => {
    async function fetchProjects() {
      if (!isSystemHealthy) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await profileApi.getPublicProjects({
          recruiting: recruitingOnly || undefined,
          search: searchQuery || undefined,
        });
        setProjects(data);
      } catch (err) {
        console.error("Failed to fetch public projects:", err);
        setError(err instanceof Error ? err.message : "加载项目失败");
      } finally {
        setIsLoading(false);
      }
    }

    // Debounce search
    const timer = setTimeout(fetchProjects, 300);
    return () => clearTimeout(timer);
  }, [recruitingOnly, searchQuery, isSystemHealthy]);

  const handleApplyClick = (project: PublicProject) => {
    if (!isAuthenticated) {
      openDialog("login");
      return;
    }
    setSelectedProject(project);
    setIsApplicationFormOpen(true);
  };

  const handleApplicationSuccess = () => {
    // Optionally refresh the list or show a notification
    setIsApplicationFormOpen(false);
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

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
        moduleNameKey="发现项目"
        variant="glass"
        className={cn("sticky top-0 z-40", theme === "dark" ? "bg-slate-900/80" : "bg-white/80")}
        rightContent={
          <Link
            to="/lab"
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              theme === "dark"
                ? "hover:bg-slate-800 text-gray-400 hover:text-white"
                : "hover:bg-gray-200 text-gray-600 hover:text-gray-900"
            )}
          >
            我的项目
          </Link>
        }
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div
              className={cn(
                "p-3 rounded-xl",
                theme === "dark"
                  ? "bg-teal-500/20 text-teal-400"
                  : "bg-teal-100 text-teal-600"
              )}
            >
              <Search className="w-6 h-6" />
            </div>
            <div>
              <h1
                className={cn(
                  "text-3xl font-bold",
                  theme === "dark" ? "text-white" : "text-gray-900"
                )}
              >
                发现项目
              </h1>
              <p className={cn("text-sm", theme === "dark" ? "text-gray-400" : "text-gray-600")}>
                浏览并申请加入公开的虚拟课题组
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search
              className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4",
                theme === "dark" ? "text-gray-500" : "text-gray-400"
              )}
            />
            <input
              type="text"
              placeholder="搜索项目..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "w-full pl-10 pr-4 py-2 rounded-lg border transition-colors",
                theme === "dark"
                  ? "bg-slate-800 border-slate-700 text-white placeholder-gray-500 focus:border-teal-500"
                  : "bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-teal-500"
              )}
            />
          </div>

          {/* Recruiting Filter */}
          <label
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors",
              theme === "dark"
                ? "bg-slate-800 hover:bg-slate-700"
                : "bg-gray-100 hover:bg-gray-200"
            )}
          >
            <input
              type="checkbox"
              checked={recruitingOnly}
              onChange={(e) => setRecruitingOnly(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span
              className={cn(
                "text-sm font-medium",
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              )}
            >
              <Filter className="w-4 h-4 inline mr-1" />
              仅显示招募中
            </span>
          </label>
        </div>

        {/* Not authenticated notice */}
        {isSystemHealthy && !authLoading && !isAuthenticated && (
          <div
            className={cn(
              "mb-6 p-4 rounded-lg flex items-center justify-between",
              theme === "dark"
                ? "bg-amber-900/20 border border-amber-800/50"
                : "bg-amber-50 border border-amber-200"
            )}
          >
            <div className="flex items-center gap-3">
              <AlertCircle
                className={cn(
                  "w-5 h-5",
                  theme === "dark" ? "text-amber-400" : "text-amber-600"
                )}
              />
              <p
                className={cn(
                  "text-sm",
                  theme === "dark" ? "text-amber-300" : "text-amber-700"
                )}
              >
                登录后可以申请加入项目
              </p>
            </div>
            <button
              onClick={() => openDialog("login")}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                theme === "dark"
                  ? "bg-amber-600 hover:bg-amber-500 text-white"
                  : "bg-amber-500 hover:bg-amber-600 text-white"
              )}
            >
              <LogIn className="w-4 h-4" />
              立即登录
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2
              className={cn(
                "w-8 h-8 animate-spin",
                theme === "dark" ? "text-teal-400" : "text-teal-600"
              )}
            />
            <p
              className={cn(
                "mt-4 text-sm",
                theme === "dark" ? "text-gray-400" : "text-gray-600"
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
                : "bg-red-50 border border-red-200"
            )}
          >
            <p className={theme === "dark" ? "text-red-400" : "text-red-600"}>{error}</p>
          </div>
        )}

        {/* Projects Grid */}
        {!isLoading && !error && projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className={cn(
                  "group relative overflow-hidden rounded-xl border-2 transition-all hover:shadow-xl",
                  theme === "dark"
                    ? "bg-slate-800 border-slate-700 hover:border-teal-500"
                    : "bg-white border-gray-200 hover:border-teal-400"
                )}
              >
                {/* Thumbnail or Placeholder */}
                <div className="aspect-video w-full overflow-hidden bg-gradient-to-br from-teal-500/20 to-cyan-500/20">
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
                          theme === "dark" ? "text-slate-600" : "text-gray-300"
                        )}
                      />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3
                      className={cn(
                        "font-semibold line-clamp-2 group-hover:text-teal-400 transition-colors",
                        theme === "dark" ? "text-white" : "text-gray-900"
                      )}
                    >
                      {project.name_zh}
                    </h3>
                    {project.is_recruiting && (
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full flex-shrink-0 ml-2",
                          theme === "dark"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-green-100 text-green-600"
                        )}
                      >
                        招募中
                      </span>
                    )}
                  </div>

                  <p
                    className={cn(
                      "text-sm line-clamp-3 mb-4",
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    )}
                  >
                    {project.description_zh || "暂无描述"}
                  </p>

                  {/* Recruitment Requirements */}
                  {project.recruitment_requirements && (
                    <div
                      className={cn(
                        "text-xs mb-4 p-2 rounded line-clamp-2",
                        theme === "dark"
                          ? "bg-blue-900/30 text-blue-300"
                          : "bg-blue-50 text-blue-700"
                      )}
                    >
                      <span className="font-medium">要求：</span>
                      {project.recruitment_requirements}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex items-center gap-1",
                          theme === "dark" ? "text-gray-500" : "text-gray-400"
                        )}
                      >
                        <Users className="w-3 h-3" />
                        <span>
                          {project.member_count}
                          {project.max_members && ` / ${project.max_members}`} 成员
                        </span>
                      </div>
                      <div
                        className={cn(
                          "flex items-center gap-1",
                          theme === "dark" ? "text-gray-500" : "text-gray-400"
                        )}
                      >
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(project.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Apply Button */}
                  <button
                    onClick={() => handleApplyClick(project)}
                    className={cn(
                      "w-full px-4 py-2 rounded-lg font-medium transition-colors",
                      theme === "dark"
                        ? "bg-teal-600 hover:bg-teal-500 text-white"
                        : "bg-teal-500 hover:bg-teal-600 text-white"
                    )}
                  >
                    {project.require_approval ? "申请加入" : "立即加入"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && projects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div
              className={cn(
                "w-24 h-24 rounded-full flex items-center justify-center mb-4",
                theme === "dark"
                  ? "bg-slate-800/50 border-2 border-dashed border-slate-700"
                  : "bg-gray-100 border-2 border-dashed border-gray-300"
              )}
            >
              <FlaskConical
                className={cn(
                  "w-12 h-12",
                  theme === "dark" ? "text-slate-600" : "text-gray-400"
                )}
              />
            </div>
            <h3
              className={cn(
                "text-xl font-semibold mb-2",
                theme === "dark" ? "text-white" : "text-gray-900"
              )}
            >
              没有找到项目
            </h3>
            <p
              className={cn(
                "text-sm text-center max-w-md",
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              )}
            >
              {searchQuery || recruitingOnly
                ? "尝试调整筛选条件"
                : "目前没有公开的项目，请稍后再来看看"}
            </p>
          </div>
        )}
      </main>

      {/* Application Form Dialog */}
      <ProjectApplicationForm
        isOpen={isApplicationFormOpen}
        onClose={() => setIsApplicationFormOpen(false)}
        project={selectedProject}
        onSuccess={handleApplicationSuccess}
      />
    </div>
  );
}
