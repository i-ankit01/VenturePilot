"use client";

import Link from "next/link";
import {
  ArrowLeft, Building2, CalendarCheck, ExternalLink,
  Mail, RefreshCw, Loader2
} from "lucide-react";
import {
  IconChevronRight, IconBriefcase, IconMailCheck,
  IconMailFast, IconCalendarCheck, IconMessage2Check, IconUserCheck
} from "@tabler/icons-react";
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

const MONO = { fontFamily: "'DM Mono', monospace" };

// ─── Stage config ─────────────────────────────────────────────────────────────
const STAGE_CONFIG: Record<string, { pill: string; icon: React.ElementType }> = {
  matched:    { pill: "border-white/[0.08]    bg-white/[0.03]       text-white/40",      icon: IconUserCheck },
  drafted:    { pill: "border-sky-400/20      bg-sky-500/[0.08]     text-sky-300",       icon: IconMailFast },
  sent:       { pill: "border-blue-400/20     bg-blue-500/[0.08]    text-blue-300",      icon: IconMailCheck },
  replied:    { pill: "border-emerald-400/20  bg-emerald-500/[0.08] text-emerald-300",   icon: IconMessage2Check },
  reply_sent: { pill: "border-emerald-400/20  bg-emerald-500/[0.08] text-emerald-300",   icon: IconMessage2Check },
  scheduled:  { pill: "border-amber-400/20    bg-amber-500/[0.08]   text-amber-300",     icon: IconCalendarCheck },
};

// ─── Deterministic monogram avatar (same as investor-list-card) ───────────────
function nameToHue(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return 200 + (Math.abs(h) % 40);
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function MonogramAvatar({ name, size = "lg" }: { name: string; size?: "sm" | "lg" }) {
  const hue = nameToHue(name);
  const bg     = `hsla(${hue}, 70%, 55%, 0.12)`;
  const border = `hsla(${hue}, 70%, 65%, 0.30)`;
  const text   = `hsla(${hue}, 90%, 82%, 1)`;
  const glow   = `hsla(${hue}, 80%, 60%, 0.35)`;
  const bloom  = `hsla(${hue}, 70%, 55%, 0.15)`;

  if (size === "lg") {
    return (
      <div className="relative">
        {/* Bloom glow behind avatar */}
        <div
          className="absolute inset-0 rounded-full blur-[24px] scale-150"
          style={{ background: bloom }}
        />
        <div
          className="relative flex h-16 w-16 items-center justify-center rounded-full text-[22px] font-bold"
          style={{ ...MONO, background: bg, border: `2px solid ${border}`, color: text, boxShadow: `0 0 20px ${glow}` }}
        >
          {initials(name)}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
      style={{ ...MONO, background: bg, border: `1.5px solid ${border}`, color: text }}
    >
      {initials(name)}
    </div>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-white/30" style={MONO}>
      {children}
    </p>
  );
}

// ─── Panel divider ────────────────────────────────────────────────────────────
function Divider() {
  return <div className="h-px bg-white/[0.05]" />;
}

// ─── Main component ───────────────────────────────────────────────────────────
interface Props {
  project: ProjectSummary;
  projectId: string;
  investorId: string;
}

export function InvestorDetailWorkspace({ project, projectId, investorId }: Props) {
  const {
    investor, thread, draft, replyDraft, latestInbound,
    loading, error, autoScheduledBanner, isPending,
    sendEmail, generateReply, sendReply, scheduleMeeting,
  } = useInvestorDetail(projectId, investorId);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-blue-500/10" />
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 ring-1 ring-blue-400/20">
            <Loader2 className="h-5 w-5 animate-spin text-blue-300" />
          </div>
        </div>
        <p className="text-[12px] text-white/30" style={MONO}>Loading investor…</p>
      </div>
    );
  }

  if (!investor) {
    return (
      <div className="flex flex-col items-center gap-4 py-32 text-center">
        <p className="text-sm text-white/40">Investor not found.</p>
        <Link
          href={`/investors/${projectId}`}
          className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm text-white/60 backdrop-blur-xl transition-all hover:border-white/20 hover:text-white/80"
          style={MONO}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to list
        </Link>
      </div>
    );
  }

  const stage      = getInvestorStage(investor);
  const scoreColor = getScoreColor(investor.overall_score);
  const cfg        = STAGE_CONFIG[stage] ?? STAGE_CONFIG["matched"];
  const StageIcon  = cfg.icon;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-white/40">
        <Link
          href={`/investors/${projectId}`}
          className="flex items-center gap-1.5 transition-colors hover:text-white/80"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{project.title}</span>
        </Link>
        <IconChevronRight className="h-3.5 w-3.5 text-white/20" />
        <span className="text-white/70">{investor.name}</span>
      </div>

      {/* Auto-scheduled banner */}
      {autoScheduledBanner && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-400/20 bg-amber-500/[0.08] px-4 py-3 text-sm text-amber-300 backdrop-blur-xl">
          <CalendarCheck className="h-4 w-4 shrink-0" />
          Meeting automatically scheduled — the investor proposed a time and a confirmation was sent.
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300 backdrop-blur-xl">
          {error}
        </div>
      )}

      {/* Split layout */}
      <div className="grid gap-6 lg:grid-cols-[2fr_3fr] lg:items-start">

        {/* ── Left: Profile panel ── */}
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl lg:sticky lg:top-6">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent" />

          {/* Hero header */}
          <div className="relative overflow-hidden px-6 pb-6 pt-7">
            {/* Background tint matching avatar hue */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-30"
              style={{ background: `linear-gradient(to bottom, hsla(${nameToHue(investor.name)}, 60%, 50%, 0.12), transparent)` }}
            />
            <div className="relative z-10 flex items-start gap-4">
              <MonogramAvatar name={investor.name} size="lg" />
              <div className="min-w-0 flex-1 pt-1">
                <h1
                  className="text-[18px] font-bold leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white/95 to-white/50"
                  style={MONO}
                >
                  {investor.name}
                </h1>
                <div className="mt-1.5 flex items-center gap-1.5 text-[12px] text-white/45">
                  <IconBriefcase className="h-3.5 w-3.5 shrink-0 text-white/30" />
                  <span className="truncate">{investor.firm}</span>
                  {investor.title && (
                    <span className="shrink-0 text-white/25">· {investor.title}</span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-white/30">
                  <Mail className="h-3 w-3 shrink-0" />
                  <span className="truncate">{investor.email}</span>
                </div>
              </div>
            </div>
          </div>

          <Divider />

          {/* Score section */}
          <div className="px-6 py-5">
            <SectionLabel>Match score</SectionLabel>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <ScoreBreakdownBars
                  sectorFit={investor.sector_fit}
                  stageFit={investor.stage_fit}
                  thesisAlignment={investor.thesis_alignment}
                />
              </div>
              <MatchScoreGauge score={investor.overall_score} />
            </div>
          </div>

          {/* Bio */}
          {investor.bio && (
            <>
              <Divider />
              <div className="px-6 py-5">
                <SectionLabel>Bio</SectionLabel>
                <p className="text-sm leading-relaxed text-white/55">{investor.bio}</p>
              </div>
            </>
          )}

          {/* Focus + stages */}
          {(investor.focus_areas.length > 0 || investor.investment_stages.length > 0) && (
            <>
              <Divider />
              <div className="px-6 py-5">
                <SectionLabel>Focus</SectionLabel>
                <div className="flex flex-wrap gap-1.5">
                  {investor.investment_stages.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-blue-400/20 bg-blue-500/[0.08] px-2.5 py-0.5 text-[11px] font-medium text-blue-300/80"
                      style={MONO}
                    >
                      {s}
                    </span>
                  ))}
                  {investor.focus_areas.map((f) => (
                    <span
                      key={f}
                      className="rounded-full border border-white/[0.07] bg-white/[0.03] px-2.5 py-0.5 text-[11px] text-white/45"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Reasoning */}
          {investor.reasoning.length > 0 && (
            <>
              <Divider />
              <div className="px-6 py-5">
                <SectionLabel>Why this match</SectionLabel>
                <ul className="space-y-2">
                  {investor.reasoning.map((point, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-white/55">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-blue-400/50" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {/* Relevant signal */}
          {investor.relevant_signal && (
            <>
              <Divider />
              <div className="px-6 py-5">
                <SectionLabel>Recent signal</SectionLabel>
                <div className="rounded-xl border border-blue-400/10 bg-blue-500/[0.05] p-4 text-sm leading-relaxed text-white/60">
                  {investor.relevant_signal}
                </div>
              </div>
            </>
          )}

          {/* Source link */}
          {investor.source_url && (
            <>
              <Divider />
              <div className="px-6 py-4">
                <a
                  href={investor.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-1.5 text-[12px] text-white/35 transition-colors hover:text-blue-300"
                >
                  <ExternalLink className="h-3 w-3" />
                  View source
                </a>
              </div>
            </>
          )}
        </div>

        {/* ── Right: Outreach panel ── */}
        <div className="space-y-4">

          {/* Outreach header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <h2 className="text-[15px] font-semibold text-white/90" style={MONO}>Outreach</h2>
              <span
                className={cn(
                  "flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium",
                  cfg.pill
                )}
                style={MONO}
              >
                <StageIcon className="h-3 w-3" />
                {STAGE_LABELS[stage]}
              </span>
            </div>
            <ConversationDialog thread={thread} investorName={investor.name} />
          </div>

          {/* Stage-dependent content */}
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl p-6">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/20 to-transparent" />

            {stage === "matched" && (
              <div className="flex flex-col items-center gap-4 py-10 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.04] ring-1 ring-white/[0.08]">
                  <Mail className="h-6 w-6 text-white/25" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/70" style={MONO}>No email drafted yet</p>
                  <p className="mt-1 text-[12px] text-white/35">Generate emails from the investor list to get started.</p>
                </div>
                <Link
                  href={`/investors/${projectId}`}
                  className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-[13px] text-white/55 backdrop-blur-xl transition-all hover:border-white/20 hover:text-white/80"
                  style={MONO}
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to investor list
                </Link>
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
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.015] px-4 py-3">
                  <div className="flex items-center gap-2 text-[12px] text-white/50" style={MONO}>
                    <IconMailCheck className="h-4 w-4 text-blue-300/70" />
                    Sent{investor.last_outbound_at
                      ? ` · ${new Date(investor.last_outbound_at).toLocaleString()}`
                      : ""}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-white/30" style={MONO}>
                    <RefreshCw className="h-3 w-3 animate-spin [animation-duration:3s]" />
                    Watching for reply
                  </div>
                </div>

                {thread.length > 0 && thread[0].body && (
                  <div className="rounded-xl border border-white/[0.05] bg-white/[0.015] p-5">
                    <SectionLabel>Sent email</SectionLabel>
                    {thread[0].subject && (
                      <p className="mb-3 text-[13px] font-semibold text-white/80" style={MONO}>
                        {thread[0].subject}
                      </p>
                    )}
                    <p className="line-clamp-4 whitespace-pre-wrap text-sm leading-relaxed text-white/50">
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
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-3 rounded-xl border border-amber-400/20 bg-amber-500/[0.08] p-5">
                  <CalendarCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                  <div>
                    <p className="text-[13px] font-semibold text-amber-300" style={MONO}>
                      Meeting scheduled
                    </p>
                    <p className="mt-1 text-sm text-amber-200/70">
                      {formatDateTime(investor.upcoming_meeting_time)}
                    </p>
                  </div>
                </div>
                {investor.upcoming_meet_link && (
                  <a
                    href={investor.upcoming_meet_link}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-[12px] text-white/40 backdrop-blur-xl transition-all hover:border-blue-400/25 hover:text-blue-300"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {investor.upcoming_meet_link}
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Meeting scheduler */}
          {stage === "reply_sent" && investor.last_reply_sentiment !== "negative" && (
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl p-6">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent" />
              <SectionLabel>Schedule a call</SectionLabel>
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