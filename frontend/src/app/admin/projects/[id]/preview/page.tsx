"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { ProjectDetailView } from "@/features/projects/ProjectDetailView";
import { getAdminProject } from "@/lib/api/admin";
import type { AdminProject, ProjectDetail } from "@/types/api";
import { getErrorMessage } from "@/utils/errors";

function toDetail(project: AdminProject): ProjectDetail {
  return {
    ...project,
    category: project.category_detail,
    published_at: project.published_at,
    related_projects: [],
  };
}

export default function PreviewPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<AdminProject | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    getAdminProject(id).then(setProject).catch((err) => setError(getErrorMessage(err)));
  }, [id]);
  useEffect(load, [load]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!project) return <LoadingState label="Loading preview..." />;

  return (
    <div className="-mx-4 -my-8 sm:-mx-8">
      <div className="flex flex-wrap items-center gap-3 border-b border-amber-400/30 bg-amber-400/10 px-5 py-3 text-sm text-amber-200">
        <Badge tone="amber">Preview</Badge>
        This is how the project page looks. Status: <strong>{project.publication_status}</strong>
        {project.publication_status === "draft" && " - visitors cannot see it until you publish."}
      </div>
      <ProjectDetailView project={toDetail(project)} backHref={`/admin/projects/${project.id}`} preview />
    </div>
  );
}
