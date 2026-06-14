import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGmailStatus } from "@/lib/investors/api";
import { InvestorWorkspace } from "@/components/investors/investor-workspace";
import type { ProjectSummary } from "@/lib/investors/types";
import { AppShell } from "@/components/layout/app-shell";

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export default async function InvestorWorkspacePage({ params }: PageProps) {
  const { projectId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: project } = await supabase
    .from("projects")
    .select(
      "id, title, idea, industry, target_market, stage, status, created_at",
    )
    .eq("id", projectId)
    .single();

  if (!project) redirect("/investors");

  let gmailConnected = false;
  try {
    const status = await getGmailStatus(user.id);
    gmailConnected = status.connected;
  } catch {
    gmailConnected = false;
  }

  return (
    <AppShell>
    <InvestorWorkspace
      project={project as ProjectSummary}
      userId={user.id}
      gmailConnected={gmailConnected}
    />
    </AppShell>
  );
}
