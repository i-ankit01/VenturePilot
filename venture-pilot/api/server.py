# uvicorn api.server:app --reload --port 8000

import os
import asyncio
from contextlib import asynccontextmanager
from dotenv import load_dotenv

from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from supabase import create_client, Client

from graph.workflow import build_graph_compiled, get_checkpointer, make_thread_config
from agents.branding import regenerate_branding_section
from routers import investors, auth_google

load_dotenv()

SUPABASE_URL               = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY  = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# ── App-level graph + checkpointer (created once at startup) ──────────────────
# These are module-level so background tasks can access them without re-init.
_checkpointer = None
_graph        = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize AsyncRedisSaver and compile graph once at startup."""
    global _checkpointer, _graph
    _checkpointer = await get_checkpointer()
    _graph        = build_graph_compiled(_checkpointer)
    print("[server] Graph compiled with Redis checkpointer. Ready.")
    yield
    # Cleanup on shutdown (close Redis connection)
    if _checkpointer and hasattr(_checkpointer, "_redis"):
        await _checkpointer._redis.aclose()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(investors.router)
app.include_router(auth_google.router)


# ── Supabase helpers ──────────────────────────────────────────────────────────

def get_supabase() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def job_get(job_id: str) -> dict | None:
    res = get_supabase().table("jobs").select("*").eq("id", job_id).single().execute()
    return res.data if res.data else None


def job_update(job_id: str, fields: dict):
    get_supabase().table("jobs").update(fields).eq("id", job_id).execute()


def job_create(project_id: str | None) -> str:
    row = {"status": "pending", "partial": {}, "completed_agents": [], "errors": []}
    if project_id:
        row["project_id"] = project_id
    res = get_supabase().table("jobs").insert(row).execute()
    return res.data[0]["id"]


# ── Request models ────────────────────────────────────────────────────────────

class PitchRequest(BaseModel):
    idea:          str
    industry:      str
    target_market: str
    budget:        str = "bootstrapped"
    stage:         str = "idea"
    project_id:    str | None = None


class BrandingApprovalRequest(BaseModel):
    approved_name:           str
    approved_tagline:        str
    approved_color_palette:  list
    approved_logo_direction: str


class RegenerateRequest(BaseModel):
    section: str   # "name" | "tagline" | "colors" | "logo_direction"


# ── Helpers ───────────────────────────────────────────────────────────────────

def _serialize(obj):
    if obj is None:
        return None
    if hasattr(obj, "model_dump"):
        return obj.model_dump()
    return obj


def _build_initial_state(request: PitchRequest) -> dict:
    return {
        "idea":           request.idea,
        "industry":       request.industry,
        "target_market":  request.target_market,
        "budget":         request.budget,
        "stage":          request.stage,
        "planner_output":    None,
        "research_output":   None,
        "competitor_output": None,
        "product_output":    None,
        "branding_output":   None,
        "finance_output":    None,
        "gtm_output":        None,
        "pitch_output":      None,
        "final_report_path": None,
        "errors":            None,
        "completed_agents":  None,
        "branding_hitl_status":            None,
        "approved_branding_name":          None,
        "approved_branding_tagline":       None,
        "approved_branding_color_palette": None,
        "approved_branding_logo_direction":None,
        "branding_logo_url":               None,
    }


# ── Phase 1: stream graph until interrupt ────────────────────────────────────

async def run_pipeline_until_interrupt(job_id: str, request: PitchRequest):
    """
    Streams the graph from the start. When the branding interrupt fires,
    LangGraph saves state to Redis and astream() ends naturally.
    We update job status to awaiting_branding_approval.
    """
    job_update(job_id, {"status": "running"})

    config  = make_thread_config(job_id)
    state   = _build_initial_state(request)
    partial = {}

    try:
        async for chunk in _graph.astream(state, config, stream_mode="updates"):
            node_name  = list(chunk.keys())[0]
            node_state = chunk[node_name]

            # Collect partial outputs as each agent finishes
            output_key = f"{node_name}_output"
            if output_key in node_state and node_state[output_key] is not None:
                output = node_state[output_key]
                partial[output_key] = (
                    output.model_dump() if hasattr(output, "model_dump") else output
                )

            completed = node_state.get("completed_agents") or []

            job_update(job_id, {
                "partial":          partial,
                "completed_agents": completed,
            })

            print(f"[server] Agent done: {node_name}")

        # astream() ends after the interrupt — branding is now in checkpoint.
        # Pull branding_output from partial to surface to the frontend.
        branding_data = partial.get("branding_output")

        job_update(job_id, {
            "status":               "awaiting_branding_approval",
            "branding_suggestions": branding_data,
            "partial":              partial,
        })
        print(f"[server] Pipeline interrupted at branding. Job {job_id} awaiting approval.")

    except Exception as e:
        import traceback
        traceback.print_exc()
        job_update(job_id, {"status": "error", "errors": [str(e)]})


# ── Phase 2: resume graph after approval ─────────────────────────────────────

async def resume_pipeline_after_approval(
    job_id: str,
    approval: BrandingApprovalRequest,
):
    """
    Called after founder approves branding.

    1. Injects approved values into the checkpoint via graph.aupdate_state().
       LangGraph merges these into the saved state in Redis.
    2. Resumes astream(None, config) — LangGraph picks up from the interrupt
       point (after branding) and runs branding_logo → finance → ... → report.
    """
    config = make_thread_config(job_id)

    # Inject approved values into the checkpoint.
    # These will be read by branding_logo_agent and downstream agents.
    approved_state = {
        "approved_branding_name":           approval.approved_name,
        "approved_branding_tagline":        approval.approved_tagline,
        "approved_branding_color_palette":  approval.approved_color_palette,
        "approved_branding_logo_direction": approval.approved_logo_direction,
        "branding_hitl_status":             "approved",
    }

    await _graph.aupdate_state(config, approved_state)
    print(f"[server] Approved state injected into Redis checkpoint for job {job_id}.")

    # Fetch current partial so we can keep accumulating from where we left off
    job    = job_get(job_id)
    partial = job.get("partial") or {}

    job_update(job_id, {"status": "running"})

    try:
        # Passing None as input tells LangGraph to resume from the checkpoint.
        async for chunk in _graph.astream(None, config, stream_mode="updates"):
            node_name  = list(chunk.keys())[0]
            node_state = chunk[node_name]

            output_key = f"{node_name}_output"
            if output_key in node_state and node_state[output_key] is not None:
                output = node_state[output_key]
                partial[output_key] = (
                    output.model_dump() if hasattr(output, "model_dump") else output
                )

            completed = node_state.get("completed_agents") or []

            update_payload = {
                "partial":          partial,
                "completed_agents": completed,
            }

            # Logo URL (set by branding_logo_agent)
            if logo_url := node_state.get("branding_logo_url"):
                update_payload["logo_image_url"] = logo_url
                # Also embed in branding_output so frontend sees it there too
                if isinstance(partial.get("branding_output"), dict):
                    partial["branding_output"]["logo_image_url"] = logo_url

            # Report path (set by report agent)
            if report_path := node_state.get("final_report_path"):
                update_payload["report_path"] = report_path

            job_update(job_id, update_payload)
            print(f"[server] Phase 2 agent done: {node_name}")

        job_update(job_id, {"status": "done"})
        print(f"[server] Pipeline complete for job {job_id}.")

    except Exception as e:
        import traceback
        traceback.print_exc()
        job_update(job_id, {"status": "error", "errors": [str(e)]})


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.post("/api/analyze")
async def analyze(request: PitchRequest, background_tasks: BackgroundTasks):
    """
    Start the pipeline. Returns job_id immediately.
    Phase 1 runs in the background as an asyncio task.
    """
    job_id = job_create(request.project_id)
    # Use asyncio.create_task so the background coroutine runs on the event loop
    # (BackgroundTasks is fine too but create_task is cleaner for async work)
    background_tasks.add_task(run_pipeline_until_interrupt, job_id, request)
    return {"job_id": job_id}


@app.get("/api/partial/{job_id}")
async def partial_result(job_id: str):
    """
    Poll this every 3 seconds to track pipeline progress.

    When status == "awaiting_branding_approval":
      - branding_suggestions is populated (the AI's single suggestions)
      - Frontend should show the BrandingReviewOverlay

    When status == "running" after approval:
      - Pipeline is generating logo + downstream agents
    """
    job = job_get(job_id)
    if not job:
        return {"error": "Job not found"}

    return {
        "status":               job["status"],
        "completed_agents":     job.get("completed_agents", []),
        "partial":              job.get("partial", {}),
        "branding_suggestions": job.get("branding_suggestions"),
        "logo_image_url":       job.get("logo_image_url"),
        "report_path":          job.get("report_path"),
        "errors":               job.get("errors", []),
    }


@app.post("/api/branding/approve/{job_id}")
async def approve_branding(
    job_id: str,
    approval: BrandingApprovalRequest,
    background_tasks: BackgroundTasks,
):
    """
    Called when founder clicks 'Approve All & Continue'.

    Stores approved values and resumes the LangGraph checkpoint via
    graph.aupdate_state() + graph.astream(None, config).
    """
    job = job_get(job_id)
    if not job:
        return {"error": "Job not found"}
    if job["status"] != "awaiting_branding_approval":
        return {"error": f"Job not awaiting approval (status: {job['status']})"}

    # Persist approved values to jobs table immediately
    job_update(job_id, {
        "status": "branding_approved",
        "approved_branding": {
            "approved_name":           approval.approved_name,
            "approved_tagline":        approval.approved_tagline,
            "approved_color_palette":  approval.approved_color_palette,
            "approved_logo_direction": approval.approved_logo_direction,
        },
    })

    # Resume pipeline in background
    background_tasks.add_task(resume_pipeline_after_approval, job_id, approval)
    return {"status": "phase2_started"}


@app.post("/api/branding/regenerate/{job_id}")
async def regenerate_branding(job_id: str, req: RegenerateRequest):
    """
    Called when founder clicks Regenerate on a specific section.
    Runs synchronously (pure LLM, no search, fast enough for a request).
    Does NOT affect the Redis checkpoint — only returns fresh suggestions.
    """
    job = job_get(job_id)
    if not job:
        return {"error": "Job not found"}

    partial = job.get("partial") or {}

    # Reconstruct minimal state from what phase 1 stored
    from schemas.planner    import PlannerOutput
    from schemas.research   import MarketResearchOutput
    from schemas.competitor import CompetitorOutput
    from schemas.product    import ProductOutput

    def _try_parse(cls, raw):
        try:
            return cls(**raw) if raw else None
        except Exception:
            return None

    planner_raw = partial.get("planner_output") or {}

    state = {
        "idea":            planner_raw.get("refined_idea", ""),
        "industry":        planner_raw.get("industry", ""),
        "target_market":   planner_raw.get("target_market", ""),
        "budget":          "bootstrapped",
        "stage":           "idea",
        "planner_output":    _try_parse(PlannerOutput,        partial.get("planner_output")),
        "research_output":   _try_parse(MarketResearchOutput, partial.get("research_output")),
        "competitor_output": _try_parse(CompetitorOutput,     partial.get("competitor_output")),
        "product_output":    _try_parse(ProductOutput,        partial.get("product_output")),
        "branding_output":   None,
        "finance_output":    None,
        "gtm_output":        None,
        "pitch_output":      None,
        "final_report_path": None,
        "errors":            None,
        "completed_agents":  [],
        "branding_hitl_status":            None,
        "approved_branding_name":          None,
        "approved_branding_tagline":       None,
        "approved_branding_color_palette": None,
        "approved_branding_logo_direction":None,
        "branding_logo_url":               None,
    }

    # Run in thread pool since it's sync
    loop   = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None,
        regenerate_branding_section,
        state,
        req.section
    )
    return result


@app.get("/api/status/{job_id}")
async def status(job_id: str):
    job = job_get(job_id)
    if not job:
        return {"error": "Job not found"}
    return {
        "job_id":           job_id,
        "status":           job["status"],
        "completed_agents": job.get("completed_agents", []),
        "errors":           job.get("errors", []),
    }


@app.get("/api/download/{job_id}")
async def download(job_id: str):
    job = job_get(job_id)
    if not job or not job.get("report_path"):
        return {"error": "File not ready"}
    path = job["report_path"]
    if not os.path.exists(path):
        return {"error": "File not found on disk"}
    return FileResponse(
        path,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        filename=os.path.basename(path),
    )