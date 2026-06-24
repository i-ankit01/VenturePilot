"use client";

import { Loader2 } from "lucide-react";
import { useInvestorFlow } from "@/hooks/use-investor-flow";
import { getGmailConnectUrl } from "@/lib/investors/api";
import type { ProjectSummary } from "@/lib/investors/types";
import { InvestorWorkspaceHeader } from "./investor-workspace-header";
import { InvestorEmptyState } from "./investor-empty-state";
import { InvestorListCard } from "./investor-list-card";
import { GmailConnectBanner } from "./gmail-connect-banner";

interface InvestorWorkspaceProps {
  project: ProjectSummary;
  userId: string;
  gmailConnected: boolean;
}

export function InvestorWorkspace({ project, userId, gmailConnected }: InvestorWorkspaceProps) {
  const {
    investors,
    loading,
    searching,
    generatingEmails,
    error,
    searchInvestors,
    generateEmails,
    checkRepliesNow,
  } = useInvestorFlow(project.id);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-8">
      <InvestorWorkspaceHeader
        project={project}
        investors={investors}
        searching={searching}
        generatingEmails={generatingEmails}
        onSearch={searchInvestors}
        onGenerateEmails={generateEmails}
        onCheckReplies={checkRepliesNow}
      />

      {error && (
        <div className="rounded-lg border border-[oklch(0.66_0.21_25)]/30 bg-[oklch(0.66_0.21_25)]/8 px-4 py-3 text-sm text-[oklch(0.66_0.21_25)]">
          {error}
        </div>
      )}

      {!gmailConnected && investors.length > 0 && (
        <GmailConnectBanner connectUrl={getGmailConnectUrl(userId, project.id)} />
      )}

      {investors.length === 0 ? (
        <InvestorEmptyState searching={searching} onSearch={searchInvestors} />
      ) : (
        <div className="space-y-2">
          {investors.map((investor, idx) => (
            <InvestorListCard
              key={investor.id}
              investor={investor}
              projectId={project.id}
              rank={idx + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}