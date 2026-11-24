import Link from "next/link";

/**
 * Temporary text-based brand treatment. Replace the contents of this component with the
 * official logo once the source artwork is available.
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" aria-label="AB IT Tech Solution - home" className={`group inline-flex items-center gap-3 ${className}`}>
      <span className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-ink-800 font-mono text-sm font-bold text-volt-300 ring-1 ring-white/10">
        <span className="absolute -left-px -top-px h-2.5 w-2.5 rounded-tl-md border-l-2 border-t-2 border-cyan-400" aria-hidden />
        <span className="absolute -bottom-px -right-px h-2.5 w-2.5 rounded-br-md border-b-2 border-r-2 border-cyan-400" aria-hidden />
        AB
      </span>
      <span className="leading-none">
        <span className="block font-display text-[15px] font-semibold tracking-wide text-white">AB IT TECH</span>
        <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-400">Solution</span>
      </span>
    </Link>
  );
}
