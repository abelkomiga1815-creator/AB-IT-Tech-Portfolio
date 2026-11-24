import Link from "next/link";
import { ArrowLeft, ExternalLink, Github, Calendar, Building2 } from "lucide-react";
import { CoverPlaceholder, ProjectCard } from "@/components/site/ProjectCard";
import { ProjectStatusBadge, TechChip } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { SafeImage } from "@/components/ui/SafeImage";
import type { ProjectDetail } from "@/types/api";
import { formatDate } from "@/utils/format";
import { ProjectGallery } from "./ProjectGallery";

function TextBlock({ index, title, text }: { index: string; title: string; text: string }) {
  if (!text.trim()) return null;
  return (
    <section>
      <h2 className="eyebrow">
        <span className="mr-2 text-silver-500">{index}</span>
        {title}
      </h2>
      <p className="mt-3 whitespace-pre-line leading-relaxed text-silver-300">{text}</p>
    </section>
  );
}

export function ProjectDetailView({ project, backHref = "/projects", preview = false }: { project: ProjectDetail; backHref?: string; preview?: boolean }) {
  const completion = formatDate(project.completion_date);
  return (
    <article className="mx-auto max-w-7xl px-5 pb-8 pt-12 sm:px-8">
      <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm text-silver-400 transition hover:text-white">
        <ArrowLeft className="h-4 w-4" aria-hidden /> {preview ? "Back to editor" : "All projects"}
      </Link>

      <header className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {project.category && (
              <Link
                href={`/projects?category=${encodeURIComponent(project.category.slug)}`}
                className="rounded-md bg-cyan-400/10 px-2 py-1 font-mono text-[11px] uppercase tracking-widest text-cyan-300"
              >
                {project.category.name}
              </Link>
            )}
            <ProjectStatusBadge status={project.project_status} />
          </div>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">{project.title}</h1>
          <p className="mt-4 max-w-2xl text-lg text-silver-400">{project.short_description}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {project.live_demo_url && (
              <ButtonLink href={project.live_demo_url} external>
                Live demo <ExternalLink className="h-4 w-4" aria-hidden />
              </ButtonLink>
            )}
            {project.source_code_url && (
              <ButtonLink href={project.source_code_url} external variant="secondary">
                <Github className="h-4 w-4" aria-hidden /> Source code
              </ButtonLink>
            )}
          </div>
        </div>
        <dl className="glass grid grid-cols-2 gap-4 rounded-2xl p-5 text-sm">
          {project.client_name && (
            <div>
              <dt className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-silver-500">
                <Building2 className="h-3.5 w-3.5" aria-hidden /> Client
              </dt>
              <dd className="mt-1 text-silver-100">{project.client_name}</dd>
            </div>
          )}
          {completion && (
            <div>
              <dt className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-silver-500">
                <Calendar className="h-3.5 w-3.5" aria-hidden /> Completed
              </dt>
              <dd className="mt-1 text-silver-100">{completion}</dd>
            </div>
          )}
          <div className="col-span-2">
            <dt className="text-xs uppercase tracking-widest text-silver-500">Technologies</dt>
            <dd className="mt-2 flex flex-wrap gap-1.5">
              {project.technologies.length > 0 ? project.technologies.map((tech) => <TechChip key={tech}>{tech}</TechChip>) : <span className="text-silver-500">Not specified</span>}
            </dd>
          </div>
        </dl>
      </header>

      <div className="mt-10 overflow-hidden rounded-2xl border border-white/10 bg-ink-850">
        <div className="aspect-[16/8]">
          {project.cover_image ? (
            <SafeImage src={project.cover_image} alt={project.cover_alt || `${project.title} cover`} className="h-full w-full object-cover" />
          ) : (
            <CoverPlaceholder title={project.title} />
          )}
        </div>
      </div>

      <div className="mt-14 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-10">
          <TextBlock index="01" title="Overview" text={project.description} />
          <TextBlock index="02" title="Objectives" text={project.objectives} />
        </div>
        <div className="space-y-10">
          <TextBlock index="03" title="The problem" text={project.problem_statement} />
          <TextBlock index="04" title="The solution" text={project.solution} />
        </div>
      </div>

      {project.images.length > 0 && (
        <section className="mt-16">
          <h2 className="eyebrow">
            <span className="mr-2 text-silver-500">05</span>Screenshots
          </h2>
          <div className="mt-5">
            <ProjectGallery images={project.images} title={project.title} />
          </div>
        </section>
      )}

      {project.related_projects.length > 0 && (
        <section className="mt-20">
          <h2 className="font-display text-2xl font-semibold text-white">Related projects</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {project.related_projects.map((related) => (
              <ProjectCard key={related.id} project={related} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
