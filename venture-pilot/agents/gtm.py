"""
agents/gtm.py — The Go-To-Market Agent.

Runs in PARALLEL with finance.py, after branding.py.

What it does:
  1. Reads research_output  → audience, pain points, market trends
  2. Reads competitor_output → gaps, underserved segments, differentiators
  3. Reads product_output    → USP, core features, mvp scope
  4. Reads branding_output   → ICP, brand voice, messaging pillars, positioning
  5. NO web search — all signal already exists in state from prior agents
  6. Sends full context to GPT → structured GTMOutput
  7. Writes result back to state

Why it needs branding (not just product + research):
  GTM copy and channel strategy must SOUND like the brand.
  If branding says "Direct + Empowering Ally", the GTM copy and
  outreach scripts must reflect that tone — not generic marketing speak.
  Without branding output, GTM would produce tone-deaf messaging.

Key outputs and how the frontend renders them:
  weekly_plan      → 12 structured WeekPlan objects
                     Frontend renders as interactive Gantt/timeline chart.
                     milestone=True weeks get highlighted markers.
                     Each week expands to show tasks + success metric.

  growth_experiments → Cards with effort/impact badges
  scaling_strategy   → Phase-by-phase accordion
  channels           → Priority-sorted channel cards with tactics
  first_100_users    → Step-by-step checklist with conversion script

Note on weekly_plan graph structure:
  The WeekPlan schema was designed specifically for frontend rendering.
  Each WeekPlan has:
    - week (int)          → x-axis position on the timeline
    - phase (enum)        → color-coding by growth phase
    - milestone (bool)    → whether to show a milestone marker
    - milestone_label     → text shown on the milestone marker
    - success_metric      → shown in the week card on hover/expand
    - channel_focus       → shown as channel tags
  The frontend (Next.js) can map this directly to a recharts/d3 timeline
  with zero additional transformation needed.
"""

import os
from dotenv import load_dotenv
from openai import OpenAI

from state import AppState
from schemas.gtm import GTMOutput

load_dotenv()


GTM_SYSTEM_PROMPT = """
You are an expert growth marketer and GTM strategist who has helped 
early-stage startups get their first 1000 users.

You will be given:
- A startup idea with its refined value proposition
- Market research (audience, pain points, trends, opportunity)
- Competitive analysis (gaps, underserved segments, differentiators)
- Product definition (USP, features, MVP scope, pricing)
- Brand identity (ICP story, voice, messaging pillars, positioning)

Your job is to build a complete, executable Go-To-Market strategy.

RULES:
- Return ONLY valid JSON. No markdown, no explanation, no preamble.
- weekly_plan MUST have EXACTLY 12 entries — one per week, weeks 1 through 12.
- growth_experiments MUST have EXACTLY 5 entries.
- scaling_strategy MUST have EXACTLY 3 entries (0→100, 100→1K, 1K→10K).
- channels MUST have between 4 and 6 entries.
- ALL tactics, scripts, and steps must be specific to this startup's 
  audience — never generic marketing advice.
- The conversion_script in first_100_users must sound like a real human 
  wrote it, not a marketer. Conversational, empathetic, specific.
- Milestone weeks: Week 1 (Beta Launch), Week 4 (First Revenue), 
  Week 8 (100 Users), Week 12 (Scale Decision). Set milestone=true for these.
- Growth experiments must be ordered by effort:impact (best ratio first).
- Channel priority: 2 Primary, 2 Secondary, 1-2 Experimental.
- Every channel tactic must be executable with zero budget if needed.
- The north_star_metric must be an outcome metric (not a vanity metric like signups).
"""


def run_gtm_agent(state: AppState) -> AppState:
    """
    Main entry point. Reads research + competitor + product + branding from state.
    Returns updated state with gtm_output filled.
    """

    print("\n[GTM Agent] Building Go-To-Market strategy...")

    # ── Guards: all prior agents must have run ────────────────────────────
    missing = []
    if not state.get("research_output"):
        missing.append("research_output")
    if not state.get("competitor_output"):
        missing.append("competitor_output")
    if not state.get("product_output"):
        missing.append("product_output")
    if not state.get("branding_output"):
        missing.append("branding_output")

    if missing:
        errors = state.get("errors") or []
        errors.append(f"gtm_agent: missing required outputs — {', '.join(missing)}")
        return {**state, "errors": errors}

    idea          = state["idea"]
    industry      = state["industry"]
    target_market = state["target_market"]
    budget        = state.get("budget", "bootstrapped")
    stage         = state.get("stage", "idea")
    research      = state["research_output"]
    competitor    = state["competitor_output"]
    product       = state["product_output"]
    branding      = state["branding_output"]

    # ── Build competitor gaps summary ─────────────────────────────────────
    comp_gaps = "\n".join(f"  - {g}" for g in competitor.feature_gaps)
    underserved = "\n".join(f"  - {s}" for s in competitor.underserved_segments)
    differentiators = "\n".join(f"  - {d}" for d in competitor.suggested_differentiators)

    # ── Build must-have features list ─────────────────────────────────────
    must_have = [f for f in product.core_features if "Must" in f.priority]
    features_str = "\n".join(
        f"  - [{f.priority}] {f.name}: {f.description}" for f in product.core_features
    )

    # ── Build the full prompt ─────────────────────────────────────────────
    user_prompt = f"""
Startup Idea:    {idea}
Industry:        {industry}
Target Market:   {target_market}
Budget:          {budget}
Stage:           {stage}

--- MARKET RESEARCH ---
Problem:          {research.problem_statement}
Target Audience:  {research.target_audience}
Opportunity Gap:  {research.opportunity_gap}

Pain Points:
{chr(10).join(f"  - {p}" for p in research.pain_points)}

Market Trends:
{chr(10).join(f"  - {t}" for t in research.market_trends)}
--- END RESEARCH ---

--- COMPETITIVE INTEL ---
Market Leader:    {competitor.market_leader}
Pricing Landscape:{competitor.pricing_landscape}

Feature Gaps (our advantages):
{comp_gaps}

Underserved Segments (who to target first):
{underserved}

Our Differentiators:
{differentiators}
--- END COMPETITIVE INTEL ---

--- PRODUCT ---
USP:             {product.usp}
MVP Scope:       {product.mvp_scope}
Monetization:    {product.monetization_model}

Core Features:
{features_str}
--- END PRODUCT ---

--- BRAND IDENTITY ---
Recommended Name:    {branding.approved_name}
Tagline:             {branding.approved_tagline}
Brand Personality:   {branding.brand_personality}
Brand Tone:          {branding.brand_tone}
Voice:               {branding.brand_voice_description}
Positioning:         {branding.positioning_statement}

ICP Story:
{branding.icp_summary}

Messaging Pillars:
{chr(10).join(f"  - {p}" for p in branding.messaging_pillars)}
--- END BRAND IDENTITY ---

Now build the complete GTM strategy. Every tactic, script, and recommendation
must be specific to this exact startup, audience, and brand voice.
The weekly_plan must have EXACTLY 12 entries (Week 1 to Week 12).
"""

    # ── Call OpenAI with structured output ────────────────────────────────
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    response = client.beta.chat.completions.parse(
        model="gpt-4o-mini",
        max_tokens=6000,
        messages=[
            {"role": "system", "content": GTM_SYSTEM_PROMPT},
            {"role": "user",   "content": user_prompt}
        ],
        response_format=GTMOutput
    )

    gtm_output = response.choices[0].message.parsed

    if gtm_output is None:
        errors = state.get("errors") or []
        errors.append("gtm_agent: model refused or failed to return structured output")
        return {**state, "errors": errors}

    # ── Log key outputs ───────────────────────────────────────────────────
    milestone_weeks = [w.week for w in gtm_output.weekly_plan if w.milestone]
    primary_channels = [c.channel for c in gtm_output.channels if c.priority == "Primary"]

    print(f"[GTM Agent] ✓ GTM strategy built.")
    print(f"[GTM Agent]   First 100 users in:  {gtm_output.first_100_users.total_timeline}")
    print(f"[GTM Agent]   Primary channels:    {[c.value for c in primary_channels]}")
    print(f"[GTM Agent]   Weekly plan:         {len(gtm_output.weekly_plan)} weeks")
    print(f"[GTM Agent]   Milestone weeks:     {milestone_weeks}")
    print(f"[GTM Agent]   Growth experiments:  {len(gtm_output.growth_experiments)}")
    print(f"[GTM Agent]   North star metric:   {gtm_output.north_star_metric[:60]}...")

    # ── Write back to state ───────────────────────────────────────────────
    completed = state.get("completed_agents") or []
    completed.append("gtm")

    return {
        **state,
        "gtm_output":       gtm_output,
        "completed_agents": completed
    }


# ── Standalone test ───────────────────────────────────────────────────────────

if __name__ == "__main__":
    """
    Test GTM agent with realistic fake inputs from all prior agents.

    Usage:
        cd venture-pilot
        source .venv/bin/activate
        python agents/gtm.py
    """
    from schemas.research   import MarketResearchOutput
    from schemas.competitor import CompetitorOutput, Competitor
    from schemas.product    import ProductOutput, Feature, RoadmapPhase, Priority, MonetizationModel
    from schemas.branding   import (BrandingOutput, BrandPersonality, BrandTone,
                                    NameSuggestion, ColorSwatch, DomainSuggestion,
                                    TypographySuggestion)

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

    fake_competitor = CompetitorOutput(
        competitors=[
            Competitor(
                name="Zoho Invoice",
                description="Full-suite invoicing for SMBs, primarily accountant-focused.",
                strengths=["Deep GST support", "Wide integrations"],
                weaknesses=["Overwhelming UI for freelancers", "No WhatsApp support"],
                pricing="Free up to 1 client, paid from ₹749/month",
                target_segment="Small businesses and accountants"
            ),
            Competitor(
                name="FreshBooks",
                description="Western invoicing SaaS for global freelancers.",
                strengths=["Beautiful UI", "Time tracking"],
                weaknesses=["Expensive for INR budgets", "No GST", "No WhatsApp"],
                pricing="$17-55/month",
                target_segment="Western freelancers"
            ),
            Competitor(
                name="Razorpay",
                description="Payment gateway with basic invoicing.",
                strengths=["Trusted brand", "Instant UPI"],
                weaknesses=["Invoicing not core", "No auto-reminders"],
                pricing="2% transaction fee",
                target_segment="Online businesses"
            ),
        ],
        market_leader="Zoho Invoice leads India SMB invoicing due to GST integration and trust.",
        pricing_landscape="₹0-750/month range. No strong WhatsApp-native player.",
        feature_gaps=[
            "No tool offers WhatsApp-native invoice delivery",
            "No auto payment reminder system for Indian freelancers",
            "None combine GST compliance with a freelancer-first UI",
        ],
        underserved_segments=[
            "Freelancers in Tier-2/3 cities with limited English",
            "Creative freelancers who find Zoho too complex",
        ],
        suggested_differentiators=[
            "WhatsApp-first invoice delivery and follow-ups",
            "GST-compliant invoices with zero accounting knowledge required",
            "Freelancer-native UI — no business jargon",
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
        name_suggestions=[
            NameSuggestion(name="InvoiceZap", rationale="Speed + invoicing", domain_available="getinvoicezap.com", tagline_fit="Get paid. Instantly.")
        ],
        recommended_name="InvoiceZap — short, action-oriented, communicates speed.",
        taglines=[
            "Get paid. On time. Every time.",
            "Because chasing payments is not your job.",
            "Built for the way India freelances.",
            "Invoicing, unleashed.",
            "What if getting paid was the easy part?"
        ],
        recommended_tagline="Get paid. On time. Every time.",
        brand_personality=BrandPersonality.EMPOWERING_ALLY,
        brand_tone=BrandTone.DIRECT,
        brand_voice_description="Sharp, direct, celebrates the freelancer win. Never preachy.",
        positioning_statement="For Indian freelancers who struggle with late payments, InvoiceZap is the invoicing tool that automates WhatsApp follow-ups, unlike Zoho which is built for accountants.",
        elevator_pitch="We help Indian freelancers get paid on time. Send invoice via WhatsApp, we handle follow-ups. No more awkward payment chasing.",
        messaging_pillars=["Speed — everything feels instant", "Trust — treats money seriously", "Independence — built for people who work for themselves"],
        color_palette=[
            ColorSwatch(role="Primary", hex_code="#0D9488", color_name="Teal", usage="CTAs, headers", psychology="Trust + innovation"),
            ColorSwatch(role="Secondary", hex_code="#1E293B", color_name="Dark Slate", usage="Body text", psychology="Authority"),
            ColorSwatch(role="Accent", hex_code="#F59E0B", color_name="Amber", usage="Highlights", psychology="Energy"),
            ColorSwatch(role="Background", hex_code="#F8FAFC", color_name="Off-white", usage="Page bg", psychology="Clean"),
            ColorSwatch(role="Text", hex_code="#0F172A", color_name="Near-black", usage="Body copy", psychology="Readable"),
        ],
        color_palette_rationale="Teal differentiates from blue-heavy fintech. Amber adds energy.",
        typography=[
            TypographySuggestion(role="Heading", font_name="Sora", source="Google Fonts", why="Modern, confident"),
            TypographySuggestion(role="Body", font_name="Inter", source="Google Fonts", why="Highly readable"),
            TypographySuggestion(role="Accent", font_name="DM Mono", source="Google Fonts", why="Numbers look sharp"),
        ],
        domain_suggestions=[
            DomainSuggestion(domain="getinvoicezap.com", rationale="Clean .com"),
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
        "competitor_output": fake_competitor,
        "product_output":    fake_product,
        "branding_output":   fake_branding,
        "finance_output":    None,
        "gtm_output":        None,
        "pitch_output":      None,
        "final_report_path": None,
        "errors":            None,
        "completed_agents":  ["planner", "research", "competitor", "product", "branding"],
    }

    result = run_gtm_agent(test_state)

    print("\n" + "="*60)
    print("GTM OUTPUT:")
    print("="*60)

    if result.get("gtm_output"):
        g = result["gtm_output"]

        print(f"\n── FIRST 100 USERS ──")
        f100 = g.first_100_users
        print(f"  Timeline:     {f100.total_timeline}")
        print(f"  Approach:     {f100.core_approach}")
        print(f"  Hook Offer:   {f100.hook_offer}")
        print(f"  Where to find them:")
        for w in f100.where_to_find_them:
            print(f"    • {w}")
        print(f"  Steps:")
        for i, s in enumerate(f100.steps, 1):
            print(f"    {i}. {s}")
        print(f"  Conversion Script:\n    \"{f100.conversion_script}\"")

        print(f"\n── CHANNELS ({len(g.channels)}) ──")
        for c in g.channels:
            print(f"  [{c.priority:12}] {c.channel.value}")
            print(f"    Why:  {c.why_this_channel}")
            print(f"    CAC:  {c.estimated_cac}")
            print(f"    KPI:  {c.kpi}")
            print(f"    Start:{c.when_to_start}")
            for t in c.tactics:
                print(f"    → {t}")

        print(f"\n── 12-WEEK PLAN ──")
        for w in g.weekly_plan:
            milestone_str = f" ★ {w.milestone_label}" if w.milestone else ""
            print(f"  Week {w.week:>2} [{w.phase.value[:12]:12}] {w.theme}{milestone_str}")
            print(f"    Metric:   {w.success_metric}")
            print(f"    Channels: {', '.join(w.channel_focus)}")

        print(f"\n── GROWTH EXPERIMENTS ──")
        for i, exp in enumerate(g.growth_experiments, 1):
            print(f"  {i}. {exp.name}  [Effort: {exp.effort} | Impact: {exp.potential_impact}]")
            print(f"     {exp.hypothesis}")
            print(f"     Success: {exp.success_criteria}")
            print(f"     When: {exp.timeline}")

        print(f"\n── SCALING STRATEGY ──")
        for s in g.scaling_strategy:
            print(f"  {s.phase} ({s.timeframe})")
            print(f"    Engine: {s.primary_engine}")
            print(f"    Budget: {s.budget_allocation}")
            print(f"    Unlock: {s.unlock_condition}")

        print(f"\n── CONTENT STRATEGY ──")
        print(f"  {g.content_strategy}")

        print(f"\n── RETENTION ──")
        print(f"  {g.retention_strategy}")

        print(f"\n── REFERRAL ──")
        print(f"  {g.referral_strategy}")

        print(f"\n── PARTNERSHIPS ──")
        for p in g.partnership_opportunities:
            print(f"  • {p}")

        print(f"\n── NORTH STAR METRIC ──")
        print(f"  {g.north_star_metric}")

        print(f"\n── GTM RISKS ──")
        for r in g.gtm_risks:
            print(f"  ⚠ {r}")
    else:
        print("Agent failed. Errors:", result.get("errors"))