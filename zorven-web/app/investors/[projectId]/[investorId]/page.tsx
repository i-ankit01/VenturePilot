import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import { InvestorDetailWorkspace } from "@/components/investors/investor-detail-workspace";
import type { ProjectSummary } from "@/lib/investors/types";

interface PageProps {
  params: Promise<{ projectId: string; investorId: string }>;
}

export default async function InvestorDetailPage({ params }: PageProps) {
  const { projectId, investorId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: project } = await supabase
    .from("projects")
    .select("id, title, idea, industry, target_market, stage, status, created_at")
    .eq("id", projectId)
    .single();

  if (!project) redirect("/investors");

  return (
    <AppShell>
      <InvestorDetailWorkspace
        project={project as ProjectSummary}
        projectId={projectId}
        investorId={investorId}
      />
    </AppShell>
  );
}