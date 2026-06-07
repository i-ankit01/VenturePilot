from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import uuid, os
from main import run_venture_pilot
from langgraph.graph import StateGraph
from graph.workflow import build_graph

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory job store (replace with Redis for production)
jobs = {}

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


# def run_pipeline_job(job_id: str, request: PitchRequest):
#     jobs[job_id]["status"] = "running"
#     try:
#         result = run_venture_pilot(
#             idea=request.idea,
#             industry=request.industry,
#             target_market=request.target_market,
#             budget=request.budget,
#             stage=request.stage,
#             verbose=False
#         )
#         jobs[job_id].update({
#             "status":           "done",
#             "completed_agents": result.get("completed_agents") or [],
#             "errors":           result.get("errors") or [],
#             "report_path":      result.get("final_report_path"),
#             "result":           result   # full state — all agent outputs
#         })
#     except Exception as e:
#         jobs[job_id].update({"status": "error", "errors": [str(e)]})

# to stream the output after each agent 
def run_pipeline_job(job_id: str, request: PitchRequest):
    jobs[job_id]["status"] = "running"
    jobs[job_id]["partial"] = {}   # ← stores agent outputs as they arrive

    graph = build_graph(checkpointing=False)

    initial_state = {
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
    }

    try:
        # .stream() yields {"node_name": state_snapshot} after each node
        for chunk in graph.stream(initial_state, stream_mode="updates"):
            node_name = list(chunk.keys())[0]
            node_state = chunk[node_name]

            # grab whatever output this agent just wrote
            output_key = f"{node_name}_output"
            if output_key in node_state and node_state[output_key] is not None:
                output = node_state[output_key]
                jobs[job_id]["partial"][output_key] = (
                    output.model_dump() if hasattr(output, "model_dump") else output
                )

            # track completed agents
            completed = node_state.get("completed_agents") or []
            jobs[job_id]["completed_agents"] = completed

            # special case: report writes final_report_path not *_output
            if "final_report_path" in node_state:
                jobs[job_id]["report_path"] = node_state["final_report_path"]

            print(f"[server] Agent done: {node_name}")

        jobs[job_id]["status"] = "done"

    except Exception as e:
        jobs[job_id].update({"status": "error", "errors": [str(e)]})



@app.post("/api/analyze")
async def analyze(request: PitchRequest, background_tasks: BackgroundTasks):
    """Start the pipeline. Returns a job_id immediately."""
    job_id = str(uuid.uuid4())
    jobs[job_id] = {"status": "pending", "completed_agents": [], "errors": []}
    background_tasks.add_task(run_pipeline_job, job_id, request)
    return {"job_id": job_id}


@app.get("/api/status/{job_id}")
async def status(job_id: str):
    """Poll this endpoint to track pipeline progress."""
    if job_id not in jobs:
        return {"error": "Job not found"}
    job = jobs[job_id]
    return {
        "job_id":           job_id,
        "status":           job["status"],
        "completed_agents": job.get("completed_agents", []),
        "errors":           job.get("errors", []),
    }


@app.get("/api/result/{job_id}")
async def result(job_id: str):
    """Get the full result once status == 'done'."""
    job = jobs.get(job_id)
    if not job or job["status"] != "done":
        return {"error": "Not ready"}

    state = job["result"]
    pitch = state.get("pitch_output")

    return {
        "completed_agents": job["completed_agents"],
        "research":    _serialize(state.get("research_output")),
        "competitor":  _serialize(state.get("competitor_output")),
        "product":     _serialize(state.get("product_output")),
        "branding":    _serialize(state.get("branding_output")),
        "finance":     _serialize(state.get("finance_output")),
        "gtm":         _serialize(state.get("gtm_output")),
        "pitch":       _serialize(pitch),
        "deck_title":  pitch.deck_title if pitch else None,
    }


@app.get("/api/download/{job_id}")
async def download(job_id: str):
    """Download the generated .pptx file."""
    job = jobs.get(job_id)
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
    job = jobs.get(job_id)
    if not job:
        return {"error": "Job not found"}

    return {
        "status":           job["status"],
        "completed_agents": job.get("completed_agents", []),
        "partial":          job.get("partial", {}),
        "report_path":      job.get("report_path"),
        "errors":           job.get("errors", []),
    }


def _serialize(obj):
    """Convert Pydantic model to dict safely."""
    if obj is None:
        return None
    if hasattr(obj, "model_dump"):
        return obj.model_dump()
    return obj