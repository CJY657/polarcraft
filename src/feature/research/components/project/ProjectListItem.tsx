/**
 * Project List Item Component
 * 课题列表项组件
 *
 * Displays a compact list item for research projects
 * 显示研究课题的紧凑列表项
 */

import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Globe, LayoutGrid, Lock, Users } from "lucide-react";
import type { ResearchProject } from "@/lib/research.service";
import { ProjectDeleteAction } from "./ProjectDeleteAction";

interface ProjectListItemProps {
  project: ResearchProject;
  canDelete?: boolean;
  isDeleting?: boolean;
  onDelete?: (project: ResearchProject, confirmationText: string) => Promise<void>;
}

function getStatusMeta(status: ResearchProject["status"]) {
  switch (status) {
    case "active":
      return {
        label: "进行中",
        style: {
          color: "var(--paper-accent-strong)",
          borderColor: "color-mix(in srgb, var(--paper-accent) 28%, var(--glass-stroke))",
          background: "color-mix(in srgb, var(--paper-accent-soft) 92%, transparent)",
        },
      };
    case "completed":
      return {
        label: "已完成",
        style: {
          color: "var(--paper-link-strong)",
          borderColor: "color-mix(in srgb, var(--paper-link) 26%, var(--glass-stroke))",
          background: "color-mix(in srgb, var(--paper-link) 10%, transparent)",
        },
      };
    case "archived":
      return {
        label: "已归档",
        style: {
          color: "#b86b1b",
          borderColor: "color-mix(in srgb, #d7994c 24%, var(--glass-stroke))",
          background: "color-mix(in srgb, #d7994c 12%, transparent)",
        },
      };
    default:
      return {
        label: "草稿",
        style: {
          color: "var(--glass-text-muted)",
          borderColor: "var(--glass-stroke)",
          background: "color-mix(in srgb, var(--glass-chip) 90%, transparent)",
        },
      };
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
  });
}

export function ProjectListItem({ project, canDelete = false, isDeleting = false, onDelete }: ProjectListItemProps) {
  const statusMeta = getStatusMeta(project.status);

  return (
    <article className="research-panel-soft rounded-[1.45rem] p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--glass-shadow-strong)]">
      <Link to={`/lab/projects/${project.id}`} className="group block">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold"
                style={statusMeta.style}
              >
                {statusMeta.label}
              </span>
              <span className="research-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium">
                {project.is_public ? <Globe className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                {project.is_public ? "公开协作" : "组内可见"}
              </span>
            </div>

            <h3
              className="line-clamp-2 text-[1.02rem] font-semibold leading-tight text-[var(--paper-foreground)]"
              style={{ fontFamily: "var(--font-ui-display)" }}
            >
              {project.name_zh}
            </h3>

            <p className="mt-2 line-clamp-2 text-lg leading-7 text-[var(--glass-text-muted)]">
              {project.description_zh || "还没有项目摘要，进入画布后补充研究目标与实验线索。"}
            </p>
          </div>

          <div className="research-chip flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover:translate-x-0.5">
            <ArrowRight className="h-4 w-4 text-[var(--paper-link)]" />
          </div>
        </div>
      </Link>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="research-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1">
              <Users className="h-3.5 w-3.5" />
              {project.member_count} 位成员
            </span>
            <span className="research-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1">
              <LayoutGrid className="h-3.5 w-3.5" />
              {project.canvas_count ?? 0} 张画布
            </span>
            <span className="research-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1">
              <Calendar className="h-3.5 w-3.5" />
              更新于 {formatDate(project.updated_at)}
            </span>
          </div>

          <Link
            to={`/lab/projects/${project.id}`}
            className="glass-button inline-flex items-center justify-center gap-2 self-start rounded-full px-4 py-2 text-base font-medium lg:self-auto"
          >
            进入项目
            <ArrowRight className="h-4 w-4 text-[var(--paper-link)]" />
          </Link>
        </div>

        {canDelete && onDelete && (
          <ProjectDeleteAction
            projectName={project.name_zh}
            onDelete={(confirmationText) => onDelete(project, confirmationText)}
            isDeleting={isDeleting}
          />
        )}
      </div>
    </article>
  );
}
