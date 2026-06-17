import { PartialResult } from "@/lib/api";
import { type LucideIcon, Target, Lightbulb, Users, Tag, Globe, Sparkles } from "lucide-react";

interface Props { data: NonNullable<PartialResult["planner_output"]> }

const MONO = { fontFamily: "'DM Mono', monospace" };

function Field({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-xl transition-all duration-300 hover:border-blue-400/25 hover:bg-white/[0.035]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/0 to-transparent transition-all duration-300 group-hover:via-blue-400/40" />
      <div className="mb-1.5 flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-blue-300/70 transition-colors group-hover:text-blue-300" />
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/30"
          style={MONO}
        >
          {label}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-white/80">{value}</p>
    </div>
  );
}

export function PlannerPanel({ data }: Props) {
  return (
    <div className="space-y-4">
      {/* Refined idea + one-liner — hero card */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-400/20 bg-gradient-to-br from-blue-500/[0.08] via-white/[0.02] to-transparent p-6 backdrop-blur-2xl">
        {/* Ambient glow accents inside the hero card */}
        <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-blue-500/15 blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-sky-400/10 blur-[80px]" />

        <div className="relative z-10">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/15 ring-1 ring-blue-400/30">
              <Sparkles className="h-3 w-3 text-blue-300" />
            </span>
            <p
              className="text-[11px] font-semibold uppercase tracking-widest text-blue-300/80"
              style={MONO}
            >
              Refined Idea
            </p>
          </div>
          <h2
            className="text-2xl font-bold leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white/95 to-white/50"
            style={MONO}
          >
            {data.refined_idea}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-white/50">{data.one_liner}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field icon={Target}    label="Core Problem"  value={data.core_problem} />
        <Field icon={Lightbulb} label="Unique Angle"  value={data.unique_angle} />
        <Field icon={Users}     label="Target Market" value={data.target_market} />
        <Field icon={Globe}     label="Geography"     value={data.geography} />

        {/* Meta tags */}
        <div className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-xl transition-all duration-300 hover:border-blue-400/25 hover:bg-white/[0.035]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/0 to-transparent transition-all duration-300 group-hover:via-blue-400/40" />
          <div className="mb-2 flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-blue-300/70 transition-colors group-hover:text-blue-300" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/30" style={MONO}>
              Meta
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[data.industry, data.startup_type, data.stage, data.budget].map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-blue-400/20 bg-blue-500/10 px-2.5 py-0.5 text-[11px] text-blue-300 shadow-[0_0_8px_rgba(96,165,250,0.15)] transition-all hover:border-blue-400/40 hover:bg-blue-500/15 hover:shadow-[0_0_10px_rgba(96,165,250,0.3)]"
                style={MONO}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* What it does */}
        <div className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-xl transition-all duration-300 hover:border-blue-400/25 hover:bg-white/[0.035] sm:col-span-2">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/0 to-transparent transition-all duration-300 group-hover:via-blue-400/40" />
          <div className="mb-2 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-blue-300/70 transition-colors group-hover:text-blue-300" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/30" style={MONO}>
              What It Does
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {data.agents_to_run.map((agent, i) => (
              <span key={agent} className="flex items-center gap-2">
                <span className="text-sm leading-relaxed text-white/80">{agent}</span>
                {i < data.agents_to_run.length - 1 && (
                  <span className="h-1 w-1 rounded-full bg-blue-400/50" />
                )}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}