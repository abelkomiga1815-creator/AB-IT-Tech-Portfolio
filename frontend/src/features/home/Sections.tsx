import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProjectCard } from "@/components/site/ProjectCard";
import { SectionHeading } from "@/components/site/SectionHeading";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { Reveal } from "@/components/ui/Reveal";
import { capabilities } from "@/lib/capabilities";
import { siteConfig } from "@/lib/config";
import type { Category, ProjectCardData } from "@/types/api";

export function FeaturedProjects({ projects }: { projects: ProjectCardData[] }) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
      <SectionHeading
        index="01"
        eyebrow="Selected work"
        title="Featured projects"
        description="A hand-picked selection from the portfolio."
        action={
          <ButtonLink href="/projects" variant="secondary" size="sm">
            All projects <ArrowRight className="h-4 w-4" aria-hidden />
          </ButtonLink>
        }
      />
      <div className="mt-10">
        {projects.length === 0 ? (
          <EmptyState title="No featured projects yet" description="Featured projects will appear here once they are published." />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, index) => (
              <Reveal key={project.id} delay={index * 0.06}>
                <ProjectCard project={project} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function CategoriesSection({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
      <SectionHeading index="02" eyebrow="Browse by type" title="Project categories" />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category, index) => (
          <Reveal key={category.id} delay={index * 0.05}>
            <Link
              href={`/projects?category=${encodeURIComponent(category.slug)}`}
              className="brackets group flex h-full flex-col rounded-xl border border-white/10 bg-ink-850/60 p-6 transition hover:border-cyan-400/30"
            >
              <span className="font-mono text-xs text-cyan-400">{String(index + 1).padStart(2, "0")}</span>
              <span className="mt-3 font-display text-xl font-semibold text-white">{category.name}</span>
              {category.description && <span className="mt-2 line-clamp-2 text-sm text-silver-400">{category.description}</span>}
              <span className="mt-auto flex items-center justify-between pt-5 text-sm text-silver-300">
                {category.project_count} project{category.project_count === 1 ? "" : "s"}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1 group-hover:text-cyan-400" aria-hidden />
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function CapabilitiesSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
      <SectionHeading
        index="03"
        eyebrow="What we do"
        title="Technology capabilities"
        description="The disciplines behind the projects in this portfolio."
      />
      <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
        {capabilities.map(({ title, description, icon: Icon }) => (
          <div key={title} className="bg-ink-900 p-6 transition hover:bg-ink-850">
            <Icon className="h-6 w-6 text-cyan-400" aria-hidden />
            <h3 className="mt-4 font-display text-base font-semibold text-white">{title}</h3>
            <p className="mt-2 text-sm text-silver-400">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CtaSection() {
  const href = siteConfig.email ? `mailto:${siteConfig.email}?subject=Project%20enquiry` : "/contact";
  return (
    <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
      <div className="relative overflow-hidden rounded-3xl border border-volt-400/20 bg-gradient-to-br from-ink-700 via-ink-800 to-ink-900 p-10 sm:p-14">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
        <div className="relative max-w-2xl">
          <p className="eyebrow">Next project</p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-white sm:text-4xl">Have something in mind? Let&apos;s build it.</h2>
          <p className="mt-4 text-silver-300">Tell us about the problem you need solved and we will come back with a clear plan.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href={href} size="lg">
              Start a project
            </ButtonLink>
            <ButtonLink href="/projects" size="lg" variant="secondary">
              See our work
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
