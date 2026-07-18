"""
agents/pitch.py — The Pitch Agent (Synthesis Agent).

Runs LAST in the agent chain, before report.py.

What it does:
  1. Reads ALL prior agent outputs from state
  2. Synthesizes everything into a complete 12-slide pitch deck narrative
  3. NO web search — this is pure distillation and storytelling
  4. Sends the full context to GPT → structured PitchOutput (12 slide objects)
  5. Writes pitch_output back to state

Why it's the hardest agent to prompt:
  Every other agent has ONE job. Pitch has to:
  - Tell a coherent story across 12 slides
  - Be consistent with the brand voice (branding agent)
  - Use real numbers (finance agent)
  - Reference real competitors (competitor agent)
  - Reflect the actual product (product agent)
  - Mirror the GTM strategy (gtm agent)
  - Sound like a human founder, not a template

  The prompt is therefore the longest and most directive in the pipeline.

What it produces:
  12 structured slide objects → report agent renders into actual PPTX
  5 hardest investor Q&As → founder prep
  Follow-up email template → post-pitch workflow
"""

import os
from dotenv import load_dotenv
from openai import OpenAI

from state import AppState
from schemas.pitch import PitchOutput

load_dotenv()


PITCH_SYSTEM_PROMPT = """
You are a world-class pitch coach and startup storyteller who has helped
founders raise from YC, Sequoia, and Accel.

You will be given the complete output of 7 prior analysis agents covering
market research, competitive analysis, product definition, brand identity,
financial modeling, and go-to-market strategy.

Your job is to synthesize all of this into a compelling 12-slide investor
pitch deck narrative — structured data that a report generator will render
into a real PowerPoint file.

SLIDE ORDER (strict):
  1. Cover        → name, tagline, one-liner
  2. Problem      → 3 pain points, emotional hook
  3. Solution     → 3 solution bullets mirroring the 3 problems
  4. Product      → 4 features as outcomes, demo flow
  5. Market       → TAM/SAM/SOM, 3 tailwinds
  6. Business     → pricing tiers, unit economics
  7. Traction     → validation, user quote, next milestones
  8. Competition  → feature matrix with Us vs Them, our moat
  9. GTM          → 3-phase strategy, channels, north star
  10. Team        → why us, key hires, advisors
  11. Financials  → snapshot from finance agent, projection narrative
  12. Ask         → raise amount, use of funds, closing line

RULES:
- Return ONLY valid JSON. No markdown, no explanation, no preamble.
- Every slide must have a presenter_note — this is what the founder actually says.
  Presenter notes must sound human. Conversational. Never robotic.
- Problem slide pain points must be specific and data-backed (use research agent numbers).
- Solution bullets must be a direct 1:1 response to the 3 problem bullets.
- Competition matrix must include EXACTLY 4-5 rows: 3-4 real competitors + 1 'Us' row.
  The 'Us' row must have is_us=true and all boolean features set to true.
- Financial snapshot must use real numbers from the finance agent output.
- The closing line on the Ask slide must be the most powerful sentence in the deck.
  It should reference the market size + the mission. Make it memorable.
- hardest_questions must anticipate what a sharp investor would push back on.
  Format: 'Q: [question] → A: [honest, specific answer]'
- email_follow_up must have a subject line on the first line, then the body.
- The pitch_narrative_summary should be dense enough to stand alone as a memo.
- Total slides = 12. Do not add or remove slides.
"""


def _build_finance_snapshot(finance) -> str:
    """Extract key finance numbers for the prompt."""
    m12 = finance.monthly_projections[-1]
    s = finance.saas_metrics
    r = finance.runway
    fr = finance.fundraising
    return f"""
    ARR Month 12:        {s.arr:,.0f} {finance.currency}
    MRR Month 12:        {s.mrr_month_12:,.0f} {finance.currency}
    Paid Users Month 12: {m12.users_paid}
    Break-even Month:    {r.break_even_month}
    LTV:CAC:             {s.ltv_cac_ratio}
    Gross Margin:        {s.gross_margin}
    Payback Period:      {s.payback_period_months:.1f} months
    Monthly Burn:        {r.monthly_burn_rate:,.0f} {finance.currency}
    Runway:              {r.runway_with_revenue_months:.1f} months (with revenue)
    Raise Amount:        {fr.raise_amount}
    Fundraising Stage:   {fr.recommended_stage}
    Use of Funds:        {' | '.join(fr.use_of_funds[:3])}
"""


def run_pitch_agent(state: AppState) -> AppState:
    """
    Main entry point. Reads ALL prior agent outputs.
    Returns updated state with pitch_output filled.
    """

    print("\n[Pitch Agent] Synthesizing pitch deck...")

    # ── Guards: all agents must have run ─────────────────────────────────
    required = [
        "research_output", "competitor_output", "product_output",
        "branding_output", "finance_output", "gtm_output"
    ]
    missing = [k for k in required if not state.get(k)]

    if missing:
        errors = state.get("errors") or []
        errors.append(f"pitch_agent: missing required outputs — {', '.join(missing)}")
        return {**state, "errors": errors}

    # ── Unpack all state ──────────────────────────────────────────────────
    idea          = state["idea"]
    industry      = state["industry"]
    target_market = state["target_market"]
    budget        = state.get("budget", "bootstrapped")
    research      = state["research_output"]
    competitor    = state["competitor_output"]
    product       = state["product_output"]
    branding      = state["branding_output"]
    finance       = state["finance_output"]
    gtm           = state["gtm_output"]

    # ── Helpers ───────────────────────────────────────────────────────────
    comp_list = "\n".join(
        f"  - {c.name}: strengths={c.strengths}, weaknesses={c.weaknesses}, pricing={c.pricing}"
        for c in competitor.competitors
    )
    feature_list = "\n".join(
        f"  - [{f.priority}] {f.name}: {f.description}" for f in product.core_features
    )
    milestone_weeks = [w for w in gtm.weekly_plan if w.milestone]
    gtm_channels = "\n".join(
        f"  - [{c.priority}] {c.channel.value}: {c.why_this_channel}"
        for c in gtm.channels
    )
    finance_snapshot = _build_finance_snapshot(finance)
    use_of_funds = "\n".join(f"  - {u}" for u in finance.fundraising.use_of_funds)
    fundraising_milestones = "\n".join(
        f"  - {m}" for m in finance.fundraising.fundraising_readiness
    )

    # ── Build the prompt ──────────────────────────────────────────────────
    user_prompt = f"""
=== STARTUP BRIEF ===
Idea:          {idea}
Industry:      {industry}
Target Market: {target_market}
Budget:        {budget}

=== MARKET RESEARCH ===
Problem:          {research.problem_statement}
Target Audience:  {research.target_audience}
Market Size:      {research.market_size}
Opportunity Gap:  {research.opportunity_gap}
Pain Points:
{chr(10).join(f"  - {p}" for p in research.pain_points)}
Market Trends:
{chr(10).join(f"  - {t}" for t in research.market_trends)}

=== COMPETITIVE ANALYSIS ===
Market Leader:     {competitor.market_leader}
Pricing Landscape: {competitor.pricing_landscape}
Competitors:
{comp_list}
Feature Gaps (our advantages):
{chr(10).join(f"  - {g}" for g in competitor.feature_gaps)}
Our Differentiators:
{chr(10).join(f"  - {d}" for d in competitor.suggested_differentiators)}

=== PRODUCT ===
USP:           {product.usp}
MVP Scope:     {product.mvp_scope}
Monetization:  {product.monetization_model}
Features:
{feature_list}
Tech Stack:    {', '.join(product.suggested_tech_stack)}
Risks:         {', '.join(product.product_risks)}

=== BRAND IDENTITY ===
Recommended Name:    {branding.recommended_name}
Tagline:             {branding.recommended_tagline}
One-liner:           {branding.elevator_pitch}
Personality:         {branding.brand_personality}
Tone:                {branding.brand_tone}
Voice:               {branding.brand_voice_description}
Positioning:         {branding.positioning_statement}
ICP:                 {branding.icp_summary}
Messaging Pillars:
{chr(10).join(f"  - {p}" for p in branding.messaging_pillars)}

=== FINANCIALS ===
Currency:      {finance.currency}
{finance_snapshot}
Financial Model Assumptions:
{chr(10).join(f"  - {a}" for a in finance.financial_model_assumptions)}
CFO Advice (context only):
{chr(10).join(f"  - {a}" for a in finance.cfo_advice)}

=== GO-TO-MARKET ===
First 100 Users Timeline: {gtm.first_100_users.total_timeline}
Core Approach:            {gtm.first_100_users.core_approach}
Hook Offer:               {gtm.first_100_users.hook_offer}
Channels:
{gtm_channels}
North Star Metric:        {gtm.north_star_metric}
Scaling:
{chr(10).join(f"  - {s.phase} ({s.timeframe}): {s.primary_engine}" for s in gtm.scaling_strategy)}
Referral Strategy:        {gtm.referral_strategy}
Content Strategy:         {gtm.content_strategy}

=== FUNDRAISING ===
Stage:    {finance.fundraising.recommended_stage}
Raise:    {finance.fundraising.raise_amount}
Use of Funds:
{use_of_funds}
Target Investors: {', '.join(finance.fundraising.target_investors)}
Readiness Milestones:
{fundraising_milestones}
Valuation:        {finance.fundraising.valuation_rationale}
Alt Path:         {finance.fundraising.alternative_if_no_funding}

Now build the complete 12-slide pitch deck.
Be specific. Be compelling. Make the closing line unforgettable.
"""

    # ── Call OpenAI ───────────────────────────────────────────────────────
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    response = client.beta.chat.completions.parse(
        model="gpt-4o-mini",
        max_tokens=8000,
        messages=[
            {"role": "system", "content": PITCH_SYSTEM_PROMPT},
            {"role": "user",   "content": user_prompt}
        ],
        response_format=PitchOutput
    )

    pitch_output = response.choices[0].message.parsed

    if pitch_output is None:
        errors = state.get("errors") or []
        errors.append("pitch_agent: model refused or failed to return structured output")
        return {**state, "errors": errors}

    print(f"[Pitch Agent] ✓ Pitch deck synthesised — {pitch_output.total_slides} slides.")
    print(f"[Pitch Agent]   Deck title:    {pitch_output.deck_title}")
    print(f"[Pitch Agent]   Duration:      {pitch_output.recommended_duration}")
    print(f"[Pitch Agent]   Closing line:  {pitch_output.slide_12_ask.closing_line[:70]}...")

    # ── Write back to state ───────────────────────────────────────────────
    completed = state.get("completed_agents") or []
    completed.append("pitch")

    return {
        **state,
        "pitch_output":     pitch_output,
        "completed_agents": completed
    }


