"""
schemas/competitor.py — Output contract for the Competitor Agent.

Consumed by:
  - branding.py  → uses competitor_names, gaps, differentiators
                   (to position the brand AGAINST the market)
  - product.py   → uses feature_gaps
                   (to decide what MVP must have that others don't)
  - gtm.py       → uses pricing_landscape, market_leader
                   (to craft positioning and messaging)
  - pitch.py     → uses everything
                   (investor slide: "why us vs them")
"""

from pydantic import BaseModel, Field
from typing import List


class Competitor(BaseModel):
    """A single competitor entry."""

    name: str = Field(description="Company or product name.")

    description: str = Field(
        description="One sentence — what do they do and who is their primary customer?"
    )

    strengths: List[str] = Field(
        description="2 to 3 things they do really well.",
        min_length=2,
        max_length=3
    )

    weaknesses: List[str] = Field(
        description="2 to 3 genuine weaknesses or gaps in their offering.",
        min_length=2,
        max_length=3
    )

    pricing: str = Field(
        description=(
            "Their pricing model and rough range. "
            "e.g. 'Freemium — paid plans from $12/month' or 'Enterprise only, ~$500/month'."
        )
    )

    target_segment: str = Field(
        description="Who is their primary customer? Be specific."
    )


class CompetitorOutput(BaseModel):

    # ── COMPETITOR LIST ──────────────────────────────────────────────────────
    competitors: List[Competitor] = Field(
        description=(
            "3 to 5 real competitors. Mix of direct (same solution) "
            "and indirect (different solution, same problem). "
            "Must be real companies, not hypothetical."
        ),
        min_length=3,
        max_length=5
    )

    # ── MARKET LANDSCAPE ─────────────────────────────────────────────────────
    market_leader: str = Field(
        description=(
            "Name of the dominant player in this space right now and "
            "one sentence on why they lead."
        )
    )

    pricing_landscape: str = Field(
        description=(
            "Summary of how pricing works across the market. "
            "e.g. 'Most tools charge $10-50/month per user. "
            "Enterprise players charge $200+. No strong free tier exists.'"
        )
    )

    # ── GAPS & OPPORTUNITIES ─────────────────────────────────────────────────
    feature_gaps: List[str] = Field(
        description=(
            "3 to 5 features or capabilities that NO competitor does well. "
            "These are the gaps the startup can fill. Be specific — not "
            "'better UX' but 'none support WhatsApp-based invoice delivery'."
        ),
        min_length=3,
        max_length=5
    )

    underserved_segments: List[str] = Field(
        description=(
            "2 to 3 customer segments that existing competitors ignore or serve poorly. "
            "e.g. 'Freelancers in Tier-2 Indian cities with no GST knowledge.'"
        ),
        min_length=2,
        max_length=3
    )

    # ── MOAT SUGGESTIONS ─────────────────────────────────────────────────────
    suggested_differentiators: List[str] = Field(
        description=(
            "3 specific ways the startup could differentiate from all listed competitors. "
            "These feed directly into branding and product decisions."
        ),
        min_length=3,
        max_length=3
    )

    # ── SOURCES ──────────────────────────────────────────────────────────────
    sources: List[str] = Field(
        description="URLs or source names used to find competitor data."
    )