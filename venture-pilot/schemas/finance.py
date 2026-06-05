"""
schemas/finance.py — Output contract for the Finance Agent.

Acts like a startup CFO doing the first financial model.
Every number here is grounded in the product's pricing + market size.

Consumed by:
  - pitch.py    → uses projections, saas_metrics, fundraising
                  (financial slide + ask slide in the deck)
  - report.py   → uses everything
                  (full finance chapter)
"""

from pydantic import BaseModel, Field
from typing import List
from enum import Enum


class FundraisingStage(str, Enum):
    BOOTSTRAPPED  = "Bootstrapped"
    PRE_SEED      = "Pre-Seed"
    SEED          = "Seed"
    SERIES_A      = "Series A"
    NOT_REQUIRED  = "Not Required"


class PricingTier(BaseModel):
    """A single pricing tier with unit economics."""
    name: str = Field(description="Tier name. e.g. 'Free', 'Pro', 'Business'")
    price_monthly: float = Field(description="Monthly price in the product's currency. 0 for free.")
    price_annually: float = Field(description="Annual price (usually 15-20% discount). 0 for free.")
    currency: str = Field(description="Currency symbol. e.g. '₹', '$', '€'")
    features_included: List[str] = Field(
        description="2-4 key features in this tier.",
        min_length=2,
        max_length=4
    )
    target_user: str = Field(description="Who this tier is designed for.")
    conversion_assumption: str = Field(
        description=(
            "Assumed conversion rate from free/lower tier. "
            "e.g. '8% of free users convert to Pro within 60 days'"
        )
    )


class MonthlyProjection(BaseModel):
    """Revenue projection for a single month."""
    month: int = Field(description="Month number. 1 = first month of operation.")
    users_free: int = Field(description="Total free tier users at end of month.")
    users_paid: int = Field(description="Total paying users at end of month.")
    mrr: float = Field(description="Monthly Recurring Revenue at end of month.")
    revenue: float = Field(description="Total revenue collected this month.")
    expenses: float = Field(description="Total expenses this month.")
    net_cashflow: float = Field(description="Revenue minus expenses this month.")
    cumulative_cash: float = Field(description="Running cash balance (starting from initial budget).")


class SaaSMetrics(BaseModel):
    """Key SaaS health metrics — calculated at Month 12."""
    arr: float = Field(description="Annual Recurring Revenue at Month 12 (MRR × 12).")
    mrr_month_12: float = Field(description="MRR at the end of Month 12.")
    mrr_month_1: float = Field(description="MRR at the end of Month 1 (baseline).")
    mrr_growth_rate: str = Field(
        description=(
            "Average month-over-month MRR growth rate. "
            "e.g. '18% MoM in months 1-6, tapering to 12% in months 7-12'"
        )
    )
    churn_rate_assumed: str = Field(
        description=(
            "Monthly churn rate assumption used in the model. "
            "e.g. '3% monthly churn (industry avg for SMB SaaS is 3-7%)'"
        )
    )
    ltv: float = Field(
        description=(
            "Lifetime Value of a paid customer in currency. "
            "Formula: ARPU / Monthly Churn Rate"
        )
    )
    cac: float = Field(
        description=(
            "Customer Acquisition Cost estimate. "
            "Total estimated marketing spend ÷ new customers acquired."
        )
    )
    ltv_cac_ratio: str = Field(
        description=(
            "LTV:CAC ratio with interpretation. "
            "e.g. '4.2:1 — healthy (anything above 3:1 is good for SaaS)'"
        )
    )
    payback_period_months: float = Field(
        description=(
            "Months to recover CAC from a customer. "
            "Formula: CAC / (ARPU × Gross Margin). "
            "Target: under 12 months for healthy SaaS."
        )
    )
    gross_margin: str = Field(
        description=(
            "Estimated gross margin percentage. "
            "e.g. '78% — typical for SaaS (cloud hosting + payment fees as COGS)'"
        )
    )
    arpu: float = Field(
        description="Average Revenue Per User (paid) per month."
    )
    nps_target: str = Field(
        description=(
            "Target NPS score with rationale. "
            "e.g. 'Target NPS > 40 in Year 1 — product-led growth only works with strong word-of-mouth'"
        )
    )


class RunwayAnalysis(BaseModel):
    """Cash runway calculation."""
    initial_capital: float = Field(description="Starting capital in currency.")
    monthly_burn_rate: float = Field(description="Average monthly expenses in the first 6 months.")
    break_even_month: int = Field(
        description="Month number when monthly revenue >= monthly expenses."
    )
    runway_months: float = Field(
        description=(
            "How many months of runway at current burn before cash runs out "
            "(assuming zero revenue). This is the worst case."
        )
    )
    runway_with_revenue_months: float = Field(
        description=(
            "More realistic runway when projected revenue is factored in."
        )
    )
    cash_at_month_12: float = Field(description="Projected cash balance at end of Month 12.")
    burn_rate_breakdown: List[str] = Field(
        description=(
            "4-6 specific expense line items with monthly amounts. "
            "e.g. 'Cloud infra (AWS/GCP): ₹8,000/month', "
            "'WhatsApp Business API: ₹5,000/month', "
            "'Founder salary: ₹0 (deferred)'"
        ),
        min_length=4,
        max_length=6
    )


class FundraisingRecommendation(BaseModel):
    """Fundraising strategy and pitch."""
    recommended_stage: FundraisingStage = Field(
        description="The fundraising stage most appropriate for this startup right now."
    )
    raise_amount: str = Field(
        description=(
            "How much to raise and in what currency. "
            "e.g. '$150,000 pre-seed' or '₹50L seed round'"
        )
    )
    use_of_funds: List[str] = Field(
        description=(
            "4-5 specific line items for how the raised capital will be deployed. "
            "e.g. 'Product development (40%): ₹20L', "
            "'Marketing & user acquisition (30%): ₹15L'"
        ),
        min_length=4,
        max_length=5
    )
    target_investors: List[str] = Field(
        description=(
            "3-4 specific investor types or named funds that invest at this stage "
            "and in this space. "
            "e.g. 'Sequoia Surge (India early-stage)', "
            "'India Quotient (consumer tech, India-first)'"
        ),
        min_length=3,
        max_length=4
    )
    valuation_rationale: str = Field(
        description=(
            "How to think about valuation at this stage. "
            "e.g. 'Pre-revenue pre-seed: value based on team + market size. "
            "Target $1-2M post-money valuation giving investors 10-15% equity.'"
        )
    )
    fundraising_readiness: List[str] = Field(
        description=(
            "3-4 milestones to hit BEFORE approaching investors. "
            "e.g. '100 active free users', 'First 10 paying customers', "
            "'MRR of ₹50,000'"
        ),
        min_length=3,
        max_length=4
    )
    alternative_if_no_funding: str = Field(
        description=(
            "A clear path to profitability without external funding. "
            "e.g. 'Reach break-even at Month 8 with 200 Pro users. "
            "Reinvest profits into paid acquisition from Month 9.'"
        )
    )


class UnitEconomicsScenario(BaseModel):
    """Best / base / worst case scenario."""
    scenario: str = Field(description="'Best Case', 'Base Case', or 'Worst Case'")
    assumption: str = Field(description="Key assumption driving this scenario.")
    paid_users_month_12: int = Field(description="Paid users at Month 12 in this scenario.")
    mrr_month_12: float = Field(description="MRR at Month 12 in this scenario.")
    arr_month_12: float = Field(description="ARR at Month 12 in this scenario.")
    profitable: bool = Field(description="Is the business profitable by Month 12 in this scenario?")


class FinanceOutput(BaseModel):

    # ── PRICING STRATEGY ─────────────────────────────────────────────────────
    pricing_tiers: List[PricingTier] = Field(
        description=(
            "2-3 pricing tiers matching the product agent's recommendation. "
            "Must include unit economics and conversion assumptions."
        ),
        min_length=2,
        max_length=3
    )

    pricing_strategy_rationale: str = Field(
        description=(
            "Why this pricing structure was chosen. "
            "Reference competitor pricing and target market's willingness to pay."
        )
    )

    # ── 12-MONTH PROJECTIONS ──────────────────────────────────────────────────
    monthly_projections: List[MonthlyProjection] = Field(
        description=(
            "Month-by-month financial projection for 12 months. "
            "Must show realistic growth — not hockey stick from month 1. "
            "Months 1-3 will be slow (building phase). "
            "Start with 0 paid users and grow based on realistic assumptions."
        ),
        min_length=12,
        max_length=12
    )

    # ── SAAS METRICS ─────────────────────────────────────────────────────────
    saas_metrics: SaaSMetrics = Field(
        description="All key SaaS health metrics calculated at Month 12."
    )

    # ── RUNWAY ───────────────────────────────────────────────────────────────
    runway: RunwayAnalysis = Field(
        description="Full runway analysis with burn rate breakdown."
    )

    # ── SCENARIOS ────────────────────────────────────────────────────────────
    scenarios: List[UnitEconomicsScenario] = Field(
        description="Best, Base, and Worst case scenarios for Month 12.",
        min_length=3,
        max_length=3
    )

    # ── FUNDRAISING ──────────────────────────────────────────────────────────
    fundraising: FundraisingRecommendation = Field(
        description="Full fundraising strategy and recommendation."
    )

    # ── KEY FINANCIAL RISKS ──────────────────────────────────────────────────
    financial_risks: List[str] = Field(
        description=(
            "3-4 specific financial risks with mitigation strategies. "
            "e.g. 'High churn if onboarding is poor → invest in customer success early'"
        ),
        min_length=3,
        max_length=4
    )

    # ── CFO ADVICE ───────────────────────────────────────────────────────────
    cfo_advice: List[str] = Field(
        description=(
            "4-5 specific, actionable financial recommendations for this founder. "
            "e.g. 'Track MRR weekly from day 1 — not monthly', "
            "'Defer all founder salaries until MRR hits ₹1L', "
            "'Set up Stripe/Razorpay analytics dashboard before first paid user'"
        ),
        min_length=4,
        max_length=5
    )

    # ── CURRENCY & MARKET CONTEXT ────────────────────────────────────────────
    currency: str = Field(description="Primary currency used in this model. e.g. '₹ (INR)' or '$ (USD)'")
    financial_model_assumptions: List[str] = Field(
        description=(
            "5-6 key assumptions this entire model is built on. "
            "e.g. 'Free-to-paid conversion: 8%', 'Monthly churn: 3%', "
            "'CAC via content/community: ₹800 per customer'"
        ),
        min_length=5,
        max_length=6
    )