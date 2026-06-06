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
    pricing_list = "\n".join(f"  - {t}" for t in product.pricing_recommendation.split("."))
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
Name:          {product.product_name_suggestion}
USP:           {product.usp}
MVP Scope:     {product.mvp_scope}
Monetization:  {product.monetization_model}
Pricing:       {product.pricing_recommendation}
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


# ── Standalone test ───────────────────────────────────────────────────────────

if __name__ == "__main__":
    """
    Full pipeline test — builds all fake prior-agent outputs and runs pitch.

    Usage:
        cd venture-pilot
        source .venv/bin/activate
        python agents/pitch.py
    """
    from schemas.research   import MarketResearchOutput
    from schemas.competitor import CompetitorOutput, Competitor
    from schemas.product    import ProductOutput, Feature, RoadmapPhase, Priority, MonetizationModel
    from schemas.branding   import (BrandingOutput, BrandPersonality, BrandTone,
                                    NameSuggestion, ColorSwatch, DomainSuggestion,
                                    TypographySuggestion)
    from schemas.finance    import (FinanceOutput, PricingTier, MonthlyProjection,
                                    SaaSMetrics, RunwayAnalysis, FundraisingRecommendation,
                                    UnitEconomicsScenario, FundraisingStage)
    from schemas.gtm        import (GTMOutput, First100UsersStrategy, MarketingChannel,
                                    WeekPlan, GrowthExperiment, ScalingStrategy,
                                    ChannelType, GrowthPhase)

    # ── Fake research ─────────────────────────────────────────────────────
    fake_research = MarketResearchOutput(
        problem_statement="Freelancers in India face chronic late payments — the average freelancer has 3.2 overdue invoices worth ₹2.3L at any given time.",
        target_audience="Freelance designers and developers in India, aged 22-35, working with 3+ clients simultaneously.",
        market_size="Global invoicing TAM: $4.5B. India SMB + freelancer segment (SAM): ~$300M. Year-1 SOM: $500K.",
        market_trends=[
            "India freelance economy growing 20% YoY — 47M freelancers by 2025",
            "UPI making instant digital payments mainstream — 10B+ monthly transactions",
            "GST compliance driving urgent need for digital invoice records",
            "WhatsApp used by 500M+ Indians for business communication daily",
        ],
        pain_points=[
            "Clients delay payments — no automated follow-up system exists for freelancers",
            "Creating GST-compliant invoices in Word/Excel is error-prone and time-consuming",
            "Zero visibility into whether clients have seen the invoice",
            "Chasing payments is emotionally draining and damages client relationships",
        ],
        opportunity_gap="No tool combines WhatsApp-native delivery + GST compliance + auto-reminders in a freelancer-first UI. Zoho and FreshBooks are built for accountants.",
        key_assumptions=[
            "Freelancers will pay ₹499/month to eliminate payment chasing",
            "WhatsApp delivery will achieve 4× higher open rates than email for Indian clients",
            "GST compliance requirement is a strong enough forcing function for adoption",
        ],
        sources=["Payoneer Freelancer Income Report 2024", "NASSCOM India Gig Economy Report 2024"]
    )

    # ── Fake competitor ───────────────────────────────────────────────────
    fake_competitor = CompetitorOutput(
        competitors=[
            Competitor(name="Zoho Invoice", description="Full-suite SMB invoicing, accountant-focused.", strengths=["Deep GST", "Wide integrations"], weaknesses=["Overwhelming UI for freelancers", "No WhatsApp"], pricing="Free up to 1 client, ₹749/month paid", target_segment="SMBs and accountants"),
            Competitor(name="FreshBooks", description="Western SaaS for global freelancers.", strengths=["Beautiful UI", "Time tracking"], weaknesses=["Expensive in INR", "No GST", "No WhatsApp"], pricing="$17-55/month", target_segment="Western freelancers"),
            Competitor(name="Razorpay", description="Payment gateway with basic invoicing.", strengths=["Trusted", "UPI-native"], weaknesses=["Invoicing not core", "No reminders"], pricing="2% fee", target_segment="Online businesses"),
        ],
        market_leader="Zoho Invoice leads India SMB invoicing with GST integration and brand trust.",
        pricing_landscape="₹0-750/month range. No dominant WhatsApp-native player. FreshBooks too expensive for India.",
        feature_gaps=["No WhatsApp-native invoice delivery", "No auto-reminder system for freelancers", "No GST + freelancer UI combination"],
        underserved_segments=["Creative freelancers in Tier-2/3 cities", "First-time GST filers"],
        suggested_differentiators=["WhatsApp-first delivery", "Zero-jargon GST invoicing", "Freelancer-native UI"],
        sources=["G2 reviews", "App Store reviews", "Primary user interviews"]
    )

    # ── Fake product ──────────────────────────────────────────────────────
    fake_product = ProductOutput(
        product_name_suggestion="InvoiceZap",
        usp="The only invoicing tool built for WhatsApp-first Indian freelancers.",
        mvp_scope="Create GST-compliant invoices in 60 seconds and send via WhatsApp. Auto-reminders follow up so you never chase a client again.",
        core_features=[
            Feature(name="60-second invoice builder", description="GST-ready templates, zero accounting knowledge needed.", priority=Priority.MUST_HAVE, solves_pain="Creating invoices is error-prone"),
            Feature(name="WhatsApp delivery", description="Send invoices directly to client WhatsApp with one tap.", priority=Priority.MUST_HAVE, solves_pain="Email gets ignored"),
            Feature(name="Auto payment reminders", description="Automated follow-ups at 3, 7, and 14 days.", priority=Priority.MUST_HAVE, solves_pain="No follow-up system"),
            Feature(name="Invoice read receipts", description="Know exactly when the client opened the invoice.", priority=Priority.SHOULD_HAVE, solves_pain="Zero visibility on invoice status"),
            Feature(name="UPI payment link", description="Embedded UPI link in every invoice for instant payment.", priority=Priority.MUST_HAVE, solves_pain="Payment friction"),
        ],
        suggested_tech_stack=["Next.js", "FastAPI", "PostgreSQL", "Razorpay", "Twilio WhatsApp API", "Vercel"],
        monetization_model=MonetizationModel.FREEMIUM,
        pricing_recommendation="Free: 3 invoices/month. Pro: ₹499/month — unlimited. Business: ₹999/month — team + analytics.",
        roadmap=[
            RoadmapPhase(phase="Phase 1 — MVP", timeline="0-3 months", deliverables=["Invoice builder", "WhatsApp delivery", "UPI link"]),
            RoadmapPhase(phase="Phase 2 — Retention", timeline="3-6 months", deliverables=["Auto-reminders", "Read receipts", "Dashboard"]),
            RoadmapPhase(phase="Phase 3 — Growth", timeline="6-12 months", deliverables=["Team accounts", "Analytics", "Integrations"]),
        ],
        product_risks=["WhatsApp Business API approval delays of 4-6 weeks", "Freelancer reluctance to switch from existing habits"]
    )

    # ── Fake branding ─────────────────────────────────────────────────────
    fake_branding = BrandingOutput(
        name_suggestions=[NameSuggestion(name="InvoiceZap", rationale="Speed + invoicing", domain_available="getinvoicezap.com likely available", tagline_fit="Get paid. Instantly.")],
        recommended_name="InvoiceZap — short, action-oriented, communicates speed.",
        taglines=["Get paid. On time. Every time.", "Because chasing payments is not your job.", "Built for the way India freelances.", "Invoicing, unleashed.", "What if getting paid was the easy part?"],
        recommended_tagline="Get paid. On time. Every time.",
        brand_personality=BrandPersonality.EMPOWERING_ALLY,
        brand_tone=BrandTone.DIRECT,
        brand_voice_description="InvoiceZap speaks like a sharp, witty friend who knows money. Direct, never preachy. Celebrates the win of getting paid.",
        positioning_statement="For Indian freelancers who lose time chasing payments, InvoiceZap is the invoicing tool that automates WhatsApp follow-ups unlike Zoho which is built for accountants.",
        elevator_pitch="We help Indian freelancers get paid on time. You send one invoice via WhatsApp, we handle all follow-ups automatically. No more awkward payment chasing.",
        messaging_pillars=["Speed — everything feels instant", "Trust — treats money seriously", "Independence — built for people who work for themselves"],
        color_palette=[
            ColorSwatch(role="Primary", hex_code="#0D9488", color_name="Teal", usage="CTAs, headers", psychology="Trust + innovation, different from blue-heavy fintech"),
            ColorSwatch(role="Secondary", hex_code="#1E293B", color_name="Dark Slate", usage="Body text", psychology="Authority and seriousness for financial context"),
            ColorSwatch(role="Accent", hex_code="#F59E0B", color_name="Amber", usage="Highlights, CTAs", psychology="Energy and urgency — money moves fast"),
            ColorSwatch(role="Background", hex_code="#F8FAFC", color_name="Off-white", usage="Page backgrounds", psychology="Clean, professional, trustworthy"),
            ColorSwatch(role="Text", hex_code="#0F172A", color_name="Near-black", usage="Body copy", psychology="Maximum readability for financial data"),
        ],
        color_palette_rationale="Teal as primary differentiates from blue-heavy fintech (Stripe, Razorpay). Amber adds urgency without cheapness.",
        typography=[
            TypographySuggestion(role="Heading", font_name="Sora", source="Google Fonts — free", why="Geometric, modern, confident — feels like a fintech product"),
            TypographySuggestion(role="Body", font_name="Inter", source="Google Fonts — free", why="Best-in-class readability at small sizes for financial data"),
            TypographySuggestion(role="Accent/UI", font_name="DM Mono", source="Google Fonts — free", why="Numbers look sharp and legible in monospace"),
        ],
        domain_suggestions=[
            DomainSuggestion(domain="getinvoicezap.com", rationale="Clean .com with action prefix — likely available"),
            DomainSuggestion(domain="invoicezap.io", rationale="Tech-forward, startup feel"),
            DomainSuggestion(domain="invoicezap.in", rationale="India-specific, builds local trust"),
            DomainSuggestion(domain="tryinvoicezap.com", rationale="Soft CTA prefix"),
            DomainSuggestion(domain="invoicezap.co", rationale="Short, modern alternative"),
            DomainSuggestion(domain="zapinvoice.io", rationale="Reversed wordplay, memorable"),
        ],
        icp_summary="Meet Priya, 27, a freelance UX designer in Pune. She juggles 4 clients and spends 2 hours every Sunday chasing overdue payments over WhatsApp. She tried Zoho but it felt built for accountants. InvoiceZap sends her invoice and follows up automatically — Priya just designs.",
        logo_direction="Wordmark with a custom Z that doubles as a lightning bolt. Geometric, single-color. Works at 16px and 1600px. Feels at home next to Stripe and Razorpay.",
        brand_dos=["Lead with the outcome, not the feature", "Use real numbers when possible", "Celebrate the freelancer win", "Speak like a smart friend"],
        brand_donts=["No corporate jargon", "Never make users feel stupid about money", "No complexity for its own sake", "No dark patterns in pricing"]
    )

    # ── Fake finance ──────────────────────────────────────────────────────
    fake_projections = [
        MonthlyProjection(month=m, users_free=m*15, users_paid=max(0, (m-2)*8),
                          mrr=max(0,(m-2)*8)*499, revenue=max(0,(m-2)*8)*499,
                          expenses=25000, net_cashflow=max(0,(m-2)*8)*499-25000,
                          cumulative_cash=300000+sum([max(0,(i-2)*8)*499-25000 for i in range(1,m+1)]))
        for m in range(1, 13)
    ]
    fake_finance = FinanceOutput(
        pricing_tiers=[
            PricingTier(name="Free", price_monthly=0, price_annually=0, currency="₹", features_included=["3 invoices/month", "Basic templates"], target_user="New freelancers evaluating", conversion_assumption="8% convert to Pro within 60 days"),
            PricingTier(name="Pro", price_monthly=499, price_annually=4990, currency="₹", features_included=["Unlimited invoices", "WhatsApp delivery", "Auto-reminders", "Read receipts"], target_user="Active freelancers with 3+ clients", conversion_assumption="Core revenue tier — target 80% of paid users"),
            PricingTier(name="Business", price_monthly=999, price_annually=9990, currency="₹", features_included=["Everything in Pro", "Team accounts", "Analytics", "Priority support"], target_user="Freelance agencies and studios", conversion_assumption="15% of Pro users upgrade at 6+ months"),
        ],
        pricing_strategy_rationale="Freemium drives acquisition. Pro at ₹499 is below the pain threshold (1 saved invoice). Business captures agency upsell.",
        monthly_projections=fake_projections,
        saas_metrics=SaaSMetrics(arr=596880, mrr_month_12=49740, mrr_month_1=0, mrr_growth_rate="~25% MoM months 3-8, tapering to 12% months 9-12", churn_rate_assumed="3% monthly (industry avg SMB SaaS 3-7%)", ltv=16633, cac=800, ltv_cac_ratio="4.2:1 — healthy (3:1 is minimum viable for SaaS)", payback_period_months=6.1, gross_margin="78% — cloud infra + WhatsApp API as primary COGS", arpu=499, nps_target="Target NPS > 45 by Month 6 — PLG only works with strong word-of-mouth"),
        runway=RunwayAnalysis(initial_capital=300000, monthly_burn_rate=25000, break_even_month=8, runway_months=12.0, runway_with_revenue_months=18.0, cash_at_month_12=185000, burn_rate_breakdown=["Cloud infra (AWS): ₹6,000/month", "WhatsApp Business API (Twilio): ₹5,000/month", "Razorpay fees (~1.8%): ~₹2,000/month", "Tools (Notion, Figma, etc.): ₹2,000/month", "Marketing (organic-first): ₹5,000/month", "Misc / legal / admin: ₹5,000/month"]),
        scenarios=[
            UnitEconomicsScenario(scenario="Best Case", assumption="15% free-to-paid conversion, 1.5% churn", paid_users_month_12=450, mrr_month_12=85000, arr_month_12=1020000, profitable=True),
            UnitEconomicsScenario(scenario="Base Case", assumption="8% free-to-paid conversion, 3% churn", paid_users_month_12=312, mrr_month_12=49740, arr_month_12=596880, profitable=True),
            UnitEconomicsScenario(scenario="Worst Case", assumption="4% free-to-paid conversion, 6% churn", paid_users_month_12=120, mrr_month_12=19200, arr_month_12=230400, profitable=False),
        ],
        fundraising=FundraisingRecommendation(recommended_stage=FundraisingStage.PRE_SEED, raise_amount="$150,000 (₹1.25 Crore) pre-seed", use_of_funds=["Product & engineering (40%) — ₹50L: 2 engineers, 6 months runway", "Marketing & community (30%) — ₹37.5L: content, events, partnerships", "Operations & legal (20%) — ₹25L: GST compliance, WhatsApp API, infra", "Reserve (10%) — ₹12.5L: unexpected costs"], target_investors=["Sequoia Surge (India early-stage)", "India Quotient (consumer tech, India-first)", "Lightspeed India (fintech focus)", "Titan Capital (founder-friendly pre-seed)"], valuation_rationale="Pre-revenue pre-seed: $1-1.5M post-money. $150K for 10-15% equity. Comparable to similar India B2C SaaS pre-seeds.", fundraising_readiness=["200 active free users on waitlist", "First 10 paying customers (MRR ₹5,000)", "WhatsApp Business API approved", "6 months of user interview data"], alternative_if_no_funding="Bootstrap to break-even at Month 8 with 200 Pro users. Reinvest MRR into paid acquisition from Month 9. Series A ready by Year 2."),
        financial_risks=["High churn if onboarding doesn't deliver aha moment in first session → invest in onboarding flow before launch", "WhatsApp API cost scaling unexpectedly at high volume → model 3 scenarios, negotiate Twilio contract at 500 users", "Free-to-paid conversion below 8% → run pricing experiment at Month 3"],
        cfo_advice=["Track MRR weekly from day 1 — not monthly", "Defer all founder salaries until MRR hits ₹1L", "Set up Razorpay analytics before first paid user", "Build a simple spreadsheet cashflow model, update it weekly", "Never spend on paid ads until organic CAC is proven"],
        currency="₹ (INR)",
        financial_model_assumptions=["Free-to-paid conversion: 8% within 60 days", "Monthly churn: 3%", "ARPU: ₹499/month (blended paid)", "CAC via community/content: ₹800", "Gross margin: 78%", "Monthly burn: ₹25,000 in first 6 months"]
    )

    # ── Fake GTM ──────────────────────────────────────────────────────────
    fake_gtm = GTMOutput(
        first_100_users=First100UsersStrategy(
            total_timeline="8 weeks",
            core_approach="Manual founder-led outreach to Indian freelancer communities on LinkedIn and WhatsApp groups",
            steps=["Identify and join 20 Indian freelancer WhatsApp groups", "Post a problem-question (not an ad): 'How do you handle late-paying clients?'", "DM 50 people who engage with your post — offer free beta access", "Do white-glove onboarding: set up their first invoice personally over Zoom", "Ask for referrals from happy beta users after first successful payment", "Post weekly build-in-public updates on LinkedIn to build an audience"],
            where_to_find_them=["r/IndiaFreelance on Reddit", "Freelancer groups on WhatsApp (search 'freelancer India' in group directories)", "LinkedIn hashtag #IndianFreelancer and #FreelanceIndia", "Twitter/X community @DesignIndia", "Dribbble and Behance India communities"],
            hook_offer="We will set up your first 3 invoices for you personally over a 15-minute Zoom call. You just send us your client details.",
            conversion_script="Hey [Name], I saw your post about clients delaying payments — we are building an invoicing tool that follows up automatically via WhatsApp. We are in beta and giving away 3 months free to 50 freelancers this week. Would you be up for a 15-min call? I will set everything up for you."
        ),
        channels=[
            MarketingChannel(channel=ChannelType.COMMUNITY, priority="Primary", why_this_channel="Indian freelancers trust peer recommendations in WhatsApp groups over ads — this is where Priya asks for tool recommendations", tactics=["Post weekly value content in 20 freelancer groups", "Sponsor or speak at freelancer meetups in Pune/Bangalore", "Create a free 'Freelancer Payment Guide' PDF as lead magnet", "Run a monthly 'Client Horror Stories' thread — drives organic discussion"], estimated_cac="₹200-400 per user (time cost, near-zero cash)", kpi="Signups per week from community posts > 15", when_to_start="Week 1 — start immediately"),
            MarketingChannel(channel=ChannelType.CONTENT_MARKETING, priority="Primary", why_this_channel="Freelancer finance is an underserved content niche — Priya Googles 'how to follow up on unpaid invoice India' with no good results", tactics=["Publish 2x/week on LinkedIn: payment tips + freelancer stories", "SEO blog: target 'GST invoice for freelancer India', 'how to follow up payment WhatsApp'", "Twitter threads on freelancer money lessons — repurpose from LinkedIn", "YouTube shorts: 60-second invoice tips"], estimated_cac="₹300-600 per user (6-month content compounding)", kpi="Organic signups from content > 20/week by Month 4", when_to_start="Week 2 — after first 20 beta users"),
            MarketingChannel(channel=ChannelType.REFERRAL, priority="Secondary", why_this_channel="Every invoice sent via WhatsApp is a brand impression to the client — who may also be a freelancer", tactics=["Embed referral link in invoice footer: 'Powered by InvoiceZap — get 1 month free'", "Refer 3 friends → get Pro free for 1 month", "Leaderboard of top referrers in the community", "Double-sided referral: referrer gets 1 month free, referee gets 2 weeks free"], estimated_cac="₹150-300 per user (viral coefficient target: 0.4)", kpi="Referral rate > 15% of new signups", when_to_start="Month 2 — after first 50 users"),
            MarketingChannel(channel=ChannelType.PARTNERSHIPS, priority="Secondary", why_this_channel="Platform partnerships give access to large, pre-qualified freelancer audiences with zero CAC", tactics=["Partner with Internshala to bundle InvoiceZap for new freelancers", "Integrate with Fiverr India seller dashboard", "Co-market with Razorpay for freelancer segment", "Partner with CA firms who advise freelancers on GST"], estimated_cac="₹0-200 per user via platform deals", kpi="1 signed partnership by Month 3", when_to_start="Month 2 — start conversations immediately"),
            MarketingChannel(channel=ChannelType.PAID_ADS, priority="Experimental", why_this_channel="Test paid once organic CAC is proven — validates scalability before Series A", tactics=["Google Ads: 'invoice app for freelancers India' (high intent)", "LinkedIn Ads targeting freelancers in metro cities", "Instagram Reels: before/after of payment chasing vs InvoiceZap", "Retargeting website visitors who did not convert"], estimated_cac="₹800-1500 per paid user", kpi="Paid CAC < ₹1000 with LTV:CAC > 3:1", when_to_start="Month 5 — after organic CAC is benchmarked"),
        ],
        weekly_plan=[
            WeekPlan(week=1, theme="Beta Launch & First Outreach", phase=GrowthPhase.TRACTION, goals=["Join 20 freelancer communities", "Send 50 personal DMs", "Get first 10 beta signups"], tasks=["Join 20 Indian freelancer WhatsApp groups and LinkedIn communities", "Post problem-question in each group (not an ad)", "DM 50 high-engagement members with beta offer", "Set up landing page with waitlist form", "Post build-in-public launch tweet on Twitter"], channel_focus=["Community", "Cold Outreach"], success_metric="10 beta signups", milestone=True, milestone_label="Beta Launch"),
            WeekPlan(week=2, theme="White-Glove Onboarding", phase=GrowthPhase.TRACTION, goals=["Onboard all 10 beta users personally", "Get first invoice sent via WhatsApp", "Collect 10 user feedback calls"], tasks=["Schedule 15-min Zoom onboarding with each beta user", "Set up their first 3 invoices manually if needed", "Document every friction point in onboarding", "Start LinkedIn content: Week 1 build update", "Set up basic analytics to track invoice sends"], channel_focus=["Community", "Content Marketing"], success_metric="10 invoices sent via WhatsApp", milestone=False, milestone_label=""),
            WeekPlan(week=3, theme="Feedback Loop & Iteration", phase=GrowthPhase.TRACTION, goals=["Fix top 3 onboarding friction points", "Reach 25 total beta signups", "Get first user testimonial"], tasks=["Ship fixes for top 3 user-reported issues", "Ask happy users for referrals — offer 1 month free", "Post second LinkedIn build update with user story", "Send 50 more DMs with updated pitch", "Create 'Freelancer Payment Guide' PDF lead magnet"], channel_focus=["Community", "Referral"], success_metric="25 total signups, 1 testimonial", milestone=False, milestone_label=""),
            WeekPlan(week=4, theme="First Revenue", phase=GrowthPhase.TRACTION, goals=["Convert first free user to Pro", "Reach 50 total signups", "MRR > ₹0"], tasks=["Email all free users: 'Your free trial ends in 7 days'", "Offer first 20 converters a 20% launch discount", "Post revenue milestone on Twitter/LinkedIn", "Start SEO blog: first article on 'GST invoice for freelancer India'", "Send 30 more targeted DMs"], channel_focus=["Community", "Content Marketing"], success_metric="First paying customer", milestone=True, milestone_label="First Revenue"),
            WeekPlan(week=5, theme="Content Engine Start", phase=GrowthPhase.TRACTION, goals=["Publish 3 blog posts", "Reach 75 total signups", "5 paying users"], tasks=["Publish 'How to follow up on unpaid invoices in India' blog post", "Post 3 LinkedIn articles repurposed from blog", "DM 2 freelancer micro-influencers for shoutout", "Implement referral link in invoice footer", "Schedule weekly content calendar for next 4 weeks"], channel_focus=["Content Marketing", "Referral"], success_metric="75 signups, 5 paying users", milestone=False, milestone_label=""),
            WeekPlan(week=6, theme="Community Authority Building", phase=GrowthPhase.TRACTION, goals=["Reach 100 total signups", "10 paying users", "MRR ₹5,000"], tasks=["Host first free 'Get Paid Faster' webinar for freelancers", "Publish case study: 'How Priya got paid 2 weeks faster'", "Reach out to 3 CA firms for referral partnership", "Implement read receipts feature", "Post webinar recording clips on LinkedIn + Twitter"], channel_focus=["Community", "Content Marketing"], success_metric="100 total signups, MRR ₹5,000", milestone=False, milestone_label=""),
            WeekPlan(week=7, theme="Referral Activation", phase=GrowthPhase.TRACTION, goals=["Launch referral programme", "15 paying users", "MRR ₹7,500"], tasks=["Ship referral programme: refer 3 → 1 month free", "Email all users announcing referral programme", "Post referral launch on all social channels", "Start conversations with Internshala for partnership", "Publish 'Top 5 mistakes freelancers make with invoices' blog"], channel_focus=["Referral", "Content Marketing"], success_metric="15 paying users, referral rate > 10%", milestone=False, milestone_label=""),
            WeekPlan(week=8, theme="100 Users Milestone", phase=GrowthPhase.GROWTH, goals=["100 total active users", "25 paying users", "MRR ₹12,500"], tasks=["Celebrate 100 users publicly — post on all channels", "Run 'thank you' campaign: personal note to first 100 users", "Analyse cohort data: what do retained users have in common?", "Double down on highest-performing content topic", "Start Google Ads experiment with ₹5,000 budget"], channel_focus=["Community", "Paid Ads"], success_metric="100 active users, MRR ₹12,500", milestone=True, milestone_label="100 Users"),
            WeekPlan(week=9, theme="Paid Acquisition Test", phase=GrowthPhase.GROWTH, goals=["Test Google Ads CAC", "40 paying users", "First partnership LOI"], tasks=["Run Google Ads: 'invoice app India freelancer' — ₹5K budget", "Measure paid CAC vs organic CAC", "Finalise Internshala partnership terms", "Publish monthly product update email to all users", "Start 'Business' tier upsell campaign to Pro users with 3+ months"], channel_focus=["Paid Ads", "Partnerships"], success_metric="Paid CAC < ₹1,200, 40 paying users", milestone=False, milestone_label=""),
            WeekPlan(week=10, theme="Retention Deep Dive", phase=GrowthPhase.GROWTH, goals=["Churn < 3%", "60 paying users", "NPS > 40"], tasks=["Run NPS survey to all users with 30+ days activity", "Interview 5 churned users — find the real reason", "Ship 'smart reminder timing' feature based on user feedback", "Publish 'How InvoiceZap works' YouTube video (5 min)", "Start upsell sequence for Business tier"], channel_focus=["Email Marketing", "Product-Led Growth"], success_metric="NPS > 40, churn < 3%", milestone=False, milestone_label=""),
            WeekPlan(week=11, theme="Partnership Launch", phase=GrowthPhase.GROWTH, goals=["Internshala partnership live", "80 paying users", "MRR ₹40,000"], tasks=["Launch Internshala co-marketing campaign", "Send joint email to 50K Internshala freelancers", "Publish partnership announcement on LinkedIn", "Ship team accounts feature for Business tier", "Reach out to 3 more partnership targets (Fiverr India, Toptal India)"], channel_focus=["Partnerships", "Content Marketing"], success_metric="80 paying users from partnership channel", milestone=False, milestone_label=""),
            WeekPlan(week=12, theme="Scale Decision", phase=GrowthPhase.GROWTH, goals=["100 paying users", "MRR ₹50,000", "Fundraising decision"], tasks=["Full 12-week retrospective: what worked, what did not", "Compile investor deck with real traction data", "Decide: bootstrap to break-even OR raise pre-seed now", "Reach out to 5 target investors with warm intros", "Set 90-day goals for next quarter"], channel_focus=["Community", "Partnerships"], success_metric="MRR ₹50,000, fundraising decision made", milestone=True, milestone_label="Scale Decision"),
        ],
        growth_experiments=[
            GrowthExperiment(name="Invoice footer viral loop", hypothesis="If we add 'Powered by InvoiceZap' with a referral link in every invoice footer, 15% of clients will click it because they want the same tool.", how_to_run="Add branded footer with unique referral link to all free-tier invoices. Track clicks and signups attributed to the link. Run for 30 days with 50 active users.", success_criteria="Referral rate from invoice footer > 12%", effort="Low", potential_impact="High", timeline="Week 3 — as soon as first invoices are sent"),
            GrowthExperiment(name="Payment celebration social share", hypothesis="If we add a 'Share your win' button when an invoice gets paid, 25% of users will share on LinkedIn because getting paid on time is worth celebrating.", how_to_run="After invoice is marked paid, show celebration screen with pre-filled LinkedIn post: 'Just got paid on time with @InvoiceZap.' Add one-click share. Track share rate and referral signups.", success_criteria="20% of paid-invoice events result in a social share", effort="Low", potential_impact="Medium", timeline="Month 2 — after first 20 paid invoices"),
            GrowthExperiment(name="CA firm referral channel", hypothesis="If we partner with 10 CA firms who advise freelancers, they will recommend InvoiceZap to 100+ clients each because it solves the GST compliance headache they deal with daily.", how_to_run="Cold email 50 CA firms in Pune/Bangalore with a free demo offer. Offer revenue share of 20% for first 3 months of referred users. Track signups with CA referral code.", success_criteria="3 CA firms signed as referral partners within 45 days", effort="Medium", potential_impact="High", timeline="Month 2 — start outreach immediately"),
            GrowthExperiment(name="Freelancer platform integration", hypothesis="If InvoiceZap is available as a one-click integration inside Internshala's freelancer dashboard, 5% of active Internshala freelancers will connect it within 30 days.", how_to_run="Build lightweight Internshala integration (OAuth + invoice send trigger). Negotiate co-marketing with Internshala. Measure conversion from integration page to active InvoiceZap users.", success_criteria="500+ InvoiceZap signups from Internshala in first 30 days", effort="High", potential_impact="High", timeline="Month 3 — after MVP is stable"),
            GrowthExperiment(name="WhatsApp group seeding", hypothesis="If we seed 5 pieces of high-value content per week in 20 freelancer WhatsApp groups, 3% of group members will visit our website and 0.5% will sign up.", how_to_run="Create a content calendar of WhatsApp-native content (short tips, screenshots, polls). Post in 20 groups 5x/week. Track UTM links from WhatsApp to website.", success_criteria="50+ weekly website visitors from WhatsApp groups by Week 4", effort="Low", potential_impact="Medium", timeline="Week 1 — start immediately"),
        ],
        scaling_strategy=[
            ScalingStrategy(phase="Phase 1: 0→100 Users", timeframe="Months 1-3", primary_engine="Manual founder-led outreach and white-glove onboarding", key_actions=["Personal DM outreach to 500 freelancers", "White-glove onboarding for first 100 users", "Weekly community value posts", "Build referral loop via invoice footer"], budget_allocation="90% time, 10% cash (₹5K/month on tools)", unlock_condition="Move to Phase 2 when 100 active users and churn < 5%"),
            ScalingStrategy(phase="Phase 2: 100→1K Users", timeframe="Months 4-8", primary_engine="Content flywheel + referral programme + first partnerships", key_actions=["Publish 2x/week SEO content", "Activate referral programme", "Launch Internshala partnership", "Start Google Ads experiment at ₹10K/month"], budget_allocation="50% content/community, 30% paid ads, 20% partnerships", unlock_condition="Move to Phase 3 when MRR ₹1L and CAC payback < 6 months"),
            ScalingStrategy(phase="Phase 3: 1K→10K Users", timeframe="Months 9-18", primary_engine="Paid acquisition + platform partnerships + product-led virality", key_actions=["Scale Google/Meta ads with proven CAC", "Launch on 3 freelancer platforms (Fiverr India, Toptal, Upwork)", "Build affiliate programme for CA firms", "Launch Business tier with team features for agencies"], budget_allocation="40% paid ads, 30% platform deals, 20% content, 10% events", unlock_condition="Raise Series A at 5K paying users and ARR ₹1 Crore"),
        ],
        content_strategy="Publish 3x/week on LinkedIn: one freelancer payment tip (educational), one user win story (social proof), one build-in-public update (trust building). Repurpose to Twitter threads and WhatsApp-native format. Goal: become the #1 content resource for Indian freelancer finance within 6 months. SEO target: rank for 'GST invoice freelancer India' and 'how to follow up payment India'.",
        retention_strategy="Aha moment = first invoice sent via WhatsApp in under 2 minutes. Drive every new user to this in onboarding (skip all setup, do it for them if needed). Day 7 email: 'Did your client pay? If not, here is how to send an automatic reminder in one tap.' Day 30: send personalised 'you saved X hours this month' report.",
        referral_strategy="Refer 3 freelancers → get 1 month Pro free. Mechanic: unique referral link embedded in invoice footer for all free-tier users ('Invoiced with InvoiceZap — try it free'). Client sees it, clicks, signs up. Double-sided: referrer gets 1 month free, referee gets first month at ₹199.",
        partnership_opportunities=["Internshala — bundle InvoiceZap for all freelancers on the platform as default invoicing tool", "Razorpay — co-market to their existing freelancer customer segment as a complementary tool", "CA firms — revenue share partnership: CA recommends InvoiceZap to freelancer clients for GST compliance", "Fiverr India — integrate as the default invoicing tool for Indian Fiverr sellers"],
        north_star_metric="Invoices paid within 7 days of sending (on-time payment rate) — this is the core promise. If this metric is high, everything else follows. Everything else is secondary.",
        gtm_risks=["Risk: freelancers don't pay for productivity tools → Mitigation: freemium with hard 3-invoice limit forces the upgrade decision at the moment of highest value (invoice 4)", "Risk: WhatsApp Business API restrictions limit feature set → Mitigation: build email fallback from day 1, WhatsApp as premium feature only", "Risk: community outreach doesn't scale past 100 users → Mitigation: start content SEO from Week 2 so organic channel is compounding while community is the primary driver"]
    )

    # ── Run the agent ─────────────────────────────────────────────────────
    test_state: AppState = {
        "idea": "InvoiceZap helps Indian freelancers get paid on time by automating invoice reminders and follow-ups via WhatsApp.",
        "industry": "Fintech - Invoice Management",
        "target_market": "Freelance designers and developers in India, aged 22-35, working with 3+ clients simultaneously.",
        "budget": "₹3,00,000 ($5,000) — bootstrapped",
        "stage": "idea",
        "planner_output":    None,
        "research_output":   fake_research,
        "competitor_output": fake_competitor,
        "product_output":    fake_product,
        "branding_output":   fake_branding,
        "finance_output":    fake_finance,
        "gtm_output":        fake_gtm,
        "pitch_output":      None,
        "final_report_path": None,
        "errors":            None,
        "completed_agents":  ["planner", "research", "competitor", "product", "branding", "finance", "gtm"],
    }

    result = run_pitch_agent(test_state)

    print("\n" + "="*60)
    print("PITCH OUTPUT:")
    print("="*60)

    if result.get("pitch_output"):
        p = result["pitch_output"]

        print(f"\nDeck:      {p.deck_title}")
        print(f"Duration:  {p.recommended_duration}")
        print(f"\nNarrative Summary:\n  {p.pitch_narrative_summary}")

        print(f"\n── SLIDES ──")
        slides = [
            ("01 Cover",       p.slide_01_cover),
            ("02 Problem",     p.slide_02_problem),
            ("03 Solution",    p.slide_03_solution),
            ("04 Product",     p.slide_04_product),
            ("05 Market",      p.slide_05_market),
            ("06 Business",    p.slide_06_business),
            ("07 Traction",    p.slide_07_traction),
            ("08 Competition", p.slide_08_competition),
            ("09 GTM",         p.slide_09_gtm),
            ("10 Team",        p.slide_10_team),
            ("11 Financials",  p.slide_11_financials),
            ("12 Ask",         p.slide_12_ask),
        ]
        for label, slide in slides:
            print(f"\n  ── Slide {label} ──")
            print(f"    Headline:  {getattr(slide, 'headline', getattr(slide, 'startup_name', 'N/A'))}")
            print(f"    Note:      {slide.presenter_note[:100]}...")

        print(f"\n── INVESTOR Q&A ──")
        for qa in p.hardest_questions:
            print(f"  {qa[:120]}")

        print(f"\n── FOLLOW-UP EMAIL ──")
        print(f"  {p.email_follow_up[:300]}...")

        print(f"\n── CLOSING LINE ──")
        print(f"  \"{p.slide_12_ask.closing_line}\"")
    else:
        print("Agent failed. Errors:", result.get("errors"))