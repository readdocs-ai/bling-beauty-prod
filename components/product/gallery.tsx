"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/components/utils/cn";

type Props = { images: string[]; alt: string };

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function ProductGallery({ images, alt }: Props) {
  const clean = useMemo(() => images.filter(Boolean), [images]);
  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(false);
  const startX = useRef<number | null>(null);

  const main = clean[idx] ?? clean[0];

  // Keyboard controls (when lightbox open)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowRight") setIdx((v) => clamp(v + 1, 0, clean.length - 1));
      if (e.key === "ArrowLeft") setIdx((v) => clamp(v - 1, 0, clean.length - 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, clean.length]);

  function prev() {
    setIdx((v) => clamp(v - 1, 0, clean.length - 1));
  }
  function next() {
    setIdx((v) => clamp(v + 1, 0, clean.length - 1));
  }

  return (
    <div className="grid gap-4">
      <button
        type="button"
        onClick={() => main && setOpen(true)}
        className={cn(
          "group relative overflow-hidden rounded-3xl border border-soft-black/10 bg-white shadow-soft",
          "focus:outline-none focus:ring-2 focus:ring-champagne/30"
        )}
        aria-label="Open image gallery"
      >
        <div
          className="relative aspect-[4/3]"
          onPointerDown={(e) => (startX.current = e.clientX)}
          onPointerUp={(e) => {
            if (startX.current == null) return;
            const dx = e.clientX - startX.current;
            startX.current = null;
            if (Math.abs(dx) < 40) return;
            if (dx < 0) next();
            else prev();
          }}
        >
          {main ? (
            <Image
              src={main}
              alt={alt}
              fill
              className="object-cover transition duration-500 group-hover:scale-[1.01]"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-sm text-soft-black/60">No image</div>
          )}
        </div>

        {clean.length > 1 && (
          <>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4">
              <div className="flex justify-center gap-2">
                {clean.slice(0, 10).map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-1.5 w-1.5 rounded-full bg-soft-black/25",
                      i === idx && "bg-soft-black/70"
                    )}
                  />
                ))}
              </div>
            </div>

            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3 opacity-0 transition group-hover:opacity-100">
              <div className="grid h-10 w-10 place-items-center rounded-full border border-soft-black/10 bg-white/80 text-soft-black shadow-soft">
                ‹
              </div>
            </div>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 opacity-0 transition group-hover:opacity-100">
              <div className="grid h-10 w-10 place-items-center rounded-full border border-soft-black/10 bg-white/80 text-soft-black shadow-soft">
                ›
              </div>
            </div>
          </>
        )}
      </button>

      {clean.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {clean.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setIdx(i)}
              className={cn(
                "relative h-16 w-20 flex-none overflow-hidden rounded-2xl border bg-white shadow-soft transition",
                i === idx ? "border-soft-black/40" : "border-soft-black/10 hover:border-soft-black/25"
              )}
              aria-label={`View image ${i + 1}`}
            >
              <Image src={src} alt={`${alt} thumbnail ${i + 1}`} fill className="object-cover" sizes="80px" />
            </button>
          ))}
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-luxe">
            <div className="flex items-center justify-between border-b border-soft-black/10 px-5 py-4">
              <div className="text-sm font-medium text-soft-black/80">
                {idx + 1} / {clean.length}
              </div>
              <button
                className="rounded-xl px-3 py-2 text-sm hover:bg-soft-black/5"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="relative aspect-[16/10] bg-mist">
              {main && (
                <Image
                  src={main}
                  alt={alt}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 80vw"
                  priority
                />
              )}
              {clean.length > 1 && (
                <>
                  <button
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-soft-black/10 bg-white/80 px-4 py-3 text-xl shadow-soft hover:bg-white"
                    onClick={prev}
                    aria-label="Previous image"
                  >
                    ‹
                  </button>
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-soft-black/10 bg-white/80 px-4 py-3 text-xl shadow-soft hover:bg-white"
                    onClick={next}
                    aria-label="Next image"
                  >
                    ›
                  </button>
                </>
              )}
            </div>

            {clean.length > 1 && (
              <div className="flex gap-2 overflow-x-auto border-t border-soft-black/10 bg-white px-4 py-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {clean.map((src, i) => (
                  <button
                    key={src + i}
                    type="button"
                    onClick={() => setIdx(i)}
                    className={cn(
                      "relative h-14 w-16 flex-none overflow-hidden rounded-2xl border bg-white shadow-soft transition",
                      i === idx ? "border-soft-black/40" : "border-soft-black/10 hover:border-soft-black/25"
                    )}
                    aria-label={`Select image ${i + 1}`}
                  >
                    <Image src={src} alt={`${alt} thumb ${i + 1}`} fill className="object-cover" sizes="64px" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
