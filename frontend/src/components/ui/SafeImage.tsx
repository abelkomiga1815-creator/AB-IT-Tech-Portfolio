"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/utils/cn";

/** Plain <img> with a graceful fallback: media is served by the backend / S3, not the Next.js image optimiser. */
export function SafeImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className={cn("flex items-center justify-center bg-ink-800 text-silver-500", className)} role="img" aria-label={alt || "Image unavailable"}>
        <ImageOff className="h-6 w-6" aria-hidden />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={className} />
  );
}
