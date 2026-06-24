import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Search, Sparkles } from "lucide-react";
import type { InvestorOverview, ProjectSummary } from "@/lib/investors/types";

interface InvestorWorkspaceHeaderProps {
  project: ProjectSummary;
  investors: InvestorOverview[];
  searching: boolean;
  generatingEmails: boolean;
  onSearch: () => void;
  onGenerateEmails: () => void;
  onCheckReplies: () => void;
}

export function InvestorWorkspaceHeader({
  project,
  investors,
  searching,
  generatingEmails,
  onSearch,
  onGenerateEmails,
  onCheckReplies,
}: InvestorWorkspaceHeaderProps) {
  const matched   = investors.length;
  const drafted   = investors.filter((i) => i.has_draft || i.email_sent).length;
  const sent      = investors.filter((i) => i.email_sent).length;
  const replied   = investors.filter((i) => i.last_inbound_at !== null).length;
  const scheduled = investors.filter((i) => i.meeting_scheduled).length;

  const hasInvestors = matched > 0;
  const allDrafted   = hasInvestors && drafted === matched;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Find Investors</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{project.title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{project.idea}</p>
      </div>

      {hasInvestors && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-lg border border-border bg-card/50 px-4 py-2.5 font-mono text-xs text-muted-foreground">
          <Stat label="Matched" value={matched} />
          <Stat label="Drafted" value={drafted} />
          <Stat label="Sent" value={sent} />
          <Stat label="Replied" value={replied} />
          <Stat label="Scheduled" value={scheduled} />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button onClick={onSearch} disabled={searching} variant={hasInvestors ? "outline" : "default"}>
          {searching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          {hasInvestors ? "Re-run search" : "Find investors"}
        </Button>

        {hasInvestors && !allDrafted && (
          <Button onClick={onGenerateEmails} disabled={generatingEmails}>
            {generatingEmails ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Generate emails
          </Button>
        )}

        {sent > 0 && (
          <Button onClick={onCheckReplies} variant="outline">
            <RefreshCw className="size-4" />
            Check replies
          </Button>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-foreground">{value}</span>
      <span className="uppercase tracking-wider">{label}</span>
    </span>
  );
}