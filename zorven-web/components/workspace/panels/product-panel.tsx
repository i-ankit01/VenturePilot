import { PartialResult } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Package, DollarSign, Sparkles, Wrench, AlertTriangle, Rocket, CheckCircle2, Circle, ChevronRight } from "lucide-react";

interface Props { data: NonNullable<PartialResult["product_output"]> }

const MONO = { fontFamily: "'DM Mono', monospace" };

// ─── Priority config — semantic colors per urgency level ─────────────────────
const PRIORITY: Record<string, {
  border: string; leftBar: string; badge: string; dot: string;
}> = {
  "Must Have": {
    border:  "border-rose-400/20 hover:border-rose-400/35",
    leftBar: "bg-rose-400",
    badge:   "border-rose-400/30 bg-rose-500/[0.1] text-rose-300",
    dot:     "bg-rose-400 shadow-[0_0_6px_rgba(251,113,133,0.7)]",
  },
  "Should Have": {
    border:  "border-amber-400/20 hover:border-amber-400/35",
    leftBar: "bg-amber-400",
    badge:   "border-amber-400/30 bg-amber-500/[0.08] text-amber-300",
    dot:     "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]",
  },
  "Nice to Have": {
    border:  "border-blue-400/15 hover:border-blue-400/25",
    leftBar: "bg-blue-400",
    badge:   "border-blue-400/20 bg-blue-500/[0.08] text-blue-300",
    dot:     "bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.6)]",
  },
};

function fallbackPriority(p: string) {
  return PRIORITY[p] ?? PRIORITY["Nice to Have"];
}

function SectionLabel({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-blue-300/70" />
      <h3 className="text-[11px] font-semibold uppercase tracking-widest text-white/30" style={MONO}>
        {children}
      </h3>
    </div>
  );
}

// ─── Roadmap phase timeline node ──────────────────────────────────────────────
const PHASE_COLORS = [
  { ring: "ring-blue-400/40",   glow: "bg-blue-400",   text: "text-blue-300",   line: "bg-blue-400/30",  bg: "border-blue-400/20 bg-blue-500/[0.06]" },
  { ring: "ring-violet-400/40", glow: "bg-violet-400", text: "text-violet-300", line: "bg-violet-400/30", bg: "border-violet-400/20 bg-violet-500/[0.06]" },
  { ring: "ring-emerald-400/40",glow: "bg-emerald-400",text: "text-emerald-300",line: "bg-emerald-400/30",bg: "border-emerald-400/20 bg-emerald-500/[0.06]" },
];

export function ProductPanel({ data }: Props) {
  return (
    <div className="space-y-6">

      {/* ── USP hero card ── */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-400/20 bg-gradient-to-br from-blue-500/[0.08] via-white/[0.02] to-transparent p-6 backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />
        <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-blue-500/10 blur-[80px]" />
        <div className="relative z-10">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/15 ring-1 ring-blue-400/30">
              <Sparkles className="h-3 w-3 text-blue-300" />
            </span>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-300/80" style={MONO}>
              Unique Selling Proposition
            </p>
          </div>
          <p
            className="text-xl font-bold leading-snug bg-clip-text text-transparent bg-gradient-to-r from-white/95 to-white/50"
            style={MONO}
          >
            {data.usp}
          </p>
        </div>
      </div>

      {/* ── MVP Scope ── */}
      <div className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-xl transition-all hover:border-blue-400/20">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/0 to-transparent transition-all group-hover:via-blue-400/30" />
        <SectionLabel icon={Sparkles}>MVP Scope</SectionLabel>
        <p className="text-sm leading-relaxed text-white/70">{data.mvp_scope}</p>
      </div>

      {/* ── Core features ── */}
      <div>
        <SectionLabel icon={Package}>Core Features</SectionLabel>

        {/* Priority legend */}
        <div className="mb-3 flex flex-wrap items-center gap-3">
          {Object.entries(PRIORITY).map(([label, cfg]) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot.split(" ")[0]}`} />
              <span className="text-[10px] text-white/35" style={MONO}>{label}</span>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {data.core_features.map((f, i) => {
            const cfg = fallbackPriority(f.priority);
            return (
              <div
                key={i}
                className={cn(
                  "group relative flex items-start gap-0 overflow-hidden rounded-xl border backdrop-blur-xl transition-all duration-200",
                  cfg.border
                )}
              >
                {/* Left priority bar */}
                <div className={`w-1 shrink-0 self-stretch rounded-l-xl ${cfg.leftBar}`} />

                <div className="flex flex-1 items-start gap-3 p-4">
                  {/* Priority badge */}
                  <span
                    className={cn("mt-0.5 shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide", cfg.badge)}
                    style={MONO}
                  >
                    {f.priority}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-white/90" style={MONO}>{f.name}</p>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-white/55">{f.description}</p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <ChevronRight className="h-3 w-3 text-white/20" />
                      <p className="text-[11px] text-white/35">Solves: {f.solves_pain}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Monetization + Tech stack ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-xl transition-all hover:border-blue-400/20">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/0 to-transparent transition-all group-hover:via-blue-400/30" />
          <SectionLabel icon={DollarSign}>Monetization</SectionLabel>
          <p className="text-sm leading-relaxed text-white/70">{data.monetization_model}</p>
        </div>

        <div className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-xl transition-all hover:border-blue-400/20">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/0 to-transparent transition-all group-hover:via-blue-400/30" />
          <SectionLabel icon={Wrench}>Tech Stack</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {data.suggested_tech_stack.map((item, i) => (
              <span
                key={i}
                className="rounded-full border border-blue-400/20 bg-blue-500/[0.07] px-2.5 py-0.5 text-[11px] text-blue-200/80 transition-all hover:border-blue-400/40 hover:bg-blue-500/[0.12]"
                style={MONO}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Roadmap — horizontal timeline ── */}
      <div>
        <SectionLabel icon={Rocket}>Roadmap</SectionLabel>

        {/* Timeline track */}
        <div className="relative">
          {/* Horizontal connecting line */}
          <div className="absolute top-[22px] left-0 right-0 mx-8 h-px bg-gradient-to-r from-blue-400/20 via-violet-400/20 to-emerald-400/20 hidden sm:block" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {data.roadmap.map((phase, i) => {
              const c = PHASE_COLORS[i] ?? PHASE_COLORS[0];
              return (
                <div key={i} className="flex flex-col gap-3">
                  {/* Phase node header */}
                  <div className="flex flex-col items-center gap-2 text-center">
                    {/* Node circle */}
                    <div className={cn(
                      "relative z-10 flex h-11 w-11 items-center justify-center rounded-full bg-[#0A0A0B] ring-2",
                      c.ring
                    )}>
                      <span className={`h-2.5 w-2.5 rounded-full ${c.glow} shadow-lg`} />
                    </div>
                    <div>
                      <p className={`text-[12px] font-bold ${c.text}`} style={MONO}>
                        {phase.phase}
                      </p>
                      <span className="mt-0.5 inline-block rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[10px] text-white/30" style={MONO}>
                        {phase.timeline}
                      </span>
                    </div>
                  </div>

                  {/* Deliverables card */}
                  <div className={cn(
                    "flex-1 rounded-xl border p-4 backdrop-blur-xl",
                    c.bg
                  )}>
                    <ul className="space-y-2">
                      {phase.deliverables.map((item, j) => (
                        <li key={j} className="flex items-start gap-2 text-[12px] text-white/65">
                          <CheckCircle2 className={cn("mt-0.5 h-3.5 w-3.5 shrink-0 opacity-70", c.text)} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Product Risks ── */}
      <div className="relative overflow-hidden rounded-xl border border-amber-400/15 bg-amber-500/[0.05] p-5 backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/25 to-transparent" />
        <SectionLabel icon={AlertTriangle}>Product Risks</SectionLabel>
        <ul className="space-y-2.5">
          {data.product_risks.map((risk, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-white/65">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400/70" />
              {risk}
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}