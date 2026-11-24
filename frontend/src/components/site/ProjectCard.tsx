import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ProjectStatusBadge, TechChip } from "@/components/ui/Badge";
import { SafeImage } from "@/components/ui/SafeImage";
import type { ProjectCardData } from "@/types/api";
import { initials } from "@/utils/format";

export function CoverPlaceholder({ title }: { title: string }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-ink-700 via-ink-800 to-ink-900">
      <div className="bg-grid absolute inset-0 opacity-70" aria-hidden />
      <span className="relative font-display text-5xl font-semibold text-volt-300/70">{initials(title)}</span>
    </div>
  );
}

export function ProjectCard({ project }: { project: ProjectCardData }) {
  const visibleTech = project.technologies.slice(0, 4);
  const extra = project.technologies.length - visibleTech.length;
  return (
    <article className="brackets group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink-850/70 shadow-card transition duration-300 hover:-translate-y-1 hover:border-cyan-400/30">
      <div className="relative aspect-[16/10] overflow-hidden">
        {project.cover_image ? (
          <SafeImage
            src={project.cover_image}
            alt={project.cover_alt || `${project.title} cover`}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <CoverPlaceholder title={project.title} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/80 via-transparent to-transparent" aria-hidden />
        {project.category && (
          <span className="absolute left-3 top-3 rounded-md bg-ink-950/80 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-cyan-300 backdrop-blur">
            {project.category.name}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg font-semibold leading-snug text-white">
            <Link href={`/projects/${project.slug}`} className="after:absolute after:inset-0 after:content-['']">
              {project.title}
            </Link>
          </h3>
          <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-silver-500 transition group-hover:text-cyan-400" aria-hidden />
        </div>
        <p className="line-clamp-2 text-sm text-silver-400">{project.short_description}</p>
        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
          {visibleTech.map((tech) => (
            <TechChip key={tech}>{tech}</TechChip>
          ))}
          {extra > 0 && <TechChip>+{extra}</TechChip>}
        </div>
        {project.project_status !== "completed" && (
          <div>
            <ProjectStatusBadge status={project.project_status} />
          </div>
        )}
      </div>
    </article>
  );
}
