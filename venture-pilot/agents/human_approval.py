"""
agents/human_approval.py — HITL gate + targeted regeneration for branding.

Two nodes live here because they're two halves of one loop:
  - run_human_approval_node : PAUSES the graph, waits for founder action
  - run_branding_regenerate_node : regenerates ONE section, does not pause

Does NOT touch schemas/branding.py or agents/branding.py — this only
reads/writes the SAME BrandingOutput object already produced by the
branding agent, editing one field at a time.
"""

import os
from openai import OpenAI
from langgraph.types import interrupt

from state import AppState
from schemas.branding import BrandingOutput, NameSuggestion, ColorSwatch

SECTIONS = ["recommended_name", "recommended_tagline", "color_palette"]


def _default_approvals() -> dict:
    return {s: False for s in SECTIONS}


def run_human_approval_node(state: AppState) -> AppState:
    """
    Pauses the graph and waits for the founder to approve/edit/regenerate
    one section at a time. Resumes with a Command(resume=action_dict) where
    action_dict = {"section": ..., "action": "approve"|"edit"|"regenerate", "value": <optional>}
    """
    branding = state["branding_output"]
    approvals = state.get("branding_approvals") or _default_approvals()

    action = interrupt({
        "branding_output": branding.model_dump(),
        "approvals": approvals,
        "instruction": "Send one action: {section, action: approve|edit|regenerate, value?}"
    })

    section = action.get("section")
    act = action.get("action")

    if section not in SECTIONS:
        # Bad payload — re-pause without changing anything
        return {**state, "branding_approvals": approvals, "awaiting_branding_approval": True}

    if act == "approve":
        approvals[section] = True

    elif act == "edit":
        value = action.get("value")
        setattr(branding, section, value)
        approvals[section] = True

    elif act == "regenerate":
        approvals[section] = False  # will flip back to False; regenerate_section handles the rest

    return {
        **state,
        "branding_output": branding,
        "branding_approvals": approvals,
        "awaiting_branding_approval": act != "regenerate",  # if regenerating, we're not "waiting on human" this tick
        "_pending_action": act,
        "_pending_section": section,
    }


def route_after_human_approval(state: AppState) -> str:
    """Conditional edge: decide where to go after human_approval resumes."""
    if state.get("_pending_action") == "regenerate":
        return "regenerate_section"

    approvals = state.get("branding_approvals") or {}
    if all(approvals.get(s) for s in SECTIONS):
        return "finance"

    return "human_approval"  # loop back and interrupt again


# ── Small targeted prompts per section ──────────────────────────────────────

def _regenerate_name(client, idea: str, industry: str, current: str) -> str:
    resp = client.beta.chat.completions.parse(
        model="gpt-4o-mini",
        max_tokens=300,
        messages=[
            {"role": "system", "content": "You are a brand naming expert. Return ONLY the new name, nothing else. Must be original, not generic."},
            {"role": "user", "content": f"Startup idea: {idea}\nIndustry: {industry}\nCurrent name being replaced: {current}\nGive one new, different brand name."}
        ],
    )
    return resp.choices[0].message.content.strip()


def _regenerate_tagline(client, idea: str, industry: str, current: str) -> str:
    resp = client.beta.chat.completions.parse(
        model="gpt-4o-mini",
        max_tokens=300,
        messages=[
            {"role": "system", "content": "You are a brand copywriter. Return ONLY the new tagline, under 10 words, nothing else."},
            {"role": "user", "content": f"Startup idea: {idea}\nIndustry: {industry}\nCurrent tagline being replaced: {current}\nGive one new, different tagline."}
        ],
    )
    return resp.choices[0].message.content.strip()


class _PaletteResponse(BrandingOutput.__fields__["color_palette"].annotation.__args__[0].__class__.__base__):
    pass  # placeholder, replaced below with a clean model


from pydantic import BaseModel
from typing import List

class PaletteRegenOutput(BaseModel):
    color_palette: List[ColorSwatch]


def _regenerate_palette(client, idea: str, industry: str, current: list) -> list:
    resp = client.beta.chat.completions.parse(
        model="gpt-4o-mini",
        max_tokens=1200,
        messages=[
            {"role": "system", "content": "You are a brand color strategist. Return a new 5-color palette (Primary, Secondary, Accent, Background, Text) as structured output. Must be cohesive and different from the current one."},
            {"role": "user", "content": f"Startup idea: {idea}\nIndustry: {industry}\nCurrent palette being replaced: {current}\nGive a new 5-color palette."}
        ],
        response_format=PaletteRegenOutput
    )
    return resp.choices[0].message.parsed.color_palette


def run_branding_regenerate_node(state: AppState) -> AppState:
    """Regenerates exactly one section of branding_output, then loops back to human_approval."""
    section = state.get("_pending_section")
    branding = state["branding_output"]
    idea = state["idea"]
    industry = state["industry"]

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    if section == "recommended_name":
        branding.recommended_name = _regenerate_name(client, idea, industry, branding.recommended_name)
    elif section == "recommended_tagline":
        branding.recommended_tagline = _regenerate_tagline(client, idea, industry, branding.recommended_tagline)
    elif section == "color_palette":
        branding.color_palette = _regenerate_palette(client, idea, industry, [c.model_dump() for c in branding.color_palette])

    approvals = state.get("branding_approvals") or _default_approvals()
    approvals[section] = False  # still needs approval after regeneration

    return {
        **state,
        "branding_output": branding,
        "branding_approvals": approvals,
        "awaiting_branding_approval": True,
    }