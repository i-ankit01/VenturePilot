"use client";

import { PartialResult } from "@/lib/api";
import {
  Palette, Type, Globe, CheckCircle2, XCircle,
  BookOpen, Sparkles, Quote, PenTool, MoveRight, ImageIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface Props { data: NonNullable<PartialResult["branding_output"]> }

const MONO = { fontFamily: "var(--font-mono)" };

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground" style={MONO}>
      {children}
    </p>
  );
}

export function BrandingPanel({ data }: Props) {
  const palette    = data.approved_color_palette ?? data.color_palette ?? [];
  const typography = data.typography ?? [];
  const domains    = data.domain_suggestions ?? [];
  const pillars    = data.messaging_pillars ?? [];
  const brandDos   = data.brand_dos ?? [];
  const brandDonts = data.brand_donts ?? [];

  const displayName    = data.approved_name    ?? data.name_suggestion?.name    ?? "";
  const displayTagline = data.approved_tagline ?? data.tagline                  ?? "";
  const logoDir        = data.approved_logo_direction ?? data.logo_direction    ?? "";
  const isApproved     = !!data.approved_name;

  return (
    <div className="space-y-5">

      {/* ── Logo image ── */}
      {data.logo_image_url && (
        <div className="flex flex-col items-center rounded-2xl border border-border/60 bg-card p-8 shadow-sm">
          <SectionLabel>Generated Logo</SectionLabel>
          <div className="rounded-2xl overflow-hidden border border-border bg-white p-8 shadow-[0_0_0_1px_hsl(var(--border)),0_8px_32px_rgba(0,0,0,0.08)]">
            <img
              src={data.logo_image_url}
              alt={`${displayName} logo`}
              className="h-28 w-auto object-contain"
            />
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground" style={MONO}>
            Black on white · Production ready
          </p>
        </div>
      )}

      {/* ── Name + tagline hero ── */}
      <div className={cn(
        "rounded-2xl border p-6 shadow-sm",
        isApproved
          ? "border-primary/25 bg-primary/5"
          : "border-border bg-card"
      )}>
        <div className="flex items-start justify-between mb-2">
          <SectionLabel>
            {isApproved ? "Approved Brand Name" : "Suggested Brand Name"}
          </SectionLabel>
          {isApproved && (
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-[10px]" style={MONO}>
              <CheckCircle2 className="h-2.5 w-2.5 mr-1" /> Founder Approved
            </Badge>
          )}
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground mb-2" style={MONO}>
          {displayName}
        </h2>
        {data.name_suggestion?.rationale && (
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            {data.name_suggestion.rationale}
          </p>
        )}
        <Separator className="my-3" />
        <p className="text-lg font-medium italic text-foreground/70">"{displayTagline}"</p>
      </div>

      {/* ── Personality + voice ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="mb-2.5 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary/70" />
            <SectionLabel>Brand Personality</SectionLabel>
          </div>
          <p className="text-sm font-medium text-foreground">{data.brand_personality}</p>
          <p className="mt-1 text-sm text-muted-foreground">{data.brand_tone}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="mb-2.5 flex items-center gap-2">
            <Quote className="h-3.5 w-3.5 text-primary/70" />
            <SectionLabel>Voice & Positioning</SectionLabel>
          </div>
          <p className="text-sm leading-relaxed text-foreground/80">{data.brand_voice_description}</p>
          <p className="mt-2 text-[12px] text-muted-foreground">{data.positioning_statement}</p>
        </div>
      </div>

      {/* ── Elevator pitch ── */}
      <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
        <div className="mb-2.5 flex items-center gap-2">
          <PenTool className="h-3.5 w-3.5 text-primary/70" />
          <SectionLabel>Elevator Pitch</SectionLabel>
        </div>
        <p className="text-sm leading-relaxed text-foreground/80">{data.elevator_pitch}</p>
      </div>

      {/* ── Pillars + ICP ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="mb-2.5 flex items-center gap-2">
            <MoveRight className="h-3.5 w-3.5 text-primary/70" />
            <SectionLabel>Messaging Pillars</SectionLabel>
          </div>
          <ul className="space-y-2">
            {pillars.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="mb-2.5 flex items-center gap-2">
            <BookOpen className="h-3.5 w-3.5 text-primary/70" />
            <SectionLabel>ICP Summary</SectionLabel>
          </div>
          <p className="text-sm leading-relaxed text-foreground/80">{data.icp_summary}</p>
        </div>
      </div>

      {/* ── Color palette ── */}
      <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="h-3.5 w-3.5 text-primary/70" />
            <SectionLabel>Color Palette</SectionLabel>
          </div>
          {data.approved_color_palette && (
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-[10px]" style={MONO}>
              Approved
            </Badge>
          )}
        </div>
        <div className="grid grid-cols-5 gap-2">
          {palette.map((color, i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-border/60 transition-transform hover:scale-[1.02]">
              <div className="h-14 w-full" style={{ backgroundColor: color.hex_code }} />
              <div className="bg-card p-2">
                <p className="text-[10px] font-semibold text-foreground truncate" style={MONO}>{color.color_name}</p>
                <p className="text-[9px] text-muted-foreground" style={MONO}>{color.hex_code}</p>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground/60 mt-0.5" style={MONO}>{color.role}</p>
              </div>
            </div>
          ))}
        </div>
        {data.color_palette_rationale && (
          <p className="mt-3 text-[12px] text-muted-foreground leading-relaxed">
            {data.color_palette_rationale}
          </p>
        )}
      </div>

      {/* ── Typography + domains ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Type className="h-3.5 w-3.5 text-primary/70" />
            <SectionLabel>Typography</SectionLabel>
          </div>
          <div className="space-y-2">
            {typography.map((item, i) => (
              <div key={i} className="rounded-lg border border-border/40 bg-muted/30 p-3">
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground/60 mb-1" style={MONO}>{item.role}</p>
                <p className="text-sm font-semibold text-foreground">{item.font_name}</p>
                <p className="text-[10px] text-muted-foreground">{item.source}</p>
                <p className="mt-1 text-[11px] text-muted-foreground/80">{item.why}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Globe className="h-3.5 w-3.5 text-primary/70" />
            <SectionLabel>Domain Ideas</SectionLabel>
          </div>
          <div className="space-y-1.5">
            {domains.map((d, i) => (
              <div key={i} className="rounded-lg border border-border/40 bg-muted/30 px-3 py-2">
                <p className="text-[12px] font-medium text-foreground" style={MONO}>{d.domain}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{d.rationale}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Logo direction ── */}
      <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
        <div className="mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-3.5 w-3.5 text-primary/70" />
            <SectionLabel>Logo Direction</SectionLabel>
          </div>
          {data.approved_logo_direction && (
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-[10px]" style={MONO}>
              Approved
            </Badge>
          )}
        </div>
        <p className="text-sm text-foreground/80 leading-relaxed">{logoDir}</p>
      </div>

      {/* ── Dos & Don'ts ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="mb-2.5 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400" style={MONO}>Do</span>
          </div>
          <ul className="space-y-1.5">
            {brandDos.map((d, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[12px] text-foreground/80">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-500" />{d}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
          <div className="mb-2.5 flex items-center gap-1.5">
            <XCircle className="h-3.5 w-3.5 text-destructive" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-destructive" style={MONO}>Don't</span>
          </div>
          <ul className="space-y-1.5">
            {brandDonts.map((d, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[12px] text-foreground/80">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-destructive" />{d}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}