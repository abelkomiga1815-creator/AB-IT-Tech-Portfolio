"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import type { GalleryImage } from "@/types/api";

export function ProjectGallery({ images, title }: { images: GalleryImage[]; title: string }) {
  const [active, setActive] = useState<number | null>(null);

  const close = useCallback(() => setActive(null), []);
  const step = useCallback(
    (delta: number) => setActive((current) => (current === null ? null : (current + delta + images.length) % images.length)),
    [images.length],
  );

  useEffect(() => {
    if (active === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, close, step]);

  if (images.length === 0) return null;
  const current = active !== null ? images[active] : null;

  return (
    <>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((image, index) => (
          <li key={image.id}>
            <button
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Open screenshot ${index + 1} of ${images.length}`}
              className="brackets group block w-full overflow-hidden rounded-xl border border-white/10 bg-ink-850 text-left"
            >
              <SafeImage
                src={image.image}
                alt={image.alt_text || image.caption || `${title} screenshot ${index + 1}`}
                className="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-105"
              />
              {image.caption && <span className="block px-3 py-2 text-xs text-silver-400">{image.caption}</span>}
            </button>
          </li>
        ))}
      </ul>

      <AnimatePresence>
        {current && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`${title} screenshots`}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-ink-950/95 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          >
            <button type="button" aria-label="Close" onClick={close} className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
              <X className="h-5 w-5" />
            </button>
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous screenshot"
                  onClick={(event) => {
                    event.stopPropagation();
                    step(-1);
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  aria-label="Next screenshot"
                  onClick={(event) => {
                    event.stopPropagation();
                    step(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
            <figure className="max-h-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={current.image}
                alt={current.alt_text || current.caption || `${title} screenshot`}
                className="max-h-[78vh] w-auto rounded-lg object-contain"
              />
              <figcaption className="mt-3 text-center text-sm text-silver-300">
                {current.caption && <span>{current.caption} - </span>}
                <span className="font-mono text-silver-500">
                  {(active ?? 0) + 1} / {images.length}
                </span>
              </figcaption>
            </figure>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
