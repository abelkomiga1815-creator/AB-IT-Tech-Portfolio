import type { ReactNode } from "react";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold text-white sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-silver-400">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Notice({ tone, children }: { tone: "error" | "success"; children: ReactNode }) {
  const classes =
    tone === "error"
      ? "border-red-500/30 bg-red-500/10 text-red-200"
      : "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-lg border px-4 py-3 text-sm ${classes}`}>
      {children}
    </div>
  );
}
