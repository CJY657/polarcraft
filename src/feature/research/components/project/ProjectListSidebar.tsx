/**
 * Project List Sidebar Component
 * 课题列表侧边栏组件
 *
 * Displays user's research projects in a compact list format
 * 以紧凑列表格式显示用户的研究课题
 */

import { ExternalLink, FlaskConical, Loader2, LogIn, Plus, Search } from "lucide-react";
import { Link } from "react-router-dom";
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
  const openDialog = useAuthDialogStore((state) => state.openDialog);
  const activeProjects = projects.filter((project) => project.status === "active").length;

  return (
    <section className="research-panel rounded-[1.8rem] p-5 md:p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="research-kicker mb-2">My Workspace</div>
          <h2
            className="text-xl font-semibold text-[var(--paper-foreground)]"
            style={{ fontFamily: "var(--font-ui-display)" }}
          >
            我的课题工作台
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--glass-text-muted)]">
            集中管理你参与的研究课题，先看进度，再决定继续推进还是扩展新方向。
          </p>
        </div>

        <Link
          to="/lab/projects"
          className="research-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
        >
          全部课题
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <div className="research-metric rounded-[1.35rem] p-4">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--glass-text-muted)]">
            参与课题
          </p>
          <p className="mt-2 text-3xl font-semibold text-[var(--paper-foreground)]">{projects.length}</p>
        </div>
        <div className="research-metric rounded-[1.35rem] p-4">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--glass-text-muted)]">
            进行中
          </p>
          <p className="mt-2 text-3xl font-semibold text-[var(--paper-foreground)]">{activeProjects}</p>
        </div>
      </div>

      {isAuthenticated ? (
        <div className="mb-5 flex flex-wrap gap-3">
          <button
            onClick={onCreateProject}
            className="glass-button glass-button-primary inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            新建课题
          </button>
          <Link
            to="/lab/explore"
            className="glass-button inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
          >
            <Search className="h-4 w-4 text-[var(--paper-link)]" />
            浏览公开课题
          </Link>
        </div>
      ) : (
        <div className="research-panel-soft mb-5 rounded-[1.45rem] p-4">
          <div className="mb-3 flex items-start gap-3">
            <div className="research-chip flex h-10 w-10 items-center justify-center rounded-2xl">
              <LogIn className="h-4 w-4 text-[var(--paper-link)]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--paper-foreground)]">登录后开启个人研究工作台</p>
              <p className="mt-1 text-sm leading-6 text-[var(--glass-text-muted)]">
                你可以保存画布、管理成员，并持续迭代自己的研究路线。
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => openDialog("login")}
              className="glass-button glass-button-primary inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white"
            >
              <LogIn className="h-4 w-4" />
              立即登录
            </button>
            <Link
              to="/lab/explore"
              className="glass-button inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
            >
              <Search className="h-4 w-4 text-[var(--paper-link)]" />
              先看公开课题
            </Link>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {isLoading && (
          <div className="research-panel-soft flex flex-col items-center justify-center rounded-[1.45rem] py-10">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--paper-accent)]" />
            <p className="mt-3 text-sm text-[var(--glass-text-muted)]">正在整理你的课题列表…</p>
          </div>
        )}

        {error && !isLoading && (
          <div
            className="rounded-[1.35rem] p-4 text-sm"
            style={{
              border: "1px solid color-mix(in srgb, #d95b5b 28%, var(--glass-stroke))",
              background: "color-mix(in srgb, #d95b5b 10%, transparent)",
              color: "#b33d3d",
            }}
          >
            {error}
          </div>
        )}

        {!isAuthenticated && !isLoading && (
          <div className="research-panel-soft rounded-[1.45rem] border border-dashed p-5 text-center">
            <FlaskConical className="mx-auto h-9 w-9 text-[var(--glass-text-muted)]" />
            <p className="mt-3 text-sm font-medium text-[var(--paper-foreground)]">课题列表会在登录后出现在这里</p>
            <p className="mt-1 text-sm text-[var(--glass-text-muted)]">当前可以先从右侧公开课题里挑选感兴趣的方向。</p>
          </div>
        )}

        {isAuthenticated && !isLoading && !error && projects.length > 0 && (
          <div className="space-y-2">
            {projects.map((project) => (
              <ProjectListItem key={project.id} project={project} />
            ))}
          </div>
        )}

        {isAuthenticated && !isLoading && !error && projects.length === 0 && (
          <div className="research-panel-soft rounded-[1.45rem] border border-dashed p-5">
            <div className="mb-4 flex items-start gap-3">
              <div className="research-chip flex h-10 w-10 items-center justify-center rounded-2xl">
                <FlaskConical className="h-4 w-4 text-[var(--paper-accent)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--paper-foreground)]">还没有自己的研究课题</p>
                <p className="mt-1 text-sm leading-6 text-[var(--glass-text-muted)]">
                  先创建一个主课题，后续再把问题、实验和结论拆进画布里。
                </p>
              </div>
            </div>
            <button
              onClick={onCreateProject}
              className="glass-button glass-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" />
              创建第一个课题
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
