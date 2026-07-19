/**
 * My Projects Page
 * 我的研究项目页面
 */

import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  LogIn,
  Plus,
  RefreshCw,
  Search,
  Users,
  FlaskConical,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSystem } from "@/contexts/SystemContext";
import { PersistentHeader } from "@/components/shared";
import { researchApi, type ResearchProject } from "@/lib/research.service";
import { useAuthDialogStore } from "@/stores/authDialogStore";
import { ProjectCoverImage } from "../components/shared/ProjectCoverImage";
import { ProjectChallengePreview } from "../components/project/ProjectChallengeCards";
import { ProjectDeleteAction } from "../components/project/ProjectDeleteAction";
import { getHealthDisplay } from "../components/project/researchHealthDisplay";

const CreateProjectWizard = lazy(() =>
  import("../components/project/CreateProjectWizard").then((module) => ({ default: module.CreateProjectWizard }))
);

export function MyProjectsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { isSystemHealthy, healthStatus, isChecking, checkHealth } = useSystem();
  const navigate = useNavigate();
  const openDialog = useAuthDialogStore((state) => state.openDialog);

  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateWizardOpen, setIsCreateWizardOpen] = useState(false);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);

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

  const activeProjects = useMemo(
    () => projects.filter((project) => project.status === "active").length,
    [projects]
  );


  const handleCreateProject = () => {
    if (!isAuthenticated) {
      openDialog("login");
      return;
    }
    setIsCreateWizardOpen(true);
  };

  const handleDeleteProject = async (project: ResearchProject, confirmationText: string) => {
    setDeletingProjectId(project.id);

    try {
      await researchApi.deleteProject(project.id, confirmationText);
      setDeletingProjectId(null);
      setProjects((prev) => prev.filter((item) => item.id !== project.id));
    } catch (err) {
      setDeletingProjectId(null);
      throw (err instanceof Error ? err : new Error("删除课题失败"));
    }
  };

  const healthDisplay = getHealthDisplay(healthStatus);
  const HealthIcon = healthDisplay.icon;

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="research-page min-h-screen">
        <PersistentHeader
          moduleKey="labGroup"
          moduleNameKey="我的研究项目"
          variant="glass"
          className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl dark:bg-slate-900/80"
        />

        <main className="research-shell py-8">
          <section className="mb-8 grid gap-4 md:grid-cols-3">
            <div className="research-panel relative flex flex-col justify-between overflow-hidden rounded-[2.15rem] p-6 sm:p-8 md:col-span-3">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--paper-accent-soft)]/20 to-transparent pointer-events-none"></div>
              <div className="relative">
                <div className="mb-2 flex items-center gap-3">
                  <div className="research-chip flex h-12 w-12 items-center justify-center rounded-2xl">
                    <Users className="h-6 w-6 text-[var(--paper-link)]" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-semibold text-[var(--paper-foreground)]" style={{ fontFamily: "var(--font-ui-display)" }}>
                      我的课题
                    </h1>
                    <p className="mt-1 text-sm font-medium uppercase tracking-[0.18em] text-[var(--glass-text-muted)]">
                      My Research Projects
                    </p>
                  </div>
                </div>
                <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--glass-text-muted)]">
                  个人项目页会集中展示你参与的课题、当前状态和继续推进的入口。现在可以先去发现公开课题，或者直接登录开始创建。
                </p>
              </div>
              
              <div className="relative mt-8 flex flex-wrap gap-3">
                <button
                  onClick={() => openDialog("login")}
                  className="glass-button glass-button-primary inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-base font-semibold text-white transition-all hover:-translate-y-0.5"
                >
                  <LogIn className="h-4 w-4" />
                  立即登录
                </button>
                <Link
                  to="/lab/explore"
                  className="glass-button inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-base font-medium transition-all hover:-translate-y-0.5"
                >
                  <Search className="h-4 w-4 text-[var(--paper-link)]" />
                  浏览公开课题
                </Link>
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="research-page min-h-screen">
      <PersistentHeader
        moduleKey="labGroup"
        moduleNameKey="我的研究项目"
        variant="glass"
        className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl dark:bg-slate-900/80"
      />

      <main className="research-shell py-6 md:py-8">
        <section className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="research-panel relative flex flex-col justify-between overflow-hidden rounded-[2.15rem] p-6 sm:p-8 md:col-span-2">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--paper-accent-soft)]/20 to-transparent pointer-events-none"></div>
            <div className="relative">
              <div className="mb-2 flex items-center gap-3">
                <div className="research-chip flex h-12 w-12 items-center justify-center rounded-2xl">
                  <Users className="h-6 w-6 text-[var(--paper-link)]" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-[var(--paper-foreground)]" style={{ fontFamily: "var(--font-ui-display)" }}>
                    我的课题
                  </h1>
                  <p className="mt-1 text-sm font-medium uppercase tracking-[0.18em] text-[var(--glass-text-muted)]">
                    My Research Projects
                  </p>
                </div>
              </div>
            </div>
            
            <div className="relative mt-8 flex flex-wrap gap-3">
              <button
                onClick={handleCreateProject}
                disabled={!isSystemHealthy}
                className="glass-button glass-button-primary inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-base font-semibold text-white transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                <Plus className="h-4 w-4" />
                创建新课题
              </button>
              <Link
                to="/lab/explore"
                className="glass-button inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-base font-medium transition-all hover:-translate-y-0.5"
              >
                <Search className="h-4 w-4 text-[var(--paper-link)]" />
                寻找协作课题
              </Link>
            </div>
          </div>

          <div className="grid grid-rows-2 gap-4">
            <div className="research-panel flex flex-col items-center justify-center rounded-[2.15rem] p-5 text-center">
              <p className="text-sm font-medium uppercase tracking-[0.1em] text-[var(--glass-text-muted)]">
                全部课题
              </p>
              <p className="mt-2 text-4xl font-semibold text-[var(--paper-foreground)]">{projects.length}</p>
            </div>
            <div className="research-panel flex flex-col items-center justify-center rounded-[2.15rem] p-5 text-center">
              <p className="text-sm font-medium uppercase tracking-[0.1em] text-[var(--glass-text-muted)]">
                进行中
              </p>
              <p className="mt-2 text-4xl font-semibold text-[var(--paper-accent-strong)]">{activeProjects}</p>
            </div>
          </div>
        </section>

        {!isSystemHealthy && (
          <section className="mb-8 rounded-[1.5rem] p-4" style={healthDisplay.panelStyle}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <HealthIcon className={`mt-0.5 h-5 w-5 ${isChecking ? "animate-spin" : ""}`} />
                <div>
                  <p className="text-base font-semibold">{healthDisplay.text}</p>
                  <p className="mt-1 text-base opacity-80">当前可能影响创建、进入或同步课题，建议先确认服务状态。</p>
                </div>
              </div>

              <button
                onClick={() => checkHealth()}
                disabled={isChecking}
                className="glass-button inline-flex items-center justify-center gap-2 self-start rounded-full px-4 py-2 text-base font-medium disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${isChecking ? "animate-spin" : ""}`} />
                重新检测
              </button>
            </div>
          </section>
        )}

        {isLoading ? (
          <section className="research-panel rounded-[1.9rem] p-5 sm:p-6">
            <div className="mb-5">
              <h2
                className="text-2xl font-semibold text-[var(--paper-foreground)]"
                style={{ fontFamily: "var(--font-ui-display)" }}
              >
                正在同步你的项目列表
              </h2>
            </div>

            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="research-panel-soft animate-pulse rounded-[1.45rem] p-4"
                >
                  <div className="h-4 w-24 rounded bg-[var(--glass-chip)]" />
                  <div className="mt-3 h-6 w-2/3 rounded bg-[var(--glass-chip)]" />
                  <div className="mt-3 h-4 w-full rounded bg-[var(--glass-chip)]" />
                  <div className="mt-2 h-4 w-1/2 rounded bg-[var(--glass-chip)]" />
                </div>
              ))}
            </div>
          </section>
        ) : error ? (
          <section
            className="rounded-[1.6rem] p-5"
            style={{
              border: "1px solid color-mix(in srgb, #d95b5b 28%, var(--glass-stroke))",
              background: "color-mix(in srgb, #d95b5b 10%, transparent)",
              color: "#b33d3d",
            }}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5" />
              <div>
                <p className="text-base font-semibold">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-3 inline-flex items-center rounded-full border border-current/20 px-4 py-2 text-base font-medium"
                >
                  重试
                </button>
              </div>
            </div>
          </section>
        ) : projects.length === 0 ? (
          <section className="research-panel rounded-[1.9rem] p-6 sm:p-7">
            <div className="max-w-2xl">
              <h2
                className="text-2xl font-semibold text-[var(--paper-foreground)]"
                style={{ fontFamily: "var(--font-ui-display)" }}
              >
                还没有研究项目，先建立一个主课题
              </h2>
              <p className="mt-3 text-base leading-6 text-[var(--glass-text-muted)]">
                先定义一个清晰的问题域，再把实验、证据和结论补充进画布。等课题结构稳定后，再开放给其他成员加入。
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={handleCreateProject}
                  disabled={!isSystemHealthy}
                  className="glass-button glass-button-primary inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Plus className="h-4 w-4" />
                  创建第一个课题
                </button>
                <Link
                  to="/lab/explore"
                  className="glass-button inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-base font-medium"
                >
                  <Search className="h-4 w-4 text-[var(--paper-link)]" />
                  先看别人怎么做
                </Link>
              </div>
            </div>
          </section>
        ) : (
          <section className="research-panel rounded-[1.9rem] p-5 sm:p-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2
                  className="text-2xl font-semibold text-[var(--paper-foreground)]"
                  style={{ fontFamily: "var(--font-ui-display)" }}
                >
                  全部研究课题
                </h2>
                <p className="mt-2 text-base leading-6 text-[var(--glass-text-muted)]">
                  先看摘要和状态，再进入具体项目，不需要再逐个点开确认基本信息。
                </p>
              </div>

              <span className="research-chip inline-flex self-start rounded-full px-3 py-1.5 text-sm font-medium sm:self-auto">
                共 {projects.length} 个课题
              </span>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {projects.map((project) => (
                <article
                  key={project.id}
                  className="research-panel flex flex-col rounded-[1.7rem] p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--glass-shadow-strong)]"
                >
                  <ProjectCoverImage
                    src={project.thumbnail || project.cover_image}
                    alt={project.name_zh}
                    className="mb-5 aspect-[16/9] w-full rounded-[1.25rem] object-cover"
                  />
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h2
                        className="text-[1.35rem] font-semibold leading-tight text-[var(--paper-foreground)]"
                        style={{ fontFamily: "var(--font-ui-display)" }}
                      >
                        {project.name_zh}
                      </h2>
                    </div>
                    <div className="research-chip flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
                      <FlaskConical className="h-5 w-5 text-[var(--paper-link)]" />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-1 flex-col space-y-3">
                    <ProjectChallengePreview project={project} />

                    <div className="research-panel-soft mt-auto rounded-[1.2rem] px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium text-[var(--glass-text-muted)]">课题成员</p>
                        <span className="research-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm">
                          <Users className="h-3.5 w-3.5" />
                          {project.member_count} 人
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-2">
                    <Link
                      to={`/lab/projects/${project.id}`}
                      className="glass-button glass-button-primary inline-flex w-full items-center justify-center rounded-full px-4 py-2 text-base font-semibold text-white"
                    >
                      进入课题
                    </Link>

                    {(user?.role === "admin" || project.current_user_role === "owner") && (
                      <ProjectDeleteAction
                        projectName={project.name_zh}
                        onDelete={(confirmationText) => handleDeleteProject(project, confirmationText)}
                        isDeleting={deletingProjectId === project.id}
                        triggerLabel="删除课题"
                        className="w-full justify-center"
                      />
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>

      <Suspense fallback={null}>
        {isCreateWizardOpen && (
          <CreateProjectWizard
            isOpen={isCreateWizardOpen}
            onClose={() => setIsCreateWizardOpen(false)}
            onSuccess={(projectId) => {
              setIsCreateWizardOpen(false);
              navigate(`/lab/projects/${projectId}`);
            }}
          />
        )}
      </Suspense>
    </div>
  );
}

export default MyProjectsPage;
