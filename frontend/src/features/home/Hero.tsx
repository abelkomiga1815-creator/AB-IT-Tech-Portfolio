"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Terminal } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { siteConfig } from "@/lib/config";
import type { Category } from "@/types/api";

export function Hero({ projectCount, categories }: { projectCount: number | null; categories: Category[] }) {
  const reduce = useReducedMotion();
  const item = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 22 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <section className="relative overflow-hidden">
      <div className="bg-grid pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-20 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:pt-28">
        <div>
          <motion.p {...item(0)} className="eyebrow">
            <span className="mr-2 inline-block h-1.5 w-1.5 animate-pulse-dot rounded-full bg-cyan-400 align-middle" />
            {siteConfig.name} / Portfolio
          </motion.p>
          <motion.h1
            {...item(0.08)}
            className="mt-5 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl"
          >
            Digital products,
            <br />
            <span className="text-gradient">engineered to last.</span>
          </motion.h1>
          <motion.p {...item(0.16)} className="mt-6 max-w-xl text-lg text-silver-400">
            Websites, web applications, mobile apps and management systems designed and built by {siteConfig.name}. Browse the work,
            open the live demos, read how each problem was solved.
          </motion.p>
          <motion.div {...item(0.24)} className="mt-9 flex flex-wrap gap-3">
            <ButtonLink href="/projects" size="lg">
              View projects <ArrowRight className="h-4 w-4" aria-hidden />
            </ButtonLink>
            <ButtonLink href="/contact" size="lg" variant="secondary">
              Get in touch
            </ButtonLink>
          </motion.div>
        </div>

        <motion.div {...item(0.3)} className="glass brackets relative overflow-hidden rounded-2xl shadow-card" aria-label="Portfolio overview">
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
            <span className="ml-2 flex items-center gap-1.5 font-mono text-xs text-silver-500">
              <Terminal className="h-3.5 w-3.5" aria-hidden /> portfolio
            </span>
          </div>
          <div className="relative space-y-1.5 p-5 font-mono text-sm">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-16 animate-scan bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent" aria-hidden />
            <p className="text-silver-500">
              <span className="text-cyan-400">$</span> ls projects/
            </p>
            {categories.length > 0 ? (
              categories.slice(0, 6).map((category, index, list) => (
                <p key={category.id} className="text-silver-200">
                  <span className="text-silver-500">{index === list.length - 1 ? "└─" : "├─"}</span> {category.slug}/{" "}
                  <span className="text-volt-300">({category.project_count})</span>
                </p>
              ))
            ) : (
              <p className="text-silver-500">no categories published yet</p>
            )}
            <p className="pt-3 text-silver-500">
              <span className="text-cyan-400">$</span> count --published
            </p>
            <p className="text-silver-100">{projectCount === null ? "unavailable" : `${projectCount} project${projectCount === 1 ? "" : "s"}`}</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
