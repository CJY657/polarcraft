/**
 * Public Project Explore Page
 * 公开课题浏览页面
 */

import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  BookOpenText,
  ChevronDown,
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
import { formatUserIdentity } from "@/lib/identity";
import { cn } from "@/utils/classNames";
import {
  PROJECT_DISPLAY_MODE_OPTIONS,
  sortPublicProjectsByDisplayMode,
  type ProjectDisplayMode,
} from "../components/project/projectDisplayModes";
import { ProjectCoverImage } from "../components/shared/ProjectCoverImage";
import { ProjectChallengePreview } from "../components/project/ProjectChallengeCards";
import { ResearchGroupGuideDialog } from "../components/project/ResearchGroupGuideDialog";
import { useAuthDialogStore } from "@/stores/authDialogStore";

const CreateProjectWizard = lazy(() =>
  import("../components/project/CreateProjectWizard").then((module) => ({ default: module.CreateProjectWizard }))
);
const ProjectApplicationForm = lazy(() =>
  import("../components/project/ProjectApplicationForm").then((module) => ({ default: module.ProjectApplicationForm }))
);

/** 每页加载的课题数量；返回数量等于页大小时认为可能还有下一页 */
const EXPLORE_PAGE_SIZE = 24;

function getApplyButtonLabel(project: PublicProject) {
  if (project.has_pending_application) return "待审核";
  if (project.is_recruiting === false) return "招募已停止";
  return project.require_approval ? "申请加入" : "立即加入";
}

export function PublicProjectExplorePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isSystemHealthy } = useSystem();
  const openDialog = useAuthDialogStore((state) => state.openDialog);

  const [projects, setProjects] = useState<PublicProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recruitingOnly, setRecruitingOnly] = useState(false);
  const [reviewPendingOnly, setReviewPendingOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [displayMode, setDisplayMode] = useState<ProjectDisplayMode>("recommended");
  const [selectedProject, setSelectedProject] = useState<PublicProject | null>(null);
  const [isApplicationFormOpen, setIsApplicationFormOpen] = useState(false);
  const [isCreateWizardOpen, setIsCreateWizardOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const baseFilters = useMemo(
    () => ({
      recruiting: recruitingOnly || undefined,
      search: searchQuery || undefined,
      status: reviewPendingOnly ? ("review_pending" as const) : undefined,
    }),
    [recruitingOnly, reviewPendingOnly, searchQuery]
  );

  useEffect(() => {
    let shouldIgnoreResult = false;

    async function fetchProjects() {
      if (!isSystemHealthy) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await profileApi.getPublicProjects({
          ...baseFilters,
          limit: EXPLORE_PAGE_SIZE,
        });
        if (!shouldIgnoreResult) {
          setProjects(data);
          setHasMore(data.length === EXPLORE_PAGE_SIZE);
        }
      } catch (err) {
        console.error("Failed to fetch public projects:", err);
        if (!shouldIgnoreResult) {
          setError(err instanceof Error ? err.message : "加载课题失败");
        }
      } finally {
        if (!shouldIgnoreResult) {
          setIsLoading(false);
        }
      }
    }

    if (searchQuery) {
      const timer = window.setTimeout(() => void fetchProjects(), 300);
      return () => {
        shouldIgnoreResult = true;
        window.clearTimeout(timer);
      };
    }

    void fetchProjects();
    return () => {
      shouldIgnoreResult = true;
    };
  }, [baseFilters, searchQuery, isSystemHealthy]);

  const handleLoadMore = async () => {
    if (isLoadingMore || isLoading) {
      return;
    }

    setIsLoadingMore(true);
    try {
      const data = await profileApi.getPublicProjects({
        ...baseFilters,
        limit: EXPLORE_PAGE_SIZE,
        offset: projects.length,
      });
      setProjects((prev) => {
        const loadedIds = new Set(prev.map((project) => project.id));
        return [...prev, ...data.filter((project) => !loadedIds.has(project.id))];
      });
      setHasMore(data.length === EXPLORE_PAGE_SIZE);
    } catch (err) {
      console.error("Failed to load more public projects:", err);
      setError(err instanceof Error ? err.message : "加载课题失败");
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleApplyClick = (project: PublicProject) => {
    if (project.has_pending_application) {
      return;
    }
    if (!isAuthenticated) {
      openDialog("login");
      return;
    }
    if (project.is_recruiting === false) {
      setSelectedProject(project);
      setIsApplicationFormOpen(true);
      return;
    }
    setSelectedProject(project);
    setIsApplicationFormOpen(true);
  };

  const handleApplicationSuccess = async () => {
    setIsApplicationFormOpen(false);

    try {
      // 重新拉取当前已加载的范围，保持列表长度并刷新申请状态标记
      const requestLimit = Math.min(Math.max(projects.length, EXPLORE_PAGE_SIZE), 100);
      const data = await profileApi.getPublicProjects({
        ...baseFilters,
        limit: requestLimit,
      });
      setProjects(data);
      setHasMore(data.length === requestLimit);
    } catch (err) {
      console.error("Failed to refresh public projects:", err);
    }
  };

  const recruitingCount = useMemo(
    () => projects.filter((project) => project.is_recruiting).length,
    [projects]
  );

  const displayedProjects = useMemo(
    () => sortPublicProjectsByDisplayMode(projects, displayMode),
    [projects, displayMode]
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
      .map((member) => formatUserIdentity(member, ""))
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
        variant="glass"
        showBreadcrumb={false}
        className="sticky top-0 z-40"
      />

      <main className="research-shell py-6 md:py-8">
        <section className="research-panel relative mb-6 flex flex-col gap-4 overflow-hidden rounded-[1.75rem] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--paper-accent-soft)]/20 to-transparent pointer-events-none"></div>
          
          <div className="relative flex items-center gap-4">
            <div className="research-chip flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
              <Search className="h-5 w-5 text-[var(--paper-link)]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-semibold text-[var(--paper-foreground)]" style={{ fontFamily: "var(--font-ui-display)", letterSpacing: "-0.015em" }}>
                  公开课题
                </h1>
                <button
                  type="button"
                  onClick={() => setIsGuideOpen(true)}
                  className={cn(
                    "group relative inline-flex h-8 items-center gap-1.5 rounded-full px-2 pr-2.5 text-xs font-semibold",
                    "bg-clay-pink text-white",
                    "transition-transform hover:-translate-y-0.5",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-pink/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper-bg)]"
                  )}
                  aria-label="打开研究小组指南 Research Group Guide"
                  title="研究小组指南"
                >
                  <span
                    className="flex h-5 w-5 items-center justify-center rounded-xl bg-white/15 text-white"
                    aria-hidden="true"
                  >
                    <BookOpenText className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </span>
                  <span className="hidden sm:inline">研究小组指南</span>
                  <span
                    className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-clay-ochre ring-2 ring-[var(--paper-bg)]"
                    aria-hidden="true"
                  />
                </button>
              </div>
              <div className="mt-1 flex items-center gap-2.5 text-xs font-medium text-[var(--glass-text-muted)]">
                <span className="uppercase tracking-[0.1em]">Explore Public Projects</span>
                <span className="hidden h-3 w-px bg-[var(--glass-stroke)] sm:block"></span>
                <span className="hidden sm:inline">共 {projects.length} 课题</span>
                <span className="hidden h-3 w-px bg-[var(--glass-stroke)] sm:block"></span>
                <span className="hidden text-[var(--paper-accent-strong)] sm:inline">{recruitingCount} 招募中</span>
              </div>
            </div>
          </div>
          
          <div className="relative flex shrink-0 items-center gap-2.5">
            <Link
              to="/lab/projects"
              className="glass-button inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all hover:-translate-y-0.5"
            >
              <Users className="h-4 w-4 text-[var(--paper-link)]" />
              我的课题
            </Link>
            <button
              onClick={handleCreateProject}
              disabled={!isSystemHealthy}
              className="glass-button glass-button-primary inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              <Plus className="h-4 w-4" />
              新建课题
            </button>
          </div>
        </section>

        <section className="research-panel mb-6 rounded-[1.8rem] p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 flex-1">
              <label className="mb-2 block text-sm font-medium uppercase tracking-[0.18em] text-[var(--glass-text-muted)]">
                搜索课题
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--glass-text-muted)]" />
                <input
                  type="text"
                  placeholder="输入研究方向、方法或课题关键词"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="research-input w-full rounded-[1.15rem] px-12 py-3 text-base"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 text-base font-medium text-[var(--paper-foreground)]">
                <span className="text-sm uppercase tracking-[0.16em] text-[var(--glass-text-muted)]">排序方式</span>
                <select
                  value={displayMode}
                  onChange={(e) => setDisplayMode(e.target.value as ProjectDisplayMode)}
                  className="research-input rounded-full px-4 py-2 text-base"
                >
                  {PROJECT_DISPLAY_MODE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="research-chip inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-base font-medium">
                <input
                  type="checkbox"
                  checked={recruitingOnly}
                  onChange={(e) => setRecruitingOnly(e.target.checked)}
                  className="h-4 w-4 rounded"
                />
                仅看招募中
              </label>
              <label className="research-chip inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-base font-medium">
                <input
                  type="checkbox"
                  checked={reviewPendingOnly}
                  onChange={(e) => setReviewPendingOnly(e.target.checked)}
                  className="h-4 w-4 rounded"
                />
                仅看待评审
              </label>
              <span className="research-chip inline-flex rounded-full px-4 py-2 text-base font-medium">
                {hasMore ? `已加载 ${projects.length} 条` : `共 ${projects.length} 条结果`}
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
                <p className="text-base font-semibold text-[var(--paper-foreground)]">未登录时也可以先浏览现有课题</p>
                <p className="mt-1 text-base leading-6 text-[var(--glass-text-muted)]">
                  想加入课题或新建课题时，再登录即可。
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => openDialog("login")}
                className="glass-button glass-button-primary inline-flex items-center justify-center gap-2 self-start rounded-full px-4 py-2 text-base font-semibold text-white sm:self-auto"
              >
                <LogIn className="h-4 w-4" />
                登录后申请
              </button>
              <button
                onClick={() => openDialog("login")}
                className="glass-button inline-flex items-center justify-center gap-2 self-start rounded-full px-4 py-2 text-base font-medium sm:self-auto"
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
            <p className="text-base font-medium">研究服务暂时不可用，当前无法加载课题列表或新建课题。</p>
          </div>
        )}

        {isLoading && (
          <div className="research-panel-soft flex flex-col items-center justify-center rounded-[1.75rem] py-16">
            <Loader2 className="h-7 w-7 animate-spin text-[var(--paper-accent)]" />
            <p className="mt-4 text-base text-[var(--glass-text-muted)]">正在检索公开课题…</p>
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
            <p className="text-base font-medium">{error}</p>
          </div>
        )}

        {!isLoading && !error && displayedProjects.length > 0 && (
          <section className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {displayedProjects.map((project) => (
              <article
                key={project.id}
                className="group/card research-panel relative flex flex-col overflow-hidden rounded-[1.7rem] p-5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-[var(--paper-accent)]/10 bg-gradient-to-br from-transparent to-[var(--glass-surface)]/40 border border-transparent hover:border-[var(--glass-stroke)]"
              >
                <div className="mb-5 aspect-[16/9] w-full overflow-hidden rounded-[1.25rem] ring-1 ring-black/5 dark:ring-white/10">
                  <ProjectCoverImage
                    src={project.thumbnail || project.cover_image}
                    alt={project.name_zh}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover/card:scale-105"
                  />
                </div>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h2
                      className="text-[1.35rem] font-semibold leading-tight text-[var(--paper-foreground)]"
                      style={{ fontFamily: "var(--font-ui-display)" }}
                    >
                      {project.name_zh}
                    </h2>
                  </div>
                  <div className="research-chip flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-sm transition-all duration-300 group-hover/card:-translate-y-0.5 group-hover/card:rotate-6 group-hover/card:bg-[var(--paper-accent)] group-hover/card:text-white">
                    <FlaskConical className="h-5 w-5 text-[var(--paper-link)] transition-colors group-hover/card:text-white" />
                  </div>
                </div>

                <div className="mt-4 flex flex-1 flex-col space-y-3">
                  <ProjectChallengePreview project={project} />

                  <div className="research-panel-soft mt-auto rounded-[1.2rem] px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-[var(--glass-text-muted)]">组长与成员</p>
                      <span className="research-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm">
                        <Users className="h-3.5 w-3.5" />
                        {project.member_count}
                        {project.max_members && ` / ${project.max_members}`} 人
                      </span>
                    </div>
                    <p className="mt-2 text-base font-semibold text-[var(--paper-foreground)]">
                      {formatUserIdentity({
                        username: project.owner_username,
                        nickname: project.owner_nickname,
                        real_name: project.owner_real_name,
                        show_real_name_publicly: project.owner_show_real_name_publicly,
                      }, "暂未署名")}
                    </p>
                    <p className="mt-1 text-base leading-6 text-[var(--glass-text-muted)]">
                      {getMemberSummary(project)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <Link
                    to={`/lab/projects/${project.id}`}
                    state={{ readOnly: !project.is_member }}
                    className="glass-button inline-flex flex-1 items-center justify-center rounded-full px-4 py-2 text-base font-medium shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    {project.is_member ? "进入课题" : "查看详情"}
                  </Link>

                  {!project.is_member && (
                    <button
                      onClick={() => handleApplyClick(project)}
                      disabled={project.has_pending_application}
                      className={cn(
                        "glass-button inline-flex flex-1 items-center justify-center rounded-full px-4 py-2 text-base font-semibold shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0",
                        project.is_recruiting === false && !project.has_pending_application
                          ? "border-[#f59e0b]/50 bg-[#f59e0b]/15 text-[#78350f] hover:border-[#f59e0b]/70 dark:text-[#fef3c7]"
                          : "glass-button-primary text-white"
                      )}
                    >
                      {getApplyButtonLabel(project)}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </section>
        )}

        {!isLoading && !error && hasMore && displayedProjects.length > 0 && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => void handleLoadMore()}
              disabled={isLoadingMore}
              className="glass-button inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-base font-medium transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {isLoadingMore ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ChevronDown className="h-4 w-4 text-[var(--paper-link)]" />
              )}
              {isLoadingMore ? "正在加载…" : "加载更多课题"}
            </button>
          </div>
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
            <p className="mt-2 max-w-md text-base leading-6 text-[var(--glass-text-muted)]">
              {searchQuery || recruitingOnly || reviewPendingOnly
                ? "换一个关键词，或者取消筛选再试一次。"
                : "当前还没有公开课题，稍后再回来看看。"}
            </p>
            <button
              onClick={handleCreateProject}
              disabled={!isSystemHealthy}
              className="glass-button glass-button-primary mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
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
                <h2
                  className="text-xl font-semibold text-[var(--paper-foreground)]"
                  style={{ fontFamily: "var(--font-ui-display)" }}
                >
                  现有课题不匹配时，直接新建一个
                </h2>
                <p className="mt-2 max-w-2xl text-base leading-6 text-[var(--glass-text-muted)]">
                  看完现有课题后，如果没有匹配方向，就直接从这里发起新的课题。
                </p>
              </div>
              <button
                onClick={handleCreateProject}
                disabled={!isSystemHealthy}
                className="glass-button glass-button-primary inline-flex items-center justify-center gap-2 self-start rounded-full px-5 py-2.5 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
              >
                <Plus className="h-4 w-4" />
                新建课题
              </button>
            </div>
          </section>
        )}
      </main>

      <ResearchGroupGuideDialog
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      <Suspense fallback={null}>
        {isCreateWizardOpen && (
          <CreateProjectWizard
            isOpen={isCreateWizardOpen}
            onClose={() => setIsCreateWizardOpen(false)}
          />
        )}

        {isApplicationFormOpen && (
          <ProjectApplicationForm
            isOpen={isApplicationFormOpen}
            onClose={() => setIsApplicationFormOpen(false)}
            project={selectedProject}
            onSuccess={handleApplicationSuccess}
          />
        )}
      </Suspense>
    </div>
  );
}
