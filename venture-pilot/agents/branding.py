"""
agents/branding.py — Two-phase Branding Agent with HITL support.

Phase 1 — run_branding_agent():
  Generates one name suggestion, one tagline, color palette, logo direction,
  and all supporting brand identity fields. Pipeline pauses here for founder
  review. Job status → "awaiting_branding_approval".

Phase 2 — run_branding_logo_agent():
  Called AFTER founder approves. Uses approved_name + approved_logo_direction
  to generate a logo image via gpt-image-1-mini (black text on white background).
  Uploads to Supabase Storage, writes public URL back to state.

Downstream agents read:
  approved_branding_name      → was approved_name or edited by founder
  approved_branding_tagline   → was approved_tagline or edited by founder
  branding_output             → all other brand identity fields unchanged
  branding_logo_url           → Supabase Storage public URL
"""

import os
import base64
import uuid
from dotenv import load_dotenv
from openai import OpenAI
from supabase import create_client, Client

from state import AppState
from schemas.branding import BrandingOutput

load_dotenv()

SUPABASE_URL             = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
LOGO_BUCKET              = "logos"


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
- name_suggestion must be ORIGINAL — not generic like "QuickPay" or "EasyBill".
  Think harder. Use wordplay, metaphor, foreign words, portmanteaus.
- tagline must be punchy and under 10 words. No corporate speak.
- color_palette must feel COHESIVE as a system — not 5 random good colors.
  The palette must stand out from the competitive landscape.
- Typography must be Google Fonts only (free and web-safe).
- domain_suggestions must be realistic — prefer short, memorable, under 20 chars.
- icp_summary must read like a human story, not a demographic bullet list.
- brand_dos and brand_donts must be specific to THIS brand.
- Every creative decision must be traceable to the brand personality chosen.
- Do NOT populate approved_name, approved_tagline, approved_color_palette,
  approved_logo_direction, or logo_image_url — those are set by the founder.
"""


# ── Phase 1: Generate brand identity ─────────────────────────────────────────

def run_branding_agent(state: AppState) -> AppState:
    """
    Phase 1. Generates brand suggestions and pauses for founder review.
    Sets branding_hitl_status = "awaiting_approval".
    """
    print("\n[Branding Agent] Phase 1 — generating brand identity...")

    missing = []
    if not state.get("research_output"):  missing.append("research_output")
    if not state.get("competitor_output"): missing.append("competitor_output")
    if not state.get("product_output"):   missing.append("product_output")

    if missing:
        errors = state.get("errors") or []
        errors.append(f"branding_agent: missing — {', '.join(missing)}")
        return {**state, "errors": errors}

    idea          = state["idea"]
    target_market = state["target_market"]
    industry      = state["industry"]
    research      = state["research_output"]
    competitor    = state["competitor_output"]
    product       = state["product_output"]

    competitor_names      = [c.name for c in competitor.competitors]
    competitor_weaknesses = [
        f"{c.name}: {w}"
        for c in competitor.competitors
        for w in c.weaknesses
    ]

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
Market Leader:     {competitor.market_leader}
Competitors:       {", ".join(competitor_names)}
Pricing Landscape: {competitor.pricing_landscape}

Competitor Weaknesses (position AGAINST these):
{chr(10).join(f"  - {w}" for w in competitor_weaknesses)}

Feature Gaps (our advantages):
{chr(10).join(f"  - {g}" for g in competitor.feature_gaps)}

Suggested Differentiators:
{chr(10).join(f"  - {d}" for d in competitor.suggested_differentiators)}
--- END COMPETITIVE LANDSCAPE ---

--- PRODUCT DEFINITION ---
USP:               {product.usp}
MVP Scope:         {product.mvp_scope}
Monetization:      {product.monetization_model}

Core Features:
{chr(10).join(f"  - [{f.priority}] {f.name}: {f.description}" for f in product.core_features)}
--- END PRODUCT DEFINITION ---

Generate ONE strong brand name suggestion and ONE tagline.
Build the complete brand identity system around them.
Be specific, creative, and bold.
"""

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

    print(f"[Branding Agent] ✓ Phase 1 complete.")
    print(f"[Branding Agent]   Name suggestion: {branding_output.name_suggestion.name}")
    print(f"[Branding Agent]   Tagline:         {branding_output.tagline}")
    print(f"[Branding Agent]   Status → awaiting_approval")

    completed = state.get("completed_agents") or []
    completed.append("branding")

    return {
        **state,
        "branding_output":      branding_output,
        "branding_hitl_status": "awaiting_approval",
        "completed_agents":     completed,
    }


# ── Phase 1b: Regenerate a single section ────────────────────────────────────

def regenerate_branding_section(state: AppState, section: str) -> dict:
    """
    Called by the API when the founder clicks Regenerate on a specific section.
    section: "name" | "tagline" | "colors" | "logo_direction"

    Runs the full branding agent again and extracts only the requested section.
    Returns a dict with just the updated field(s).
    """
    print(f"\n[Branding Agent] Regenerating section: {section}")

    # Run phase 1 again to get fresh output
    fresh_state = run_branding_agent(state)
    fresh_output: BrandingOutput = fresh_state.get("branding_output")

    if fresh_output is None:
        return {"error": "Regeneration failed"}

    if section == "name":
        return {"name_suggestion": fresh_output.name_suggestion.model_dump()}
    elif section == "tagline":
        return {"tagline": fresh_output.tagline}
    elif section == "colors":
        return {
            "color_palette":          [c.model_dump() for c in fresh_output.color_palette],
            "color_palette_rationale": fresh_output.color_palette_rationale,
        }
    elif section == "logo_direction":
        return {"logo_direction": fresh_output.logo_direction}
    else:
        return {"error": f"Unknown section: {section}"}


# ── Phase 2: Generate logo image ─────────────────────────────────────────────

def run_branding_logo_agent(state: AppState) -> AppState:
    """
    Phase 2. Called after founder approves in the review UI.
    Reads approved_branding_name + approved_branding_logo_direction from state.
    Generates logo via gpt-image-1-mini, uploads to Supabase Storage.
    """
    print("\n[Branding Agent] Phase 2 — generating logo image...")

    approved_name      = state.get("approved_branding_name")
    logo_direction     = state.get("approved_branding_logo_direction")
    branding_output    = state.get("branding_output")

    if not approved_name or not logo_direction:
        errors = state.get("errors") or []
        errors.append("branding_logo_agent: missing approved_name or logo_direction")
        return {**state, "errors": errors}

    # Build the image prompt
    image_prompt = (
        f"Minimalist logo for a startup called '{approved_name}'. "
        f"Design concept: {logo_direction} "
        f"Style: pure black text and shapes on a pure white background. "
        f"No gradients, no color fills, no shadows. "
        f"Clean, professional, modern wordmark or lettermark. "
        f"Would look at home next to Stripe and Linear logos. "
        f"Black ink on white background only."
    )

    openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    try:
        response = openai_client.images.generate(
            model="gpt-image-1-mini",
            prompt=image_prompt,
            size="1024x1024",
            quality="high",
            n=1,
        )

        # gpt-image-1-mini returns base64 by default
        image_data_b64 = response.data[0].b64_json
        if not image_data_b64:
            raise ValueError("No image data returned from gpt-image-1-mini")

        image_bytes = base64.b64decode(image_data_b64)

    except Exception as e:
        errors = state.get("errors") or []
        errors.append(f"branding_logo_agent: image generation failed — {e}")
        return {**state, "errors": errors}

    # Upload to Supabase Storage
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        file_name = f"{approved_name.lower().replace(' ', '-')}-{uuid.uuid4().hex[:8]}.png"
        file_path = f"logos/{file_name}"

        supabase.storage.from_(LOGO_BUCKET).upload(
            path=file_path,
            file=image_bytes,
            file_options={"content-type": "image/png"}
        )

        # Get public URL
        public_url = supabase.storage.from_(LOGO_BUCKET).get_public_url(file_path)

    except Exception as e:
        errors = state.get("errors") or []
        errors.append(f"branding_logo_agent: Supabase upload failed — {e}")
        return {**state, "errors": errors}

    # Write URL back into branding_output so the frontend sees it
    if branding_output:
        branding_output.logo_image_url = public_url

    print(f"[Branding Agent] ✓ Logo generated and uploaded: {public_url}")

    return {
        **state,
        "branding_output":   branding_output,
        "branding_logo_url": public_url,
    }