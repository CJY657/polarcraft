/**
 * Project List Item Component
 * 课题列表项组件
 *
 * Displays a compact list item for research projects
 * 显示研究课题的紧凑列表项
 */

import { Link } from "react-router-dom";
import { FlaskConical, Users, LayoutGrid, ArrowRight } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/utils/classNames";
import type { ResearchProject } from "@/lib/research.service";

interface ProjectListItemProps {
  project: ResearchProject;
}

export function ProjectListItem({ project }: ProjectListItemProps) {
  const { theme } = useTheme();

  return (
    <Link
      to={`/lab/projects/${project.id}`}
      className={cn(
        "group flex items-center gap-3 p-3 rounded-lg border transition-all",
        theme === "dark"
          ? "bg-slate-800/50 border-slate-700 hover:border-purple-500 hover:bg-slate-800"
          : "bg-white border-gray-200 hover:border-purple-400 hover:bg-gray-50"
      )}
    >
      {/* Thumbnail or Icon */}
      <div
        className={cn(
          "w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center",
          theme === "dark" ? "bg-gradient-to-br from-purple-500/20 to-cyan-500/20" : "bg-gradient-to-br from-purple-100 to-cyan-100"
        )}
      >
        {project.thumbnail ? (
          <img
            src={project.thumbnail}
            alt={project.name_zh}
            className="w-full h-full object-cover"
          />
        ) : (
          <FlaskConical
            className={cn("w-6 h-6", theme === "dark" ? "text-slate-500" : "text-gray-400")}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4
          className={cn(
            "font-medium truncate group-hover:text-purple-400 transition-colors",
            theme === "dark" ? "text-white" : "text-gray-900"
          )}
        >
          {project.name_zh}
        </h4>
        <div
          className={cn(
            "flex items-center gap-3 text-xs mt-1",
            theme === "dark" ? "text-gray-500" : "text-gray-400"
          )}
        >
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{project.member_count}</span>
          </div>
          <div className="flex items-center gap-1">
            <LayoutGrid className="w-3 h-3" />
            <span>{project.canvas_count}</span>
          </div>
        </div>
      </div>

      {/* Arrow */}
      <ArrowRight
        className={cn(
          "w-4 h-4 transition-opacity",
          theme === "dark" ? "text-purple-400" : "text-purple-500",
          "opacity-0 group-hover:opacity-100"
        )}
      />
    </Link>
  );
}
