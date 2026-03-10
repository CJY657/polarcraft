/**
 * UnitViewerPage - 单元查看页面
 *
 * 独立的全屏单元查看页面
 * 上方显示单元主PDF，下方显示课程选择器
 */

import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/utils/classNames";
import { Loader2, AlertCircle, Upload } from "lucide-react";
import { useUnitDetailStore } from "@/stores/unitStore";
import { UnitViewer } from "@/feature/unit/UnitViewer";

export function UnitViewerPage() {
  const { unitId } = useParams<{ unitId: string }>();
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { unit, mainSlide, courses, isLoading, error, fetchUnit, reset } = useUnitDetailStore();

  useEffect(() => {
    if (unitId) {
      fetchUnit(unitId);
    }
    return () => reset();
  }, [unitId, fetchUnit, reset]);

  const handleBack = () => {
    navigate("/courses");
  };

  const handleManageResources = () => {
    navigate(`/admin/units/${unitId}?tab=courses`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div
        className={cn(
          "min-h-screen flex items-center justify-center",
          theme === "dark"
            ? "bg-gradient-to-br from-[#0a0a1a] via-[#1a1a3a] to-[#0a0a2a]"
            : "bg-gradient-to-br from-[#fffbeb] via-[#fef3c7] to-[#fffbeb]"
        )}
      >
        <div className="text-center">
          <Loader2
            className={cn(
              "w-10 h-10 mx-auto mb-4 animate-spin",
              theme === "dark" ? "text-cyan-400" : "text-cyan-600"
            )}
          />
          <p className={cn("text-sm", theme === "dark" ? "text-gray-400" : "text-gray-500")}>
            {theme === "dark" ? "加载中..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className={cn(
          "min-h-screen flex items-center justify-center",
          theme === "dark"
            ? "bg-gradient-to-br from-[#0a0a1a] via-[#1a1a3a] to-[#0a0a2a]"
            : "bg-gradient-to-br from-[#fffbeb] via-[#fef3c7] to-[#fffbeb]"
        )}
      >
        <div className="text-center">
          <AlertCircle
            className={cn(
              "w-12 h-12 mx-auto mb-4",
              theme === "dark" ? "text-red-400" : "text-red-500"
            )}
          />
          <p
            className={cn(
              "text-lg font-medium mb-2",
              theme === "dark" ? "text-white" : "text-gray-900"
            )}
          >
            {theme === "dark" ? "加载失败" : "Failed to Load"}
          </p>
          <p className={cn("text-sm mb-4", theme === "dark" ? "text-gray-400" : "text-gray-500")}>
            {error}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => fetchUnit(unitId!)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                theme === "dark"
                  ? "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
                  : "bg-cyan-100 text-cyan-700 hover:bg-cyan-200"
              )}
            >
              {theme === "dark" ? "重试" : "Retry"}
            </button>
            <button
              onClick={handleBack}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                theme === "dark"
                  ? "bg-slate-700 text-gray-300 hover:bg-slate-600"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              )}
            >
              {theme === "dark" ? "返回" : "Back"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Not found state
  if (!unit) {
    return (
      <div
        className={cn(
          "min-h-screen flex items-center justify-center",
          theme === "dark"
            ? "bg-gradient-to-br from-[#0a0a1a] via-[#1a1a3a] to-[#0a0a2a]"
            : "bg-gradient-to-br from-[#fffbeb] via-[#fef3c7] to-[#fffbeb]"
        )}
      >
        <div className="text-center">
          <p
            className={cn(
              "text-lg font-medium",
              theme === "dark" ? "text-white" : "text-gray-900"
            )}
          >
            {theme === "dark" ? "单元不存在" : "Unit Not Found"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "min-h-screen py-6",
        theme === "dark"
          ? "bg-gradient-to-br from-[#0a0a1a] via-[#1a1a3a] to-[#0a0a2a]"
          : "bg-gradient-to-br from-[#fffbeb] via-[#fef3c7] to-[#fffbeb]"
      )}
    >
      {user?.role === "admin" && (
        <div className="mx-auto mb-4 max-w-7xl px-4">
          <div
            className={cn(
              "flex flex-col gap-3 rounded-2xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
              theme === "dark"
                ? "border-cyan-500/30 bg-cyan-500/10"
                : "border-cyan-200 bg-cyan-50"
            )}
          >
            <div>
              <p
                className={cn(
                  "text-sm font-medium",
                  theme === "dark" ? "text-cyan-200" : "text-cyan-900"
                )}
              >
                仅管理员可上传或修改实验课资源
              </p>
              <p
                className={cn(
                  "text-xs",
                  theme === "dark" ? "text-cyan-100/80" : "text-cyan-700"
                )}
              >
                可在单元管理页进入课程后上传视频、图片和 PPT 相关资源。
              </p>
            </div>
            <button
              onClick={handleManageResources}
              className={cn(
                "inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors sm:w-auto",
                theme === "dark"
                  ? "bg-cyan-500 text-white hover:bg-cyan-400"
                  : "bg-cyan-600 text-white hover:bg-cyan-700"
              )}
            >
              <Upload className="h-4 w-4" />
              管理资源
            </button>
          </div>
        </div>
      )}
      <UnitViewer
        unit={unit}
        mainSlide={mainSlide}
        courses={courses}
        onBack={handleBack}
        theme={theme}
      />
    </div>
  );
}

export default UnitViewerPage;
