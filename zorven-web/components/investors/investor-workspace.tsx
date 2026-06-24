"use client";

import { Loader2 } from "lucide-react";
import { useInvestorFlow } from "@/hooks/use-investor-flow";
import { getGmailConnectUrl } from "@/lib/investors/api";
import type { ProjectSummary } from "@/lib/investors/types";
import { InvestorWorkspaceHeader } from "./investor-workspace-header";
import { InvestorEmptyState } from "./investor-empty-state";
import { InvestorCard } from "./investor-card";
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
    isPending,
    getDraft,
    getLatestInbound,
    getReplyDraft,
    searchInvestors,
    generateEmails,
    sendEmail,
    generateReply,
    sendReply,
    scheduleMeeting,
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
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
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
        <div className="space-y-4">
          {investors.map((investor, idx) => (
            <InvestorCard
              key={investor.id}
              investor={investor}
              rank={idx + 1}
              draft={getDraft(investor.id)}
              latestInbound={getLatestInbound(investor.id)}
              replyDraft={getReplyDraft(investor.id)}
              isPending={(action) => isPending(investor.id, action)}
              onSendEmail={(override) => sendEmail(investor.id, override)}
              onGenerateReply={() => generateReply(investor.id)}
              onSendReply={(body) => sendReply(investor.id, body)}
              onScheduleMeeting={(payload) => scheduleMeeting(investor.id, payload)}
            />
          ))}
        </div>
      )}
    </div>
  );
}