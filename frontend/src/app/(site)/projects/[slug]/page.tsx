import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ErrorState } from "@/components/ui/States";
import { ProjectDetailView } from "@/features/projects/ProjectDetailView";
import { ApiError } from "@/lib/api/client";
import { getProject } from "@/lib/api/public";
import type { ProjectDetail } from "@/types/api";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

async function load(slug: string): Promise<ProjectDetail | null> {
  try {
    return await getProject(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const project = await load(slug);
    if (!project) return { title: "Project not found" };
    const description = project.seo_description || project.short_description;
    return {
      title: project.seo_title || project.title,
      description,
      openGraph: {
        title: project.seo_title || project.title,
        description,
        images: project.cover_image ? [project.cover_image] : undefined,
      },
    };
  } catch {
    return { title: "Project" };
  }
}

export default async function ProjectPage({ params }: { params: Params }) {
  const { slug } = await params;
  let project: ProjectDetail | null;
  try {
    project = await load(slug);
  } catch {
    return (
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <ErrorState message="This project could not be loaded right now. Please try again shortly." />
      </div>
    );
  }
  if (!project) notFound();
  return <ProjectDetailView project={project} />;
}
