"""
state.py — The shared whiteboard for all agents.

Every agent reads from this and writes back to this.
No agent talks to another agent directly — only through state.

Full pipeline flow:
    User Input
        ↓
    planner        → refines idea/industry/target_market, fills planner_output
        ↓
    research       → fills research_output
        ↓
    ┌──────────────┐
    competitor     product      (parallel)
    └──────────────┘
        ↓
    branding       → fills branding_output
        ↓
    ┌──────────────┐
    finance        gtm          (parallel)
    └──────────────┘
        ↓
    pitch          → fills pitch_output
        ↓
    report         → fills final_report_path
"""

"""
state.py — Shared state for the VenturePilot LangGraph pipeline.

Branding HITL fields:
  branding_hitl_status  — tracks where in the HITL flow we are
  approved_branding_*   — founder-approved values injected before phase 2
  branding_logo_url     — Supabase Storage URL after logo generation
"""

from typing import TypedDict, Optional, List
from schemas.planner    import PlannerOutput
from schemas.research   import MarketResearchOutput
from schemas.competitor import CompetitorOutput
from schemas.product    import ProductOutput
from schemas.branding   import BrandingOutput
from schemas.finance    import FinanceOutput
from schemas.gtm        import GTMOutput
from schemas.pitch      import PitchOutput


class AppState(TypedDict):
    # ── INPUT ──────────────────────────────────────────────────────────────────
    idea:          str
    industry:      str
    target_market: str
    budget:        Optional[str]
    stage:         Optional[str]

    # ── AGENT OUTPUTS ──────────────────────────────────────────────────────────
    planner_output:    Optional[PlannerOutput]
    research_output:   Optional[MarketResearchOutput]
    competitor_output: Optional[CompetitorOutput]
    product_output:    Optional[ProductOutput]
    branding_output:   Optional[BrandingOutput]   # phase 1 output (AI suggestions)
    finance_output:    Optional[FinanceOutput]
    gtm_output:        Optional[GTMOutput]
    pitch_output:      Optional[PitchOutput]
    final_report_path: Optional[str]

    # ── BRANDING HITL ──────────────────────────────────────────────────────────
    # Status values:
    #   None                      → branding hasn't run yet
    #   "awaiting_approval"       → phase 1 done, waiting for founder review
    #   "approved"                → founder approved, phase 2 can run
    branding_hitl_status:    Optional[str]

    # Founder-approved values (injected by the API endpoint on approval).
    # Downstream agents read from these — NOT from branding_output directly.
    approved_branding_name:           Optional[str]
    approved_branding_tagline:        Optional[str]
    approved_branding_color_palette:  Optional[list]   # list of ColorSwatch dicts
    approved_branding_logo_direction: Optional[str]

    # Logo image URL (Supabase Storage, populated after phase 2)
    branding_logo_url: Optional[str]

    # ── META ───────────────────────────────────────────────────────────────────
    errors:           Optional[List[str]]
    completed_agents: Optional[List[str]]