"""
schemas/planner.py — Output contract for the Planner Agent.

Planner takes raw messy user input and normalizes it into
clean, reliable fields that every downstream agent can trust.

Consumed by:
  - state.py         → planner_output slot
  - research.py      → reads idea, industry, target_market, budget
  - ALL agents       → indirectly, since research feeds everything
"""

from pydantic import BaseModel, Field
from typing import List
from enum import Enum


class StartupStage(str, Enum):
    IDEA       = "idea"        # just a concept, nothing built
    VALIDATION = "validation"  # testing if anyone wants it
    MVP        = "mvp"         # something basic is built
    SCALING    = "scaling"     # product exists, growing users


class StartupType(str, Enum):
    SAAS        = "SaaS"
    MARKETPLACE = "Marketplace"
    B2B         = "B2B"
    B2C         = "B2C"
    D2C         = "D2C"
    ECOMMERCE   = "E-commerce"
    FINTECH     = "Fintech"
    EDTECH      = "Edtech"
    HEALTHTECH  = "Healthtech"
    OTHER       = "Other"


class PlannerOutput(BaseModel):

    # ── CLEANED INPUTS ───────────────────────────────────────────────────────
    refined_idea: str = Field(
        description=(
            "The startup idea rewritten as a clear 1-sentence value proposition. "
            "Format: '[Product] helps [target] to [outcome] by [mechanism].' "
            "e.g. 'InvoiceZap helps Indian freelancers get paid on time by automating "
            "invoice reminders and follow-ups.'"
        )
    )

    industry: str = Field(
        description=(
            "Clean, specific industry label. "
            "e.g. 'Fintech - Invoice Management', 'Edtech - K12', 'SaaS - HR Tools'. "
            "Not too broad (not just 'tech'), not too narrow."
        )
    )

    target_market: str = Field(
        description=(
            "Specific target audience with demographics. "
            "e.g. 'Freelance designers and developers in India, aged 22-35, "
            "earning ₹3-15L/year, working with 3+ clients simultaneously.'"
        )
    )

    startup_type: StartupType = Field(
        description="The business model type that best fits this idea."
    )

    stage: StartupStage = Field(
        description="Current stage of the startup based on user input."
    )

    budget: str = Field(
        description=(
            "Cleaned budget string with context. "
            "e.g. '$5,000 — early bootstrapped, pre-revenue' or "
            "'$50,000 — seed funding available'."
        )
    )

    # ── STRATEGIC CONTEXT ────────────────────────────────────────────────────
    one_liner: str = Field(
        description=(
            "A punchy investor-style one-liner for this startup. "
            "e.g. 'Stripe for freelancer invoicing in emerging markets.'"
        )
    )

    core_problem: str = Field(
        description="One crisp sentence — what exact problem does this solve?"
    )

    unique_angle: str = Field(
        description=(
            "What is the one thing that could make this idea different? "
            "Not a feature list — one strategic angle. "
            "e.g. 'WhatsApp-native invoicing, no app download needed.'"
        )
    )

    # ── SCOPE ────────────────────────────────────────────────────────────────
    geography: str = Field(
        description=(
            "Primary geographic focus for launch. "
            "e.g. 'India — Tier 1 and Tier 2 cities initially.'"
        )
    )

    agents_to_run: List[str] = Field(
        description=(
            "Ordered list of agents that should run for this idea. "
            "Always include all: ['research', 'competitor', 'product', "
            "'branding', 'finance', 'gtm', 'pitch', 'report']"
        )
    )