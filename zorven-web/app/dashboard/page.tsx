import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Plus,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Loader2,
  Rocket,
  BarChart3,
  Sparkles,
} from "lucide-react";

// ─── Mock data (replace with real API fetch) ──────────────────────────────────
type ProjectStatus = "completed" | "building" | "draft";

interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  agentsCompleted: number;
  totalAgents: number;
  createdAt: string;
  industry: string;
}

const MOCK_PROJECTS: Project[] = [
  {
    id: "1",
    name: "MedSync AI",
    description: "AI-powered patient intake and scheduling automation for independent clinics.",
    status: "completed",
    agentsCompleted: 9,
    totalAgents: 9,
    createdAt: "2 days ago",
    industry: "HealthTech",
  },
  {
    id: "2",
    name: "FleetOS",
    description: "Real-time fleet management platform with predictive maintenance alerts.",
    status: "building",
    agentsCompleted: 5,
    totalAgents: 9,
    createdAt: "1 hour ago",
    industry: "Logistics",
  },
  {
    id: "3",
    name: "Grdn.app",
    description: "Subscription-based garden planning tool with AI plant recommendations.",
    status: "draft",
    agentsCompleted: 0,
    totalAgents: 9,
    createdAt: "5 days ago",
    industry: "Consumer",
  },
];

// ─── Status config ────────────────────────────────────────────────────────────
const statusConfig: Record<ProjectStatus, { label: string; icon: React.ElementType; className: string }> = {
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  building: {
    label: "Building",
    icon: Loader2,
    className: "bg-primary/10 text-primary border-primary/20",
  },
  draft: {
    label: "Draft",
    icon: Clock,
    className: "bg-muted text-muted-foreground border-border",
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function ProjectCard({ project }: { project: Project }) {
  const cfg = statusConfig[project.status];
  const StatusIcon = cfg.icon;
  const progress = Math.round((project.agentsCompleted / project.totalAgents) * 100);

  return (
    <Link href={`/projects/${project.id}`} className="group block">
      <Card className="relative h-full overflow-hidden border-border/60 bg-card transition-all duration-200 hover:border-primary/40 hover:shadow-[0_0_24px_rgba(0,0,0,0.15)] hover:-translate-y-0.5">
        {/* Top glow on hover */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/0 to-transparent transition-all duration-300 group-hover:via-primary/50" />

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h3
                className="text-[15px] font-semibold text-foreground leading-tight group-hover:text-primary transition-colors"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                {project.name}
              </h3>
              <Badge
                variant="outline"
                className="w-fit rounded-sm px-1.5 py-0 text-[10px] font-medium tracking-wide border-border/60 text-muted-foreground"
              >
                {project.industry}
              </Badge>
            </div>

            <div className="flex items-center gap-1.5">
              <span
                className={`flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[11px] font-medium ${cfg.className}`}
              >
                <StatusIcon
                  className={`h-3 w-3 ${project.status === "building" ? "animate-spin" : ""}`}
                />
                {cfg.label}
              </span>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 transition-all group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <p className="mb-4 text-[13px] leading-relaxed text-muted-foreground line-clamp-2">
            {project.description}
          </p>

          {/* Agent progress bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>
                Agents
              </span>
              <span className="text-[11px] font-semibold text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                {project.agentsCompleted}/{project.totalAgents}
              </span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  boxShadow: progress > 0 ? "0 0 8px var(--color-primary)" : "none",
                }}
              />
            </div>
          </div>

          <p className="mt-3 text-[11px] text-muted-foreground/40" style={{ fontFamily: "'DM Mono', monospace" }}>
            {project.createdAt}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/30 py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
        <Rocket className="h-7 w-7 text-primary" />
      </div>
      <h3 className="mb-1 text-base font-semibold text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
        No projects yet
      </h3>
      <p className="mb-6 max-w-xs text-sm text-muted-foreground">
        Drop your startup idea and let 9 AI agents build your complete pitch, brand, and go-to-market strategy.
      </p>
      <Link href="/projects/new">
        <Button className="gap-2 shadow-[0_0_16px_rgba(0,0,0,0.2)]">
          <Plus className="h-4 w-4" />
          Create First Project
        </Button>
      </Link>
    </div>
  );
}

// ─── Stats bar ────────────────────────────────────────────────────────────────
function StatsBar({ projects }: { projects: Project[] }) {
  const completed = projects.filter((p) => p.status === "completed").length;
  const building = projects.filter((p) => p.status === "building").length;

  return (
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <BarChart3 className="h-3.5 w-3.5" />
        <span style={{ fontFamily: "'DM Mono', monospace" }}>
          {projects.length} total
        </span>
      </div>
      <div className="h-3 w-px bg-border" />
      <div className="flex items-center gap-1.5 text-sm text-emerald-400">
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span style={{ fontFamily: "'DM Mono', monospace" }}>{completed} done</span>
      </div>
      {building > 0 && (
        <>
          <div className="h-3 w-px bg-border" />
          <div className="flex items-center gap-1.5 text-sm text-primary">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span style={{ fontFamily: "'DM Mono', monospace" }}>{building} running</span>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const projects = MOCK_PROJECTS;

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-8 py-10">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span
                className="text-[11px] font-semibold uppercase tracking-[0.15em] text-primary"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                Workspace
              </span>
            </div>
            <h1
              className="text-[28px] font-bold leading-tight tracking-tight text-foreground"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              Your Projects
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Each project is powered by a 9-agent AI pipeline.
            </p>
          </div>

          <Link href="/projects/new">
            <Button
              size="sm"
              className="group gap-2 shadow-[0_0_20px_rgba(0,0,0,0.25)] transition-all hover:shadow-[0_0_28px_var(--color-primary)/20]"
            >
              <Plus className="h-4 w-4 transition-transform group-hover:rotate-90 duration-200" />
              New Project
            </Button>
          </Link>
        </div>

        {/* Stats */}
        {projects.length > 0 && (
          <div className="mb-6">
            <StatsBar projects={projects} />
          </div>
        )}

        {/* Divider */}
        <div className="mb-6 h-px bg-gradient-to-r from-border/80 via-border/30 to-transparent" />

        {/* Grid or empty */}
        {projects.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}

            {/* Create new card */}
            <Link href="/projects/new" className="group block">
              <div className="flex h-full min-h-[180px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 bg-card/20 transition-all duration-200 hover:border-primary/40 hover:bg-primary/5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-primary/30 bg-primary/10 transition-all group-hover:scale-110 group-hover:border-primary/60 group-hover:shadow-[0_0_12px_var(--color-primary)/20]">
                  <Plus className="h-5 w-5 text-primary/70 group-hover:text-primary" />
                </div>
                <span
                  className="text-[12px] font-medium text-muted-foreground group-hover:text-primary transition-colors"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  New Project
                </span>
              </div>
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}