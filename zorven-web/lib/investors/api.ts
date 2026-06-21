import type {
  InvestorRecord,
  InvestorOverview,
  InvestorMessage,
  Meeting,
  GenerateReplyResult,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export function searchInvestors(projectId: string) {
  return request<{ investors: InvestorRecord[] }>(
    `/api/investors/${projectId}/search`,
    { method: "POST" }
  );
}

export function getInvestors(projectId: string) {
  return request<{ investors: InvestorOverview[] }>(`/api/investors/${projectId}`);
}

export function getInvestorMessages(projectId: string, investorId: string) {
  return request<{ messages: InvestorMessage[] }>(
    `/api/investors/${projectId}/${investorId}/messages`
  );
}

export function getInvestorDraft(projectId: string, investorId: string) {
  return request<{ draft: InvestorMessage | null }>(
    `/api/investors/${projectId}/${investorId}/draft`
  );
}

export function generateEmails(projectId: string) {
  return request<{ drafts: InvestorMessage[] }>(
    `/api/investors/${projectId}/generate-emails`,
    { method: "POST" }
  );
}

export function sendInvestorEmail(
  projectId: string,
  investorId: string,
  override: { subject: string; body: string }
) {
  return request<InvestorMessage>(
    `/api/investors/${projectId}/${investorId}/send-email`,
    { method: "POST", body: JSON.stringify(override) }
  );
}

export function checkReplies(projectId: string) {
  return request<{ new_messages: InvestorMessage[] }>(
    `/api/investors/${projectId}/check-replies`
  );
}

export function generateReply(projectId: string, investorId: string) {
  return request<GenerateReplyResult>(
    `/api/investors/${projectId}/${investorId}/generate-reply`,
    { method: "POST" }
  );
}

export function sendInvestorReply(projectId: string, investorId: string, body: string) {
  return request<InvestorMessage>(
    `/api/investors/${projectId}/${investorId}/send-reply`,
    { method: "POST", body: JSON.stringify({ body }) }
  );
}

export function scheduleMeeting(
  projectId: string,
  investorId: string,
  payload: { start_time: string; end_time: string; timezone?: string }
) {
  return request<Meeting>(
    `/api/investors/${projectId}/${investorId}/schedule-meeting`,
    { method: "POST", body: JSON.stringify(payload) }
  );
}

export function getGmailStatus(userId: string) {
  return request<{ connected: boolean }>(`/api/auth/google/status?user_id=${userId}`);
}

export function getGmailConnectUrl(userId: string, projectId: string) {
  return `${API_BASE_URL}/api/auth/google/login?user_id=${userId}&project_id=${projectId}`;
}