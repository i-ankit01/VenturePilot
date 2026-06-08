import { PartialResult } from "@/lib/api";
import { Shield, ThumbsUp, ThumbsDown, DollarSign, Zap } from "lucide-react";

interface Props { data: NonNullable<PartialResult["competitor_output"]> }

export function CompetitorPanel({ data }: Props) {
  return (
    <div className="space-y-4">
      {/* Competitive advantage */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
        <div className="mb-2 flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <p className="text-[10px] font-semibold uppercase tracking-widest text-primary/70" style={{ fontFamily: "'DM Mono', monospace" }}>Your Edge</p>
        </div>
        <p className="text-sm leading-relaxed text-foreground">{data.competitive_advantage}</p>
      </div>

      {/* Competitor cards */}
      <div className="space-y-3">
        {data.competitors.map((c, i) => (
          <div key={i} className="rounded-xl border border-border/50 bg-card p-5">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{c.name}</h3>
                <p className="mt-0.5 text-[12px] text-muted-foreground">{c.description}</p>
              </div>
              <div className="flex items-center gap-1 rounded-sm border border-border/50 bg-muted/30 px-2 py-1">
                <DollarSign className="h-3 w-3 text-muted-foreground/60" />
                <span className="text-[11px] text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{c.pricing}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="mb-1.5 flex items-center gap-1">
                  <ThumbsUp className="h-3 w-3 text-emerald-400" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/70" style={{ fontFamily: "'DM Mono', monospace" }}>Strengths</span>
                </div>
                <ul className="space-y-1">
                  {c.strengths.map((s, j) => (
                    <li key={j} className="flex items-start gap-1.5 text-[12px] text-muted-foreground">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-400/60" />{s}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="mb-1.5 flex items-center gap-1">
                  <ThumbsDown className="h-3 w-3 text-destructive" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-destructive/70" style={{ fontFamily: "'DM Mono', monospace" }}>Weaknesses</span>
                </div>
                <ul className="space-y-1">
                  {c.weaknesses.map((w, j) => (
                    <li key={j} className="flex items-start gap-1.5 text-[12px] text-muted-foreground">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-destructive/60" />{w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}