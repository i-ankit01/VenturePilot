"use client";
// components/pitch/DeckViewer.tsx

import { useState, useRef, useEffect } from "react";
import { PitchOutput } from "@/types/pitch";
import { SlideRenderer, SLIDE_COUNT, getSlideTitle } from "./SlideRenderer";
import { ChevronLeft, ChevronRight, Download, Loader2 } from "lucide-react";

const SLIDE_W = 1280;
const SLIDE_H = 720;
const ARROW_SPACE = 112;

const MONO = { fontFamily: "'DM Mono', monospace" };
const NEON  = "linear-gradient(90deg, rgb(147,197,253) 0%, rgba(96,165,250,0.85) 60%, rgba(255,255,255,0.7) 100%)";

interface Props {
  data: PitchOutput;
}

export function DeckViewer({ data }: Props) {
  const [active, setActive]     = useState(0);
  const [scale, setScale]       = useState(1);
  const [exporting, setExporting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function updateScale() {
      if (!containerRef.current) return;
      const availableWidth  = Math.max(containerRef.current.clientWidth - ARROW_SPACE, 0);
      const reservedHeight  = 260;
      const availableHeight = Math.max(window.innerHeight - reservedHeight, 0);
      const widthScale  = availableWidth / SLIDE_W;
      const heightScale = availableHeight / SLIDE_H;
      setScale(Math.min(widthScale, heightScale, 1));
    }

    updateScale();
    const ro = new ResizeObserver(updateScale);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener("resize", updateScale);
    return () => { ro.disconnect(); window.removeEventListener("resize", updateScale); };
  }, []);

  function goTo(i: number) {
    setActive(Math.max(0, Math.min(SLIDE_COUNT - 1, i)));
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") goTo(active + 1);
      if (e.key === "ArrowLeft")  goTo(active - 1);
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
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
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

  const slideTitle = getSlideTitle(data, active);
  const progress   = ((active + 1) / SLIDE_COUNT) * 100;

  return (
    <div className="flex flex-col gap-5 overflow-x-hidden">

      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-400/20 bg-gradient-to-br from-blue-500/[0.08] via-white/[0.015] to-transparent px-5 py-4 backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />
        <div className="pointer-events-none absolute -top-10 -right-10 h-36 w-36 rounded-full bg-blue-500/10 blur-[70px]" />
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <h2
              className="truncate text-lg font-bold bg-clip-text text-transparent"
              style={{ ...MONO, backgroundImage: NEON }}
            >
              {data.deck_title}
            </h2>
            <span
              className="hidden whitespace-nowrap rounded-full border border-blue-400/20 bg-blue-500/[0.08] px-2.5 py-0.5 text-[11px] text-blue-300 sm:inline-block"
              style={MONO}
            >
              {data.total_slides} slides
            </span>
            <span
              className="hidden whitespace-nowrap rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-0.5 text-[11px] text-white/40 sm:inline-block"
              style={MONO}
            >
              {data.recommended_duration}
            </span>
          </div>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex shrink-0 items-center gap-2 rounded-lg bg-white px-4 py-2 text-[13px] font-medium text-[#0A0A0B] shadow-lg shadow-blue-400/15 transition-all hover:bg-white/90 disabled:opacity-50"
            style={MONO}
          >
            {exporting
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Download className="h-4 w-4" />
            }
            {exporting ? "Exporting…" : "Download PDF"}
          </button>
        </div>
      </div>

      {/* ── Main area ── */}
      <div className="grid grid-cols-[200px_minmax(0,1fr)] gap-4">

        {/* Slide navigator */}
        <div
          className="space-y-0.5 overflow-y-auto pr-1"
          style={{ maxHeight: Math.round(SLIDE_H * scale) }}
        >
          {Array.from({ length: SLIDE_COUNT }).map((_, i) => {
            const isActive = active === i;
            const title    = getSlideTitle(data, i);
            return (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`group relative flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all duration-150 ${
                  isActive
                    ? "border border-blue-400/25 bg-blue-500/[0.08] text-white/90"
                    : "border border-transparent text-white/40 hover:bg-white/[0.04] hover:text-white/70"
                }`}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.8)]" />
                )}
                <span
                  className={`w-5 shrink-0 text-[10px] font-semibold ${isActive ? "text-blue-300" : "text-white/20"}`}
                  style={MONO}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="truncate text-[11px] font-medium" style={MONO}>
                  {title}
                </span>
              </button>
            );
          })}
        </div>

        {/* Slide viewer */}
        <div className="flex min-w-0 flex-col gap-3">
          <div
            ref={containerRef}
            className="relative w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-black shadow-2xl"
            style={{ height: Math.round(SLIDE_H * scale) }}
          >
            {/* Slide content — centered */}
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

            {/* Prev arrow */}
            <button
              onClick={() => goTo(active - 1)}
              disabled={active === 0}
              aria-label="Previous slide"
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/[0.12] bg-black/60 text-white/70 backdrop-blur-xl transition-all hover:border-white/25 hover:bg-black/80 hover:text-white disabled:opacity-0"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Next arrow */}
            <button
              onClick={() => goTo(active + 1)}
              disabled={active === SLIDE_COUNT - 1}
              aria-label="Next slide"
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/[0.12] bg-black/60 text-white/70 backdrop-blur-xl transition-all hover:border-white/25 hover:bg-black/80 hover:text-white disabled:opacity-0"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Slide number badge (top-right corner) */}
            <div className="absolute right-3 top-3 rounded-full border border-white/[0.12] bg-black/60 px-2.5 py-1 text-[10px] text-white/50 backdrop-blur-xl" style={MONO}>
              {active + 1} / {SLIDE_COUNT}
            </div>
          </div>

          {/* Progress + caption row */}
          <div className="space-y-2">
            {/* Progress bar */}
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-blue-400 transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  boxShadow: "0 0 8px rgba(96,165,250,0.7)",
                }}
              />
            </div>

            {/* Caption */}
            <div className="flex items-center justify-between px-1">
              <p className="text-[12px] text-white/45" style={MONO}>
                <span className="text-white/25">Slide {active + 1} — </span>
                {slideTitle}
              </p>
              <p className="text-[11px] text-white/20" style={MONO}>← → to navigate</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}