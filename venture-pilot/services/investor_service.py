import os
from datetime import datetime, timezone
from uuid import UUID
from email.utils import parsedate_to_datetime

from tavily import TavilyClient

from agents import investor_agent
from schemas.investor import InvestorRecord, InvestorOverview, InvestorMessage, Meeting
from services.supabase_client import get_supabase
from integrations import google_auth, gmail_client, calendar_client

tavily_client = TavilyClient(api_key=os.environ["TAVILY_API_KEY"])


def _get_startup_context(project_id: str) -> dict:
    supabase = get_supabase()
    result = (
        supabase.table("analysis_results")
        .select("output")
        .eq("project_id", project_id)
        .eq("agent", "planner")
        .single()
        .execute()
    )
    if not result.data:
        raise ValueError(f"No planner output found for project {project_id}")
    return result.data["output"]


def _search_tavily_candidates(startup_context: dict) -> list[dict]:
    industry = startup_context.get("industry", "")
    stage = startup_context.get("stage", "")
    geography = startup_context.get("geography", "")

    queries = [
        f"{industry} {stage} startup investors {geography} contact email",
        f"venture capital investors recent investments {industry} startups 2026",
    ]

    raw_hits = []
    for query in queries:
        response = tavily_client.search(query=query, search_depth="advanced", max_results=8)
        for hit in response.get("results", []):
            raw_hits.append({
                "title": hit.get("title"),
                "url": hit.get("url"),
                "content": hit.get("content"),
            })
    return raw_hits


async def find_investors(project_id: str) -> list[InvestorRecord]:
    startup_context = _get_startup_context(project_id)
    raw_hits = _search_tavily_candidates(startup_context)
    scoring_response = investor_agent.score_investors(startup_context, raw_hits)

    ranked = sorted(
        scoring_response.investors,
        key=lambda inv: inv.match_score.overall_score,
        reverse=True,
    )[:10]

    if not ranked:
        raise ValueError("No investors with usable contact info were found")

    records = [
        InvestorRecord(
            project_id=UUID(project_id),
            name=inv.name,
            firm=inv.firm,
            title=inv.title,
            email=inv.email,
            focus_areas=inv.focus_areas,
            investment_stages=inv.investment_stages,
            bio=inv.bio,
            source_url=inv.source_url,
            overall_score=inv.match_score.overall_score,
            sector_fit=inv.match_score.sector_fit,
            stage_fit=inv.match_score.stage_fit,
            thesis_alignment=inv.match_score.thesis_alignment,
            reasoning=inv.match_score.reasoning,
            relevant_signal=inv.match_score.relevant_signal,
        )
        for inv in ranked
    ]

    supabase = get_supabase()
    supabase.table("investors").delete().eq("project_id", project_id).execute()

    insert_payload = [
        record.model_dump(exclude={"id", "created_at", "updated_at"}, mode="json")
        for record in records
    ]
    inserted = supabase.table("investors").insert(insert_payload).execute()
    return [InvestorRecord(**row) for row in inserted.data]


def get_investors(project_id: str) -> list[InvestorRecord]:
    """Raw investors table - profile + score only, no outreach status."""
    supabase = get_supabase()
    result = (
        supabase.table("investors")
        .select("*")
        .eq("project_id", project_id)
        .order("overall_score", desc=True)
        .execute()
    )
    return [InvestorRecord(**row) for row in result.data]


def get_investor_overview(project_id: str) -> list[InvestorOverview]:
    """For the dashboard - investors joined with outreach/meeting status."""
    supabase = get_supabase()
    result = (
        supabase.table("investor_overview")
        .select("*")
        .eq("project_id", project_id)
        .order("overall_score", desc=True)
        .execute()
    )
    return [InvestorOverview(**row) for row in result.data]


def get_investor_thread(investor_id: str) -> list[InvestorMessage]:
    """Full sent conversation for one investor, oldest to newest."""
    return _get_thread(investor_id)


def _get_thread(investor_id: str) -> list[InvestorMessage]:
    supabase = get_supabase()
    result = (
        supabase.table("investor_messages")
        .select("*")
        .eq("investor_id", investor_id)
        .eq("is_draft", False)
        .order("sent_at")
        .execute()
    )
    return [InvestorMessage(**row) for row in result.data]


def _get_investor_draft(investor_id: str, direction: str = "outbound") -> InvestorMessage | None:
    supabase = get_supabase()
    result = (
        supabase.table("investor_messages")
        .select("*")
        .eq("investor_id", investor_id)
        .eq("direction", direction)
        .eq("is_draft", True)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    return InvestorMessage(**result.data[0]) if result.data else None

def get_investor_draft(investor_id: str) -> InvestorMessage | None:
    """Pending unsent outbound draft, if any - lets the frontend repopulate the edit box on reload."""
    return _get_investor_draft(investor_id, direction="outbound")


def _get_project_user_id(project_id: str) -> str:
    supabase = get_supabase()
    result = (
        supabase.table("projects")
        .select("user_id")
        .eq("id", project_id)
        .single()
        .execute()
    )
    if not result.data:
        raise ValueError(f"Project {project_id} not found")
    return result.data["user_id"]


def _get_investor(investor_id: str) -> InvestorRecord:
    supabase = get_supabase()
    result = (
        supabase.table("investors")
        .select("*")
        .eq("id", investor_id)
        .single()
        .execute()
    )
    if not result.data:
        raise ValueError(f"Investor {investor_id} not found")
    return InvestorRecord(**result.data)


async def generate_emails(project_id: str) -> list[InvestorMessage]:
    """Stage 2: draft a personalized first-touch email for every investor, persisted as a draft."""
    startup_context = _get_startup_context(project_id)
    investors = get_investors(project_id)

    if not investors:
        raise ValueError("No investors found for this project - run search first")

    supabase = get_supabase()
    drafts = []

    for investor in investors:
        draft = investor_agent.draft_investor_email(startup_context, investor)

        # an investor only ever has one pending outbound draft at a time
        supabase.table("investor_messages").delete() \
            .eq("investor_id", str(investor.id)) \
            .eq("direction", "outbound") \
            .eq("is_draft", True) \
            .execute()

        result = supabase.table("investor_messages").insert({
            "project_id": project_id,
            "investor_id": str(investor.id),
            "direction": "outbound",
            "is_draft": True,
            "subject": draft.draft.subject,
            "body": draft.draft.body,
            "drafted_by": "agent",
        }).execute()
        drafts.append(InvestorMessage(**result.data[0]))

    return drafts


async def send_investor_email(
    project_id: str,
    investor_id: str,
    subject: str,
    body: str,
) -> InvestorMessage:
    user_id = _get_project_user_id(project_id)
    creds = google_auth.get_credentials_for_user(user_id)
    investor = _get_investor(investor_id)

    if not subject or not body:
        raise ValueError("Subject and body are required to send an email")

    sent = gmail_client.send_email(creds, to=investor.email, subject=subject, body=body)

    supabase = get_supabase()
    draft = _get_investor_draft(investor_id, direction="outbound")
    now = datetime.now(timezone.utc).isoformat()

    payload = {
        "subject": subject,
        "body": body,
        "is_draft": False,
        "gmail_message_id": sent["id"],
        "gmail_thread_id": sent["threadId"],
        "sent_at": now,
    }

    if draft:
        result = supabase.table("investor_messages").update(payload).eq("id", str(draft.id)).execute()
    else:
        payload.update({
            "project_id": project_id,
            "investor_id": investor_id,
            "direction": "outbound",
            "drafted_by": "human",
        })
        result = supabase.table("investor_messages").insert(payload).execute()

    supabase.table("investors").update({
        "gmail_thread_id": sent["threadId"],
        "updated_at": now,
    }).eq("id", investor_id).execute()

    return InvestorMessage(**result.data[0])


async def check_replies(project_id: str) -> list[InvestorMessage]:
    """Pure sync - pulls new inbound messages from Gmail into investor_messages. No LLM here."""
    user_id = _get_project_user_id(project_id)
    creds = google_auth.get_credentials_for_user(user_id)
    my_email = gmail_client.get_profile_email(creds)

    supabase = get_supabase()
    new_messages = []

    for investor in get_investors(project_id):
        if not investor.gmail_thread_id:
            continue

        thread_messages = gmail_client.get_thread_messages(creds, investor.gmail_thread_id)

        existing = (
            supabase.table("investor_messages")
            .select("gmail_message_id")
            .eq("investor_id", str(investor.id))
            .execute()
        )
        known_ids = {row["gmail_message_id"] for row in existing.data if row["gmail_message_id"]}

        for msg in thread_messages:
            gmail_id = msg["id"]
            if gmail_id in known_ids:
                continue
            if my_email in gmail_client.get_header(msg, "From"):
                continue  # our own sent message, already tracked when we sent it

            date_header = gmail_client.get_header(msg, "Date")
            try:
                sent_at = parsedate_to_datetime(date_header).astimezone(timezone.utc).isoformat()
            except (TypeError, ValueError):
                sent_at = datetime.now(timezone.utc).isoformat()

            result = supabase.table("investor_messages").insert({
                "project_id": project_id,
                "investor_id": str(investor.id),
                "direction": "inbound",
                "is_draft": False,
                "subject": gmail_client.get_header(msg, "Subject"),
                "body": gmail_client.extract_message_text(msg),
                "gmail_message_id": gmail_id,
                "gmail_thread_id": investor.gmail_thread_id,
                "sent_at": sent_at,
            }).execute()
            new_messages.append(InvestorMessage(**result.data[0]))

    return new_messages


async def generate_reply(project_id: str, investor_id: str) -> dict:
    """
    Drafts the next reply using the FULL thread as context. If the investor's
    latest message named a concrete day/time, this skips the draft/review step
    entirely - it schedules the meeting and sends the confirmation right away.
    """
    startup_context = _get_startup_context(project_id)
    investor = _get_investor(investor_id)
    thread = _get_thread(investor_id)

    inbound = [m for m in thread if m.direction == "inbound"]
    if not inbound:
        raise ValueError("No reply received yet for this investor")
    latest_inbound = inbound[-1]

    draft = investor_agent.draft_reply(startup_context, investor, thread)

    supabase = get_supabase()
    supabase.table("investor_messages").update({
        "sentiment": draft.sentiment,
        "proposed_start": draft.proposed_meeting.start_time.isoformat() if draft.proposed_meeting else None,
        "proposed_end": draft.proposed_meeting.end_time.isoformat() if draft.proposed_meeting else None,
    }).eq("id", str(latest_inbound.id)).execute()

    if draft.proposed_meeting and draft.proposed_meeting.confidence == "high":
        meeting = await schedule_meeting(
            project_id=project_id,
            investor_id=investor_id,
            start_time=draft.proposed_meeting.start_time.isoformat(),
            end_time=draft.proposed_meeting.end_time.isoformat(),
            timezone_str=draft.proposed_meeting.timezone,
            source_message_id=str(latest_inbound.id),
            scheduled_via="agent",
        )
        sent_message = await send_investor_reply(
            project_id, investor_id, body=draft.draft.body, drafted_by="agent",
        )
        return {"auto_scheduled": True, "meeting": meeting, "message": sent_message}

    # no concrete time yet - leave a normal draft for human review
    supabase.table("investor_messages").delete() \
        .eq("investor_id", investor_id).eq("direction", "outbound").eq("is_draft", True).execute()

    result = supabase.table("investor_messages").insert({
        "project_id": project_id,
        "investor_id": investor_id,
        "direction": "outbound",
        "is_draft": True,
        "subject": f"Re: {latest_inbound.subject}" if latest_inbound.subject else None,
        "body": draft.draft.body,
        "drafted_by": "agent",
    }).execute()

    return {"auto_scheduled": False, "message": InvestorMessage(**result.data[0])}


async def send_investor_reply(
    project_id: str,
    investor_id: str,
    body: str | None = None,
    drafted_by: str = "human",
) -> InvestorMessage:
    user_id = _get_project_user_id(project_id)
    creds = google_auth.get_credentials_for_user(user_id)
    investor = _get_investor(investor_id)

    draft = _get_investor_draft(investor_id, direction="outbound")
    reply_body = body or (draft.body if draft else None)
    if not reply_body:
        raise ValueError("No reply draft to send")

    thread_messages = gmail_client.get_thread_messages(creds, investor.gmail_thread_id)
    original_message_id = gmail_client.get_header(thread_messages[0], "Message-ID")
    last_subject = gmail_client.get_header(thread_messages[-1], "Subject") or "your message"

    sent = gmail_client.send_email(
        creds,
        to=investor.email,
        subject=f"Re: {last_subject}",
        body=reply_body,
        thread_id=investor.gmail_thread_id,
        in_reply_to_message_id=original_message_id,
    )

    supabase = get_supabase()
    payload = {
        "subject": f"Re: {last_subject}",
        "body": reply_body,
        "is_draft": False,
        "gmail_message_id": sent["id"],
        "gmail_thread_id": investor.gmail_thread_id,
        "sent_at": datetime.now(timezone.utc).isoformat(),
        "drafted_by": drafted_by,
    }

    if draft:
        result = supabase.table("investor_messages").update(payload).eq("id", str(draft.id)).execute()
    else:
        payload.update({"project_id": project_id, "investor_id": investor_id, "direction": "outbound"})
        result = supabase.table("investor_messages").insert(payload).execute()

    return InvestorMessage(**result.data[0])


async def schedule_meeting(
    project_id: str,
    investor_id: str,
    start_time: str,
    end_time: str,
    timezone_str: str = "Asia/Kolkata",
    source_message_id: str | None = None,
    scheduled_via: str = "human",
) -> Meeting:
    user_id = _get_project_user_id(project_id)
    creds = google_auth.get_credentials_for_user(user_id)
    investor = _get_investor(investor_id)
    startup_context = _get_startup_context(project_id)

    event = calendar_client.create_meeting(
        creds,
        summary=f"{startup_context.get('refined_idea', 'Intro call')} <> {investor.firm}",
        description=f"Intro call: {startup_context.get('one_liner', '')} — {investor.name} ({investor.firm})",
        start_time=start_time,
        end_time=end_time,
        attendee_email=investor.email,
        timezone_str=timezone_str,
    )

    supabase = get_supabase()
    result = supabase.table("meetings").insert({
        "project_id": project_id,
        "investor_id": investor_id,
        "source_message_id": source_message_id,
        "google_event_id": event.get("event_id"),
        "meet_link": event["meet_link"],
        "start_time": start_time,
        "end_time": end_time,
        "timezone": timezone_str,
        "status": "scheduled",
        "scheduled_via": scheduled_via,
    }).execute()

    return Meeting(**result.data[0])