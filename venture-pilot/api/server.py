# uvicorn api.server:app --reload --port 8000

import asyncio
import os
import uuid

from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

from graph.workflow import build_graph
from langgraph.types import Command
from routers import investors
from routers import auth_google
from api.jobs_store import save_job, get_job, update_job, list_job_ids_by_status

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(investors.router)
app.include_router(auth_google.router)


class PitchRequest(BaseModel):
    idea: str
    industry: str
    target_market: str
    budget: str = "bootstrapped"
    stage: str = "idea"


class JobStatus(BaseModel):
    job_id: str
    status: str           # "pending" | "running" | "done" | "error"
    completed_agents: list[str] = []
    errors: list[str] = []
    report_path: str | None = None


def _new_job_record() -> dict:
    return {
        "status": "pending",
        "completed_agents": [],
        "errors": [],
        "partial": {},
        "result": {},
        "report_path": None,
    }


def _serialize_state(state: dict) -> dict:
    """Node output values can be Pydantic models — those aren't JSON
    serializable, and everything going into the job store has to be
    (Redis just stores strings). Convert anything with model_dump()."""
    out = {}
    for k, v in state.items():
        out[k] = v.model_dump() if hasattr(v, "model_dump") else v
    return out


def _stream_graph(job_id: str, graph, config: dict, input_state):
    """
    Runs graph.stream() and pushes every node's output into the job record
    in Redis as it arrives. Shared by both the fresh-run path and the
    resume path — the only difference between them is `input_state`:
    a full initial state to start fresh, or `None` to resume from whatever
    checkpoint already exists for this thread_id.
    """
    update_job(job_id, status="running")

    try:
        # .stream() yields {"node_name": state_snapshot} after each node
        for chunk in graph.stream(input_state, stream_mode="updates", config=config):
            node_name = list(chunk.keys())[0]
            node_state = chunk[node_name]

            job = get_job(job_id) or _new_job_record()

            result = job.get("result", {})
            result.update(_serialize_state(node_state))

            # grab whatever output this agent just wrote
            partial = job.get("partial", {})
            output_key = f"{node_name}_output"
            if output_key in node_state and node_state[output_key] is not None:
                output = node_state[output_key]
                partial[output_key] = (
                    output.model_dump() if hasattr(output, "model_dump") else output
                )

            # track completed agents
            completed = node_state.get("completed_agents") or job.get("completed_agents", [])

            updates = {
                "result": result,
                "partial": partial,
                "completed_agents": completed,
            }

            # special case: report writes final_report_path not *_output
            if "final_report_path" in node_state:
                updates["report_path"] = node_state["final_report_path"]

            update_job(job_id, **updates)
            print(f"[server] job={job_id} agent done: {node_name}")

                # ── NEW: figure out WHY the stream stopped ──────────────────────
        snapshot = graph.get_state(config)

        if snapshot and snapshot.next:
            # Graph didn't finish. Either it's paused on an interrupt()
            # (human_approval) or it crashed mid-node. Tell them apart by
            # checking for a live interrupt payload on the pending task.
            interrupt_payload = None
            for task in snapshot.tasks:
                if task.interrupts:
                    interrupt_payload = task.interrupts[0].value
                    break

            if interrupt_payload is not None:
                update_job(
                    job_id,
                    status="awaiting_branding_approval",
                    branding_review=interrupt_payload,
                )
                print(f"[server] job={job_id} paused for branding approval")
            else:
                # Stopped mid-node without an interrupt = crash. Leave status
                # as "running" so the startup crash-recovery sweep picks it up.
                print(f"[server] job={job_id} stream ended unexpectedly, next={snapshot.next}")
        else:
            update_job(job_id, status="done")

    except Exception as e:
        job = get_job(job_id) or _new_job_record()
        errors = job.get("errors", [])
        errors.append(str(e))
        update_job(job_id, status="error", errors=errors)


def run_pipeline_job(job_id: str, request: PitchRequest):
    """Fresh run: starts the graph from PLANNER with a brand-new state."""
    graph = build_graph(checkpointing=True)
    config = {"configurable": {"thread_id": job_id}}

    initial_state = {
        "idea":              request.idea,
        "industry":          request.industry,
        "target_market":     request.target_market,
        "budget":            request.budget,
        "stage":             request.stage,
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
    }

    _stream_graph(job_id, graph, config, initial_state)


def resume_pipeline_job(job_id: str, resume_payload: dict | None = None):
    """
    Resume a job. Two cases, same mechanism:
      - resume_payload is None  → crash recovery: "just continue" (used by
        the manual /api/resume endpoint with no body, and the startup sweep)
      - resume_payload is a dict → HITL resume: becomes Command(resume=...),
        which is what interrupt() inside human_approval_node returns
    """
    graph = build_graph(checkpointing=True)
    config = {"configurable": {"thread_id": job_id}}

    snapshot = graph.get_state(config)

    if snapshot is None or not snapshot.next:
        job = get_job(job_id)
        if job and job.get("status") in ("running", "pending", "awaiting_branding_approval"):
            errors = job.get("errors", [])
            errors.append("No resumable checkpoint found for this job")
            update_job(job_id, status="error", errors=errors)
        return

    input_state = Command(resume=resume_payload) if resume_payload is not None else None

    print(f"[server] resuming job={job_id} from node(s): {snapshot.next}")
    _stream_graph(job_id, graph, config, input_state)


@app.on_event("startup")
async def resume_interrupted_jobs_on_startup():
    """
    If the server crashed or was redeployed while jobs were mid-flight,
    their records in Redis are still sitting at status "running"/"pending"
    with no BackgroundTask left alive to finish them. On startup, find
    those and kick off a resume for each from the LangGraph checkpoint,
    instead of leaving them stuck forever.
    """
    stuck_ids = list_job_ids_by_status("running", "pending")
    for job_id in stuck_ids:
        print(f"[startup] found interrupted job {job_id}, attempting resume")
        asyncio.create_task(asyncio.to_thread(resume_pipeline_job, job_id))


@app.post("/api/analyze")
async def analyze(request: PitchRequest, background_tasks: BackgroundTasks):
    """Start the pipeline. Returns a job_id immediately."""
    job_id = str(uuid.uuid4())
    save_job(job_id, _new_job_record())
    background_tasks.add_task(run_pipeline_job, job_id, request)
    return {"job_id": job_id}


class BrandingReviewAction(BaseModel):
    section: str        # "recommended_name" | "recommended_tagline" | "color_palette"
    action: str          # "approve" | "edit" | "regenerate"
    value: str | list | None = None  # required for "edit"


@app.post("/api/resume/{job_id}")
async def resume(job_id: str, background_tasks: BackgroundTasks, body: BrandingReviewAction | None = None):
    """
    No body → crash-recovery resume (continue from wherever it stopped).
    Body present → HITL resume (founder approved/edited/regenerated a section).
    """
    job = get_job(job_id)
    if not job:
        return {"error": "Job not found"}
    if job.get("status") == "done":
        return {"error": "Job already completed"}

    resume_payload = body.model_dump() if body else None
    background_tasks.add_task(resume_pipeline_job, job_id, resume_payload)
    return {"job_id": job_id, "status": "resuming"}



@app.get("/api/status/{job_id}")
async def status(job_id: str):
    """Poll this endpoint to track pipeline progress."""
    job = get_job(job_id)
    if not job:
        return {"error": "Job not found"}
    return {
        "job_id":           job_id,
        "status":           job["status"],
        "completed_agents": job.get("completed_agents", []),
        "errors":           job.get("errors", []),
    }


@app.get("/api/result/{job_id}")
async def result(job_id: str):
    """Get the full result once status == 'done'."""
    job = get_job(job_id)
    if not job or job["status"] != "done":
        return {"error": "Not ready"}

    state = job.get("result", {})
    pitch = state.get("pitch_output")

    return {
        "completed_agents": job["completed_agents"],
        "research":    state.get("research_output"),
        "competitor":  state.get("competitor_output"),
        "product":     state.get("product_output"),
        "branding":    state.get("branding_output"),
        "finance":     state.get("finance_output"),
        "gtm":         state.get("gtm_output"),
        "pitch":       pitch,
        "deck_title":  pitch.get("deck_title") if isinstance(pitch, dict) else None,
    }


@app.get("/api/download/{job_id}")
async def download(job_id: str):
    """Download the generated .pptx file."""
    job = get_job(job_id)
    if not job or not job.get("report_path"):
        return {"error": "File not ready"}
    path = job["report_path"]
    if not os.path.exists(path):
        return {"error": "File not found on disk"}
    return FileResponse(
        path,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        filename=os.path.basename(path)
    )


@app.get("/api/partial/{job_id}")
async def partial_result(job_id: str):
    """
    Returns whatever agent outputs are available RIGHT NOW.
    Frontend polls this every few seconds to show progressive results.
    """
    job = get_job(job_id)
    if not job:
        return {"error": "Job not found"}

    return {
        "status":           job["status"],
        "completed_agents": job.get("completed_agents", []),
        "partial":          job.get("partial", {}),
        "errors":           job.get("errors", []),
    }


@app.get("/api/branding-review/{job_id}")
async def branding_review(job_id: str):
    """Frontend polls/checks this to render the branding approval overlay."""
    job = get_job(job_id)
    if not job:
        return {"error": "Job not found"}
    if job.get("status") != "awaiting_branding_approval":
        return {"status": job.get("status")}
    return {
        "status": "awaiting_branding_approval",
        "review": job.get("branding_review"),  # {branding_output, approvals, instruction}
    }