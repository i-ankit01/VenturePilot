"use client";

import { use, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { AgentStatus } from "@/components/workspace/agent-status";
import { PlannerPanel } from "@/components/workspace/panels/planner-panel";
import { ResearchPanel } from "@/components/workspace/panels/research-panel";
import { CompetitorPanel } from "@/components/workspace/panels/competitor-panel";
import { ProductPanel } from "@/components/workspace/panels/product-panel";
import { BrandingPanel } from "@/components/workspace/panels/branding-panel";
import { FinancePanel } from "@/components/workspace/panels/finance-panel";
import { GtmPanel } from "@/components/workspace/panels/gtm-panel";
import { PitchPanel } from "@/components/workspace/panels/pitch-panel";
import { usePipelineProgress } from "@/hooks/use-pipeline-progress";
import { cn } from "@/lib/utils";
import {
  Cpu,
  BarChart3,
  Swords,
  Package,
  Palette,
  DollarSign,
  Rocket,
  Presentation,
  Loader2,
  Lock,
  AlertCircle,
} from "lucide-react";

// ─── Tab config ───────────────────────────────────────────────────────────────
const TABS = [
  { key: "planner", label: "Planner", icon: Cpu, outputKey: "planner_output" },
  {
    key: "research",
    label: "Research",
    icon: BarChart3,
    outputKey: "research_output",
  },
  {
    key: "competitor",
    label: "Competitor",
    icon: Swords,
    outputKey: "competitor_output",
  },
  {
    key: "product",
    label: "Product",
    icon: Package,
    outputKey: "product_output",
  },
  {
    key: "branding",
    label: "Branding",
    icon: Palette,
    outputKey: "branding_output",
  },
  {
    key: "finance",
    label: "Finance",
    icon: DollarSign,
    outputKey: "finance_output",
  },
  { key: "gtm", label: "GTM", icon: Rocket, outputKey: "gtm_output" },
  {
    key: "pitch",
    label: "Pitch",
    icon: Presentation,
    outputKey: "pitch_output",
  },
] as const;

type TabKey = (typeof TABS)[number]["key"];

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function PanelSkeleton({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="relative mb-5">
        <div className="absolute inset-0 animate-ping rounded-full bg-primary/10" />
        <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      </div>
      <p
        className="text-sm font-medium text-foreground"
        style={{ fontFamily: "'DM Mono', monospace" }}
      >
        {label} agent is working…
      </p>
      <p className="mt-1 text-[12px] text-muted-foreground">
        Results will appear here automatically
      </p>

      {/* Shimmer bars */}
      <div className="mt-8 w-full max-w-md space-y-3">
        {[80, 60, 90, 50, 70].map((w, i) => (
          <div
            key={i}
            className="h-3 animate-pulse rounded-full bg-muted"
            style={{ width: `${w}%`, animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Locked tab panel ─────────────────────────────────────────────────────────
function LockedPanel({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted ring-1 ring-border">
        <Lock className="h-5 w-5 text-muted-foreground/40" />
      </div>
      <p className="text-sm text-muted-foreground">
        <span
          className="font-medium text-foreground"
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          {label}
        </span>{" "}
        hasn't started yet
      </p>
      <p className="mt-1 text-[12px] text-muted-foreground/60">
        Agents run sequentially — check back soon
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
interface PageProps {
  params: Promise<{ id: string }>;
}

export default function WorkspacePage({ params }: PageProps) {
  const { id: jobId } = use(params);
  // update destructure
  const { data, status, error, completedAgents, projectTitle } = usePipelineProgress(jobId);
  const [activeTab, setActiveTab] = useState<TabKey>("planner");

  const isRunning = status === "running" || status === "idle";

  function renderPanel(tab: (typeof TABS)[number]) {
    const hasData = data && (data as any)[tab.outputKey];

    if (error)
      return (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-5 text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Pipeline error</p>
            <p className="text-[12px] opacity-80">{error}</p>
          </div>
        </div>
      );

    if (!hasData && isRunning) {
      const tabIndex = TABS.findIndex((t) => t.key === tab.key);
      const isActive = completedAgents.length === tabIndex && isRunning;
      return isActive ? (
        <PanelSkeleton label={tab.label} />
      ) : (
        <LockedPanel label={tab.label} />
      );
    }

    if (!hasData) return <LockedPanel label={tab.label} />;

    // Render the right panel
    switch (tab.key) {
      case "planner":
        return <PlannerPanel data={data!.planner_output!} />;
      case "research":
        return <ResearchPanel data={data!.research_output!} />;
      case "competitor":
        return <CompetitorPanel data={data!.competitor_output!} />;
      case "product":
        return <ProductPanel data={data!.product_output!} />;
      case "branding":
        return <BrandingPanel data={data!.branding_output!} />;
      case "finance":
        return <FinancePanel data={data!.finance_output!} />;
      case "gtm":
        return <GtmPanel data={data!.gtm_output!} />;
      case "pitch":
        return <PitchPanel data={data!.pitch_output!} />;
    }
  }

  const activeTabConfig = TABS.find((t) => t.key === activeTab)!;

  return (
    <AppShell>
      <div className="flex h-full flex-col">
        {/* ── Top bar ── */}
        {/* Top bar — replace the Job ID block */}
        <div className="flex items-center justify-between border-b border-border/60 bg-card/50 px-6 py-3 backdrop-blur-sm">
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-0.5"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              Project
            </p>
            <p
              className="text-[13px] font-semibold text-foreground"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              {projectTitle || jobId}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isRunning && (
              <span
                className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                <Loader2 className="h-3 w-3 animate-spin" />
                Pipeline running
              </span>
            )}
            {status === "done" && (
              <span
                className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-400"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                ✓ Complete
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* ── Left tab rail ── */}
          <div className="flex w-[160px] shrink-0 flex-col border-r border-border/60 bg-sidebar py-4">
            <p
              className="mb-2 px-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/40"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              Agents
            </p>
            {TABS.map((tab) => {
              const isDone = completedAgents.includes(tab.outputKey);
              const isActive = activeTab === tab.key;
              const tabIndex = TABS.findIndex((t) => t.key === tab.key);
              const isRunningNow =
                isRunning && completedAgents.length === tabIndex;

              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "group relative flex items-center gap-2.5 px-4 py-2.5 text-left transition-all",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-sidebar-foreground/60 hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  {/* Active bar */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_6px_var(--color-primary)]" />
                  )}

                  <tab.icon
                    className={cn(
                      "h-3.5 w-3.5 shrink-0",
                      isActive ? "text-primary" : "text-muted-foreground/50",
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span
                    className="text-[12px] font-medium"
                    style={{ fontFamily: "'DM Mono', monospace" }}
                  >
                    {tab.label}
                  </span>

                  {/* Status dot */}
                  <span className="ml-auto">
                    {isDone && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_#34d399] inline-block" />
                    )}
                    {isRunningNow && !isDone && (
                      <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    )}
                    {!isDone && !isRunningNow && (
                      <span className="h-1.5 w-1.5 rounded-full bg-border inline-block" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Main panel area ── */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Agent progress bar (top of content) */}
            <div className="shrink-0 px-6 pt-5 pb-4">
              <AgentStatus
                completedAgents={completedAgents}
                pipelineStatus={status}
              />
            </div>

            {/* Panel content */}
            <div className="flex-1 overflow-y-auto px-6 pb-8">
              <div className="mb-4 flex items-center gap-2">
                <activeTabConfig.icon className="h-4 w-4 text-primary" />
                <h2
                  className="text-[13px] font-semibold text-foreground"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  {activeTabConfig.label}
                </h2>
              </div>

              {renderPanel(activeTabConfig)}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
