import { useState, type ReactNode } from "react";
import { ListTree } from "lucide-react";

import { useTheme } from "@/contexts/ThemeContext";
import { ExperimentCurriculumDrawer } from "@/feature/course/ExperimentCurriculumDrawer";
import { DevicesCurriculumTree } from "./DevicesCurriculumTree";

interface DevicesWorkspaceLayoutProps {
  children: ReactNode;
  mainClassName?: string;
}

export function DevicesWorkspaceLayout({
  children,
  mainClassName = "",
}: DevicesWorkspaceLayoutProps) {
  const { theme } = useTheme();
  const [isCurriculumDrawerOpen, setIsCurriculumDrawerOpen] = useState(false);

  return (
    <div
      className={`flex min-h-[calc(100vh-64px)] flex-col overflow-visible border-t lg:h-[calc(100vh-64px)] lg:flex-row lg:overflow-hidden ${
        theme === "dark" ? "border-slate-700/70 bg-slate-900/40" : "border-slate-200 bg-white/50"
      }`}
    >
      <aside
        className={`persistent-scrollbar hidden w-full flex-shrink-0 overflow-visible border-b lg:block lg:h-full lg:w-[236px] lg:overflow-y-auto lg:border-b-0 lg:border-r xl:w-[260px] 2xl:w-[288px] ${
          theme === "dark"
            ? "border-slate-700/70 bg-slate-800/40"
            : "border-slate-200 bg-slate-50/50"
        }`}
      >
        <DevicesCurriculumTree theme={theme} idPrefix="devices-curriculum-desktop" />
      </aside>

      <main
        className={`persistent-scrollbar flex-1 overflow-visible lg:h-full lg:overflow-y-auto ${mainClassName}`}
      >
        <div
          className={`border-b px-4 py-3 lg:hidden ${
            theme === "dark" ? "border-slate-700/70" : "border-slate-200"
          }`}
        >
          <button
            type="button"
            data-testid="devices-curriculum-drawer-trigger"
            aria-haspopup="dialog"
            aria-expanded={isCurriculumDrawerOpen}
            onClick={() => setIsCurriculumDrawerOpen(true)}
            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] font-bold transition-colors ${
              theme === "dark"
                ? "border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700"
                : "border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
            }`}
          >
            <ListTree className="h-4 w-4" />
            挑战目录
          </button>
        </div>

        {children}
      </main>

      <ExperimentCurriculumDrawer
        isOpen={isCurriculumDrawerOpen}
        onClose={() => setIsCurriculumDrawerOpen(false)}
        title="挑战目录"
        closeLabel="关闭挑战目录"
        theme={theme}
      >
        <DevicesCurriculumTree
          theme={theme}
          idPrefix="devices-curriculum-drawer"
          onAfterSelect={() => setIsCurriculumDrawerOpen(false)}
        />
      </ExperimentCurriculumDrawer>
    </div>
  );
}
