import { PartialResult } from "@/lib/api";
import { Rocket, FlaskConical, TrendingUp, Target } from "lucide-react";

interface Props { data: NonNullable<PartialResult["gtm_output"]> }

export function GtmPanel({ data }: Props) {
  return (
    <div className="space-y-5">
      {/* First 100 users */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-primary/70" style={{ fontFamily: "'DM Mono', monospace" }}>First 100 Users Strategy</h3>
        </div>
        <ul className="space-y-2">
          {data.first_100_users.map((s, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[9px] font-bold text-primary">{i + 1}</span>
              {s}
            </li>
          ))}
        </ul>
      </div>

      {/* 12-week plan */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Rocket className="h-4 w-4 text-primary/70" />
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>12-Week Plan</h3>
        </div>
        <div className="space-y-2">
          {data.weekly_plan.map((w) => (
            <div key={w.week} className="flex items-start gap-3 rounded-lg border border-border/50 bg-card px-4 py-3">
              <div className="shrink-0 text-center">
                <p className="text-[10px] text-muted-foreground/50" style={{ fontFamily: "'DM Mono', monospace" }}>W</p>
                <p className="text-sm font-bold text-primary" style={{ fontFamily: "'DM Mono', monospace" }}>{w.week}</p>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="rounded-sm border border-border/50 bg-muted/30 px-1.5 py-0.5 text-[10px] text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{w.phase}</span>
                  <span className="rounded-sm border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary" style={{ fontFamily: "'DM Mono', monospace" }}>{w.channel_focus}</span>
                </div>
                <p className="mt-1 text-[13px] font-semibold text-foreground">{w.milestone_label}</p>
                <p className="text-[12px] text-muted-foreground">{w.milestone}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Growth experiments */}
      <div className="rounded-lg border border-border/50 bg-muted/20 p-5">
        <div className="mb-3 flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-primary/70" />
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>Growth Experiments</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.growth_experiments.map((e, i) => (
            <span key={i} className="rounded-md border border-border/50 bg-card px-3 py-1.5 text-[12px] text-foreground">{e}</span>
          ))}
        </div>
      </div>

      {/* Scaling strategy */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary/70" />
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>Scaling Stages</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {data.scaling_strategy.map((stage, i) => (
            <div key={i} className="rounded-xl border border-border/50 bg-card p-4">
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>{stage.stage}</p>
              <p className="mb-3 text-lg font-bold text-primary" style={{ fontFamily: "'DM Mono', monospace" }}>{stage.users}</p>
              <ul className="space-y-1">
                {stage.tactics.map((t, j) => (
                  <li key={j} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/40" />{t}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}