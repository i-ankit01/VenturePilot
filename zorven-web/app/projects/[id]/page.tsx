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
import { BrandingApprovalOverlay } from "@/components/workspace/branding-approval-overlay";

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
import { IconFileTypePpt } from "@tabler/icons-react";
import { ReportPanel } from "@/components/workspace/panels/report-panel";

const MONO = { fontFamily: "'DM Mono', monospace" };

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
  {
    key: "report",
    label: "Report",
    icon: IconFileTypePpt,
    outputKey: "pitch_output",
  },
] as const;

type TabKey = (typeof TABS)[number]["key"];

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function PanelSkeleton({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="relative mb-5">
        <div className="absolute inset-0 animate-ping rounded-full bg-blue-500/10" />
        <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 ring-1 ring-blue-400/20">
          <Loader2 className="h-5 w-5 animate-spin text-blue-300" />
        </div>
      </div>
      <p className="text-sm font-medium text-white/90" style={MONO}>
        {label} agent is working…
      </p>
      <p className="mt-1 text-[12px] text-white/40">
        Results will appear here automatically
      </p>

      {/* Shimmer bars */}
      <div className="mt-8 w-full max-w-md space-y-3">
        {[80, 60, 90, 50, 70].map((w, i) => (
          <div
            key={i}
            className="h-3 animate-pulse rounded-full bg-white/[0.06]"
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
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.04] ring-1 ring-white/[0.08]">
        <Lock className="h-5 w-5 text-white/30" />
      </div>
      <p className="text-sm text-white/40">
        <span className="font-medium text-white/80" style={MONO}>
          {label}
        </span>{" "}
        hasn't started yet
      </p>
      <p className="mt-1 text-[12px] text-white/25">
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
  const {
    data,
    status,
    error,
    completedAgents,
    projectTitle,
    brandingReview,
    submitAction,
    isSubmittingAction,
  } = usePipelineProgress(jobId);
  // console.log(data,status,error,completedAgents)
  const [activeTab, setActiveTab] = useState<TabKey>("planner");

  const isRunning =
    status === "running" ||
    status === "idle" ||
    status === "awaiting_branding_approval";

  function renderPanel(tab: (typeof TABS)[number]) {
    const hasData = data && (data as any)[tab.outputKey];

    if (error)
      return (
        <div className="flex items-center gap-3 rounded-xl border border-rose-400/20 bg-rose-500/10 p-5 text-rose-300 backdrop-blur-xl">
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
      case "report":
        return <ReportPanel data={data!.pitch_output!} />;
    }
  }

  const activeTabConfig = TABS.find((t) => t.key === activeTab)!;

  return (
    <AppShell>
      <div className="relative flex h-full flex-col overflow-hidden bg-[#0A0A0B] text-white">
        {/* Ambient gradient blobs, matching the rest of the theme */}
        <div className="pointer-events-none absolute inset-0 h-full w-full overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-700/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse delay-700" />
          <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-sky-500/10 rounded-full mix-blend-normal filter blur-[96px] animate-pulse delay-1000" />
        </div>

        {/* ── Top bar ── */}
        <div className="relative z-10 flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-6 py-3 backdrop-blur-xl">
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-0.5"
              style={MONO}
            >
              Project
            </p>
            <p className="text-[13px] font-semibold text-white/90" style={MONO}>
              {projectTitle || jobId}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {status === "awaiting_branding_approval" && (
              <span
                className="flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold text-amber-300"
                style={MONO}
              >
                Awaiting your review
              </span>
            )}
            {status === "running" && (
              <span
                className="flex items-center gap-1.5 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-[11px] font-semibold text-blue-300"
                style={MONO}
              >
                <Loader2 className="h-3 w-3 animate-spin" />
                Pipeline running
              </span>
            )}
            {status === "done" && (
              <span
                className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-400"
                style={MONO}
              >
                ✓ Complete
              </span>
            )}
          </div>
        </div>

        <div className="relative z-10 flex flex-1 overflow-hidden">
          {/* ── Left tab rail ── */}
          <div className="flex w-[160px] shrink-0 flex-col border-r border-white/[0.06] bg-white/[0.015] py-4">
            <p
              className="mb-2 px-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/25"
              style={MONO}
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
                      ? "bg-blue-500/10 text-blue-300"
                      : "text-white/50 hover:bg-white/[0.05] hover:text-white/80",
                  )}
                >
                  {/* Active bar */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.8)]" />
                  )}

                  <tab.icon
                    className={cn(
                      "h-3.5 w-3.5 shrink-0",
                      isActive ? "text-blue-300" : "text-white/30",
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span className="text-[12px] font-medium" style={MONO}>
                    {tab.label}
                  </span>

                  {/* Status dot */}
                  <span className="ml-auto">
                    {isDone && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_#34d399] inline-block" />
                    )}
                    {isRunningNow && !isDone && (
                      <Loader2 className="h-3 w-3 animate-spin text-blue-300" />
                    )}
                    {!isDone && !isRunningNow && (
                      <span className="h-1.5 w-1.5 rounded-full bg-white/[0.12] inline-block" />
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
                jobId={jobId}
                completedAgents={completedAgents}
                pipelineStatus={status}
              />
            </div>

            {/* Panel content */}
            <div className="flex-1 overflow-y-auto px-6 pb-8">
              <div className="mb-4 flex items-center gap-2">
                <activeTabConfig.icon className="h-4 w-4 text-blue-300" />
                <h2
                  className="text-[13px] font-semibold text-white/90"
                  style={MONO}
                >
                  {activeTabConfig.label}
                </h2>
              </div>

              {renderPanel(activeTabConfig)}
            </div>
          </div>
        </div>
      </div>
      {brandingReview && (
        <BrandingApprovalOverlay
          review={brandingReview}
          onSubmit={submitAction}
          isSubmitting={isSubmittingAction}
        />
      )}
    </AppShell>
  );
}
