"use client";

import { useEffect, useState } from "react";
import { Loader2, MessageSquareReply, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InvestorOverview, InvestorMessage } from "@/lib/investors/types";

const MONO = { fontFamily: "'DM Mono', monospace" };

const SENTIMENT_STYLES: Record<string, string> = {
  positive:   "border-emerald-400/20 bg-emerald-500/[0.08] text-emerald-300",
  neutral:    "border-white/[0.08]   bg-white/[0.03]       text-white/40",
  negative:   "border-rose-400/20    bg-rose-500/[0.08]     text-rose-300",
  needs_info: "border-amber-400/20   bg-amber-500/[0.08]   text-amber-300",
};

const SENTIMENT_LABELS: Record<string, string> = {
  positive:   "Interested",
  neutral:    "Neutral",
  negative:   "Declined",
  needs_info: "Has questions",
};

interface ReplyPanelProps {
  investor: InvestorOverview;
  latestInbound: InvestorMessage;
  replyDraft: InvestorMessage | null;
  replySent: boolean;
  drafting: boolean;
  sending: boolean;
  onDraftReply: () => void;
  onSendReply: (body: string) => void;
}

export function ReplyPanel({
  investor, latestInbound, replyDraft, replySent,
  drafting, sending, onDraftReply, onSendReply,
}: ReplyPanelProps) {
  const [replyBody, setReplyBody] = useState(replyDraft?.body ?? "");

  useEffect(() => {
    if (replyDraft?.body) setReplyBody(replyDraft.body);
  }, [replyDraft?.body]);

  const sentiment = latestInbound.sentiment ?? investor.last_reply_sentiment;

  return (
    <div className="space-y-4">
      {/* Inbound message */}
      <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/35" style={MONO}>
            <MessageSquareReply className="h-3.5 w-3.5" />
            {investor.name.split(" ")[0]} replied
          </div>
          {sentiment && (
            <span
              className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-medium", SENTIMENT_STYLES[sentiment] ?? SENTIMENT_STYLES["neutral"])}
              style={MONO}
            >
              {SENTIMENT_LABELS[sentiment]}
            </span>
          )}
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/75">
          {latestInbound.body}
        </p>
      </div>

      {/* Reply sent confirmation */}
      {replySent ? (
        <div className="relative overflow-hidden rounded-xl border border-emerald-400/15 bg-emerald-500/[0.06] p-4 backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/75">{replyDraft?.body}</p>
          <p className="mt-2.5 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400" style={MONO}>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_#34d399]" />
            Response sent
          </p>
        </div>

      /* Draft ready to approve */ ) : replyDraft ? (
        <div className="space-y-3">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-blue-300" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-blue-300/80" style={MONO}>
              Suggested response
            </span>
          </div>
          <textarea
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            rows={6}
            className="w-full resize-y rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm leading-relaxed text-white/80 backdrop-blur-xl transition-colors focus:border-blue-400/40 focus:outline-none focus:ring-1 focus:ring-blue-400/30"
          />
          <div className="flex justify-end">
            <button
              onClick={() => onSendReply(replyBody)}
              disabled={sending || !replyBody}
              className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-[13px] font-medium text-[#0A0A0B] shadow-lg shadow-blue-400/15 transition-all hover:bg-white/90 disabled:opacity-40"
              style={MONO}
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Approve &amp; send
            </button>
          </div>
        </div>

      /* No draft yet */ ) : (
        <div className="flex justify-end">
          <button
            onClick={onDraftReply}
            disabled={drafting}
            className="flex items-center gap-2 rounded-lg border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-[13px] font-medium text-blue-300 backdrop-blur-xl transition-all hover:border-blue-400/35 hover:bg-blue-500/15 disabled:opacity-40"
            style={MONO}
          >
            {drafting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Draft a response
          </button>
        </div>
      )}
    </div>
  );
}