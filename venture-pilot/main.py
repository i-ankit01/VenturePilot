"""
main.py — Entry point for Venture Pilot.

Runs the full agent pipeline from a single function call.

Usage (CLI):
    cd venture-pilot
    source .venv/bin/activate
    python main.py

Usage (import):
    from main import run_venture_pilot
    result = run_venture_pilot(
        idea="SaaS invoicing tool for freelancers",
        industry="Fintech",
        target_market="Freelancers in India",
        budget="$5000",
        stage="idea"
    )
    print(result["final_report_path"])
"""

import time
from graph.workflow import build_graph, print_graph_structure
from state import AppState


def run_venture_pilot(
    idea:          str,
    industry:      str,
    target_market: str,
    budget:        str  = "bootstrapped",
    stage:         str  = "idea",
    verbose:       bool = True,
) -> AppState:
    """
    Run the full Venture Pilot pipeline.

    Args:
        idea:          Raw startup idea text.
        industry:      Industry or domain.
        target_market: Target customer segment.
        budget:        Available budget string.
        stage:         Startup stage (idea / validation / mvp / scaling).
        verbose:       Print graph structure and timing info.

    Returns:
        Final AppState with all agent outputs filled.
        result["final_report_path"] is the path to the generated .pptx file.
    """

    if verbose:
        print_graph_structure()

    # ── Build initial state ───────────────────────────────────────────────
    initial_state: AppState = {
        "idea":           idea,
        "industry":       industry,
        "target_market":  target_market,
        "budget":         budget,
        "stage":          stage,

        # all outputs start empty
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

    # ── Build and run the graph ───────────────────────────────────────────
    graph = build_graph(checkpointing=False)

    print("\n" + "="*55)
    print("STARTING VENTURE PILOT PIPELINE")
    print("="*55)
    print(f"  Idea:    {idea[:70]}...")
    print(f"  Market:  {target_market}")
    print(f"  Budget:  {budget}")
    print(f"  Stage:   {stage}")
    print("="*55 + "\n")

    start = time.time()
    result = graph.invoke(initial_state)
    elapsed = time.time() - start

    # ── Print summary ─────────────────────────────────────────────────────
    print("\n" + "="*55)
    print("PIPELINE COMPLETE")
    print("="*55)

    completed = result.get("completed_agents") or []
    errors    = result.get("errors") or []

    print(f"  Completed agents : {', '.join(completed)}")
    print(f"  Total time       : {elapsed:.1f}s")

    if result.get("final_report_path"):
        print(f"  Output deck      : {result['final_report_path']}")
    else:
        print("  Output deck      : NOT generated (check errors)")

    if errors:
        print(f"\n  ⚠ Errors ({len(errors)}):")
        for e in errors:
            print(f"    - {e}")

    print("="*55)
    return result


# ── CLI entrypoint ────────────────────────────────────────────────────────────

if __name__ == "__main__":
    # Edit these to test with your own idea
    result = run_venture_pilot(
        idea=(
            "A SaaS tool for freelancers in India to create GST-compliant invoices, "
            "send them via WhatsApp, and get paid automatically through UPI "
            "with smart payment reminders so they never have to chase clients again."
        ),
        industry       = "Fintech / Invoice Management",
        target_market  = "Freelance designers and developers in India aged 22-35",
        budget         = "₹3,00,000 ($5,000) — bootstrapped",
        stage          = "idea",
        verbose        = True,
    )