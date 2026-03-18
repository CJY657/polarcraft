/**
 * Public Project Explore Page
 * 公开课题浏览页面
 */

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  FlaskConical,
  Loader2,
  LogIn,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSystem } from "@/contexts/SystemContext";
import { PersistentHeader } from "@/components/shared";
import { profileApi, type PublicProject } from "@/lib/profile.service";
import { CreateProjectWizard } from "../components/project/CreateProjectWizard";
import { ProjectApplicationForm } from "../components/project/ProjectApplicationForm";
import { useAuthDialogStore } from "@/stores/authDialogStore";

export function PublicProjectExplorePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isSystemHealthy } = useSystem();
  const openDialog = useAuthDialogStore((state) => state.openDialog);

  const [projects, setProjects] = useState<PublicProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recruitingOnly, setRecruitingOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<PublicProject | null>(null);
  const [isApplicationFormOpen, setIsApplicationFormOpen] = useState(false);
  const [isCreateWizardOpen, setIsCreateWizardOpen] = useState(false);

  useEffect(() => {
    async function fetchProjects() {
      if (!isSystemHealthy) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await profileApi.getPublicProjects({
          recruiting: recruitingOnly || undefined,
          search: searchQuery || undefined,
        });
        setProjects(data);
      } catch (err) {
        console.error("Failed to fetch public projects:", err);
        setError(err instanceof Error ? err.message : "加载课题失败");
      } finally {
        setIsLoading(false);
      }
    }

    const timer = setTimeout(fetchProjects, 300);
    return () => clearTimeout(timer);
  }, [recruitingOnly, searchQuery, isSystemHealthy]);

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
      const data = await profileApi.getPublicProjects({
        recruiting: recruitingOnly || undefined,
        search: searchQuery || undefined,
      });
      setProjects(data);
    } catch (err) {
      console.error("Failed to refresh public projects:", err);
    }
  };

  const recruitingCount = useMemo(
    () => projects.filter((project) => project.is_recruiting).length,
    [projects]
  );

  const handleCreateProject = () => {
    if (!isAuthenticated) {
      openDialog("login");
      return;
    }

    if (!isSystemHealthy) {
      return;
    }

    setIsCreateWizardOpen(true);
  };

  const getMemberSummary = (project: PublicProject) => {
    const members = project.members
      .filter((member) => member.role !== "owner")
      .map((member) => member.username)
      .filter(Boolean);

    if (members.length > 0) {
      return members.join("、");
    }

    if (project.member_count > 1) {
      return `当前共 ${project.member_count} 位成员`;
    }

    return "暂无其他成员";
  };

  return (
    <div className="research-page min-h-screen">
      <PersistentHeader
        moduleKey="labGroup"
        moduleNameKey="发现课题"
        variant="glass"
        className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl dark:bg-slate-900/80"
        rightContent={
          <div className="flex items-center gap-2">
            <Link
              to="/lab/projects"
              className="glass-button inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium"
            >
              我的课题
            </Link>
            <button
              onClick={handleCreateProject}
              disabled={!isSystemHealthy}
              className="glass-button glass-button-primary inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              新建课题
            </button>
          </div>
        }
      />

      <main className="research-shell py-6 md:py-8">
        <section className="research-hero mb-8 rounded-[2.15rem] px-6 py-7 sm:px-8">
          <div className="flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="research-kicker mb-3">Explore Public Projects</div>
              <h1
                className="text-[clamp(2rem,4vw,3.3rem)] font-semibold leading-[1.06] text-[var(--paper-foreground)]"
                style={{ fontFamily: "var(--font-ui-display)" }}
              >
                进入虚拟课题组后，先直接看到现有课题
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--glass-text-muted)]">
                这里统一列出已有课题的名称、简介、组长和成员。看完现有方向后，如果没有合适的，就直接新建课题。
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:w-[28rem]">
              <div className="research-metric rounded-[1.45rem] p-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--glass-text-muted)]">
                  当前结果
                </p>
                <p className="mt-2 text-3xl font-semibold text-[var(--paper-foreground)]">{projects.length}</p>
              </div>
              <div className="research-metric rounded-[1.45rem] p-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--glass-text-muted)]">
                  招募中
                </p>
                <p className="mt-2 text-3xl font-semibold text-[var(--paper-foreground)]">{recruitingCount}</p>
              </div>
              <div className="research-metric rounded-[1.45rem] p-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--glass-text-muted)]">
                  当前模式
                </p>
                <p className="mt-2 text-lg font-semibold text-[var(--paper-foreground)]">
                  {searchQuery || recruitingOnly ? "已筛选" : "全部浏览"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="research-panel mb-6 rounded-[1.8rem] p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 flex-1">
              <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-[var(--glass-text-muted)]">
                搜索课题
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--glass-text-muted)]" />
                <input
                  type="text"
                  placeholder="输入研究方向、方法或课题关键词"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="research-input w-full rounded-[1.15rem] px-12 py-3 text-sm"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="research-chip inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={recruitingOnly}
                  onChange={(e) => setRecruitingOnly(e.target.checked)}
                  className="h-4 w-4 rounded"
                />
                仅看招募中
              </label>
              <span className="research-chip inline-flex rounded-full px-4 py-2 text-sm font-medium">
                共 {projects.length} 条结果
              </span>
            </div>
          </div>
        </section>

        {isSystemHealthy && !authLoading && !isAuthenticated && (
          <section className="research-panel-soft mb-6 flex flex-col gap-4 rounded-[1.55rem] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="research-chip flex h-10 w-10 items-center justify-center rounded-2xl">
                <AlertCircle className="h-4 w-4 text-[var(--paper-link)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--paper-foreground)]">未登录时也可以先浏览现有课题</p>
                <p className="mt-1 text-sm leading-6 text-[var(--glass-text-muted)]">
                  想加入课题或新建课题时，再登录即可。
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => openDialog("login")}
                className="glass-button glass-button-primary inline-flex items-center justify-center gap-2 self-start rounded-full px-4 py-2 text-sm font-semibold text-white sm:self-auto"
              >
                <LogIn className="h-4 w-4" />
                登录后申请
              </button>
              <button
                onClick={() => openDialog("login")}
                className="glass-button inline-flex items-center justify-center gap-2 self-start rounded-full px-4 py-2 text-sm font-medium sm:self-auto"
              >
                <Plus className="h-4 w-4 text-[var(--paper-link)]" />
                登录后新建
              </button>
            </div>
          </section>
        )}

        {!isSystemHealthy && !isLoading && (
          <div
            className="mb-8 rounded-[1.55rem] p-4"
            style={{
              border: "1px solid color-mix(in srgb, #d7994c 28%, var(--glass-stroke))",
              background: "color-mix(in srgb, #d7994c 10%, transparent)",
              color: "#a45a13",
            }}
          >
            <p className="text-sm font-medium">研究服务暂时不可用，当前无法加载课题列表或新建课题。</p>
          </div>
        )}

        {isLoading && (
          <div className="research-panel-soft flex flex-col items-center justify-center rounded-[1.75rem] py-16">
            <Loader2 className="h-7 w-7 animate-spin text-[var(--paper-accent)]" />
            <p className="mt-4 text-sm text-[var(--glass-text-muted)]">正在检索公开课题…</p>
          </div>
        )}

        {error && !isLoading && (
          <div
            className="mb-8 rounded-[1.55rem] p-4"
            style={{
              border: "1px solid color-mix(in srgb, #d95b5b 28%, var(--glass-stroke))",
              background: "color-mix(in srgb, #d95b5b 10%, transparent)",
              color: "#b33d3d",
            }}
          >
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {!isLoading && !error && projects.length > 0 && (
          <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {projects.map((project) => (
              <article
                key={project.id}
                className="research-panel rounded-[1.7rem] p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--glass-shadow-strong)]"
              >
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

                <div className="mt-4 space-y-3">
                  <div className="research-panel-soft rounded-[1.2rem] px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-[var(--glass-text-muted)]">简介</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--paper-foreground)]">
                      {project.description_zh || "暂无课题简介。"}
                    </p>
                  </div>
                  <div className="research-panel-soft rounded-[1.2rem] px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-[var(--glass-text-muted)]">组长</p>
                    <p className="mt-2 text-sm font-semibold text-[var(--paper-foreground)]">
                      {project.owner_username || "暂未署名"}
                    </p>
                  </div>
                  <div className="research-panel-soft rounded-[1.2rem] px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs uppercase tracking-[0.16em] text-[var(--glass-text-muted)]">成员</p>
                      <span className="research-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs">
                        <Users className="h-3.5 w-3.5" />
                        {project.member_count}
                        {project.max_members && ` / ${project.max_members}`} 人
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[var(--paper-foreground)]">
                      {getMemberSummary(project)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
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
                      {project.require_approval ? "申请加入" : "立即加入"}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </section>
        )}

        {!isLoading && !error && projects.length === 0 && (
          <div className="research-panel-soft flex flex-col items-center justify-center rounded-[1.8rem] py-16 text-center">
            <div className="research-chip flex h-16 w-16 items-center justify-center rounded-[1.8rem]">
              <FlaskConical className="h-8 w-8 text-[var(--glass-text-muted)]" />
            </div>
            <h3
              className="mt-5 text-xl font-semibold text-[var(--paper-foreground)]"
              style={{ fontFamily: "var(--font-ui-display)" }}
            >
              没有找到合适的课题
            </h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-[var(--glass-text-muted)]">
              {searchQuery || recruitingOnly
                ? "换一个关键词，或者取消筛选再试一次。"
                : "当前还没有公开课题，稍后再回来看看。"}
            </p>
            <button
              onClick={handleCreateProject}
              disabled={!isSystemHealthy}
              className="glass-button glass-button-primary mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              新建课题
            </button>
          </div>
        )}

        {!isLoading && !error && projects.length > 0 && (
          <section className="research-panel mt-6 rounded-[1.8rem] p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="research-kicker mb-2">Create Project</div>
                <h2
                  className="text-xl font-semibold text-[var(--paper-foreground)]"
                  style={{ fontFamily: "var(--font-ui-display)" }}
                >
                  现有课题不匹配时，直接新建一个
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--glass-text-muted)]">
                  看完现有课题后，如果没有匹配方向，就直接从这里发起新的课题。
                </p>
              </div>
              <button
                onClick={handleCreateProject}
                disabled={!isSystemHealthy}
                className="glass-button glass-button-primary inline-flex items-center justify-center gap-2 self-start rounded-full px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
              >
                <Plus className="h-4 w-4" />
                新建课题
              </button>
            </div>
          </section>
        )}
      </main>

      <CreateProjectWizard
        isOpen={isCreateWizardOpen}
        onClose={() => setIsCreateWizardOpen(false)}
      />

      <ProjectApplicationForm
        isOpen={isApplicationFormOpen}
        onClose={() => setIsApplicationFormOpen(false)}
        project={selectedProject}
        onSuccess={handleApplicationSuccess}
      />
    </div>
  );
}
