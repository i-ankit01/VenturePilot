"use client";

import { use, useEffect, useState } from "react";
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
import { ReportPanel } from "@/components/workspace/panels/report-panel";
import { BrandingReviewOverlay } from "@/components/workspace/branding-review-overlay";
import { usePipelineProgress } from "@/hooks/use-pipeline-progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Cpu, BarChart3, Swords, Package, Palette, DollarSign,
  Rocket, Presentation, Loader2, Lock, AlertCircle, Sparkles,
  CheckCircle2,
} from "lucide-react";
import { IconFileTypePpt } from "@tabler/icons-react";
import { StuckBanner } from "@/components/workspace/stuck-banner";
import type { BrandingSuggestions } from "@/lib/api";

const MONO = { fontFamily: "var(--font-mono)" };

const TABS = [
  { key: "planner",    label: "Planner",    icon: Cpu,              outputKey: "planner_output"    },
  { key: "research",   label: "Research",   icon: BarChart3,        outputKey: "research_output"   },
  { key: "competitor", label: "Competitor", icon: Swords,           outputKey: "competitor_output" },
  { key: "product",    label: "Product",    icon: Package,          outputKey: "product_output"    },
  { key: "branding",   label: "Branding",   icon: Palette,          outputKey: "branding_output"   },
  { key: "finance",    label: "Finance",    icon: DollarSign,       outputKey: "finance_output"    },
  { key: "gtm",        label: "GTM",        icon: Rocket,           outputKey: "gtm_output"        },
  { key: "pitch",      label: "Pitch",      icon: Presentation,     outputKey: "pitch_output"      },
  { key: "report",     label: "Report",     icon: IconFileTypePpt,  outputKey: "pitch_output"      },
] as const;

type TabKey = (typeof TABS)[number]["key"];


// ── Skeleton ──────────────────────────────────────────────────────────────────
function PanelSkeleton({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="relative mb-5">
        <div className="absolute inset-0 animate-ping rounded-full bg-primary/10" />
        <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      </div>
      <p className="text-sm font-medium text-foreground" style={MONO}>{label} agent working…</p>
      <p className="mt-1 text-[12px] text-muted-foreground">Results appear automatically</p>
      <div className="mt-8 w-full max-w-md space-y-3">
        {[80, 60, 90, 50, 70].map((w, i) => (
          <div key={i} className="h-3 animate-pulse rounded-full bg-muted"
            style={{ width: `${w}%`, animationDelay: `${i * 120}ms` }} />
        ))}
      </div>
    </div>
  );
}

// ── Locked ────────────────────────────────────────────────────────────────────
function LockedPanel({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted ring-1 ring-border">
        <Lock className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground" style={MONO}>{label}</span> hasn't started yet
      </p>
      <p className="mt-1 text-[12px] text-muted-foreground/60">Agents run sequentially</p>
    </div>
  );
}

// ── Branding awaiting ─────────────────────────────────────────────────────────
function BrandingAwaitingPanel({ onReview }: { onReview: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="relative mb-5">
        <div className="absolute inset-0 animate-ping rounded-full bg-primary/10" style={{ animationDuration: "2s" }} />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/25">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">Brand identity is ready</h3>
      <p className="text-sm text-muted-foreground mb-5">Review, edit, and approve before the pipeline continues</p>
      <button
        onClick={onReview}
        className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-[13px] font-semibold text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.3)] hover:bg-primary/90 hover:shadow-[0_0_28px_hsl(var(--primary)/0.4)] transition-all"
        style={MONO}
      >
        <Sparkles className="h-4 w-4" /> Open Brand Review
      </button>
    </div>
  );
}

function BrandingReviewLoadingPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 px-6 backdrop-blur-xl">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-2xl shadow-black/10">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
        <h3 className="mb-2 text-base font-semibold text-foreground">Brand review is opening</h3>
        <p className="mb-6 text-sm text-muted-foreground">
          The branding panel is still loading its data. This usually resolves as soon as the paused job payload is available.
        </p>
        <button
          onClick={onClose}
          className="rounded-xl border border-border px-4 py-2 text-[12px] font-semibold text-foreground transition-colors hover:bg-muted"
          style={MONO}
        >
          Back to workspace
        </button>
      </div>
    </div>
  );
}

function toBrandingSuggestions(brandingOutput: any): BrandingSuggestions | null {
  if (!brandingOutput) return null;

  return {
    name_suggestion: brandingOutput.name_suggestion,
    tagline: brandingOutput.tagline,
    color_palette: brandingOutput.color_palette,
    color_palette_rationale: brandingOutput.color_palette_rationale,
    logo_direction: brandingOutput.logo_direction,
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────
interface PageProps { params: Promise<{ id: string }> }

export default function WorkspacePage({ params }: PageProps) {
  const { id: projectId } = use(params);

  const {
    data, status, error, completedAgents, projectTitle,
    jobId, brandingSuggestions, resumePollingAfterApproval, isStuck, resumeStuckJob
  } = usePipelineProgress(projectId);

  const [activeTab, setActiveTab] = useState<TabKey>("planner");
  const [showBrandingOverlay, setShowBrandingOverlay] = useState(false);

  const isRunning       = status === "running" || status === "idle";
  const awaitingBranding = status === "awaiting_branding_approval";
  const brandingReviewSuggestions = brandingSuggestions ?? toBrandingSuggestions(data?.branding_output);

  function handleBrandingApproved() {
    setShowBrandingOverlay(false);
    resumePollingAfterApproval();
  }

  function openBrandingReview() {
    setShowBrandingOverlay(true);
  }

  function renderPanel(tab: (typeof TABS)[number]) {
    const hasData = data && (data as any)[tab.outputKey];

    if (error) return (
      <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-5 text-destructive">
        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold">Pipeline error</p>
          <p className="text-[12px] opacity-75 mt-0.5">{error}</p>
        </div>
      </div>
    );

    if (tab.key === "branding" && awaitingBranding) {
      return <BrandingAwaitingPanel onReview={openBrandingReview} />;
    }

    if (!hasData && (isRunning || awaitingBranding)) {
      const tabIndex = TABS.findIndex(t => t.key === tab.key);
      const isActive = completedAgents.length === tabIndex && isRunning;
      return isActive ? <PanelSkeleton label={tab.label} /> : <LockedPanel label={tab.label} />;
    }

    if (!hasData) return <LockedPanel label={tab.label} />;

    switch (tab.key) {
      case "planner":    return <PlannerPanel    data={data!.planner_output!}    />;
      case "research":   return <ResearchPanel   data={data!.research_output!}   />;
      case "competitor": return <CompetitorPanel data={data!.competitor_output!} />;
      case "product":    return <ProductPanel    data={data!.product_output!}    />;
      case "branding":   return <BrandingPanel   data={data!.branding_output!}   />;
      case "finance":    return <FinancePanel    data={data!.finance_output!}    />;
      case "gtm":        return <GtmPanel        data={data!.gtm_output!}        />;
      case "pitch":      return <PitchPanel      data={data!.pitch_output!}      />;
      case "report":     return <ReportPanel     data={data!.pitch_output!}      />;
    }
  }

  const activeTabConfig = TABS.find(t => t.key === activeTab)!;

  return (
    <AppShell>
      <div className="relative flex h-full flex-col overflow-hidden bg-background text-foreground">

        {/* ── Top bar ── */}
        <div className="relative z-10 flex items-center justify-between border-b border-border/60 bg-background/95 px-6 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)]" />
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground" style={MONO}>
                Project
              </p>
              <p className="text-[13px] font-semibold text-foreground leading-tight" style={MONO}>
                {projectTitle || projectId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isRunning && (
              <Badge variant="outline" className="border-primary/25 bg-primary/8 text-primary gap-1.5 text-[11px]" style={MONO}>
                <Loader2 className="h-3 w-3 animate-spin" /> Pipeline running
              </Badge>
            )}
            {awaitingBranding && (
              <button
                onClick={openBrandingReview}
                className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-[11px] font-semibold text-primary hover:bg-primary/15 transition-all animate-pulse"
                style={MONO}
              >
                <Sparkles className="h-3 w-3" /> Review Branding
              </button>
            )}
            {status === "done" && (
              <Badge variant="outline" className="border-emerald-500/25 bg-emerald-500/8 text-emerald-600 dark:text-emerald-400 gap-1.5 text-[11px]" style={MONO}>
                <CheckCircle2 className="h-3 w-3" /> Complete
              </Badge>
            )}
          </div>
        </div>

        <div className="relative z-10 flex flex-1 overflow-hidden">

          {isStuck && <StuckBanner onResume={resumeStuckJob} />}

          {/* ── Left tab rail ── */}
          <div className="flex w-[156px] shrink-0 flex-col border-r border-border/60 bg-sidebar py-4">
            <p className="mb-2 px-4 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/60" style={MONO}>
              Agents
            </p>

            {TABS.map((tab) => {
              const isDone      = completedAgents.includes(tab.outputKey);
              const isActive    = activeTab === tab.key;
              const tabIndex    = TABS.findIndex(t => t.key === tab.key);
              const isRunningNow = isRunning && completedAgents.length === tabIndex;
              const needsReview  = tab.key === "branding" && awaitingBranding;

              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "group relative flex items-center gap-2.5 px-4 py-2.5 text-left transition-all",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground/50 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground/80",
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-sidebar-primary shadow-[2px_0_8px_hsl(var(--sidebar-primary)/0.5)]" />
                  )}
                  <tab.icon
                    className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-sidebar-primary" : "text-sidebar-foreground/30")}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span className="text-[12px] font-medium" style={MONO}>{tab.label}</span>
                  <span className="ml-auto">
                    {needsReview && (
                      <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.8)] inline-block animate-pulse" />
                    )}
                    {isDone && !needsReview && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_hsl(142_71%_45%/0.8)] inline-block" />
                    )}
                    {isRunningNow && !isDone && !needsReview && (
                      <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    )}
                    {!isDone && !isRunningNow && !needsReview && (
                      <span className="h-1.5 w-1.5 rounded-full bg-border inline-block" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Main panel ── */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="shrink-0 px-6 pt-5 pb-4">
              <AgentStatus completedAgents={completedAgents} pipelineStatus={status} />
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-8">
              <div className="mb-5 flex items-center gap-2">
                <activeTabConfig.icon className="h-4 w-4 text-primary/70" />
                <h2 className="text-[13px] font-semibold text-foreground" style={MONO}>
                  {activeTabConfig.label}
                </h2>
              </div>
              {renderPanel(activeTabConfig)}
            </div>
          </div>
        </div>

        {/* ── Branding review overlay ── */}
        {awaitingBranding && showBrandingOverlay && (
          brandingReviewSuggestions && jobId ? (
            <BrandingReviewOverlay
              jobId={jobId}
              suggestions={brandingReviewSuggestions}
              onApproved={handleBrandingApproved}
            />
          ) : (
            <BrandingReviewLoadingPanel onClose={() => setShowBrandingOverlay(false)} />
          )
        )}
      </div>
    </AppShell>
  );
}