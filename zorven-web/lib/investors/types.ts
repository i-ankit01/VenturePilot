export type ReplySentiment = "positive" | "neutral" | "negative" | "needs_info";
export type MessageDirection = "outbound" | "inbound";
export type DraftedBy = "agent" | "human";
export type MeetingStatus = "scheduled" | "cancelled" | "completed" | "rescheduled";

export interface InvestorRecord {
  id: string;
  project_id: string;
  name: string;
  firm: string;
  title: string | null;
  email: string;
  focus_areas: string[];
  investment_stages: string[];
  bio: string;
  source_url: string | null;
  overall_score: number;
  sector_fit: number;
  stage_fit: number;
  thesis_alignment: number;
  reasoning: string[];
  relevant_signal: string | null;
  gmail_thread_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface InvestorOverview extends InvestorRecord {
  email_sent: boolean;
  has_draft: boolean;
  last_outbound_at: string | null;
  last_inbound_at: string | null;
  last_reply_sentiment: ReplySentiment | null;
  meeting_scheduled: boolean;
  upcoming_meet_link: string | null;
  upcoming_meeting_time: string | null;
}

export interface InvestorMessage {
  id: string;
  project_id: string;
  investor_id: string;
  direction: MessageDirection;
  is_draft: boolean;
  subject: string | null;
  body: string;
  gmail_message_id: string | null;
  gmail_thread_id: string | null;
  sentiment: ReplySentiment | null;
  drafted_by: DraftedBy;
  proposed_start: string | null;
  proposed_end: string | null;
  sent_at: string | null;
  created_at: string | null;
}

export interface Meeting {
  id: string;
  project_id: string;
  investor_id: string;
  source_message_id: string | null;
  google_event_id: string | null;
  meet_link: string | null;
  start_time: string;
  end_time: string;
  timezone: string;
  status: MeetingStatus;
  scheduled_via: DraftedBy;
  created_at: string | null;
  updated_at: string | null;
}

export interface GenerateReplyResult {
  auto_scheduled: boolean;
  meeting?: Meeting;
  message: InvestorMessage;
}

export type InvestorStage =
  | "matched"
  | "drafted"
  | "sent"
  | "replied"
  | "reply_sent"
  | "scheduled";

export interface ProjectSummary {
  id: string;
  title: string;
  idea: string;
  industry: string | null;
  target_market: string | null;
  stage: string | null;
  status: "pending" | "building" | "completed" | "error";
  created_at: string;
}