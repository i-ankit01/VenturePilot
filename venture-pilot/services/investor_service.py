import os
from datetime import datetime, timezone
from uuid import UUID

from tavily import TavilyClient

from agents import investor_agent
from schemas.investor import InvestorRecord
from services.supabase_client import get_supabase

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