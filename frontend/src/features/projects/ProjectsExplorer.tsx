"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { ProjectCard } from "@/components/site/ProjectCard";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { useDebounce } from "@/hooks/useDebounce";
import { getCategories, getProjects, getTechnologies } from "@/lib/api/public";
import type { Category, Paginated, ProjectCardData, Technology } from "@/types/api";
import { cn } from "@/utils/cn";
import { getErrorMessage } from "@/utils/errors";

const PAGE_SIZE = 9;

export function ProjectsExplorer() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "";
  const technology = searchParams.get("technology") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  const [searchInput, setSearchInput] = useState(q);
  const debouncedSearch = useDebounce(searchInput, 350);

  const [categories, setCategories] = useState<Category[]>([]);
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [data, setData] = useState<Paginated<ProjectCardData> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const updateParams = useCallback(
    (patch: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  // Filters (categories / technologies) are optional extras: failures should not break the list.
  useEffect(() => {
    const controller = new AbortController();
    getCategories(controller.signal).then(setCategories).catch(() => undefined);
    getTechnologies(controller.signal).then(setTechnologies).catch(() => undefined);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (debouncedSearch.trim() !== q) updateParams({ q: debouncedSearch.trim() || undefined, page: undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    getProjects(
      { page, page_size: PAGE_SIZE, search: q || undefined, category: category || undefined, technology: technology || undefined },
      controller.signal,
    )
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(getErrorMessage(err));
        setLoading(false);
      });
    return () => controller.abort();
  }, [page, q, category, technology, reloadKey]);

  const totalPages = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1;
  const hasFilters = Boolean(q || category || technology);
  const chip = (active: boolean) =>
    cn(
      "rounded-full border px-3.5 py-1.5 text-sm transition",
      active ? "border-volt-400 bg-volt-500/20 text-white" : "border-white/10 text-silver-300 hover:border-cyan-400/40 hover:text-white",
    );

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-silver-500" aria-hidden />
          <input
            type="search"
            aria-label="Search projects"
            placeholder="Search by name, technology or keyword"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="field pl-10"
          />
        </div>
        {technologies.length > 0 && (
          <select
            aria-label="Filter by technology"
            value={technology}
            onChange={(event) => updateParams({ technology: event.target.value || undefined, page: undefined })}
            className="field w-full lg:w-56"
          >
            <option value="">All technologies</option>
            {technologies.map((tech) => (
              <option key={tech.id} value={tech.slug}>
                {tech.name} ({tech.project_count})
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
        <button type="button" className={chip(!category)} aria-pressed={!category} onClick={() => updateParams({ category: undefined, page: undefined })}>
          All
        </button>
        {categories.map((item) => (
          <button
            key={item.id}
            type="button"
            className={chip(category === item.slug)}
            aria-pressed={category === item.slug}
            onClick={() => updateParams({ category: item.slug, page: undefined })}
          >
            {item.name} <span className="ml-1 font-mono text-xs text-silver-500">{item.project_count}</span>
          </button>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between text-sm text-silver-400" aria-live="polite">
        <span>{data && !error ? `${data.count} project${data.count === 1 ? "" : "s"}` : "\u00a0"}</span>
        {hasFilters && (
          <button
            type="button"
            className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
            onClick={() => {
              setSearchInput("");
              router.replace(pathname, { scroll: false });
            }}
          >
            <X className="h-3.5 w-3.5" aria-hidden /> Clear filters
          </button>
        )}
      </div>

      <div className="mt-6">
        {error ? (
          <ErrorState message={error} onRetry={() => setReloadKey((key) => key + 1)} />
        ) : loading && !data ? (
          <LoadingState label="Loading projects..." />
        ) : data && data.results.length === 0 ? (
          <EmptyState
            title={hasFilters ? "No projects match your search" : "No projects published yet"}
            description={hasFilters ? "Try a different keyword or clear the filters." : "Check back soon."}
          />
        ) : (
          <div className={cn("grid gap-6 transition-opacity sm:grid-cols-2 lg:grid-cols-3", loading && "opacity-50")}>
            {data?.results.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>

      {!error && data && (
        <div className="mt-10">
          <Pagination page={page} totalPages={totalPages} onChange={(next) => updateParams({ page: next > 1 ? String(next) : undefined })} />
        </div>
      )}
    </div>
  );
}
