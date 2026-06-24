"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { InvestorMessage } from "@/lib/investors/types";
import { formatDateTime } from "@/lib/investors/utils";

const MONO = { fontFamily: "'DM Mono', monospace" };

const SENTIMENT_LABELS: Record<string, string> = {
  positive:   "Interested",
  neutral:    "Neutral",
  negative:   "Declined",
  needs_info: "Has questions",
};

const SENTIMENT_STYLES: Record<string, string> = {
  positive:   "border-emerald-400/20 bg-emerald-500/[0.08] text-emerald-300",
  neutral:    "border-white/[0.08]   bg-white/[0.03]       text-white/40",
  negative:   "border-rose-400/20    bg-rose-500/[0.08]     text-rose-300",
  needs_info: "border-amber-400/20   bg-amber-500/[0.08]   text-amber-300",
};

export function ConversationDialog({
  thread,
  investorName,
}: {
  thread: InvestorMessage[];
  investorName: string;
}) {
  const [open, setOpen] = useState(false);

  if (thread.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-1.5 text-[12px] text-white/45 backdrop-blur-xl transition-all hover:border-white/20 hover:text-white/75"
          style={MONO}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          View conversation
          <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[10px] tabular-nums">
            {thread.length}
          </span>
        </button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[80vh] max-w-5xl flex-col gap-0 overflow-hidden border-white/[0.08] bg-[#0A0A0B] p-0 text-white shadow-2xl backdrop-blur-2xl">
        {/* Top edge glow */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent" />

        <DialogHeader className="shrink-0 border-b border-white/[0.06] px-6 py-4">
          <DialogTitle className="flex items-center gap-2.5 text-[13px] font-semibold text-white/90" style={MONO}>
            <MessageSquare className="h-4 w-4 text-blue-300" />
            Conversation with {investorName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
          {thread.map((msg, i) => {
            const isOutbound = msg.direction === "outbound";
            return (
              <div
                key={msg.id ?? i}
                className={cn("flex flex-col gap-1.5", isOutbound ? "items-end" : "items-start")}
              >
                {/* Subject line */}
                {msg.subject && (i === 0 || msg.subject !== thread[i - 1]?.subject) && (
                  <p className="px-1 text-[10px] uppercase tracking-widest text-white/25" style={MONO}>
                    {msg.subject}
                  </p>
                )}

                {/* Bubble */}
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    isOutbound
                      ? "rounded-tr-sm border border-blue-400/20 bg-blue-500/[0.12] text-white/90"
                      : "rounded-tl-sm border border-white/[0.06] bg-white/[0.04] text-white/80",
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.body}</p>
                </div>

                {/* Meta row */}
                <div className={cn("flex items-center gap-2 px-1", isOutbound ? "flex-row-reverse" : "flex-row")}>
                  <span className="text-[10px] text-white/25" style={MONO}>
                    {isOutbound ? "You" : investorName.split(" ")[0]} · {formatDateTime(msg.sent_at)}
                  </span>
                  {msg.sentiment && (
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                        SENTIMENT_STYLES[msg.sentiment] ?? SENTIMENT_STYLES["neutral"]
                      )}
                      style={MONO}
                    >
                      {SENTIMENT_LABELS[msg.sentiment]}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}