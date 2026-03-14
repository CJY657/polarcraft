/**
 * Public Projects Section Component
 * 公开课题区域组件
 *
 * Displays a curated subset of public projects for the dashboard
 * 在首页工作台中展示精选公开课题
 */

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Clock, FlaskConical, Loader2, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSystem } from "@/contexts/SystemContext";
import { profileApi, type PublicProject } from "@/lib/profile.service";
import { useAuthDialogStore } from "@/stores/authDialogStore";
import { ProjectApplicationForm } from "./ProjectApplicationForm";

export function PublicProjectsSection() {
  const { isAuthenticated } = useAuth();
  const { isSystemHealthy } = useSystem();
  const openDialog = useAuthDialogStore((state) => state.openDialog);

  const [projects, setProjects] = useState<PublicProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<PublicProject | null>(null);
  const [isApplicationFormOpen, setIsApplicationFormOpen] = useState(false);

  useEffect(() => {
    async function fetchProjects() {
      if (!isSystemHealthy) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await profileApi.getPublicProjects();
        setProjects(data);
      } catch (err) {
        console.error("Failed to fetch public projects:", err);
        setError(err instanceof Error ? err.message : "加载课题失败");
      } finally {
        setIsLoading(false);
      }
    }

    fetchProjects();
  }, [isSystemHealthy]);

  const handleApplyClick = (project: PublicProject) => {
    if (!isAuthenticated) {
      openDialog("login");
      return;
    }
    setSelectedProject(project);
    setIsApplicationFormOpen(true);
  };

  const handleApplicationSuccess = async () => {
    setIsApplicationFormOpen(false);

    try {
      const data = await profileApi.getPublicProjects();
      setProjects(data);
    } catch (err) {
      console.error("Failed to refresh projects:", err);
    }
  };

  const featuredProjects = useMemo(() => {
    return [...projects]
      .sort((a, b) => Number(b.is_recruiting) - Number(a.is_recruiting))
      .slice(0, 4);
  }, [projects]);

  const recruitingCount = projects.filter((project) => project.is_recruiting).length;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("zh-CN", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <section className="research-panel rounded-[1.8rem] p-5 md:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="research-kicker mb-2">Open Research</div>
          <h2
            className="text-xl font-semibold text-[var(--paper-foreground)]"
            style={{ fontFamily: "var(--font-ui-display)" }}
          >
            适合加入的公开课题
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--glass-text-muted)]">
            首页只保留最有加入价值的一小部分课题，先看方向和招募状态，再进入完整发现页深入筛选。
          </p>
        </div>

        <Link
          to="/lab/explore"
          className="glass-button inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
        >
          查看全部课题
          <ArrowRight className="h-4 w-4 text-[var(--paper-link)]" />
        </Link>
      </div>

      <div className="mb-5 flex flex-wrap gap-2 text-xs">
        <span className="research-chip research-chip-accent inline-flex items-center rounded-full px-3 py-1.5 font-medium">
          {recruitingCount} 个课题正在招募
        </span>
        <span className="research-chip inline-flex items-center rounded-full px-3 py-1.5 font-medium">
          共 {projects.length} 个公开方向可浏览
        </span>
      </div>

      {isLoading && (
        <div className="research-panel-soft flex flex-col items-center justify-center rounded-[1.55rem] py-14">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--paper-accent)]" />
          <p className="mt-3 text-sm text-[var(--glass-text-muted)]">正在挑选值得关注的公开课题…</p>
        </div>
      )}

      {error && !isLoading && (
        <div
          className="rounded-[1.4rem] p-4 text-sm"
          style={{
            border: "1px solid color-mix(in srgb, #d95b5b 28%, var(--glass-stroke))",
            background: "color-mix(in srgb, #d95b5b 10%, transparent)",
            color: "#b33d3d",
          }}
        >
          {error}
        </div>
      )}

      {!isLoading && !error && featuredProjects.length > 0 && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {featuredProjects.map((project) => (
            <article
              key={project.id}
              className="research-panel-soft flex h-full flex-col rounded-[1.55rem] p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--glass-shadow-strong)]"
            >
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    {project.is_recruiting && (
                      <span className="research-chip research-chip-accent inline-flex rounded-full px-3 py-1 text-[11px] font-semibold">
                        招募中
                      </span>
                    )}
                    <span className="research-chip inline-flex rounded-full px-3 py-1 text-[11px] font-medium">
                      {project.require_approval ? "申请审核" : "可直接加入"}
                    </span>
                  </div>

                  <h3
                    className="line-clamp-2 text-lg font-semibold leading-tight text-[var(--paper-foreground)]"
                    style={{ fontFamily: "var(--font-ui-display)" }}
                  >
                    {project.name_zh}
                  </h3>
                </div>

                <div className="research-chip flex h-10 w-10 items-center justify-center rounded-2xl">
                  <FlaskConical className="h-4 w-4 text-[var(--paper-link)]" />
                </div>
              </div>

              <p className="line-clamp-3 text-sm leading-6 text-[var(--glass-text-muted)]">
                {project.description_zh || "课题简介待补充，可以先进入查看结构和成员情况。"}
              </p>

              {(project.owner_username || project.recruitment_requirements) && (
                <div className="mt-4 space-y-2">
                  {project.owner_username && (
                    <p className="text-xs text-[var(--glass-text-muted)]">
                      组长 <span className="font-semibold text-[var(--paper-foreground)]">{project.owner_username}</span>
                    </p>
                  )}
                  {project.recruitment_requirements && (
                    <p
                      className="rounded-[1rem] px-3 py-2 text-xs leading-5 text-[var(--paper-foreground)]"
                      style={{ background: "color-mix(in srgb, var(--paper-link) 8%, transparent)" }}
                    >
                      {project.recruitment_requirements}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="research-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1">
                  <Users className="h-3.5 w-3.5" />
                  {project.member_count}
                  {project.max_members && ` / ${project.max_members}`} 位成员
                </span>
                <span className="research-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1">
                  <Clock className="h-3.5 w-3.5" />
                  发布于 {formatDate(project.created_at)}
                </span>
              </div>

              <div className="mt-5 flex gap-2">
                <Link
                  to={`/lab/projects/${project.id}`}
                  state={{ readOnly: !project.is_member }}
                  className="glass-button inline-flex flex-1 items-center justify-center rounded-full px-4 py-2 text-sm font-medium"
                >
                  {project.is_member ? "进入课题" : "查看详情"}
                </Link>

                {!project.is_member && (
                  <button
                    onClick={() => handleApplyClick(project)}
                    className="glass-button glass-button-primary inline-flex flex-1 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-white"
                  >
                    {project.require_approval ? "提交申请" : "立即加入"}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {!isLoading && !error && featuredProjects.length === 0 && (
        <div className="research-panel-soft flex flex-col items-center justify-center rounded-[1.55rem] py-14 text-center">
          <FlaskConical className="h-10 w-10 text-[var(--glass-text-muted)]" />
          <p className="mt-4 text-sm font-semibold text-[var(--paper-foreground)]">暂时还没有公开课题</p>
          <p className="mt-1 text-sm text-[var(--glass-text-muted)]">稍后再来看看，或者先创建自己的研究方向。</p>
        </div>
      )}

      <ProjectApplicationForm
        isOpen={isApplicationFormOpen}
        onClose={() => setIsApplicationFormOpen(false)}
        project={selectedProject}
        onSuccess={handleApplicationSuccess}
      />
    </section>
  );
}
