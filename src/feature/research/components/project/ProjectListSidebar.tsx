/**
 * Project List Sidebar Component
 * 课题列表侧边栏组件
 *
 * Displays user's research projects in a compact list format
 * 以紧凑列表格式显示用户的研究课题
 */

import { FlaskConical, Plus, Loader2, LogIn, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/utils/classNames";
import type { ResearchProject } from "@/lib/research.service";
import { useAuthDialogStore } from "@/stores/authDialogStore";
import { ProjectListItem } from "./ProjectListItem";

interface ProjectListSidebarProps {
  projects: ResearchProject[];
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  onCreateProject: () => void;
}

export function ProjectListSidebar({
  projects,
  isLoading,
  error,
  isAuthenticated,
  onCreateProject,
}: ProjectListSidebarProps) {
  const { theme } = useTheme();
  const openDialog = useAuthDialogStore((state) => state.openDialog);

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
                ? "bg-purple-500/20 text-purple-400"
                : "bg-purple-100 text-purple-600"
            )}
          >
            <FlaskConical className="w-4 h-4" />
          </div>
          <h2
            className={cn(
              "font-semibold",
              theme === "dark" ? "text-white" : "text-gray-900"
            )}
          >
            我的研究课题
          </h2>
        </div>
        <Link
          to="/lab/projects"
          className={cn(
            "flex items-center gap-1 text-xs font-medium transition-colors",
            theme === "dark"
              ? "text-purple-400 hover:text-purple-300"
              : "text-purple-600 hover:text-purple-500"
          )}
        >
          查看全部
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Create Button */}
      {isAuthenticated && (
        <button
          onClick={onCreateProject}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors mb-4",
            theme === "dark"
              ? "bg-purple-600 hover:bg-purple-500 text-white"
              : "bg-purple-500 hover:bg-purple-600 text-white"
          )}
        >
          <Plus className="w-4 h-4" />
          新建课题
        </button>
      )}

      {/* Content Area */}
      <div className="space-y-2">
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2
              className={cn(
                "w-6 h-6 animate-spin",
                theme === "dark" ? "text-purple-400" : "text-purple-600"
              )}
            />
            <p
              className={cn(
                "mt-2 text-sm",
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              )}
            >
              加载中...
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

        {/* Not Authenticated */}
        {!isAuthenticated && !isLoading && (
          <div
            className={cn(
              "rounded-lg p-4 text-center",
              theme === "dark"
                ? "bg-slate-800 border border-dashed border-slate-600"
                : "bg-gray-50 border border-dashed border-gray-300"
            )}
          >
            <LogIn
              className={cn(
                "w-8 h-8 mx-auto mb-2",
                theme === "dark" ? "text-gray-500" : "text-gray-400"
              )}
            />
            <p
              className={cn(
                "text-sm mb-3",
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              )}
            >
              登录后查看您的课题
            </p>
            <button
              onClick={() => openDialog("login")}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                theme === "dark"
                  ? "bg-purple-600 hover:bg-purple-500 text-white"
                  : "bg-purple-500 hover:bg-purple-600 text-white"
              )}
            >
              <LogIn className="w-4 h-4" />
              立即登录
            </button>
          </div>
        )}

        {/* Projects List */}
        {isAuthenticated && !isLoading && !error && projects.length > 0 && (
          <div className="space-y-2">
            {projects.map((project) => (
              <ProjectListItem key={project.id} project={project} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {isAuthenticated && !isLoading && !error && projects.length === 0 && (
          <div
            className={cn(
              "rounded-lg p-4 text-center",
              theme === "dark"
                ? "bg-slate-800 border border-dashed border-slate-600"
                : "bg-gray-50 border border-dashed border-gray-300"
            )}
          >
            <FlaskConical
              className={cn(
                "w-8 h-8 mx-auto mb-2",
                theme === "dark" ? "text-gray-500" : "text-gray-400"
              )}
            />
            <p
              className={cn(
                "text-sm",
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              )}
            >
              还没有研究课题
            </p>
            <p
              className={cn(
                "text-xs mt-1",
                theme === "dark" ? "text-gray-500" : "text-gray-400"
              )}
            >
              点击上方按钮创建
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
