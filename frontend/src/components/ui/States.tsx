import type { ReactNode } from "react";
import { AlertTriangle, Inbox, Loader2 } from "lucide-react";
import { Button } from "./Button";

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-16 text-sm text-silver-400">
      <Loader2 className="h-5 w-5 animate-spin text-cyan-400" aria-hidden />
      {label}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="mx-auto max-w-md rounded-xl border border-red-500/25 bg-red-500/5 p-6 text-center">
      <AlertTriangle className="mx-auto h-8 w-8 text-red-300" aria-hidden />
      <p className="mt-3 text-sm text-silver-200">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mx-auto max-w-md rounded-xl border border-dashed border-white/15 p-10 text-center">
      <Inbox className="mx-auto h-8 w-8 text-silver-500" aria-hidden />
      <h3 className="mt-3 font-display text-lg text-white">{title}</h3>
      {description && <p className="mt-1 text-sm text-silver-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
