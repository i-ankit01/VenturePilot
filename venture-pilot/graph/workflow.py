"""
graph/workflow.py — Single LangGraph pipeline with native HITL interrupt.

The graph compiles with:
  interrupt_after=["branding"]

This means after the branding node completes, LangGraph raises a special
interrupt that the AsyncRedisSaver captures and persists to Redis. The graph
execution suspends cleanly — no thread is held, no memory is needed.

Resume flow:
  1. Approve endpoint calls graph.aupdate_state() to inject approved values
  2. Approve endpoint calls graph.astream(None, config) to resume from checkpoint
  3. Pipeline continues from finance → gtm → pitch → report

The thread_id used in the LangGraph config is the job_id from our jobs table.
This means every job has exactly one checkpoint thread in Redis.

Pipeline order (unchanged):
  planner → research → competitor → product → branding
  [INTERRUPT HERE — founder reviews in UI]
  branding_logo → finance → gtm → pitch → report
"""

import os
import asyncio
from dotenv import load_dotenv
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.redis.aio import AsyncRedisSaver

from state import AppState
from agents.planner    import run_planner_agent
from agents.research   import run_research_agent
from agents.competitor import run_competitor_agent
from agents.product    import run_product_agent
from agents.branding   import run_branding_agent, run_branding_logo_agent
from agents.finance    import run_finance_agent
from agents.gtm        import run_gtm_agent
from agents.pitch      import run_pitch_agent
from agents.report     import run_report_agent

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL")

# ── Node name constants ───────────────────────────────────────────────────────
PLANNER       = "planner"
RESEARCH      = "research"
COMPETITOR    = "competitor"
PRODUCT       = "product"
BRANDING      = "branding"
BRANDING_LOGO = "branding_logo"
FINANCE       = "finance"
GTM           = "gtm"
PITCH         = "pitch"
REPORT        = "report"


def _make_async(sync_fn):
    """Run a sync agent in a thread pool executor so it doesn't block asyncio."""
    async def async_wrapper(state: AppState) -> AppState:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, sync_fn, state)
    async_wrapper.__name__ = sync_fn.__name__
    return async_wrapper


def build_graph_compiled(checkpointer: AsyncRedisSaver):
    """
    Build and compile the full pipeline with the given checkpointer.

    interrupt_after=["branding"]:
      After the branding node writes its output to state, LangGraph saves
      the full state snapshot to Redis and suspends execution. No thread is
      held waiting. The server endpoint returns. The checkpoint persists in
      Redis under thread_id=job_id.

    To resume:
      graph.aupdate_state(config, {"approved_branding_name": ..., ...})
      async for chunk in graph.astream(None, config, stream_mode="updates"): ...

    Args:
        checkpointer: An already-setup AsyncRedisSaver instance.

    Returns:
        Compiled LangGraph graph with interrupt_after=["branding"].
    """
    workflow = StateGraph(AppState)

    workflow.add_node(PLANNER,       _make_async(run_planner_agent))
    workflow.add_node(RESEARCH,      _make_async(run_research_agent))
    workflow.add_node(COMPETITOR,    _make_async(run_competitor_agent))
    workflow.add_node(PRODUCT,       _make_async(run_product_agent))
    workflow.add_node(BRANDING,      _make_async(run_branding_agent))
    workflow.add_node(BRANDING_LOGO, _make_async(run_branding_logo_agent))
    workflow.add_node(FINANCE,       _make_async(run_finance_agent))
    workflow.add_node(GTM,           _make_async(run_gtm_agent))
    workflow.add_node(PITCH,         _make_async(run_pitch_agent))
    workflow.add_node(REPORT,        _make_async(run_report_agent))

    workflow.set_entry_point(PLANNER)

    workflow.add_edge(PLANNER,       RESEARCH)
    workflow.add_edge(RESEARCH,      COMPETITOR)
    workflow.add_edge(COMPETITOR,    PRODUCT)
    workflow.add_edge(PRODUCT,       BRANDING)
    workflow.add_edge(BRANDING,      BRANDING_LOGO)
    workflow.add_edge(BRANDING_LOGO, FINANCE)
    workflow.add_edge(FINANCE,       GTM)
    workflow.add_edge(GTM,           PITCH)
    workflow.add_edge(PITCH,         REPORT)
    workflow.add_edge(REPORT,        END)

    return workflow.compile(
        checkpointer=checkpointer,
        interrupt_after=[BRANDING],
    )


# Replace get_checkpointer() with this version.
# TTL is set to 1440 minutes (24 hours) — safe for Redis Cloud free tier.
# refresh_on_read=True means any read resets the 24h clock, so active jobs
# never expire mid-run.
 
async def get_checkpointer() -> AsyncRedisSaver:
    """
    Create and set up an AsyncRedisSaver with 24h TTL.
    Call once at server startup (lifespan) and reuse across requests.
    """
    saver = AsyncRedisSaver(
        redis_url=REDIS_URL,
        ttl={
            "default_ttl": 1440,       # minutes → 24 hours
            "refresh_on_read": True,   # reading a checkpoint resets its TTL
        }
    )
    await saver.asetup()
    return saver

def make_thread_config(job_id: str) -> dict:
    """LangGraph config that ties a run to a specific Redis checkpoint thread."""
    return {"configurable": {"thread_id": job_id}}