import { createClient } from "@/lib/supabase/server";
import { InvestorProjectCard } from "@/components/investors/investor-project-card";
import { Radar } from "lucide-react";
import type { ProjectSummary } from "@/lib/investors/types";
import { AppShell } from "@/components/layout/app-shell";
import Link from "next/link";

const MONO = { fontFamily: "'DM Mono', monospace" };

export default async function InvestorsPage() {
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, idea, industry, target_market, stage, status, created_at")
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  const completed = (projects ?? []) as ProjectSummary[];

  return (
    <AppShell>
      <div className="relative min-h-full w-full overflow-hidden bg-[#0A0A0B] text-white">
        {/* Ambient blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[128px] animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-700/10 rounded-full blur-[128px] animate-pulse delay-700" />
          <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-sky-500/10 rounded-full blur-[96px] animate-pulse delay-1000" />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl space-y-8 px-6 py-10">
          {/* Header */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Radar className="h-4 w-4 text-blue-300" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-blue-300" style={MONO}>
                Find Investors
              </p>
            </div>
            <h1
              className="text-[28px] font-bold leading-tight tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white/95 to-white/40 pb-1"
              style={MONO}
            >
              Select a project
            </h1>
            <p className="mt-1 text-sm text-white/40">
              Choose a completed analysis to find, score, and reach out to matching investors.
            </p>
          </div>

          <div className="h-px bg-gradient-to-r from-white/[0.08] via-white/[0.03] to-transparent" />

          {completed.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.02] backdrop-blur-2xl py-20 text-center">
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-blue-500/10" />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10 ring-1 ring-blue-400/20">
                  <Radar className="h-6 w-6 text-blue-300" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-white/90" style={MONO}>
                  No completed projects yet
                </h3>
                <p className="mx-auto max-w-sm text-sm text-white/40">
                  Finish running the analysis pipeline on a project to start matching it with investors.
                </p>
              </div>
              <Link
                href="/projects/new"
                className="mt-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-[#0A0A0B] shadow-lg shadow-blue-400/15 transition-all hover:bg-white/90"
                style={MONO}
              >
                Start a project
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {completed.map((project) => (
                <InvestorProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}