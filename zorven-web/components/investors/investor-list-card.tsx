"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { InvestorOverview } from "@/lib/investors/types";
import { getInvestorStage, STAGE_LABELS, getScoreColor } from "@/lib/investors/utils";
import {
  IconBriefcase,
  IconChevronRight,
  IconMailCheck,
  IconMailFast,
  IconCalendarCheck,
  IconMessage2Check,
  IconUserCheck,
} from "@tabler/icons-react";

const MONO = { fontFamily: "'DM Mono', monospace" };

// ─── Stage config — explicit colors, no CSS vars / oklch ─────────────────────
const STAGE_CONFIG: Record<string, {
  border: string;
  pill: string;
  icon: React.ElementType;
}> = {
  matched:    { border: "border-l-white/20",        pill: "border-white/[0.08]   bg-white/[0.03]      text-white/40",      icon: IconUserCheck },
  drafted:    { border: "border-l-sky-400/60",       pill: "border-sky-400/20     bg-sky-500/[0.08]    text-sky-300",       icon: IconMailFast },
  sent:       { border: "border-l-blue-400/70",      pill: "border-blue-400/20    bg-blue-500/[0.08]   text-blue-300",      icon: IconMailCheck },
  replied:    { border: "border-l-emerald-400/70",   pill: "border-emerald-400/20 bg-emerald-500/[0.08] text-emerald-300",  icon: IconMessage2Check },
  reply_sent: { border: "border-l-emerald-400/70",   pill: "border-emerald-400/20 bg-emerald-500/[0.08] text-emerald-300",  icon: IconMessage2Check },
  scheduled:  { border: "border-l-amber-400/70",     pill: "border-amber-400/20   bg-amber-500/[0.08]  text-amber-300",     icon: IconCalendarCheck },
};

// ─── Deterministic monogram colour from name ──────────────────────────────────
function nameToHue(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  // Map to 200-240 (blue-sky band), same palette as the app
  return 200 + (Math.abs(h) % 40);
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

// ─── SVG score arc ────────────────────────────────────────────────────────────
function ScoreArc({ score, color }: { score: number; color: string }) {
  const R = 16;
  const stroke = 2.5;
  const normalizedR = R - stroke / 2;
  const circ = 2 * Math.PI * normalizedR;
  const arc = (score / 100) * circ;

  return (
    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="44" height="44" viewBox="0 0 44 44">
        {/* Track */}
        <circle
          cx="22" cy="22" r={normalizedR}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
        />
        {/* Arc */}
        <circle
          cx="22" cy="22" r={normalizedR}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${arc} ${circ - arc}`}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${color}80)` }}
        />
      </svg>
      <span
        className="text-[11px] font-bold tabular-nums"
        style={{ ...MONO, color }}
      >
        {score}
      </span>
    </div>
  );
}

// ─── Monogram avatar ──────────────────────────────────────────────────────────
function MonogramAvatar({ name }: { name: string }) {
  const hue = nameToHue(name);
  const bg = `hsla(${hue}, 70%, 55%, 0.12)`;
  const border = `hsla(${hue}, 70%, 65%, 0.25)`;
  const text = `hsla(${hue}, 90%, 80%, 1)`;
  const glow = `hsla(${hue}, 80%, 60%, 0.3)`;

  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[12px] font-bold"
      style={{
        ...MONO,
        background: bg,
        border: `1.5px solid ${border}`,
        color: text,
        boxShadow: `0 0 12px ${glow}`,
      }}
    >
      {initials(name)}
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function InvestorListCard({
  investor,
  projectId,
  rank,
}: {
  investor: InvestorOverview;
  projectId: string;
  rank: number;
}) {
  const stage = getInvestorStage(investor);
  const cfg = STAGE_CONFIG[stage] ?? STAGE_CONFIG["matched"];
  const StageIcon = cfg.icon;
  const scoreColor = getScoreColor(investor.overall_score);

  return (
    <Link
      href={`/investors/${projectId}/${investor.id}`}
      className={cn(
        "group relative flex items-center gap-4 overflow-hidden rounded-xl border border-white/[0.06] border-l-2 bg-white/[0.02] px-4 py-3.5 backdrop-blur-xl",
        "transition-all duration-200 hover:border-white/[0.10] hover:bg-white/[0.04] hover:-translate-y-px",
        cfg.border,
      )}
    >
      {/* Top edge glow on hover */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/0 to-transparent transition-all duration-300 group-hover:via-blue-400/30" />

      {/* Rank */}
      <span className="w-5 shrink-0 text-[11px] text-white/20" style={MONO}>
        {String(rank).padStart(2, "0")}
      </span>

      {/* Score arc */}
      <ScoreArc score={investor.overall_score} color={scoreColor} />

      {/* Monogram avatar */}
      <MonogramAvatar name={investor.name} />

      {/* Name + firm + title */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[13px] font-semibold text-white/90" style={MONO}>
            {investor.name}
          </span>
          {investor.title && (
            <span className="hidden shrink-0 text-[11px] text-white/35 sm:inline">
              {investor.title}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-white/40">
          <IconBriefcase className="h-3 w-3 shrink-0 text-white/25" />
          <span className="truncate">{investor.firm}</span>
        </div>
      </div>

      {/* Focus tags */}
      <div className="hidden items-center gap-1.5 lg:flex">
        {investor.focus_areas.slice(0, 2).map((f) => (
          <span
            key={f}
            className="rounded-full border border-white/[0.07] bg-white/[0.03] px-2.5 py-0.5 text-[11px] text-white/40"
          >
            {f}
          </span>
        ))}
      </div>

      {/* Stage pill with icon */}
      <span
        className={cn(
          "flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium",
          cfg.pill,
        )}
        style={MONO}
      >
        <StageIcon className="h-3 w-3" />
        {STAGE_LABELS[stage]}
      </span>

      {/* Chevron */}
      <IconChevronRight className="h-4 w-4 shrink-0 text-white/20 transition-transform group-hover:translate-x-0.5 group-hover:text-white/50" />
    </Link>
  );
}