import { PartialResult } from "@/lib/api";
import { Rocket, FlaskConical, TrendingUp, Target, Megaphone, Repeat, Handshake, ShieldAlert, BookMarked } from "lucide-react";

interface Props { data: NonNullable<PartialResult["gtm_output"]> }

export function GtmPanel({ data }: Props) {
  const channels = data.channels ?? [];
  const weeklyPlan = data.weekly_plan ?? [];
  const experiments = data.growth_experiments ?? [];
  const scaling = data.scaling_strategy ?? [];
  const partnerships = data.partnership_opportunities ?? [];
  const risks = data.gtm_risks ?? [];

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-primary/70" style={{ fontFamily: "'DM Mono', monospace" }}>First 100 Users Strategy</h3>
        </div>
        <p className="text-sm leading-relaxed text-foreground">{data.first_100_users.core_approach}</p>
        <p className="mt-2 text-[12px] text-muted-foreground">Timeline: {data.first_100_users.total_timeline}</p>
        <p className="mt-2 text-[12px] text-muted-foreground">Hook: {data.first_100_users.hook_offer}</p>
        <div className="mt-4 space-y-2">
          {data.first_100_users.steps.map((step, i) => (
            <div key={i} className="flex items-start gap-2.5 text-sm text-foreground">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[9px] font-bold text-primary">{i + 1}</span>
              {step}
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {data.first_100_users.where_to_find_them.map((item, i) => (
            <span key={i} className="rounded-sm border border-primary/20 bg-background/50 px-2 py-0.5 text-[11px] text-primary">{item}</span>
          ))}
        </div>
        <p className="mt-4 text-[12px] leading-relaxed text-muted-foreground">{data.first_100_users.conversion_script}</p>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-primary/70" />
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>Channels</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {channels.map((channel, i) => (
            <div key={i} className="rounded-xl border border-border/50 bg-card p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="font-semibold text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{channel.channel}</p>
                <span className="rounded-sm border border-border/40 bg-muted/30 px-2 py-0.5 text-[10px] text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{channel.priority}</span>
              </div>
              <p className="text-[12px] text-muted-foreground">{channel.why_this_channel}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {channel.tactics.map((tactic, j) => (
                  <span key={j} className="rounded-sm border border-border/40 bg-muted/20 px-2 py-0.5 text-[11px] text-muted-foreground">{tactic}</span>
                ))}
              </div>
              <div className="mt-2 text-[12px] text-foreground/80">CAC: {channel.estimated_cac}</div>
              <div className="text-[12px] text-foreground/80">KPI: {channel.kpi}</div>
              <div className="text-[12px] text-muted-foreground">Start: {channel.when_to_start}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <Rocket className="h-4 w-4 text-primary/70" />
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>12-Week Plan</h3>
        </div>
        <div className="space-y-2">
          {weeklyPlan.map((w) => (
            <div key={w.week} className="flex items-start gap-3 rounded-lg border border-border/50 bg-card px-4 py-3">
              <div className="shrink-0 text-center">
                <p className="text-[10px] text-muted-foreground/50" style={{ fontFamily: "'DM Mono', monospace" }}>W</p>
                <p className="text-sm font-bold text-primary" style={{ fontFamily: "'DM Mono', monospace" }}>{w.week}</p>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-sm border border-border/50 bg-muted/30 px-1.5 py-0.5 text-[10px] text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{w.phase}</span>
                  {w.channel_focus.map((focus, j) => (
                    <span key={j} className="rounded-sm border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary" style={{ fontFamily: "'DM Mono', monospace" }}>{focus}</span>
                  ))}
                </div>
                <p className="mt-1 text-[13px] font-semibold text-foreground">{w.theme}</p>
                <p className="text-[12px] text-muted-foreground">{w.success_metric}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {w.goals.map((goal, j) => (
                    <span key={j} className="rounded-sm border border-border/40 bg-muted/20 px-2 py-0.5 text-[11px] text-muted-foreground">{goal}</span>
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {w.tasks.map((task, j) => (
                    <span key={j} className="rounded-sm border border-border/40 bg-card px-2 py-0.5 text-[11px] text-foreground">{task}</span>
                  ))}
                </div>
                {w.milestone && <p className="mt-2 text-[12px] font-semibold text-primary">{w.milestone_label}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border/50 bg-muted/20 p-5">
        <div className="mb-3 flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-primary/70" />
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>Growth Experiments</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {experiments.map((experiment, i) => (
            <div key={i} className="rounded-md border border-border/50 bg-card p-4">
              <p className="font-semibold text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{experiment.name}</p>
              <p className="mt-1 text-[12px] text-muted-foreground">{experiment.hypothesis}</p>
              <p className="mt-2 text-[12px] text-foreground/80">Run: {experiment.how_to_run}</p>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                <span>{experiment.success_criteria}</span>
                <span>• {experiment.effort}</span>
                <span>• {experiment.potential_impact}</span>
                <span>• {experiment.timeline}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary/70" />
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>Scaling Stages</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {scaling.map((stage, i) => (
            <div key={i} className="rounded-xl border border-border/50 bg-card p-4">
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>{stage.phase}</p>
              <p className="mb-3 text-lg font-bold text-primary" style={{ fontFamily: "'DM Mono', monospace" }}>{stage.timeframe}</p>
              <p className="mb-3 text-[12px] text-muted-foreground">{stage.primary_engine}</p>
              <ul className="space-y-1">
                {stage.key_actions.map((action, j) => (
                  <li key={j} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/40" />{action}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-muted-foreground/70">{stage.budget_allocation}</p>
              <p className="mt-1 text-[11px] text-primary/70">Unlock: {stage.unlock_condition}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Repeat className="h-4 w-4 text-primary/70" />
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>Retention</h3>
          </div>
          <p className="text-sm leading-relaxed text-foreground">{data.retention_strategy}</p>
        </div>
        <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Handshake className="h-4 w-4 text-primary/70" />
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>Partnerships</h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {partnerships.map((item, i) => (
              <span key={i} className="rounded-sm border border-border/40 bg-card px-2 py-0.5 text-[11px] text-muted-foreground">{item}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
          <div className="mb-2 flex items-center gap-2">
            <BookMarked className="h-4 w-4 text-primary/70" />
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>Content Strategy</h3>
          </div>
          <p className="text-sm leading-relaxed text-foreground">{data.content_strategy}</p>
        </div>
        <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
          <div className="mb-2 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-primary/70" />
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>GTM Risks</h3>
          </div>
          <ul className="space-y-2">
            {risks.map((risk, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                {risk}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
        <div className="mb-2 flex items-center gap-2">
          <Target className="h-4 w-4 text-primary/70" />
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>North Star</h3>
        </div>
        <p className="text-sm leading-relaxed text-foreground">{data.north_star_metric}</p>
      </div>
    </div>
  );
}
