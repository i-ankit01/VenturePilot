"""
schemas/branding.py — Output contract for the Branding Agent.

This is the most creative schema in the pipeline.
It takes competitive intel + product definition and generates
a complete brand identity system ready for a designer to execute.

Consumed by:
  - gtm.py      → uses brand_voice, messaging_pillars, taglines
                  (to craft channel-specific marketing copy)
  - pitch.py    → uses brand_names, tagline, positioning_statement
                  (cover slide + brand section of deck)
  - report.py   → uses everything
                  (full branding chapter in the final report)
"""

from pydantic import BaseModel, Field
from typing import List
from enum import Enum


class BrandPersonality(str, Enum):
    """
    The dominant emotional tone of the brand.
    Based on classic brand archetype theory.
    """
    BOLD_DISRUPTOR   = "Bold Disruptor"    # challengers, rebels — Uber, Notion
    TRUSTED_EXPERT   = "Trusted Expert"    # authority, safety — Stripe, Zoho
    FRIENDLY_HELPER  = "Friendly Helper"   # warm, approachable — Mailchimp, Slack
    PREMIUM_ELITE    = "Premium Elite"     # luxury, exclusivity — Figma, Linear
    PLAYFUL_CREATIVE = "Playful Creative"  # fun, energetic — Duolingo, Framer
    EMPOWERING_ALLY  = "Empowering Ally"   # champion of the underdog — Canva, Gumroad


class BrandTone(str, Enum):
    CONVERSATIONAL = "Conversational"   # casual, like a friend
    PROFESSIONAL   = "Professional"     # formal but not stiff
    WITTY          = "Witty"            # clever, light humour
    INSPIRATIONAL  = "Inspirational"    # motivating, aspirational
    DIRECT         = "Direct"           # no fluff, gets to the point
    EMPATHETIC     = "Empathetic"       # understanding, warm


class NameSuggestion(BaseModel):
    """A single brand name option with full rationale."""
    name: str = Field(description="The brand name. Short, memorable, easy to spell.")
    rationale: str = Field(
        description=(
            "Why this name works for this brand. "
            "What does it evoke? What does it hint at? "
            "e.g. 'Zap = instant. Invoice + Zap = InvoiceZap = you get paid fast.'"
        )
    )
    domain_available: str = Field(
        description=(
            "Likely domain availability assessment. "
            "e.g. 'invoicezap.com likely taken — try invoicezap.io or "
            "getinvoicezap.com or zap.invoice — all likely available.'"
        )
    )
    tagline_fit: str = Field(
        description="A tagline written specifically for this name."
    )


class ColorSwatch(BaseModel):
    """A single color in the palette."""
    role: str = Field(
        description=(
            "The role of this color in the palette. "
            "e.g. 'Primary', 'Secondary', 'Accent', 'Background', 'Text'"
        )
    )
    hex_code: str = Field(
        description="Hex color code. e.g. '#1A73E8'"
    )
    color_name: str = Field(
        description="Human-readable color name. e.g. 'Electric Blue', 'Warm Slate'"
    )
    usage: str = Field(
        description=(
            "Where and how to use this color. "
            "e.g. 'CTA buttons, primary headers, logo mark' or "
            "'Background of cards, section dividers'"
        )
    )
    psychology: str = Field(
        description=(
            "Why this color fits this brand psychologically. "
            "e.g. 'Blue = trust and reliability, critical for a fintech product'"
        )
    )


class DomainSuggestion(BaseModel):
    """A domain name suggestion with rationale."""
    domain: str = Field(description="Full domain. e.g. 'getinvoicezap.com'")
    rationale: str = Field(
        description="Why this domain works and availability likelihood."
    )


class TypographySuggestion(BaseModel):
    """Font pairing recommendation."""
    role: str = Field(description="e.g. 'Heading', 'Body', 'Accent / UI Labels'")
    font_name: str = Field(description="Font name. e.g. 'Inter', 'Sora', 'DM Sans'")
    source: str = Field(description="Where to get it. e.g. 'Google Fonts — free'")
    why: str = Field(
        description="Why this font fits the brand personality and target audience."
    )


class BrandingOutput(BaseModel):

    # ── NAME SUGGESTIONS ─────────────────────────────────────────────────────
    name_suggestions: List[NameSuggestion] = Field(
        description=(
            "5 distinct brand name options. "
            "Vary the style — one literal, one abstract, one metaphor, "
            "one portmanteau, one action word. Each must feel distinct."
        ),
        min_length=5,
        max_length=5
    )

    recommended_name: str = Field(
        description=(
            "The single strongest name from the list above, with a one-line reason. "
            "e.g. 'InvoiceZap — short, action-oriented, instantly communicates speed.'"
        )
    )

    # ── TAGLINES ─────────────────────────────────────────────────────────────
    taglines: List[str] = Field(
        description=(
            "5 tagline options. Mix styles: "
            "outcome-focused ('Get paid. On time. Every time.'), "
            "pain-focused ('Because chasing payments is not your job.'), "
            "identity-focused ('Built for the way India freelances.'), "
            "punchy one-word concept ('Invoicing, unleashed.'), "
            "question-form ('What if getting paid was the easy part?'). "
            "All must be under 10 words."
        ),
        min_length=5,
        max_length=5
    )

    recommended_tagline: str = Field(
        description="The single strongest tagline with a one-line reason why."
    )

    # ── BRAND IDENTITY ───────────────────────────────────────────────────────
    brand_personality: BrandPersonality = Field(
        description="The dominant brand archetype that fits this startup."
    )

    brand_tone: BrandTone = Field(
        description="Primary tone of voice for all brand communication."
    )

    brand_voice_description: str = Field(
        description=(
            "2-3 sentences describing the brand's voice. "
            "e.g. 'InvoiceZap speaks like a sharp, witty friend who happens to "
            "know everything about money. Direct, never preachy. "
            "Celebrates the win of getting paid — not the complexity of invoicing.'"
        )
    )

    # ── POSITIONING ──────────────────────────────────────────────────────────
    positioning_statement: str = Field(
        description=(
            "The formal positioning statement. "
            "Format: 'For [target audience] who [pain point], "
            "[brand name] is the [category] that [key benefit] "
            "unlike [competitor set] which [competitor weakness].' "
            "This is the internal compass for all marketing decisions."
        )
    )

    elevator_pitch: str = Field(
        description=(
            "A 2-3 sentence pitch a founder would say at a networking event. "
            "No jargon. Conversational. Ends with the hook."
        )
    )

    # ── MESSAGING PILLARS ────────────────────────────────────────────────────
    messaging_pillars: List[str] = Field(
        description=(
            "3 core themes every piece of brand communication should reinforce. "
            "These are strategic, not slogans. "
            "e.g. 'Speed — everything about the brand feels instant', "
            "'Trust — numbers are serious, the brand treats them that way', "
            "'Independence — built for people who work for themselves'"
        ),
        min_length=3,
        max_length=3
    )

    # ── COLOR PALETTE ────────────────────────────────────────────────────────
    color_palette: List[ColorSwatch] = Field(
        description=(
            "5-color brand palette: Primary, Secondary, Accent, Background, Text. "
            "Colors must work together. Must reflect brand personality. "
            "Include hex codes. Justify every color psychologically."
        ),
        min_length=5,
        max_length=5
    )

    color_palette_rationale: str = Field(
        description=(
            "Overall rationale for the palette as a system. "
            "e.g. 'Deep teal as primary signals trust + innovation — "
            "different from the blue-heavy fintech landscape. "
            "Warm yellow accent adds energy without feeling cheap.'"
        )
    )

    # ── TYPOGRAPHY ───────────────────────────────────────────────────────────
    typography: List[TypographySuggestion] = Field(
        description=(
            "3 font recommendations: Heading, Body, Accent/UI. "
            "All must be free (Google Fonts preferred). "
            "Must complement each other and the brand personality."
        ),
        min_length=3,
        max_length=3
    )

    # ── DOMAIN SUGGESTIONS ───────────────────────────────────────────────────
    domain_suggestions: List[DomainSuggestion] = Field(
        description=(
            "6 domain name suggestions across different strategies: "
            "2 × .com variants (get[name].com, try[name].com), "
            "2 × .io variants (for tech-forward feel), "
            "1 × .co variant, "
            "1 × country-specific if geography is India (.in) or relevant. "
            "All should be under 20 characters."
        ),
        min_length=6,
        max_length=6
    )

    # ── ICP (IDEAL CUSTOMER PROFILE) ────────────────────────────────────────
    icp_summary: str = Field(
        description=(
            "A vivid 3-4 sentence portrait of the ideal first customer. "
            "Give them a name, a situation, a frustration, and a win. "
            "e.g. 'Meet Priya, 27, a freelance UX designer in Pune. She juggles "
            "4 clients and spends 2 hours every week chasing overdue payments over "
            "WhatsApp. She tried Zoho Invoice but it felt built for accountants, not "
            "her. InvoiceZap sends her invoice and follows up automatically — "
            "Priya just designs.'"
        )
    )

    # ── LOGO DIRECTION ───────────────────────────────────────────────────────
    logo_direction: str = Field(
        description=(
            "Creative direction for a logo designer. "
            "Describe the concept, not the execution. "
            "e.g. 'A wordmark using a custom 'Z' that doubles as a lightning bolt. "
            "Clean, geometric. Works in single color. No gradients. "
            "Should feel at home next to Stripe and Razorpay logos.'"
        )
    )

    # ── DO / DON'T BRAND RULES ───────────────────────────────────────────────
    brand_dos: List[str] = Field(
        description=(
            "4 things the brand should always do in communication. "
            "e.g. 'Always lead with the outcome, not the feature', "
            "'Use real numbers when possible (Get paid 3x faster)'"
        ),
        min_length=4,
        max_length=4
    )

    brand_donts: List[str] = Field(
        description=(
            "4 things the brand should never do. "
            "e.g. 'Never use corporate jargon like synergy or leverage', "
            "'Never make the user feel stupid about money'"
        ),
        min_length=4,
        max_length=4
    )