"use client";

import { ErrorState } from "@/components/ui/States";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <ErrorState message="Something went wrong while loading this page." onRetry={reset} />
    </main>
  );
}
