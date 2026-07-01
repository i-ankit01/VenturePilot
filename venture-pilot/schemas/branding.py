"""
schemas/branding.py — Output contract for the Branding Agent.

Phase 1 output: AI generates one name suggestion, one tagline, color palette,
                logo direction. Pipeline pauses for founder HITL review.
Phase 2 output: After approval, logo image is generated and logo_image_url
                is populated.

Consumed by:
  - gtm.py      → brand_voice, messaging_pillars, approved_tagline
  - pitch.py    → approved_name, approved_tagline, positioning_statement
  - report.py   → everything
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum


class BrandPersonality(str, Enum):
    BOLD_DISRUPTOR   = "Bold Disruptor"
    TRUSTED_EXPERT   = "Trusted Expert"
    FRIENDLY_HELPER  = "Friendly Helper"
    PREMIUM_ELITE    = "Premium Elite"
    PLAYFUL_CREATIVE = "Playful Creative"
    EMPOWERING_ALLY  = "Empowering Ally"


class BrandTone(str, Enum):
    CONVERSATIONAL = "Conversational"
    PROFESSIONAL   = "Professional"
    WITTY          = "Witty"
    INSPIRATIONAL  = "Inspirational"
    DIRECT         = "Direct"
    EMPATHETIC     = "Empathetic"


class NameSuggestion(BaseModel):
    """Single brand name with full rationale."""
    name: str = Field(description="The brand name. Short, memorable, easy to spell.")
    rationale: str = Field(
        description=(
            "Why this name works. What does it evoke? "
            "e.g. 'Zap = instant. Invoice + Zap = InvoiceZap = you get paid fast.'"
        )
    )
    domain_available: str = Field(
        description="Domain availability assessment. e.g. 'invoicezap.io likely available.'"
    )
    tagline_fit: str = Field(
        description="A tagline written specifically for this name."
    )


class ColorSwatch(BaseModel):
    role: str = Field(description="e.g. 'Primary', 'Secondary', 'Accent', 'Background', 'Text'")
    hex_code: str = Field(description="Hex color code. e.g. '#1A73E8'")
    color_name: str = Field(description="Human-readable name. e.g. 'Electric Blue'")
    usage: str = Field(description="Where to use this color.")
    psychology: str = Field(description="Why this color fits this brand.")


class DomainSuggestion(BaseModel):
    domain: str = Field(description="Full domain. e.g. 'getinvoicezap.com'")
    rationale: str = Field(description="Why this domain works and availability likelihood.")


class TypographySuggestion(BaseModel):
    role: str = Field(description="e.g. 'Heading', 'Body', 'Accent / UI Labels'")
    font_name: str = Field(description="Font name. e.g. 'Inter'")
    source: str = Field(description="e.g. 'Google Fonts — free'")
    why: str = Field(description="Why this font fits the brand.")


class BrandingOutput(BaseModel):

    # ── NAME (single suggestion) ──────────────────────────────────────────────
    name_suggestion: NameSuggestion = Field(
        description=(
            "ONE strong brand name option. Be original — avoid generic names. "
            "Use wordplay, metaphor, portmanteau, or evocative language."
        )
    )

    # ── TAGLINE (single suggestion) ───────────────────────────────────────────
    tagline: str = Field(
        description=(
            "ONE strong tagline under 10 words. "
            "Make it punchy, specific to this brand, no corporate speak."
        )
    )

    # ── BRAND IDENTITY ────────────────────────────────────────────────────────
    brand_personality: BrandPersonality
    brand_tone: BrandTone
    brand_voice_description: str = Field(
        description="2-3 sentences describing the brand's voice and communication style."
    )

    # ── POSITIONING ───────────────────────────────────────────────────────────
    positioning_statement: str = Field(
        description=(
            "Format: 'For [audience] who [pain], [brand] is the [category] "
            "that [benefit] unlike [competitors] which [weakness].'"
        )
    )
    elevator_pitch: str = Field(
        description="2-3 sentence conversational pitch. No jargon. Ends with the hook."
    )

    # ── MESSAGING PILLARS ─────────────────────────────────────────────────────
    messaging_pillars: List[str] = Field(
        description="3 core themes every piece of brand communication reinforces.",
        min_length=3,
        max_length=3
    )

    # ── COLOR PALETTE ─────────────────────────────────────────────────────────
    color_palette: List[ColorSwatch] = Field(
        description=(
            "5-color brand palette: Primary, Secondary, Accent, Background, Text. "
            "Must work as a cohesive system. Justify every color psychologically."
        ),
        min_length=5,
        max_length=5
    )
    color_palette_rationale: str = Field(
        description="Overall rationale for the palette as a system."
    )

    # ── TYPOGRAPHY ────────────────────────────────────────────────────────────
    typography: List[TypographySuggestion] = Field(
        description="3 font recommendations: Heading, Body, Accent/UI. Google Fonts only.",
        min_length=3,
        max_length=3
    )

    # ── DOMAIN SUGGESTIONS ────────────────────────────────────────────────────
    domain_suggestions: List[DomainSuggestion] = Field(
        description=(
            "6 domain suggestions: 2×.com, 2×.io, 1×.co, 1×country-specific. "
            "All under 20 characters."
        ),
        min_length=6,
        max_length=6
    )

    # ── ICP ───────────────────────────────────────────────────────────────────
    icp_summary: str = Field(
        description=(
            "3-4 sentence vivid portrait of the ideal first customer. "
            "Give them a name, situation, frustration, and win."
        )
    )

    # ── LOGO DIRECTION ────────────────────────────────────────────────────────
    logo_direction: str = Field(
        description=(
            "Creative direction for logo design. Describe concept, not execution. "
            "e.g. 'A wordmark using a custom Z that doubles as a lightning bolt. "
            "Clean, geometric. Works in single color. No gradients.'"
        )
    )

    # ── BRAND RULES ───────────────────────────────────────────────────────────
    brand_dos: List[str] = Field(
        description="4 things the brand should always do.",
        min_length=4,
        max_length=4
    )
    brand_donts: List[str] = Field(
        description="4 things the brand should never do.",
        min_length=4,
        max_length=4
    )

    # ── HITL APPROVED FIELDS (set by founder, not LLM) ───────────────────────
    # These are populated after the founder reviews and approves in the UI.
    # Downstream agents (gtm, pitch) read from these, not name_suggestion/tagline.
    approved_name:           Optional[str] = Field(default=None)
    approved_tagline:        Optional[str] = Field(default=None)
    approved_color_palette:  Optional[List[ColorSwatch]] = Field(default=None)
    approved_logo_direction: Optional[str] = Field(default=None)

    # ── LOGO IMAGE (populated after phase 2 generation) ───────────────────────
    logo_image_url: Optional[str] = Field(
        default=None,
        description="Public Supabase Storage URL for the generated logo image."
    )