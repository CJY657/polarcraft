/**
 * Project List Component
 * 项目列表组件
 *
 * Displays user's research projects and example projects
 * 显示用户的研究项目和示例项目
 */

import { Link } from "react-router-dom";
import { Plus, FlaskConical, BookOpen, ArrowRight } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/utils/classNames";
import { EXAMPLE_PROJECTS } from "@/data/researchExampleProjects";
import { PersistentHeader } from "@/components/shared";

export function ProjectList() {
  const { theme } = useTheme();

  return (
    <div
      className={cn(
        "min-h-screen",
        theme === "dark"
          ? "bg-gradient-to-br from-[#0a0a1a] via-[#1a1a3a] to-[#0a0a2a]"
          : "bg-gradient-to-br from-[#fff5eb] via-[#fef3e2] to-[#fff5eb]"
      )}
    >
      <PersistentHeader
        moduleKey="labGroup"
        moduleNameKey="虚拟课题组"
        variant="glass"
        className={cn("sticky top-0 z-40", theme === "dark" ? "bg-slate-900/80" : "bg-white/80")}
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-3 rounded-xl",
                theme === "dark"
                  ? "bg-purple-500/20 text-purple-400"
                  : "bg-purple-100 text-purple-600"
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
                我的研究项目
              </h1>
              <p
                className={cn(
                  "text-sm",
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                )}
              >
                管理和创建虚拟课题组项目
              </p>
            </div>
          </div>

          <Link
            to="/lab/projects/new"
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
              theme === "dark"
                ? "bg-purple-600 hover:bg-purple-500 text-white"
                : "bg-purple-500 hover:bg-purple-600 text-white"
            )}
          >
            <Plus className="w-4 h-4" />
            新建项目
          </Link>
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center py-16">
          <div
            className={cn(
              "w-24 h-24 rounded-full flex items-center justify-center mb-4",
              theme === "dark"
                ? "bg-slate-800/50 border-2 border-dashed border-slate-700"
                : "bg-gray-100 border-2 border-dashed border-gray-300"
            )}
          >
            <FlaskConical
              className={cn(
                "w-12 h-12",
                theme === "dark" ? "text-slate-600" : "text-gray-400"
              )}
            />
          </div>
          <h3
            className={cn(
              "text-xl font-semibold mb-2",
              theme === "dark" ? "text-white" : "text-gray-900"
            )}
          >
            还没有研究项目
          </h3>
          <p
            className={cn(
              "text-sm mb-6 text-center max-w-md",
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            )}
          >
            创建您的第一个虚拟课题组项目，开始探索偏振光学的奥秘
          </p>
          <Link
            to="/lab/projects/new"
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors",
              theme === "dark"
                ? "bg-purple-600 hover:bg-purple-500 text-white"
                : "bg-purple-500 hover:bg-purple-600 text-white"
            )}
          >
            <Plus className="w-5 h-5" />
            创建项目
          </Link>
        </div>

        {/* Example Projects Section */}
        <div className="mt-16">
          <div className="flex items-center gap-3 mb-6">
            <div
              className={cn(
                "p-2 rounded-lg",
                theme === "dark"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "bg-cyan-100 text-cyan-600"
              )}
            >
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2
                className={cn(
                  "text-xl font-semibold",
                  theme === "dark" ? "text-white" : "text-gray-900"
                )}
              >
                示例项目
              </h2>
              <p
                className={cn(
                  "text-sm",
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                )}
              >
                探索这些已完成的研究项目，了解虚拟课题组的使用方法
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {EXAMPLE_PROJECTS.map((project) => (
              <Link
                key={project.id}
                to={`/lab/projects/example-${project.id}`}
                className={cn(
                  "group relative overflow-hidden rounded-xl border-2 transition-all hover:shadow-xl",
                  theme === "dark"
                    ? "bg-slate-800 border-slate-700 hover:border-purple-500"
                    : "bg-white border-gray-200 hover:border-purple-400"
                )}
              >
                {/* Cover Image */}
                {project.coverImage && (
                  <div className="aspect-video w-full overflow-hidden bg-gradient-to-br from-purple-500/20 to-cyan-500/20">
                    <img
                      src={project.coverImage}
                      alt={project.title['zh-CN']}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%234a5568"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="12" font-family="sans-serif"%3ENo Image%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  </div>
                )}

                {/* Content */}
                <div className="p-4">
                  <h3
                    className={cn(
                      "font-semibold mb-2 line-clamp-2 group-hover:text-purple-400 transition-colors",
                      theme === "dark" ? "text-white" : "text-gray-900"
                    )}
                  >
                    {project.title['zh-CN']}
                  </h3>
                  <p
                    className={cn(
                      "text-sm line-clamp-3 mb-4",
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    )}
                  >
                    {project.description['zh-CN']}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs">
                    <div
                      className={cn(
                        "flex items-center gap-1",
                        theme === "dark" ? "text-gray-500" : "text-gray-400"
                      )}
                    >
                      <span>{project.nodes.length} 个节点</span>
                      <span>•</span>
                      <span>{project.edges.length} 条关系</span>
                    </div>
                    <div
                      className={cn(
                        "flex items-center gap-1 font-medium transition-colors",
                        theme === "dark"
                          ? "text-purple-400 group-hover:text-purple-300"
                          : "text-purple-600 group-hover:text-purple-500"
                      )}
                    >
                      查看详情
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
