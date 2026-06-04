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
Product Name Hint:   {product.product_name_suggestion}
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


# ── Standalone test ───────────────────────────────────────────────────────────

if __name__ == "__main__":
    """
    Test branding agent with realistic fake inputs from previous agents.

    Usage:
        cd venture-pilot
        source .venv/bin/activate
        python agents/branding.py
    """
    from schemas.research   import MarketResearchOutput
    from schemas.competitor import CompetitorOutput, Competitor
    from schemas.product    import ProductOutput, Feature, RoadmapPhase, Priority, MonetizationModel

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
                name="Razorpay",
                description="Payment gateway with basic invoicing bolt-on.",
                strengths=["Trusted brand", "Instant UPI payments"],
                weaknesses=["Invoicing is not core product", "No auto-reminders"],
                pricing="2% transaction fee, no monthly fee",
                target_segment="Online businesses, not freelancers specifically"
            ),
            Competitor(
                name="FreshBooks",
                description="Western invoicing SaaS, popular among global freelancers.",
                strengths=["Beautiful UI", "Time tracking built-in"],
                weaknesses=["Expensive for INR budgets", "No GST compliance", "No WhatsApp"],
                pricing="$17-55/month — expensive for Indian freelancers",
                target_segment="Western freelancers and creative agencies"
            ),
        ],
        market_leader="Zoho Invoice leads India SMB invoicing due to GST integration and trust.",
        pricing_landscape="₹0-750/month range. Western tools expensive. No strong WhatsApp-native player.",
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
            "Freelancer-native UI — no business jargon, no complexity",
        ],
        sources=["https://example.com"]
    )

    fake_product = ProductOutput(
        product_name_suggestion="InvoiceZap",
        usp="The only invoicing tool built for WhatsApp-first Indian freelancers.",
        mvp_scope="Create GST-compliant invoices in 60 seconds and send via WhatsApp. Auto-reminders follow up so you don't have to.",
        core_features=[
            Feature(name="60-second invoice builder", description="Template-based, GST-ready invoice creation.", priority=Priority.MUST_HAVE, solves_pain="Manual invoice creation is error-prone"),
            Feature(name="WhatsApp delivery", description="Send invoices directly to client WhatsApp.", priority=Priority.MUST_HAVE, solves_pain="Clients ignore emails"),
            Feature(name="Auto payment reminders", description="Automated follow-up messages at 3, 7, 14 days.", priority=Priority.MUST_HAVE, solves_pain="No follow-up system"),
            Feature(name="Invoice read receipts", description="Know when client opens the invoice.", priority=Priority.SHOULD_HAVE, solves_pain="Zero visibility on invoice status"),
            Feature(name="UPI payment link", description="Embed UPI payment link in the invoice.", priority=Priority.MUST_HAVE, solves_pain="Friction in getting paid"),
        ],
        suggested_tech_stack=["Next.js", "FastAPI", "PostgreSQL", "Razorpay", "Twilio"],
        monetization_model=MonetizationModel.FREEMIUM,
        pricing_recommendation="Free: 3 invoices/month. Pro: ₹499/month — unlimited. Business: ₹999/month — team + analytics.",
        roadmap=[
            RoadmapPhase(phase="Phase 1 — MVP", timeline="0-3 months", deliverables=["Invoice builder", "WhatsApp delivery", "UPI payment link"]),
            RoadmapPhase(phase="Phase 2 — Retention", timeline="3-6 months", deliverables=["Auto-reminders", "Read receipts", "Dashboard"]),
            RoadmapPhase(phase="Phase 3 — Growth", timeline="6-12 months", deliverables=["Team accounts", "Analytics", "Integrations"]),
        ],
        product_risks=["WhatsApp Business API approval delays", "Freelancer reluctance to switch from existing tools"]
    )

    test_state: AppState = {
        "idea": "InvoiceZap helps Indian freelancers get paid on time by automating invoice reminders and follow-ups.",
        "industry": "Fintech - Invoice Management",
        "target_market": "Freelance designers and developers in India, aged 22-35.",
        "budget": "$5,000 — bootstrapped",
        "stage": "idea",
        "planner_output":    None,
        "research_output":   fake_research,
        "competitor_output": fake_competitor,
        "product_output":    fake_product,
        "branding_output":   None,
        "finance_output":    None,
        "gtm_output":        None,
        "pitch_output":      None,
        "final_report_path": None,
        "errors":            None,
        "completed_agents":  ["planner", "research", "competitor", "product"],
    }

    result = run_branding_agent(test_state)

    print("\n" + "="*60)
    print("BRANDING OUTPUT:")
    print("="*60)

    if result.get("branding_output"):
        b = result["branding_output"]

        print(f"\n── NAME SUGGESTIONS ──")
        for n in b.name_suggestions:
            print(f"  ► {n.name}")
            print(f"    Rationale:  {n.rationale}")
            print(f"    Domain:     {n.domain_available}")
            print(f"    Tagline:    {n.tagline_fit}")

        print(f"\n✓ Recommended: {b.recommended_name}")

        print(f"\n── TAGLINES ──")
        for t in b.taglines:
            print(f"  • {t}")
        print(f"\n✓ Recommended: {b.recommended_tagline}")

        print(f"\n── BRAND IDENTITY ──")
        print(f"  Personality: {b.brand_personality}")
        print(f"  Tone:        {b.brand_tone}")
        print(f"  Voice:       {b.brand_voice_description}")

        print(f"\n── POSITIONING ──")
        print(f"  {b.positioning_statement}")
        print(f"\n  Elevator Pitch: {b.elevator_pitch}")

        print(f"\n── MESSAGING PILLARS ──")
        for p in b.messaging_pillars:
            print(f"  • {p}")

        print(f"\n── COLOR PALETTE ──")
        for c in b.color_palette:
            print(f"  {c.role:12} {c.hex_code}  {c.color_name}")
            print(f"    Usage:  {c.usage}")
            print(f"    Why:    {c.psychology}")
        print(f"\n  Rationale: {b.color_palette_rationale}")

        print(f"\n── TYPOGRAPHY ──")
        for t in b.typography:
            print(f"  {t.role:10} → {t.font_name} ({t.source})")
            print(f"    Why: {t.why}")

        print(f"\n── DOMAINS ──")
        for d in b.domain_suggestions:
            print(f"  {d.domain:30} — {d.rationale}")

        print(f"\n── ICP ──")
        print(f"  {b.icp_summary}")

        print(f"\n── LOGO DIRECTION ──")
        print(f"  {b.logo_direction}")

        print(f"\n── BRAND DOS ──")
        for d in b.brand_dos:
            print(f"  ✓ {d}")

        print(f"\n── BRAND DON'TS ──")
        for d in b.brand_donts:
            print(f"  ✗ {d}")
    else:
        print("Agent failed. Errors:", result.get("errors"))