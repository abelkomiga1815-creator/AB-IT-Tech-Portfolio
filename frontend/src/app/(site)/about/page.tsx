import type { Metadata } from "next";
import { SectionHeading } from "@/components/site/SectionHeading";
import { ButtonLink } from "@/components/ui/Button";
import { CapabilitiesSection } from "@/features/home/Sections";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "About",
  description: `About ${siteConfig.name} and how this portfolio is organised.`,
};

export default function AboutPage() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-5 pt-20 sm:px-8">
        <SectionHeading eyebrow="About" title={`About ${siteConfig.name}`} />
        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          <div className="space-y-4 text-silver-300">
            <p>
              {siteConfig.name} is a technology company that designs and builds software: websites, web applications, mobile apps and
              management systems for organisations that need dependable digital tools.
            </p>
            <p>
              This portfolio collects that work in one place. Each project page explains the objectives, the problem that had to be
              solved, the solution that was built and the technologies behind it - with screenshots, and where appropriate a live
              demonstration or source code link.
            </p>
          </div>
          <div className="glass rounded-2xl p-6">
            <h2 className="font-display text-lg text-white">How to use this portfolio</h2>
            <ul className="mt-4 space-y-3 text-sm text-silver-300">
              <li>
                <span className="mr-2 font-mono text-cyan-400">01</span>Browse all projects or filter by category.
              </li>
              <li>
                <span className="mr-2 font-mono text-cyan-400">02</span>Search by name, technology or keyword.
              </li>
              <li>
                <span className="mr-2 font-mono text-cyan-400">03</span>Open a project for the full story and related work.
              </li>
            </ul>
            <ButtonLink href="/projects" className="mt-6">
              Browse projects
            </ButtonLink>
          </div>
        </div>
      </section>
      <CapabilitiesSection />
    </>
  );
}
