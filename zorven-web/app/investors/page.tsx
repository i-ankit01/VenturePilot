import { createClient } from "@/lib/supabase/server";
import { InvestorProjectCard } from "@/components/investors/investor-project-card";
import { Radar } from "lucide-react";
import type { ProjectSummary } from "@/lib/investors/types";

export default async function InvestorsPage() {
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, idea, industry, target_market, stage, status, created_at")
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  const completed = (projects ?? []) as ProjectSummary[];

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Find Investors</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Select a project</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a completed analysis to find, score, and reach out to matching investors.
        </p>
      </div>

      {completed.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Radar className="size-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-medium">No completed projects yet</h3>
            <p className="mx-auto max-w-sm text-sm text-muted-foreground">
              Finish running the analysis pipeline on a project to start matching it with investors.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {completed.map((project) => (
            <InvestorProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}