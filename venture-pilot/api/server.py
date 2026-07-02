# uvicorn api.server:app --port 8000
# NOTE: Do NOT use --reload in development. It kills background pipeline tasks.
# Instead run two terminals: one for the server, one for your frontend.
# If you must use --reload, use the /api/resume/{job_id} endpoint to recover stuck jobs.

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

SUPABASE_URL              = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

_checkpointer = None
_graph        = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _checkpointer, _graph
    _checkpointer = await get_checkpointer()
    _graph        = build_graph_compiled(_checkpointer)
    print("[server] Graph compiled with Redis checkpointer. Ready.")
    yield
    if _checkpointer and hasattr(_checkpointer, "_redis"):
        try:
            await _checkpointer._redis.aclose()
        except Exception:
            pass


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(investors.router)
app.include_router(auth_google.router)


# ── Supabase ──────────────────────────────────────────────────────────────────

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


# ── Models ────────────────────────────────────────────────────────────────────

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
    section: str


# ── Initial state builder ─────────────────────────────────────────────────────

def _build_initial_state(request: PitchRequest) -> dict:
    return {
        "idea":          request.idea,
        "industry":      request.industry,
        "target_market": request.target_market,
        "budget":        request.budget,
        "stage":         request.stage,
        "planner_output":    None, "research_output":   None,
        "competitor_output": None, "product_output":    None,
        "branding_output":   None, "finance_output":    None,
        "gtm_output":        None, "pitch_output":      None,
        "final_report_path": None, "errors":            None,
        "completed_agents":  None,
        "branding_hitl_status":             None,
        "approved_branding_name":           None,
        "approved_branding_tagline":        None,
        "approved_branding_color_palette":  None,
        "approved_branding_logo_direction": None,
        "branding_logo_url":                None,
    }


# ── Shared stream handler (used by both phase 1 and resume) ──────────────────

# Nodes that only exist in phase 2 (after branding approval)
_PHASE2_NODES = {"branding_logo", "finance", "gtm", "pitch", "report"}
# The node that marks the end of phase 1 before the HITL interrupt
_PHASE1_END_NODE = "branding"


async def _stream_graph(job_id: str, input_state, config: dict, is_phase2: bool = False):
    """
    Core streaming loop. Handles both fresh starts and resumes.
    - input_state: full state dict for fresh start, None for resume from checkpoint
    - is_phase2: if True, pipeline runs branding_logo → finance → ... → report
                 and marks job "done" when astream() ends.
                 if False, pipeline runs until branding interrupt and marks
                 job "awaiting_branding_approval".

    IMPORTANT: For resumes, is_phase2 is determined by _resume_stuck_job by
    inspecting checkpoint.next — so this flag is always set correctly.
    """
    job     = job_get(job_id)
    partial = job.get("partial") or {}

    # Track which nodes actually ran in this stream so we can correctly
    # determine end state (avoids misclassifying a pre-branding resume as phase2)
    nodes_seen = set()

    try:
        async for chunk in _graph.astream(input_state, config, stream_mode="updates"):
            node_name  = list(chunk.keys())[0]
            raw        = chunk[node_name]

            # LangGraph 1.x stream_mode="updates" can return either:
            #   - a dict  (the state update from that node)
            #   - a tuple (state_update, metadata) in some versions
            # Normalise to always work with a plain dict.
            if isinstance(raw, tuple):
                node_state = raw[0] if raw else {}
            elif isinstance(raw, dict):
                node_state = raw
            else:
                node_state = {}

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

            if logo_url := node_state.get("branding_logo_url"):
                update_payload["logo_image_url"] = logo_url
                if isinstance(partial.get("branding_output"), dict):
                    partial["branding_output"]["logo_image_url"] = logo_url

            if report_path := node_state.get("final_report_path"):
                update_payload["report_path"] = report_path

            job_update(job_id, update_payload)
            print(f"[server] ✓ Node done: {node_name}")

        # ── Determine end state based on what actually ran ────────────────────
        # is_phase2 is the caller-supplied hint, but we double-check by seeing
        # whether any phase2 nodes ran (handles resume edge cases correctly).
        actually_phase2 = is_phase2 or bool(nodes_seen & _PHASE2_NODES)

        if actually_phase2 and "report" in nodes_seen:
            # Full pipeline finished — mark done and update projects table too
            job     = job_get(job_id)  # re-fetch for project_id
            project_id = job.get("project_id") if job else None

            job_update(job_id, {"status": "done"})
            print(f"[server] ✓ Pipeline complete for job {job_id}")

            # Update projects table so the frontend doesn't need to do it
            if project_id:
                _update_project_completed(project_id, partial)

        elif _PHASE1_END_NODE in nodes_seen and not actually_phase2:
            # Phase 1 finished at branding interrupt
            branding_data = partial.get("branding_output")
            job_update(job_id, {
                "status":               "awaiting_branding_approval",
                "branding_suggestions": branding_data,
            })
            print(f"[server] Interrupted at branding. Job {job_id} awaiting approval.")

        else:
            # Resume that ran some middle nodes (e.g. product, then hit branding)
            # Check if we ended at the branding interrupt
            current_state = await _graph.aget_state(config)
            if current_state and not current_state.next:
                # No next nodes — we're at the interrupt point
                branding_data = partial.get("branding_output")
                job_update(job_id, {
                    "status":               "awaiting_branding_approval",
                    "branding_suggestions": branding_data,
                })
                print(f"[server] Resume reached branding interrupt for job {job_id}")
            # else: partial run finished, keep status as "running" for next poll

    except asyncio.CancelledError:
        print(f"[server] Task cancelled for job {job_id}. Use /api/resume to recover.")
        raise

    except Exception as e:
        import traceback
        traceback.print_exc()
        job_update(job_id, {"status": "error", "errors": [str(e)]})


def _update_project_completed(project_id: str, partial: dict):
    """
    Update projects table to completed and upsert all agent outputs
    into analysis_results. This mirrors what the frontend hook does
    but runs server-side so it works even if the user's tab is closed.
    """
    sb = get_supabase()

    agent_map = {
        "planner":    "planner_output",
        "research":   "research_output",
        "competitor": "competitor_output",
        "product":    "product_output",
        "branding":   "branding_output",
        "finance":    "finance_output",
        "gtm":        "gtm_output",
        "pitch":      "pitch_output",
    }

    inserts = [
        {"project_id": project_id, "agent": agent, "output": partial[output_key]}
        for agent, output_key in agent_map.items()
        if partial.get(output_key) is not None
    ]

    if inserts:
        sb.table("analysis_results").upsert(
            inserts, on_conflict="project_id,agent"
        ).execute()

    sb.table("projects").update({"status": "completed"}).eq("id", project_id).execute()
    print(f"[server] ✓ Project {project_id} marked completed in Supabase")


# ── Phase 1 ───────────────────────────────────────────────────────────────────

async def run_pipeline_until_interrupt(job_id: str, request: PitchRequest):
    job_update(job_id, {"status": "running"})
    config = make_thread_config(job_id)
    state  = _build_initial_state(request)
    await _stream_graph(job_id, state, config, is_phase2=False)


# ── Phase 2 (after approval) ──────────────────────────────────────────────────

async def resume_pipeline_after_approval(job_id: str, approval: BrandingApprovalRequest):
    config = make_thread_config(job_id)

    # Inject approved values into the Redis checkpoint
    await _graph.aupdate_state(config, {
        "approved_branding_name":           approval.approved_name,
        "approved_branding_tagline":        approval.approved_tagline,
        "approved_branding_color_palette":  approval.approved_color_palette,
        "approved_branding_logo_direction": approval.approved_logo_direction,
        "branding_hitl_status":             "approved",
    })
    print(f"[server] Approved state injected for job {job_id}")

    job_update(job_id, {"status": "running"})
    # None = resume from checkpoint
    await _stream_graph(job_id, None, config, is_phase2=True)


# ── Resume a stuck job from its last Redis checkpoint ─────────────────────────

async def _resume_stuck_job(job_id: str):
    """
    Resumes a job interrupted mid-run (--reload, network drop, crash).
    Reads the Redis checkpoint to find exactly where to resume from.
    """
    job = job_get(job_id)
    if not job:
        print(f"[resume] Job {job_id} not found in Supabase")
        return

    config = make_thread_config(job_id)

    # Read the last saved checkpoint from Redis
    checkpoint = await _graph.aget_state(config)

    if not checkpoint or not checkpoint.values:
        # No checkpoint at all — this job never started or Redis TTL expired.
        # Cannot resume. Mark as error.
        print(f"[resume] No Redis checkpoint for job {job_id}. Cannot resume.")
        job_update(job_id, {
            "status": "error",
            "errors": ["No checkpoint found. The job may have expired from Redis. Please start a new analysis."]
        })
        return

    next_nodes = list(checkpoint.next) if checkpoint.next else []
    print(f"[resume] Job {job_id} checkpoint found. Next nodes: {next_nodes}")

    # No next nodes = graph is sitting at the branding interrupt point
    if not next_nodes:
        print(f"[resume] Job {job_id} is at branding interrupt. Restoring awaiting_approval status.")
        branding_data = job.get("partial", {}).get("branding_output")
        job_update(job_id, {
            "status":               "awaiting_branding_approval",
            "branding_suggestions": branding_data,
        })
        return

    # is_phase2 = next node is something after the branding interrupt
    is_phase2 = any(n in _PHASE2_NODES for n in next_nodes)
    print(f"[resume] is_phase2={is_phase2}, resuming from node(s): {next_nodes}")

    job_update(job_id, {"status": "running"})
    # Pass None — LangGraph reads from Redis checkpoint and continues
    await _stream_graph(job_id, None, config, is_phase2=is_phase2)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.post("/api/analyze")
async def analyze(request: PitchRequest, background_tasks: BackgroundTasks):
    """Start phase 1. Returns job_id immediately."""
    job_id = job_create(request.project_id)
    background_tasks.add_task(run_pipeline_until_interrupt, job_id, request)
    return {"job_id": job_id}


@app.post("/api/resume/{job_id}")
async def resume_job(job_id: str, background_tasks: BackgroundTasks):
    """
    Recover a job stuck in 'running' or 'error' state due to server restart.
    Resumes from the last saved Redis checkpoint automatically.
    Call this when a job gets stuck after a --reload or network interruption.
    """
    job = job_get(job_id)
    if not job:
        return {"error": "Job not found"}

    allowed = {"running", "error", "pending"}
    if job["status"] not in allowed:
        return {
    "error": f"Job status is '{job['status']}' — only \"running\", \"error\", or \"pending\" jobs can be resumed"
}

    background_tasks.add_task(_resume_stuck_job, job_id)
    return {"status": "resuming", "job_id": job_id}


@app.get("/api/partial/{job_id}")
async def partial_result(job_id: str):
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
    job = job_get(job_id)
    if not job:
        return {"error": "Job not found"}
    if job["status"] != "awaiting_branding_approval":
        return {"error": f"Job not awaiting approval (status: {job['status']})"}

    job_update(job_id, {
        "status": "branding_approved",
        "approved_branding": {
            "approved_name":           approval.approved_name,
            "approved_tagline":        approval.approved_tagline,
            "approved_color_palette":  approval.approved_color_palette,
            "approved_logo_direction": approval.approved_logo_direction,
        },
    })

    background_tasks.add_task(resume_pipeline_after_approval, job_id, approval)
    return {"status": "phase2_started"}


@app.post("/api/branding/regenerate/{job_id}")
async def regenerate_branding(job_id: str, req: RegenerateRequest):
    job = job_get(job_id)
    if not job:
        return {"error": "Job not found"}

    partial = job.get("partial") or {}

    from schemas.planner    import PlannerOutput
    from schemas.research   import MarketResearchOutput
    from schemas.competitor import CompetitorOutput
    from schemas.product    import ProductOutput

    def _try(cls, raw):
        try: return cls(**raw) if raw else None
        except Exception: return None

    planner_raw = partial.get("planner_output") or {}
    state = {
        "idea":          planner_raw.get("refined_idea", ""),
        "industry":      planner_raw.get("industry", ""),
        "target_market": planner_raw.get("target_market", ""),
        "budget": "bootstrapped", "stage": "idea",
        "planner_output":    _try(PlannerOutput,        partial.get("planner_output")),
        "research_output":   _try(MarketResearchOutput, partial.get("research_output")),
        "competitor_output": _try(CompetitorOutput,     partial.get("competitor_output")),
        "product_output":    _try(ProductOutput,        partial.get("product_output")),
        "branding_output": None, "finance_output": None, "gtm_output": None,
        "pitch_output": None, "final_report_path": None, "errors": None,
        "completed_agents": [], "branding_hitl_status": None,
        "approved_branding_name": None, "approved_branding_tagline": None,
        "approved_branding_color_palette": None, "approved_branding_logo_direction": None,
        "branding_logo_url": None,
    }

    loop   = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, regenerate_branding_section, state, req.section)
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