"""
agents/planner.py — The Planner Agent.

Runs FIRST in the graph, before research.

What it does:
  1. Takes raw user input (messy idea text, rough budget, vague market)
  2. Uses GPT to normalize and enrich it into clean structured fields
  3. Writes PlannerOutput into state
  4. Research agent then reads those clean fields to build search queries

Why this matters:
  Without planner, research gets inputs like:
    idea = "app for paying invoices idk"
    industry = "tech"
    target = "people who freelance"

  With planner, research gets:
    idea = "InvoiceZap helps Indian freelancers get paid on time by
            automating invoice reminders and follow-ups."
    industry = "Fintech - Invoice Management"
    target = "Freelance designers and developers in India, aged 22-35"

  That difference = much better search queries = much better research output.

NOTE: Planner does NOT use web search.
  It's pure LLM reasoning — intake, parse, enrich, structure.
"""

import os
from dotenv import load_dotenv
from openai import OpenAI

from state import AppState
from schemas.planner import PlannerOutput

load_dotenv()


# ── Prompt ────────────────────────────────────────────────────────────────────

PLANNER_SYSTEM_PROMPT = """
You are an expert startup strategist and business analyst.

You will receive a raw startup idea from a user — it may be vague, poorly worded,
or missing details. Your job is to:

1. Understand the core intent behind the idea
2. Refine and structure it into clean, specific, actionable fields
3. Add strategic context (one-liner, unique angle, geography)
4. Return a structured JSON — nothing else

RULES:
- Return ONLY valid JSON. No markdown, no explanation, no preamble.
- Be specific. Vague outputs make every downstream agent worse.
- If the user gives a vague target market like "everyone" or "businesses",
  narrow it down to the most logical primary segment.
- If budget is missing, assume "bootstrapped / self-funded".
- If stage is unclear, default to "idea".
- The unique_angle should be genuinely creative — not just "better UX".
- agents_to_run should always be the full list in order.
"""


def run_planner_agent(state: AppState) -> AppState:
    """
    Main entry point for the planner agent.
    LangGraph will call this as the first node in the graph.

    Takes AppState → returns updated AppState with planner_output
    AND updates the cleaned idea/industry/target_market fields
    so research agent reads the refined versions.
    """

    print("\n[Planner Agent] Analyzing and structuring your idea...")

    raw_idea        = state["idea"]
    raw_industry    = state.get("industry", "not specified")
    raw_market      = state.get("target_market", "not specified")
    raw_budget      = state.get("budget", "not specified")
    raw_stage       = state.get("stage", "not specified")

    # ── Build the user prompt ─────────────────────────────────────────────
    user_prompt = f"""
        Here is the raw startup input from a user:

        Idea:          {raw_idea}
        Industry:      {raw_industry}
        Target Market: {raw_market}
        Budget:        {raw_budget}
        Stage:         {raw_stage}

        Analyze this and return the structured JSON with all fields filled.
    """

    # ── Call OpenAI with structured output ────────────────────────────────
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    response = client.beta.chat.completions.parse(
        model="gpt-4o-mini",
        max_tokens=1500,
        messages=[
            {"role": "system", "content": PLANNER_SYSTEM_PROMPT},
            {"role": "user",   "content": user_prompt}
        ],
        response_format=PlannerOutput   # Pydantic model passed directly
    )

    planner_output = response.choices[0].message.parsed

    if planner_output is None:
        errors = state.get("errors") or []
        errors.append("planner_agent: model refused or failed to return structured output")
        return {**state, "errors": errors}

    print("[Planner Agent] ✓ Idea structured successfully.")
    print(f"[Planner Agent]   One-liner: {planner_output.one_liner}")
    print(f"[Planner Agent]   Type:      {planner_output.startup_type}")
    print(f"[Planner Agent]   Stage:     {planner_output.stage}")

    # ── Write back to state ───────────────────────────────────────────────
    # IMPORTANT: also overwrite the top-level idea/industry/target_market
    # with the refined versions so research agent gets clean inputs
    completed = state.get("completed_agents") or []
    completed.append("planner")

    return {
        **state,
        "idea":           planner_output.refined_idea,      # ← overwrite with refined
        "industry":       planner_output.industry,          # ← overwrite with refined
        "target_market":  planner_output.target_market,     # ← overwrite with refined
        "budget":         planner_output.budget,
        "stage":          planner_output.stage.value,
        "planner_output": planner_output,
        "completed_agents": completed
    }


# ── Standalone test ───────────────────────────────────────────────────────────

if __name__ == "__main__":
    """
    Test planner in isolation with a deliberately vague idea.

    Usage:
        cd venture-pilot
        source .venv/bin/activate
        python agents/planner.py
    """

    test_state: AppState = {
        # intentionally vague — this is what real users give you
        "idea": "i want to build a startup on fitness for young people",
        "industry": "tech",
        "target_market": "youth",
        "budget": "5000 dollars",
        "stage": "just an idea",
        "planner_output": None,
        "research_output": None,
        "competitor_output": None,
        "product_output": None,
        "branding_output": None,
        "finance_output": None,
        "gtm_output": None,
        "pitch_output": None,
        "final_report_path": None,
        "errors": None,
        "completed_agents": None,
    }

    result = run_planner_agent(test_state)

    print("\n" + "="*60)
    print("PLANNER OUTPUT:")
    print("="*60)

    if result.get("planner_output"):
        p = result["planner_output"]
        print(f"\nRefined Idea:    {p.refined_idea}")
        print(f"Industry:        {p.industry}")
        print(f"Target Market:   {p.target_market}")
        print(f"Startup Type:    {p.startup_type}")
        print(f"Stage:           {p.stage}")
        print(f"Budget:          {p.budget}")
        print(f"\nOne-liner:       {p.one_liner}")
        print(f"Core Problem:    {p.core_problem}")
        print(f"Unique Angle:    {p.unique_angle}")
        print(f"Geography:       {p.geography}")
        print(f"\nAgents to run:   {p.agents_to_run}")

        print("\n--- State fields overwritten for research agent ---")
        print(f"  idea:          {result['idea']}")
        print(f"  industry:      {result['industry']}")
        print(f"  target_market: {result['target_market']}")
    else:
        print("Agent failed. Errors:", result.get("errors"))