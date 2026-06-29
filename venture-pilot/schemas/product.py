"""
schemas/product.py — Output contract for the Product Agent.

Consumed by:
  - branding.py  → uses core_features, usp
                   (brand identity must reflect what the product actually does)
  - finance.py   → uses monetization_model, pricing_recommendation
                   (revenue projections need a real pricing model)
  - gtm.py       → uses core_features, mvp_scope, usp
                   (what to market, what to demo, what the hook is)
  - pitch.py     → uses everything
                   (product slide: what we built, why, roadmap)
"""

from pydantic import BaseModel, Field
from typing import List
from enum import Enum


class Priority(str, Enum):
    MUST_HAVE  = "Must Have"   # MVP is incomplete without this
    SHOULD_HAVE = "Should Have" # important but not day-1
    NICE_TO_HAVE = "Nice to Have" # future roadmap


class MonetizationModel(str, Enum):
    FREEMIUM       = "Freemium"
    SUBSCRIPTION   = "Subscription"
    PAY_PER_USE    = "Pay-per-use"
    ONE_TIME       = "One-time purchase"
    MARKETPLACE_FEE = "Marketplace fee"
    ENTERPRISE     = "Enterprise licensing"
    AD_SUPPORTED   = "Ad-supported"


class Feature(BaseModel):
    """A single product feature."""
    name: str = Field(description="Short feature name. e.g. 'Auto invoice reminders'")
    description: str = Field(description="One sentence on what this does for the user.")
    priority: Priority = Field(description="Must Have / Should Have / Nice to Have")
    solves_pain: str = Field(
        description="Which specific pain point from research does this address?"
    )


class RoadmapPhase(BaseModel):
    """A single phase in the product roadmap."""
    phase: str = Field(description="e.g. 'Phase 1 — MVP', 'Phase 2 — Growth'")
    timeline: str = Field(description="e.g. '0-3 months', '3-6 months'")
    deliverables: List[str] = Field(
        description="2 to 4 concrete things shipped in this phase.",
        min_length=2,
        max_length=4
    )


class ProductOutput(BaseModel):

    # ── CORE IDENTITY ────────────────────────────────────────────────────────

    usp: str = Field(
        description=(
            "Unique Selling Proposition — one sentence on what makes this "
            "product different from every competitor. "
            "e.g. 'The only invoicing tool built for WhatsApp-first freelancers.'"
        )
    )

    # ── MVP SCOPE ────────────────────────────────────────────────────────────
    mvp_scope: str = Field(
        description=(
            "What is the absolute minimum the product needs to solve the core problem? "
            "2-3 sentences. This is what you build in month 1-3."
        )
    )

    core_features: List[Feature] = Field(
        description=(
            "5 to 8 features. Must include both Must Have and Should Have items. "
            "Each feature must trace back to a real pain point."
        ),
        min_length=5,
        max_length=8
    )

    # ── TECH ─────────────────────────────────────────────────────────────────
    suggested_tech_stack: List[str] = Field(
        description=(
            "Recommended tech stack for building this. "
            "Be practical — match the budget and team size. "
            "e.g. ['Next.js', 'FastAPI', 'PostgreSQL', 'Razorpay', 'Vercel']"
        ),
        min_length=3,
        max_length=8
    )

    # ── MONETIZATION ─────────────────────────────────────────────────────────
    monetization_model: MonetizationModel = Field(
        description="Primary way the product makes money."
    )

    # ── ROADMAP ──────────────────────────────────────────────────────────────
    roadmap: List[RoadmapPhase] = Field(
        description="3-phase roadmap covering 0 to 12 months.",
        min_length=3,
        max_length=3
    )

    # ── RISKS ────────────────────────────────────────────────────────────────
    product_risks: List[str] = Field(
        description=(
            "2 to 3 real product/technical risks. "
            "e.g. 'Payment gateway integration complexity for Indian banks' or "
            "'User adoption barrier — freelancers resist new tools.'"
        ),
        min_length=2,
        max_length=3
    )