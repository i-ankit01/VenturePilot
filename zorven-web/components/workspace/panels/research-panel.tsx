import { PartialResult } from "@/lib/api";
import { AlertTriangle, BarChart3, FileText, ShieldAlert, Target, TrendingUp, ArrowUpRight } from "lucide-react";

interface Props { data: NonNullable<PartialResult["research_output"]> }

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

function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-white/30">{children}</p>;
}

export function ResearchPanel({ data }: Props) {
  const marketTrends = data.market_trends ?? [];
  const painPoints = data.pain_points ?? [];
  const keyAssumptions = data.key_assumptions ?? [];
  const sources = data.sources ?? [];

  return (
    <div className="space-y-4">
      {/* Market size + audience */}
<div className="grid grid-cols-2 gap-3">
  {[
    { icon: BarChart3, label: "Market Size", value: data.market_size },
    { icon: Target, label: "Target Audience", value: data.target_audience },
  ].map(({ icon: Icon, label, value }) => (
    <div
      key={label}
      className="group relative overflow-hidden rounded-xl border border-blue-400/20 bg-gradient-to-br from-blue-500/[0.08] via-white/[0.02] to-transparent p-4 backdrop-blur-xl transition-all duration-300 hover:border-blue-400/35 hover:from-blue-500/[0.12]"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />

      <div className="pointer-events-none absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-blue-500/10 blur-[45px]" />

      <p
        className="relative z-10 mb-1 text-[10px] font-semibold uppercase tracking-widest text-blue-300/70"
        style={MONO}
      >
        {label}
      </p>

      <p
        className="relative z-10 text-xl font-bold leading-tight bg-clip-text text-transparent"
        style={{
          ...MONO,
          backgroundImage:
            "linear-gradient(90deg, rgb(147,197,253) 0%, rgba(96,165,250,0.85) 60%, rgba(255,255,255,0.7) 100%)",
        }}
      >
        {value}
      </p>

      <div className="relative z-10 mt-2.5 flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-blue-400/50" />
        <span className="h-px flex-1 bg-blue-400/10" />
      </div>
    </div>
  ))}
</div>
      {/* Problem statement — the emotional core, given a warning-red treatment */}
      <div className="relative overflow-hidden rounded-2xl border border-rose-400/25 bg-gradient-to-br from-rose-500/[0.1] via-rose-500/[0.03] to-transparent p-6 backdrop-blur-2xl">
        <div className="pointer-events-none absolute -top-16 -right-12 h-44 w-44 rounded-full bg-rose-500/15 blur-[80px]" />

        <div className="relative z-10">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500/15 ring-1 ring-rose-400/30">
              <ShieldAlert className="h-3 w-3 text-rose-300" />
            </span>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-rose-300/80" style={MONO}>
              The Problem
            </p>
          </div>
          <p className="text-base leading-relaxed text-white/85">{data.problem_statement}</p>

          <div className="mt-5 flex items-start gap-3 rounded-xl border border-blue-400/15 bg-blue-500/[0.06] p-4">
            <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" />
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-blue-300/70" style={MONO}>
                The Opening
              </p>
              <p className="text-sm leading-relaxed text-white/70">{data.opportunity_gap}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trends — directional list with rising-arrow markers */}
      <div className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-xl transition-all duration-300 hover:border-blue-400/25">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/0 to-transparent transition-all duration-300 group-hover:via-blue-400/40" />
        <SectionLabel icon={TrendingUp}>Key Trends</SectionLabel>
        {marketTrends.length > 0 ? (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {marketTrends.map((t, i) => (
              <li
                key={i}
                className="flex items-start gap-2 rounded-lg border border-white/[0.05] bg-white/[0.015] px-3 py-2.5 text-sm text-white/75"
              >
                <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400/80" />
                {t}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyNote>No trends were returned for this run.</EmptyNote>
        )}
      </div>

      {/* Pain points — chip cloud, conveys friction at a glance */}
      <div className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-xl transition-all duration-300 hover:border-blue-400/25">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/0 to-transparent transition-all duration-300 group-hover:via-blue-400/40" />
        <SectionLabel icon={AlertTriangle}>Pain Points</SectionLabel>
        {painPoints.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {painPoints.map((s, i) => (
              <span
                key={i}
                className="rounded-full border border-amber-400/20 bg-amber-500/[0.08] px-3 py-1.5 text-[12px] text-amber-200/90"
              >
                {s}
              </span>
            ))}
          </div>
        ) : (
          <EmptyNote>No pain points were returned for this run.</EmptyNote>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Key assumptions — flagged as unverified bets */}
        <div className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-xl transition-all duration-300 hover:border-blue-400/25">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/0 to-transparent transition-all duration-300 group-hover:via-blue-400/40" />
          <SectionLabel icon={Target}>Key Assumptions</SectionLabel>
          {keyAssumptions.length > 0 ? (
            <ul className="space-y-2">
              {keyAssumptions.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-white/75">
                  <span
                    className="mt-0.5 shrink-0 rounded-sm border border-blue-400/20 bg-blue-500/10 px-1.5 py-0 text-[10px] font-semibold text-blue-300"
                    style={MONO}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyNote>No assumptions were returned for this run.</EmptyNote>
          )}
        </div>

        {/* Sources — clickable link boxes */}
        <div className="rounded-xl border border-white/[0.05] bg-white/[0.01] p-4">
          <SectionLabel icon={FileText}>Sources</SectionLabel>
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
                    <span className="break-all text-[11px] leading-relaxed text-blue-300/60 group-hover:text-blue-300/90 transition-colors">
                      {source}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyNote>No sources were returned for this run.</EmptyNote>
          )}
        </div>
      </div>
    </div>
  );
}