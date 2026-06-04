"""
agents/competitor.py — The Competitor Agent.

Runs in PARALLEL with product.py, right after research.py.

What it does:
  1. Reads research_output from state (market size, opportunity gap, pain points)
  2. Also reads idea, industry, target_market (refined by planner)
  3. Runs 3 targeted web searches to find REAL competitors
  4. Sends everything to GPT → structured CompetitorOutput
  5. Writes result back into state

Why it's separate from research:
  Research answers "what is the market?"
  Competitor answers "who else is in this market and what are their weaknesses?"
  These are different questions that need different search queries and different
  LLM reasoning. Keeping them separate also means you can re-run competitor
  analysis without re-running the expensive research search.

What it feeds downstream:
  branding.py  → how to position AGAINST competitors
  gtm.py       → which competitor's customers to target first
  pitch.py     → the "why us vs them" investor slide
"""

import os
from dotenv import load_dotenv
from openai import OpenAI

from state import AppState
from schemas.competitor import CompetitorOutput
from tools.web_search import WebSearchTool

load_dotenv()


# ── Prompt ────────────────────────────────────────────────────────────────────

COMPETITOR_SYSTEM_PROMPT = """
You are an expert startup competitive analyst.

You will be given:
- A startup idea with its refined description
- The industry and target market
- Market research data (size, trends, pain points, opportunity gap)
- Real web search results about existing competitors

Your job is to identify and analyze the competitive landscape.

RULES:
- Return ONLY valid JSON. No markdown, no explanation, no preamble.
- List only REAL companies that actually exist — no hypothetical players.
- Mix direct competitors (same solution) and indirect ones (same problem, different solution).
- Weaknesses must be genuine — don't just say "expensive" for everything.
- feature_gaps must be specific to this startup's context, not generic.
- suggested_differentiators must directly counter competitor weaknesses.
"""


def build_competitor_queries(idea: str, industry: str, target_market: str) -> list[str]:
    """
    3 searches — enough to surface 4-5 real competitors without token bloat.

      1. Direct: find tools that do exactly this
      2. Alternatives: what does the target market currently use?
      3. Reviews: what do users complain about in existing tools?
    """
    return [
        f"best {industry} tools software for {target_market} 2024",
        f"{idea} alternatives competitors comparison",
        f"{industry} software reviews complaints problems users {target_market}"
    ]


def run_competitor_agent(state: AppState) -> AppState:
    """
    Main entry point. Reads research_output + idea context from state.
    Returns updated state with competitor_output filled.
    """

    print("\n[Competitor Agent] Starting competitive analysis...")

    # ── Guard: research must have run first ───────────────────────────────
    if not state.get("research_output"):
        errors = state.get("errors") or []
        errors.append("competitor_agent: research_output is missing — run research first")
        return {**state, "errors": errors}

    idea          = state["idea"]
    industry      = state["industry"]
    target_market = state["target_market"]
    research      = state["research_output"]

    # ── Step 1: Web search for real competitors ───────────────────────────
    queries = build_competitor_queries(idea, industry, target_market)
    print(f"[Competitor Agent] Running {len(queries)} competitor searches...")

    search_tool    = WebSearchTool()
    raw_results    = search_tool.search_multiple(queries, max_results_per_query=5)
    formatted      = search_tool.format_for_llm(raw_results)

    print("[Competitor Agent] Search complete. Sending to GPT...")

    # ── Step 2: Build prompt with research context ────────────────────────
    user_prompt = f"""
Startup Idea:  {idea}
Industry:      {industry}
Target Market: {target_market}

--- MARKET RESEARCH CONTEXT ---
Problem:          {research.problem_statement}
Opportunity Gap:  {research.opportunity_gap}
Key Pain Points:  {", ".join(research.pain_points)}
Market Size:      {research.market_size}
--- END CONTEXT ---

--- COMPETITOR SEARCH RESULTS ---
{formatted}
--- END SEARCH RESULTS ---

Using the search results above, identify 3-5 real competitors and fill the full JSON schema.
"""

    # ── Step 3: Call OpenAI with structured output ────────────────────────
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    response = client.beta.chat.completions.parse(
        model="gpt-4o-mini",
        max_tokens=2500,
        messages=[
            {"role": "system", "content": COMPETITOR_SYSTEM_PROMPT},
            {"role": "user",   "content": user_prompt}
        ],
        response_format=CompetitorOutput
    )

    competitor_output = response.choices[0].message.parsed

    if competitor_output is None:
        errors = state.get("errors") or []
        errors.append("competitor_agent: model refused or failed to return structured output")
        return {**state, "errors": errors}

    print(f"[Competitor Agent] ✓ Found {len(competitor_output.competitors)} competitors.")
    print(f"[Competitor Agent]   Market leader: {competitor_output.market_leader}")

    # ── Step 4: Write back to state ───────────────────────────────────────
    completed = state.get("completed_agents") or []
    completed.append("competitor")

    return {
        **state,
        "competitor_output": competitor_output,
        "completed_agents":  completed
    }


# ── Standalone test ───────────────────────────────────────────────────────────

if __name__ == "__main__":
    """
    Test competitor agent with a fake but realistic research_output.

    Usage:
        cd venture-pilot
        source .venv/bin/activate
        python agents/competitor.py
    """
    from schemas.research import MarketResearchOutput

    fake_research = MarketResearchOutput(
        problem_statement="Freelancers in India face chronic late payments due to manual, untracked invoicing.",
        target_audience="Freelance designers and developers in India, aged 22-35.",
        market_size="Global invoicing TAM: $4.5B. India SMB segment: ~$300M.",
        market_trends=[
            "GST compliance driving demand for digital invoicing",
            "UPI adoption making instant payments mainstream in India",
            "Freelance economy growing 20% YoY in India",
            "WhatsApp as primary business communication tool"
        ],
        pain_points=[
            "Clients delay payments with no follow-up system",
            "Manual invoice creation in Word/Excel is error-prone",
            "No GST-compliant invoice templates for freelancers",
            "Zero visibility into which invoices are seen or ignored"
        ],
        opportunity_gap="No tool combines WhatsApp delivery + GST compliance + auto-reminders for Indian freelancers.",
        key_assumptions=[
            "Freelancers will pay ₹499/month for time saved",
            "WhatsApp-native delivery will outperform email for Indian market",
            "GST compliance is a strong enough hook for adoption"
        ],
        sources=["https://example.com/market-report"]
    )

    test_state: AppState = {
        "idea": "InvoiceZap helps Indian freelancers get paid on time by automating invoice reminders and follow-ups.",
        "industry": "Fintech - Invoice Management",
        "target_market": "Freelance designers and developers in India, aged 22-35.",
        "budget": "$5,000 — bootstrapped",
        "stage": "idea",
        "planner_output": None,
        "research_output": fake_research,
        "competitor_output": None,
        "product_output": None,
        "branding_output": None,
        "finance_output": None,
        "gtm_output": None,
        "pitch_output": None,
        "final_report_path": None,
        "errors": None,
        "completed_agents": ["planner", "research"],
    }

    result = run_competitor_agent(test_state)

    print("\n" + "="*60)
    print("COMPETITOR OUTPUT:")
    print("="*60)

    if result.get("competitor_output"):
        c = result["competitor_output"]
        print(f"\nMarket Leader:  {c.market_leader}")
        print(f"Pricing Landscape: {c.pricing_landscape}")

        print(f"\nCompetitors ({len(c.competitors)}):")
        for comp in c.competitors:
            print(f"\n  ► {comp.name}")
            print(f"    {comp.description}")
            print(f"    Pricing:   {comp.pricing}")
            print(f"    Strengths: {comp.strengths}")
            print(f"    Weaknesses:{comp.weaknesses}")

        print(f"\nFeature Gaps:")
        for g in c.feature_gaps:
            print(f"  - {g}")

        print(f"\nUnderserved Segments:")
        for s in c.underserved_segments:
            print(f"  - {s}")

        print(f"\nSuggested Differentiators:")
        for d in c.suggested_differentiators:
            print(f"  - {d}")
    else:
        print("Agent failed. Errors:", result.get("errors"))