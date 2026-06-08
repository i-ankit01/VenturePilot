import { PartialResult } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Package, DollarSign, Map, Star } from "lucide-react";

interface Props { data: NonNullable<PartialResult["product_output"]> }

const priorityColor: Record<string, string> = {
  high:   "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  low:    "bg-muted text-muted-foreground border-border/50",
};

export function ProductPanel({ data }: Props) {
  return (
    <div className="space-y-5">
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
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary/70" />
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>Pricing Tiers</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {data.pricing_tiers.map((tier, i) => (
            <div key={i} className={cn("rounded-xl border p-4", i === 1 ? "border-primary/30 bg-primary/5" : "border-border/50 bg-card")}>
              {i === 1 && (
                <div className="mb-2 flex items-center gap-1">
                  <Star className="h-3 w-3 text-primary" />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-primary" style={{ fontFamily: "'DM Mono', monospace" }}>Popular</span>
                </div>
              )}
              <p className="font-semibold text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{tier.name}</p>
              <p className="mb-3 text-xl font-bold text-primary">{tier.price}</p>
              <ul className="space-y-1.5">
                {tier.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-1.5 text-[12px] text-muted-foreground">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/50" />{f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Roadmap */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Map className="h-4 w-4 text-primary/70" />
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>Roadmap</h3>
        </div>
        <div className="relative space-y-3 pl-5">
          <div className="absolute left-1.5 top-2 bottom-2 w-px bg-border/60" />
          {data.roadmap.map((phase, i) => (
            <div key={i} className="relative rounded-lg border border-border/50 bg-card p-4">
              <div className="absolute -left-[17px] top-4 h-2.5 w-2.5 rounded-full border-2 border-primary bg-background" />
              <div className="mb-2 flex items-center justify-between">
                <p className="font-semibold text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{phase.phase}</p>
                <span className="rounded-sm border border-border/50 bg-muted/30 px-2 py-0.5 text-[10px] text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{phase.duration}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {phase.features.map((f, j) => (
                  <span key={j} className="rounded-sm border border-border/40 bg-muted/20 px-2 py-0.5 text-[11px] text-muted-foreground">{f}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}