/**
 * Lab Page - Virtual Research Projects
 * 虚拟课题 - 学生进行中的研究项目
 *
 * Features:
 * - 进行中的课题 - Ongoing student research projects
 * - 讨论区 - Discussion area for collaboration
 * - 未公开作品 - Private works not yet published
 */

import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/utils/classNames";
import { PersistentHeader } from "@/components/shared";
import { WorksGrid } from "@/feature/gallery";
import { getPrivateWorks } from "@/data/gallery";
import { FlaskConical, Lock, MessageSquare, ArrowRight } from "lucide-react";

export function ExperimentsPage() {
  const { t } = useTranslation();
  const { theme } = useTheme();

  // Get private works (in-progress projects)
  const works = getPrivateWorks();

  return (
    <div
      className={cn(
        "min-h-screen",
        theme === "dark"
          ? "bg-gradient-to-br from-[#0a0a1a] via-[#1a1a3a] to-[#0a0a2a]"
          : "bg-gradient-to-br from-[#fff5eb] via-[#fef3e2] to-[#fff5eb]"
      )}
    >
      {/* Header with Persistent Logo */}
      <PersistentHeader
        moduleKey="creativeLab"
        moduleNameKey={t("page.lab.title")}
        variant="glass"
        className={cn("sticky top-0 z-40", theme === "dark" ? "bg-slate-900/80" : "bg-white/80")}
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div
              className={cn(
                "p-3 rounded-xl",
                theme === "dark"
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-amber-100 text-amber-600"
              )}
            >
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <h1
                className={cn(
                  "text-3xl font-bold",
                  theme === "dark" ? "text-white" : "text-gray-900"
                )}
              >
                {t("lab.title")}
              </h1>
            </div>
          </div>

          <p className={cn("text-lg mb-4", theme === "dark" ? "text-gray-400" : "text-gray-600")}>
            {t("lab.description")}
          </p>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div
              className={cn(
                "p-4 rounded-xl border-2",
                theme === "dark"
                  ? "bg-slate-800/50 border-slate-700"
                  : "bg-white border-gray-200"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-5 h-5 text-amber-500" />
                <span
                  className={cn(
                    "font-semibold",
                    theme === "dark" ? "text-white" : "text-gray-900"
                  )}
                >
                  {t("lab.features.private.title")}
                </span>
              </div>
              <p className={cn("text-sm", theme === "dark" ? "text-gray-400" : "text-gray-600")}>
                {t("lab.features.private.description")}
              </p>
            </div>

            <div
              className={cn(
                "p-4 rounded-xl border-2",
                theme === "dark"
                  ? "bg-slate-800/50 border-slate-700"
                  : "bg-white border-gray-200"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-5 h-5 text-purple-500" />
                <span
                  className={cn(
                    "font-semibold",
                    theme === "dark" ? "text-white" : "text-gray-900"
                  )}
                >
                  {t("lab.features.discussion.title")}
                </span>
              </div>
              <p className={cn("text-sm", theme === "dark" ? "text-gray-400" : "text-gray-600")}>
                {t("lab.features.discussion.description")}
              </p>
            </div>

            <div
              className={cn(
                "p-4 rounded-xl border-2",
                theme === "dark"
                  ? "bg-slate-800/50 border-slate-700"
                  : "bg-white border-gray-200"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <FlaskConical className="w-5 h-5 text-blue-500" />
                <span
                  className={cn(
                    "font-semibold",
                    theme === "dark" ? "text-white" : "text-gray-900"
                  )}
                >
                  {t("lab.features.progress.title")}
                </span>
              </div>
              <p className={cn("text-sm", theme === "dark" ? "text-gray-400" : "text-gray-600")}>
                {t("lab.features.progress.description")}
              </p>
            </div>
          </div>
        </div>

        {/* Works Section */}
        <div>
          <h2
            className={cn(
              "text-xl font-semibold mb-4",
              theme === "dark" ? "text-white" : "text-gray-900"
            )}
          >
            {t("lab.projectsSection")}
          </h2>

          {/* Works Grid with CTA */}
          <WorksGrid
            works={works}
            emptyMessage={t("lab.noProjects")}
            emptyHint={t("lab.noProjectsHint")}
            from="lab"
            showCta={works.length === 0}
            cta={{
              title: "虚拟课题组系统",
              description: "使用知识图谱管理您的研究项目，创建问题节点、设计实验、连接文献并得出结论",
              buttonText: "进入研究系统",
              onButtonClick: () => {
                window.location.href = "/lab/projects";
              },
            }}
          />
        </div>

        {/* Research System Link Card */}
        <div className="mt-8">
          <Link
            to="/lab/projects"
            className={cn(
              "block p-6 rounded-xl border-2 transition-all hover:shadow-lg",
              theme === "dark"
                ? "bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-purple-700/50 hover:border-purple-500"
                : "bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 hover:border-purple-400"
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3
                  className={cn(
                    "text-xl font-bold mb-2 flex items-center gap-2",
                    theme === "dark" ? "text-white" : "text-gray-900"
                  )}
                >
                  <FlaskConical className="w-6 h-6 text-purple-400" />
                  虚拟课题组系统
                </h3>
                <p
                  className={cn(
                    "text-sm max-w-md",
                    theme === "dark" ? "text-gray-300" : "text-gray-600"
                  )}
                >
                  使用知识图谱可视化工具，构建您的研究网络。创建问题节点、设计实验、连接文献并得出结论。
                </p>
              </div>
              <ArrowRight
                className={cn(
                  "w-8 h-8 transition-transform group-hover:translate-x-1",
                  theme === "dark" ? "text-purple-400" : "text-purple-600"
                )}
              />
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}

export default ExperimentsPage;
