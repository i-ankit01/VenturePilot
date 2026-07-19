"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2, Circle, RotateCcw } from "lucide-react";

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

const MONO = { fontFamily: "'DM Mono', monospace" };

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

interface AgentStatusProps {
  jobId: string;
  completedAgents: string[];
  pipelineStatus: string;
}

export function AgentStatus({ jobId, completedAgents, pipelineStatus }: AgentStatusProps) {
  const [isResuming, setIsResuming] = useState(false);
  const [resumeMessage, setResumeMessage] = useState<string | null>(null);

  const doneCount = completedAgents.length;
  const total     = AGENTS.length;
  const pct       = Math.round((doneCount / total) * 100);
  const isRunning = pipelineStatus === "running";

  async function handleResume() {
    setIsResuming(true);
    setResumeMessage(null);
    try {
      const res = await fetch(`${API_BASE}/api/resume/${jobId}`, { method: "POST" });
      const data = await res.json();
      setResumeMessage(data.error ? `Error: ${data.error}` : "Resume triggered");
    } catch (err) {
      setResumeMessage("Request failed — check the server is running");
    } finally {
      setIsResuming(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] backdrop-blur-2xl px-5 py-4">
      {/* Header row */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isRunning ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-300" />
          ) : doneCount === total ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Circle className="h-3.5 w-3.5 text-white/30" />
          )}
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/50"
            style={MONO}
          >
            {isRunning ? "Pipeline running…" : doneCount === total ? "All agents complete" : "Pipeline idle"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span
            className="text-[11px] tabular-nums text-white/30"
            style={MONO}
          >
            {doneCount}/{total} agents · {pct}%
          </span>

          {/* Dev-only resume button — fires POST /api/resume/{jobId} */}
          <button
            type="button"
            onClick={handleResume}
            disabled={isResuming || pipelineStatus === "awaiting_branding_approval"}
            className={cn(
              "flex items-center gap-1 rounded-sm border border-white/[0.08] bg-white/[0.03] px-2 py-0.5",
              "text-[10px] font-medium text-white/50 transition-all hover:bg-white/[0.06] hover:text-white/80",
              "disabled:opacity-50",
            )}
            style={MONO}
          >
            {isResuming ? (
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
            ) : (
              <RotateCcw className="h-2.5 w-2.5" />
            )}
            Resume
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-blue-400 transition-all duration-700"
          style={{
            width: `${pct}%`,
            boxShadow: pct > 0 ? "0 0 8px rgba(96,165,250,0.8)" : "none",
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
                isActive && "border-blue-400/30 bg-blue-500/10 text-blue-300",
                !isDone && !isActive && "border-white/[0.06] bg-white/[0.03] text-white/30",
              )}
              style={MONO}
            >
              {isDone   && <CheckCircle2 className="h-2.5 w-2.5" />}
              {isActive && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
              {!isDone && !isActive && <Circle className="h-2.5 w-2.5" />}
              {agent.label}
            </span>
          );
        })}
      </div>

      {resumeMessage && (
        <div
          className="mt-2 text-[10px] text-white/40"
          style={MONO}
        >
          {resumeMessage}
        </div>
      )}
    </div>
  );
}