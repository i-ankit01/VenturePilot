from pydantic import BaseModel, Field
from datetime import datetime
from typing import Literal
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
    investors: list[InvestorProfile]


class InvestorRecord(BaseModel):
    """Full row shape as stored in / returned from the `investors` table."""
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

    gmail_thread_id: str | None = None

    created_at: datetime | None = None
    updated_at: datetime | None = None


class InvestorOverview(InvestorRecord):
    """Row shape from the `investor_overview` view - investors + computed outreach status."""
    email_sent: bool = False
    last_outbound_at: datetime | None = None
    last_inbound_at: datetime | None = None
    last_reply_sentiment: Literal["positive", "neutral", "negative", "needs_info"] | None = None
    meeting_scheduled: bool = False
    upcoming_meet_link: str | None = None
    upcoming_meeting_time: datetime | None = None


class InvestorMessage(BaseModel):
    """One row in `investor_messages` - a single email, sent or received."""
    id: UUID | None = None
    project_id: UUID
    investor_id: UUID

    direction: Literal["outbound", "inbound"]
    is_draft: bool = False

    subject: str | None = None
    body: str

    gmail_message_id: str | None = None
    gmail_thread_id: str | None = None

    sentiment: Literal["positive", "neutral", "negative", "needs_info"] | None = None
    drafted_by: Literal["agent", "human"] = "agent"

    proposed_start: datetime | None = None
    proposed_end: datetime | None = None

    sent_at: datetime | None = None
    created_at: datetime | None = None


class Meeting(BaseModel):
    """One row in `meetings`."""
    id: UUID | None = None
    project_id: UUID
    investor_id: UUID
    source_message_id: UUID | None = None

    google_event_id: str | None = None
    meet_link: str | None = None
    start_time: datetime
    end_time: datetime
    timezone: str = "Asia/Kolkata"
    status: Literal["scheduled", "cancelled", "completed", "rescheduled"] = "scheduled"
    scheduled_via: Literal["agent", "human"] = "agent"

    created_at: datetime | None = None
    updated_at: datetime | None = None


class EmailDraft(BaseModel):
    subject: str
    body: str


class EmailDraftResponse(BaseModel):
    draft: EmailDraft


class ProposedMeetingTime(BaseModel):
    """Extracted only when the investor's latest message names a concrete day/time."""
    start_time: datetime
    end_time: datetime
    timezone: str = "Asia/Kolkata"
    confidence: Literal["high", "medium", "low"]


class ReplyDraftResponse(BaseModel):
    draft: EmailDraft
    sentiment: Literal["positive", "neutral", "negative", "needs_info"]
    proposed_meeting: ProposedMeetingTime | None = None