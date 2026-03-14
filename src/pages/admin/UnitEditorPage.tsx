/**
 * Unit Editor Page
 * 单元编辑页面
 *
 * Tabbed interface for editing unit details, * 带标签页的界面， 用于编辑单元详情
 */

import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/utils/classNames";
import { useUnitAdminStore } from "@/stores/unitAdminStore";
import { useCourseAdminStore } from "@/stores/courseAdminStore";
import { UnitFormDialog } from "@/feature/admin/components/UnitFormDialog";
import {
  ArrowLeft,
  Settings,
  BookOpen,
  Save,
  Plus,
  Edit,
  Loader2,
  Trash2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

type TabId = "settings" | "experiments";

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "settings", label: "设置", icon: <Settings className="w-4 h-4" /> },
  { id: "experiments", label: "实验", icon: <BookOpen className="w-4 h-4" /> },
];

export default function UnitEditorPage() {
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { theme } = useTheme();
  const { currentUnit, isLoading, error, fetchUnit, clearError } = useUnitAdminStore();

  const [activeTab, setActiveTab] = useState<TabId>("settings");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    if (unitId) {
      fetchUnit(unitId);
    }
  }, [unitId, fetchUnit]);

  useEffect(() => {
    const requestedTab = searchParams.get("tab");
    if (
      requestedTab === "settings" ||
      requestedTab === "experiments" ||
      requestedTab === "courses"
    ) {
      setActiveTab(requestedTab === "courses" ? "experiments" : requestedTab);
    }
  }, [searchParams]);

  if (isLoading && !currentUnit) {
    return (
      <div
        className={cn(
          "min-h-screen flex items-center justify-center",
          theme === "dark" ? "bg-slate-900" : "bg-gray-50",
        )}
      >
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-cyan-400 text-sm">加载单元中...</span>
        </div>
      </div>
    );
  }

  if (!currentUnit && !isLoading) {
    return (
      <div
        className={cn(
          "min-h-screen flex items-center justify-center",
          theme === "dark" ? "bg-slate-900" : "bg-gray-50",
        )}
      >
        <div className="text-center">
          <h2
            className={cn(
              "text-xl font-semibold mb-2",
              theme === "dark" ? "text-white" : "text-gray-900",
            )}
          >
            单元未找到
          </h2>
          <p className={cn("mb-4", theme === "dark" ? "text-gray-400" : "text-gray-600")}>
            您查找的单元不存在。
          </p>
          <button
            onClick={() => navigate("/admin/units")}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm transition-colors"
          >
            返回单元列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen", theme === "dark" ? "bg-slate-900" : "bg-gray-50")}>
      {/* Header */}
      <div
        className={cn(
          "border-b",
          theme === "dark" ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200",
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/admin/units")}
                className={cn(
                  "transition-colors",
                  theme === "dark"
                    ? "text-gray-400 hover:text-white"
                    : "text-gray-600 hover:text-gray-900",
                )}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1
                  className={cn(
                    "text-xl font-semibold",
                    theme === "dark" ? "text-white" : "text-gray-900",
                  )}
                >
                  {currentUnit?.title?.["zh-CN"] || "加载中..."}
                </h1>
              </div>
            </div>
            <button
              onClick={() => setIsEditDialogOpen(true)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm transition-colors",
                theme === "dark"
                  ? "bg-slate-700 hover:bg-slate-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700",
              )}
            >
              编辑详情
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                  activeTab === tab.id
                    ? theme === "dark"
                      ? "text-cyan-400 border-cyan-400"
                      : "text-cyan-600 border-cyan-600"
                    : theme === "dark"
                      ? "text-gray-400 border-transparent hover:text-gray-300"
                      : "text-gray-500 border-transparent hover:text-gray-600",
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div
            className={cn(
              "p-4 rounded-lg flex items-center justify-between",
              theme === "dark"
                ? "bg-red-500/10 border border-red-500/20"
                : "bg-red-50 border border-red-200",
            )}
          >
            <span className={cn(theme === "dark" ? "text-red-400" : "text-red-600")}>{error}</span>
            <button
              onClick={clearError}
              className={cn(
                theme === "dark"
                  ? "text-red-400 hover:text-red-300"
                  : "text-red-600 hover:text-red-500",
              )}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "settings" && currentUnit && (
          <SettingsTab
            unit={currentUnit}
            theme={theme}
          />
        )}
        {activeTab === "experiments" && currentUnit && (
          <ExperimentsTab
            unit={currentUnit}
            theme={theme}
          />
        )}
      </div>

      {/* Edit Dialog */}
      {currentUnit && (
        <UnitFormDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          mode="edit"
          unit={currentUnit}
        />
      )}
    </div>
  );
}

// Settings Tab Component
function SettingsTab({ unit, theme }: { unit: any; theme: string }) {
  if (!unit) return null;

  return (
    <div className="space-y-6">
      {/* Unit Info */}
      <div
        className={cn(
          "rounded-xl p-6 border",
          theme === "dark" ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200 shadow-sm",
        )}
      >
        <h3
          className={cn(
            "text-lg font-semibold mb-4",
            theme === "dark" ? "text-white" : "text-gray-900",
          )}
        >
          单元信息
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className={theme === "dark" ? "text-gray-400" : "text-gray-500"}>主题色:</span>
            <div className="flex items-center gap-2 mt-1">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: unit.color }}
              />
              <span className={theme === "dark" ? "text-white" : "text-gray-900"}>
                {unit.color}
              </span>
            </div>
          </div>
          <div>
            <span className={theme === "dark" ? "text-gray-400" : "text-gray-500"}>
              标题 (中文):
            </span>
            <p className={`${theme === "dark" ? "text-white" : "text-gray-900"} mt-1`}>
              {unit.title?.["zh-CN"]}
            </p>
          </div>
          <div>
            <span className={theme === "dark" ? "text-gray-400" : "text-gray-500"}>
              标题 (英文):
            </span>
            <p className={`${theme === "dark" ? "text-white" : "text-gray-900"} mt-1`}>
              {unit.title?.["en-US"] || "-"}
            </p>
          </div>
          <div className="col-span-2">
            <span className={theme === "dark" ? "text-gray-400" : "text-gray-500"}>
              描述 (中文):
            </span>
            <p className={`${theme === "dark" ? "text-white" : "text-gray-900"} mt-1`}>
              {unit.description?.["zh-CN"] || "-"}
            </p>
          </div>
          <div className="col-span-2">
            <span className={theme === "dark" ? "text-gray-400" : "text-gray-500"}>
              描述 (英文):
            </span>
            <p className={`${theme === "dark" ? "text-white" : "text-gray-900"} mt-1`}>
              {unit.description?.["en-US"] || "-"}
            </p>
          </div>
          {unit.coverImage && (
            <div className="col-span-2">
              <span className={theme === "dark" ? "text-gray-400" : "text-gray-500"}>
                封面图片:
              </span>
              <p
                className={cn("break-all mt-1", theme === "dark" ? "text-white" : "text-gray-900")}
              >
                {unit.coverImage}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div
        className={cn(
          "rounded-xl p-6 border",
          theme === "dark" ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200 shadow-sm",
        )}
      >
        <h3
          className={cn(
            "text-lg font-semibold mb-4",
            theme === "dark" ? "text-white" : "text-gray-900",
          )}
        >
          统计信息
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div
            className={cn(
              "text-center p-4 rounded-lg",
              theme === "dark" ? "bg-slate-700/50" : "bg-gray-50",
            )}
          >
            <p className="text-3xl font-bold text-cyan-400">
              {unit.courses?.length || unit.courseCount || 0}
            </p>
            <p className={cn("text-sm", theme === "dark" ? "text-gray-400" : "text-gray-500")}>
              关联实验
            </p>
          </div>
          <div
            className={cn(
              "text-center p-4 rounded-lg",
              theme === "dark" ? "bg-slate-700/50" : "bg-gray-50",
            )}
          >
            <p className="text-3xl font-bold text-cyan-400">{unit.sortOrder}</p>
            <p className={cn("text-sm", theme === "dark" ? "text-gray-400" : "text-gray-500")}>
              排序
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Experiments Tab Component
function ExperimentsTab({ unit, theme }: { unit: any; theme: string }) {
  const navigate = useNavigate();
  const {
    updateCourse,
    deleteCourse,
    createCourse,
  } = useCourseAdminStore();
  const { fetchUnit } = useUnitAdminStore();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [updatingCourses, setUpdatingCourses] = useState<Set<string>>(new Set());
  const [newCourse, setNewCourse] = useState({
    title_zh: "",
    title_en: "",
    description_zh: "",
    description_en: "",
    color: "#06b6d4",
  });

  if (!unit) return null;

  const currentCourses = unit.courses || [];

  const handleRemoveCourse = async (courseId: string) => {
    if (!confirm("确定要永久删除此实验吗？删除后其主课件、媒体和超链接记录会一并删除，系统也会尝试回收不再被引用的上传文件。")) {
      return;
    }

    setUpdatingCourses((prev) => new Set(prev).add(courseId));
    try {
      await deleteCourse(courseId);
      await fetchUnit(unit.id);
    } catch (error) {
      // Error handled in store
    } finally {
      setUpdatingCourses((prev) => {
        const next = new Set(prev);
        next.delete(courseId);
        return next;
      });
    }
  };

  const handleMoveCourse = async (courseId: string, direction: "up" | "down") => {
    const currentIndex = currentCourses.findIndex((c: any) => c.id === courseId);
    if (currentIndex === -1) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= currentCourses.length) return;

    // Swap courses
    const newOrder = [...currentCourses];
    [newOrder[currentIndex], newOrder[targetIndex]] = [
      newOrder[targetIndex],
      newOrder[currentIndex],
    ];

    setUpdatingCourses((prev) => new Set(prev).add(courseId));
    try {
      // Update sortOrder for both courses
      await Promise.all([
        updateCourse(currentCourses[currentIndex].id, { sortOrder: targetIndex }),
        updateCourse(currentCourses[targetIndex].id, { sortOrder: currentIndex }),
      ]);
      fetchUnit(unit.id);
    } catch (error) {
      // Error handled in store
    } finally {
      setUpdatingCourses((prev) => {
        const next = new Set(prev);
        next.delete(courseId);
        return next;
      });
    }
  };

  const handleCreateCourse = async () => {
    if (!newCourse.title_zh.trim()) return;

    setUpdatingCourses((prev) => new Set(prev).add("new"));
    try {
      await createCourse({
        unitId: unit.id,
        title_zh: newCourse.title_zh,
        title_en: newCourse.title_en || undefined,
        description_zh: newCourse.description_zh || undefined,
        description_en: newCourse.description_en || undefined,
        color: newCourse.color,
      });

      // Reset form and refresh
      setNewCourse({
        title_zh: "",
        title_en: "",
        description_zh: "",
        description_en: "",
        color: "#06b6d4",
      });
      setShowCreateForm(false);
      fetchUnit(unit.id);
    } catch (error) {
      // Error handled in store
    } finally {
      setUpdatingCourses((prev) => {
        const next = new Set(prev);
        next.delete("new");
        return next;
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3
          className={cn(
            "text-lg font-semibold flex items-center gap-2",
            theme === "dark" ? "text-white" : "text-gray-900",
          )}
        >
          <BookOpen className="w-5 h-5" />
          实验 ({currentCourses.length})
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              showCreateForm
                ? "bg-gray-500 text-white"
                : theme === "dark"
                  ? "bg-slate-700 hover:bg-slate-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700",
            )}
          >
            <Plus className="w-4 h-4" />
            新建实验
          </button>
        </div>
      </div>

      {/* Create Course Form */}
      {showCreateForm && (
        <div
          className={cn(
            "rounded-xl p-6 border",
            theme === "dark"
              ? "bg-slate-800 border-slate-700"
              : "bg-white border-gray-200 shadow-sm",
          )}
        >
          <h4
            className={cn(
              "text-md font-semibold mb-4",
              theme === "dark" ? "text-white" : "text-gray-900",
            )}
          >
            创建新实验
          </h4>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  className={cn(
                    "block text-sm font-medium mb-2",
                    theme === "dark" ? "text-gray-300" : "text-gray-700",
                  )}
                >
                  标题 (中文) *
                </label>
                <input
                  type="text"
                  value={newCourse.title_zh}
                  onChange={(e) => setNewCourse({ ...newCourse, title_zh: e.target.value })}
                  placeholder="实验标题"
                  className={cn(
                    "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500",
                    theme === "dark"
                      ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400",
                  )}
                />
              </div>
              <div>
                <label
                  className={cn(
                    "block text-sm font-medium mb-2",
                    theme === "dark" ? "text-gray-300" : "text-gray-700",
                  )}
                >
                  标题 (英文)
                </label>
                <input
                  type="text"
                  value={newCourse.title_en}
                  onChange={(e) => setNewCourse({ ...newCourse, title_en: e.target.value })}
                  placeholder="Experiment Title"
                  className={cn(
                    "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500",
                    theme === "dark"
                      ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400",
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  className={cn(
                    "block text-sm font-medium mb-2",
                    theme === "dark" ? "text-gray-300" : "text-gray-700",
                  )}
                >
                  描述 (中文)
                </label>
                <textarea
                  value={newCourse.description_zh}
                  onChange={(e) => setNewCourse({ ...newCourse, description_zh: e.target.value })}
                  placeholder="实验描述"
                  rows={2}
                  className={cn(
                    "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none",
                    theme === "dark"
                      ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400",
                  )}
                />
              </div>
              <div>
                <label
                  className={cn(
                    "block text-sm font-medium mb-2",
                    theme === "dark" ? "text-gray-300" : "text-gray-700",
                  )}
                >
                  描述 (英文)
                </label>
                <textarea
                  value={newCourse.description_en}
                  onChange={(e) => setNewCourse({ ...newCourse, description_en: e.target.value })}
                  placeholder="Experiment Description"
                  rows={2}
                  className={cn(
                    "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none",
                    theme === "dark"
                      ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400",
                  )}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div>
                <label
                  className={cn(
                    "block text-sm font-medium mb-2",
                    theme === "dark" ? "text-gray-300" : "text-gray-700",
                  )}
                >
                  主题色
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newCourse.color}
                    onChange={(e) => setNewCourse({ ...newCourse, color: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer border-0"
                  />
                  <input
                    type="text"
                    value={newCourse.color}
                    onChange={(e) => setNewCourse({ ...newCourse, color: e.target.value })}
                    className={cn(
                      "px-2 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 w-24 text-sm",
                      theme === "dark"
                        ? "bg-slate-700 border-slate-600 text-white"
                        : "bg-white border-gray-300 text-gray-900",
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleCreateCourse}
                disabled={!newCourse.title_zh.trim() || updatingCourses.has("new")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  newCourse.title_zh.trim() && !updatingCourses.has("new")
                    ? "bg-cyan-500 hover:bg-cyan-600 text-white"
                    : "bg-gray-400 cursor-not-allowed text-white",
                )}
              >
                {updatingCourses.has("new") ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {updatingCourses.has("new") ? "创建中..." : "创建实验"}
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  theme === "dark"
                    ? "bg-slate-700 hover:bg-slate-600 text-gray-300"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700",
                )}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Current Courses List */}
      {currentCourses.length === 0 ? (
        <div
          className={cn(
            "rounded-xl p-8 border text-center",
            theme === "dark"
              ? "bg-slate-800 border-slate-700"
              : "bg-white border-gray-200 shadow-sm",
          )}
        >
          <BookOpen
            className={cn(
              "w-12 h-12 mx-auto mb-4",
              theme === "dark" ? "text-gray-600" : "text-gray-400",
            )}
          />
          <p className={cn("text-lg", theme === "dark" ? "text-gray-400" : "text-gray-600")}>
            暂无实验，点击上方按钮新建
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {currentCourses.map((course: any, index: number) => (
            <div
              key={course.id}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl border transition-all",
                theme === "dark"
                  ? "bg-slate-800 border-slate-700 hover:border-slate-500"
                  : "bg-white border-gray-200 shadow-sm hover:shadow-md",
              )}
            >
              {/* Order Number */}
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0",
                  theme === "dark" ? "bg-slate-700 text-gray-300" : "bg-gray-100 text-gray-600",
                )}
              >
                {index + 1}
              </div>

              {/* Course Cover */}
              <div
                className="w-12 h-12 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center"
                style={{
                  backgroundColor: course.coverImage ? undefined : `${course.color}30`,
                }}
              >
                {course.coverImage ? (
                  <img
                    src={course.coverImage}
                    alt={course.title?.["zh-CN"] || ""}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <BookOpen
                    className="w-6 h-6"
                    style={{ color: course.color }}
                  />
                )}
              </div>

              {/* Course Info */}
              <div className="flex-1 min-w-0">
                <h4
                  className={cn(
                    "font-semibold truncate",
                    theme === "dark" ? "text-white" : "text-gray-900",
                  )}
                >
                  {course.title?.["zh-CN"] || "未命名实验"}
                </h4>
                <p
                  className={cn(
                    "text-sm truncate",
                    theme === "dark" ? "text-gray-400" : "text-gray-600",
                  )}
                >
                  {course.description?.["zh-CN"] || "暂无描述"}
                </p>
              </div>

              {/* Reorder Buttons */}
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => handleMoveCourse(course.id, "up")}
                  disabled={index === 0 || updatingCourses.has(course.id)}
                  className={cn(
                    "p-1 rounded transition-colors",
                    theme === "dark"
                      ? "hover:bg-slate-700 text-gray-400 hover:text-white disabled:opacity-30"
                      : "hover:bg-gray-100 text-gray-500 hover:text-gray-900 disabled:opacity-30",
                  )}
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleMoveCourse(course.id, "down")}
                  disabled={index === currentCourses.length - 1 || updatingCourses.has(course.id)}
                  className={cn(
                    "p-1 rounded transition-colors",
                    theme === "dark"
                      ? "hover:bg-slate-700 text-gray-400 hover:text-white disabled:opacity-30"
                      : "hover:bg-gray-100 text-gray-500 hover:text-gray-900 disabled:opacity-30",
                  )}
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/admin/experiments/${course.id}`)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    theme === "dark"
                      ? "bg-slate-700 hover:bg-slate-600 text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700",
                  )}
                >
                  <Edit className="w-3.5 h-3.5" />
                  编辑
                </button>
                <button
                  onClick={() => handleRemoveCourse(course.id)}
                  disabled={updatingCourses.has(course.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    theme === "dark"
                      ? "bg-red-500/20 hover:bg-red-500/30 text-red-400"
                      : "bg-red-50 hover:bg-red-100 text-red-600",
                    updatingCourses.has(course.id) && "opacity-50 cursor-not-allowed",
                  )}
                >
                  {updatingCourses.has(course.id) ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      删除
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
