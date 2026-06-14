import os
from datetime import datetime, timezone
from uuid import UUID

from tavily import TavilyClient

from agents import investor_agent
from schemas.investor import InvestorRecord
from services.supabase_client import get_supabase
from integrations import google_auth, gmail_client, calendar_client

tavily_client = TavilyClient(api_key=os.environ["TAVILY_API_KEY"])


def _get_startup_context(project_id: str) -> dict:
    """Fetch the planner agent's refined output for this project."""
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
    """Run targeted Tavily queries and return raw search hits."""
    industry = startup_context.get("industry", "")
    stage = startup_context.get("stage", "")
    geography = startup_context.get("geography", "")

    queries = [
        f"{industry} {stage} startup investors {geography} contact email",
        f"venture capital investors recent investments {industry} startups 2026",
    ]

    raw_hits = []
    for query in queries:
        response = tavily_client.search(
            query=query,
            search_depth="advanced",
            max_results=8,
        )
        for hit in response.get("results", []):
            raw_hits.append({
                "title": hit.get("title"),
                "url": hit.get("url"),
                "content": hit.get("content"),
            })

    return raw_hits


async def find_investors(project_id: str) -> list[InvestorRecord]:
    """
    Stage 1: search + score.
      1. fetch startup context (planner output)
      2. run Tavily searches
      3. agent extracts + scores + ranks candidates
      4. keep top 5-10, persist, return
    """
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
    # re-running search for a project replaces the previous shortlist
    supabase.table("investors").delete().eq("project_id", project_id).execute()

    insert_payload = [
        record.model_dump(exclude={"id", "created_at", "updated_at"}, mode="json")
        for record in records
    ]
    inserted = supabase.table("investors").insert(insert_payload).execute()

    return [InvestorRecord(**row) for row in inserted.data]


def get_investors(project_id: str) -> list[InvestorRecord]:
    supabase = get_supabase()
    result = (
        supabase.table("investors")
        .select("*")
        .eq("project_id", project_id)
        .order("overall_score", desc=True)
        .execute()
    )
    return [InvestorRecord(**row) for row in result.data]


async def generate_emails(project_id: str) -> list[InvestorRecord]:
    """Stage 2: draft a personalized email for every investor on this project."""
    startup_context = _get_startup_context(project_id)
    investors = get_investors(project_id)

    if not investors:
        raise ValueError("No investors found for this project - run search first")

    supabase = get_supabase()
    updated = []

    for investor in investors:
        draft = investor_agent.draft_investor_email(startup_context, investor)

        result = (
            supabase.table("investors")
            .update({
                "email_subject": draft.draft.subject,
                "email_body": draft.draft.body,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            })
            .eq("id", str(investor.id))
            .execute()
        )
        updated.append(InvestorRecord(**result.data[0]))

    return updated


# gmail Oauth 
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


async def send_investor_email(project_id: str, investor_id: str) -> InvestorRecord:
    user_id = _get_project_user_id(project_id)
    creds = google_auth.get_credentials_for_user(user_id)
    investor = _get_investor(investor_id)

    if not investor.email_subject or not investor.email_body:
        raise ValueError("No email draft found - generate emails first")

    sent = gmail_client.send_email(
        creds, to=investor.email, subject=investor.email_subject, body=investor.email_body,
    )

    supabase = get_supabase()
    result = (
        supabase.table("investors")
        .update({
            "email_sent": True,
            "email_sent_at": datetime.now(timezone.utc).isoformat(),
            "gmail_thread_id": sent["threadId"],
            "updated_at": datetime.now(timezone.utc).isoformat(),
        })
        .eq("id", investor_id)
        .execute()
    )
    return InvestorRecord(**result.data[0])


async def check_replies(project_id: str) -> list[InvestorRecord]:
    user_id = _get_project_user_id(project_id)
    creds = google_auth.get_credentials_for_user(user_id)
    my_email = gmail_client.get_profile_email(creds)

    supabase = get_supabase()
    updated = []

    for investor in get_investors(project_id):
        if not investor.gmail_thread_id or investor.reply_received:
            continue

        messages = gmail_client.get_thread_messages(creds, investor.gmail_thread_id)
        if len(messages) < 2:
            continue

        latest = messages[-1]
        if my_email in gmail_client.get_header(latest, "From"):
            continue  # latest message is still ours

        reply_text = gmail_client.extract_message_text(latest)

        result = (
            supabase.table("investors")
            .update({
                "reply_received": reply_text,
                "reply_received_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            })
            .eq("id", str(investor.id))
            .execute()
        )
        updated.append(InvestorRecord(**result.data[0]))

    return updated


async def generate_reply(project_id: str, investor_id: str) -> InvestorRecord:
    startup_context = _get_startup_context(project_id)
    investor = _get_investor(investor_id)

    if not investor.reply_received:
        raise ValueError("No reply received yet for this investor")

    draft = investor_agent.draft_reply(startup_context, investor, investor.reply_received)

    supabase = get_supabase()
    result = (
        supabase.table("investors")
        .update({
            "reply_draft": draft.draft.body,
            "reply_sentiment": draft.sentiment,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        })
        .eq("id", investor_id)
        .execute()
    )
    return InvestorRecord(**result.data[0])


async def send_investor_reply(project_id: str, investor_id: str, body: str | None = None) -> InvestorRecord:
    user_id = _get_project_user_id(project_id)
    creds = google_auth.get_credentials_for_user(user_id)
    investor = _get_investor(investor_id)

    reply_body = body or investor.reply_draft
    if not reply_body:
        raise ValueError("No reply draft to send")

    thread_messages = gmail_client.get_thread_messages(creds, investor.gmail_thread_id)
    original_message_id = gmail_client.get_header(thread_messages[0], "Message-ID")

    gmail_client.send_email(
        creds,
        to=investor.email,
        subject=f"Re: {investor.email_subject}",
        body=reply_body,
        thread_id=investor.gmail_thread_id,
        in_reply_to_message_id=original_message_id,
    )

    supabase = get_supabase()
    result = (
        supabase.table("investors")
        .update({"reply_sent": True, "updated_at": datetime.now(timezone.utc).isoformat()})
        .eq("id", investor_id)
        .execute()
    )
    return InvestorRecord(**result.data[0])


async def schedule_meeting(
    project_id: str,
    investor_id: str,
    start_time: str,
    end_time: str,
    timezone_str: str = "Asia/Kolkata",
) -> InvestorRecord:
    user_id = _get_project_user_id(project_id)
    creds = google_auth.get_credentials_for_user(user_id)
    investor = _get_investor(investor_id)
    startup_context = _get_startup_context(project_id)

    meeting = calendar_client.create_meeting(
        creds,
        summary=f"{startup_context.get('refined_idea', 'Intro call')} <> {investor.firm}",
        description=f"Intro call: {startup_context.get('one_liner', '')} — {investor.name} ({investor.firm})",
        start_time=start_time,
        end_time=end_time,
        attendee_email=investor.email,
        timezone_str=timezone_str,
    )

    supabase = get_supabase()
    result = (
        supabase.table("investors")
        .update({
            "meeting_scheduled": True,
            "meet_link": meeting["meet_link"],
            "meeting_time": start_time,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        })
        .eq("id", investor_id)
        .execute()
    )
    return InvestorRecord(**result.data[0])