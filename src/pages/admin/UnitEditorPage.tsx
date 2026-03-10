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
import { FileUpload } from "@/components/ui/FileUpload";
import { ArrowLeft, Settings, FileText, BookOpen, Trash2, Save, Plus, Edit, Loader2, X, Check, ChevronUp, ChevronDown } from "lucide-react";

type TabId = "settings" | "mainSlide" | "courses";

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "settings", label: "设置", icon: <Settings className="w-4 h-4" /> },
  { id: "mainSlide", label: "主课件", icon: <FileText className="w-4 h-4" /> },
  { id: "courses", label: "课程", icon: <BookOpen className="w-4 h-4" /> },
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
    if (requestedTab === "settings" || requestedTab === "mainSlide" || requestedTab === "courses") {
      setActiveTab(requestedTab);
    }
  }, [searchParams]);

  if (isLoading && !currentUnit) {
    return (
      <div
        className={cn(
          "min-h-screen flex items-center justify-center",
          theme === "dark" ? "bg-slate-900" : "bg-gray-50"
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
          theme === "dark" ? "bg-slate-900" : "bg-gray-50"
        )}
      >
        <div className="text-center">
          <h2
            className={cn(
              "text-xl font-semibold mb-2",
              theme === "dark" ? "text-white" : "text-gray-900"
            )}
          >
            单元未找到
          </h2>
          <p
            className={cn(
              "mb-4",
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            )}
          >
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
    <div
      className={cn(
        "min-h-screen",
        theme === "dark" ? "bg-slate-900" : "bg-gray-50"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "border-b",
          theme === "dark"
            ? "bg-slate-800 border-slate-700"
            : "bg-white border-gray-200"
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
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1
                  className={cn(
                    "text-xl font-semibold",
                    theme === "dark" ? "text-white" : "text-gray-900"
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
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
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
                      : "text-gray-500 border-transparent hover:text-gray-600"
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
                : "bg-red-50 border border-red-200"
            )}
          >
            <span className={cn(theme === "dark" ? "text-red-400" : "text-red-600")}>{error}</span>
            <button
              onClick={clearError}
              className={cn(
                theme === "dark" ? "text-red-400 hover:text-red-300" : "text-red-600 hover:text-red-500"
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
          <SettingsTab unit={currentUnit} theme={theme} />
        )}
        {activeTab === "mainSlide" && currentUnit && (
          <MainSlideTab unit={currentUnit} theme={theme} />
        )}
        {activeTab === "courses" && currentUnit && (
          <CoursesTab unit={currentUnit} theme={theme} />
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
          theme === "dark"
            ? "bg-slate-800 border-slate-700"
            : "bg-white border-gray-200 shadow-sm"
        )}
      >
        <h3
          className={cn(
            "text-lg font-semibold mb-4",
            theme === "dark" ? "text-white" : "text-gray-900"
          )}
        >
          单元信息
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className={theme === "dark" ? "text-gray-400" : "text-gray-500"}>
              主题色:
            </span>
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
              <p className={cn("break-all mt-1", theme === "dark" ? "text-white" : "text-gray-900")}>
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
          theme === "dark"
            ? "bg-slate-800 border-slate-700"
            : "bg-white border-gray-200 shadow-sm"
        )}
      >
        <h3
          className={cn(
            "text-lg font-semibold mb-4",
            theme === "dark" ? "text-white" : "text-gray-900"
          )}
        >
          统计信息
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div
            className={cn(
              "text-center p-4 rounded-lg",
              theme === "dark" ? "bg-slate-700/50" : "bg-gray-50"
            )}
          >
            <p className="text-3xl font-bold text-cyan-400">
              {unit.mainSlide ? 1 : 0}
            </p>
            <p className={cn("text-sm", theme === "dark" ? "text-gray-400" : "text-gray-500")}>
              主课件
            </p>
          </div>
          <div
            className={cn(
              "text-center p-4 rounded-lg",
              theme === "dark" ? "bg-slate-700/50" : "bg-gray-50"
            )}
          >
            <p className="text-3xl font-bold text-cyan-400">
              {unit.courses?.length || unit.courseCount || 0}
            </p>
            <p className={cn("text-sm", theme === "dark" ? "text-gray-400" : "text-gray-500")}>
                关联课程
            </p>
          </div>
          <div
            className={cn(
              "text-center p-4 rounded-lg",
              theme === "dark" ? "bg-slate-700/50" : "bg-gray-50"
            )}
          >
            <p className="text-3xl font-bold text-cyan-400">
              {unit.sortOrder}
            </p>
            <p className={cn("text-sm", theme === "dark" ? "text-gray-400" : "text-gray-500")}>
              排序
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Slide Tab Component
function MainSlideTab({ unit, theme }: { unit: any; theme: string }) {
  const { upsertMainSlide, deleteMainSlide, isLoading } = useUnitAdminStore();

  const [slideUrl, setSlideUrl] = useState(unit.mainSlide?.url || "");
  const [titleZh, setTitleZh] = useState(unit.mainSlide?.title?.["zh-CN"] || "");
  const [titleEn, setTitleEn] = useState(unit.mainSlide?.title?.["en-US"] || "");

  // Sync form state when unit changes
  useEffect(() => {
    setSlideUrl(unit.mainSlide?.url || "");
    setTitleZh(unit.mainSlide?.title?.["zh-CN"] || "");
    setTitleEn(unit.mainSlide?.title?.["en-US"] || "");
  }, [unit.mainSlide]);

  if (!unit) return null;

  const handleSave = async () => {
    if (!slideUrl) return;
    try {
      await upsertMainSlide(unit.id, {
        url: slideUrl,
        title_zh: titleZh || undefined,
        title_en: titleEn || undefined,
      });
    } catch (error) {
      // Error is handled in store
    }
  };

  const handleDelete = async () => {
    if (!confirm("确定要删除主课件吗？")) return;
    try {
      await deleteMainSlide(unit.id);
      setSlideUrl("");
      setTitleZh("");
      setTitleEn("");
    } catch (error) {
      // Error is handled in store
    }
  };

  return (
    <div className="space-y-6">
      <div
        className={cn(
          "rounded-xl p-6 border",
          theme === "dark"
            ? "bg-slate-800 border-slate-700"
            : "bg-white border-gray-200 shadow-sm"
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <h3
            className={cn(
              "text-lg font-semibold flex items-center gap-2",
              theme === "dark" ? "text-white" : "text-gray-900"
            )}
          >
            <FileText className="w-5 h-5" />
            主课件 (PDF)
          </h3>
        </div>

        <div className="space-y-4">
          {/* PDF Upload */}
          <div>
            <label className={cn("block text-sm font-medium mb-2", theme === "dark" ? "text-gray-300" : "text-gray-700")}>
              上传 PDF 文件
            </label>
            <FileUpload
              category="pdf"
              unitId={unit.id}
              value={slideUrl}
              onChange={setSlideUrl}
              accept=".pdf"
              preview={false}
            />
          </div>

          {/* Title Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={cn("block text-sm font-medium mb-2", theme === "dark" ? "text-gray-300" : "text-gray-700")}>
                标题 (中文)
              </label>
              <input
                type="text"
                value={titleZh}
                onChange={(e) => setTitleZh(e.target.value)}
                placeholder="主课件标题"
                className={cn(
                  "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500",
                  theme === "dark"
                    ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                )}
              />
            </div>
            <div>
              <label className={cn("block text-sm font-medium mb-2", theme === "dark" ? "text-gray-300" : "text-gray-700")}>
                标题 (英文)
              </label>
              <input
                type="text"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder="Main Slide Title"
                className={cn(
                  "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500",
                  theme === "dark"
                    ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                )}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <button
              onClick={handleSave}
              disabled={!slideUrl || isLoading}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                slideUrl && !isLoading
                  ? "bg-cyan-500 hover:bg-cyan-600 text-white"
                  : "bg-gray-400 cursor-not-allowed text-white"
              )}
            >
              <Save className="w-4 h-4" />
              {isLoading ? "保存中..." : "保存"}
            </button>
            {unit.mainSlide && (
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  theme === "dark"
                    ? "bg-red-500/20 hover:bg-red-500/30 text-red-400"
                    : "bg-red-50 hover:bg-red-100 text-red-600"
                )}
              >
                <Trash2 className="w-4 h-4" />
                删除
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Courses Tab Component
function CoursesTab({ unit, theme }: { unit: any; theme: string }) {
  const navigate = useNavigate();
  const { courses, isLoading: coursesLoading, fetchCourses, updateCourse, createCourse } = useCourseAdminStore();
  const { fetchUnit } = useUnitAdminStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingCourses, setUpdatingCourses] = useState<Set<string>>(new Set());
  const [newCourse, setNewCourse] = useState({
    title_zh: "",
    title_en: "",
    description_zh: "",
    description_en: "",
    color: "#06b6d4",
  });

  // Fetch all courses on mount
  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  if (!unit) return null;

  // Courses currently in this unit
  const unitCourseIds = new Set(unit.courses?.map((c: any) => c.id) || []);
  const currentCourses = unit.courses || [];

  // Courses available to add (not in this unit)
  const availableCourses = courses.filter(
    (course) => !unitCourseIds.has(course.id) &&
    (searchTerm === "" ||
      course.title?.["zh-CN"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.title?.["en-US"]?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddCourse = async (courseId: string) => {
    setUpdatingCourses((prev) => new Set(prev).add(courseId));
    try {
      await updateCourse(courseId, { unitId: unit.id });
      // Refresh unit data to show updated course list
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

  const handleRemoveCourse = async (courseId: string) => {
    if (!confirm("确定要将此课程从单元中移除吗？")) return;

    setUpdatingCourses((prev) => new Set(prev).add(courseId));
    try {
      // Set unitId to empty to remove from unit
      await updateCourse(courseId, { unitId: "" });
      // Refresh unit data
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

  const handleMoveCourse = async (courseId: string, direction: "up" | "down") => {
    const currentIndex = currentCourses.findIndex((c: any) => c.id === courseId);
    if (currentIndex === -1) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= currentCourses.length) return;

    // Swap courses
    const newOrder = [...currentCourses];
    [newOrder[currentIndex], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[currentIndex]];

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
            theme === "dark" ? "text-white" : "text-gray-900"
          )}
        >
          <BookOpen className="w-5 h-5" />
          单元课程 ({currentCourses.length})
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
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            )}
          >
            <Plus className="w-4 h-4" />
            新建课程
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-cyan-500 hover:bg-cyan-600 text-white"
          >
            <BookOpen className="w-4 h-4" />
            添加现有
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
              : "bg-white border-gray-200 shadow-sm"
          )}
        >
          <h4
            className={cn(
              "text-md font-semibold mb-4",
              theme === "dark" ? "text-white" : "text-gray-900"
            )}
          >
            创建新课程
          </h4>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={cn("block text-sm font-medium mb-2", theme === "dark" ? "text-gray-300" : "text-gray-700")}>
                  标题 (中文) *
                </label>
                <input
                  type="text"
                  value={newCourse.title_zh}
                  onChange={(e) => setNewCourse({ ...newCourse, title_zh: e.target.value })}
                  placeholder="课程标题"
                  className={cn(
                    "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500",
                    theme === "dark"
                      ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                  )}
                />
              </div>
              <div>
                <label className={cn("block text-sm font-medium mb-2", theme === "dark" ? "text-gray-300" : "text-gray-700")}>
                  标题 (英文)
                </label>
                <input
                  type="text"
                  value={newCourse.title_en}
                  onChange={(e) => setNewCourse({ ...newCourse, title_en: e.target.value })}
                  placeholder="Course Title"
                  className={cn(
                    "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500",
                    theme === "dark"
                      ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={cn("block text-sm font-medium mb-2", theme === "dark" ? "text-gray-300" : "text-gray-700")}>
                  描述 (中文)
                </label>
                <textarea
                  value={newCourse.description_zh}
                  onChange={(e) => setNewCourse({ ...newCourse, description_zh: e.target.value })}
                  placeholder="课程描述"
                  rows={2}
                  className={cn(
                    "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none",
                    theme === "dark"
                      ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                  )}
                />
              </div>
              <div>
                <label className={cn("block text-sm font-medium mb-2", theme === "dark" ? "text-gray-300" : "text-gray-700")}>
                  描述 (英文)
                </label>
                <textarea
                  value={newCourse.description_en}
                  onChange={(e) => setNewCourse({ ...newCourse, description_en: e.target.value })}
                  placeholder="Course Description"
                  rows={2}
                  className={cn(
                    "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none",
                    theme === "dark"
                      ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                  )}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div>
                <label className={cn("block text-sm font-medium mb-2", theme === "dark" ? "text-gray-300" : "text-gray-700")}>
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
                        : "bg-white border-gray-300 text-gray-900"
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
                    : "bg-gray-400 cursor-not-allowed text-white"
                )}
              >
                {updatingCourses.has("new") ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {updatingCourses.has("new") ? "创建中..." : "创建课程"}
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  theme === "dark"
                    ? "bg-slate-700 hover:bg-slate-600 text-gray-300"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
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
              : "bg-white border-gray-200 shadow-sm"
          )}
        >
          <BookOpen className={cn("w-12 h-12 mx-auto mb-4", theme === "dark" ? "text-gray-600" : "text-gray-400")} />
          <p className={cn("text-lg", theme === "dark" ? "text-gray-400" : "text-gray-600")}>
            暂无课程，点击上方按钮添加
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
                  : "bg-white border-gray-200 shadow-sm hover:shadow-md"
              )}
            >
              {/* Order Number */}
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0",
                  theme === "dark" ? "bg-slate-700 text-gray-300" : "bg-gray-100 text-gray-600"
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
                  <BookOpen className="w-6 h-6" style={{ color: course.color }} />
                )}
              </div>

              {/* Course Info */}
              <div className="flex-1 min-w-0">
                <h4
                  className={cn(
                    "font-semibold truncate",
                    theme === "dark" ? "text-white" : "text-gray-900"
                  )}
                >
                  {course.title?.["zh-CN"] || "未命名课程"}
                </h4>
                <p
                  className={cn(
                    "text-sm truncate",
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
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
                      : "hover:bg-gray-100 text-gray-500 hover:text-gray-900 disabled:opacity-30"
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
                      : "hover:bg-gray-100 text-gray-500 hover:text-gray-900 disabled:opacity-30"
                  )}
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/admin/courses/${course.id}`)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    theme === "dark"
                      ? "bg-slate-700 hover:bg-slate-600 text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  )}
                >
                  <Edit className="w-3.5 h-3.5" />
                  编辑
                </button>
                <button
                  onClick={() => handleRemoveCourse(course.id)}
                  disabled={updatingCourses.has(course.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    theme === "dark"
                      ? "bg-red-500/20 hover:bg-red-500/30 text-red-400"
                      : "bg-red-50 hover:bg-red-100 text-red-600",
                    updatingCourses.has(course.id) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {updatingCourses.has(course.id) ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Course Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowAddModal(false)}
          />
          <div
            className={cn(
              "relative w-full max-w-2xl max-h-[80vh] rounded-xl shadow-xl overflow-hidden",
              theme === "dark" ? "bg-slate-800" : "bg-white"
            )}
          >
            {/* Modal Header */}
            <div
              className={cn(
                "flex items-center justify-between p-4 border-b",
                theme === "dark" ? "border-slate-700" : "border-gray-200"
              )}
            >
              <h3
                className={cn(
                  "text-lg font-semibold",
                  theme === "dark" ? "text-white" : "text-gray-900"
                )}
              >
                选择要添加的课程
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className={cn(
                  "p-1 rounded-lg transition-colors",
                  theme === "dark"
                    ? "text-gray-400 hover:text-white hover:bg-slate-700"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                )}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="p-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索课程..."
                className={cn(
                  "w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500",
                  theme === "dark"
                    ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                )}
              />
            </div>

            {/* Course List */}
            <div className="p-4 pt-0 overflow-y-auto max-h-[50vh]">
              {coursesLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
                </div>
              ) : availableCourses.length === 0 ? (
                <div className="text-center py-10">
                  <p className={cn(theme === "dark" ? "text-gray-400" : "text-gray-600")}>
                    {searchTerm ? "没有找到匹配的课程" : "所有课程已添加到此单元"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableCourses.map((course) => (
                    <div
                      key={course.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border transition-colors",
                        theme === "dark"
                          ? "bg-slate-700/50 border-slate-600 hover:border-slate-500"
                          : "bg-gray-50 border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${course.color}30` }}
                        >
                          <BookOpen className="w-5 h-5" style={{ color: course.color }} />
                        </div>
                        <div>
                          <p
                            className={cn(
                              "font-medium",
                              theme === "dark" ? "text-white" : "text-gray-900"
                            )}
                          >
                            {course.title?.["zh-CN"] || "未命名课程"}
                          </p>
                          <p
                            className={cn(
                              "text-sm",
                              theme === "dark" ? "text-gray-400" : "text-gray-600"
                            )}
                          >
                            {course.description?.["zh-CN"] || "暂无描述"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddCourse(course.id)}
                        disabled={updatingCourses.has(course.id)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                          "bg-cyan-500 hover:bg-cyan-600 text-white",
                          updatingCourses.has(course.id) && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {updatingCourses.has(course.id) ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            添加
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
