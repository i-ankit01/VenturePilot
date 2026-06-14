from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID


class InvestorMatchScore(BaseModel):
    overall_score: int = Field(ge=0, le=100)
    sector_fit: int = Field(ge=0, le=100)
    stage_fit: int = Field(ge=0, le=100)
    thesis_alignment: int = Field(ge=0, le=100)
    reasoning: list[str]
    relevant_signal: str | None = None


class InvestorProfile(BaseModel):
    """Shape returned by the scoring agent for one investor."""
    name: str
    firm: str
    title: str | None = None
    email: str
    focus_areas: list[str]
    investment_stages: list[str]
    bio: str
    source_url: str | None = None
    match_score: InvestorMatchScore


class InvestorScoringResponse(BaseModel):
    """Structured output schema for the scoring agent call."""
    investors: list[InvestorProfile]


class InvestorRecord(BaseModel):
    """Full row shape as stored in / returned from Supabase."""
    id: UUID | None = None
    project_id: UUID

    name: str
    firm: str
    title: str | None = None
    email: str
    focus_areas: list[str] = []
    investment_stages: list[str] = []
    bio: str
    source_url: str | None = None

    overall_score: int
    sector_fit: int
    stage_fit: int
    thesis_alignment: int
    reasoning: list[str] = []
    relevant_signal: str | None = None

    email_subject: str | None = None
    email_body: str | None = None
    email_sent: bool = False
    email_sent_at: datetime | None = None
    gmail_thread_id: str | None = None

    reply_received: str | None = None
    reply_received_at: datetime | None = None
    reply_draft: str | None = None
    reply_sent: bool = False

    meeting_scheduled: bool = False
    meet_link: str | None = None
    meeting_time: datetime | None = None

    created_at: datetime | None = None
    updated_at: datetime | None = None


class EmailDraft(BaseModel):
    subject: str
    body: str


class EmailDraftResponse(BaseModel):
    """Structured output for the email-drafting agent (one investor)."""
    draft: EmailDraft


class ReplyDraftResponse(BaseModel):
    """Structured output for the reply-drafting agent."""
    draft: EmailDraft
    sentiment: str  # "positive" | "neutral" | "negative" | "needs_info"