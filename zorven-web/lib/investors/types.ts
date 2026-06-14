export type ReplySentiment = "positive" | "neutral" | "negative" | "needs_info";

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
  email_subject: string | null;
  email_body: string | null;
  email_sent: boolean;
  email_sent_at: string | null;
  gmail_thread_id: string | null;
  reply_received: string | null;
  reply_received_at: string | null;
  reply_draft: string | null;
  reply_sentiment: ReplySentiment | null;
  reply_sent: boolean;
  meeting_scheduled: boolean;
  meet_link: string | null;
  meeting_time: string | null;
  created_at: string | null;
  updated_at: string | null;
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