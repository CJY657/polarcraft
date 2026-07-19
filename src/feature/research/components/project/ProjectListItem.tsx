/**
 * Project List Item Component
 * 课题列表项组件
 *
 * Displays a compact list item for research projects
 * 显示研究课题的紧凑列表项
 */

import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Globe, Lock, Users } from "lucide-react";
import type { ResearchProject } from "@/lib/research.service";
import { ProjectCoverImage } from "../shared/ProjectCoverImage";
import { ProjectDeleteAction } from "./ProjectDeleteAction";
import { ProjectLifecycleBadges } from "../../projectLifecycle";

interface ProjectListItemProps {
  project: ResearchProject;
  canDelete?: boolean;
  isDeleting?: boolean;
  onDelete?: (project: ResearchProject, confirmationText: string) => Promise<void>;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
  });
}

export function ProjectListItem({ project, canDelete = false, isDeleting = false, onDelete }: ProjectListItemProps) {
  const coverImage = project.thumbnail || project.cover_image;

  return (
    <article className="group/card research-panel-soft relative overflow-hidden rounded-[1.45rem] p-4 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-[var(--paper-accent)]/10 bg-gradient-to-b from-transparent to-[var(--glass-surface)]/30 border border-transparent hover:border-[var(--glass-stroke)]">
      <Link to={`/lab/projects/${project.id}`} className="group block">
        <div className="mb-4 aspect-[16/9] w-full overflow-hidden rounded-[1.1rem] ring-1 ring-black/5 dark:ring-white/10">
          <ProjectCoverImage
            src={coverImage}
            alt={project.name_zh}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </div>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <ProjectLifecycleBadges status={project.status} isDormant={project.is_dormant} />
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

            <p className="mt-2 line-clamp-2 text-[0.95rem] leading-[1.6] text-[var(--glass-text-muted)] transition-colors duration-300 group-hover:text-[var(--paper-foreground)]/80">
              {project.description_zh || "还没有项目摘要，进入项目后补充研究目标与实验线索。"}
            </p>
          </div>

          <div className="research-chip flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full shadow-sm transition-all duration-300 group-hover:translate-x-1.5 group-hover:bg-[var(--paper-accent)] group-hover:text-white">
            <ArrowRight className="h-4 w-4 text-[var(--paper-link)] transition-colors group-hover:text-white" />
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
              <Calendar className="h-3.5 w-3.5" />
              更新于 {formatDate(project.updated_at)}
            </span>
          </div>

          <Link
            to={`/lab/projects/${project.id}`}
            className="glass-button group/btn inline-flex items-center justify-center gap-2 self-start rounded-full px-4 py-2 text-base font-medium shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md lg:self-auto"
          >
            进入项目
            <ArrowRight className="h-4 w-4 text-[var(--paper-link)] transition-transform duration-300 group-hover/btn:translate-x-1" />
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
