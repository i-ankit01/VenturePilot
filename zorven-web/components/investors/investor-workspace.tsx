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
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-blue-500/10" />
            <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 ring-1 ring-blue-400/20">
              <Loader2 className="h-5 w-5 animate-spin text-blue-300" />
            </div>
          </div>
          <p className="text-[12px] text-white/30" style={{ fontFamily: "'DM Mono', monospace" }}>
            Loading investors…
          </p>
        </div>
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
        <div className="flex items-center gap-3 rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300 backdrop-blur-xl">
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