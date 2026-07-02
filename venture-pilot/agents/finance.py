"""
agents/finance.py — The Finance Agent (acts like a startup CFO).

Runs in PARALLEL with gtm.py, after branding.py.

What it does:
  1. Reads research_output  → market size for projection context
  2. Reads product_output   → pricing tiers + monetization model
  3. Reads branding_output  → ICP (to ground assumptions in real user)
  4. NO web search — pure financial modeling from structured inputs
  5. Sends all context to GPT → structured FinanceOutput
  6. Writes result back to state

Why no web search?
  All the inputs needed for financial modeling already exist in state.
  Research gave market size. Product gave pricing. Branding gave the ICP.
  Financial modeling is calculation + reasoning, not information retrieval.

What it produces:
  - Detailed pricing tiers with unit economics
  - 12-month month-by-month revenue projections (as structured data)
  - Full SaaS metrics: ARR, MRR, LTV, CAC, LTV:CAC, payback period
  - Runway analysis with burn rate breakdown
  - Best/base/worst case scenarios
  - Fundraising recommendation with investor targets
  - CFO-level advice for the founder

The monthly_projections field is STRUCTURED DATA (not text) — the frontend
will render this as a revenue chart / graph directly.
"""

import os
from dotenv import load_dotenv
from openai import OpenAI

from state import AppState
from schemas.finance import FinanceOutput

load_dotenv()


FINANCE_SYSTEM_PROMPT = """
You are a startup CFO and financial modeler with experience in SaaS startups.

You will be given:
- A startup idea with its refined value proposition
- Market research (market size, trends)
- Product definition (pricing tiers, monetization model, roadmap)
- Branding output (ICP — to ground your user assumptions)

Your job is to build a realistic financial model for the first 12 months.

RULES:
- Return ONLY valid JSON. No markdown, no explanation, no preamble.
- Be REALISTIC, not optimistic. Months 1-3 should show near-zero revenue.
- Month 1: 0-5 paid users. Growth should be gradual and credible.
- Use the pricing from the product agent — don't invent new pricing.
- All monetary values must be in the same currency (use the target market's currency).
- If the target market is India, use INR (₹). If US, use USD ($).
- monthly_projections must have EXACTLY 12 entries (month 1 to month 12).
- scenarios must have EXACTLY 3 entries: Best Case, Base Case, Worst Case.
- SaaS metrics must be calculated from the projections — not guessed.
- Payback period formula: CAC / (ARPU × Gross Margin %)
- LTV formula: ARPU / Monthly Churn Rate
- LTV:CAC ratio should be > 3:1 to be considered healthy.
- Burn rate must reflect actual startup costs — include cloud infra, APIs, tools.
- Fundraising recommendation must match the budget and stage provided.
"""


def run_finance_agent(state: AppState) -> AppState:
    """
    Main entry point. Reads research + product + branding from state.
    Returns updated state with finance_output filled.
    """

    print("\n[Finance Agent] Building financial model...")

    # ── Guards ────────────────────────────────────────────────────────────
    missing = []
    if not state.get("research_output"):
        missing.append("research_output")
    if not state.get("product_output"):
        missing.append("product_output")
    if not state.get("branding_output"):
        missing.append("branding_output")

    if missing:
        errors = state.get("errors") or []
        errors.append(f"finance_agent: missing required outputs — {', '.join(missing)}")
        return {**state, "errors": errors}

    idea      = state["idea"]
    industry  = state["industry"]
    budget    = state.get("budget", "bootstrapped / self-funded")
    stage     = state.get("stage", "idea")
    research  = state["research_output"]
    product   = state["product_output"]
    branding  = state["branding_output"]

    # ── Build prompt ──────────────────────────────────────────────────────
    user_prompt = f"""
Startup Idea:      {idea}
Industry:          {industry}
Budget:            {budget}
Stage:             {stage}

--- MARKET RESEARCH ---
Market Size:       {research.market_size}
Target Audience:   {research.target_audience}
Market Trends:
{chr(10).join(f"  - {t}" for t in research.market_trends)}
--- END RESEARCH ---

--- PRODUCT & PRICING ---
USP:               {product.usp}
Monetization:      {product.monetization_model}
MVP Scope:         {product.mvp_scope}

Core Features:
{chr(10).join(f"  - [{f.priority}] {f.name}" for f in product.core_features)}

Roadmap:
{chr(10).join(f"  - {r.phase} ({r.timeline})" for r in product.roadmap)}
--- END PRODUCT ---

--- ICP FROM BRANDING ---
{branding.icp_summary}
Positioning: {branding.positioning_statement}
--- END ICP ---

Build a full 12-month financial model. Be conservative and realistic.
Use the target market's local currency (India = INR ₹, US = USD $).
"""

    # ── Call OpenAI ───────────────────────────────────────────────────────
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    response = client.beta.chat.completions.parse(
        model="gpt-4o-mini",
        max_tokens=6000,
        messages=[
            {"role": "system", "content": FINANCE_SYSTEM_PROMPT},
            {"role": "user",   "content": user_prompt}
        ],
        response_format=FinanceOutput
    )

    finance_output = response.choices[0].message.parsed

    if finance_output is None:
        errors = state.get("errors") or []
        errors.append("finance_agent: model refused or failed to return structured output")
        return {**state, "errors": errors}

    m12 = finance_output.monthly_projections[-1]
    print(f"[Finance Agent] ✓ Financial model built.")
    print(f"[Finance Agent]   Currency:          {finance_output.currency}")
    print(f"[Finance Agent]   Break-even month:  {finance_output.runway.break_even_month}")
    print(f"[Finance Agent]   ARR (Month 12):    {finance_output.saas_metrics.arr:,.0f}")
    print(f"[Finance Agent]   Paid users M12:    {m12.users_paid}")
    print(f"[Finance Agent]   LTV:CAC:           {finance_output.saas_metrics.ltv_cac_ratio}")

    # ── Write back to state ───────────────────────────────────────────────
    completed = state.get("completed_agents") or []
    completed.append("finance")

    return {
        **state,
        "finance_output":   finance_output,
        "completed_agents": completed
    }


# ── Standalone test ───────────────────────────────────────────────────────────

if __name__ == "__main__":
    """
    Usage:
        cd venture-pilot
        source .venv/bin/activate
        python agents/finance.py
    """
    from schemas.research import MarketResearchOutput
    from schemas.product  import ProductOutput, Feature, RoadmapPhase, Priority, MonetizationModel
    from schemas.branding import BrandingOutput, BrandPersonality, BrandTone, NameSuggestion, ColorSwatch, DomainSuggestion, TypographySuggestion

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
            "WhatsApp-native delivery will outperform email",
            "GST compliance is a strong hook for adoption"
        ],
        sources=["https://example.com"]
    )

    fake_product = ProductOutput(
        product_name_suggestion="InvoiceZap",
        usp="The only invoicing tool built for WhatsApp-first Indian freelancers.",
        mvp_scope="Create GST-compliant invoices in 60 seconds and send via WhatsApp with auto-reminders.",
        core_features=[
            Feature(name="Invoice builder", description="GST-ready templates.", priority=Priority.MUST_HAVE, solves_pain="Manual creation is error-prone"),
            Feature(name="WhatsApp delivery", description="Send invoices via WhatsApp.", priority=Priority.MUST_HAVE, solves_pain="Email gets ignored"),
            Feature(name="Auto-reminders", description="Follow-up at 3/7/14 days.", priority=Priority.MUST_HAVE, solves_pain="No follow-up system"),
            Feature(name="Read receipts", description="See when invoice is opened.", priority=Priority.SHOULD_HAVE, solves_pain="Zero visibility"),
            Feature(name="UPI payment link", description="Embed UPI link in invoice.", priority=Priority.MUST_HAVE, solves_pain="Payment friction"),
        ],
        suggested_tech_stack=["Next.js", "FastAPI", "PostgreSQL", "Razorpay"],
        monetization_model=MonetizationModel.FREEMIUM,
        pricing_recommendation="Free: 3 invoices/month. Pro: ₹499/month. Business: ₹999/month.",
        roadmap=[
            RoadmapPhase(phase="Phase 1 — MVP", timeline="0-3 months", deliverables=["Invoice builder", "WhatsApp delivery"]),
            RoadmapPhase(phase="Phase 2 — Retention", timeline="3-6 months", deliverables=["Auto-reminders", "Dashboard"]),
            RoadmapPhase(phase="Phase 3 — Growth", timeline="6-12 months", deliverables=["Team accounts", "Analytics"]),
        ],
        product_risks=["WhatsApp API delays", "User switching costs"]
    )

    fake_branding = BrandingOutput(
        name_suggestions=[NameSuggestion(name="InvoiceZap", rationale="Speed", domain_available="getinvoicezap.com", tagline_fit="Get paid. Instantly.")],
        recommended_name="InvoiceZap",
        taglines=["Get paid. On time. Every time.", "Because chasing payments is not your job.", "Built for the way India freelances.", "Invoicing, unleashed.", "What if getting paid was the easy part?"],
        recommended_tagline="Get paid. On time. Every time.",
        brand_personality=BrandPersonality.EMPOWERING_ALLY,
        brand_tone=BrandTone.DIRECT,
        brand_voice_description="Sharp, witty, celebrates the freelancer win.",
        positioning_statement="For Indian freelancers who struggle with late payments, InvoiceZap is the invoicing tool that automates follow-ups via WhatsApp, unlike Zoho which is built for accountants.",
        elevator_pitch="We help Indian freelancers get paid on time. You send an invoice via WhatsApp, we handle all the follow-ups automatically. No more awkward payment chasing.",
        messaging_pillars=["Speed", "Trust", "Independence"],
        color_palette=[
            ColorSwatch(role="Primary", hex_code="#0D9488", color_name="Teal", usage="CTAs, headers", psychology="Trust + innovation"),
            ColorSwatch(role="Secondary", hex_code="#1E293B", color_name="Dark Slate", usage="Body text", psychology="Authority"),
            ColorSwatch(role="Accent", hex_code="#F59E0B", color_name="Amber", usage="Highlights", psychology="Energy"),
            ColorSwatch(role="Background", hex_code="#F8FAFC", color_name="Off-white", usage="Page bg", psychology="Clean"),
            ColorSwatch(role="Text", hex_code="#0F172A", color_name="Near-black", usage="Body copy", psychology="Readable"),
        ],
        color_palette_rationale="Teal differentiates from blue-heavy fintech. Amber adds energy.",
        typography=[
            TypographySuggestion(role="Heading", font_name="Sora", source="Google Fonts", why="Modern, geometric, confident"),
            TypographySuggestion(role="Body", font_name="Inter", source="Google Fonts", why="Highly readable at small sizes"),
            TypographySuggestion(role="Accent", font_name="DM Mono", source="Google Fonts", why="Numbers look sharp in monospace"),
        ],
        domain_suggestions=[
            DomainSuggestion(domain="getinvoicezap.com", rationale="Clean .com, action prefix"),
            DomainSuggestion(domain="invoicezap.io", rationale="Tech-forward"),
            DomainSuggestion(domain="invoicezap.in", rationale="India-specific"),
            DomainSuggestion(domain="tryinvoicezap.com", rationale="Soft CTA"),
            DomainSuggestion(domain="invoicezap.co", rationale="Short alternative"),
            DomainSuggestion(domain="zapinvoice.io", rationale="Reversed, memorable"),
        ],
        icp_summary="Meet Priya, 27, a freelance UX designer in Pune. She juggles 4 clients and spends 2 hours/week chasing payments. InvoiceZap does it for her.",
        logo_direction="Wordmark with Z as lightning bolt. Geometric. Single color.",
        brand_dos=["Lead with outcome", "Use real numbers", "Celebrate the win", "Speak like a friend"],
        brand_donts=["No corporate jargon", "Don't make users feel stupid", "No complexity", "No dark patterns"]
    )

    test_state: AppState = {
        "idea": "InvoiceZap helps Indian freelancers get paid on time by automating invoice reminders and follow-ups.",
        "industry": "Fintech - Invoice Management",
        "target_market": "Freelance designers and developers in India, aged 22-35.",
        "budget": "₹3,00,000 ($5,000) — bootstrapped",
        "stage": "idea",
        "planner_output":    None,
        "research_output":   fake_research,
        "competitor_output": None,
        "product_output":    fake_product,
        "branding_output":   fake_branding,
        "finance_output":    None,
        "gtm_output":        None,
        "pitch_output":      None,
        "final_report_path": None,
        "errors":            None,
        "completed_agents":  ["planner", "research", "competitor", "product", "branding"],
    }

    result = run_finance_agent(test_state)

    print("\n" + "="*60)
    print("FINANCE OUTPUT:")
    print("="*60)

    if result.get("finance_output"):
        f = result["finance_output"]
        print(f"\nCurrency: {f.currency}")

        print(f"\n── PRICING TIERS ──")
        for t in f.pricing_tiers:
            print(f"  {t.name}: {t.currency}{t.price_monthly}/month | {t.conversion_assumption}")

        print(f"\n── 12-MONTH PROJECTIONS ──")
        print(f"  {'Mo':>3}  {'Free':>8}  {'Paid':>6}  {'MRR':>12}  {'Net':>12}  {'Cash':>12}")
        for m in f.monthly_projections:
            print(f"  {m.month:>3}  {m.users_free:>8}  {m.users_paid:>6}  {m.mrr:>12,.0f}  {m.net_cashflow:>12,.0f}  {m.cumulative_cash:>12,.0f}")

        print(f"\n── SAAS METRICS (Month 12) ──")
        s = f.saas_metrics
        print(f"  ARR:            {s.arr:,.0f}")
        print(f"  MRR (M12):      {s.mrr_month_12:,.0f}")
        print(f"  ARPU:           {s.arpu:,.0f}")
        print(f"  LTV:            {s.ltv:,.0f}")
        print(f"  CAC:            {s.cac:,.0f}")
        print(f"  LTV:CAC:        {s.ltv_cac_ratio}")
        print(f"  Payback:        {s.payback_period_months:.1f} months")
        print(f"  Gross Margin:   {s.gross_margin}")
        print(f"  Churn assumed:  {s.churn_rate_assumed}")

        print(f"\n── RUNWAY ──")
        r = f.runway
        print(f"  Initial capital:  {r.initial_capital:,.0f}")
        print(f"  Monthly burn:     {r.monthly_burn_rate:,.0f}")
        print(f"  Break-even:       Month {r.break_even_month}")
        print(f"  Runway (no rev):  {r.runway_months:.1f} months")
        print(f"  Runway (w/ rev):  {r.runway_with_revenue_months:.1f} months")
        print(f"  Cash at M12:      {r.cash_at_month_12:,.0f}")
        print(f"  Burn breakdown:")
        for b in r.burn_rate_breakdown:
            print(f"    - {b}")

        print(f"\n── SCENARIOS ──")
        for sc in f.scenarios:
            print(f"  [{sc.scenario}] {sc.assumption}")
            print(f"    Paid users M12: {sc.paid_users_month_12} | MRR: {sc.mrr_month_12:,.0f} | Profitable: {sc.profitable}")

        print(f"\n── FUNDRAISING ──")
        fr = f.fundraising
        print(f"  Stage:  {fr.recommended_stage}")
        print(f"  Raise:  {fr.raise_amount}")
        print(f"  Valuation: {fr.valuation_rationale}")
        print(f"  Targets: {', '.join(fr.target_investors)}")
        print(f"  Readiness milestones:")
        for m in fr.fundraising_readiness:
            print(f"    - {m}")

        print(f"\n── CFO ADVICE ──")
        for a in f.cfo_advice:
            print(f"  → {a}")
    else:
        print("Agent failed. Errors:", result.get("errors"))
        