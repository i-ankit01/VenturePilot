import { PartialResult } from "@/lib/api";
import { Target, Lightbulb, Users, Tag } from "lucide-react";

interface Props { data: NonNullable<PartialResult["planner_output"]> }

function Field({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
      <div className="mb-1.5 flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-primary/70" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>
          {label}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-foreground">{value}</p>
    </div>
  );
}

export function PlannerPanel({ data }: Props) {
  return (
    <div className="space-y-4">
      {/* Name + one-liner */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-primary/60" style={{ fontFamily: "'DM Mono', monospace" }}>Startup</p>
        <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{data.startup_name}</h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{data.one_liner}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field icon={Target}   label="Problem"       value={data.problem} />
        <Field icon={Lightbulb} label="Solution"     value={data.solution} />
        <Field icon={Users}    label="Target Market" value={data.target_market} />
        <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
          <div className="mb-2 flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-primary/70" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>Meta</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[data.industry, data.stage].map((tag) => (
              <span key={tag} className="rounded-sm border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] text-primary" style={{ fontFamily: "'DM Mono', monospace" }}>{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}