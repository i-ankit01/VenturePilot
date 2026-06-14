"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Send, Sparkles } from "lucide-react";
import type { InvestorRecord } from "@/lib/investors/types";

interface EmailDraftPanelProps {
  investor: InvestorRecord;
  sending: boolean;
  onSend: (override: { subject: string; body: string }) => void;
}

export function EmailDraftPanel({ investor, sending, onSend }: EmailDraftPanelProps) {
  const [subject, setSubject] = useState(investor.email_subject ?? "");
  const [body, setBody] = useState(investor.email_body ?? "");

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label
            htmlFor={`subject-${investor.id}`}
            className="text-xs uppercase tracking-wider text-muted-foreground"
          >
            Subject
          </Label>
          <Input
            id={`subject-${investor.id}`}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="font-medium"
          />
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor={`body-${investor.id}`}
            className="text-xs uppercase tracking-wider text-muted-foreground"
          >
            Message
          </Label>
          <Textarea
            id={`body-${investor.id}`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={9}
            className="resize-y leading-relaxed"
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={() => onSend({ subject, body })} disabled={sending || !subject || !body}>
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Send to {investor.name.split(" ")[0]}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3.5">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
          <Sparkles className="size-3.5" />
          Why this investor
        </div>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          {investor.reasoning.map((point, i) => (
            <li key={i} className="leading-snug">
              • {point}
            </li>
          ))}
        </ul>
        {investor.relevant_signal && (
          <div className="mt-3 rounded-md border border-border/60 bg-background/60 p-2 text-xs leading-relaxed text-foreground">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Signal —{" "}
            </span>
            {investor.relevant_signal}
          </div>
        )}
      </div>
    </div>
  );
}