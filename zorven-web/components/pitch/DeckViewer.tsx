"use client";
// components/pitch/DeckViewer.tsx

import { useState, useRef, useEffect } from "react";
import { PitchOutput } from "@/types/pitch";
import { SlideRenderer, SLIDE_COUNT, getSlideTitle } from "./SlideRenderer";
import { ChevronLeft, ChevronRight, Download, Loader2 } from "lucide-react";

const SLIDE_W = 1280;
const SLIDE_H = 720;
const ARROW_SPACE = 112; // 56px left + 56px right

interface Props {
  data: PitchOutput;
}

export function DeckViewer({ data }: Props) {
  const [active, setActive] = useState(0);
  const [scale, setScale] = useState(1);
  const [exporting, setExporting] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function updateScale() {
      if (!containerRef.current) return;

      const availableWidth = Math.max(
        containerRef.current.clientWidth - ARROW_SPACE,
        0
      );

      // Header + footer/nav area reservation
      const reservedHeight = 260;
      const availableHeight = Math.max(
        window.innerHeight - reservedHeight,
        0
      );

      const widthScale = availableWidth / SLIDE_W;
      const heightScale = availableHeight / SLIDE_H;

      setScale(Math.min(widthScale, heightScale, 1));
    }

    updateScale();

    const resizeObserver = new ResizeObserver(updateScale);

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener("resize", updateScale);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateScale);
    };
  }, []);

  function goTo(i: number) {
    setActive(Math.max(0, Math.min(SLIDE_COUNT - 1, i)));
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") goTo(active + 1);
      if (e.key === "ArrowLeft") goTo(active - 1);
    }

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  async function handleExport() {
    setExporting(true);

    try {
      const res = await fetch(`/api/pitch/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pitch_output: data }),
      });

      if (!res.ok) {
        throw new Error("Export failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${data.deck_title
        .replace(/\s+/g, "_")
        .toLowerCase()}.pdf`;

      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 overflow-x-hidden">
      {/* Header */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <h2
              className="truncate text-lg font-bold text-foreground"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              {data.deck_title}
            </h2>

            <span className="hidden whitespace-nowrap rounded-sm border border-primary/20 bg-background/50 px-2 py-0.5 text-[11px] text-primary/70 sm:inline-block">
              {data.total_slides} slides
            </span>

            <span className="hidden whitespace-nowrap rounded-sm border border-primary/20 bg-background/50 px-2 py-0.5 text-[11px] text-primary/70 sm:inline-block">
              {data.recommended_duration}
            </span>
          </div>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex shrink-0 items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}

            {exporting ? "Exporting…" : "Download PDF"}
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="grid grid-cols-[200px_minmax(0,1fr)] gap-4">
        {/* Slide Navigator */}
        <div
          className="space-y-1 overflow-y-auto pr-1"
          style={{ maxHeight: Math.round(SLIDE_H * scale) }}
        >
          {Array.from({ length: SLIDE_COUNT }).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[12px] transition-all ${
                active === i
                  ? "border border-primary/20 bg-primary/10 text-primary"
                  : "border border-transparent text-muted-foreground hover:bg-muted/30 hover:text-foreground"
              }`}
            >
              <span
                className="w-5 shrink-0 text-[10px] text-muted-foreground/40"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                {i + 1}
              </span>

              <span className="truncate">
                {getSlideTitle(data, i)}
              </span>
            </button>
          ))}
        </div>

        {/* Slide Viewer */}
        <div className="min-w-0 flex flex-col gap-3">
          <div
            ref={containerRef}
            className="relative w-full overflow-hidden rounded-xl border border-border/50 bg-black"
            style={{
              height: Math.round(SLIDE_H * scale),
            }}
          >
            {/* Centered slide */}
            <div className="flex h-full justify-center">
              <div
                style={{
                  width: SLIDE_W,
                  height: SLIDE_H,
                  transform: `scale(${scale})`,
                  transformOrigin: "top center",
                }}
              >
                <SlideRenderer data={data} index={active} />
              </div>
            </div>

            {/* Previous */}
            <button
              onClick={() => goTo(active - 1)}
              disabled={active === 0}
              aria-label="Previous slide"
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition-opacity hover:bg-black/70 disabled:opacity-0"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Next */}
            <button
              onClick={() => goTo(active + 1)}
              disabled={active === SLIDE_COUNT - 1}
              aria-label="Next slide"
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition-opacity hover:bg-black/70 disabled:opacity-0"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center justify-between px-1">
            <p className="text-[12px] text-muted-foreground">
              Slide {active + 1} of {SLIDE_COUNT} —{" "}
              {getSlideTitle(data, active)}
            </p>

            <p
              className="text-[11px] text-muted-foreground/50"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              ← → to navigate
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}