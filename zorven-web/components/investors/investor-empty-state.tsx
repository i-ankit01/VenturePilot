"use client";

import { Loader2, Radar } from "lucide-react";

const MONO = { fontFamily: "'DM Mono', monospace" };

interface InvestorEmptyStateProps {
  searching: boolean;
  onSearch: () => void;
}

export function InvestorEmptyState({ searching, onSearch }: InvestorEmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-5 rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.02] backdrop-blur-2xl py-20 text-center">
      <div className="relative">
        <div className="absolute inset-0 animate-ping rounded-full bg-blue-500/10" />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10 ring-1 ring-blue-400/20">
          <Radar className="h-6 w-6 text-blue-300" />
        </div>
      </div>
      <div className="space-y-1.5">
        <h3 className="text-base font-semibold text-white/90" style={MONO}>
          No investors matched yet
        </h3>
        <p className="mx-auto max-w-sm text-sm leading-relaxed text-white/40">
          Run a search to surface investors whose focus and recent activity line up with this startup, scored and
          ranked out of 100.
        </p>
      </div>
      <button
        onClick={onSearch}
        disabled={searching}
        className="flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-[13px] font-medium text-[#0A0A0B] shadow-lg shadow-blue-400/15 transition-all hover:bg-white/90 disabled:opacity-50"
        style={MONO}
      >
        {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radar className="h-4 w-4" />}
        {searching ? "Searching…" : "Find investors"}
      </button>
    </div>
  );
}