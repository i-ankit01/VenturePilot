"""
agents/product.py — The Product Agent.

Runs in PARALLEL with competitor.py, right after research.py.

What it does:
  1. Reads research_output from state (pain points, audience, opportunity gap)
  2. Reads idea + budget + stage from state (refined by planner)
  3. NO web search needed — works purely from research context + LLM reasoning
  4. Sends everything to GPT → structured ProductOutput
  5. Writes result back into state

Why no web search here?
  Research already gathered all the market signal needed.
  Product decisions (features, pricing, roadmap) are strategic reasoning
  tasks — not information retrieval tasks. Adding search here would just
  add noise and latency without improving the output quality.

What it feeds downstream:
  branding.py  → usp, core_features (what the brand should communicate)
  finance.py   → monetization_model, pricing_recommendation (revenue model)
  gtm.py       → mvp_scope, core_features (what to market and demo)
  pitch.py     → full product story for the product slide
"""

import os
from dotenv import load_dotenv
from openai import OpenAI

from state import AppState
from schemas.product import ProductOutput

load_dotenv()


# ── Prompt ────────────────────────────────────────────────────────────────────

PRODUCT_SYSTEM_PROMPT = """
You are an expert product strategist and startup advisor.

You will be given:
- A refined startup idea with its value proposition
- The industry, target market, budget, and stage
- Deep market research: pain points, trends, opportunity gap, market size

Your job is to define the product — what to build, how to price it,
and the roadmap to get there.

RULES:
- Return ONLY valid JSON. No markdown, no explanation, no preamble.
- Every feature MUST trace back to a specific pain point — no padding.
- MVP scope must be achievable within the given budget.
- Tech stack must be practical — don't recommend microservices for a $5K budget.
- Pricing must be grounded in the target market's willingness to pay.
- Roadmap phases must be realistic — 0-3 months, 3-6 months, 6-12 months.
"""


def run_product_agent(state: AppState) -> AppState:
    """
    Main entry point. Reads research_output + idea context from state.
    Returns updated state with product_output filled.

    Note: No web search — pure LLM reasoning from research context.
    """

    print("\n[Product Agent] Defining product scope and roadmap...")

    # ── Guard: research must have run first ───────────────────────────────
    if not state.get("research_output"):
        errors = state.get("errors") or []
        errors.append("product_agent: research_output is missing — run research first")
        return {**state, "errors": errors}

    idea          = state["idea"]
    industry      = state["industry"]
    target_market = state["target_market"]
    budget        = state.get("budget", "bootstrapped")
    stage         = state.get("stage", "idea")
    research      = state["research_output"]

    # ── Build prompt ──────────────────────────────────────────────────────
    user_prompt = f"""
Startup Idea:  {idea}
Industry:      {industry}
Target Market: {target_market}
Budget:        {budget}
Stage:         {stage}

--- MARKET RESEARCH CONTEXT ---
Problem Statement:  {research.problem_statement}
Target Audience:    {research.target_audience}
Market Size:        {research.market_size}
Opportunity Gap:    {research.opportunity_gap}

Pain Points:
{chr(10).join(f"  - {p}" for p in research.pain_points)}

Market Trends:
{chr(10).join(f"  - {t}" for t in research.market_trends)}

Key Assumptions to Validate:
{chr(10).join(f"  - {a}" for a in research.key_assumptions)}
--- END CONTEXT ---

Now define the full product: features, tech stack, pricing, and roadmap.
Every feature must directly address one of the pain points listed above.
"""

    # ── Call OpenAI with structured output ────────────────────────────────
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    response = client.beta.chat.completions.parse(
        model="gpt-4o-mini",
        max_tokens=2500,
        messages=[
            {"role": "system", "content": PRODUCT_SYSTEM_PROMPT},
            {"role": "user",   "content": user_prompt}
        ],
        response_format=ProductOutput
    )

    product_output = response.choices[0].message.parsed

    if product_output is None:
        errors = state.get("errors") or []
        errors.append("product_agent: model refused or failed to return structured output")
        return {**state, "errors": errors}

    print(f"[Product Agent] ✓ Product defined.")
    # print(f"[Product Agent]   Name suggestion: {product_output.product_name_suggestion}")
    print(f"[Product Agent]   Monetization:    {product_output.monetization_model}")
    print(f"[Product Agent]   Features:        {len(product_output.core_features)} features mapped")

    # ── Write back to state ───────────────────────────────────────────────
    completed = state.get("completed_agents") or []
    completed.append("product")

    return {
        **state,
        "product_output":   product_output,
        "completed_agents": completed
    }


# ── Standalone test ───────────────────────────────────────────────────────────

if __name__ == "__main__":
    """
    Test product agent with a fake but realistic research_output.

    Usage:
        cd venture-pilot
        source .venv/bin/activate
        python agents/product.py
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

    result = run_product_agent(test_state)

    print("\n" + "="*60)
    print("PRODUCT OUTPUT:")
    print("="*60)

    if result.get("product_output"):
        p = result["product_output"]
        # print(f"\nProduct Name:  {p.product_name_suggestion}")
        print(f"USP:           {p.usp}")
        print(f"\nMVP Scope:\n  {p.mvp_scope}")

        print(f"\nCore Features ({len(p.core_features)}):")
        for f in p.core_features:
            print(f"  [{f.priority}] {f.name}")
            print(f"    → {f.description}")
            print(f"    → Solves: {f.solves_pain}")

        print(f"\nTech Stack:    {', '.join(p.suggested_tech_stack)}")
        print(f"Monetization:  {p.monetization_model}")
        # print(f"\nPricing:\n  {p.pricing_recommendation}")

        print(f"\nRoadmap:")
        for phase in p.roadmap:
            print(f"  {phase.phase} ({phase.timeline})")
            for d in phase.deliverables:
                print(f"    - {d}")

        print(f"\nRisks:")
        for r in p.product_risks:
            print(f"  ⚠ {r}")
    else:
        print("Agent failed. Errors:", result.get("errors"))