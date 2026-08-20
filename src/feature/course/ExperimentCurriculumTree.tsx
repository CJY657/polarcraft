/**
 * ExperimentCurriculumTree - 实验目录层级导航
 *
 * 固定层级：单元 → 实验 → 课件材料 / 实验数据 → 文件
 * 使用嵌套列表 + 展开按钮（aria-expanded / aria-controls），而不是自定义 tree 控件，
 * 以便键盘与读屏行为保持原生语义。
 */

import { useCallback, useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  FolderClosed,
  FolderOpen,
  Image as ImageIcon,
  Layers,
  Play,
  RotateCcw,
} from "lucide-react";

import {
  countExperiments,
  findUnitIdForExperiment,
  type ExperimentFile,
  type HierarchyUnit,
} from "./experimentHierarchy";

export type CurriculumContentKind = "experiment" | "application";

export interface ExperimentCurriculumNavigation {
  /** 单元 → 内容条目（按当前模块分类过滤，保持接口排序） */
  units: HierarchyUnit[];
  activeExperimentId: string | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onSelectExperiment: (experimentId: string) => void;
  contentKind?: CurriculumContentKind;
}

interface ExperimentCurriculumTreeProps {
  navigation: ExperimentCurriculumNavigation;
  /** 当前实验的课件材料（PPT，没有 PPT 时是主课件） */
  presentationFiles: ExperimentFile[];
  /** 当前实验的视频、图片与补充 PDF */
  experimentalDataFiles: ExperimentFile[];
  activePresentationFileId: string | null;
  activeExperimentalDataFileId: string | null;
  onSelectFile: (file: ExperimentFile) => void;
  theme: "dark" | "light";
  isZh: boolean;
  /** 桌面侧栏与移动端抽屉同时挂载时保持 DOM id 唯一 */
  idPrefix?: string;
  /** 选择后的回调（移动端抽屉用于关闭） */
  onAfterSelect?: () => void;
}

export function ExperimentCurriculumTree({
  navigation,
  presentationFiles,
  experimentalDataFiles,
  activePresentationFileId,
  activeExperimentalDataFileId,
  onSelectFile,
  theme,
  isZh,
  idPrefix = "curriculum",
  onAfterSelect,
}: ExperimentCurriculumTreeProps) {
  const {
    units,
    activeExperimentId,
    isLoading,
    error,
    onRetry,
    onSelectExperiment,
    contentKind = "experiment",
  } = navigation;
  const activeUnitId = findUnitIdForExperiment(units, activeExperimentId);
  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(activeUnitId);
  const [isActiveExperimentExpanded, setIsActiveExperimentExpanded] = useState(true);
  const [isPresentationFolderExpanded, setIsPresentationFolderExpanded] = useState(true);
  const [isExperimentalDataFolderExpanded, setIsExperimentalDataFolderExpanded] = useState(true);

  // 只保持激活路径展开：单元与实验跟随当前实验同步
  useEffect(() => {
    setExpandedUnitId(activeUnitId);
  }, [activeUnitId]);

  useEffect(() => {
    setIsActiveExperimentExpanded(true);
    setIsPresentationFolderExpanded(true);
    setIsExperimentalDataFolderExpanded(true);
  }, [activeExperimentId]);

  const toggleUnit = useCallback((unitId: string) => {
    setExpandedUnitId((currentUnitId) => (currentUnitId === unitId ? null : unitId));
  }, []);

  const isDark = theme === "dark";
  const mutedTextClass = isDark ? "text-slate-400" : "text-slate-500";
  const focusRingClass = isDark
    ? "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
    : "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600";
  const rowBaseClass = `flex w-full items-center gap-2 rounded-xl text-left transition-colors ${focusRingClass}`;
  const hoverClass = isDark ? "hover:bg-slate-700/50" : "hover:bg-slate-100";

  // 层级配色：单元(墨色) → 实验(靛蓝) → 分组(静音标签) → 文件(跟随所属分组)
  const guideLineClass = isDark ? "border-slate-700/70" : "border-slate-200";
  const nestedListClass = `mt-0.5 ml-2.5 space-y-0.5 border-l pl-1 ${guideLineClass}`;

  const unitRowClass = isDark
    ? "bg-slate-800/60 text-white hover:bg-slate-800"
    : "bg-slate-100 text-slate-900 hover:bg-slate-200/70";
  const unitRowActiveClass = isDark
    ? "bg-slate-700/80 text-white"
    : "bg-slate-200 text-slate-900";
  const unitBarClass = isDark ? "bg-slate-500" : "bg-slate-400";
  const unitBarActiveClass = isDark ? "bg-white" : "bg-slate-900";

  const experimentActiveClass = isDark
    ? "bg-indigo-500/25 text-indigo-50"
    : "bg-indigo-100 text-indigo-950";

  const presentationFileActiveClass = isDark
    ? "bg-amber-400/20 text-amber-50"
    : "bg-amber-100 text-amber-950";
  const dataFileActiveClass = isDark
    ? "bg-cyan-400/20 text-cyan-50"
    : "bg-cyan-100 text-cyan-950";

  const isApplication = contentKind === "application";
  const headingLabel = isZh
    ? isApplication
      ? "应用目录"
      : "实验目录"
    : isApplication
      ? "Applications"
      : "Curriculum";
  const loadingLabel = isZh
    ? isApplication
      ? "应用目录加载中"
      : "实验目录加载中"
    : isApplication
      ? "Loading applications"
      : "Loading curriculum";
  const emptyTitle = isZh
    ? isApplication
      ? "暂无前沿应用"
      : "暂无实验内容"
    : isApplication
      ? "No applications yet"
      : "No experiments yet";
  const emptyDescription = isZh
    ? isApplication
      ? "还没有可进入的光学设备应用，稍后再来看看。"
      : "还没有可进入的基础知识实验，稍后再来看看。"
    : isApplication
      ? "No optical-device applications are available yet."
      : "No foundation experiments are available yet.";
  const emptyUnitLabel = isZh
    ? isApplication
      ? "该单元暂无应用"
      : "该单元暂无实验"
    : isApplication
      ? "No applications in this unit"
      : "No experiments in this unit";

  if (isLoading) {
    return (
      <div
        data-testid="curriculum-skeleton"
        className="space-y-2 p-4"
        aria-busy="true"
        aria-live="polite"
      >
        <p className={`text-[11px] font-bold uppercase tracking-[0.18em] ${mutedTextClass}`}>
          {headingLabel}
        </p>
        {[0, 1, 2, 3, 4].map((row) => (
          <div
            key={row}
            className={`h-9 animate-pulse rounded-xl ${isDark ? "bg-slate-700/50" : "bg-slate-200/70"}`}
            style={{ marginLeft: row % 3 === 0 ? 0 : row % 3 === 1 ? 12 : 24 }}
          />
        ))}
        <span className="sr-only">{loadingLabel}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        data-testid="curriculum-error"
        className="space-y-3 p-4"
        role="alert"
      >
        <p className={`text-sm font-semibold ${isDark ? "text-rose-300" : "text-rose-600"}`}>
          {error}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${focusRingClass} ${
            isDark
              ? "bg-slate-700 text-slate-100 hover:bg-slate-600"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {isZh ? "重新加载" : "Retry"}
        </button>
      </div>
    );
  }

  if (countExperiments(units) === 0) {
    return (
      <div
        data-testid="curriculum-empty"
        className="p-6 text-center"
      >
        <Layers className={`mx-auto mb-3 h-10 w-10 ${isDark ? "text-slate-600" : "text-slate-300"}`} />
        <p className={`text-sm font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>
          {emptyTitle}
        </p>
        <p className={`mt-1.5 text-xs leading-5 ${mutedTextClass}`}>
          {emptyDescription}
        </p>
      </div>
    );
  }

  const renderResourceFolder = ({
    experimentId,
    folderKey,
    label,
    emptyLabel,
    files,
    activeFileId,
    isExpanded,
    onToggle,
    folderIconClass,
    activeFileClass,
  }: {
    experimentId: string;
    folderKey: "presentation" | "experimental-data";
    label: string;
    emptyLabel: string;
    files: ExperimentFile[];
    activeFileId: string | null;
    isExpanded: boolean;
    onToggle: () => void;
    folderIconClass: string;
    activeFileClass: string;
  }) => {
    const panelId = `${idPrefix}-folder-${folderKey}-${experimentId}`;
    const FolderIcon = isExpanded ? FolderOpen : FolderClosed;

    return (
      <li>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isExpanded}
          aria-controls={panelId}
          className={`${rowBaseClass} ${hoverClass} px-2 py-1.5 text-[11.5px] font-bold tracking-[0.06em] ${
            isDark ? "text-slate-400" : "text-slate-500"
          }`}
        >
          <ChevronRight
            aria-hidden="true"
            className={`h-3.5 w-3.5 shrink-0 transition-transform ${
              isExpanded ? "rotate-90" : ""
            }`}
          />
          <FolderIcon
            aria-hidden="true"
            className={`h-3.5 w-3.5 shrink-0 ${folderIconClass}`}
          />
          <span className="min-w-0 flex-1 truncate">{label}</span>
          <span className={`shrink-0 text-[10px] font-bold ${mutedTextClass}`}>
            {files.length}
          </span>
        </button>

        <ul
          id={panelId}
          hidden={!isExpanded}
          className={nestedListClass}
        >
          {files.length === 0 ? (
            <li className={`px-2 py-1.5 text-[11px] ${mutedTextClass}`}>
              {emptyLabel}
            </li>
          ) : (
            files.map((file) => {
              const isActiveFile = file.id === activeFileId;
              const FileIcon =
                file.type === "video" ? Play : file.type === "image" ? ImageIcon : FileText;

              return (
                <li key={file.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectFile(file);
                      onAfterSelect?.();
                    }}
                    aria-current={isActiveFile ? "true" : undefined}
                    className={`${rowBaseClass} px-2 py-1.5 text-[12.5px] ${
                      isActiveFile
                        ? `${activeFileClass} font-semibold`
                        : `${hoverClass} font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`
                    }`}
                  >
                    <FileIcon
                      aria-hidden="true"
                      className="h-3.5 w-3.5 shrink-0"
                    />
                    <span className="min-w-0 flex-1 truncate">
                      {file.title[isZh ? "zh-CN" : "en-US"] ||
                        file.title["zh-CN"] ||
                        file.title["en-US"] ||
                        ""}
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </li>
    );
  };

  return (
    <nav
      aria-label={headingLabel}
      data-testid="curriculum-tree"
      className="p-3"
    >
      <p className={`px-2 pb-2 text-[11px] font-bold uppercase tracking-[0.18em] ${mutedTextClass}`}>
        {headingLabel}
      </p>

      <ul className="space-y-1">
        {units.map((unit) => {
          const isUnitExpanded = expandedUnitId === unit.id;
          const isUnitActive = unit.id === activeUnitId;
          const unitPanelId = `${idPrefix}-unit-${unit.id}`;

          return (
            <li key={unit.id}>
              <button
                type="button"
                onClick={() => toggleUnit(unit.id)}
                aria-expanded={isUnitExpanded}
                aria-controls={unitPanelId}
                className={`${rowBaseClass} px-2.5 py-2.5 text-[14px] font-bold ${
                  isUnitActive ? unitRowActiveClass : unitRowClass
                }`}
              >
                {isUnitExpanded ? (
                  <ChevronDown
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0"
                  />
                ) : (
                  <ChevronRight
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0"
                  />
                )}
                <span
                  aria-hidden="true"
                  className={`h-5 w-1.5 shrink-0 rounded-full ${
                    isUnitActive ? unitBarActiveClass : unitBarClass
                  }`}
                />
                <span className="min-w-0 flex-1 truncate">
                  {unit.title[isZh ? "zh-CN" : "en-US"] ||
                    unit.title["zh-CN"] ||
                    unit.title["en-US"] ||
                    ""}
                </span>
                <span className={`shrink-0 text-[10px] font-bold ${mutedTextClass}`}>
                  {unit.experiments.length}
                </span>
              </button>

              <ul
                id={unitPanelId}
                hidden={!isUnitExpanded}
                className={nestedListClass}
              >
                {unit.experiments.length === 0 ? (
                  <li className={`px-2 py-1.5 text-[11px] ${mutedTextClass}`}>
                    {emptyUnitLabel}
                  </li>
                ) : (
                  unit.experiments.map((experiment) => {
                    const isActiveExperiment = experiment.id === activeExperimentId;
                    const isExpanded = isActiveExperiment && isActiveExperimentExpanded;
                    const experimentPanelId = `${idPrefix}-experiment-${experiment.id}`;

                    return (
                      <li key={experiment.id}>
                        <button
                          type="button"
                          onClick={() => {
                            if (isActiveExperiment) {
                              setIsActiveExperimentExpanded((current) => !current);
                              return;
                            }

                            onSelectExperiment(experiment.id);
                            onAfterSelect?.();
                          }}
                          aria-expanded={isExpanded}
                          aria-controls={isExpanded ? experimentPanelId : undefined}
                          aria-current={isActiveExperiment ? "true" : undefined}
                          className={`${rowBaseClass} px-2 py-2 text-[13px] ${
                            isActiveExperiment
                              ? `${experimentActiveClass} font-bold`
                              : `${hoverClass} font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`
                          }`}
                        >
                          <ChevronRight
                            aria-hidden="true"
                            className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                              isExpanded ? "rotate-90" : ""
                            }`}
                          />
                          <span className="min-w-0 flex-1 truncate">
                            {experiment.title[isZh ? "zh-CN" : "en-US"] ||
                              experiment.title["zh-CN"] ||
                              experiment.title["en-US"] ||
                              ""}
                          </span>
                        </button>

                        {isExpanded ? (
                          <ul
                            id={experimentPanelId}
                            className={nestedListClass}
                          >
                            {renderResourceFolder({
                              experimentId: experiment.id,
                              folderKey: "presentation",
                              label: isZh ? "课件材料" : "Presentation materials",
                              emptyLabel: isZh ? "暂无课件" : "No courseware",
                              files: presentationFiles,
                              activeFileId: activePresentationFileId,
                              isExpanded: isPresentationFolderExpanded,
                              onToggle: () =>
                                setIsPresentationFolderExpanded((current) => !current),
                              folderIconClass: isDark ? "text-amber-300" : "text-amber-600",
                              activeFileClass: presentationFileActiveClass,
                            })}
                            {renderResourceFolder({
                              experimentId: experiment.id,
                              folderKey: "experimental-data",
                              label: isZh ? "实验数据" : "Experimental data",
                              emptyLabel: isZh ? "暂无资源" : "No resources",
                              files: experimentalDataFiles,
                              activeFileId: activeExperimentalDataFileId,
                              isExpanded: isExperimentalDataFolderExpanded,
                              onToggle: () =>
                                setIsExperimentalDataFolderExpanded((current) => !current),
                              folderIconClass: isDark ? "text-cyan-300" : "text-cyan-700",
                              activeFileClass: dataFileActiveClass,
                            })}
                          </ul>
                        ) : null}
                      </li>
                    );
                  })
                )}
              </ul>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
