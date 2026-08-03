import { Link } from "react-router-dom";
import { ChevronLeft, ExternalLink } from "lucide-react";

import { PersistentHeader } from "@/components/shared";
import { DevicesWorkspaceLayout } from "@/feature/devices/DevicesWorkspaceLayout";

const CALCITE_CASE_SRC = "/devices/calcite-case/index.html";

export default function CalciteCasePage() {
  return (
    <div className="glass-page min-h-screen text-[var(--paper-foreground)]">
      <PersistentHeader
        moduleKey="devices"
        moduleName="偏振挑战"
        variant="solid"
        compact
        className="sticky top-0 z-40"
      />

      <DevicesWorkspaceLayout mainClassName="flex flex-col">
        <div className="flex flex-col gap-3 border-b border-[var(--paper-border)] bg-[var(--paper-surface)]/92 px-4 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <Link
            to="/devices"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--paper-border)] bg-[var(--paper-surface-strong)] px-4 py-2 text-sm font-semibold text-[var(--paper-foreground)] transition hover:-translate-y-0.5"
          >
            <ChevronLeft className="h-4 w-4" />
            返回偏振挑战
          </Link>
          <a
            href={CALCITE_CASE_SRC}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-[var(--paper-link)]"
          >
            新窗口打开
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        <iframe
          title="冰洲石双影迷案：寻找光的隐藏维度"
          src={CALCITE_CASE_SRC}
          className="min-h-[720px] flex-1 border-0 bg-white"
        />
      </DevicesWorkspaceLayout>
    </div>
  );
}
