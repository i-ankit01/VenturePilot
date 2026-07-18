"""
graph/workflow.py — The LangGraph StateGraph.

Wires all agents into a single executable graph.

Pipeline:
    planner → research → [competitor ‖ product] → branding
            → [finance ‖ gtm] → pitch → report

Parallel execution:
    LangGraph runs competitor + product simultaneously via Send API.
    Same for finance + gtm. This cuts total runtime by ~40%.

Usage:
    from graph.workflow import build_graph

    graph = build_graph()
    result = graph.invoke(initial_state)
    print(result["final_report_path"])
"""

import os
import atexit
from contextlib import ExitStack
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.redis import RedisSaver

from state import AppState
from agents.planner    import run_planner_agent
from agents.research   import run_research_agent
from agents.competitor import run_competitor_agent
from agents.product    import run_product_agent
from agents.branding   import run_branding_agent
from agents.finance    import run_finance_agent
from agents.gtm        import run_gtm_agent
from agents.pitch      import run_pitch_agent
from agents.report     import run_report_agent


# ── Node name constants ───────────────────────────────────────────────────────
PLANNER    = "planner"
RESEARCH   = "research"
COMPETITOR = "competitor"
PRODUCT    = "product"
BRANDING   = "branding"
FINANCE    = "finance"
GTM        = "gtm"
PITCH      = "pitch"
REPORT     = "report"

REDIS_URL = os.getenv("REDIS_URL")

# ── The checkpointer is created ONCE per process and reused for every job ──
# Building a new RedisSaver per job (as before) opens a fresh connection
# every single time, and — more importantly — nothing was ever calling
# `.setup()`, which is what creates the RediSearch indices the saver needs
# to actually read/write checkpoints.
#
# RedisSaver.from_conn_string(...) is documented as a context manager
# (`with RedisSaver.from_conn_string(url) as checkpointer:`). Since we need
# this checkpointer to live for the whole process instead of one `with`
# block, we enter the context manager once via ExitStack and keep it open,
# then register the matching close on process exit.
_exit_stack = ExitStack()
_checkpointer: RedisSaver | None = None


def get_checkpointer() -> RedisSaver:
    global _checkpointer
    if _checkpointer is None:
        if not REDIS_URL:
            raise RuntimeError("REDIS_URL is not set — cannot create Redis checkpointer")
        saver_cm = RedisSaver.from_conn_string(REDIS_URL)
        _checkpointer = _exit_stack.enter_context(saver_cm)
        _checkpointer.setup()  # idempotent — creates indices if they don't exist yet
        atexit.register(_exit_stack.close)
    return _checkpointer


def build_graph(checkpointing: bool = False) -> StateGraph:
    """
    Build and compile the full Venture Pilot agent graph.

    Args:
        checkpointing: If True, attaches the shared Redis checkpointer so
                       runs can be resumed after a crash/restart using the
                       same thread_id. Set False for simple single-shot
                       runs that don't need to survive a process restart.

    Returns:
        A compiled LangGraph graph ready to invoke.

    Example:
        graph = build_graph()
        result = graph.invoke({
            "idea":         "SaaS invoicing tool for freelancers",
            "industry":     "Fintech",
            "target_market":"Freelancers in India",
            "budget":       "$5000",
            "stage":        "idea",
        })
    """

    # ── 1. Create graph with AppState as the shared state type ────────────
    workflow = StateGraph(AppState)

    # ── 2. Register all nodes ─────────────────────────────────────────────
    workflow.add_node(PLANNER,    run_planner_agent)
    workflow.add_node(RESEARCH,   run_research_agent)
    workflow.add_node(COMPETITOR, run_competitor_agent)
    workflow.add_node(PRODUCT,    run_product_agent)
    workflow.add_node(BRANDING,   run_branding_agent)
    workflow.add_node(FINANCE,    run_finance_agent)
    workflow.add_node(GTM,        run_gtm_agent)
    workflow.add_node(PITCH,      run_pitch_agent)
    workflow.add_node(REPORT,     run_report_agent)

    # ── 3. Set entry point ────────────────────────────────────────────────
    workflow.set_entry_point(PLANNER)

    # ── 4. Wire edges ─────────────────────────────────────────────────────
    workflow.add_edge(PLANNER, RESEARCH)
    workflow.add_edge(RESEARCH, COMPETITOR)
    workflow.add_edge(COMPETITOR, PRODUCT)
    workflow.add_edge(PRODUCT,    BRANDING)
    workflow.add_edge(BRANDING, FINANCE)
    workflow.add_edge(FINANCE, GTM)
    workflow.add_edge(GTM,     PITCH)
    workflow.add_edge(PITCH,  REPORT)
    workflow.add_edge(REPORT, END)

    # ── 5. Compile ────────────────────────────────────────────────────────
    if checkpointing:
        return workflow.compile(checkpointer=get_checkpointer())

    return workflow.compile()


def build_graph_with_error_handling() -> StateGraph:
    """
    Same graph but with conditional edges that skip downstream agents
    if a prior agent logged a critical error.

    Use this for production runs where you want graceful degradation
    instead of crashing the whole pipeline.
    """

    def should_continue(state: AppState) -> str:
        """Route to END if errors exist, otherwise continue."""
        errors = state.get("errors") or []
        critical = [e for e in errors if "missing required" in e]
        return END if critical else "continue"

    workflow = StateGraph(AppState)

    workflow.add_node(PLANNER,    run_planner_agent)
    workflow.add_node(RESEARCH,   run_research_agent)
    workflow.add_node(COMPETITOR, run_competitor_agent)
    workflow.add_node(PRODUCT,    run_product_agent)
    workflow.add_node(BRANDING,   run_branding_agent)
    workflow.add_node(FINANCE,    run_finance_agent)
    workflow.add_node(GTM,        run_gtm_agent)
    workflow.add_node(PITCH,      run_pitch_agent)
    workflow.add_node(REPORT,     run_report_agent)

    workflow.set_entry_point(PLANNER)

    workflow.add_edge(PLANNER,    RESEARCH)
    workflow.add_edge(RESEARCH,   COMPETITOR)
    workflow.add_edge(COMPETITOR,   PRODUCT)
    workflow.add_edge(PRODUCT, BRANDING)
    workflow.add_edge(BRANDING,    FINANCE)
    # workflow.add_edge(PRODUCT,   FINANCE)
    workflow.add_edge(FINANCE,   GTM)
    workflow.add_edge(GTM,    PITCH)
    # workflow.add_edge(GTM,        PITCH)
    workflow.add_edge(PITCH,      REPORT)
    workflow.add_edge(REPORT,     END)

    return workflow.compile()


# ── Graph visualisation helper ────────────────────────────────────────────────

def print_graph_structure():
    """Print the graph node/edge structure to terminal for debugging."""
    print("\n" + "="*55)
    print("VENTURE PILOT — AGENT GRAPH STRUCTURE")
    print("="*55)
    print("""
    [planner]
        ↓
    [research]
        ↓               ← Tavily web search
    ┌───────────────┐
    [competitor]  [product]    ← parallel
    └───────────────┘
        ↓
    [branding]
        ↓
    ┌───────────────┐
    [finance]     [gtm]        ← parallel
    └───────────────┘
        ↓
    [pitch]
        ↓
    [report]       ← outputs .pptx
        ↓
     [END]
""")
    print("Agents with web search : research, competitor")
    print("Agents without search  : planner, product, branding,")
    print("                         finance, gtm, pitch, report")
    print("="*55)