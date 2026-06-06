"""
schemas/pitch.py — Output contract for the Pitch Agent.

The pitch agent is the SYNTHESIS agent — it consumes every prior agent's
output and distills it into a complete, investor-ready pitch deck narrative.

Each field maps to exactly one slide in the deck.
The report agent will take this schema and render it into a real .pptx file.

Standard pitch deck order (YC / Sequoia format):
  Slide 01 → Cover
  Slide 02 → Problem
  Slide 03 → Solution
  Slide 04 → Product (Demo / Features)
  Slide 05 → Market Size
  Slide 06 → Business Model
  Slide 07 → Traction (or Validation)
  Slide 08 → Competition
  Slide 09 → Go-To-Market
  Slide 10 → Team
  Slide 11 → Financials
  Slide 12 → The Ask

Consumed by:
  - report.py → renders each slide field into actual PPTX slides
"""

from pydantic import BaseModel, Field
from typing import List
from enum import Enum


# ─────────────────────────────────────────────────────────────────────────────
# SUPPORTING MODELS
# ─────────────────────────────────────────────────────────────────────────────

class SlideType(str, Enum):
    COVER        = "Cover"
    PROBLEM      = "Problem"
    SOLUTION     = "Solution"
    PRODUCT      = "Product"
    MARKET       = "Market Size"
    BUSINESS     = "Business Model"
    TRACTION     = "Traction & Validation"
    COMPETITION  = "Competition"
    GTM          = "Go-To-Market"
    TEAM         = "Team"
    FINANCIALS   = "Financials"
    ASK          = "The Ask"


class BulletPoint(BaseModel):
    """A single slide bullet — headline + one supporting line."""
    headline: str = Field(
        description=(
            "The bold claim or key point. Short, punchy, max 10 words. "
            "e.g. '₹2.3L lost per freelancer per year to late payments'"
        )
    )
    supporting: str = Field(
        description=(
            "One sentence that backs up the headline with evidence or context. "
            "e.g. 'Average Indian freelancer has 3.2 overdue invoices at any time — Payoneer 2024'"
        )
    )


class CompetitorMatrixRow(BaseModel):
    """One row in the competitor comparison matrix."""
    competitor_name: str = Field(description="Competitor name or 'Us' for the startup.")
    whatsapp_native: bool
    gst_compliant: bool
    auto_reminders: bool
    freelancer_focused: bool
    affordable_inr: bool
    is_us: bool = Field(description="True only for the startup's own row.")


class FinancialSnapshot(BaseModel):
    """Key numbers pulled from finance agent for the financials slide."""
    arr_month_12: str = Field(description="ARR at Month 12 formatted. e.g. '₹18.6L ARR'")
    mrr_month_12: str = Field(description="MRR at Month 12. e.g. '₹1.55L MRR'")
    paid_users_month_12: str = Field(description="e.g. '312 paying users'")
    break_even_month: str = Field(description="e.g. 'Month 8'")
    ltv_cac: str = Field(description="e.g. '4.2:1 LTV:CAC'")
    gross_margin: str = Field(description="e.g. '78% gross margin'")
    runway: str = Field(description="e.g. '14 months runway'")
    raise_amount: str = Field(description="e.g. '$150,000 pre-seed'")


# ─────────────────────────────────────────────────────────────────────────────
# SLIDE MODELS — one per slide
# ─────────────────────────────────────────────────────────────────────────────

class CoverSlide(BaseModel):
    slide_number: int = Field(default=1)
    slide_type: SlideType = Field(default=SlideType.COVER)
    startup_name: str = Field(description="The recommended brand name. e.g. 'InvoiceZap'")
    tagline: str = Field(description="The recommended tagline. e.g. 'Get paid. On time. Every time.'")
    one_liner: str = Field(
        description=(
            "One sentence that captures the entire business. "
            "e.g. 'WhatsApp-native invoicing for Indian freelancers — "
            "so they get paid on time without chasing clients.'"
        )
    )
    presenter_note: str = Field(
        description=(
            "What the founder says when this slide is shown. 2-3 sentences. "
            "Sets the stage before diving into problem."
        )
    )


class ProblemSlide(BaseModel):
    slide_number: int = Field(default=2)
    slide_type: SlideType = Field(default=SlideType.PROBLEM)
    headline: str = Field(
        description=(
            "The slide headline — the problem in one punchy line. "
            "e.g. 'Indian freelancers lose months of income waiting to get paid.'"
        )
    )
    pain_points: List[BulletPoint] = Field(
        description=(
            "3 pain points. Each must be specific and data-backed if possible. "
            "Together they tell a story of escalating frustration."
        ),
        min_length=3,
        max_length=3
    )
    emotional_hook: str = Field(
        description=(
            "One closing line that makes the investor FEEL the problem. "
            "e.g. 'Every freelancer in India knows this feeling. "
            "We are building the tool that ends it.'"
        )
    )
    presenter_note: str = Field(description="What the founder says on this slide. 3-4 sentences.")


class SolutionSlide(BaseModel):
    slide_number: int = Field(default=3)
    slide_type: SlideType = Field(default=SlideType.SOLUTION)
    headline: str = Field(
        description=(
            "The solution headline. Mirror the problem headline structure. "
            "e.g. 'InvoiceZap: Send via WhatsApp. Get paid automatically.'"
        )
    )
    solution_bullets: List[BulletPoint] = Field(
        description=(
            "3 solution points that directly answer the 3 pain points from the problem slide. "
            "One-to-one mapping — each bullet kills one pain."
        ),
        min_length=3,
        max_length=3
    )
    aha_moment: str = Field(
        description=(
            "The single sentence that captures the magic of the product. "
            "e.g. 'You send one invoice. We follow up until it is paid — "
            "via WhatsApp, automatically, in the client's language.'"
        )
    )
    presenter_note: str = Field(description="What the founder says. Should reference the demo.")


class ProductSlide(BaseModel):
    slide_number: int = Field(default=4)
    slide_type: SlideType = Field(default=SlideType.PRODUCT)
    headline: str = Field(description="e.g. 'Built for how India works — WhatsApp first, GST ready'")
    core_features: List[str] = Field(
        description=(
            "4 must-have features phrased as user outcomes, not technical specs. "
            "e.g. 'Invoice in 60 seconds — GST-compliant, no accounting knowledge needed'"
        ),
        min_length=4,
        max_length=4
    )
    demo_flow: str = Field(
        description=(
            "A 3-step walkthrough of the core user flow as it would be shown in a demo. "
            "e.g. 'Step 1: Type client name + amount → Step 2: Hit Send on WhatsApp → "
            "Step 3: InvoiceZap follows up automatically until paid'"
        )
    )
    tech_differentiator: str = Field(
        description=(
            "One sentence on the technical moat or key technical decision. "
            "e.g. 'Built on WhatsApp Business API + Razorpay — "
            "the only combination that works natively for Indian payment rails.'"
        )
    )
    presenter_note: str = Field(description="What the founder says. Transition to market slide.")


class MarketSlide(BaseModel):
    slide_number: int = Field(default=5)
    slide_type: SlideType = Field(default=SlideType.MARKET)
    headline: str = Field(description="e.g. 'A $4.5B global market, underpenetrated in India'")
    tam: str = Field(description="Total Addressable Market with number + source context.")
    sam: str = Field(description="Serviceable Addressable Market — who you can realistically reach.")
    som: str = Field(description="Serviceable Obtainable Market — Year 1 realistic target.")
    market_tailwinds: List[str] = Field(
        description=(
            "3 macro trends that make NOW the right time. "
            "e.g. 'India freelance economy growing 20% YoY', "
            "'UPI making digital payments mainstream', "
            "'GST compliance driving need for digital invoices'"
        ),
        min_length=3,
        max_length=3
    )
    presenter_note: str = Field(description="What the founder says. Keep it concise — numbers do the talking.")


class BusinessModelSlide(BaseModel):
    slide_number: int = Field(default=6)
    slide_type: SlideType = Field(default=SlideType.BUSINESS)
    headline: str = Field(description="e.g. 'Freemium SaaS — free to start, paid to grow'")
    model_description: str = Field(
        description=(
            "2-3 sentences explaining how the business makes money. "
            "Simple enough for a non-technical investor."
        )
    )
    pricing_tiers: List[str] = Field(
        description=(
            "2-3 pricing tiers as simple one-liners. "
            "e.g. 'Free — 3 invoices/month (acquisition)', "
            "'Pro ₹499/month — unlimited + reminders (core revenue)', "
            "'Business ₹999/month — team + analytics (expansion)'"
        ),
        min_length=2,
        max_length=3
    )
    unit_economics: List[str] = Field(
        description=(
            "3 key unit economics bullets. "
            "e.g. 'ARPU: ₹580/month', 'LTV:CAC = 4.2:1', 'Payback: 6 months'"
        ),
        min_length=3,
        max_length=3
    )
    presenter_note: str = Field(description="What the founder says. Emphasise the LTV:CAC ratio.")


class TractionSlide(BaseModel):
    slide_number: int = Field(default=7)
    slide_type: SlideType = Field(default=SlideType.TRACTION)
    headline: str = Field(description="e.g. 'Early signal: 200 waitlist signups in 2 weeks with $0 spend'")
    traction_points: List[BulletPoint] = Field(
        description=(
            "3-4 traction or validation points. "
            "If pre-launch: waitlist, user interviews, LOIs, pilot users, partnerships. "
            "If post-launch: MRR, users, retention, NPS. "
            "Be honest — investors respect intellectual honesty over fake traction."
        ),
        min_length=3,
        max_length=4
    )
    validation_quote: str = Field(
        description=(
            "A real or representative user quote that captures the value. "
            "e.g. '\"I used to spend every Sunday chasing payments. "
            "InvoiceZap does it while I sleep.\" — Beta user, Freelance Designer, Bangalore'"
        )
    )
    next_milestones: List[str] = Field(
        description=(
            "3 near-term milestones that show momentum. "
            "e.g. '100 paying users by Month 4', 'WhatsApp API approval (in progress)', "
            "'Partnership with Internshala (in discussion)'"
        ),
        min_length=3,
        max_length=3
    )
    presenter_note: str = Field(description="What the founder says. Be candid about where you are.")


class CompetitionSlide(BaseModel):
    slide_number: int = Field(default=8)
    slide_type: SlideType = Field(default=SlideType.COMPETITION)
    headline: str = Field(
        description=(
            "e.g. 'Existing tools are built for accountants. We are built for freelancers.'"
        )
    )
    competitor_matrix: List[CompetitorMatrixRow] = Field(
        description=(
            "4-5 rows: 3-4 real competitors + 1 row for 'Us'. "
            "The startup's row should show TRUE for every column. "
            "This is the classic feature comparison matrix."
        ),
        min_length=4,
        max_length=5
    )
    our_moat: str = Field(
        description=(
            "One sentence on the defensible advantage. "
            "e.g. 'Network effect: every WhatsApp invoice sent is a brand impression "
            "to a new potential user (the client).'"
        )
    )
    presenter_note: str = Field(
        description=(
            "What the founder says. Acknowledge competitors are good products — "
            "then explain why the gap still exists."
        )
    )


class GTMSlide(BaseModel):
    slide_number: int = Field(default=9)
    slide_type: SlideType = Field(default=SlideType.GTM)
    headline: str = Field(description="e.g. 'Start manual. Scale with product. Grow with community.'")
    phase_1: str = Field(
        description=(
            "How to get first 100 users — one punchy sentence. "
            "e.g. 'Manual outreach to 500 freelancers in LinkedIn + WhatsApp groups — "
            "founder does it personally'"
        )
    )
    phase_2: str = Field(
        description=(
            "How to go from 100 to 1K users. "
            "e.g. 'Content flywheel: freelancer finance tips on LinkedIn + referral programme'"
        )
    )
    phase_3: str = Field(
        description=(
            "How to scale to 10K+ users. "
            "e.g. 'Platform partnerships (Internshala, Fiverr India) + paid acquisition "
            "once LTV:CAC is proven'"
        )
    )
    primary_channels: List[str] = Field(
        description="2-3 primary acquisition channels as brief bullets.",
        min_length=2,
        max_length=3
    )
    north_star: str = Field(
        description=(
            "The north star metric shown on the slide. "
            "e.g. 'North Star: Invoices paid within 7 days of sending'"
        )
    )
    presenter_note: str = Field(description="What the founder says. Show you've thought about distribution.")


class TeamSlide(BaseModel):
    slide_number: int = Field(default=10)
    slide_type: SlideType = Field(default=SlideType.TEAM)
    headline: str = Field(description="e.g. 'Built by people who lived the problem'")
    why_us: str = Field(
        description=(
            "2-3 sentences on why THIS team is uniquely positioned to win this market. "
            "Connects founders' background to the specific problem. "
            "e.g. 'Our founder freelanced for 4 years and lost ₹80,000 to late payments. "
            "Our CTO built payment infrastructure at Razorpay. "
            "We are not guessing at this problem — we lived it.'"
        )
    )
    key_hires_needed: List[str] = Field(
        description=(
            "2-3 key roles to hire with the raised capital. "
            "e.g. 'Full-stack engineer (Next.js + FastAPI)', "
            "'Growth marketer with freelancer community experience'"
        ),
        min_length=2,
        max_length=3
    )
    advisors_or_supporters: str = Field(
        description=(
            "Any advisors, accelerators, or notable supporters. "
            "If none yet: 'Seeking advisors with payments and creator economy experience.' "
            "Never fabricate names."
        )
    )
    presenter_note: str = Field(description="What the founder says. Personal and authentic.")


class FinancialsSlide(BaseModel):
    slide_number: int = Field(default=11)
    slide_type: SlideType = Field(default=SlideType.FINANCIALS)
    headline: str = Field(description="e.g. 'Path to ₹18L ARR by Month 12 — break-even at Month 8'")
    snapshot: FinancialSnapshot = Field(
        description="Key financial numbers pulled from the finance agent."
    )
    projection_narrative: str = Field(
        description=(
            "2-3 sentences walking through the financial story. "
            "e.g. 'We start lean: ₹25K/month burn, bootstrapped. "
            "By Month 4 we have 50 paying users. By Month 8 we break even. "
            "Month 12: ₹1.55L MRR, 312 paid users, 78% gross margin.'"
        )
    )
    key_assumptions: List[str] = Field(
        description=(
            "3 most important assumptions underlying the model. "
            "e.g. '8% free-to-paid conversion', '3% monthly churn', "
            "'₹800 CAC via community channels'"
        ),
        min_length=3,
        max_length=3
    )
    presenter_note: str = Field(
        description=(
            "What the founder says. Acknowledge this is a model — "
            "show you understand the levers."
        )
    )


class AskSlide(BaseModel):
    slide_number: int = Field(default=12)
    slide_type: SlideType = Field(default=SlideType.ASK)
    headline: str = Field(
        description=(
            "The ask headline. Bold and specific. "
            "e.g. 'We are raising $150,000 pre-seed to reach 500 paying users'"
        )
    )
    raise_amount: str = Field(description="How much and what type. e.g. '$150,000 pre-seed'")
    use_of_funds: List[str] = Field(
        description=(
            "4 specific use-of-funds line items with percentages. "
            "e.g. 'Product & engineering (40%) — ₹60K', "
            "'Marketing & community (30%) — ₹45K'"
        ),
        min_length=4,
        max_length=4
    )
    milestones_unlocked: List[str] = Field(
        description=(
            "3 milestones this raise enables. "
            "e.g. '500 paying users by Month 9', "
            "'MRR of ₹2.5L by Month 12', "
            "'Series A ready by end of Year 1'"
        ),
        min_length=3,
        max_length=3
    )
    closing_line: str = Field(
        description=(
            "The final line of the pitch — the call to action. "
            "Memorable, confident, direct. "
            "e.g. '47 million freelancers in India are waiting to get paid on time. "
            "We are building the tool that makes that happen. Let us do it together.'"
        )
    )
    presenter_note: str = Field(
        description="What the founder says. Pause after the closing line. Let it land."
    )


# ─────────────────────────────────────────────────────────────────────────────
# ROOT OUTPUT MODEL
# ─────────────────────────────────────────────────────────────────────────────

class PitchOutput(BaseModel):
    """
    Complete pitch deck — 12 slides.
    Each field is one slide, in presentation order.
    The report agent maps each slide directly to a PPTX slide.
    """

    # ── DECK META ────────────────────────────────────────────────────────────
    deck_title: str = Field(
        description="File name for the deck. e.g. 'InvoiceZap — Investor Pitch Deck 2025'"
    )
    total_slides: int = Field(default=12)
    recommended_duration: str = Field(
        description="e.g. '12 minutes — 1 minute per slide, 5 min Q&A'"
    )
    pitch_narrative_summary: str = Field(
        description=(
            "A 4-5 sentence summary of the full pitch story arc. "
            "Problem → Solution → Market → Why us → Ask. "
            "This is the investor memo version — dense, complete, standalone."
        )
    )

    # ── SLIDES (in order) ────────────────────────────────────────────────────
    slide_01_cover:         CoverSlide
    slide_02_problem:       ProblemSlide
    slide_03_solution:      SolutionSlide
    slide_04_product:       ProductSlide
    slide_05_market:        MarketSlide
    slide_06_business:      BusinessModelSlide
    slide_07_traction:      TractionSlide
    slide_08_competition:   CompetitionSlide
    slide_09_gtm:           GTMSlide
    slide_10_team:          TeamSlide
    slide_11_financials:    FinancialsSlide
    slide_12_ask:           AskSlide

    # ── INVESTOR NOTES ───────────────────────────────────────────────────────
    hardest_questions: List[str] = Field(
        description=(
            "5 hardest questions an investor will ask, with suggested answers. "
            "Format each as 'Q: ... → A: ...'. "
            "Be honest — if the answer is 'we don't know yet', say so and explain how you'll find out."
        ),
        min_length=5,
        max_length=5
    )

    email_follow_up: str = Field(
        description=(
            "The follow-up email to send after the pitch meeting. "
            "Subject line + 5-7 sentence body. "
            "Recaps the ask, attaches the deck, opens the door for due diligence."
        )
    )