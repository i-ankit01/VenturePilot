import { cn } from "@/lib/utils";
import type { InvestorOverview, InvestorStage } from "@/lib/investors/types";
import { getInvestorStage, STAGE_LABELS } from "@/lib/investors/utils";

const STAGE_STYLES: Record<InvestorStage, string> = {
  matched: "bg-muted text-muted-foreground",
  drafted: "bg-secondary text-secondary-foreground",
  sent: "bg-primary/10 text-primary",
  replied: "bg-[oklch(0.72_0.19_152)]/10 text-[oklch(0.72_0.19_152)]",
  reply_sent: "bg-[oklch(0.72_0.19_152)]/10 text-[oklch(0.72_0.19_152)]",
  scheduled: "bg-[oklch(0.78_0.16_85)]/10 text-[oklch(0.78_0.16_85)]",
};

const STAGE_DOTS: Record<InvestorStage, string> = {
  matched: "bg-muted-foreground",
  drafted: "bg-chart-2",
  sent: "bg-chart-2 animate-pulse",
  replied: "bg-[oklch(0.72_0.19_152)]",
  reply_sent: "bg-[oklch(0.72_0.19_152)]",
  scheduled: "bg-[oklch(0.78_0.16_85)]",
};

export function InvestorStatusPill({ investor }: { investor: InvestorOverview })  {
  const stage = getInvestorStage(investor);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        STAGE_STYLES[stage]
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", STAGE_DOTS[stage])} />
      {STAGE_LABELS[stage]}
    </span>
  );
}