import { PartialResult } from "@/lib/api";
import {
  TrendingUp, Clock, DollarSign, Star, Wallet,
  ShieldAlert, ListChecks, LineChart, TriangleAlert, CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props { data: NonNullable<PartialResult["finance_output"]> }

const MONO = { fontFamily: "'DM Mono', monospace" };
const NEON = "linear-gradient(90deg, rgb(147,197,253) 0%, rgba(96,165,250,0.85) 60%, rgba(255,255,255,0.7) 100%)";

function fmtMoney(value: number, currency: string) {
  const symbol = currency.trim().charAt(0) || "$";
  if (value >= 1_000_000) return `${symbol}${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000)     return `${symbol}${(value / 1_000).toFixed(0)}K`;
  return `${symbol}${value.toFixed(0)}`;
}

// ─── Neon stat card ───────────────────────────────────────────────────────────
function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-blue-400/20 bg-gradient-to-br from-blue-500/[0.07] via-white/[0.015] to-transparent p-4 backdrop-blur-xl text-center transition-all hover:border-blue-400/35 hover:from-blue-500/[0.1]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />
      <div className="pointer-events-none absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-blue-500/10 blur-[40px]" />
      <p
        className="relative z-10 text-xl font-bold leading-tight bg-clip-text text-transparent"
        style={{ ...MONO, backgroundImage: NEON }}
      >
        {value}
      </p>
      <p className="relative z-10 mt-0.5 text-[11px] text-white/35">{label}</p>
      {sub && <p className="relative z-10 mt-0.5 text-[10px] text-white/20" style={MONO}>{sub}</p>}
    </div>
  );
}

function SectionLabel({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-blue-300/70" />
      <h3 className="text-[11px] font-semibold uppercase tracking-widest text-white/30" style={MONO}>
        {children}
      </h3>
    </div>
  );
}

// ─── Scenario config ──────────────────────────────────────────────────────────
function scenarioConfig(name: string) {
  const n = name.toLowerCase();
  if (n.includes("bear") || n.includes("worst") || n.includes("pessim"))
    return { border: "border-rose-400/20", bg: "bg-rose-500/[0.06]", text: "text-rose-300", dot: "bg-rose-400", label: "border-rose-400/20 bg-rose-500/[0.08] text-rose-300" };
  if (n.includes("bull") || n.includes("best") || n.includes("optim"))
    return { border: "border-emerald-400/20", bg: "bg-emerald-500/[0.06]", text: "text-emerald-300", dot: "bg-emerald-400", label: "border-emerald-400/20 bg-emerald-500/[0.08] text-emerald-300" };
  return { border: "border-blue-400/20", bg: "bg-blue-500/[0.06]", text: "text-blue-300", dot: "bg-blue-400", label: "border-blue-400/20 bg-blue-500/[0.08] text-blue-300" };
}

export function FinancePanel({ data }: Props) {
  const currency     = data.currency ?? "$";
  const projections  = data.monthly_projections ?? [];
  const pricingTiers = data.pricing_tiers ?? [];
  const scenarios    = data.scenarios ?? [];
  const risks        = data.financial_risks ?? [];
  const advice       = data.cfo_advice ?? [];
  const assumptions  = data.financial_model_assumptions ?? [];
  const burnBreakdown = data.runway.burn_rate_breakdown ?? [];
  const maxMrr       = Math.max(...projections.map((m) => m.mrr), 1);

  return (
    <div className="space-y-6">

      {/* ── Primary KPI row ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="ARR"         value={fmtMoney(data.saas_metrics.arr, currency)}            sub={data.saas_metrics.ltv_cac_ratio} />
        <StatCard label="MRR Month 12" value={fmtMoney(data.saas_metrics.mrr_month_12, currency)} />
        <StatCard label="LTV"          value={fmtMoney(data.saas_metrics.ltv, currency)} />
        <StatCard label="CAC"          value={fmtMoney(data.saas_metrics.cac, currency)} />
      </div>

      {/* ── Secondary KPI row ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Payback"  value={`${data.saas_metrics.payback_period_months} mo`} sub={data.saas_metrics.churn_rate_assumed} />
        <StatCard label="ARPU"     value={fmtMoney(data.saas_metrics.arpu, currency)} />
        <StatCard label="Runway"   value={`${data.runway.runway_months} mo`}                sub={`Break even: month ${data.runway.break_even_month}`} />
      </div>

      {/* ── Pricing strategy + Runway detail ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-xl transition-all hover:border-blue-400/20">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/0 to-transparent transition-all group-hover:via-blue-400/30" />
          <SectionLabel icon={Star}>Pricing Strategy</SectionLabel>
          <p className="text-sm leading-relaxed text-white/65">{data.pricing_strategy_rationale}</p>
        </div>

        <div className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-xl transition-all hover:border-blue-400/20">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/0 to-transparent transition-all group-hover:via-blue-400/30" />
          <SectionLabel icon={Clock}>Runway Detail</SectionLabel>
          <p
            className="text-2xl font-bold bg-clip-text text-transparent"
            style={{ ...MONO, backgroundImage: NEON }}
          >
            {data.runway.runway_months} months
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {[
              { label: "Break-even", value: `Month ${data.runway.break_even_month}` },
              { label: "Cash month 12", value: fmtMoney(data.runway.cash_at_month_12, currency) },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[10px] uppercase tracking-wider text-white/25" style={MONO}>{label}</p>
                <p className="mt-0.5 text-[13px] font-semibold text-white/75" style={MONO}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Pricing tiers ── */}
      <div>
        <SectionLabel icon={DollarSign}>Pricing Tiers</SectionLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {pricingTiers.map((tier, i) => {
            const isCore = i === 1;
            return (
              <div
                key={i}
                className={cn(
                  "relative overflow-hidden rounded-xl border p-5 backdrop-blur-xl transition-all",
                  isCore
                    ? "border-blue-400/30 bg-gradient-to-b from-blue-500/[0.1] to-transparent shadow-[0_0_30px_rgba(96,165,250,0.08)]"
                    : "border-white/[0.06] bg-white/[0.02] hover:border-blue-400/15"
                )}
              >
                {isCore && (
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />
                )}
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[13px] font-semibold text-white/90" style={MONO}>{tier.name}</p>
                  {isCore && (
                    <span className="rounded-full border border-blue-400/30 bg-blue-500/10 px-2 py-0.5 text-[10px] text-blue-300" style={MONO}>
                      Core
                    </span>
                  )}
                </div>
                <p
                  className="text-2xl font-bold bg-clip-text text-transparent"
                  style={{ ...MONO, backgroundImage: isCore ? NEON : "linear-gradient(90deg, rgba(255,255,255,0.7), rgba(255,255,255,0.4))" }}
                >
                  {fmtMoney(tier.price_monthly, tier.currency)}<span className="text-[14px]">/mo</span>
                </p>
                <p className="text-[11px] text-white/30" style={MONO}>{fmtMoney(tier.price_annually, tier.currency)}/year</p>
                <p className="mt-2 text-[12px] text-white/50">{tier.target_user}</p>
                <p className="mt-1 text-[12px] text-white/40">{tier.conversion_assumption}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {tier.features_included.map((feature, j) => (
                    <span
                      key={j}
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px]",
                        isCore
                          ? "border-blue-400/20 bg-blue-500/[0.06] text-blue-300/80"
                          : "border-white/[0.07] bg-white/[0.03] text-white/40"
                      )}
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── MRR Bar chart ── */}
      <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/25 to-transparent" />
        {/* Ambient glow behind chart */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-blue-500/[0.04] to-transparent" />

        <SectionLabel icon={TrendingUp}>12-Month MRR</SectionLabel>

        <div className="relative flex h-36 items-end gap-1">
          {projections.map((m) => {
            const height = Math.max((m.mrr / maxMrr) * 100, 2);
            return (
              <div key={m.month} className="group relative flex flex-1 flex-col items-center gap-1">
                {/* Tooltip */}
                <div
                  className="pointer-events-none absolute bottom-full mb-2 hidden rounded-lg border border-blue-400/20 bg-[#0A0A0B]/95 px-2.5 py-1.5 text-[10px] shadow-xl backdrop-blur-xl group-hover:block whitespace-nowrap z-10"
                  style={MONO}
                >
                  <span className="text-blue-300 font-semibold">{fmtMoney(m.mrr, currency)}</span>
                  <br />
                  <span className="text-white/40">{m.users_paid} paid · {m.users_free} free</span>
                </div>
                {/* Bar */}
                <div
                  className="w-full rounded-t-sm bg-blue-400/30 transition-all duration-200 group-hover:bg-blue-400/60"
                  style={{
                    height: `${height}%`,
                    boxShadow: "0 0 8px rgba(96,165,250,0.3)",
                  }}
                />
                <span className="text-[8px] text-white/25" style={MONO}>{m.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Projections table ── */}
      <div className="overflow-hidden rounded-xl border border-white/[0.06] backdrop-blur-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] bg-white/[0.03]">
              {["Month", "Revenue", "MRR", "Expenses", "Net Cashflow"].map((header) => (
                <th
                  key={header}
                  className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-white/30"
                  style={MONO}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {projections.slice(0, 6).map((m, i) => {
              const positive = m.net_cashflow >= 0;
              return (
                <tr
                  key={i}
                  className={cn(
                    "border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]",
                    i % 2 === 0 ? "bg-transparent" : "bg-white/[0.01]"
                  )}
                >
                  <td className="px-4 py-2.5 text-[12px] text-white/40" style={MONO}>Month {m.month}</td>
                  <td className="px-4 py-2.5 text-[12px] text-white/55">{fmtMoney(m.revenue, currency)}</td>
                  <td className="px-4 py-2.5 text-[12px] font-semibold text-white/80" style={MONO}>{fmtMoney(m.mrr, currency)}</td>
                  <td className="px-4 py-2.5 text-[12px] text-white/55">{fmtMoney(m.expenses, currency)}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={cn(
                        "text-[12px] font-semibold tabular-nums",
                        positive ? "text-emerald-400" : "text-rose-400"
                      )}
                      style={MONO}
                    >
                      {positive ? "+" : ""}{fmtMoney(m.net_cashflow, currency)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── SaaS metrics + Runway breakdown ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-xl transition-all hover:border-blue-400/20">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/0 to-transparent transition-all group-hover:via-blue-400/30" />
          <SectionLabel icon={LineChart}>SaaS Metrics</SectionLabel>
          <ul className="space-y-2">
            {[
              { label: "LTV:CAC ratio",  value: data.saas_metrics.ltv_cac_ratio },
              { label: "Gross margin",   value: data.saas_metrics.gross_margin },
              { label: "Churn",          value: data.saas_metrics.churn_rate_assumed },
              { label: "NPS target",     value: String(data.saas_metrics.nps_target) },
              { label: "ARR month 12",   value: fmtMoney(data.saas_metrics.arr, currency) },
            ].map(({ label, value }) => (
              <li key={label} className="flex items-center justify-between text-[12px]">
                <span className="text-white/35" style={MONO}>{label}</span>
                <span className="font-semibold text-white/75" style={MONO}>{value}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-xl transition-all hover:border-blue-400/20">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/0 to-transparent transition-all group-hover:via-blue-400/30" />
          <SectionLabel icon={Wallet}>Runway Breakdown</SectionLabel>
          <ul className="space-y-2">
            {[
              { label: "Initial capital",           value: fmtMoney(data.runway.initial_capital, currency) },
              { label: "Monthly burn",              value: fmtMoney(data.runway.monthly_burn_rate, currency) },
              { label: "Cash at month 12",          value: fmtMoney(data.runway.cash_at_month_12, currency) },
              { label: "Runway with revenue",       value: `${data.runway.runway_with_revenue_months} months` },
            ].map(({ label, value }) => (
              <li key={label} className="flex items-center justify-between text-[12px]">
                <span className="text-white/35" style={MONO}>{label}</span>
                <span className="font-semibold text-white/75" style={MONO}>{value}</span>
              </li>
            ))}
          </ul>
          {burnBreakdown.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {burnBreakdown.map((item, i) => (
                <span key={i} className="rounded-full border border-white/[0.07] bg-white/[0.03] px-2.5 py-0.5 text-[10px] text-white/40">
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Scenarios — bear / base / bull ── */}
      <div>
        <SectionLabel icon={TrendingUp}>Scenarios</SectionLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {scenarios.map((scenario, i) => {
            const cfg = scenarioConfig(scenario.scenario);
            return (
              <div
                key={i}
                className={cn(
                  "relative overflow-hidden rounded-xl border p-4 backdrop-blur-xl",
                  cfg.border, cfg.bg
                )}
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${cfg.dot} shadow-lg`} />
                  <p className={cn("text-[11px] font-bold uppercase tracking-widest", cfg.text)} style={MONO}>
                    {scenario.scenario}
                  </p>
                </div>
                <p className="mb-3 text-[12px] leading-relaxed text-white/60">{scenario.assumption}</p>
                <div className="space-y-1.5">
                  {[
                    { label: "Paid users", value: String(scenario.paid_users_month_12) },
                    { label: "MRR",        value: fmtMoney(scenario.mrr_month_12, currency) },
                    { label: "ARR",        value: fmtMoney(scenario.arr_month_12, currency) },
                    { label: "Profitable", value: scenario.profitable ? "Yes ✓" : "Not yet" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between text-[11px]">
                      <span className="text-white/30" style={MONO}>{label}</span>
                      <span
                        className={cn(
                          "font-semibold",
                          label === "Profitable" && scenario.profitable ? "text-emerald-400"
                          : label === "Profitable" ? "text-white/40"
                          : cfg.text
                        )}
                        style={MONO}
                      >
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── CFO Advice + Financial Risks ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* CFO Advice — emerald glass, it's the "good news / what to do" section */}
        <div className="relative overflow-hidden rounded-xl border border-emerald-400/15 bg-emerald-500/[0.05] p-5 backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/25 to-transparent" />
          <SectionLabel icon={ListChecks}>CFO Advice</SectionLabel>
          <ul className="space-y-2.5">
            {advice.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-white/65">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400/70" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Financial Risks — amber/rose glass */}
        <div className="relative overflow-hidden rounded-xl border border-rose-400/15 bg-rose-500/[0.05] p-5 backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-400/20 to-transparent" />
          <SectionLabel icon={ShieldAlert}>Financial Risks</SectionLabel>
          <ul className="space-y-2.5">
            {risks.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-white/65">
                <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400/70" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Model assumptions ── */}
      <div className="relative overflow-hidden rounded-xl border border-amber-400/10 bg-amber-500/[0.04] p-4 backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent" />
        <SectionLabel icon={TriangleAlert}>Model Assumptions</SectionLabel>
        <div className="flex flex-wrap gap-1.5">
          {assumptions.map((item, i) => (
            <span
              key={i}
              className="rounded-full border border-amber-400/15 bg-amber-500/[0.06] px-2.5 py-1 text-[11px] text-amber-200/70"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

    </div>
  );
}