import { PartialResult } from "@/lib/api";
import { Palette, Type, Globe, CheckCircle2, XCircle, BookOpen, Sparkles, Quote, PenTool, MoveRight } from "lucide-react";

interface Props { data: NonNullable<PartialResult["branding_output"]> }

export function BrandingPanel({ data }: Props) {
  const nameSuggestions = data.name_suggestions ?? [];
  const taglines = data.taglines ?? [];
  const messagingPillars = data.messaging_pillars ?? [];
  const palette = data.color_palette ?? [];
  const typography = data.typography ?? [];
  const domains = data.domain_suggestions ?? [];
  const brandDos = data.brand_dos ?? [];
  const brandDonts = data.brand_donts ?? [];

  return (
    <div className="space-y-5">
      {/* Name + tagline */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-primary/60" style={{ fontFamily: "'DM Mono', monospace" }}>Recommended Name</p>
        <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{data.recommended_name}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{data.recommended_tagline}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {taglines.map((t, i) => (
            <span key={i} className="rounded-md border border-primary/20 bg-background/50 px-3 py-1.5 text-[12px] italic text-foreground">{t}</span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border/50 bg-card p-4">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary/70" />
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>Brand Personality</h3>
          </div>
          <p className="text-sm text-foreground">{data.brand_personality}</p>
          <p className="mt-2 text-sm text-muted-foreground">{data.brand_tone}</p>
        </div>
        <div className="rounded-lg border border-border/50 bg-card p-4">
          <div className="mb-2 flex items-center gap-2">
            <Quote className="h-3.5 w-3.5 text-primary/70" />
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>Voice & Positioning</h3>
          </div>
          <p className="text-sm leading-relaxed text-foreground">{data.brand_voice_description}</p>
          <p className="mt-2 text-[12px] text-muted-foreground">{data.positioning_statement}</p>
        </div>
      </div>

      <div className="rounded-lg border border-border/50 bg-muted/20 p-5">
        <div className="mb-2 flex items-center gap-2">
          <PenTool className="h-3.5 w-3.5 text-primary/70" />
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>Elevator Pitch</h3>
        </div>
        <p className="text-sm leading-relaxed text-foreground">{data.elevator_pitch}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
          <div className="mb-2 flex items-center gap-2">
            <MoveRight className="h-3.5 w-3.5 text-primary/70" />
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>Messaging Pillars</h3>
          </div>
          <ul className="space-y-2">
            {messagingPillars.map((pillar, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                {pillar}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
          <div className="mb-2 flex items-center gap-2">
            <BookOpen className="h-3.5 w-3.5 text-primary/70" />
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>ICP Summary</h3>
          </div>
          <p className="text-sm leading-relaxed text-foreground">{data.icp_summary}</p>
        </div>
      </div>

      {/* Color palette */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary/70" />
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>Color Palette</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {palette.map((color, i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-border/50">
              <div className="h-16 w-full" style={{ backgroundColor: color.hex_code }} />
              <div className="p-3">
                <p className="text-[11px] font-semibold text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{color.color_name}</p>
                <p className="text-[10px] text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{color.hex_code}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.08em] text-muted-foreground/70" style={{ fontFamily: "'DM Mono', monospace" }}>{color.role}</p>
                <p className="mt-1 text-[10px] text-muted-foreground/70">{color.usage}</p>
                <p className="mt-1 text-[10px] text-muted-foreground/70">{color.psychology}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-lg border border-border/50 bg-card p-4">
          <p className="text-sm leading-relaxed text-foreground">{data.color_palette_rationale}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Typography */}
        <div className="rounded-lg border border-border/50 bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Type className="h-3.5 w-3.5 text-primary/70" />
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>Typography</h3>
          </div>
          <div className="space-y-2">
            {typography.map((item, i) => (
              <div key={i} className="rounded-md border border-border/40 bg-muted/20 p-3">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50" style={{ fontFamily: "'DM Mono', monospace" }}>{item.role}</p>
                <p className="text-sm font-semibold text-foreground">{item.font_name}</p>
                <p className="text-[10px] text-muted-foreground/50">{item.source}</p>
                <p className="mt-1 text-[12px] text-muted-foreground">{item.why}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Domain suggestions */}
        <div className="rounded-lg border border-border/50 bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Globe className="h-3.5 w-3.5 text-primary/70" />
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>Domain Ideas</h3>
          </div>
          <div className="space-y-1.5">
            {domains.map((d, i) => (
              <div key={i} className="rounded-md border border-border/40 bg-muted/20 px-3 py-2">
                <p className="text-[12px] text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{d.domain}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{d.rationale}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Name options */}
      <div className="rounded-lg border border-border/50 bg-muted/20 p-5">
        <div className="mb-2 flex items-center gap-2">
          <BookOpen className="h-3.5 w-3.5 text-primary/70" />
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>Name Options</h3>
        </div>
        <div className="space-y-2">
          {nameSuggestions.map((item, i) => (
            <div key={i} className="rounded-md border border-border/40 bg-card p-3">
              <p className="font-semibold text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{item.name}</p>
              <p className="mt-1 text-[12px] text-muted-foreground">{item.rationale}</p>
              <p className="mt-1 text-[11px] text-muted-foreground/70">{item.domain_available}</p>
              <p className="mt-1 text-[11px] text-primary/70">{item.tagline_fit}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Logo direction */}
      <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>Logo Direction</p>
        <p className="text-sm text-foreground">{data.logo_direction}</p>
      </div>

      {/* Dos and Don'ts */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400" style={{ fontFamily: "'DM Mono', monospace" }}>Do</span>
          </div>
          <ul className="space-y-1.5">
            {brandDos.map((d, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[12px] text-foreground">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-400/60" />{d}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <div className="mb-2 flex items-center gap-1.5">
            <XCircle className="h-3.5 w-3.5 text-destructive" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-destructive" style={{ fontFamily: "'DM Mono', monospace" }}>Do not</span>
          </div>
          <ul className="space-y-1.5">
            {brandDonts.map((d, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[12px] text-foreground">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-destructive/60" />{d}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}