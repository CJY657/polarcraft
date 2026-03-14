/**
 * Project List Dashboard
 * 虚拟课题组首页工作台
 */

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle,
  FolderOpen,
  Plus,
  RefreshCw,
  Search,
  WifiOff,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSystem } from "@/contexts/SystemContext";
import { PersistentHeader } from "@/components/shared";
import { researchApi, type ResearchProject } from "@/lib/research.service";
import { EXAMPLE_PROJECTS } from "@/data/researchExampleProjects";
import { useAuthDialogStore } from "@/stores/authDialogStore";
import { CreateProjectWizard } from "./CreateProjectWizard";
import { ProjectListSidebar } from "./ProjectListSidebar";
import { PublicProjectsSection } from "./PublicProjectsSection";

function getHealthDisplay(healthStatus: string) {
  switch (healthStatus) {
    case "healthy":
      return {
        icon: CheckCircle,
        text: "系统正常",
        panelStyle: {
          border: "1px solid color-mix(in srgb, var(--paper-accent) 22%, var(--glass-stroke))",
          background: "color-mix(in srgb, var(--paper-accent-soft) 88%, transparent)",
          color: "var(--paper-accent-strong)",
        },
      };
    case "unhealthy":
      return {
        icon: AlertTriangle,
        text: "系统异常",
        panelStyle: {
          border: "1px solid color-mix(in srgb, #d7994c 28%, var(--glass-stroke))",
          background: "color-mix(in srgb, #d7994c 10%, transparent)",
          color: "#a45a13",
        },
      };
    case "offline":
      return {
        icon: WifiOff,
        text: "服务器离线",
        panelStyle: {
          border: "1px solid color-mix(in srgb, #d95b5b 28%, var(--glass-stroke))",
          background: "color-mix(in srgb, #d95b5b 10%, transparent)",
          color: "#b33d3d",
        },
      };
    default:
      return {
        icon: RefreshCw,
        text: "检测中",
        panelStyle: {
          border: "1px solid var(--glass-stroke)",
          background: "color-mix(in srgb, var(--glass-panel-soft) 88%, transparent)",
          color: "var(--glass-text-muted)",
        },
      };
  }
}

export function ProjectList() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isSystemHealthy, healthStatus, isChecking, checkHealth } = useSystem();
  const navigate = useNavigate();
  const openDialog = useAuthDialogStore((state) => state.openDialog);

  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateWizardOpen, setIsCreateWizardOpen] = useState(false);

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

  const handleCreateProject = () => {
    if (!isAuthenticated) {
      openDialog("login");
      return;
    }
    setIsCreateWizardOpen(true);
  };

  const activeProjects = useMemo(
    () => projects.filter((project) => project.status === "active").length,
    [projects]
  );

  const healthDisplay = getHealthDisplay(healthStatus);
  const HealthIcon = healthDisplay.icon;

  return (
    <div className="research-page min-h-screen">
      <PersistentHeader
        moduleKey="labGroup"
        moduleNameKey="虚拟课题组"
        variant="glass"
        className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl dark:bg-slate-900/80"
      />

      <main className="research-shell py-6 md:py-8">
        <section className="research-hero mb-8 rounded-[2.2rem] px-6 py-7 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="research-kicker">Virtual Research Lab</span>
                <span className="research-chip inline-flex rounded-full px-3 py-1 font-medium">
                  {authLoading ? "同步中" : isAuthenticated ? "已登录工作台" : "游客模式"}
                </span>
              </div>

              <h1
                className="max-w-3xl text-[clamp(2rem,4vw,3.5rem)] font-semibold leading-[1.05] text-[var(--paper-foreground)]"
                style={{ fontFamily: "var(--font-ui-display)" }}
              >
                把问题、实验和结论整理进同一张研究地图
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--glass-text-muted)] sm:text-lg">
                这里不是单纯的课题列表，而是一个研究型学习工作台。先管理自己的项目，再发现可加入的公开团队，
                最后参考成熟示例，把研究路径一步步搭起来。
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={handleCreateProject}
                  className="glass-button glass-button-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white"
                >
                  <Plus className="h-4 w-4" />
                  {isAuthenticated ? "新建研究课题" : "登录后新建课题"}
                </button>
                <Link
                  to="/lab/explore"
                  className="glass-button inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium"
                >
                  <Search className="h-4 w-4 text-[var(--paper-link)]" />
                  浏览公开课题
                </Link>
                <Link
                  to="/lab/projects"
                  className="glass-button inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium"
                >
                  <FolderOpen className="h-4 w-4 text-[var(--paper-link)]" />
                  查看我的项目
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:w-[30rem]">
              <div className="research-metric rounded-[1.5rem] p-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--glass-text-muted)]">
                  我的课题
                </p>
                <p className="mt-2 text-3xl font-semibold text-[var(--paper-foreground)]">{projects.length}</p>
              </div>
              <div className="research-metric rounded-[1.5rem] p-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--glass-text-muted)]">
                  进行中
                </p>
                <p className="mt-2 text-3xl font-semibold text-[var(--paper-foreground)]">{activeProjects}</p>
              </div>
              <div className="research-metric rounded-[1.5rem] p-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--glass-text-muted)]">
                  示例课题
                </p>
                <p className="mt-2 text-3xl font-semibold text-[var(--paper-foreground)]">
                  {EXAMPLE_PROJECTS.length}
                </p>
              </div>
            </div>
          </div>
        </section>

        {!isSystemHealthy && (
          <section className="mb-8 rounded-[1.5rem] p-4" style={healthDisplay.panelStyle}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <HealthIcon className={`mt-0.5 h-5 w-5 ${isChecking ? "animate-spin" : ""}`} />
                <div>
                  <p className="text-sm font-semibold">{healthDisplay.text}</p>
                  <p className="mt-1 text-sm opacity-80">当前可能有部分研究功能暂时不可用，建议先检测服务状态。</p>
                </div>
              </div>

              <button
                onClick={() => checkHealth()}
                disabled={isChecking}
                className="glass-button inline-flex items-center justify-center gap-2 self-start rounded-full px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${isChecking ? "animate-spin" : ""}`} />
                重新检测
              </button>
            </div>
          </section>
        )}

        <section className="mb-8 grid gap-6 xl:grid-cols-[minmax(0,24rem)_1fr]">
          <ProjectListSidebar
            projects={projects}
            isLoading={isLoading}
            error={error}
            isAuthenticated={isAuthenticated && !authLoading}
            onCreateProject={handleCreateProject}
          />
          <PublicProjectsSection />
        </section>

        <section className="research-panel rounded-[2rem] p-6 sm:p-7">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="research-kicker mb-2">Reference Projects</div>
              <h2
                className="text-2xl font-semibold text-[var(--paper-foreground)]"
                style={{ fontFamily: "var(--font-ui-display)" }}
              >
                从成熟示例快速理解研究画布
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--glass-text-muted)]">
                如果你还没决定从哪开始，先看这些已经收束完成的示例课题。它们能帮你理解节点、关系和结论该怎样组织。
              </p>
            </div>

            <span className="research-chip inline-flex items-center gap-2 self-start rounded-full px-3 py-1.5 text-xs font-medium sm:self-auto">
              <BookOpen className="h-3.5 w-3.5" />
              共 {EXAMPLE_PROJECTS.length} 个示例
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {EXAMPLE_PROJECTS.map((project) => (
              <Link
                key={project.id}
                to={`/lab/projects/example-${project.id}`}
                className="research-panel-soft group overflow-hidden rounded-[1.65rem] transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--glass-shadow-strong)]"
              >
                {project.coverImage && (
                  <div className="aspect-[16/10] overflow-hidden border-b border-[var(--glass-stroke)] bg-[var(--glass-panel-soft)]">
                    <img
                      src={project.coverImage}
                      alt={project.title["zh-CN"]}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      onError={(e) => {
                        e.currentTarget.src =
                          'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23cbd5e1"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%2364748b" font-size="12" font-family="sans-serif"%3E暂无封面%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  </div>
                )}

                <div className="p-5">
                  <h3
                    className="line-clamp-2 text-lg font-semibold text-[var(--paper-foreground)]"
                    style={{ fontFamily: "var(--font-ui-display)" }}
                  >
                    {project.title["zh-CN"]}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--glass-text-muted)]">
                    {project.description["zh-CN"]}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <span className="research-chip inline-flex rounded-full px-3 py-1">
                      {project.nodes.length} 个节点
                    </span>
                    <span className="research-chip inline-flex rounded-full px-3 py-1">
                      {project.edges.length} 条关系
                    </span>
                  </div>

                  <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[var(--paper-link)]">
                    打开示例
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <CreateProjectWizard
        isOpen={isCreateWizardOpen}
        onClose={() => setIsCreateWizardOpen(false)}
        onSuccess={(projectId) => {
          setIsCreateWizardOpen(false);
          navigate(`/lab/projects/${projectId}`);
        }}
      />
    </div>
  );
}
