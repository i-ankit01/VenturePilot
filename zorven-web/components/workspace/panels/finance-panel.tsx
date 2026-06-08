import { PartialResult } from "@/lib/api";
import { TrendingUp, Clock, DollarSign, Users } from "lucide-react";

interface Props { data: NonNullable<PartialResult["finance_output"]> }

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-4 text-center">
      <p className="text-xl font-bold text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      {sub && <p className="text-[10px] text-muted-foreground/50">{sub}</p>}
    </div>
  );
}

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export function FinancePanel({ data }: Props) {
  const maxMrr = Math.max(...data.monthly_projections.map((m) => m.mrr), 1);

  return (
    <div className="space-y-5">
      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="ARR Year 1"     value={fmt(data.arr_year1)} />
        <Metric label="LTV"            value={fmt(data.ltv)} />
        <Metric label="CAC"            value={fmt(data.cac)} />
        <Metric label="Payback Period" value={`${data.payback_months}mo`} />
      </div>

      {/* Runway */}
      <div className="flex items-center gap-4 rounded-xl border border-border/50 bg-card px-5 py-4">
        <Clock className="h-5 w-5 shrink-0 text-primary/70" />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>Runway</p>
          <p className="text-lg font-bold text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{data.runway_months} months</p>
        </div>
        <div className="ml-auto max-w-xs">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1" style={{ fontFamily: "'DM Mono', monospace" }}>Fundraising Rec.</p>
          <p className="text-sm text-foreground">{data.fundraising_recommendation}</p>
        </div>
      </div>

      {/* MRR chart — CSS bar chart */}
      <div className="rounded-xl border border-border/50 bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary/70" />
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>12-Month MRR</h3>
        </div>
        <div className="flex h-32 items-end gap-1.5">
          {data.monthly_projections.map((m) => {
            const h = Math.max((m.mrr / maxMrr) * 100, 2);
            return (
              <div key={m.month} className="group relative flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-sm bg-primary/40 transition-all group-hover:bg-primary"
                  style={{ height: `${h}%`, boxShadow: "0 0 6px var(--color-primary)" }}
                />
                <span className="text-[9px] text-muted-foreground/50" style={{ fontFamily: "'DM Mono', monospace" }}>
                  {m.month}
                </span>
                {/* Tooltip */}
                <div className="pointer-events-none absolute bottom-full mb-1 hidden rounded border border-border bg-popover px-2 py-1 text-[10px] text-foreground shadow group-hover:block" style={{ fontFamily: "'DM Mono', monospace" }}>
                  {fmt(m.mrr)}<br />
                  <span className="text-muted-foreground">{m.customers} cust.</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly table (first 6 months) */}
      <div className="overflow-hidden rounded-xl border border-border/50">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-muted/30">
              {["Month", "MRR", "Customers", "Expenses"].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.monthly_projections.slice(0, 6).map((m, i) => (
              <tr key={i} className="border-b border-border/30 hover:bg-muted/10">
                <td className="px-4 py-2.5 text-[12px] text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>Month {m.month}</td>
                <td className="px-4 py-2.5 text-[12px] font-semibold text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{fmt(m.mrr)}</td>
                <td className="px-4 py-2.5 text-[12px] text-foreground">{m.customers}</td>
                <td className="px-4 py-2.5 text-[12px] text-muted-foreground">{fmt(m.expenses)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}