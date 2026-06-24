"use client";

import { useState } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";
import type { InvestorOverview, InvestorMessage } from "@/lib/investors/types";

const MONO = { fontFamily: "'DM Mono', monospace" };

interface EmailDraftPanelProps {
  investor: InvestorOverview;
  draft: InvestorMessage;
  sending: boolean;
  onSend: (override: { subject: string; body: string }) => void;
}

export function EmailDraftPanel({ investor, draft, sending, onSend }: EmailDraftPanelProps) {
  const [subject, setSubject] = useState(draft.subject ?? "");
  const [body, setBody]       = useState(draft.body ?? "");
  const canSend = !sending && !!subject && !!body;

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_220px]">
      {/* Email compose area */}
      <div className="space-y-4">
        {/* Subject */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold uppercase tracking-widest text-white/30" style={MONO}>
            Subject
          </label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] font-medium text-white/90 placeholder:text-white/20 backdrop-blur-xl transition-colors focus:border-blue-400/40 focus:outline-none focus:ring-1 focus:ring-blue-400/30"
            style={MONO}
          />
        </div>

        {/* Body */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold uppercase tracking-widest text-white/30" style={MONO}>
            Message
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={9}
            className="w-full resize-y rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm leading-relaxed text-white/80 placeholder:text-white/20 backdrop-blur-xl transition-colors focus:border-blue-400/40 focus:outline-none focus:ring-1 focus:ring-blue-400/30"
          />
        </div>

        {/* Send */}
        <div className="flex justify-end">
          <button
            onClick={() => onSend({ subject, body })}
            disabled={!canSend}
            className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-[13px] font-medium text-[#0A0A0B] shadow-lg shadow-blue-400/15 transition-all hover:bg-white/90 disabled:opacity-40"
            style={MONO}
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send to {investor.name.split(" ")[0]}
          </button>
        </div>
      </div>

      {/* Why this investor sidebar */}
      <div className="relative overflow-hidden rounded-xl border border-blue-400/15 bg-gradient-to-b from-blue-500/[0.08] to-transparent p-4 backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent" />
        <div className="mb-3 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-blue-300" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-blue-300/80" style={MONO}>
            Why this investor
          </span>
        </div>
        <ul className="space-y-2">
          {investor.reasoning.map((point, i) => (
            <li key={i} className="flex items-start gap-2 text-[12px] leading-snug text-white/55">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-blue-400/50" />
              {point}
            </li>
          ))}
        </ul>
        {investor.relevant_signal && (
          <div className="mt-4 rounded-lg border border-blue-400/10 bg-blue-500/[0.05] p-3 text-[12px] leading-relaxed text-white/50">
            <span className="block mb-1 text-[10px] font-semibold uppercase tracking-widest text-blue-300/60" style={MONO}>
              Signal
            </span>
            {investor.relevant_signal}
          </div>
        )}
      </div>
    </div>
  );
}