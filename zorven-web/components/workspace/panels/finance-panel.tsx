import { PartialResult } from "@/lib/api";
import { TrendingUp, Clock, DollarSign, Star, Wallet, ShieldAlert, ListChecks, LineChart, TriangleAlert } from "lucide-react";

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

function fmtMoney(value: number, currency: string) {
  const symbol = currency.trim().charAt(0) || "$";
  if (value >= 1_000_000) return `${symbol}${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${symbol}${(value / 1_000).toFixed(0)}K`;
  return `${symbol}${value.toFixed(0)}`;
}

export function FinancePanel({ data }: Props) {
  const currency = data.currency ?? "$";
  const projections = data.monthly_projections ?? [];
  const pricingTiers = data.pricing_tiers ?? [];
  const scenarios = data.scenarios ?? [];
  const risks = data.financial_risks ?? [];
  const advice = data.cfo_advice ?? [];
  const assumptions = data.financial_model_assumptions ?? [];
  const burnBreakdown = data.runway.burn_rate_breakdown ?? [];
  const maxMrr = Math.max(...projections.map((m) => m.mrr), 1);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="ARR" value={fmtMoney(data.saas_metrics.arr, currency)} sub={data.saas_metrics.ltv_cac_ratio} />
        <Metric label="MRR Month 12" value={fmtMoney(data.saas_metrics.mrr_month_12, currency)} />
        <Metric label="LTV" value={fmtMoney(data.saas_metrics.ltv, currency)} />
        <Metric label="CAC" value={fmtMoney(data.saas_metrics.cac, currency)} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Metric label="Payback" value={`${data.saas_metrics.payback_period_months} mo`} sub={data.saas_metrics.churn_rate_assumed} />
        <Metric label="ARPU" value={fmtMoney(data.saas_metrics.arpu, currency)} />
        <Metric label="Runway" value={`${data.runway.runway_months} mo`} sub={`Break even: month ${data.runway.break_even_month}`} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <div className="mb-2 flex items-center gap-2">
            <Star className="h-4 w-4 text-primary/70" />
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>Pricing Strategy</h3>
          </div>
          <p className="text-sm leading-relaxed text-foreground">{data.pricing_strategy_rationale}</p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-5">
          <div className="mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary/70" />
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>Runway</h3>
          </div>
          <p className="text-lg font-bold text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{data.runway.runway_months} months</p>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-foreground">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50" style={{ fontFamily: "'DM Mono', monospace" }}>Break-even</p>
              <p>{data.runway.break_even_month}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50" style={{ fontFamily: "'DM Mono', monospace" }}>Cash month 12</p>
              <p>{fmtMoney(data.runway.cash_at_month_12, currency)}</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary/70" />
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>Pricing Tiers</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {pricingTiers.map((tier, i) => (
            <div key={i} className="rounded-xl border border-border/50 bg-card p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="font-semibold text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{tier.name}</p>
                {i === 1 && <span className="rounded-sm border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] text-primary" style={{ fontFamily: "'DM Mono', monospace" }}>Core</span>}
              </div>
              <p className="text-xl font-bold text-primary">{fmtMoney(tier.price_monthly, tier.currency)}/mo</p>
              <p className="text-[11px] text-muted-foreground">{fmtMoney(tier.price_annually, tier.currency)}/year</p>
              <p className="mt-2 text-[12px] text-muted-foreground">{tier.target_user}</p>
              <p className="mt-1 text-[12px] text-foreground/80">{tier.conversion_assumption}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {tier.features_included.map((feature, j) => (
                  <span key={j} className="rounded-sm border border-border/40 bg-muted/20 px-2 py-0.5 text-[11px] text-muted-foreground">{feature}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary/70" />
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>12-Month MRR</h3>
        </div>
        <div className="flex h-32 items-end gap-1.5">
          {projections.map((m) => {
            const height = Math.max((m.mrr / maxMrr) * 100, 2);
            return (
              <div key={m.month} className="group relative flex flex-1 flex-col items-center gap-1">
                <div className="w-full rounded-t-sm bg-primary/40 transition-all group-hover:bg-primary" style={{ height: `${height}%`, boxShadow: "0 0 6px var(--color-primary)" }} />
                <span className="text-[9px] text-muted-foreground/50" style={{ fontFamily: "'DM Mono', monospace" }}>{m.month}</span>
                <div className="pointer-events-none absolute bottom-full mb-1 hidden rounded border border-border bg-popover px-2 py-1 text-[10px] text-foreground shadow group-hover:block" style={{ fontFamily: "'DM Mono', monospace" }}>
                  {fmtMoney(m.mrr, currency)}<br />
                  <span className="text-muted-foreground">{m.users_paid} paid / {m.users_free} free</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/50">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-muted/30">
              {["Month", "Revenue", "MRR", "Expenses", "Net Cashflow"].map((header) => (
                <th key={header} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {projections.slice(0, 6).map((m, i) => (
              <tr key={i} className="border-b border-border/30 hover:bg-muted/10">
                <td className="px-4 py-2.5 text-[12px] text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>Month {m.month}</td>
                <td className="px-4 py-2.5 text-[12px] text-muted-foreground">{fmtMoney(m.revenue, currency)}</td>
                <td className="px-4 py-2.5 text-[12px] font-semibold text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{fmtMoney(m.mrr, currency)}</td>
                <td className="px-4 py-2.5 text-[12px] text-muted-foreground">{fmtMoney(m.expenses, currency)}</td>
                <td className="px-4 py-2.5 text-[12px] text-muted-foreground">{fmtMoney(m.net_cashflow, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
          <div className="mb-2 flex items-center gap-2">
            <LineChart className="h-4 w-4 text-primary/70" />
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>SaaS Metrics</h3>
          </div>
          <ul className="space-y-2 text-sm text-foreground">
            <li>LTV:CAC ratio: {data.saas_metrics.ltv_cac_ratio}</li>
            <li>Gross margin: {data.saas_metrics.gross_margin}</li>
            <li>Churn: {data.saas_metrics.churn_rate_assumed}</li>
            <li>NPS target: {data.saas_metrics.nps_target}</li>
            <li>ARR month 12: {fmtMoney(data.saas_metrics.arr, currency)}</li>
          </ul>
        </div>
        <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary/70" />
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>Runway Breakdown</h3>
          </div>
          <ul className="space-y-2 text-sm text-foreground">
            <li>Initial capital: {fmtMoney(data.runway.initial_capital, currency)}</li>
            <li>Monthly burn: {fmtMoney(data.runway.monthly_burn_rate, currency)}</li>
            <li>Cash at month 12: {fmtMoney(data.runway.cash_at_month_12, currency)}</li>
            <li>Runway with revenue: {data.runway.runway_with_revenue_months} months</li>
          </ul>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {burnBreakdown.map((item, i) => (
              <span key={i} className="rounded-sm border border-border/40 bg-card px-2 py-1 text-[11px] text-muted-foreground">{item}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {scenarios.map((scenario, i) => (
          <div key={i} className="rounded-xl border border-border/50 bg-card p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>{scenario.scenario}</p>
            <p className="mt-1 text-sm text-foreground">{scenario.assumption}</p>
            <p className="mt-2 text-[12px] text-muted-foreground">Paid users: {scenario.paid_users_month_12}</p>
            <p className="text-[12px] text-muted-foreground">MRR: {fmtMoney(scenario.mrr_month_12, currency)}</p>
            <p className="text-[12px] text-muted-foreground">ARR: {fmtMoney(scenario.arr_month_12, currency)}</p>
            <p className="text-[12px] text-muted-foreground">Profitable: {scenario.profitable ? "Yes" : "No"}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
          <div className="mb-2 flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-primary/70" />
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>CFO Advice</h3>
          </div>
          <ul className="space-y-2">
            {advice.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
          <div className="mb-2 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-primary/70" />
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>Financial Risks</h3>
          </div>
          <ul className="space-y-2">
            {risks.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
        <div className="mb-2 flex items-center gap-2">
          <TriangleAlert className="h-4 w-4 text-primary/70" />
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>Model Assumptions</h3>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {assumptions.map((item, i) => (
            <span key={i} className="rounded-sm border border-border/40 bg-card px-2 py-1 text-[11px] text-muted-foreground">{item}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
