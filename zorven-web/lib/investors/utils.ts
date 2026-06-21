import type { InvestorOverview, InvestorStage } from "./types";

export function getInvestorStage(investor: InvestorOverview): InvestorStage {
  if (investor.meeting_scheduled) return "scheduled";

  const lastIn = investor.last_inbound_at ? new Date(investor.last_inbound_at).getTime() : null;
  const lastOut = investor.last_outbound_at ? new Date(investor.last_outbound_at).getTime() : null;

  if (lastIn !== null && lastOut !== null && lastOut > lastIn) return "reply_sent"; // we replied after their last message
  if (lastIn !== null) return "replied"; // they replied, awaiting our follow-up
  if (investor.email_sent) return "sent";
  if (investor.has_draft) return "drafted";
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