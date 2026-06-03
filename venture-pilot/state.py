"""
state.py — The shared whiteboard for all agents.

Every agent reads from this and writes back to this.
No agent talks to another agent directly — only through state.

Flow:
    User Input → Planner fills top section
               → Research fills research_output
               → Competitor fills competitor_output
               → ... and so on
"""

"""
state.py — The shared whiteboard for all agents.

Every agent reads from this and writes back to this.
No agent talks to another agent directly — only through state.

Flow:
    User Input → Planner refines and fills top section
               → Research fills research_output
               → Competitor fills competitor_output
               → ... and so on
"""

from typing import TypedDict, Optional, List
from schemas.research import MarketResearchOutput
from schemas.planner import PlannerOutput


class AppState(TypedDict):
    # ── INPUT (filled by user, then overwritten/refined by planner) ───────
    idea: str                          # raw → refined by planner
    industry: str                      # raw → refined by planner
    target_market: str                 # raw → refined by planner
    budget: Optional[str]              # e.g. "$5000", "bootstrapped"
    stage: Optional[str]               # e.g. "idea", "mvp", "scaling"

    # ── AGENT OUTPUTS (each agent fills its own slot) ──────────────────────
    planner_output: Optional[PlannerOutput]
    research_output: Optional[MarketResearchOutput]

    # filled later as you build more agents:
    competitor_output: Optional[dict]
    product_output: Optional[dict]
    branding_output: Optional[dict]
    finance_output: Optional[dict]
    gtm_output: Optional[dict]
    pitch_output: Optional[dict]
    final_report_path: Optional[str]

    # ── META (for graph routing & error handling) ──────────────────────────
    errors: Optional[List[str]]            # any agent can log errors here
    completed_agents: Optional[List[str]]  # track what has run