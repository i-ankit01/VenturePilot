import type { InvestorRecord, InvestorStage } from "./types";

export function getInvestorStage(investor: InvestorRecord): InvestorStage {
  if (investor.meeting_scheduled) return "scheduled";
  if (investor.reply_sent) return "reply_sent";
  if (investor.reply_received) return "replied";
  if (investor.email_sent) return "sent";
  if (investor.email_body) return "drafted";
  return "matched";
}

export const STAGE_LABELS: Record<InvestorStage, string> = {
  matched: "Matched",
  drafted: "Draft ready",
  sent: "Awaiting reply",
  replied: "Replied",
  reply_sent: "Response sent",
  scheduled: "Meeting scheduled",
};

export function getScoreColor(score: number): string {
  if (score >= 80) return "oklch(0.72 0.19 152)"; // strong match - green
  if (score >= 60) return "oklch(0.80 0.16 85)";  // moderate - amber
  return "oklch(0.66 0.21 25)";                    // weak - coral
}

export function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}