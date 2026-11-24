import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/utils/cn";

function pageList(current: number, total: number): Array<number | "gap"> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result: Array<number | "gap"> = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) result.push("gap");
    result.push(page);
  });
  return result;
}

export function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  if (totalPages <= 1) return null;
  const base = "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm transition";
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-1.5">
      <button
        type="button"
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className={cn(base, "border-white/10 text-silver-300 hover:border-cyan-400/50 disabled:opacity-40")}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pageList(page, totalPages).map((item, index) =>
        item === "gap" ? (
          <span key={`gap-${index}`} className="px-1 text-silver-500">
            ...
          </span>
        ) : (
          <button
            key={item}
            type="button"
            aria-current={item === page ? "page" : undefined}
            onClick={() => onChange(item)}
            className={cn(
              base,
              item === page ? "border-volt-400 bg-volt-500/20 text-white" : "border-white/10 text-silver-300 hover:border-cyan-400/50",
            )}
          >
            {item}
          </button>
        ),
      )}
      <button
        type="button"
        aria-label="Next page"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className={cn(base, "border-white/10 text-silver-300 hover:border-cyan-400/50 disabled:opacity-40")}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
