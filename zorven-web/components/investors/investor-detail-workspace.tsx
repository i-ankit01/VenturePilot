"use client";

import Link from "next/link";
import { ArrowLeft, Building2, CalendarCheck, ExternalLink, Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { ProjectSummary } from "@/lib/investors/types";
import { getInvestorStage, getScoreColor, STAGE_LABELS, formatDateTime } from "@/lib/investors/utils";
import { useInvestorDetail } from "@/hooks/use-investor-detail";
import { MatchScoreGauge } from "./match-score-gauge";
import { ScoreBreakdownBars } from "./score-breakdown-bars";
import { EmailDraftPanel } from "./email-draft-panel";
import { ReplyPanel } from "./reply-panel";
import { MeetingScheduler } from "./meeting-scheduler";
import { ConversationDialog } from "./conversation-dialog";
import { Loader2 } from "lucide-react";

const STAGE_PILL: Record<string, string> = {
  matched:    "bg-muted text-muted-foreground",
  drafted:    "bg-secondary text-secondary-foreground",
  sent:       "bg-primary/10 text-primary",
  replied:    "bg-[oklch(0.72_0.19_152)]/10 text-[oklch(0.72_0.19_152)]",
  reply_sent: "bg-[oklch(0.72_0.19_152)]/10 text-[oklch(0.72_0.19_152)]",
  scheduled:  "bg-[oklch(0.78_0.16_85)]/10 text-[oklch(0.78_0.16_85)]",
};

interface Props {
  project: ProjectSummary;
  projectId: string;
  investorId: string;
}

export function InvestorDetailWorkspace({ project, projectId, investorId }: Props) {
  const {
    investor,
    thread,
    draft,
    replyDraft,
    latestInbound,
    loading,
    error,
    autoScheduledBanner,
    isPending,
    sendEmail,
    generateReply,
    sendReply,
    scheduleMeeting,
  } = useInvestorDetail(projectId, investorId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  if (!investor) {
    return (
      <div className="flex flex-col items-center gap-3 py-32 text-center">
        <p className="text-sm text-muted-foreground">Investor not found.</p>
        <Button asChild variant="outline" size="sm">
          <Link href={`/investors/${projectId}`}>Back to list</Link>
        </Button>
      </div>
    );
  }

  const stage      = getInvestorStage(investor);
  const scoreColor = getScoreColor(investor.overall_score);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href={`/investors/${projectId}`}
          className="flex items-center gap-1.5 transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          {project.title}
        </Link>
        <span>/</span>
        <span className="text-foreground">{investor.name}</span>
      </div>

      {/* Auto-scheduled banner */}
      {autoScheduledBanner && (
        <div className="flex items-center gap-2 rounded-lg border border-[oklch(0.78_0.16_85)]/30 bg-[oklch(0.78_0.16_85)]/8 px-4 py-3 text-sm text-[oklch(0.78_0.16_85)]">
          <CalendarCheck className="size-4 shrink-0" />
          Meeting automatically scheduled — the investor proposed a time and a confirmation was sent.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-[oklch(0.66_0.21_25)]/30 bg-[oklch(0.66_0.21_25)]/8 px-4 py-3 text-sm text-[oklch(0.66_0.21_25)]">
          {error}
        </div>
      )}

      {/* Split layout */}
      <div className="grid gap-6 lg:grid-cols-[2fr_3fr] lg:items-start">

        {/* ── Left: Profile panel ──────────────────────────────────── */}
        <div className="space-y-0 rounded-xl border border-border bg-card lg:sticky lg:top-6">

          {/* Header: avatar + name */}
          <div className="flex items-start gap-4 p-5">
            <div
              className="flex size-12 shrink-0 items-center justify-center rounded-full text-lg font-bold"
              style={{
                background: `color-mix(in oklch, ${scoreColor} 15%, transparent)`,
                color: scoreColor,
                border: `2px solid color-mix(in oklch, ${scoreColor} 30%, transparent)`,
              }}
            >
              {investor.name[0]}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-base font-semibold leading-tight">{investor.name}</h1>
              <div className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Building2 className="size-3.5 shrink-0" />
                <span className="truncate">{investor.firm}</span>
                {investor.title && (
                  <span className="shrink-0 text-muted-foreground/60">· {investor.title}</span>
                )}
              </div>
              <div className="mt-1 flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground/60">
                <Mail className="size-3 shrink-0" />
                <span className="truncate">{investor.email}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Score */}
          <div className="flex items-center justify-between px-5 py-4">
            <div className="space-y-2.5 flex-1">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Match score
              </p>
              <ScoreBreakdownBars
                sectorFit={investor.sector_fit}
                stageFit={investor.stage_fit}
                thesisAlignment={investor.thesis_alignment}
              />
            </div>
            <MatchScoreGauge score={investor.overall_score} />
          </div>

          <Separator />

          {/* Bio */}
          {investor.bio && (
            <>
              <div className="px-5 py-4">
                <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Bio
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">{investor.bio}</p>
              </div>
              <Separator />
            </>
          )}

          {/* Focus + stages */}
          {(investor.focus_areas.length > 0 || investor.investment_stages.length > 0) && (
            <>
              <div className="px-5 py-4">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Focus
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {investor.investment_stages.map((s) => (
                    <span key={s} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                      {s}
                    </span>
                  ))}
                  {investor.focus_areas.map((f) => (
                    <span key={f} className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Reasoning */}
          {investor.reasoning.length > 0 && (
            <>
              <div className="px-5 py-4">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Why this match
                </p>
                <ul className="space-y-1.5">
                  {investor.reasoning.map((point, i) => (
                    <li key={i} className="text-sm leading-snug text-muted-foreground">
                      · {point}
                    </li>
                  ))}
                </ul>
              </div>
              {investor.relevant_signal && <Separator />}
            </>
          )}

          {/* Relevant signal */}
          {investor.relevant_signal && (
            <div className="px-5 py-4">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Recent signal
              </p>
              <div className="rounded-lg border border-border/60 bg-muted/40 p-3 text-sm leading-relaxed text-foreground/80">
                {investor.relevant_signal}
              </div>
            </div>
          )}

          {/* Source link */}
          {investor.source_url && (
            <>
              <Separator />
              <div className="px-5 py-3">
                <a
                  href={investor.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ExternalLink className="size-3" />
                  Source
                </a>
              </div>
            </>
          )}
        </div>

        {/* ── Right: Outreach panel ────────────────────────────────── */}
        <div className="space-y-4">

          {/* Panel header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-semibold">Outreach</h2>
              <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium", STAGE_PILL[stage])}>
                {STAGE_LABELS[stage]}
              </span>
            </div>
            <ConversationDialog thread={thread} investorName={investor.name} />
          </div>

          {/* Stage-dependent content */}
          <div className="rounded-xl border border-border bg-card p-5">
            {stage === "matched" && (
              <div className="flex flex-col items-center gap-3 py-8 text-center text-muted-foreground">
                <Mail className="size-8 opacity-30" />
                <p className="text-sm">No email drafted yet.</p>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/investors/${projectId}`}>
                    Generate emails from the investor list
                  </Link>
                </Button>
              </div>
            )}

            {stage === "drafted" && draft && (
              <EmailDraftPanel
                investor={investor}
                draft={draft}
                sending={isPending("send-email")}
                onSend={sendEmail}
              />
            )}

            {stage === "sent" && (
              <div className="space-y-3">
                <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>
                      Sent{investor.last_outbound_at
                        ? ` on ${new Date(investor.last_outbound_at).toLocaleString()}`
                        : ""}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <RefreshCw className="size-3 animate-spin [animation-duration:3s]" />
                      Watching for reply
                    </span>
                  </div>
                </div>

                {thread.length > 0 && thread[0].body && (
                  <div className="rounded-lg border border-border/60 bg-muted/10 p-4">
                    <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      Sent email
                    </p>
                    {thread[0].subject && (
                      <p className="mb-2 text-sm font-medium">{thread[0].subject}</p>
                    )}
                    <p className="line-clamp-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                      {thread[0].body}
                    </p>
                  </div>
                )}
              </div>
            )}

            {(stage === "replied" || stage === "reply_sent") && latestInbound && (
              <ReplyPanel
                investor={investor}
                latestInbound={latestInbound}
                replyDraft={replyDraft}
                replySent={stage === "reply_sent"}
                drafting={isPending("generate-reply")}
                sending={isPending("send-reply")}
                onDraftReply={generateReply}
                onSendReply={sendReply}
              />
            )}

            {stage === "scheduled" && (
              <div className="rounded-lg border border-[oklch(0.78_0.16_85)]/20 bg-[oklch(0.78_0.16_85)]/6 p-4 text-sm">
                <div className="flex items-center gap-2 text-[oklch(0.78_0.16_85)]">
                  <CalendarCheck className="size-4" />
                  <span className="font-medium">
                    Meeting scheduled for {formatDateTime(investor.upcoming_meeting_time)}
                  </span>
                </div>
                {investor.upcoming_meet_link && (
                  <a
                    href={investor.upcoming_meet_link}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <ExternalLink className="size-3" />
                    {investor.upcoming_meet_link}
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Meeting scheduler — shown when applicable but not yet scheduled */}
          {(stage === "reply_sent") && investor.last_reply_sentiment !== "negative" && (
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Schedule a call
              </p>
              <MeetingScheduler
                investor={investor}
                scheduling={isPending("schedule-meeting")}
                onSchedule={scheduleMeeting}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}