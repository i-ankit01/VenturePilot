"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
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

const SENTIMENT_LABELS: Record<string, string> = {
  positive:   "Interested",
  neutral:    "Neutral",
  negative:   "Declined",
  needs_info: "Has questions",
};

const SENTIMENT_STYLES: Record<string, string> = {
  positive:   "bg-[oklch(0.72_0.19_152)]/10 text-[oklch(0.72_0.19_152)]",
  neutral:    "bg-muted text-muted-foreground",
  negative:   "bg-[oklch(0.66_0.21_25)]/10 text-[oklch(0.66_0.21_25)]",
  needs_info: "bg-[oklch(0.80_0.16_85)]/12 text-[oklch(0.80_0.16_85)]",
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
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <MessageSquare className="size-3.5" />
          View conversation
          <span className="rounded-full bg-muted px-1.5 py-0.5 font-mono text-[10px]">
            {thread.length}
          </span>
        </Button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[80vh] max-w-2xl flex-col gap-0 p-0">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4">
          <DialogTitle className="text-sm font-semibold">
            Conversation with {investorName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {thread.map((msg, i) => {
            const isOutbound = msg.direction === "outbound";
            return (
              <div
                key={msg.id ?? i}
                className={cn("flex flex-col gap-1", isOutbound ? "items-end" : "items-start")}
              >
                {/* subject only on first message or when it changes */}
                {msg.subject && (i === 0 || msg.subject !== thread[i - 1]?.subject) && (
                  <p className="px-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {msg.subject}
                  </p>
                )}

                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    isOutbound
                      ? "rounded-tr-sm bg-primary text-primary-foreground"
                      : "rounded-tl-sm bg-muted text-foreground",
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.body}</p>
                </div>

                <div className={cn("flex items-center gap-2 px-1", isOutbound ? "flex-row-reverse" : "flex-row")}>
                  <span className="font-mono text-[10px] text-muted-foreground/60">
                    {isOutbound ? "You" : investorName.split(" ")[0]} · {formatDateTime(msg.sent_at)}
                  </span>
                  {msg.sentiment && (
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", SENTIMENT_STYLES[msg.sentiment])}>
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