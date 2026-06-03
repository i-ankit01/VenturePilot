"""
agents/research.py — The Research Agent.

This is the BASE agent. Every other agent depends on its output.

What it does:
  1. Reads idea, industry, target_market from AppState
  2. Builds smart search queries from that context
  3. Runs 4 web searches via Tavily
  4. Sends all search results to OpenAI
  5. GPT extracts structured MarketResearchOutput
  6. Writes result back into AppState

Why structured output via JSON?
  Downstream agents need reliable fields (market_size, pain_points, etc.)
  If the LLM returns free text, parsing becomes fragile.
  JSON + Pydantic = guaranteed shape, validated at runtime.
"""

import os
import json
from dotenv import load_dotenv
from openai import OpenAI

from state import AppState
from schemas.research import MarketResearchOutput
from tools.web_search import WebSearchTool

load_dotenv()


# ── Prompt ────────────────────────────────────────────────────────────────────

RESEARCH_SYSTEM_PROMPT = """
You are an expert startup market researcher.

You will be given:
- A startup idea
- The industry it operates in
- The target market
- Real web search results with current market data

Your job is to analyze this information and return a structured JSON object.

RULES:
- Return ONLY valid JSON. No markdown, no explanation, no preamble.
- Every field must be filled. Never return null or empty strings.
- Be specific and data-driven. Use numbers from the search results where possible.
- If data is missing from search results, use your training knowledge but flag it.
- The JSON must exactly match this schema:

{
  "problem_statement": "string — 2-3 lines describing the core problem",
  "target_audience": "string — specific who, where, demographics",
  "market_size": "string — TAM/SAM/SOM with numbers",
  "market_trends": ["trend1", "trend2", "trend3", "trend4"],
  "pain_points": ["pain1", "pain2", "pain3", "pain4"],
  "opportunity_gap": "string — what is missing and why",
  "key_assumptions": ["assumption1", "assumption2", "assumption3"],
  "sources": ["url1", "url2"]
}
"""


def build_search_queries(idea: str, industry: str, target_market: str) -> list[str]:
    """
    Build targeted search queries from the startup context.

    4 queries covering:
      1. Market size (need numbers for finance agent later)
      2. Pain points (feeds product + branding)
      3. Industry trends (feeds GTM)
      4. Existing solutions + gaps (feeds competitor agent)
    """
    return [
        f"{industry} market size revenue 2024 2025",
        f"{target_market} pain points problems {idea}",
        f"{industry} trends growth opportunities 2025",
        f"problems with existing {industry} solutions gaps"
    ]


def run_research_agent(state: AppState) -> AppState:
    """
    Main entry point for the research agent.
    LangGraph will call this function as a node.

    Takes AppState → returns updated AppState with research_output filled.
    """

    print("\n[Research Agent] Starting market research...")

    idea = state["idea"]
    industry = state["industry"]
    target_market = state["target_market"]

    # ── Step 1: Build and run searches ────────────────────────────────────
    queries = build_search_queries(idea, industry, target_market)
    print(f"[Research Agent] Running {len(queries)} searches...")

    search_tool = WebSearchTool()
    raw_results = search_tool.search_multiple(queries, max_results_per_query=4)
    formatted_results = search_tool.format_for_llm(raw_results)

    print("[Research Agent] Search complete. Sending to GPT...")

    # ── Step 2: Build the user prompt ─────────────────────────────────────
    user_prompt = f"""
        Startup Idea: {idea}
        Industry: {industry}
        Target Market: {target_market}
        Budget: {state.get("budget", "Not specified")}

        --- SEARCH RESULTS ---
        {formatted_results}
        --- END SEARCH RESULTS ---

        Now analyze the above and return the structured JSON.
        """

    # ── Step 3: Call OpenAI ────────────────────────────────────────────────
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    response = client.beta.chat.completions.parse(
        model="gpt-4o-mini",
        max_tokens=2000,
        messages=[
            {"role": "system", "content": RESEARCH_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ],
        response_format=MarketResearchOutput   #  pass your Pydantic model directly
    )

    research_output = response.choices[0].message.parsed  #  already a MarketResearchOutput

    # ── Step 4: Parse and validate with Pydantic ──────────────────────────
    if research_output is None:
        errors = state.get("errors") or []
        errors.append("research_agent: model refused or failed to return structured output")
        return {**state, "errors": errors}  # soft fail, don't crash the graph

    print("[Research Agent] ✓ Research complete and validated.")

    # ── Step 5: Write back to state ────────────────────────────────────────
    completed = state.get("completed_agents") or []
    completed.append("research")

    return {
        **state,
        "research_output": research_output,
        "completed_agents": completed
    }


# ── Standalone test (run this file directly to test without LangGraph) ────────

if __name__ == "__main__":
    """
    Test the research agent in isolation.
    No LangGraph needed — just hardcode a state and run.

    Usage:
        cd venture-pilot
        source .venv/bin/activate
        python agents/research.py
    """

    test_state: AppState = {
        "idea": "SaaS tool for freelancers to manage invoices and get paid faster",
        "industry": "fintech / invoicing software",
        "target_market": "freelancers and independent contractors in India",
        "budget": "$5000",
        "stage": "idea",
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

    result = run_research_agent(test_state)

    print("\n" + "="*60)
    print("RESEARCH OUTPUT:")
    print("="*60)

    if result.get("research_output"):
        output = result["research_output"]
        print(f"\nProblem:        {output.problem_statement}")
        print(f"Audience:       {output.target_audience}")
        print(f"Market Size:    {output.market_size}")
        print(f"\nTrends:")
        for t in output.market_trends:
            print(f"  - {t}")
        print(f"\nPain Points:")
        for p in output.pain_points:
            print(f"  - {p}")
        print(f"\nOpportunity:    {output.opportunity_gap}")
        print(f"\nAssumptions:")
        for a in output.key_assumptions:
            print(f"  - {a}")
        print(f"\nSources: {output.sources}")
    else:
        print("Agent failed. Errors:", result.get("errors"))