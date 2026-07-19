import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
  Plus, ArrowUpRight, Clock, CheckCircle2,
  Loader2, Rocket, BarChart3, Sparkles,
} from "lucide-react";
import SignOut from "@/components/auth/SignOut";
import { IconDashboard } from "@tabler/icons-react";

type ProjectStatus = "completed" | "building" | "draft";

interface Project {
  id: string;
  title: string;
  idea: string;
  status: ProjectStatus;
  industry: string;
  created_at: string;
  agentsCompleted: number;
  totalAgents: number;
}

const MONO = { fontFamily: "'DM Mono', monospace" };

const statusConfig: Record<ProjectStatus, { label: string; icon: React.ElementType; className: string }> = {
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  building: {
    label: "Building",
    icon: Loader2,
    className: "bg-blue-500/10 text-blue-300 border-blue-400/20",
  },
  draft: {
    label: "Draft",
    icon: Clock,
    className: "bg-white/[0.04] text-white/40 border-white/[0.08]",
  },
};

function ProjectCard({ project }: { project: Project }) {
  const cfg = statusConfig[project.status];
  const StatusIcon = cfg.icon;
  const progress = Math.round((project.agentsCompleted / project.totalAgents) * 100);

  return (
    <Link href={`/projects/${project.id}`} className="group block">
      <div className="relative h-full overflow-hidden rounded-2xl border border-white/[0.05] bg-white/[0.02] backdrop-blur-2xl transition-all duration-200 hover:border-blue-400/20 hover:bg-white/[0.03] hover:-translate-y-0.5">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/0 to-transparent transition-all duration-300 group-hover:via-blue-400/40" />
        <div className="p-4 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h3 className="text-[15px] font-semibold text-white/90 leading-tight group-hover:text-blue-300 transition-colors" style={MONO}>
                {project.title}
              </h3>
              <span className="w-fit rounded-sm border border-white/[0.08] px-1.5 py-0 text-[10px] font-medium tracking-wide text-white/40">
                {project.industry}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[11px] font-medium ${cfg.className}`}>
                <StatusIcon className={`h-3 w-3 ${project.status === "building" ? "animate-spin" : ""}`} />
                {cfg.label}
              </span>
              <ArrowUpRight className="h-4 w-4 text-white/20 transition-all group-hover:text-blue-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </div>
        </div>
        <div className="px-4 pb-4">
          <p className="mb-4 text-[13px] leading-relaxed text-white/40 line-clamp-2">
            {project.idea}
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-white/25" style={MONO}>Agents</span>
              <span className="text-[11px] font-semibold text-white/50" style={MONO}>
                {project.agentsCompleted}/{project.totalAgents}
              </span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-blue-400 transition-all duration-500"
                style={{ width: `${progress}%`, boxShadow: progress > 0 ? "0 0 8px rgba(96,165,250,0.8)" : "none" }}
              />
            </div>
          </div>
          <p className="mt-3 text-[11px] text-white/20" style={MONO}>
            {new Date(project.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </p>
        </div>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.02] backdrop-blur-2xl py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500/10 ring-1 ring-blue-400/20">
        <Rocket className="h-7 w-7 text-blue-300" />
      </div>
      <h3 className="mb-1 text-base font-semibold text-white/90" style={MONO}>No projects yet</h3>
      <p className="mb-6 max-w-xs text-sm text-white/40">
        Drop your startup idea and let 9 AI agents build your complete pitch, brand, and go-to-market strategy.
      </p>
      <Link href="/projects/new">
        <Button className="gap-2 bg-white text-[#0A0A0B] shadow-lg shadow-blue-400/15 hover:bg-white/90">
          <Plus className="h-4 w-4" />
          Create First Project
        </Button>
      </Link>
    </div>
  );
}

function StatsBar({ projects }: { projects: Project[] }) {
  const completed = projects.filter((p) => p.status === "completed").length;
  const building = projects.filter((p) => p.status === "building").length;

  return (
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-1.5 text-sm text-white/40">
        <BarChart3 className="h-3.5 w-3.5" />
        <span style={MONO}>{projects.length} total</span>
      </div>
      <div className="h-3 w-px bg-white/[0.08]" />
      <div className="flex items-center gap-1.5 text-sm text-emerald-400">
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span style={MONO}>{completed} done</span>
      </div>
      {building > 0 && (
        <>
          <div className="h-3 w-px bg-white/[0.08]" />
          <div className="flex items-center gap-1.5 text-sm text-blue-300">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span style={MONO}>{building} running</span>
          </div>
        </>
      )}
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();

  // getUser() does a server-side token verification — safe for protected pages
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  // Fetch profile for display name
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  // Fetch real projects
  const { data: rawProjects } = await supabase
    .from("projects")
    .select("id, title, idea, status, industry, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Map to component shape — agent counts come from analysis_results later
  const projects: Project[] = (rawProjects ?? []).map((p) => ({
    ...p,
    agentsCompleted: p.status === "completed" ? 9 : p.status === "building" ? 0 : 0,
    totalAgents: 9,
  }));

  const displayName = profile?.full_name ?? user.email?.split("@")[0] ?? "there";
  const firstName = displayName.split(" ")[0];

  return (
    <AppShell>
      <div className="relative min-h-full w-full overflow-hidden bg-[#0A0A0B] text-white">
        {/* Ambient gradient blobs, matching /project/new intensity */}
        <div className="pointer-events-none absolute inset-0 h-full w-full overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-700/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse delay-700" />
          <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-sky-500/10 rounded-full mix-blend-normal filter blur-[96px] animate-pulse delay-1000" />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl px-8 py-10">
          <div className="mb-8 flex items-start justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <IconDashboard className="h-4 w-4 text-blue-300" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-blue-300" style={MONO}>
                  Workspace
                </span>
              </div>
              <h1 className="text-[28px] font-bold leading-tight tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white/95 to-white/40 pb-1" style={MONO}>
                Hey, {firstName}
              </h1>
              <p className="mt-1 text-sm text-white/40">
                Each project is powered by a 9-agent AI pipeline.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/projects/new">
                <Button size="sm" className="group gap-2 bg-white text-[#0A0A0B] shadow-lg shadow-blue-400/15 hover:bg-white/90 transition-all">
                  <Plus className="h-4 w-4 transition-transform group-hover:rotate-90 duration-200" />
                  New Project
                </Button>
              </Link>
              <SignOut />
            </div>
          </div>

          {projects.length > 0 && (
            <div className="mb-6">
              <StatsBar projects={projects} />
            </div>
          )}

          <div className="mb-6 h-px bg-gradient-to-r from-white/[0.08] via-white/[0.03] to-transparent" />

          {projects.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
              <Link href="/projects/new" className="group block">
                <div className="flex h-full min-h-[180px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.02] backdrop-blur-2xl transition-all duration-200 hover:border-blue-400/20 hover:bg-blue-500/[0.05]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-blue-400/20 bg-blue-500/10 transition-all group-hover:scale-110 group-hover:border-blue-400/40">
                    <Plus className="h-5 w-5 text-blue-300/70 group-hover:text-blue-300" />
                  </div>
                  <span className="text-[12px] font-medium text-white/40 group-hover:text-blue-300 transition-colors" style={MONO}>
                    New Project
                  </span>
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}