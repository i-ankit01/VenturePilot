import { PartialResult } from "@/lib/api";
import { Palette, Type, Globe, CheckCircle2, XCircle, BookOpen } from "lucide-react";

interface Props { data: NonNullable<PartialResult["branding_output"]> }

export function BrandingPanel({ data }: Props) {
  return (
    <div className="space-y-5">
      {/* Name + taglines */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-primary/60" style={{ fontFamily: "'DM Mono', monospace" }}>Brand Name</p>
        <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{data.brand_name}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {data.taglines.map((t, i) => (
            <span key={i} className="rounded-md border border-primary/20 bg-background/50 px-3 py-1.5 text-[12px] italic text-foreground">"{t}"</span>
          ))}
        </div>
      </div>

      {/* Color palette */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary/70" />
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>Color Palette</h3>
        </div>
        <div className="flex gap-3">
          {data.color_palette.map((color, i) => (
            <div key={i} className="flex-1 rounded-xl border border-border/50 overflow-hidden">
              <div className="h-16 w-full" style={{ backgroundColor: color.hex }} />
              <div className="p-3">
                <p className="text-[11px] font-semibold text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{color.name}</p>
                <p className="text-[10px] text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{color.hex}</p>
                <p className="mt-1 text-[10px] text-muted-foreground/70">{color.psychology}</p>
              </div>
            </div>
          ))}
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
            <div>
              <p className="text-[10px] text-muted-foreground/50">Heading</p>
              <p className="text-sm font-semibold text-foreground">{data.typography.heading}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground/50">Body</p>
              <p className="text-sm text-foreground">{data.typography.body}</p>
            </div>
          </div>
        </div>

        {/* Domain suggestions */}
        <div className="rounded-lg border border-border/50 bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Globe className="h-3.5 w-3.5 text-primary/70" />
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>Domain Ideas</h3>
          </div>
          <div className="space-y-1.5">
            {data.domain_suggestions.map((d, i) => (
              <div key={i} className="flex items-center gap-2 rounded-md border border-border/40 bg-muted/20 px-3 py-1.5">
                <span className="text-[12px] text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{d}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ICP story */}
      <div className="rounded-lg border border-border/50 bg-muted/20 p-5">
        <div className="mb-2 flex items-center gap-2">
          <BookOpen className="h-3.5 w-3.5 text-primary/70" />
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>ICP Story</h3>
        </div>
        <p className="text-sm leading-relaxed text-foreground italic">"{data.icp_story}"</p>
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
            {data.brand_dos.map((d, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[12px] text-foreground">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-400/60" />{d}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <div className="mb-2 flex items-center gap-1.5">
            <XCircle className="h-3.5 w-3.5 text-destructive" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-destructive" style={{ fontFamily: "'DM Mono', monospace" }}>Don't</span>
          </div>
          <ul className="space-y-1.5">
            {data.brand_donts.map((d, i) => (
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