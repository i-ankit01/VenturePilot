"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { createProject } from "@/actions/projects";
import { startPipeline } from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  ArrowRight,
  Lightbulb,
  Sparkles,
  CornerDownLeft,
  AlertCircle,
  ChevronDown,
  Paperclip,
} from "lucide-react";

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

const MONO = { fontFamily: "'DM Mono', monospace" };

// ─── Animated thinking dots ───────────────────────────────────────────────────
function ThinkingDots() {
  return (
    <span className="inline-flex items-end gap-0.5 h-4">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block h-1 w-1 rounded-full bg-blue-400 animate-bounce"
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
              "flex items-center gap-3 rounded-md px-3 py-2 transition-all duration-300 backdrop-blur-xl",
              isActive && "bg-blue-500/10 border border-blue-400/20",
              isDone && "opacity-50",
              isPending && "opacity-20",
            )}
          >
            <div
              className={cn(
                "h-1.5 w-1.5 shrink-0 rounded-full transition-all",
                isDone && "bg-emerald-400",
                isActive && "bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.8)] animate-pulse",
                isPending && "bg-white/20",
              )}
            />
            <span
              className={cn(
                "text-[11px] font-semibold tracking-wide",
                isActive ? "text-blue-300" : "text-white/40",
              )}
              style={MONO}
            >
              {agent.label}
            </span>
            <span className="text-[11px] text-white/30">
              {isActive ? <ThinkingDots /> : isDone ? "✓" : agent.desc}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Glass select wrapper (styled like AnimatedAIChat's surfaces) ─────────────
function GlassSelect({
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
          "w-full appearance-none rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 pr-8",
          "text-[13px] text-white/90 transition-colors backdrop-blur-xl",
          "focus:border-blue-400/40 focus:outline-none focus:ring-1 focus:ring-blue-400/30",
          "hover:bg-white/[0.05]",
          !value && "text-white/30",
        )}
        style={MONO}
      >
        <option value="" disabled className="bg-[#0A0A0B] text-white/50">
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#0A0A0B] text-white/90">
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
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
  const [inputFocused, setInputFocused] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
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
      <div className="relative min-h-full w-full overflow-hidden bg-[#0A0A0B] text-white">
        {/* Ambient gradient blobs */}
<div className="pointer-events-none absolute inset-0 h-full w-full overflow-hidden">
  <div className="absolute top-[-8rem] left-1/2 -translate-x-1/2 w-[28rem] h-[28rem] rounded-full bg-blue-500/25 blur-[150px]" />

  <div className="absolute top-[25%] left-[-6rem] w-[18rem] h-[18rem] rounded-full bg-sky-500/20 blur-[200px]" />

  <div className="absolute top-[20%] right-[-6rem] w-[18rem] h-[18rem] rounded-full bg-indigo-500/20 blur-[200px]" />
</div>

      

        <div className="relative z-10 flex min-h-full flex-col items-center justify-center px-6 py-14">
          {/* ── Input phase ── */}
          {phase === "input" && (
            <motion.div
              className="w-full max-w-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              {/* Header */}
              <div className="mb-8 text-center space-y-3">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/[0.06] px-3 py-1.5 backdrop-blur-xl"
                >
                  <Sparkles className="h-3.5 w-3.5 text-blue-300" />
                  <span
                    className="text-[11px] font-semibold uppercase tracking-[0.15em] text-blue-300"
                    style={MONO}
                  >
                    9 AI Agents Standing By
                  </span>
                </motion.div>
                <div>
                  <h1
                    className="text-[30px] font-bold leading-tight tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white/95 to-white/40 pb-1"
                    style={MONO}
                  >
                    What are you building?
                  </h1>
                  <motion.div
                    className="mx-auto h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: "60%", opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                  />
                </div>
                <motion.p
                  className="text-sm text-white/40"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Tell us your idea, industry, and who you're building for —
                  agents handle the rest.
                </motion.p>
              </div>

              {/* Main glass card */}
              <motion.div
                className="relative backdrop-blur-2xl bg-white/[0.02] rounded-2xl border border-white/[0.05] shadow-2xl"
                initial={{ scale: 0.98 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                {/* Idea textarea */}
                <div className="p-4 border-b border-white/[0.05]">
                  <textarea
                    ref={textareaRef}
                    value={idea}
                    onChange={handleIdeaChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    placeholder="Describe your startup idea in plain English…"
                    className="min-h-[110px] w-full resize-none bg-transparent px-1 py-1 text-sm leading-relaxed text-white/90 placeholder:text-white/20 focus:outline-none"
                    style={{ fontFamily: "inherit", overflow: "hidden" }}
                  />
                </div>

                {/* Fields row */}
                <div className="grid grid-cols-2 gap-3 border-b border-white/[0.05] px-4 py-4">
                  {/* Industry */}
                  <div className="space-y-1.5">
                    <label
                      className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/30"
                      style={MONO}
                    >
                      Industry <span className="text-rose-400">*</span>
                    </label>
                    <GlassSelect
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
                    <label
                      className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/30"
                      style={MONO}
                    >
                      Target Market <span className="text-rose-400">*</span>
                    </label>
                    <input
                      value={targetMarket}
                      onChange={(e) => setTargetMarket(e.target.value)}
                      placeholder="e.g. SMB HR teams in the US"
                      className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-[13px] text-white/90 placeholder:text-white/20 backdrop-blur-xl transition-colors hover:bg-white/[0.05] focus:border-blue-400/40 focus:outline-none focus:ring-1 focus:ring-blue-400/30"
                      style={MONO}
                    />
                  </div>

                  {/* Stage */}
                  <div className="space-y-1.5">
                    <label
                      className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/30"
                      style={MONO}
                    >
                      Stage
                    </label>
                    <GlassSelect
                      value={stage}
                      onChange={setStage}
                      placeholder="Select stage"
                      options={STAGES}
                    />
                  </div>

                  {/* Budget */}
                  <div className="space-y-1.5">
                    <label
                      className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/30"
                      style={MONO}
                    >
                      Budget
                    </label>
                    <GlassSelect
                      value={budget}
                      onChange={setBudget}
                      placeholder="Select budget"
                      options={BUDGETS}
                    />
                  </div>
                </div>

                {/* Bottom bar */}
                <div className="flex items-center justify-between px-4 py-3">
                  <span
                    className="text-[11px] text-white/25"
                    style={MONO}
                  >
                    <CornerDownLeft className="mr-1 inline h-3 w-3" />⌘ + Enter
                    to build
                  </span>
                  <motion.button
                    type="button"
                    onClick={handleBuild}
                    disabled={!canBuild}
                    whileHover={canBuild ? { scale: 1.01 } : {}}
                    whileTap={canBuild ? { scale: 0.98 } : {}}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                      canBuild
                        ? "bg-white text-[#0A0A0B] shadow-lg shadow-blue-400/15"
                        : "bg-white/[0.05] text-white/30 cursor-not-allowed",
                    )}
                  >
                    <Zap className="h-3.5 w-3.5" />
                    Build
                    <ArrowRight className="h-3.5 w-3.5" />
                  </motion.button>
                </div>
              </motion.div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 flex items-center gap-2 rounded-lg border border-rose-400/20 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-300 backdrop-blur-xl"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Suggestions */}
              <div className="mt-8">
                <div className="mb-3 flex items-center gap-2">
                  <Lightbulb className="h-3.5 w-3.5 text-white/25" />
                  <span
                    className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/25"
                    style={MONO}
                  >
                    Try an example
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {SUGGESTIONS.map((s, i) => (
                    <motion.button
                      key={i}
                      onClick={() => applySuggestion(s)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="group rounded-lg border border-white/[0.05] bg-white/[0.02] px-4 py-3 text-left text-[12px] leading-relaxed text-white/50 backdrop-blur-xl transition-all hover:border-blue-400/20 hover:bg-blue-500/[0.05] hover:text-white/80"
                    >
                      <span
                        className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-white/25 group-hover:text-blue-300/80"
                        style={MONO}
                      >
                        {s.industry} · {s.target_market}
                      </span>
                      {s.idea}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Launching / redirecting phase ── */}
          {isBuilding && (
            <motion.div
              className="flex flex-col items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <div className="relative mb-6">
                <div className="absolute inset-0 animate-ping rounded-full bg-blue-500/20" />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10 ring-1 ring-blue-400/30 backdrop-blur-xl">
                  <Zap className="h-7 w-7 text-blue-300" />
                </div>
              </div>

              <h2
                className="mb-1 text-lg font-bold text-white/90"
                style={MONO}
              >
                {phase === "redirecting"
                  ? "Taking you there…"
                  : "Launching agents"}
              </h2>
              <p className="mb-2 text-sm text-white/40">
                {phase === "redirecting"
                  ? "Pipeline is running. Results appear as each agent finishes."
                  : "9 specialized AI agents are being dispatched."}
              </p>

              <div className="mb-4 flex gap-2">
                <span
                  className="rounded-sm border border-blue-400/20 bg-blue-500/10 px-2 py-0.5 text-[11px] text-blue-300"
                  style={MONO}
                >
                  {industry}
                </span>
                <span
                  className="rounded-sm border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[11px] text-white/50"
                  style={MONO}
                >
                  {stage}
                </span>
                <span
                  className="rounded-sm border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[11px] text-white/50"
                  style={MONO}
                >
                  {budget}
                </span>
              </div>

              <p className="mb-2 max-w-md rounded-lg border border-white/[0.05] bg-white/[0.02] px-4 py-2.5 text-center text-[12px] leading-relaxed text-white/40 italic backdrop-blur-xl">
                "{idea.length > 120 ? idea.slice(0, 120) + "…" : idea}"
              </p>

              <LaunchSequence activeIndex={launchStep} />
            </motion.div>
          )}
        </div>
      </div>
    </AppShell>
  );
}