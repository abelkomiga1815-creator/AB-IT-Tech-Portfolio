"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, PlusCircle, Search, Star, Trash2, Globe } from "lucide-react";
import { PublicationBadge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SafeImage } from "@/components/ui/SafeImage";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { useDebounce } from "@/hooks/useDebounce";
import { deleteProject, listAdminProjects, publishProject, reorderProjects, unpublishProject, updateProject } from "@/lib/api/admin";
import type { AdminProject } from "@/types/api";
import { cn } from "@/utils/cn";
import { getErrorMessage } from "@/utils/errors";
import { formatDateTime } from "@/utils/format";
import { Notice, PageHeader } from "./PageHeader";

const PAGE_SIZE = 100;

export function ProjectsTable() {
  const [items, setItems] = useState<AdminProject[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [toDelete, setToDelete] = useState<AdminProject | null>(null);
  const debounced = useDebounce(search, 300);

  const filtersActive = Boolean(debounced || status);
  const canReorder = !filtersActive && total <= PAGE_SIZE;

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    listAdminProjects({ page_size: PAGE_SIZE, search: debounced || undefined, publication_status: status || undefined })
      .then((result) => {
        setItems(result.results);
        setTotal(result.count);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [debounced, status]);

  useEffect(load, [load]);

  const replace = (project: AdminProject) => setItems((list) => list.map((item) => (item.id === project.id ? project : item)));

  async function run(project: AdminProject, task: () => Promise<AdminProject>, success: string) {
    setBusyId(project.id);
    setActionError(null);
    setNotice(null);
    try {
      replace(await task());
      setNotice(success);
    } catch (err) {
      setActionError(`${project.title}: ${getErrorMessage(err)}`);
    } finally {
      setBusyId(null);
    }
  }

  async function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const previous = items;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
    setActionError(null);
    try {
      await reorderProjects(next.map((item) => item.id));
      setNotice("Order saved.");
    } catch (err) {
      setItems(previous);
      setActionError(getErrorMessage(err));
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setBusyId(toDelete.id);
    try {
      await deleteProject(toDelete.id);
      setItems((list) => list.filter((item) => item.id !== toDelete.id));
      setTotal((count) => count - 1);
      setNotice(`Deleted "${toDelete.title}".`);
      setToDelete(null);
    } catch (err) {
      setActionError(getErrorMessage(err));
      setToDelete(null);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Create, publish, feature and reorder portfolio projects."
        actions={
          <ButtonLink href="/admin/projects/new">
            <PlusCircle className="h-4 w-4" aria-hidden /> New project
          </ButtonLink>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-silver-500" aria-hidden />
          <input aria-label="Search projects" className="field pl-10" placeholder="Search projects" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select aria-label="Filter by status" className="field sm:w-48" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      <div className="mb-4 space-y-2">
        {actionError && <Notice tone="error">{actionError}</Notice>}
        {notice && <Notice tone="success">{notice}</Notice>}
        {!canReorder && items.length > 1 && <p className="text-xs text-silver-500">Clear the search and status filter to reorder projects.</p>}
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading && items.length === 0 ? (
        <LoadingState label="Loading projects..." />
      ) : items.length === 0 ? (
        <EmptyState
          title={filtersActive ? "No projects match" : "No projects yet"}
          description={filtersActive ? "Try a different search or filter." : "Create your first project to publish it on the portfolio."}
          action={!filtersActive && <ButtonLink href="/admin/projects/new">Create project</ButtonLink>}
        />
      ) : (
        <div className={cn("overflow-x-auto rounded-xl border border-white/10", loading && "opacity-60")}>
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-ink-900/80 text-xs uppercase tracking-widest text-silver-500">
              <tr>
                <th className="w-20 px-3 py-3">Order</th>
                <th className="px-3 py-3">Project</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Featured</th>
                <th className="px-3 py-3">Updated</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {items.map((project, index) => {
                const busy = busyId === project.id;
                const published = project.publication_status === "published";
                return (
                  <tr key={project.id} className="bg-ink-850/40">
                    <td className="px-3 py-3">
                      <div className="flex gap-1">
                        <button type="button" aria-label={`Move ${project.title} up`} disabled={!canReorder || index === 0} onClick={() => move(index, -1)} className="rounded p-1 text-silver-400 hover:bg-white/10 disabled:opacity-30">
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button type="button" aria-label={`Move ${project.title} down`} disabled={!canReorder || index === items.length - 1} onClick={() => move(index, 1)} className="rounded p-1 text-silver-400 hover:bg-white/10 disabled:opacity-30">
                          <ArrowDown className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-16 shrink-0 overflow-hidden rounded-md bg-ink-800">
                          {project.cover_image && <SafeImage src={project.cover_image} alt="" className="h-full w-full object-cover" />}
                        </div>
                        <div className="min-w-0">
                          <Link href={`/admin/projects/${project.id}`} className="block truncate font-medium text-silver-100 hover:text-cyan-300">
                            {project.title}
                          </Link>
                          <span className="text-xs text-silver-500">{project.category_detail?.name ?? "No category"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <PublicationBadge status={project.publication_status} />
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        disabled={busy}
                        aria-pressed={project.is_featured}
                        aria-label={project.is_featured ? `Remove ${project.title} from featured` : `Feature ${project.title}`}
                        onClick={() => run(project, () => updateProject(project.id, { is_featured: !project.is_featured }), project.is_featured ? "Removed from featured." : "Marked as featured.")}
                        className="rounded p-1.5 hover:bg-white/10 disabled:opacity-50"
                      >
                        <Star className={cn("h-4 w-4", project.is_featured ? "fill-amber-300 text-amber-300" : "text-silver-500")} />
                      </button>
                    </td>
                    <td className="px-3 py-3 text-xs text-silver-400">{formatDateTime(project.updated_at)}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <ButtonLink href={`/admin/projects/${project.id}/preview`} variant="ghost" size="sm" aria-label={`Preview ${project.title}`}>
                          <Eye className="h-4 w-4" /> Preview
                        </ButtonLink>
                        <ButtonLink href={`/admin/projects/${project.id}`} variant="ghost" size="sm" aria-label={`Edit ${project.title}`}>
                          <Pencil className="h-4 w-4" /> Edit
                        </ButtonLink>
                        {published ? (
                          <Button size="sm" variant="secondary" loading={busy} onClick={() => run(project, () => unpublishProject(project.id), "Project unpublished.")}>
                            <EyeOff className="h-4 w-4" /> Unpublish
                          </Button>
                        ) : (
                          <Button size="sm" variant="secondary" loading={busy} onClick={() => run(project, () => publishProject(project.id), "Project published.")}>
                            <Globe className="h-4 w-4" /> Publish
                          </Button>
                        )}
                        <Button size="sm" variant="danger" disabled={busy} aria-label={`Delete ${project.title}`} onClick={() => setToDelete(project)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {total > PAGE_SIZE && <p className="mt-3 text-xs text-silver-500">Showing the first {PAGE_SIZE} of {total} projects. Use search to find others.</p>}

      <ConfirmDialog
        open={toDelete !== null}
        title="Delete project?"
        message={toDelete ? `"${toDelete.title}" and its images will be permanently deleted. This cannot be undone.` : ""}
        loading={busyId !== null && toDelete !== null && busyId === toDelete.id}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
