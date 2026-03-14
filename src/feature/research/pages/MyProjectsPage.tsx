/**
 * My Projects Page
 * 我的研究项目页面
 */

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle,
  LogIn,
  Plus,
  RefreshCw,
  Search,
  WifiOff,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSystem } from "@/contexts/SystemContext";
import { PersistentHeader } from "@/components/shared";
import { researchApi, type ResearchProject } from "@/lib/research.service";
import { useAuthDialogStore } from "@/stores/authDialogStore";
import { CreateProjectWizard } from "../components/project/CreateProjectWizard";
import { ProjectListItem } from "../components/project/ProjectListItem";

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

export function MyProjectsPage() {
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

  const activeProjects = useMemo(
    () => projects.filter((project) => project.status === "active").length,
    [projects]
  );
  const completedProjects = useMemo(
    () => projects.filter((project) => project.status === "completed").length,
    [projects]
  );

  const handleCreateProject = () => {
    if (!isAuthenticated) {
      openDialog("login");
      return;
    }
    setIsCreateWizardOpen(true);
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
          <section className="research-hero rounded-[2rem] px-6 py-8 sm:px-8">
            <div className="max-w-3xl">
              <div className="research-kicker mb-3">My Research Projects</div>
              <h1
                className="text-[clamp(2rem,4vw,3.2rem)] font-semibold leading-[1.08] text-[var(--paper-foreground)]"
                style={{ fontFamily: "var(--font-ui-display)" }}
              >
                登录后再回到这里管理你的研究进度
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--glass-text-muted)]">
                个人项目页会集中展示你参与的课题、当前状态和继续推进的入口。现在可以先去发现公开课题，或者直接登录开始创建。
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => openDialog("login")}
                  className="glass-button glass-button-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white"
                >
                  <LogIn className="h-4 w-4" />
                  立即登录
                </button>
                <Link
                  to="/lab/explore"
                  className="glass-button inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium"
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
        <section className="research-hero mb-8 rounded-[2.1rem] px-6 py-7 sm:px-8">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="research-kicker mb-3">My Project Desk</div>
              <h1
                className="text-[clamp(2rem,4vw,3.2rem)] font-semibold leading-[1.08] text-[var(--paper-foreground)]"
                style={{ fontFamily: "var(--font-ui-display)" }}
              >
                继续推进你的研究项目，而不是重新找入口
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--glass-text-muted)]">
                这一页只保留管理自己课题需要的信息：状态、摘要、更新时间，以及继续进入项目的直接入口。
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={handleCreateProject}
                  disabled={!isSystemHealthy}
                  className="glass-button glass-button-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Plus className="h-4 w-4" />
                  创建新课题
                </button>
                <Link
                  to="/lab/explore"
                  className="glass-button inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium"
                >
                  <Search className="h-4 w-4 text-[var(--paper-link)]" />
                  寻找协作课题
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:w-[28rem]">
              <div className="research-metric rounded-[1.4rem] p-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--glass-text-muted)]">
                  全部课题
                </p>
                <p className="mt-2 text-3xl font-semibold text-[var(--paper-foreground)]">{projects.length}</p>
              </div>
              <div className="research-metric rounded-[1.4rem] p-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--glass-text-muted)]">
                  进行中
                </p>
                <p className="mt-2 text-3xl font-semibold text-[var(--paper-foreground)]">{activeProjects}</p>
              </div>
              <div className="research-metric rounded-[1.4rem] p-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--glass-text-muted)]">
                  已完成
                </p>
                <p className="mt-2 text-3xl font-semibold text-[var(--paper-foreground)]">
                  {completedProjects}
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
                  <p className="mt-1 text-sm opacity-80">当前可能影响创建、进入或同步课题，建议先确认服务状态。</p>
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

        {isLoading ? (
          <section className="research-panel rounded-[1.9rem] p-5 sm:p-6">
            <div className="mb-5">
              <div className="research-kicker mb-2">All Projects</div>
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
                <p className="text-sm font-semibold">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-3 inline-flex items-center rounded-full border border-current/20 px-4 py-2 text-sm font-medium"
                >
                  重试
                </button>
              </div>
            </div>
          </section>
        ) : projects.length === 0 ? (
          <section className="research-panel rounded-[1.9rem] p-6 sm:p-7">
            <div className="max-w-2xl">
              <div className="research-kicker mb-2">Start Here</div>
              <h2
                className="text-2xl font-semibold text-[var(--paper-foreground)]"
                style={{ fontFamily: "var(--font-ui-display)" }}
              >
                还没有研究项目，先建立一个主课题
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--glass-text-muted)]">
                先定义一个清晰的问题域，再把实验、证据和结论补充进画布。等课题结构稳定后，再开放给其他成员加入。
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={handleCreateProject}
                  disabled={!isSystemHealthy}
                  className="glass-button glass-button-primary inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Plus className="h-4 w-4" />
                  创建第一个课题
                </button>
                <Link
                  to="/lab/explore"
                  className="glass-button inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium"
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
                <div className="research-kicker mb-2">All Projects</div>
                <h2
                  className="text-2xl font-semibold text-[var(--paper-foreground)]"
                  style={{ fontFamily: "var(--font-ui-display)" }}
                >
                  全部研究课题
                </h2>
                <p className="mt-2 text-sm leading-6 text-[var(--glass-text-muted)]">
                  先看摘要和状态，再进入具体项目，不需要再逐个点开确认基本信息。
                </p>
              </div>

              <span className="research-chip inline-flex self-start rounded-full px-3 py-1.5 text-xs font-medium sm:self-auto">
                共 {projects.length} 个课题
              </span>
            </div>

            <div className="space-y-3">
              {projects.map((project) => (
                <ProjectListItem key={project.id} project={project} />
              ))}
            </div>
          </section>
        )}
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

export default MyProjectsPage;
