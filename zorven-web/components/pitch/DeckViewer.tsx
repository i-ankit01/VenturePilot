"use client";
// components/pitch/DeckViewer.tsx

import { useState, useRef, useEffect } from "react";
import { PitchOutput } from "@/types/pitch";
import { SlideRenderer, SLIDE_COUNT, getSlideTitle } from "./SlideRenderer";
import { ChevronLeft, ChevronRight, Download, Loader2 } from "lucide-react";

const SLIDE_W = 1280;
const SLIDE_H = 720;

interface Props {
  data: PitchOutput;
  projectId?: string;
}

export function DeckViewer({ data, projectId }: Props) {
  const [active, setActive] = useState(0);
  const [scale, setScale] = useState(1);
  const [exporting, setExporting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Responsive scaling — fit 1280x720 frame into available width
  useEffect(() => {
    function updateScale() {
      if (!containerRef.current) return;
      const availableWidth = containerRef.current.offsetWidth;
      const newScale = Math.min(availableWidth / SLIDE_W, 1);
      setScale(newScale);
    }
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  function goTo(i: number) {
    setActive(Math.max(0, Math.min(SLIDE_COUNT - 1, i)));
  }

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") goTo(active + 1);
      if (e.key === "ArrowLeft") goTo(active - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  async function handleExport() {
    if (!projectId) return;
    setExporting(true);
    try {
      const res = await fetch(`/api/pitch/export?projectId=${projectId}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data.deck_title.replace(/\s+/g, "_").toLowerCase()}.pdf`;
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
    <div className="flex flex-col gap-5">
      {/* Header bar */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
        <p
          className="text-[10px] font-semibold uppercase tracking-widest text-primary/60"
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          Deck
        </p>
        <div className="mt-1 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
              {data.deck_title}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{data.pitch_narrative_summary}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-primary/70">
              <span className="rounded-sm border border-primary/20 bg-background/50 px-2 py-0.5">
                {data.total_slides} slides
              </span>
              <span className="rounded-sm border border-primary/20 bg-background/50 px-2 py-0.5">
                {data.recommended_duration}
              </span>
            </div>
          </div>

          <button
            onClick={handleExport}
            disabled={exporting || !projectId}
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

      {/* Navigator + viewport */}
      <div className="grid grid-cols-[200px_1fr] gap-4">
        {/* Slide navigator */}
        <div className="space-y-1 overflow-y-auto max-h-[600px]">
          {Array.from({ length: SLIDE_COUNT }).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[12px] transition-all ${
                active === i
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:bg-muted/30 hover:text-foreground border border-transparent"
              }`}
            >
              <span
                className="w-5 shrink-0 text-[10px] text-muted-foreground/40"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                {i + 1}
              </span>
              <span className="truncate">{getSlideTitle(data, i)}</span>
            </button>
          ))}
        </div>

        {/* Slide viewport */}
        <div className="flex flex-col gap-3">
          <div
            ref={containerRef}
            className="relative w-full overflow-hidden rounded-xl border border-border/50 bg-black"
            style={{ height: SLIDE_H * scale }}
          >
            <div
              style={{
                width: SLIDE_W,
                height: SLIDE_H,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }}
            >
              <SlideRenderer data={data} index={active} />
            </div>

            {/* Arrow nav */}
            <button
              onClick={() => goTo(active - 1)}
              disabled={active === 0}
              aria-label="Previous slide"
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition-opacity hover:bg-black/70 disabled:opacity-0"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => goTo(active + 1)}
              disabled={active === SLIDE_COUNT - 1}
              aria-label="Next slide"
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition-opacity hover:bg-black/70 disabled:opacity-0"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center justify-between px-1">
            <p className="text-[12px] text-muted-foreground">
              Slide {active + 1} of {SLIDE_COUNT} — {getSlideTitle(data, active)}
            </p>
            <p className="text-[11px] text-muted-foreground/50" style={{ fontFamily: "'DM Mono', monospace" }}>
              ← → to navigate
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}