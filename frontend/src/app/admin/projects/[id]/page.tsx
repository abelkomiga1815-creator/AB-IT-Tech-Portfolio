"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { GalleryManager } from "@/features/admin/GalleryManager";
import { PageHeader } from "@/features/admin/PageHeader";
import { ProjectForm } from "@/features/admin/ProjectForm";
import { getAdminProject } from "@/lib/api/admin";
import type { AdminProject } from "@/types/api";
import { getErrorMessage } from "@/utils/errors";

function EditProject() {
  const { id } = useParams<{ id: string }>();
  const justCreated = useSearchParams().get("created") === "1";
  const [project, setProject] = useState<AdminProject | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    getAdminProject(id).then(setProject).catch((err) => setError(getErrorMessage(err)));
  }, [id]);
  useEffect(load, [load]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!project) return <LoadingState label="Loading project..." />;

  return (
    <div className="max-w-4xl space-y-8">
      <PageHeader title={`Edit: ${project.title}`} description={`Public URL: /projects/${project.slug}`} />
      <ProjectForm project={project} justCreated={justCreated} />
      <GalleryManager projectId={project.id} initialImages={project.images} />
    </div>
  );
}

export default function EditProjectPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading project..." />}>
      <EditProject />
    </Suspense>
  );
}
