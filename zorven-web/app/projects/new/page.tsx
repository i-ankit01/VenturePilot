"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProject } from "@/actions/projects";
import {
  Zap,
  ArrowRight,
  Lightbulb,
  Sparkles,
  CornerDownLeft,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { startPipeline } from "@/lib/api";
import { cn } from "@/lib/utils";

// ─── Static options ───────────────────────────────────────────────────────────
const INDUSTRIES = [
  "SaaS",
  "FinTech",
  "HealthTech",
  "EdTech",
  "E-Commerce",
  "Logistics",
  "LegalTech",
  "CleanTech",
  "Consumer",
  "Developer Tools",
  "Media",
  "Other",
];

const STAGES = [
  { value: "idea", label: "Idea — just a concept" },
  { value: "mvp", label: "MVP — building or built" },
  { value: "early", label: "Early — first customers" },
  { value: "growth", label: "Growth — scaling revenue" },
];

const BUDGETS = [
  { value: "bootstrapped", label: "Bootstrapped" },
  { value: "pre-seed", label: "Pre-Seed (<$500K)" },
  { value: "seed", label: "Seed ($500K–$2M)" },
  { value: "series-a", label: "Series A ($2M+)" },
];

const SUGGESTIONS = [
  {
    idea: "An AI-powered legal assistant that helps freelancers draft and review contracts instantly.",
    industry: "LegalTech",
    target_market: "Freelancers and independent consultants",
  },
  {
    idea: "A B2B SaaS tool that auto-generates compliance reports for fintech startups.",
    industry: "FinTech",
    target_market: "Fintech compliance teams at Series A–B startups",
  },
  {
    idea: "A mental wellness app for remote workers with async check-ins and burnout prediction.",
    industry: "HealthTech",
    target_market: "Remote-first companies with 50–500 employees",
  },
  {
    idea: "A subscription platform connecting indie farmers directly with urban households for weekly produce boxes.",
    industry: "E-Commerce",
    target_market: "Health-conscious urban households aged 25–45",
  },
];

// ─── Animated thinking dots ───────────────────────────────────────────────────
function ThinkingDots() {
  return (
    <span className="inline-flex items-end gap-0.5 h-4">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block h-1 w-1 rounded-full bg-primary animate-bounce"
          style={{ animationDelay: `${i * 150}ms`, animationDuration: "800ms" }}
        />
      ))}
    </span>
  );
}

// ─── Agent launch sequence ────────────────────────────────────────────────────
const AGENT_SEQUENCE = [
  { key: "planner", label: "Planner", desc: "Structuring your idea" },
  { key: "research", label: "Research", desc: "Scanning the market" },
  { key: "competitor", label: "Competitor", desc: "Mapping the landscape" },
  { key: "product", label: "Product", desc: "Defining features & pricing" },
  { key: "branding", label: "Branding", desc: "Building your brand identity" },
  { key: "finance", label: "Finance", desc: "Modeling 12-month projections" },
  { key: "gtm", label: "GTM", desc: "Crafting go-to-market strategy" },
  { key: "pitch", label: "Pitch", desc: "Writing your investor deck" },
];

function LaunchSequence({ activeIndex }: { activeIndex: number }) {
  return (
    <div className="mt-6 w-full max-w-sm space-y-1.5">
      {AGENT_SEQUENCE.map((agent, i) => {
        const isDone = i < activeIndex;
        const isActive = i === activeIndex;
        const isPending = i > activeIndex;
        return (
          <div
            key={agent.key}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 transition-all duration-300",
              isActive && "bg-primary/10 border border-primary/20",
              isDone && "opacity-50",
              isPending && "opacity-20",
            )}
          >
            <div
              className={cn(
                "h-1.5 w-1.5 shrink-0 rounded-full transition-all",
                isDone && "bg-emerald-400",
                isActive &&
                  "bg-primary shadow-[0_0_6px_var(--color-primary)] animate-pulse",
                isPending && "bg-muted-foreground/30",
              )}
            />
            <span
              className={cn(
                "text-[11px] font-semibold tracking-wide",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              {agent.label}
            </span>
            <span className="text-[11px] text-muted-foreground/60">
              {isActive ? <ThinkingDots /> : isDone ? "✓" : agent.desc}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Small select wrapper ─────────────────────────────────────────────────────
function NativeSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full appearance-none rounded-md border border-border/60 bg-card px-3 py-2 pr-8",
          "text-[13px] text-foreground transition-colors",
          "focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30",
          !value && "text-muted-foreground/50",
        )}
        style={{ fontFamily: "'DM Mono', monospace" }}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function NewProjectPage() {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [idea, setIdea] = useState("");
  const [industry, setIndustry] = useState("");
  const [targetMarket, setTargetMarket] = useState("");
  const [budget, setBudget] = useState("bootstrapped");
  const [stage, setStage] = useState("idea");
  const [phase, setPhase] = useState<"input" | "launching" | "redirecting">(
    "input",
  );
  const [error, setError] = useState<string | null>(null);
  const [launchStep, setLaunchStep] = useState(0);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleIdeaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setIdea(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleBuild();
    }
  };

  const canBuild = idea.trim() && industry && targetMarket.trim();

  const handleBuild = async () => {
    if (!canBuild || phase !== "input") return;
    setError(null);
    setPhase("launching");
    setLaunchStep(0);

    const stepTimer = setInterval(() => {
      setLaunchStep((prev) => {
        if (prev >= AGENT_SEQUENCE.length - 1) {
          clearInterval(stepTimer);
          return prev;
        }
        return prev + 1;
      });
    }, 280);

    try {
      // 1. Start the backend pipeline
      const { job_id } = await startPipeline({
        idea: idea.trim(),
        industry,
        target_market: targetMarket.trim(),
        budget,
        stage,
      });

      // 2. Save to Supabase, get our own project id
      const projectId = await createProject({
        idea: idea.trim(),
        industry,
        target_market: targetMarket.trim(),
        budget,
        stage,
        job_id,
      });

      await new Promise((r) => setTimeout(r, 2500));
      clearInterval(stepTimer);
      setPhase("redirecting");

      // 3. Redirect using Supabase project id
      router.push(`/projects/${projectId}`);
    } catch (err) {
      clearInterval(stepTimer);
      setPhase("input");
      setError(
        err instanceof Error
          ? err.message
          : "Failed to start pipeline. Is the backend running?",
      );
    }
  };

  const applySuggestion = (s: (typeof SUGGESTIONS)[0]) => {
    setIdea(s.idea);
    setIndustry(s.industry);
    setTargetMarket(s.target_market);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const isBuilding = phase === "launching" || phase === "redirecting";

  return (
    <AppShell>
      <div className="flex min-h-full flex-col items-center justify-center px-6 py-14">
        {/* ── Input phase ── */}
        {phase === "input" && (
          <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="mb-8 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span
                  className="text-[11px] font-semibold uppercase tracking-[0.15em] text-primary"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  9 AI Agents Standing By
                </span>
              </div>
              <h1
                className="text-[30px] font-bold leading-tight tracking-tight text-foreground"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                What are you building?
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Tell us your idea, industry, and who you're building for —
                agents handle the rest.
              </p>
            </div>

            {/* Main card */}
            <div className="rounded-xl border border-border/60 bg-card shadow-[0_4px_32px_rgba(0,0,0,0.12)]">
              {/* Idea textarea */}
              <div className="relative transition-all focus-within:border-primary/40">
                <Textarea
                  ref={textareaRef}
                  value={idea}
                  onChange={handleIdeaChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe your startup idea in plain English…"
                  className="min-h-[130px] resize-none rounded-t-xl rounded-b-none border-0 border-b border-border/40 bg-transparent px-5 pt-5 pb-4 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/40 focus-visible:ring-0 focus-visible:ring-offset-0"
                  style={{ fontFamily: "inherit", overflow: "hidden" }}
                />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-xl bg-gradient-to-r from-transparent via-primary/0 to-transparent transition-all duration-300 peer-focus:via-primary/40" />
              </div>

              {/* Fields row */}
              <div className="grid grid-cols-2 gap-3 border-b border-border/40 px-5 py-4">
                {/* Industry */}
                <div className="space-y-1.5">
                  <Label
                    className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60"
                    style={{ fontFamily: "'DM Mono', monospace" }}
                  >
                    Industry <span className="text-destructive">*</span>
                  </Label>
                  <NativeSelect
                    value={industry}
                    onChange={setIndustry}
                    placeholder="Select industry"
                    options={INDUSTRIES.map((ind) => ({
                      value: ind,
                      label: ind,
                    }))}
                  />
                </div>

                {/* Target market */}
                <div className="space-y-1.5">
                  <Label
                    className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60"
                    style={{ fontFamily: "'DM Mono', monospace" }}
                  >
                    Target Market <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={targetMarket}
                    onChange={(e) => setTargetMarket(e.target.value)}
                    placeholder="e.g. SMB HR teams in the US"
                    className="h-9 border-border/60 bg-card text-[13px] focus-visible:ring-primary/30"
                    style={{ fontFamily: "'DM Mono', monospace" }}
                  />
                </div>

                {/* Stage */}
                <div className="space-y-1.5">
                  <Label
                    className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60"
                    style={{ fontFamily: "'DM Mono', monospace" }}
                  >
                    Stage
                  </Label>
                  <NativeSelect
                    value={stage}
                    onChange={setStage}
                    placeholder="Select stage"
                    options={STAGES}
                  />
                </div>

                {/* Budget */}
                <div className="space-y-1.5">
                  <Label
                    className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60"
                    style={{ fontFamily: "'DM Mono', monospace" }}
                  >
                    Budget
                  </Label>
                  <NativeSelect
                    value={budget}
                    onChange={setBudget}
                    placeholder="Select budget"
                    options={BUDGETS}
                  />
                </div>
              </div>

              {/* Bottom bar */}
              <div className="flex items-center justify-between px-5 py-3">
                <span
                  className="text-[11px] text-muted-foreground/40"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  <CornerDownLeft className="mr-1 inline h-3 w-3" />⌘ + Enter to
                  build
                </span>
                <Button
                  onClick={handleBuild}
                  disabled={!canBuild}
                  size="sm"
                  className="group gap-1.5 shadow-[0_0_16px_rgba(0,0,0,0.2)]"
                >
                  <Zap className="h-3.5 w-3.5" />
                  Build
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mt-3 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Suggestions */}
            <div className="mt-8">
              <div className="mb-3 flex items-center gap-2">
                <Lightbulb className="h-3.5 w-3.5 text-muted-foreground/40" />
                <span
                  className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/40"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  Try an example
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => applySuggestion(s)}
                    className="group rounded-lg border border-border/40 bg-card/50 px-4 py-3 text-left text-[12px] leading-relaxed text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-foreground"
                  >
                    <span
                      className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40 group-hover:text-primary/60"
                      style={{ fontFamily: "'DM Mono', monospace" }}
                    >
                      {s.industry} · {s.target_market}
                    </span>
                    {s.idea}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Launching / redirecting phase ── */}
        {isBuilding && (
          <div className="flex flex-col items-center animate-in fade-in duration-400">
            <div className="relative mb-6">
              <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/30">
                <Zap className="h-7 w-7 text-primary" />
              </div>
            </div>

            <h2
              className="mb-1 text-lg font-bold text-foreground"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              {phase === "redirecting"
                ? "Taking you there…"
                : "Launching agents"}
            </h2>
            <p className="mb-2 text-sm text-muted-foreground">
              {phase === "redirecting"
                ? "Pipeline is running. Results appear as each agent finishes."
                : "9 specialized AI agents are being dispatched."}
            </p>

            <div className="mb-4 flex gap-2">
              <span
                className="rounded-sm border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] text-primary"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                {industry}
              </span>
              <span
                className="rounded-sm border border-border/40 bg-muted/30 px-2 py-0.5 text-[11px] text-muted-foreground"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                {stage}
              </span>
              <span
                className="rounded-sm border border-border/40 bg-muted/30 px-2 py-0.5 text-[11px] text-muted-foreground"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                {budget}
              </span>
            </div>

            <p className="mb-2 max-w-md rounded-md border border-border/40 bg-muted/30 px-4 py-2.5 text-center text-[12px] leading-relaxed text-muted-foreground/70 italic">
              "{idea.length > 120 ? idea.slice(0, 120) + "…" : idea}"
            </p>

            <LaunchSequence activeIndex={launchStep} />
          </div>
        )}
      </div>
    </AppShell>
  );
}
