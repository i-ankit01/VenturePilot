"""
schemas/gtm.py — Output contract for the GTM Agent.

GTM = Go-To-Market. Answers: how do we get users, keep them, and scale?

The week-wise plan is structured data (not free text) so the frontend
can render it as an interactive timeline/Gantt chart.

Consumed by:
  - pitch.py    → uses first_100_users, channels, growth_experiments
                  (GTM slide in the deck)
  - report.py   → uses everything
                  (full GTM chapter)
"""

from pydantic import BaseModel, Field
from typing import List
from enum import Enum


class ChannelType(str, Enum):
    CONTENT_MARKETING  = "Content Marketing"
    COMMUNITY          = "Community"
    PAID_ADS           = "Paid Ads"
    SEO                = "SEO"
    REFERRAL           = "Referral / Word of Mouth"
    PARTNERSHIPS       = "Partnerships"
    COLD_OUTREACH      = "Cold Outreach"
    SOCIAL_MEDIA       = "Social Media"
    PRODUCT_LED        = "Product-Led Growth"
    INFLUENCER         = "Influencer / Creator"
    EMAIL              = "Email Marketing"
    EVENTS             = "Events / Meetups"


class GrowthPhase(str, Enum):
    TRACTION   = "0→100 Users (Traction)"
    GROWTH     = "100→1K Users (Growth)"
    SCALE      = "1K→10K Users (Scale)"


class MarketingChannel(BaseModel):
    """A single marketing channel with full execution detail."""
    channel: ChannelType
    priority: str = Field(description="'Primary', 'Secondary', or 'Experimental'")
    why_this_channel: str = Field(
        description=(
            "Why this channel works specifically for this audience. "
            "Must reference the ICP — not generic channel advice."
        )
    )
    tactics: List[str] = Field(
        description="3-4 specific tactics to execute on this channel.",
        min_length=3,
        max_length=4
    )
    estimated_cac: str = Field(
        description=(
            "Rough CAC estimate from this channel. "
            "e.g. '₹200-500 per user via community (mostly time cost)' or "
            "'₹800-1200 per paid user via Google Ads'"
        )
    )
    kpi: str = Field(
        description=(
            "The one metric that tells you if this channel is working. "
            "e.g. 'Signups from LinkedIn per post > 15' or "
            "'Email open rate > 35%'"
        )
    )
    when_to_start: str = Field(
        description=(
            "When in the journey to activate this channel. "
            "e.g. 'Week 1 — start immediately', 'Month 3 — after product is stable'"
        )
    )


class First100UsersStrategy(BaseModel):
    """Concrete plan to get the first 100 users."""
    total_timeline: str = Field(description="e.g. '8 weeks'")
    core_approach: str = Field(
        description=(
            "The single dominant strategy for getting first 100 users. "
            "e.g. 'Manual outreach to freelancer communities on LinkedIn + WhatsApp groups'"
        )
    )
    steps: List[str] = Field(
        description=(
            "6-8 ordered, specific action steps. "
            "Each must be concrete enough to do tomorrow. "
            "e.g. 'Join 10 Indian freelancer Facebook groups and post a problem-question (not an ad)', "
            "'DM the top 50 posters in those groups offering free beta access'"
        ),
        min_length=6,
        max_length=8
    )
    where_to_find_them: List[str] = Field(
        description=(
            "4-6 specific places where the ICP hangs out online and offline. "
            "e.g. 'r/IndiaFreelance', 'Freelancer groups on WhatsApp', "
            "'LinkedIn hashtag #IndianFreelancer', 'Design Twitter (DesignIndia)'"
        ),
        min_length=4,
        max_length=6
    )
    hook_offer: str = Field(
        description=(
            "The specific offer to get them to try. Free is not enough — what's the hook? "
            "e.g. 'We will set up your first 3 invoices for you personally. "
            "You just send us your client details over WhatsApp.'"
        )
    )
    conversion_script: str = Field(
        description=(
            "The exact DM/message to send to a potential first user. "
            "Should sound human, not salesy. 3-4 sentences max."
        )
    )


class WeekPlan(BaseModel):
    """
    A single week in the 12-week GTM plan.
    Structured data so the frontend can render this as a visual timeline.
    """
    week: int = Field(description="Week number. 1 to 12.")
    theme: str = Field(
        description=(
            "The focus theme for this week. "
            "e.g. 'Launch outreach', 'Community building', 'First feedback loop'"
        )
    )
    phase: GrowthPhase = Field(description="Which growth phase this week belongs to.")
    goals: List[str] = Field(
        description="2-3 specific, measurable goals for this week.",
        min_length=2,
        max_length=3
    )
    tasks: List[str] = Field(
        description=(
            "4-6 concrete tasks to execute this week. "
            "Each task must be specific enough to assign to a calendar slot. "
            "e.g. 'Post 3 value-add tweets about freelancer payment problems', "
            "'Schedule 5 user interviews with beta signups'"
        ),
        min_length=4,
        max_length=6
    )
    channel_focus: List[str] = Field(
        description="1-2 primary channels to focus on this week.",
        min_length=1,
        max_length=2
    )
    success_metric: str = Field(
        description=(
            "The one number that defines success for this week. "
            "e.g. '20 new beta signups' or '5 user interviews completed' or "
            "'First paying customer'"
        )
    )
    milestone: bool = Field(
        description=(
            "True if this week has a major milestone. "
            "Used by the frontend to highlight this week on the timeline. "
            "e.g. True for Week 1 (launch), Week 4 (first paying user), Week 8 (100 users)"
        )
    )
    milestone_label: str = Field(
        description=(
            "Short label shown on the timeline if milestone=True. "
            "e.g. 'Beta Launch', 'First Revenue', '100 Users'. "
            "Empty string '' if milestone=False."
        )
    )


class GrowthExperiment(BaseModel):
    """A single growth experiment to run."""
    name: str = Field(description="Short experiment name. e.g. 'WhatsApp viral loop'")
    hypothesis: str = Field(
        description=(
            "If we do X, we expect Y because Z. "
            "e.g. 'If we add a WhatsApp share button after invoice is paid, "
            "20% of users will share it, because payment is a celebratory moment.'"
        )
    )
    how_to_run: str = Field(description="3-4 sentences on exactly how to execute this experiment.")
    success_criteria: str = Field(
        description="What number proves this worked? e.g. 'Referral rate > 15%'"
    )
    effort: str = Field(description="'Low', 'Medium', or 'High' effort to implement.")
    potential_impact: str = Field(description="'Low', 'Medium', or 'High' impact if it works.")
    timeline: str = Field(description="When to run this. e.g. 'Month 2, after first 50 users'")


class ScalingStrategy(BaseModel):
    """How to scale from small to large — phased approach."""
    phase: str = Field(description="e.g. 'Phase 1: 0→100 users', 'Phase 2: 100→1K', 'Phase 3: 1K→10K'")
    timeframe: str = Field(description="e.g. 'Months 1-3'")
    primary_engine: str = Field(
        description=(
            "The main growth engine for this phase. "
            "e.g. 'Manual founder-led sales', 'Content + community', 'Paid acquisition'"
        )
    )
    key_actions: List[str] = Field(
        description="3-4 key actions to drive growth in this phase.",
        min_length=3,
        max_length=4
    )
    budget_allocation: str = Field(
        description=(
            "How marketing budget should be split in this phase. "
            "e.g. '80% community/content (time), 20% paid (₹5K/month)'"
        )
    )
    unlock_condition: str = Field(
        description=(
            "What metric unlocks the move to the next phase. "
            "e.g. 'Move to Phase 2 when MRR hits ₹50K and churn < 5%'"
        )
    )


class GTMOutput(BaseModel):

    # ── FIRST 100 USERS ───────────────────────────────────────────────────────
    first_100_users: First100UsersStrategy = Field(
        description="The complete, step-by-step strategy to get the first 100 users."
    )

    # ── MARKETING CHANNELS ────────────────────────────────────────────────────
    channels: List[MarketingChannel] = Field(
        description=(
            "4-6 marketing channels. Mix of Primary (2), Secondary (2), Experimental (1-2). "
            "Must be grounded in where the ICP actually spends time."
        ),
        min_length=4,
        max_length=6
    )

    # ── 12-WEEK PLAN ──────────────────────────────────────────────────────────
    weekly_plan: List[WeekPlan] = Field(
        description=(
            "Week-by-week GTM execution plan for the first 12 weeks. "
            "This is structured data for frontend graph rendering. "
            "Must have exactly 12 entries (Week 1 to Week 12). "
            "Milestone weeks: Week 1 (launch), Week 4 (first revenue), "
            "Week 8 (growth inflection), Week 12 (review + scale decision)."
        ),
        min_length=12,
        max_length=12
    )

    # ── GROWTH EXPERIMENTS ────────────────────────────────────────────────────
    growth_experiments: List[GrowthExperiment] = Field(
        description=(
            "5 growth experiments to run in the first 6 months. "
            "Mix of product-led, content, referral, and partnership experiments. "
            "Order by effort:impact ratio (best ratio first)."
        ),
        min_length=5,
        max_length=5
    )

    # ── SCALING STRATEGY ──────────────────────────────────────────────────────
    scaling_strategy: List[ScalingStrategy] = Field(
        description="3-phase scaling strategy: 0→100, 100→1K, 1K→10K users.",
        min_length=3,
        max_length=3
    )

    # ── CONTENT STRATEGY ──────────────────────────────────────────────────────
    content_strategy: str = Field(
        description=(
            "3-4 sentence content marketing strategy specific to this audience. "
            "What type of content, on which platforms, at what frequency, "
            "and what angle makes this startup the go-to authority. "
            "e.g. 'Publish 3x/week on LinkedIn: one payment tip, one freelancer win story, "
            "one behind-the-scenes build. Repurpose to Twitter threads. "
            "Goal: become the #1 resource for Indian freelancer finance literacy.'"
        )
    )

    # ── RETENTION STRATEGY ────────────────────────────────────────────────────
    retention_strategy: str = Field(
        description=(
            "How to keep users once they sign up. "
            "Specific tactics: onboarding flow, aha moment, habit loop. "
            "e.g. 'Aha moment = first invoice sent via WhatsApp in under 2 minutes. "
            "Drive to this in onboarding. Week 2 email: did your client pay? "
            "If not, here is how to send a reminder in one tap.'"
        )
    )

    # ── REFERRAL MECHANISM ────────────────────────────────────────────────────
    referral_strategy: str = Field(
        description=(
            "Specific referral/word-of-mouth mechanism. "
            "e.g. 'Refer 3 freelancers → get Pro free for 1 month. "
            "Mechanic: unique referral link embedded in invoice footer "
            "(client sees it, forwards to freelancer friends).'"
        )
    )

    # ── PARTNERSHIPS ──────────────────────────────────────────────────────────
    partnership_opportunities: List[str] = Field(
        description=(
            "3-4 specific partnership opportunities. "
            "e.g. 'Partner with Internshala (freelancer talent platform) — "
            "bundle InvoiceZap as default invoicing tool for new freelancers'"
        ),
        min_length=3,
        max_length=4
    )

    # ── NORTH STAR METRIC ────────────────────────────────────────────────────
    north_star_metric: str = Field(
        description=(
            "The single metric that best captures the product's core value delivery. "
            "e.g. 'Invoices paid on time (within 7 days of sending) — "
            "this is the core promise. Everything else is secondary.'"
        )
    )

    # ── GTM RISKS ────────────────────────────────────────────────────────────
    gtm_risks: List[str] = Field(
        description=(
            "3 specific GTM risks with mitigation. "
            "e.g. 'Risk: freelancers don't pay for tools → "
            "Mitigation: freemium with hard limit at 3 invoices forces upgrade'"
        ),
        min_length=3,
        max_length=3
    )