import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InvestorOverview } from "@/lib/investors/types";
import { getInvestorStage, STAGE_LABELS, getScoreColor } from "@/lib/investors/utils";

const STAGE_BORDER: Record<string, string> = {
  matched:    "border-l-border",
  drafted:    "border-l-chart-2",
  sent:       "border-l-primary",
  replied:    "border-l-[oklch(0.72_0.19_152)]",
  reply_sent: "border-l-[oklch(0.72_0.19_152)]",
  scheduled:  "border-l-[oklch(0.78_0.16_85)]",
};

const STAGE_PILL: Record<string, string> = {
  matched:    "bg-muted text-muted-foreground",
  drafted:    "bg-secondary text-secondary-foreground",
  sent:       "bg-primary/10 text-primary",
  replied:    "bg-[oklch(0.72_0.19_152)]/10 text-[oklch(0.72_0.19_152)]",
  reply_sent: "bg-[oklch(0.72_0.19_152)]/10 text-[oklch(0.72_0.19_152)]",
  scheduled:  "bg-[oklch(0.78_0.16_85)]/10 text-[oklch(0.78_0.16_85)]",
};

export function InvestorListCard({
  investor,
  projectId,
  rank,
}: {
  investor: InvestorOverview;
  projectId: string;
  rank: number;
}) {
  const stage      = getInvestorStage(investor);
  const scoreColor = getScoreColor(investor.overall_score);

  return (
    <Link
      href={`/investors/${projectId}/${investor.id}`}
      className={cn(
        "group flex items-center gap-4 rounded-lg border border-border border-l-2 bg-card",
        "px-4 py-3.5 transition-colors hover:bg-accent/40",
        STAGE_BORDER[stage],
      )}
    >
      {/* Rank */}
      <span className="w-5 shrink-0 font-mono text-xs text-muted-foreground/40">
        {String(rank).padStart(2, "0")}
      </span>

      {/* Score circle */}
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums"
        style={{
          background: `color-mix(in oklch, ${scoreColor} 12%, transparent)`,
          color: scoreColor,
          border: `1.5px solid color-mix(in oklch, ${scoreColor} 35%, transparent)`,
        }}
      >
        {investor.overall_score}
      </div>

      {/* Name + firm */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <span className="truncate text-sm font-semibold leading-tight">{investor.name}</span>
          {investor.title && (
            <span className="hidden shrink-0 text-xs text-muted-foreground/70 sm:inline">
              · {investor.title}
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{investor.firm}</p>
      </div>

      {/* Focus tags */}
      <div className="hidden gap-1.5 lg:flex">
        {investor.focus_areas.slice(0, 2).map((f) => (
          <span
            key={f}
            className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground"
          >
            {f}
          </span>
        ))}
      </div>

      {/* Stage pill */}
      <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium", STAGE_PILL[stage])}>
        {STAGE_LABELS[stage]}
      </span>

      <ChevronRight className="size-4 shrink-0 text-muted-foreground/30 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}