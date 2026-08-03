import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Compass, Gem } from "lucide-react";

interface DevicesCurriculumTreeProps {
  theme: "dark" | "light";
  idPrefix?: string;
  onAfterSelect?: () => void;
}

export function DevicesCurriculumTree({
  theme,
  idPrefix = "devices-curriculum",
  onAfterSelect,
}: DevicesCurriculumTreeProps) {
  const location = useLocation();
  const isOverviewActive = location.pathname === "/devices";
  const isChallengeActive = location.pathname === "/devices/calcite-case";
  const [isModuleExpanded, setIsModuleExpanded] = useState(true);

  const isDark = theme === "dark";
  const panelId = `${idPrefix}-module`;
  const mutedTextClass = isDark ? "text-slate-400" : "text-slate-500";
  const focusRingClass = isDark
    ? "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
    : "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700";
  const hoverClass = isDark ? "hover:bg-slate-700/50" : "hover:bg-slate-100";
  const activeClass = isDark
    ? "bg-cyan-500/15 text-cyan-100"
    : "bg-cyan-50 text-cyan-900";

  return (
    <nav
      aria-label="挑战目录"
      data-testid="devices-curriculum-tree"
      className="p-3"
    >
      <p className={`px-2 pb-2 text-[11px] font-bold uppercase tracking-[0.18em] ${mutedTextClass}`}>
        挑战目录
      </p>

      <ul className="space-y-1">
        <li>
          <button
            type="button"
            onClick={() => setIsModuleExpanded((current) => !current)}
            aria-expanded={isModuleExpanded}
            aria-controls={panelId}
            className={`flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-[13px] font-bold transition-colors ${focusRingClass} ${hoverClass} ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            <ChevronRight
              aria-hidden="true"
              className={`h-4 w-4 shrink-0 transition-transform ${isModuleExpanded ? "rotate-90" : ""}`}
            />
            <span
              aria-hidden="true"
              className="h-4 w-1 shrink-0 rounded-full bg-[#f4a261]"
            />
            <span className="min-w-0 flex-1 truncate">偏振挑战</span>
            <span className={`shrink-0 text-[10px] font-bold ${mutedTextClass}`}>1</span>
          </button>

          <ul
            id={panelId}
            hidden={!isModuleExpanded}
            className="mt-0.5 space-y-0.5"
          >
            <li>
              <Link
                to="/devices"
                onClick={onAfterSelect}
                aria-current={isOverviewActive ? "page" : undefined}
                className={`flex w-full items-center gap-2 rounded-xl px-2 py-2 pl-7 text-left text-[12.5px] font-semibold transition-colors ${focusRingClass} ${
                  isOverviewActive
                    ? activeClass
                    : `${hoverClass} ${isDark ? "text-slate-300" : "text-slate-700"}`
                }`}
              >
                <Compass aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                <span className="min-w-0 flex-1">挑战总览</span>
              </Link>
            </li>
            <li>
              <Link
                to="/devices/calcite-case"
                onClick={onAfterSelect}
                aria-current={isChallengeActive ? "page" : undefined}
                className={`flex w-full items-center gap-2 rounded-xl px-2 py-2 pl-7 text-left text-[12.5px] font-semibold transition-colors ${focusRingClass} ${
                  isChallengeActive
                    ? activeClass
                    : `${hoverClass} ${isDark ? "text-slate-300" : "text-slate-700"}`
                }`}
              >
                <Gem aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                <span className="min-w-0 flex-1">冰洲石双影迷案</span>
              </Link>
            </li>
          </ul>
        </li>
      </ul>
    </nav>
  );
}
