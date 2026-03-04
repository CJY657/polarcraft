/**
 * Public Projects Section Component
 * 公开课题区域组件
 *
 * Displays public projects that users can browse and apply to join
 * 显示用户可以浏览和申请加入的公开课题
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
  ArrowRight,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSystem } from "@/contexts/SystemContext";
import { cn } from "@/utils/classNames";
import { profileApi, type PublicProject } from "@/lib/profile.service";
import { useAuthDialogStore } from "@/stores/authDialogStore";
import { ProjectApplicationForm } from "./ProjectApplicationForm";

export function PublicProjectsSection() {
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
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
        setError(err instanceof Error ? err.message : "加载课题失败");
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
    setIsApplicationFormOpen(false);
    // Refresh the list
    async function refreshProjects() {
      try {
        const data = await profileApi.getPublicProjects({
          recruiting: recruitingOnly || undefined,
          search: searchQuery || undefined,
        });
        setProjects(data);
      } catch (err) {
        console.error("Failed to refresh projects:", err);
      }
    }
    refreshProjects();
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
        "rounded-xl border p-4",
        theme === "dark"
          ? "bg-slate-800/50 border-slate-700"
          : "bg-white border-gray-200"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "p-2 rounded-lg",
              theme === "dark"
                ? "bg-teal-500/20 text-teal-400"
                : "bg-teal-100 text-teal-600"
            )}
          >
            <Search className="w-4 h-4" />
          </div>
          <h2
            className={cn(
              "font-semibold",
              theme === "dark" ? "text-white" : "text-gray-900"
            )}
          >
            发现课题
          </h2>
        </div>
        <Link
          to="/lab/explore"
          className={cn(
            "text-sm font-medium flex items-center gap-1 transition-colors",
            theme === "dark"
              ? "text-teal-400 hover:text-teal-300"
              : "text-teal-600 hover:text-teal-500"
          )}
        >
          查看全部
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search
            className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4",
              theme === "dark" ? "text-gray-500" : "text-gray-400"
            )}
          />
          <input
            type="text"
            placeholder="搜索课题..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "w-full pl-9 pr-3 py-2 rounded-lg border text-sm transition-colors",
              theme === "dark"
                ? "bg-slate-700 border-slate-600 text-white placeholder-gray-500 focus:border-teal-500"
                : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-teal-500"
            )}
          />
        </div>

        {/* Recruiting Filter */}
        <label
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm",
            theme === "dark"
              ? "bg-slate-700 hover:bg-slate-600"
              : "bg-gray-100 hover:bg-gray-200"
          )}
        >
          <input
            type="checkbox"
            checked={recruitingOnly}
            onChange={(e) => setRecruitingOnly(e.target.checked)}
            className="w-4 h-4 rounded"
          />
          <span className={theme === "dark" ? "text-gray-300" : "text-gray-700"}>
            <Filter className="w-3 h-3 inline mr-1" />
            仅招募中
          </span>
        </label>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2
            className={cn(
              "w-6 h-6 animate-spin",
              theme === "dark" ? "text-teal-400" : "text-teal-600"
            )}
          />
          <p
            className={cn(
              "mt-2 text-sm",
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            )}
          >
            加载课题中...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div
          className={cn(
            "rounded-lg p-3 text-sm",
            theme === "dark"
              ? "bg-red-900/20 text-red-400"
              : "bg-red-50 text-red-600"
          )}
        >
          {error}
        </div>
      )}

      {/* Projects Grid */}
      {!isLoading && !error && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className={cn(
                "group rounded-lg border overflow-hidden transition-all",
                theme === "dark"
                  ? "bg-slate-800 border-slate-700 hover:border-teal-500"
                  : "bg-gray-50 border-gray-200 hover:border-teal-400"
              )}
            >
              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3
                    className={cn(
                      "font-semibold text-lg line-clamp-1 group-hover:text-teal-400 transition-colors",
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
                    "text-sm line-clamp-3 mb-3",
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  )}
                >
                  {project.description_zh || "暂无描述"}
                </p>

                {/* Owner */}
                {project.owner_username && (
                  <div
                    className={cn(
                      "flex items-center gap-1 text-xs mb-2",
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    )}
                  >
                    <span>组长：</span>
                    <span className="font-medium">{project.owner_username}</span>
                  </div>
                )}

                {/* Members */}
                {project.members && project.members.filter((m) => m.role !== "owner").length > 0 && (
                  <div
                    className={cn(
                      "flex items-center gap-1 text-xs mb-2",
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    )}
                  >
                    <span>成员：</span>
                    <div className="flex items-center -space-x-1">
                      {project.members
                        .filter((m) => m.role !== "owner")
                        .slice(0, 5)
                        .map((member, index) => (
                          <div
                            key={index}
                            className={cn(
                              "w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-medium",
                              theme === "dark"
                                ? "border-slate-700 bg-slate-600 text-white"
                                : "border-gray-200 bg-gray-200 text-gray-700"
                            )}
                            title={member.username}
                          >
                            {member.avatar_url ? (
                              <img
                                src={member.avatar_url}
                                alt={member.username}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              member.username?.charAt(0).toUpperCase()
                            )}
                          </div>
                        ))}
                      {project.members.filter((m) => m.role !== "owner").length > 5 && (
                        <div
                          className={cn(
                            "w-5 h-5 rounded-full border flex items-center justify-center text-[10px]",
                            theme === "dark"
                              ? "border-slate-700 bg-slate-600 text-gray-300"
                              : "border-gray-200 bg-gray-300 text-gray-600"
                          )}
                        >
                          +{project.members.filter((m) => m.role !== "owner").length - 5}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-3 text-xs mb-3">
                  <div
                    className={cn(
                      "flex items-center gap-1",
                      theme === "dark" ? "text-gray-500" : "text-gray-400"
                    )}
                  >
                    <Users className="w-3 h-3" />
                    <span>
                      {project.member_count}
                      {project.max_members && ` / ${project.max_members}`}
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

                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    to={`/lab/projects/${project.id}`}
                    state={{ readOnly: !project.is_member }}
                    className={cn(
                      "flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors text-center block",
                      project.is_member
                        ? theme === "dark"
                          ? "bg-purple-600 hover:bg-purple-500 text-white"
                          : "bg-purple-500 hover:bg-purple-600 text-white"
                        : theme === "dark"
                          ? "bg-slate-700 hover:bg-slate-600 text-gray-300"
                          : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                    )}
                  >
                    {project.is_member ? "进入" : "查看"}
                  </Link>

                  {!project.is_member && (
                    <button
                      onClick={() => handleApplyClick(project)}
                      className={cn(
                        "flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                        theme === "dark"
                          ? "bg-teal-600 hover:bg-teal-500 text-white"
                          : "bg-teal-500 hover:bg-teal-600 text-white"
                      )}
                    >
                      {project.require_approval ? "申请" : "加入"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && projects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <FlaskConical
            className={cn(
              "w-12 h-12 mb-3",
              theme === "dark" ? "text-gray-600" : "text-gray-300"
            )}
          />
          <p
            className={cn(
              "text-sm font-medium mb-1",
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            )}
          >
            没有找到课题
          </p>
          <p
            className={cn(
              "text-xs",
              theme === "dark" ? "text-gray-500" : "text-gray-400"
            )}
          >
            {searchQuery || recruitingOnly ? "尝试调整筛选条件" : "目前没有公开的课题"}
          </p>
        </div>
      )}

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
