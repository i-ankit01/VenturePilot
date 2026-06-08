"use client";

import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2, Circle } from "lucide-react";

const AGENTS = [
  { key: "planner_output",    label: "Planner" },
  { key: "research_output",   label: "Research" },
  { key: "competitor_output", label: "Competitor" },
  { key: "product_output",    label: "Product" },
  { key: "branding_output",   label: "Branding" },
  { key: "finance_output",    label: "Finance" },
  { key: "gtm_output",        label: "GTM" },
  { key: "pitch_output",      label: "Pitch" },
];

interface AgentStatusProps {
  completedAgents: string[];
  pipelineStatus: string;
}

export function AgentStatus({ completedAgents, pipelineStatus }: AgentStatusProps) {
  const doneCount = completedAgents.length;
  const total     = AGENTS.length;
  const pct       = Math.round((doneCount / total) * 100);
  const isRunning = pipelineStatus === "running";

  return (
    <div className="rounded-xl border border-border/60 bg-card px-5 py-4">
      {/* Header row */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isRunning ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          ) : doneCount === total ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Circle className="h-3.5 w-3.5 text-muted-foreground/40" />
          )}
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            {isRunning ? "Pipeline running…" : doneCount === total ? "All agents complete" : "Pipeline idle"}
          </span>
        </div>
        <span
          className="text-[11px] tabular-nums text-muted-foreground/60"
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          {doneCount}/{total} agents · {pct}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-700"
          style={{
            width: `${pct}%`,
            boxShadow: pct > 0 ? "0 0 8px var(--color-primary)" : "none",
          }}
        />
      </div>

      {/* Agent pills */}
      <div className="flex flex-wrap gap-1.5">
        {AGENTS.map((agent, i) => {
          const isDone    = completedAgents.includes(agent.key);
          // "running" = the first agent whose output hasn't arrived yet, if pipeline is still going
          const isActive  = isRunning && !isDone && completedAgents.length === i;

          return (
            <span
              key={agent.key}
              className={cn(
                "flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[10px] font-medium transition-all",
                isDone   && "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
                isActive && "border-primary/30 bg-primary/10 text-primary",
                !isDone && !isActive && "border-border/40 bg-muted/30 text-muted-foreground/40",
              )}
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              {isDone   && <CheckCircle2 className="h-2.5 w-2.5" />}
              {isActive && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
              {!isDone && !isActive && <Circle className="h-2.5 w-2.5" />}
              {agent.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}