"use client";

import { useState } from "react";
import { PartialResult } from "@/lib/api";
import {
  Rocket, FlaskConical, TrendingUp, Target, Megaphone,
  Repeat, Handshake, ShieldAlert, BookMarked, ChevronDown,
  CheckCircle2, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props { data: NonNullable<PartialResult["gtm_output"]> }

const MONO = { fontFamily: "'DM Mono', monospace" };
const NEON  = "linear-gradient(90deg, rgb(147,197,253) 0%, rgba(96,165,250,0.85) 60%, rgba(255,255,255,0.7) 100%)";

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

// ─── Channel priority config ──────────────────────────────────────────────────
function priorityConfig(p: string) {
  const lp = (p ?? "").toLowerCase();
  if (lp.includes("high") || lp === "p1" || lp === "1")
    return { border: "border-blue-400/25",   bg: "from-blue-500/[0.08]",   badge: "border-blue-400/20 bg-blue-500/[0.08] text-blue-300",   dot: "bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.7)]" };
  if (lp.includes("med") || lp === "p2" || lp === "2")
    return { border: "border-amber-400/20",  bg: "from-amber-500/[0.05]",  badge: "border-amber-400/20 bg-amber-500/[0.08] text-amber-300",  dot: "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]" };
  return   { border: "border-white/[0.06]",  bg: "from-white/[0.02]",      badge: "border-white/[0.08] bg-white/[0.03] text-white/40",         dot: "bg-white/30" };
}

// ─── Scaling phase colors — blue → violet → emerald ──────────────────────────
const SCALE_COLORS = [
  { ring: "ring-blue-400/40",    glow: "bg-blue-400",    text: "text-blue-300",    bg: "border-blue-400/20 bg-blue-500/[0.06]" },
  { ring: "ring-violet-400/40",  glow: "bg-violet-400",  text: "text-violet-300",  bg: "border-violet-400/20 bg-violet-500/[0.06]" },
  { ring: "ring-emerald-400/40", glow: "bg-emerald-400", text: "text-emerald-300", bg: "border-emerald-400/20 bg-emerald-500/[0.06]" },
];

// ─── Effort / impact badge colors ────────────────────────────────────────────
function effortColor(e: string) {
  const l = (e ?? "").toLowerCase();
  if (l.includes("low"))  return "border-emerald-400/20 bg-emerald-500/[0.07] text-emerald-300/80";
  if (l.includes("high")) return "border-rose-400/20    bg-rose-500/[0.07]    text-rose-300/80";
  return "border-white/[0.08] bg-white/[0.03] text-white/40";
}
function impactColor(e: string) {
  const l = (e ?? "").toLowerCase();
  if (l.includes("high")) return "border-blue-400/20 bg-blue-500/[0.07] text-blue-300/80";
  if (l.includes("low"))  return "border-white/[0.08] bg-white/[0.03] text-white/40";
  return "border-amber-400/20 bg-amber-500/[0.07] text-amber-300/80";
}

// ─── Collapsible weekly row ───────────────────────────────────────────────────
function WeekRow({ w, isFirst }: { w: any; isFirst: boolean }) {
  const [open, setOpen] = useState(isFirst);

  return (
    <div className={cn(
      "overflow-hidden rounded-xl border backdrop-blur-xl transition-all duration-200",
      open ? "border-blue-400/20 bg-white/[0.03]" : "border-white/[0.05] bg-white/[0.015] hover:border-white/[0.10]"
    )}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        {/* Week badge */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue-400/20 bg-blue-500/10">
          <span className="text-[11px] font-bold text-blue-300" style={MONO}>{w.week}</span>
        </div>

        <div className="flex flex-1 min-w-0 flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-2 py-0.5 text-[10px] text-white/30" style={MONO}>
            {w.phase}
          </span>
          {w.channel_focus?.map((f: string, j: number) => (
            <span key={j} className="rounded-full border border-blue-400/20 bg-blue-500/[0.07] px-2 py-0.5 text-[10px] text-blue-300" style={MONO}>{f}</span>
          ))}
          <span className="text-[13px] font-semibold text-white/80" style={MONO}>{w.theme}</span>
        </div>

        {w.milestone && (
          <span className="hidden shrink-0 rounded-full border border-emerald-400/25 bg-emerald-500/[0.08] px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300 sm:inline-flex" style={MONO}>
            🏁 {w.milestone_label}
          </span>
        )}

        <ChevronDown className={cn("h-4 w-4 shrink-0 text-white/25 transition-transform duration-200", open && "rotate-180")} />
      </button>

      {/* Expanded detail */}
      <div className={cn("overflow-hidden transition-all duration-250", open ? "max-h-[400px]" : "max-h-0")}>
        <div className="border-t border-white/[0.05] px-4 pb-4 pt-3 space-y-3">
          <p className="text-[12px] text-white/45">
            <span className="text-white/25 mr-1" style={MONO}>Success:</span>
            {w.success_metric}
          </p>
          <div>
            <p className="mb-1.5 text-[10px] uppercase tracking-wider text-white/25" style={MONO}>Goals</p>
            <div className="flex flex-wrap gap-1.5">
              {w.goals?.map((g: string, j: number) => (
                <span key={j} className="rounded-full border border-white/[0.06] bg-white/[0.02] px-2.5 py-0.5 text-[11px] text-white/55">{g}</span>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-[10px] uppercase tracking-wider text-white/25" style={MONO}>Tasks</p>
            <div className="flex flex-wrap gap-1.5">
              {w.tasks?.map((t: string, j: number) => (
                <span key={j} className="flex items-center gap-1 rounded-full border border-blue-400/15 bg-blue-500/[0.05] px-2.5 py-0.5 text-[11px] text-blue-200/70">
                  <CheckCircle2 className="h-2.5 w-2.5 shrink-0" />{t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────
export function GtmPanel({ data }: Props) {
  const channels     = data.channels ?? [];
  const weeklyPlan   = data.weekly_plan ?? [];
  const experiments  = data.growth_experiments ?? [];
  const scaling      = data.scaling_strategy ?? [];
  const partnerships = data.partnership_opportunities ?? [];
  const risks        = data.gtm_risks ?? [];

  return (
    <div className="space-y-6">

      {/* ── First 100 users — hero card ── */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-400/20 bg-gradient-to-br from-blue-500/[0.08] via-white/[0.02] to-transparent p-6 backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />
        <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-blue-500/10 blur-[80px]" />
        <div className="relative z-10">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/15 ring-1 ring-blue-400/30">
              <Target className="h-3 w-3 text-blue-300" />
            </span>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-300/80" style={MONO}>
              First 100 Users Strategy
            </p>
          </div>

          <p className="text-[15px] font-semibold leading-relaxed text-white/85">
            {data.first_100_users.core_approach}
          </p>

          <div className="mt-3 flex flex-wrap gap-2 text-[12px] text-white/45">
            <span><span className="text-white/25" style={MONO}>Timeline · </span>{data.first_100_users.total_timeline}</span>
            <span className="text-white/15">|</span>
            <span><span className="text-white/25" style={MONO}>Hook · </span>{data.first_100_users.hook_offer}</span>
          </div>

          {/* Steps */}
          <div className="mt-4 space-y-2">
            {data.first_100_users.steps.map((step, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/15 ring-1 ring-blue-400/25 text-[9px] font-bold text-blue-300"
                  style={MONO}
                >
                  {i + 1}
                </span>
                <p className="text-[13px] text-white/70">{step}</p>
              </div>
            ))}
          </div>

          {/* Where to find them */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {data.first_100_users.where_to_find_them.map((item, i) => (
              <span
                key={i}
                className="rounded-full border border-blue-400/20 bg-blue-500/10 px-2.5 py-0.5 text-[11px] text-blue-300/90 shadow-[0_0_8px_rgba(96,165,250,0.1)]"
              >
                {item}
              </span>
            ))}
          </div>

          {/* Conversion script */}
          <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
            <p className="mb-1 text-[10px] uppercase tracking-wider text-white/25" style={MONO}>Conversion Script</p>
            <p className="text-[12px] leading-relaxed text-white/55 italic">"{data.first_100_users.conversion_script}"</p>
          </div>
        </div>
      </div>

      {/* ── Channels — scorecard grid ── */}
      <div>
        <SectionLabel icon={Megaphone}>Channels</SectionLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {channels.map((channel, i) => {
            const cfg = priorityConfig(channel.priority);
            return (
              <div
                key={i}
                className={cn(
                  "group relative overflow-hidden rounded-xl border bg-gradient-to-br to-transparent p-4 backdrop-blur-xl transition-all",
                  cfg.border, cfg.bg
                )}
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/0 to-transparent transition-all group-hover:via-blue-400/25" />
                {/* Header */}
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                    <p className="text-[13px] font-semibold text-white/90" style={MONO}>{channel.channel}</p>
                  </div>
                  <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium", cfg.badge)} style={MONO}>
                    {channel.priority}
                  </span>
                </div>

                <p className="mb-3 text-[12px] leading-relaxed text-white/50">{channel.why_this_channel}</p>

                {/* Tactics */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {channel.tactics.map((tactic, j) => (
                    <span key={j} className="rounded-full border border-white/[0.06] bg-white/[0.02] px-2 py-0.5 text-[10px] text-white/45">
                      {tactic}
                    </span>
                  ))}
                </div>

                {/* Scorecard row */}
                <div className="grid grid-cols-3 gap-2 border-t border-white/[0.05] pt-3">
                  {[
                    { label: "CAC",   value: channel.estimated_cac },
                    { label: "KPI",   value: channel.kpi },
                    { label: "Start", value: channel.when_to_start },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-[9px] uppercase tracking-wider text-white/20" style={MONO}>{label}</p>
                      <p className="text-[11px] font-semibold text-white/65" style={MONO}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 12-week plan — collapsible rows ── */}
      <div>
        <SectionLabel icon={Rocket}>12-Week Plan</SectionLabel>
        <div className="space-y-1.5">
          {weeklyPlan.map((w, i) => (
            <WeekRow key={w.week} w={w} isFirst={i === 0} />
          ))}
        </div>
      </div>

      {/* ── Growth experiments ── */}
      <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/20 to-transparent" />
        <SectionLabel icon={FlaskConical}>Growth Experiments</SectionLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {experiments.map((exp, i) => (
            <div key={i} className="rounded-xl border border-white/[0.05] bg-white/[0.015] p-4 transition-all hover:border-blue-400/20">
              <p className="text-[13px] font-semibold text-white/90 mb-1" style={MONO}>{exp.name}</p>
              <p className="text-[12px] leading-relaxed text-white/50 mb-3">{exp.hypothesis}</p>
              <p className="text-[12px] text-white/40 mb-3">
                <span className="text-white/25" style={MONO}>Run: </span>{exp.how_to_run}
              </p>
              <p className="text-[11px] text-white/40 mb-3 border-l-2 border-blue-400/20 pl-2">{exp.success_criteria}</p>
              {/* Effort / impact / timeline badges */}
              <div className="flex flex-wrap gap-1.5">
                <span className={cn("rounded-full border px-2 py-0.5 text-[10px]", effortColor(exp.effort))} style={MONO}>
                  {exp.effort} effort
                </span>
                <span className={cn("rounded-full border px-2 py-0.5 text-[10px]", impactColor(exp.potential_impact))} style={MONO}>
                  {exp.potential_impact} impact
                </span>
                <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-2 py-0.5 text-[10px] text-white/35">
                  {exp.timeline}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Scaling stages — node timeline ── */}
      <div>
        <SectionLabel icon={TrendingUp}>Scaling Stages</SectionLabel>
        <div className="relative">
          <div className="absolute top-[22px] left-0 right-0 mx-8 h-px bg-gradient-to-r from-blue-400/20 via-violet-400/20 to-emerald-400/20 hidden sm:block" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {scaling.map((stage, i) => {
              const c = SCALE_COLORS[i] ?? SCALE_COLORS[0];
              return (
                <div key={i} className="flex flex-col gap-3">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className={cn("relative z-10 flex h-11 w-11 items-center justify-center rounded-full bg-[#0A0A0B] ring-2", c.ring)}>
                      <span className={`h-2.5 w-2.5 rounded-full ${c.glow} shadow-lg`} />
                    </div>
                    <div>
                      <p className={cn("text-[11px] font-bold uppercase tracking-wider", c.text)} style={MONO}>{stage.phase}</p>
                      <p
                        className="text-lg font-bold bg-clip-text text-transparent"
                        style={{ ...MONO, backgroundImage: NEON }}
                      >
                        {stage.timeframe}
                      </p>
                    </div>
                  </div>
                  <div className={cn("flex-1 rounded-xl border p-4 backdrop-blur-xl space-y-3", c.bg)}>
                    <p className="text-[12px] leading-relaxed text-white/60">{stage.primary_engine}</p>
                    <ul className="space-y-1.5">
                      {stage.key_actions.map((action, j) => (
                        <li key={j} className="flex items-start gap-2 text-[11px] text-white/55">
                          <Zap className={cn("mt-0.5 h-3 w-3 shrink-0 opacity-60", c.text)} />
                          {action}
                        </li>
                      ))}
                    </ul>
                    <div className="border-t border-white/[0.05] pt-2 space-y-1">
                      <p className="text-[10px] text-white/30" style={MONO}>{stage.budget_allocation}</p>
                      <p className={cn("text-[10px] font-semibold", c.text)} style={MONO}>
                        Unlock: {stage.unlock_condition}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Retention + Partnerships ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-xl transition-all hover:border-blue-400/20">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/0 to-transparent transition-all group-hover:via-blue-400/25" />
          <SectionLabel icon={Repeat}>Retention</SectionLabel>
          <p className="text-sm leading-relaxed text-white/65">{data.retention_strategy}</p>
        </div>
        <div className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-xl transition-all hover:border-blue-400/20">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/0 to-transparent transition-all group-hover:via-blue-400/25" />
          <SectionLabel icon={Handshake}>Partnerships</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {partnerships.map((item, i) => (
              <span key={i} className="rounded-full border border-amber-400/20 bg-amber-500/[0.07] px-2.5 py-1 text-[11px] text-amber-200/80">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content strategy + North Star ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-xl transition-all hover:border-blue-400/20">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/0 to-transparent transition-all group-hover:via-blue-400/25" />
          <SectionLabel icon={BookMarked}>Content Strategy</SectionLabel>
          <p className="text-sm leading-relaxed text-white/65">{data.content_strategy}</p>
        </div>

        {/* North Star — give it a standout treatment */}
        <div className="relative overflow-hidden rounded-xl border border-violet-400/20 bg-gradient-to-br from-violet-500/[0.07] to-transparent p-4 backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/30 to-transparent" />
          <div className="mb-3 flex items-center gap-2">
            <Target className="h-3.5 w-3.5 text-violet-300/70" />
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-violet-300/60" style={MONO}>North Star</h3>
          </div>
          <p className="text-sm leading-relaxed text-white/70">{data.north_star_metric}</p>
        </div>
      </div>

      {/* ── GTM Risks ── */}
      <div className="relative overflow-hidden rounded-xl border border-rose-400/15 bg-rose-500/[0.05] p-5 backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-400/20 to-transparent" />
        <SectionLabel icon={ShieldAlert}>GTM Risks</SectionLabel>
        <ul className="space-y-2.5">
          {risks.map((risk, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-white/65">
              <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400/70" />
              {risk}
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}