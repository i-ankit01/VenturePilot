"""
Investor Matching Agent

Responsibilities:
- extract structured investor profiles from raw Tavily search hits
- score and rank candidates against the startup's profile
- draft personalized outreach emails using the scoring context
- draft replies to investor responses
"""

from openai import OpenAI  # swap for your shared client if one exists
from schemas.investor import (
    InvestorScoringResponse,
    EmailDraftResponse,
    ReplyDraftResponse,
    InvestorRecord,
    InvestorMessage,
)

client = OpenAI()
MODEL = "gpt-4o-mini"


SCORING_SYSTEM_PROMPT = """You are an investor-matching analyst for a startup \
intelligence platform. You will be given a startup's profile and a list of \
raw web search results about potential investors. From these results:

1. Extract distinct investor profiles - name, firm, title, email, focus \
   areas, typical investment stages, and a short bio.
2. ONLY include investors for whom you can find a usable email address in \
   the source content. Discard candidates without one.
3. Score each remaining investor:
   - sector_fit (0-100): alignment between the investor's focus areas and \
     the startup's industry/product
   - stage_fit (0-100): alignment between the investor's typical stage and \
     the startup's current stage
   - thesis_alignment (0-100): alignment between the investor's broader \
     thesis/recent activity and the startup's core problem and unique angle
   - overall_score (0-100): your holistic judgment
4. reasoning: 2-4 short, concrete bullet points referencing specifics from \
   the investor's bio - not generic statements.
5. relevant_signal: if the source mentions a recent or notable investment, \
   summarize it in one sentence (e.g. "Led a $4M seed round in a B2B \
   logistics SaaS company in early 2026"). Otherwise null.

Return investors sorted by overall_score descending."""


def score_investors(startup_context: dict, raw_hits: list[dict]) -> InvestorScoringResponse:
    user_content = {
        "startup": startup_context,
        "search_results": raw_hits,
    }

    completion = client.beta.chat.completions.parse(
        model=MODEL,
        messages=[
            {"role": "system", "content": SCORING_SYSTEM_PROMPT},
            {"role": "user", "content": str(user_content)},
        ],
        response_format=InvestorScoringResponse,
    )
    return completion.choices[0].message.parsed


EMAIL_SYSTEM_PROMPT = """You are a startup founder's outreach assistant. \
Write a short, personalized cold email introducing the startup to an \
investor.

- Subject: specific, not generic - reference the startup's one-liner or the \
  investor's relevant_signal.
- Body, 3 short paragraphs max:
  1. Who you are + one-sentence pitch (use the startup's one_liner)
  2. WHY THIS INVESTOR - reference their relevant_signal or focus_areas \
     specifically, showing you've done your homework
  3. Soft ask - interest in a brief call, no pressure
- Confident, concise, human - not salesy or AI-sounding. No "I hope this \
  email finds you well."
- Sign off with [Your Name]"""


def draft_investor_email(startup_context: dict, investor: InvestorRecord) -> EmailDraftResponse:
    user_content = {
        "startup": startup_context,
        "investor": {
            "name": investor.name,
            "firm": investor.firm,
            "title": investor.title,
            "focus_areas": investor.focus_areas,
            "investment_stages": investor.investment_stages,
            "bio": investor.bio,
            "relevant_signal": investor.relevant_signal,
            "match_reasoning": investor.reasoning,
        },
    }

    completion = client.beta.chat.completions.parse(
        model=MODEL,
        messages=[
            {"role": "system", "content": EMAIL_SYSTEM_PROMPT},
            {"role": "user", "content": str(user_content)},
        ],
        response_format=EmailDraftResponse,
    )
    return completion.choices[0].message.parsed


REPLY_SYSTEM_PROMPT = """You are a startup founder's outreach assistant. You're given the full \
email conversation with one investor so far, oldest to newest, and need to draft the next reply.

1. sentiment: classify the investor's LATEST message only - "positive" (wants to talk), \
   "neutral" (polite non-committal), "negative" (declining), or "needs_info" (asking a question \
   before deciding).

2. proposed_meeting: only set this if the investor's LATEST message names a specific day AND \
   time (e.g. "Tuesday 3pm", "June 25th morning") - not just "let's hop on a call". Assume a \
   30-minute meeting unless stated otherwise, and Asia/Kolkata timezone unless the investor named \
   another. confidence is "high" only when both day and time are unambiguous. Otherwise return null.

3. draft: write the next reply.
   - positive/neutral, no proposed_meeting: thank them, then ALWAYS offer 2-3 concrete time slots \
     over the next few business days - never just ask "when works for you" with nothing offered. \
     Keep pushing the conversation toward an actual booked call.
   - positive/neutral, proposed_meeting extracted with high confidence: confirm that exact time \
     back to them and mention a calendar invite with a Meet link is on its way. Don't ask them to \
     pick again.
   - needs_info: answer directly using the startup context, then still offer to schedule a call.
   - negative: thank them graciously, no pressure, leave the door open. No meeting push here.
   - Match the tone of the prior messages in the thread - confident, concise, human.
   - Sign off with [Your Name]"""


def draft_reply(
    startup_context: dict,
    investor: InvestorRecord,
    thread: list[InvestorMessage],
) -> ReplyDraftResponse:
    transcript = [
        {
            "from": "founder" if m.direction == "outbound" else "investor",
            "subject": m.subject,
            "body": m.body,
            "sent_at": m.sent_at.isoformat() if m.sent_at else None,
        }
        for m in thread
    ]

    user_content = {
        "startup": startup_context,
        "investor": {"name": investor.name, "firm": investor.firm},
        "conversation_so_far_oldest_to_newest": transcript,
    }

    completion = client.beta.chat.completions.parse(
        model=MODEL,
        messages=[
            {"role": "system", "content": REPLY_SYSTEM_PROMPT},
            {"role": "user", "content": str(user_content)},
        ],
        response_format=ReplyDraftResponse,
    )
    return completion.choices[0].message.parsed