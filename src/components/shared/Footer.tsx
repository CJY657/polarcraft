/**
 * Footer Component - site-wide educational footer.
 */

import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ArrowUpRight, Github } from "lucide-react";

import { useTheme } from "@/contexts/ThemeContext";
import { PolarCraftLogo } from "@/components/icons";

interface FooterLink {
  label: string;
  path: string;
  external?: boolean;
}

const LEARN_LINKS: FooterLink[] = [
  { label: "实验总览", path: "/experiments" },
  { label: "历史时间线", path: "/chronicles" },
  { label: "实验单元", path: "/units" },
  { label: "交互模拟", path: "/demos" },
];

const EXPLORE_LINKS: FooterLink[] = [
  { label: "成果展示", path: "/gallery" },
  { label: "研究协作", path: "/lab/explore" },
  { label: "平台说明", path: "/about" },
];

const RESOURCE_LINKS: FooterLink[] = [
  { label: "GitHub", path: "https://github.com/amatke31/polarcraft", external: true },
  { label: "首页", path: "/" },
];

function FooterLinkList({
  title,
  links,
}: {
  title: string;
  links: FooterLink[];
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--glass-text-muted)]">
        {title}
      </p>
      <div className="mt-4 flex flex-col gap-3">
        {links.map((link) =>
          link.external ? (
            <a
              key={link.path}
              href={link.path}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-[var(--paper-foreground)] transition-colors hover:text-[var(--paper-link)]"
            >
              {link.label}
              {link.label === "GitHub" ? <Github className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
            </a>
          ) : (
            <Link
              key={link.path}
              to={link.path}
              className="inline-flex items-center gap-2 text-sm font-medium text-[var(--paper-foreground)] transition-colors hover:text-[var(--paper-link)]"
            >
              {link.label}
            </Link>
          ),
        )}
      </div>
    </div>
  );
}

export function Footer() {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <footer
      className="relative mt-16 border-t border-[var(--paper-border)] bg-[color:var(--paper-surface-strong)]/95 px-4 py-12 text-[var(--paper-foreground)] sm:px-6 lg:px-8"
      style={{ zIndex: 1000, position: "relative" }}
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 border-b border-[var(--paper-border)] pb-10 lg:grid-cols-[minmax(0,1.3fr)_0.85fr_0.85fr_0.85fr]">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="glass-chip flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--paper-border)]">
                <PolarCraftLogo size={30} theme={theme} animated={false} />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--glass-text-muted)]">
                  PolarCraft
                </p>
                <p className="text-lg font-semibold" style={{ fontFamily: "var(--font-ui-display)" }}>
                  偏振实验平台
                </p>
              </div>
            </div>

            <p className="max-w-xl text-sm leading-7 text-[var(--glass-text-muted)]">
              用实验内容、历史时间线、实验单元、交互模拟与项目协作，把偏振光学组织成更清晰的学习路径。
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/experiments"
                className="glass-button glass-button-primary rounded-full px-5 py-2.5 text-sm font-semibold text-white"
              >
                查看实验
              </Link>
              <Link
                to="/lab/explore"
                className="glass-button rounded-full px-5 py-2.5 text-sm font-semibold text-[var(--paper-link)]"
              >
                浏览项目
              </Link>
            </div>
          </div>

          <FooterLinkList title="Learn" links={LEARN_LINKS} />
          <FooterLinkList title="Explore" links={EXPLORE_LINKS.map((link) => ({
            ...link,
            label: link.label === "平台说明" ? t("footer.about") : link.label,
          }))} />
          <FooterLinkList title="Resources" links={RESOURCE_LINKS} />
        </div>

        <div className="flex flex-col gap-3 pt-6 text-sm text-[var(--glass-text-muted)] md:flex-row md:items-center md:justify-between">
          <p>PolarCraft © 2026</p>
          <p>Inspired by modern learning-platform UI patterns and adapted for this project.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
