import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Building2, Mail } from "lucide-react";
import type { InvestorRecord } from "@/lib/investors/types";
import { getInvestorStage } from "@/lib/investors/utils";
import { MatchScoreGauge } from "./match-score-gauge";
import { ScoreBreakdownBars } from "./score-breakdown-bars";
import { InvestorStatusPill } from "./investor-status-pill";
import { EmailDraftPanel } from "./email-draft-panel";
import { ReplyPanel } from "./reply-panel";
import { MeetingScheduler } from "./meeting-scheduler";

interface InvestorCardProps {
  investor: InvestorRecord;
  rank: number;
  isPending: (action: string) => boolean;
  onSendEmail: (override: { subject: string; body: string }) => void;
  onGenerateReply: () => void;
  onSendReply: (body: string) => void;
  onScheduleMeeting: (payload: { start_time: string; end_time: string }) => void;
}

export function InvestorCard({
  investor,
  rank,
  isPending,
  onSendEmail,
  onGenerateReply,
  onSendReply,
  onScheduleMeeting,
}: InvestorCardProps) {
  const stage = getInvestorStage(investor);

  return (
    <Card className="overflow-hidden border-border/80 p-0">
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-start gap-4">
          <span className="font-mono text-2xl font-semibold leading-none text-muted-foreground/40">
            {String(rank).padStart(2, "0")}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold leading-tight">{investor.name}</h3>
              <InvestorStatusPill investor={investor} />
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Building2 className="size-3.5" />
              <span>{investor.firm}</span>
              {investor.title && <span className="text-muted-foreground/60">· {investor.title}</span>}
            </div>
            <div className="mt-1 flex items-center gap-1.5 font-mono text-xs text-muted-foreground/70">
              <Mail className="size-3.5" />
              {investor.email}
            </div>
          </div>

          <MatchScoreGauge score={investor.overall_score} />
        </div>

        {(investor.investment_stages.length > 0 || investor.focus_areas.length > 0) && (
          <div className="flex flex-wrap gap-1.5">
            {investor.investment_stages.map((s) => (
              <span
                key={s}
                className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
              >
                {s}
              </span>
            ))}
            {investor.focus_areas.map((f) => (
              <span key={f} className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
                {f}
              </span>
            ))}
          </div>
        )}

        <ScoreBreakdownBars
          sectorFit={investor.sector_fit}
          stageFit={investor.stage_fit}
          thesisAlignment={investor.thesis_alignment}
        />
      </div>

      {stage !== "matched" && <Separator />}

      <div className="p-5 pt-4">
        {stage === "drafted" && (
          <EmailDraftPanel investor={investor} sending={isPending("send-email")} onSend={onSendEmail} />
        )}

        {stage === "sent" && (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-3.5 text-sm text-muted-foreground">
            Sent
            {investor.email_sent_at ? ` on ${new Date(investor.email_sent_at).toLocaleString()}` : ""} — checking
            for a reply every 30 seconds.
          </div>
        )}

        {(stage === "replied" || stage === "reply_sent") && (
          <ReplyPanel
            investor={investor}
            drafting={isPending("generate-reply")}
            sending={isPending("send-reply")}
            onDraftReply={onGenerateReply}
            onSendReply={onSendReply}
          />
        )}

        {(stage === "reply_sent" || stage === "scheduled") && investor.reply_sentiment !== "negative" && (
          <div className="mt-4">
            <MeetingScheduler
              investor={investor}
              scheduling={isPending("schedule-meeting")}
              onSchedule={onScheduleMeeting}
            />
          </div>
        )}
      </div>
    </Card>
  );
}