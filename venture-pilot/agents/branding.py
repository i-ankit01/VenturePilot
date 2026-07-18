"""
agents/branding.py — The Branding Agent.

Runs AFTER competitor.py and product.py — needs both.

What it does:
  1. Reads research_output  → knows the audience, pain points, opportunity
  2. Reads competitor_output → knows who to position AGAINST, what gaps exist
  3. Reads product_output    → knows the USP, core features, product name hint
  4. Reads idea + target_market from state (refined by planner)
  5. NO web search — pure creative + strategic LLM reasoning
  6. Sends everything to GPT → structured BrandingOutput
  7. Writes result back to state

Why no web search?
  Branding is not a research task — it's a creative strategy task.
  All the signal needed (audience, competitors, differentiators, product
  identity) already exists in state from previous agents.
  Adding search here adds latency and noise, not insight.

Why it needs BOTH competitor AND product:
  - Without competitor: can't position against the market
    (would create generic branding that looks like everyone else)
  - Without product:    can't make the brand reflect reality
    (would create beautiful branding disconnected from what's being built)
  Both together let the brand be specific, differentiated, and honest.

What it feeds downstream:
  gtm.py    → brand_voice, messaging_pillars, taglines
              (channel copy must sound like the brand)
  pitch.py  → recommended_name, recommended_tagline, positioning_statement, icp
              (cover slide + "why us" narrative)
  report.py → everything (full branding chapter)
"""

import os
from dotenv import load_dotenv
from openai import OpenAI

from state import AppState
from schemas.branding import BrandingOutput

load_dotenv()


# ── Prompt ────────────────────────────────────────────────────────────────────

BRANDING_SYSTEM_PROMPT = """
You are a world-class brand strategist who has built brands for funded startups.

You will be given:
- A refined startup idea with its value proposition
- Deep market research (audience, pain points, opportunity)
- Competitive analysis (who exists, their weaknesses, differentiators)
- Product definition (USP, features, pricing model, product name hint)

Your job is to create a complete brand identity system for this startup.

RULES:
- Return ONLY valid JSON. No markdown, no explanation, no preamble.
- Name suggestions must be ORIGINAL — not generic like "QuickPay" or "EasyBill".
  Think harder. Use wordplay, metaphor, foreign words, portmanteaus.
- Taglines must be punchy and under 10 words each. No corporate speak.
- Color palette must feel COHESIVE as a system — not just 5 random good colors.
  The palette must stand out from the competitive landscape.
- Typography must be Google Fonts only (free and web-safe).
- Domain suggestions must be realistic — prefer short, memorable, under 20 chars.
- The ICP summary must read like a human story, not a demographic bullet list.
- Brand dos and don'ts must be specific to THIS brand — not generic advice.
- Every creative decision must be traceable to the brand personality chosen.
"""


def run_branding_agent(state: AppState) -> AppState:
    """
    Main entry point. Reads research + competitor + product outputs from state.
    Returns updated state with branding_output filled.
    """

    print("\n[Branding Agent] Building brand identity system...")

    # ── Guards: competitor and product must have run first ─────────────────
    missing = []
    if not state.get("research_output"):
        missing.append("research_output")
    if not state.get("competitor_output"):
        missing.append("competitor_output")
    if not state.get("product_output"):
        missing.append("product_output")

    if missing:
        errors = state.get("errors") or []
        errors.append(f"branding_agent: missing required outputs — {', '.join(missing)}")
        return {**state, "errors": errors}

    idea          = state["idea"]
    target_market = state["target_market"]
    industry      = state["industry"]
    research      = state["research_output"]
    competitor    = state["competitor_output"]
    product       = state["product_output"]

    # ── Build competitor landscape summary for the prompt ─────────────────
    competitor_names = [c.name for c in competitor.competitors]
    competitor_weaknesses = []
    for c in competitor.competitors:
        for w in c.weaknesses:
            competitor_weaknesses.append(f"{c.name}: {w}")

    # ── Build the user prompt ─────────────────────────────────────────────
    user_prompt = f"""
Startup Idea:    {idea}
Industry:        {industry}
Target Market:   {target_market}

--- MARKET RESEARCH ---
Problem:          {research.problem_statement}
Target Audience:  {research.target_audience}
Opportunity Gap:  {research.opportunity_gap}
Pain Points:
{chr(10).join(f"  - {p}" for p in research.pain_points)}
--- END RESEARCH ---

--- COMPETITIVE LANDSCAPE ---
Market Leader:    {competitor.market_leader}
Competitors:      {", ".join(competitor_names)}
Pricing Landscape:{competitor.pricing_landscape}

Competitor Weaknesses (position AGAINST these):
{chr(10).join(f"  - {w}" for w in competitor_weaknesses)}

Feature Gaps (our advantages):
{chr(10).join(f"  - {g}" for g in competitor.feature_gaps)}

Suggested Differentiators:
{chr(10).join(f"  - {d}" for d in competitor.suggested_differentiators)}
--- END COMPETITIVE LANDSCAPE ---

--- PRODUCT DEFINITION ---
USP:                 {product.usp}
MVP Scope:           {product.mvp_scope}
Monetization:        {product.monetization_model}

Core Features:
{chr(10).join(f"  - [{f.priority}] {f.name}: {f.description}" for f in product.core_features)}
--- END PRODUCT DEFINITION ---

Now build the complete brand identity system. Be specific, creative, and bold.
Every decision must be justified by the audience and competitive context above.
"""

    # ── Call OpenAI with structured output ────────────────────────────────
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    response = client.beta.chat.completions.parse(
        model="gpt-4o-mini",
        max_tokens=4000,
        messages=[
            {"role": "system", "content": BRANDING_SYSTEM_PROMPT},
            {"role": "user",   "content": user_prompt}
        ],
        response_format=BrandingOutput
    )

    branding_output = response.choices[0].message.parsed

    if branding_output is None:
        errors = state.get("errors") or []
        errors.append("branding_agent: model refused or failed to return structured output")
        return {**state, "errors": errors}

    print(f"[Branding Agent] ✓ Brand identity created.")
    print(f"[Branding Agent]   Recommended name:    {branding_output.recommended_name}")
    print(f"[Branding Agent]   Recommended tagline: {branding_output.recommended_tagline}")
    print(f"[Branding Agent]   Personality:         {branding_output.brand_personality}")

    # ── Write back to state ───────────────────────────────────────────────
    completed = state.get("completed_agents") or []
    completed.append("branding")

    return {
        **state,
        "branding_output":  branding_output,
        "completed_agents": completed
    }
