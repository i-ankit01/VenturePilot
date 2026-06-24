"use client";

import { Loader2, RefreshCw, Search, Sparkles } from "lucide-react";
import type { InvestorOverview, ProjectSummary } from "@/lib/investors/types";

const MONO = { fontFamily: "'DM Mono', monospace" };

interface InvestorWorkspaceHeaderProps {
  project: ProjectSummary;
  investors: InvestorOverview[];
  searching: boolean;
  generatingEmails: boolean;
  onSearch: () => void;
  onGenerateEmails: () => void;
  onCheckReplies: () => void;
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span
        className="text-lg font-bold leading-none"
        style={{
          ...MONO,
          ...(accent
            ? { backgroundImage: accent, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }
            : { color: "rgba(255,255,255,0.85)" }),
        }}
      >
        {value}
      </span>
      <span className="text-[10px] uppercase tracking-widest text-white/25" style={MONO}>
        {label}
      </span>
    </div>
  );
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

  const NEON = "linear-gradient(90deg, rgb(147,197,253) 0%, rgba(96,165,250,0.85) 60%, rgba(255,255,255,0.7) 100%)";

  return (
    <div className="space-y-5">
      {/* Title block */}
      <div>
        <div className="mb-1 flex items-center gap-2">
          <Search className="h-3.5 w-3.5 text-blue-300" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-blue-300" style={MONO}>
            Find Investors
          </p>
        </div>
        <h1
          className="text-[26px] font-bold leading-tight tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white/95 to-white/40 pb-0.5"
          style={MONO}
        >
          {project.title}
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-white/40">{project.idea}</p>
      </div>

      {/* Stats bar */}
      {hasInvestors && (
        <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl px-6 py-4">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent" />
          <div className="flex items-center justify-around gap-4">
            <Stat label="Matched"   value={matched}   accent={NEON} />
            <div className="h-8 w-px bg-white/[0.06]" />
            <Stat label="Drafted"   value={drafted} />
            <div className="h-8 w-px bg-white/[0.06]" />
            <Stat label="Sent"      value={sent} />
            <div className="h-8 w-px bg-white/[0.06]" />
            <Stat label="Replied"   value={replied}   accent={replied > 0 ? "linear-gradient(90deg, #34d399, #6ee7b7)" : undefined} />
            <div className="h-8 w-px bg-white/[0.06]" />
            <Stat label="Scheduled" value={scheduled} accent={scheduled > 0 ? "linear-gradient(90deg, #fbbf24, #fde68a)" : undefined} />
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onSearch}
          disabled={searching}
          className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-[13px] font-medium text-[#0A0A0B] shadow-lg shadow-blue-400/15 transition-all hover:bg-white/90 disabled:opacity-50"
          style={MONO}
        >
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {hasInvestors ? "Re-run search" : "Find investors"}
        </button>

        {hasInvestors && !allDrafted && (
          <button
            onClick={onGenerateEmails}
            disabled={generatingEmails}
            className="flex items-center gap-2 rounded-lg border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-[13px] font-medium text-blue-300 backdrop-blur-xl transition-all hover:border-blue-400/35 hover:bg-blue-500/15 disabled:opacity-50"
            style={MONO}
          >
            {generatingEmails ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate emails
          </button>
        )}

        {sent > 0 && (
          <button
            onClick={onCheckReplies}
            className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-[13px] font-medium text-white/60 backdrop-blur-xl transition-all hover:border-white/20 hover:text-white/80"
            style={MONO}
          >
            <RefreshCw className="h-4 w-4" />
            Check replies
          </button>
        )}
      </div>
    </div>
  );
}