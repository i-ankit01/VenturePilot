import { PartialResult } from "@/lib/api";
import { AlertTriangle, BarChart3, FileText, ShieldAlert, Target, TrendingUp } from "lucide-react";

interface Props { data: NonNullable<PartialResult["research_output"]> }

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
          { icon: BarChart3,   label: "Market Size",   value: data.market_size },
          { icon: Target,      label: "Target Audience", value: data.target_audience },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-xl border border-border/50 bg-card p-5 text-center">
            <Icon className="mx-auto mb-2 h-5 w-5 text-primary/70" />
            <p className="text-xl font-bold text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{value}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Problem summary */}
      <div className="rounded-lg border border-border/50 bg-muted/20 p-5">
        <div className="mb-2 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-primary/70" />
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>Problem Statement</p>
        </div>
        <p className="text-sm leading-relaxed text-foreground">{data.problem_statement}</p>
        <div className="mt-4 border-t border-border/40 pt-4">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>Opportunity Gap</p>
          <p className="text-sm leading-relaxed text-foreground">{data.opportunity_gap}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Trends */}
        <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>Key Trends</p>
          <ul className="space-y-2">
            {marketTrends.map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                {t}
              </li>
            ))}
            {marketTrends.length === 0 && (
              <li className="text-sm text-muted-foreground">No trends were returned for this run.</li>
            )}
          </ul>
        </div>

        {/* Pain points */}
        <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
          <div className="mb-3 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-primary/70" />
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>Pain Points</p>
          </div>
          <div className="space-y-2">
            {painPoints.map((s, i) => (
              <div key={i} className="rounded-sm border border-border/60 bg-card px-2 py-1 text-[12px] text-foreground">{s}</div>
            ))}
            {painPoints.length === 0 && (
              <div className="text-sm text-muted-foreground">No pain points were returned for this run.</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
          <div className="mb-3 flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-primary/70" />
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>Key Assumptions</p>
          </div>
          <ul className="space-y-2">
            {keyAssumptions.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                {item}
              </li>
            ))}
            {keyAssumptions.length === 0 && (
              <li className="text-sm text-muted-foreground">No assumptions were returned for this run.</li>
            )}
          </ul>
        </div>

        <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
          <div className="mb-3 flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-primary/70" />
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>Sources</p>
          </div>
          <ul className="space-y-2">
            {sources.map((source, i) => (
              <li key={i} className="break-all text-[12px] text-foreground/80">{source}</li>
            ))}
            {sources.length === 0 && (
              <li className="text-sm text-muted-foreground">No sources were returned for this run.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}