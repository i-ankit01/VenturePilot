import { PartialResult } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Package, DollarSign, Map, Sparkles, Wrench, ShieldAlert, Rocket } from "lucide-react";

interface Props { data: NonNullable<PartialResult["product_output"]> }

const priorityColor: Record<string, string> = {
  "Must Have": "bg-destructive/10 text-destructive border-destructive/20",
  "Should Have": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Nice to Have": "bg-muted text-muted-foreground border-border/50",
};

export function ProductPanel({ data }: Props) {
  return (
    <div className="space-y-5">
      {/* Product name + USP */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-primary/60" style={{ fontFamily: "'DM Mono', monospace" }}>Product Name Suggestion</p>
        <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{data.product_name_suggestion}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{data.usp}</p>
      </div>

      {/* MVP */}
      <div className="rounded-lg border border-border/50 bg-card p-4">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary/70" />
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>MVP Scope</h3>
        </div>
        <p className="text-sm leading-relaxed text-foreground">{data.mvp_scope}</p>
      </div>

      {/* Features */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Package className="h-4 w-4 text-primary/70" />
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>Core Features</h3>
        </div>
        <div className="space-y-2">
          {data.core_features.map((f, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border border-border/50 bg-card p-4">
              <span className={cn("mt-0.5 shrink-0 rounded-sm border px-1.5 py-0.5 text-[9px] font-bold uppercase", priorityColor[f.priority.toLowerCase()] ?? priorityColor.low)}>
                {f.priority}
              </span>
              <div>
                <p className="text-[13px] font-semibold text-foreground">{f.name}</p>
                <p className="text-[12px] text-muted-foreground">{f.description}</p>
                <p className="mt-1 text-[11px] text-muted-foreground/70">Solves: {f.solves_pain}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monetization */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
          <div className="mb-2 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary/70" />
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>Monetization</h3>
          </div>
          <p className="text-sm leading-relaxed text-foreground">{data.monetization_model}</p>
        </div>
        <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Wrench className="h-4 w-4 text-primary/70" />
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>Tech Stack</h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.suggested_tech_stack.map((item, i) => (
              <span key={i} className="rounded-sm border border-border/40 bg-card px-2 py-1 text-[11px] text-foreground">{item}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
        <div className="mb-2 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-primary/70" />
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>Pricing Recommendation</h3>
        </div>
        <p className="text-sm leading-relaxed text-foreground">{data.pricing_recommendation}</p>
      </div>

      {/* Roadmap */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Rocket className="h-4 w-4 text-primary/70" />
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>Roadmap</h3>
        </div>
        <div className="space-y-3">
          {data.roadmap.map((phase, i) => (
            <div key={i} className="rounded-xl border border-border/50 bg-card p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="font-semibold text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{phase.phase}</p>
                <span className="rounded-sm border border-border/50 bg-muted/30 px-2 py-0.5 text-[10px] text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{phase.timeline}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {phase.deliverables.map((item, j) => (
                  <span key={j} className="rounded-sm border border-border/40 bg-muted/20 px-2 py-0.5 text-[11px] text-muted-foreground">{item}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Risks */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Map className="h-4 w-4 text-primary/70" />
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>Product Risks</h3>
        </div>
        <ul className="space-y-2">
          {data.product_risks.map((risk, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-foreground">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />{risk}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}