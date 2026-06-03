# from pydantic import BaseModel
# from typing import List

# class MarketResearchOutput(BaseModel):
#     problem_statement: str          # crisp 2-3 line problem definition
#     target_audience: str            # who exactly suffers from this
#     market_size: str                # TAM / SAM / SOM estimates
#     market_trends: List[str]        # 4-6 bullet trends
#     pain_points: List[str]          # top 4-5 user pain points
#     opportunity_gap: str            # what's missing in the market
#     key_assumptions: List[str]      # things to validate
#     sources: List[str]              # URLs used
    

"""
schemas/research.py — Output contract for the Research Agent.

This is a Pydantic model. It does two things:
  1. Forces the LLM output to match this exact shape (via structured output)
  2. Acts as documentation — every other agent knows exactly what
     research gives them

Other agents that consume this:
  - competitor.py  → uses market_size, opportunity_gap
  - product.py     → uses pain_points, target_audience
  - branding.py    → uses target_audience, opportunity_gap
  - finance.py     → uses market_size, market_trends
  - gtm.py         → uses target_audience, pain_points, market_trends
  - pitch.py       → uses everything
"""

from pydantic import BaseModel, Field
from typing import List


class MarketResearchOutput(BaseModel):

    # ── CORE PROBLEM ────────────────────────────────────────────────────────
    problem_statement: str = Field(
        description="A crisp 2-3 line definition of the problem being solved."
    )

    target_audience: str = Field(
        description=(
            "Specific description of who faces this problem. "
            "Include demographics, geography, behavior if possible. "
            "e.g. 'Freelance designers in India aged 22-35 who struggle "
            "with late payments from clients.'"
        )
    )

    # ── MARKET SIZE ─────────────────────────────────────────────────────────
    market_size: str = Field(
        description=(
            "TAM, SAM, and SOM estimates with source context. "
            "e.g. 'Global invoicing software TAM is $4.5B (2024). "
            "Indian SMB segment (SAM) ~$300M. Realistic SOM in year 1: $500K.'"
        )
    )

    # ── TRENDS & PAIN ────────────────────────────────────────────────────────
    market_trends: List[str] = Field(
        description="4 to 6 current trends shaping this market.",
        min_length=4,
        max_length=6
    )

    pain_points: List[str] = Field(
        description="Top 4 to 5 specific pain points of the target audience.",
        min_length=4,
        max_length=5
    )

    # ── OPPORTUNITY ──────────────────────────────────────────────────────────
    opportunity_gap: str = Field(
        description=(
            "What is missing in the current market that this idea can fill? "
            "Be specific — not just 'no good solution exists' but WHY."
        )
    )

    # ── VALIDATION ───────────────────────────────────────────────────────────
    key_assumptions: List[str] = Field(
        description=(
            "3 to 5 assumptions this idea is based on that need validation. "
            "e.g. 'Freelancers are willing to pay $10/month for automation.'"
        ),
        min_length=3,
        max_length=5
    )

    # ── SOURCES ──────────────────────────────────────────────────────────────
    sources: List[str] = Field(
        description="List of URLs or source names used to gather this data."
    )