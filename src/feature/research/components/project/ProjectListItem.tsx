/**
 * Project List Item Component
 * 课题列表项组件
 *
 * Displays a compact list item for research projects
 * 显示研究课题的紧凑列表项
 */

import { Link } from "react-router-dom";
import { Users, LayoutGrid, ArrowRight } from "lucide-react";
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
      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4
          className={cn(
            "font-medium group-hover:text-purple-400 transition-colors",
            theme === "dark" ? "text-white" : "text-gray-900"
          )}
        >
          {project.name_zh}
        </h4>
        <p
          className={cn(
            "text-sm truncate mt-1",
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          )}
        >
          {project.description_zh || "暂无描述"}
        </p>
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
