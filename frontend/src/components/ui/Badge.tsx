import type { ReactNode } from "react";
import type { ProjectStatus, PublicationStatus } from "@/types/api";
import { cn } from "@/utils/cn";
import { PROJECT_STATUS_LABELS } from "@/utils/format";

export function Badge({ children, tone = "neutral", className }: { children: ReactNode; tone?: "neutral" | "cyan" | "green" | "amber"; className?: string }) {
  const tones = {
    neutral: "border-white/10 bg-white/5 text-silver-300",
    cyan: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
    green: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    amber: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", tones[tone], className)}>
      {children}
    </span>
  );
}

export function PublicationBadge({ status }: { status: PublicationStatus }) {
  return status === "published" ? <Badge tone="green">Published</Badge> : <Badge tone="amber">Draft</Badge>;
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return <Badge tone={status === "completed" ? "cyan" : "neutral"}>{PROJECT_STATUS_LABELS[status]}</Badge>;
}

export function TechChip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-md border border-white/10 bg-ink-800/80 px-2 py-0.5 font-mono text-[11px] text-silver-300">{children}</span>
  );
}
