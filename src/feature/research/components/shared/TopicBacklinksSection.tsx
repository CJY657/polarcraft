/**
 * Topic backlinks ("引用自")
 * 反向引用区块
 *
 * Lists the topics whose description or discussion references this one, grouped
 * by source topic. The server decides what is visible — a source the viewer may
 * not open is absent entirely, not shown as a locked or empty row — so this
 * component renders whatever it is handed without further filtering.
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { profileApi } from "@/lib/profile.service";
import {
  researchApi,
  type BacklinkGroup,
  type BacklinkLocation,
} from "@/lib/research.service";

const LOCATION_LABELS: Record<BacklinkLocation["type"], string> = {
  description_zh: "中文简介",
  description_en: "英文简介",
  comment: "讨论区",
};

function locationHref(projectId: string, location: BacklinkLocation): string {
  return location.type === "comment"
    ? `/lab/projects/${projectId}#discussion-comment-${location.comment_id}`
    : `/lab/projects/${projectId}#project-description`;
}

interface TopicBacklinksSectionProps {
  projectId: string;
  /** Guests and non-members read through the public endpoint. */
  usePublicEndpoint?: boolean;
}

export default function TopicBacklinksSection({
  projectId,
  usePublicEndpoint = false,
}: TopicBacklinksSectionProps) {
  const [groups, setGroups] = useState<BacklinkGroup[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setGroups([]);
    setTotal(0);
    setPage(1);
  }, [projectId, usePublicEndpoint]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    const load = usePublicEndpoint
      ? profileApi.getPublicProjectBacklinks(projectId, page)
      : researchApi.getProjectBacklinks(projectId, page);

    load
      .then((result) => {
        if (cancelled) return;
        // ponytail: append on page > 1, replace on page 1 — no cursor bookkeeping.
        setGroups((current) => (page === 1 ? result.items : [...current, ...result.items]));
        setTotal(result.total);
      })
      .catch(() => {
        // A failed load leaves the section empty rather than blocking the page.
        if (!cancelled && page === 1) setGroups([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [projectId, page, usePublicEndpoint]);

  if (groups.length === 0) {
    return null;
  }

  return (
    <section className="mt-6" aria-labelledby="topic-backlinks-heading">
      <h2
        id="topic-backlinks-heading"
        className="text-sm font-semibold uppercase tracking-wider text-[var(--glass-text-muted)]"
      >
        引用自 · Referenced by
      </h2>

      <ul className="mt-3 flex list-none flex-col gap-2.5 p-0">
        {groups.map((group) => (
          <li key={group.project_id} className="text-base leading-7">
            <Link
              to={`/lab/projects/${group.project_id}`}
              className="font-medium text-[var(--paper-foreground)] underline decoration-[var(--paper-accent)]/50 underline-offset-4"
            >
              {group.issue_number === null ? "" : `#${group.issue_number} `}
              {group.name_zh}
            </Link>
            <span className="ml-2 inline-flex flex-wrap gap-2 align-baseline">
              {group.locations.map((location) => (
                <Link
                  key={`${location.type}-${location.comment_id ?? ""}`}
                  to={locationHref(group.project_id, location)}
                  className="rounded-md border border-[var(--glass-border)] px-2 py-0.5 text-sm text-[var(--glass-text-muted)] transition-colors hover:text-[var(--paper-foreground)]"
                >
                  {LOCATION_LABELS[location.type]}
                </Link>
              ))}
            </span>
          </li>
        ))}
      </ul>

      {groups.length < total && (
        <button
          type="button"
          disabled={isLoading}
          onClick={() => setPage((current) => current + 1)}
          className="mt-3 text-sm font-semibold text-[var(--paper-foreground)] underline decoration-[var(--paper-accent)] underline-offset-4 disabled:opacity-50"
        >
          {isLoading ? "加载中…" : `显示更多引用（共 ${total} 个课题）`}
        </button>
      )}
    </section>
  );
}
