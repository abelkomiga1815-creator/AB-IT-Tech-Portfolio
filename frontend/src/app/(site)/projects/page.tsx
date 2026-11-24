import type { Metadata } from "next";
import { Suspense } from "react";
import { SectionHeading } from "@/components/site/SectionHeading";
import { LoadingState } from "@/components/ui/States";
import { ProjectsExplorer } from "@/features/projects/ProjectsExplorer";

export const metadata: Metadata = {
  title: "Projects",
  description: "Browse websites, web applications, mobile apps and management systems.",
};

export default function ProjectsPage() {
  return (
    <section className="mx-auto max-w-7xl px-5 pt-16 sm:px-8">
      <SectionHeading eyebrow="Portfolio" title="Projects" description="Search and filter everything we have published." />
      <div className="mt-10">
        <Suspense fallback={<LoadingState label="Loading projects..." />}>
          <ProjectsExplorer />
        </Suspense>
      </div>
    </section>
  );
}
