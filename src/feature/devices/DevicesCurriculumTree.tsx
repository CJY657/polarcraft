import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  Compass,
  FolderClosed,
  FolderOpen,
  Gem,
  type LucideIcon,
} from "lucide-react";

type DevicesFolderKey = "overview" | "challenge";

interface DevicesRouteFolder {
  id: DevicesFolderKey;
  label: string;
  itemLabel: string;
  path: string;
  isActive: boolean;
  icon: LucideIcon;
  folderIconClass: string;
}

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
  const [isUnitExpanded, setIsUnitExpanded] = useState(true);
  const [isExperimentExpanded, setIsExperimentExpanded] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Record<DevicesFolderKey, boolean>>({
    overview: true,
    challenge: true,
  });

  const isDark = theme === "dark";
  const unitPanelId = `${idPrefix}-unit-1`;
  const experimentPanelId = `${idPrefix}-experiment-calcite`;
  const mutedTextClass = isDark ? "text-slate-400" : "text-slate-500";
  const focusRingClass = isDark
    ? "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
    : "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700";
  const rowBaseClass = `flex w-full items-center gap-2 rounded-xl text-left transition-colors ${focusRingClass}`;
  const hoverClass = isDark ? "hover:bg-slate-700/50" : "hover:bg-slate-100";
  const activeClass = isDark
    ? "bg-cyan-500/15 text-cyan-100"
    : "bg-cyan-50 text-cyan-900";
  const routeFolders: DevicesRouteFolder[] = [
    {
      id: "overview",
      label: "挑战导览",
      itemLabel: "挑战总览",
      path: "/devices",
      isActive: isOverviewActive,
      icon: Compass,
      folderIconClass: isDark ? "text-amber-300" : "text-amber-600",
    },
    {
      id: "challenge",
      label: "互动挑战",
      itemLabel: "冰洲石双影迷案",
      path: "/devices/calcite-case",
      isActive: isChallengeActive,
      icon: Gem,
      folderIconClass: isDark ? "text-cyan-300" : "text-cyan-700",
    },
  ];

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
            onClick={() => setIsUnitExpanded((current) => !current)}
            aria-expanded={isUnitExpanded}
            aria-controls={unitPanelId}
            className={`${rowBaseClass} ${hoverClass} px-2 py-2 text-[13px] font-bold ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            {isUnitExpanded ? (
              <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0" />
            ) : (
              <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0" />
            )}
            <span
              aria-hidden="true"
              className="h-4 w-1 shrink-0 rounded-full bg-[#C9A227]"
            />
            <span className="min-w-0 flex-1 truncate">光的偏振态及其调制和测量</span>
            <span className={`shrink-0 text-[10px] font-bold ${mutedTextClass}`}>1</span>
          </button>

          <ul
            id={unitPanelId}
            hidden={!isUnitExpanded}
            className="mt-0.5 space-y-0.5"
          >
            <li>
              <button
                type="button"
                onClick={() => setIsExperimentExpanded((current) => !current)}
                aria-expanded={isExperimentExpanded}
                aria-controls={isExperimentExpanded ? experimentPanelId : undefined}
                aria-current="true"
                className={`${rowBaseClass} ${activeClass} px-2 py-1.5 pl-3 text-[12.5px] font-bold`}
              >
                <ChevronRight
                  aria-hidden="true"
                  className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                    isExperimentExpanded ? "rotate-90" : ""
                  }`}
                />
                <span className="min-w-0 flex-1 truncate">冰洲石实验和双折射</span>
              </button>

              {isExperimentExpanded ? (
                <ul id={experimentPanelId} className="mt-0.5 space-y-0.5">
                  {routeFolders.map((folder) => {
                    const isFolderExpanded = expandedFolders[folder.id];
                    const folderPanelId = `${idPrefix}-folder-${folder.id}`;
                    const FolderIcon = isFolderExpanded ? FolderOpen : FolderClosed;
                    const ItemIcon = folder.icon;

                    return (
                      <li key={folder.id}>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedFolders((current) => ({
                              ...current,
                              [folder.id]: !current[folder.id],
                            }))
                          }
                          aria-expanded={isFolderExpanded}
                          aria-controls={folderPanelId}
                          className={`${rowBaseClass} ${hoverClass} px-2 py-1.5 pl-5 text-[12px] font-bold ${
                            isDark ? "text-slate-200" : "text-slate-700"
                          }`}
                        >
                          <ChevronRight
                            aria-hidden="true"
                            className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                              isFolderExpanded ? "rotate-90" : ""
                            }`}
                          />
                          <FolderIcon
                            aria-hidden="true"
                            className={`h-3.5 w-3.5 shrink-0 ${folder.folderIconClass}`}
                          />
                          <span className="min-w-0 flex-1 truncate">{folder.label}</span>
                          <span className={`shrink-0 text-[10px] font-bold ${mutedTextClass}`}>
                            1
                          </span>
                        </button>

                        <ul
                          id={folderPanelId}
                          hidden={!isFolderExpanded}
                          className="mt-0.5 space-y-0.5"
                        >
                          <li>
                            <Link
                              to={folder.path}
                              onClick={onAfterSelect}
                              aria-current={folder.isActive ? "page" : undefined}
                              className={`${rowBaseClass} px-2 py-1.5 pl-9 text-[12px] ${
                                folder.isActive
                                  ? `${activeClass} font-bold`
                                  : `${hoverClass} font-medium ${
                                      isDark ? "text-slate-300" : "text-slate-600"
                                    }`
                              }`}
                            >
                              <ItemIcon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                              <span className="min-w-0 flex-1 truncate">{folder.itemLabel}</span>
                            </Link>
                          </li>
                        </ul>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </li>
          </ul>
        </li>
      </ul>
    </nav>
  );
}
