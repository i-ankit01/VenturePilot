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
    # ── INPUT (filled by user, then overwritten/refined by planner) ────────
    idea: str                           # raw → refined by planner
    industry: str                       # raw → refined by planner
    target_market: str                  # raw → refined by planner
    budget: Optional[str]               # e.g. "₹3L", "$5000", "bootstrapped"
    stage: Optional[str]                # e.g. "idea", "mvp", "scaling"

    # ── AGENT OUTPUTS ──────────────────────────────────────────────────────
    planner_output:    Optional[PlannerOutput]        # ← planner
    research_output:   Optional[MarketResearchOutput] # ← research
    competitor_output: Optional[CompetitorOutput]     # ← competitor (parallel w/ product)
    product_output:    Optional[ProductOutput]        # ← product    (parallel w/ competitor)
    branding_output:   Optional[BrandingOutput]       # ← branding
    finance_output:    Optional[FinanceOutput]        # ← finance    (parallel w/ gtm)
    gtm_output:        Optional[GTMOutput]            # ← gtm        (parallel w/ finance)
    pitch_output:      Optional[PitchOutput]          # ← pitch (fully typed now)
    final_report_path: Optional[str]                  # ← report

    # ── META ───────────────────────────────────────────────────────────────
    errors:            Optional[List[str]]            # any agent logs errors here
    completed_agents:  Optional[List[str]]            # tracks what has run