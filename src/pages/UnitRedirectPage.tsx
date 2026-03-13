import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AlertCircle, Loader2 } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { unitApi } from "@/lib/unit.service";
import { cn } from "@/utils/classNames";

type RedirectState = "loading" | "empty" | "error";

export default function UnitRedirectPage() {
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { theme } = useTheme();
  const [status, setStatus] = useState<RedirectState>("loading");
  const [message, setMessage] = useState("");

  const isZh = i18n.language === "zh-CN";

  useEffect(() => {
    if (!unitId) {
      navigate("/experiments", { replace: true });
      return;
    }

    let isCancelled = false;

    setStatus("loading");
    setMessage("");

    unitApi
      .getPublicUnitCourses(unitId)
      .then((courses) => {
        if (isCancelled) {
          return;
        }

        const primaryExperiment = courses[0];

        if (primaryExperiment) {
          navigate(`/experiments/${primaryExperiment.id}`, { replace: true });
          return;
        }

        setStatus("empty");
        setMessage(isZh ? "该单元暂无可进入的实验。" : "No experiment is available in this unit.");
      })
      .catch((error: unknown) => {
        if (isCancelled) {
          return;
        }

        setStatus("error");
        setMessage(
          error instanceof Error
            ? error.message
            : isZh
              ? "实验入口加载失败。"
              : "Failed to open the experiment.",
        );
      });

    return () => {
      isCancelled = true;
    };
  }, [isZh, navigate, unitId]);

  if (status === "loading") {
    return (
      <div
        className={cn(
          "glass-page flex min-h-screen items-center justify-center px-6",
          theme === "dark" ? "text-slate-100" : "text-slate-900",
        )}
      >
        <div
          className={cn(
            "flex min-w-[260px] flex-col items-center gap-4 rounded-[2rem] border px-8 py-8 text-center",
            theme === "dark"
              ? "border-slate-800 bg-slate-950/72"
              : "border-slate-200 bg-white/92",
          )}
        >
          <Loader2 className="h-8 w-8 animate-spin text-[var(--paper-accent)]" />
          <div>
            <p className="text-sm font-semibold">
              {isZh ? "正在进入实验内容" : "Opening experiment"}
            </p>
            <p className={cn("mt-1 text-xs", theme === "dark" ? "text-slate-400" : "text-slate-500")}>
              {isZh ? "单元导览页已移除，系统将直接进入默认实验内容。" : "The unit overview has been removed. Redirecting to the default experiment."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "glass-page flex min-h-screen items-center justify-center px-6",
        theme === "dark" ? "text-slate-100" : "text-slate-900",
      )}
    >
      <div
        className={cn(
          "max-w-md rounded-[2rem] border px-8 py-8 text-center",
          theme === "dark"
            ? "border-slate-800 bg-slate-950/72"
            : "border-slate-200 bg-white/92",
        )}
      >
        <AlertCircle className={cn("mx-auto h-10 w-10", status === "error" ? "text-red-500" : "text-amber-500")} />
        <h1 className="mt-4 text-lg font-semibold">
          {status === "error"
            ? isZh
              ? "无法进入实验"
              : "Unable to open the experiment"
            : isZh
              ? "暂无实验"
              : "No experiment yet"}
        </h1>
        <p className={cn("mt-2 text-sm leading-6", theme === "dark" ? "text-slate-400" : "text-slate-600")}>
          {message}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            to="/experiments"
            className="inline-flex items-center justify-center rounded-full bg-[var(--paper-accent)] px-4 py-2 text-sm font-semibold text-slate-950"
          >
            {isZh ? "返回实验总览" : "Back to experiments"}
          </Link>
          <Link
            to="/units"
            className={cn(
              "inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold",
              theme === "dark"
                ? "border-slate-700 bg-slate-900/80 text-slate-200"
                : "border-slate-200 bg-slate-50 text-slate-700",
            )}
          >
            {isZh ? "返回单元列表" : "Back to units"}
          </Link>
        </div>
      </div>
    </div>
  );
}
