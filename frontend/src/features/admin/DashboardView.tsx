"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PlusCircle } from "lucide-react";
import { PublicationBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { getDashboard } from "@/lib/api/admin";
import type { DashboardData } from "@/types/api";
import { formatDateTime } from "@/utils/format";
import { getErrorMessage } from "@/utils/errors";
import { PageHeader } from "./PageHeader";

const ACTION_LABELS: Record<string, string> = {
  created: "Created",
  updated: "Updated",
  deleted: "Deleted",
  published: "Published",
  unpublished: "Unpublished",
  reordered: "Reordered",
  uploaded: "Uploaded images to",
};

export function DashboardView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    getDashboard().then(setData).catch((err) => setError(getErrorMessage(err)));
  }, []);

  useEffect(load, [load]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <LoadingState label="Loading dashboard..." />;

  const { stats } = data;
  const cards = [
    { label: "Total projects", value: stats.total_projects },
    { label: "Published", value: stats.published_projects },
    { label: "Drafts", value: stats.draft_projects },
    { label: "Featured", value: stats.featured_projects },
    { label: "Categories", value: stats.categories },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="An overview of your portfolio content."
        actions={
          <ButtonLink href="/admin/projects/new">
            <PlusCircle className="h-4 w-4" aria-hidden /> New project
          </ButtonLink>
        }
      />
      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {cards.map((card) => (
          <div key={card.label} className="brackets glass rounded-xl p-5">
            <dt className="text-xs uppercase tracking-widest text-silver-500">{card.label}</dt>
            <dd className="mt-2 font-display text-3xl font-semibold text-white">{card.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="glass rounded-xl p-5">
          <h2 className="font-display text-lg text-white">Recently updated</h2>
          {data.recent_projects.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="No projects yet" description="Create your first project to get started." />
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-white/5">
              {data.recent_projects.map((project) => (
                <li key={project.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <Link href={`/admin/projects/${project.id}`} className="block truncate text-silver-100 hover:text-cyan-300">
                      {project.title}
                    </Link>
                    <span className="text-xs text-silver-500">{formatDateTime(project.updated_at)}</span>
                  </div>
                  <PublicationBadge status={project.publication_status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="glass rounded-xl p-5">
          <h2 className="font-display text-lg text-white">Recent activity</h2>
          {data.recent_activity.length === 0 ? (
            <p className="mt-4 text-sm text-silver-500">No activity recorded yet.</p>
          ) : (
            <ul className="mt-4 space-y-3 text-sm">
              {data.recent_activity.map((item) => (
                <li key={item.id} className="flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" aria-hidden />
                  <div>
                    <p className="text-silver-200">
                      <span className="text-silver-400">{item.actor_name}</span> {ACTION_LABELS[item.action] ?? item.action} {item.target_type}{" "}
                      <span className="text-white">{item.target_label}</span>
                    </p>
                    <p className="text-xs text-silver-500">{formatDateTime(item.created_at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
