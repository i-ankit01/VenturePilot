"use client";

import { useState } from "react";
import { PartialResult } from "@/lib/api";
import {
  ThumbsUp, ThumbsDown, DollarSign, Zap,
  BookOpen, Target, Sparkles, Users, ChevronDown, ArrowUpRight, Crown
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props { data: NonNullable<PartialResult["competitor_output"]> }

const MONO = { fontFamily: "'DM Mono', monospace" };

function SectionLabel({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-blue-300/70" />
      <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30" style={MONO}>
        {children}
      </p>
    </div>
  );
}

// ─── Expandable competitor card ───────────────────────────────────────────────
function CompetitorCard({ c, index }: { c: any; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border backdrop-blur-xl transition-all duration-300",
        open
          ? "border-blue-400/25 bg-white/[0.04]"
          : "border-white/[0.06] bg-white/[0.02] hover:border-blue-400/20 hover:bg-white/[0.03]",
      )}
    >
      {/* Top edge glow when open */}
      <div className={cn(
        "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent transition-all duration-300",
        open ? "via-blue-400/50" : "via-blue-400/0 group-hover:via-blue-400/30"
      )} />

      {/* Card header — always visible, clickable */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        {/* Index badge */}
        <span
          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/10 ring-1 ring-blue-400/20 text-[10px] font-bold text-blue-300"
          style={MONO}
        >
          {index + 1}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-[13px] font-semibold text-white/90" style={MONO}>
              {c.name}
            </h3>
          </div>
          <p className="mt-0.5 text-[12px] text-white/45 line-clamp-1">{c.description}</p>
          {!open && (
            <p className="mt-1 text-[11px] text-white/30">
              {c.target_segment}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span
            className="flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/50"
            style={MONO}
          >
            <DollarSign className="h-3 w-3 text-white/30" />
            {c.pricing}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-white/30 transition-transform duration-300",
              open && "rotate-180"
            )}
          />
        </div>
      </button>

      {/* Expanded content */}
      <div className={cn(
        "overflow-hidden transition-all duration-300",
        open ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="border-t border-white/[0.05] px-4 pb-4 pt-3">
          <p className="mb-3 text-[12px] leading-relaxed text-white/50">
            <span className="text-white/30" style={MONO}>Target · </span>
            {c.target_segment}
          </p>

          <div className="grid grid-cols-2 gap-3">
            {/* Strengths */}
            <div className="rounded-xl border border-emerald-400/15 bg-emerald-500/[0.06] p-3">
              <div className="mb-2 flex items-center gap-1.5">
                <ThumbsUp className="h-3 w-3 text-emerald-400" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/70" style={MONO}>
                  Strengths
                </span>
              </div>
              <ul className="space-y-1.5">
                {c.strengths.map((s: string, j: number) => (
                  <li key={j} className="flex items-start gap-2 text-[12px] text-white/65">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-400/60" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="rounded-xl border border-rose-400/15 bg-rose-500/[0.06] p-3">
              <div className="mb-2 flex items-center gap-1.5">
                <ThumbsDown className="h-3 w-3 text-rose-400" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-400/70" style={MONO}>
                  Weaknesses
                </span>
              </div>
              <ul className="space-y-1.5">
                {c.weaknesses.map((w: string, j: number) => (
                  <li key={j} className="flex items-start gap-2 text-[12px] text-white/65">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-rose-400/60" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────
export function CompetitorPanel({ data }: Props) {
  const competitors = data.competitors ?? [];
  const featureGaps = data.feature_gaps ?? [];
  const underservedSegments = data.underserved_segments ?? [];
  const differentiators = data.suggested_differentiators ?? [];
  const sources = data.sources ?? [];

  return (
    <div className="space-y-4">
      {/* Market leader + pricing landscape — stat cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="group relative overflow-hidden rounded-xl border border-blue-400/20 bg-gradient-to-br from-blue-500/[0.08] via-white/[0.02] to-transparent p-5 backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />
          <div className="pointer-events-none absolute -bottom-8 -right-8 h-28 w-28 rounded-full bg-blue-500/10 blur-[50px]" />
          <div className="relative z-10">
            <div className="mb-2 flex items-center gap-2">
              <Crown className="h-3.5 w-3.5 text-amber-300/80" />
              <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-300/70" style={MONO}>
                Market Leader
              </p>
            </div>
            <p
              className="text-xl font-bold leading-tight bg-clip-text text-transparent"
              style={{ ...MONO, backgroundImage: "linear-gradient(90deg, rgb(147,197,253) 0%, rgba(96,165,250,0.85) 60%, rgba(255,255,255,0.7) 100%)" }}
            >
              {data.market_leader}
            </p>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-xl transition-all hover:border-blue-400/20">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/0 to-transparent transition-all group-hover:via-blue-400/30" />
          <div className="mb-2 flex items-center gap-2">
            <DollarSign className="h-3.5 w-3.5 text-blue-300/70" />
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30" style={MONO}>
              Pricing Landscape
            </p>
          </div>
          <p className="text-sm leading-relaxed text-white/75">{data.pricing_landscape}</p>
        </div>
      </div>

      {/* Suggested differentiators */}
      <div className="relative overflow-hidden rounded-xl border border-blue-400/15 bg-gradient-to-br from-blue-500/[0.06] to-transparent p-4 backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent" />
        <SectionLabel icon={Zap}>Suggested Differentiators</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {differentiators.map((item, i) => (
            <span
              key={i}
              className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-[12px] text-blue-200/90 shadow-[0_0_8px_rgba(96,165,250,0.1)] transition-all hover:border-blue-400/40 hover:shadow-[0_0_10px_rgba(96,165,250,0.25)]"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Competitor cards — expandable grid */}
      <div>
        <div className="mb-2 flex items-center gap-1.5">
          <Target className="h-3.5 w-3.5 text-blue-300/70" />
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30" style={MONO}>
            Competitors — click to expand
          </p>
        </div>
        <div className="space-y-2">
          {competitors.map((c, i) => (
            <CompetitorCard key={i} c={c} index={i} />
          ))}
        </div>
      </div>

      {/* Feature gaps + underserved segments */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-xl transition-all hover:border-blue-400/20">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/0 to-transparent transition-all group-hover:via-blue-400/30" />
          <SectionLabel icon={Sparkles}>Feature Gaps</SectionLabel>
          <ul className="space-y-2">
            {featureGaps.map((item, i) => (
              <li key={i} className="flex items-start gap-2 rounded-lg border border-white/[0.04] bg-white/[0.015] px-3 py-2 text-[12px] text-white/70">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-blue-400/60" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-xl transition-all hover:border-blue-400/20">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/0 to-transparent transition-all group-hover:via-blue-400/30" />
          <SectionLabel icon={Users}>Underserved Segments</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {underservedSegments.map((item, i) => (
              <span
                key={i}
                className="rounded-full border border-amber-400/20 bg-amber-500/[0.08] px-3 py-1.5 text-[12px] text-amber-200/80"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Sources — clickable link boxes */}
      <div className="rounded-xl border border-white/[0.05] bg-white/[0.01] p-4">
        <SectionLabel icon={BookOpen}>Sources</SectionLabel>
        {sources.length > 0 ? (
          <ul className="space-y-1.5">
            {sources.map((source, i) => (
              <li key={i}>
                <a
                  href={source.startsWith("http") ? source : `https://${source}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 transition-all hover:border-blue-400/25 hover:bg-blue-500/[0.05]"
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-500/10 ring-1 ring-blue-400/20">
                    <ArrowUpRight className="h-2.5 w-2.5 text-blue-300/70 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-blue-300" />
                  </span>
                  <span className="break-all text-[11px] leading-relaxed text-blue-300/60 transition-colors group-hover:text-blue-300/90">
                    {source}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-white/30">No sources were returned for this run.</p>
        )}
      </div>
    </div>
  );
}