"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MessageSquareReply, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InvestorRecord } from "@/lib/investors/types";

const SENTIMENT_STYLES: Record<string, string> = {
  positive: "bg-[oklch(0.72_0.19_152)]/10 text-[oklch(0.72_0.19_152)]",
  neutral: "bg-muted text-muted-foreground",
  negative: "bg-[oklch(0.66_0.21_25)]/10 text-[oklch(0.66_0.21_25)]",
  needs_info: "bg-[oklch(0.80_0.16_85)]/12 text-[oklch(0.80_0.16_85)]",
};

const SENTIMENT_LABELS: Record<string, string> = {
  positive: "Interested",
  neutral: "Neutral",
  negative: "Declined",
  needs_info: "Has questions",
};

interface ReplyPanelProps {
  investor: InvestorRecord;
  drafting: boolean;
  sending: boolean;
  onDraftReply: () => void;
  onSendReply: (body: string) => void;
}

export function ReplyPanel({ investor, drafting, sending, onDraftReply, onSendReply }: ReplyPanelProps) {
  const [replyBody, setReplyBody] = useState(investor.reply_draft ?? "");

  useEffect(() => {
    if (investor.reply_draft) setReplyBody(investor.reply_draft);
  }, [investor.reply_draft]);

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-muted/30 p-3.5">
        <div className="mb-1.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <MessageSquareReply className="size-3.5" />
            {investor.name.split(" ")[0]} replied
          </div>
          {investor.reply_sentiment && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-medium",
                SENTIMENT_STYLES[investor.reply_sentiment]
              )}
            >
              {SENTIMENT_LABELS[investor.reply_sentiment]}
            </span>
          )}
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
          {investor.reply_received}
        </p>
      </div>

      {investor.reply_sent ? (
        <div className="rounded-lg border border-[oklch(0.72_0.19_152)]/25 bg-[oklch(0.72_0.19_152)]/6 p-3.5 text-sm">
          <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">{investor.reply_draft}</p>
          <p className="mt-2 text-xs font-medium text-[oklch(0.72_0.19_152)]">Response sent</p>
        </div>
      ) : investor.reply_draft ? (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="size-3.5" />
            Suggested response
          </div>
          <Textarea
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            rows={6}
            className="resize-y leading-relaxed"
          />
          <div className="flex justify-end">
            <Button onClick={() => onSendReply(replyBody)} disabled={sending || !replyBody}>
              {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Approve & send
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex justify-end">
          <Button variant="secondary" onClick={onDraftReply} disabled={drafting}>
            {drafting ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Draft a response
          </Button>
        </div>
      )}
    </div>
  );
}