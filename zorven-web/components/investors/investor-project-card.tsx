"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ProjectSummary } from "@/lib/investors/types";

const MONO = { fontFamily: "'DM Mono', monospace" };

const STAGE_COLORS: Record<string, string> = {
  idea:   "border-white/[0.08] bg-white/[0.03] text-white/40",
  mvp:    "border-sky-400/20 bg-sky-500/[0.08] text-sky-300/80",
  early:  "border-blue-400/20 bg-blue-500/[0.08] text-blue-300/80",
  growth: "border-emerald-400/20 bg-emerald-500/[0.08] text-emerald-300/80",
};

export function InvestorProjectCard({ project }: { project: ProjectSummary }) {
  const stageClass = STAGE_COLORS[project.stage?.toLowerCase() ?? ""] ?? STAGE_COLORS["idea"];

  return (
    <Link href={`/investors/${project.id}`} className="group block">
      <div className="relative h-full overflow-hidden rounded-2xl border border-white/[0.05] bg-white/[0.02] backdrop-blur-2xl transition-all duration-300 hover:border-blue-400/25 hover:bg-white/[0.035] hover:-translate-y-0.5">
        {/* Top edge glow on hover */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/0 to-transparent transition-all duration-300 group-hover:via-blue-400/50" />
        {/* Subtle corner glow */}
        <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-blue-500/[0.06] blur-[60px] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="relative z-10 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3
                className="truncate text-[14px] font-semibold text-white/90 transition-colors group-hover:text-blue-200"
                style={MONO}
              >
                {project.title}
              </h3>
              <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-white/45">
                {project.idea}
              </p>
            </div>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] transition-all duration-300 group-hover:border-blue-400/40 group-hover:bg-blue-500/10">
              <ArrowUpRight className="h-3.5 w-3.5 text-white/30 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-blue-300" />
            </span>
          </div>

          {/* Tags */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {project.industry && (
              <span
                className="rounded-full border border-blue-400/20 bg-blue-500/[0.08] px-2.5 py-0.5 text-[11px] font-medium text-blue-300/80"
                style={MONO}
              >
                {project.industry}
              </span>
            )}
            {project.stage && (
              <span
                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${stageClass}`}
                style={MONO}
              >
                {project.stage}
              </span>
            )}
          </div>

          {/* Bottom divider + date */}
          <div className="mt-4 flex items-center gap-2">
            <div className="h-px flex-1 bg-white/[0.05]" />
            <span className="text-[10px] text-white/25" style={MONO}>
              {new Date(project.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}