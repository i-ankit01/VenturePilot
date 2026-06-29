"use client";

import { PartialResult } from "@/lib/api";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Presentation, CheckCircle2, XCircle, HelpCircle,
  BadgeInfo, ChevronRight, Sparkles, TrendingUp, AlertTriangle
} from "lucide-react";

interface Props { data: NonNullable<PartialResult["pitch_output"]> }

const MONO = { fontFamily: "'DM Mono', monospace" };
const NEON  = "linear-gradient(90deg, rgb(147,197,253) 0%, rgba(96,165,250,0.85) 60%, rgba(255,255,255,0.7) 100%)";

// ─── Per-slide accent config ──────────────────────────────────────────────────
const SLIDE_CONFIG = [
  { accent: "blue",    group: "Intro" },       // 0  Cover
  { accent: "rose",    group: "Problem" },      // 1  Problem
  { accent: "blue",    group: "Solution" },     // 2  Solution
  { accent: "blue",    group: "Product" },      // 3  Product
  { accent: "emerald", group: "Market" },       // 4  Market
  { accent: "amber",   group: "Business" },     // 5  Business Model
  { accent: "emerald", group: "Traction" },     // 6  Traction
  { accent: "rose",    group: "Competition" },  // 7  Competition
  { accent: "blue",    group: "GTM" },          // 8  GTM
  { accent: "blue",    group: "Team" },         // 9  Team
  { accent: "amber",   group: "Financials" },   // 10 Financials
  { accent: "amber",   group: "The Ask" },      // 11 Ask
];

const ACCENT = {
  blue:    { border: "border-blue-400/25",    bg: "bg-blue-500/[0.06]",    text: "text-blue-300",    badge: "border-blue-400/20 bg-blue-500/[0.08] text-blue-300",    ring: "ring-blue-400/30",   glow: "via-blue-400/40",    dot: "bg-blue-400" },
  rose:    { border: "border-rose-400/20",    bg: "bg-rose-500/[0.06]",    text: "text-rose-300",    badge: "border-rose-400/20 bg-rose-500/[0.08] text-rose-300",    ring: "ring-rose-400/30",   glow: "via-rose-400/40",    dot: "bg-rose-400" },
  emerald: { border: "border-emerald-400/20", bg: "bg-emerald-500/[0.06]", text: "text-emerald-300", badge: "border-emerald-400/20 bg-emerald-500/[0.08] text-emerald-300", ring: "ring-emerald-400/30", glow: "via-emerald-400/40", dot: "bg-emerald-400" },
  amber:   { border: "border-amber-400/20",   bg: "bg-amber-500/[0.06]",   text: "text-amber-300",   badge: "border-amber-400/20 bg-amber-500/[0.08] text-amber-300",   ring: "ring-amber-400/30",  glow: "via-amber-400/30",   dot: "bg-amber-400" },
};

function PresenterNote({ note }: { note: string }) {
  return (
    <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
      <p className="mb-1 text-[9px] uppercase tracking-widest text-white/20" style={MONO}>Presenter note</p>
      <p className="text-[12px] leading-relaxed text-white/45 italic">{note}</p>
    </div>
  );
}

function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-blue-400/15 bg-blue-500/[0.06] px-4 py-3 backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent" />
      <Sparkles className="mb-1 h-3.5 w-3.5 text-blue-300/60" />
      <p className="text-[13px] leading-relaxed text-white/80">{children}</p>
    </div>
  );
}

function BulletCard({ headline, supporting }: { headline: string; supporting: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-xl">
      <p className="text-[13px] font-semibold text-white/90" style={MONO}>{headline}</p>
      <p className="mt-1 text-[12px] leading-relaxed text-white/50">{supporting}</p>
    </div>
  );
}

function Chip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px]", className)}>
      {children}
    </span>
  );
}

// ─── Slide detail renderers ───────────────────────────────────────────────────
function renderSlideDetails(index: number, data: NonNullable<PartialResult["pitch_output"]>) {
  switch (index) {
    case 0: return (
      <div className="space-y-3">
        <div className="rounded-xl border border-blue-400/15 bg-blue-500/[0.05] p-5 backdrop-blur-xl">
          <p className="text-[10px] uppercase tracking-widest text-blue-300/60 mb-1" style={MONO}>One-liner</p>
          <p className="text-[15px] font-semibold leading-snug bg-clip-text text-transparent" style={{ ...MONO, backgroundImage: NEON }}>
            {data.slide_01_cover.one_liner}
          </p>
        </div>
        <PresenterNote note={data.slide_01_cover.presenter_note} />
      </div>
    );

    case 1: return (
      <div className="space-y-3">
        {data.slide_02_problem.pain_points.map((p, i) => <BulletCard key={i} headline={p.headline} supporting={p.supporting} />)}
        <Highlight>{data.slide_02_problem.emotional_hook}</Highlight>
        <PresenterNote note={data.slide_02_problem.presenter_note} />
      </div>
    );

    case 2: return (
      <div className="space-y-3">
        {data.slide_03_solution.solution_bullets.map((p, i) => <BulletCard key={i} headline={p.headline} supporting={p.supporting} />)}
        <Highlight>{data.slide_03_solution.aha_moment}</Highlight>
        <PresenterNote note={data.slide_03_solution.presenter_note} />
      </div>
    );

    case 3: return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {data.slide_04_product.core_features.map((f, i) => (
            <div key={i} className="flex items-start gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-300/60" />
              <span className="text-[12px] text-white/70">{f}</span>
            </div>
          ))}
        </div>
        <Highlight>{data.slide_04_product.demo_flow}</Highlight>
        <div className="rounded-xl border border-white/[0.05] bg-white/[0.015] px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-white/25 mb-1" style={MONO}>Tech Differentiator</p>
          <p className="text-[12px] text-white/55">{data.slide_04_product.tech_differentiator}</p>
        </div>
        <PresenterNote note={data.slide_04_product.presenter_note} />
      </div>
    );

    case 4: return (
      <div className="space-y-3">
        {/* TAM / SAM / SOM nested visual */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "TAM", value: data.slide_05_market.tam, opacity: "from-emerald-500/[0.12]", border: "border-emerald-400/25", text: "text-emerald-300" },
            { label: "SAM", value: data.slide_05_market.sam, opacity: "from-emerald-500/[0.07]", border: "border-emerald-400/15", text: "text-emerald-200" },
            { label: "SOM", value: data.slide_05_market.som, opacity: "from-emerald-500/[0.04]", border: "border-emerald-400/10", text: "text-emerald-100/70" },
          ].map(({ label, value, opacity, border, text }) => (
            <div key={label} className={cn("relative overflow-hidden rounded-xl border p-4 text-center backdrop-blur-xl bg-gradient-to-b to-transparent", border, opacity)}>
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/25 to-transparent" />
              <p className={cn("text-[10px] font-bold uppercase tracking-widest mb-1", text)} style={MONO}>{label}</p>
              <p className={cn("text-lg font-bold", text)} style={MONO}>{value}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="mb-2 text-[10px] uppercase tracking-widest text-white/25" style={MONO}>Market Tailwinds</p>
          <div className="flex flex-wrap gap-1.5">
            {data.slide_05_market.market_tailwinds.map((item, i) => (
              <Chip key={i} className="border-emerald-400/20 bg-emerald-500/[0.07] text-emerald-300/80">
                <TrendingUp className="inline h-2.5 w-2.5 mr-1 mb-0.5" />{item}
              </Chip>
            ))}
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-white/45">{data.slide_05_market.presenter_note}</p>
        </div>
      </div>
    );

    case 5: return (
      <div className="space-y-3">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-white/70">{data.slide_06_business.model_description}</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { label: "Pricing Tiers", items: data.slide_06_business.pricing_tiers },
            { label: "Unit Economics", items: data.slide_06_business.unit_economics },
          ].map(({ label, items }) => (
            <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="mb-2 text-[10px] uppercase tracking-widest text-white/25" style={MONO}>{label}</p>
              <div className="space-y-1.5">
                {items.map((item, i) => (
                  <div key={i} className="rounded-lg border border-white/[0.05] bg-white/[0.015] px-3 py-2 text-[12px] text-white/65">{item}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <PresenterNote note={data.slide_06_business.presenter_note} />
      </div>
    );

    case 6: return (
      <div className="space-y-3">
        {data.slide_07_traction.traction_points.map((p, i) => <BulletCard key={i} headline={p.headline} supporting={p.supporting} />)}
        <div className="relative overflow-hidden rounded-xl border border-emerald-400/20 bg-emerald-500/[0.07] px-5 py-4 backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />
          <p className="mb-1 text-[9px] uppercase tracking-widest text-emerald-400/60" style={MONO}>Validation</p>
          <p className="text-[13px] leading-relaxed text-white/80 italic">"{data.slide_07_traction.validation_quote}"</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {data.slide_07_traction.next_milestones.map((item, i) => (
            <Chip key={i} className="border-white/[0.08] bg-white/[0.03] text-white/50">{item}</Chip>
          ))}
        </div>
        <PresenterNote note={data.slide_07_traction.presenter_note} />
      </div>
    );

    case 7: return (
      <div className="space-y-3">
        <div className="rounded-xl border border-rose-400/15 bg-rose-500/[0.05] px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-rose-300/60 mb-1" style={MONO}>Our Moat</p>
          <p className="text-sm text-white/80">{data.slide_08_competition.our_moat}</p>
        </div>
        {/* Competition table */}
        <div className="overflow-hidden rounded-xl border border-white/[0.06] backdrop-blur-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.03]">
                <th className="px-4 py-2.5 text-left text-[10px] uppercase tracking-wider text-white/30" style={MONO}>Competitor</th>
                {["Us", "WhatsApp", "GST", "Auto", "Freelancer", "Affordable"].map(h => (
                  <th key={h} className="px-3 py-2.5 text-center text-[10px] uppercase tracking-wider text-white/30" style={MONO}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.slide_08_competition.competitor_matrix.map((row, i) => (
                <tr key={i} className={cn("border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]", i % 2 === 0 ? "" : "bg-white/[0.01]")}>
                  <td className="px-4 py-2.5 text-[12px] text-white/65" style={MONO}>{row.competitor_name}</td>
                  {[row.is_us, row.whatsapp_native, row.gst_compliant, row.auto_reminders, row.freelancer_focused, row.affordable_inr].map((val, j) => (
                    <td key={j} className="px-3 py-2.5 text-center">
                      {val
                        ? <CheckCircle2 className="inline h-4 w-4 text-emerald-400" />
                        : <XCircle className="inline h-4 w-4 text-white/15" />
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PresenterNote note={data.slide_08_competition.presenter_note} />
      </div>
    );

    case 8: return (
      <div className="space-y-3">
        {[
          { label: "Phase 1", content: data.slide_09_gtm.phase_1 },
          { label: "Phase 2", content: data.slide_09_gtm.phase_2 },
          { label: "Phase 3", content: data.slide_09_gtm.phase_3 },
        ].map(({ label, content }) => (
          <div key={label} className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <span className="mt-0.5 rounded-full border border-blue-400/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-300 shrink-0" style={MONO}>{label}</span>
            <p className="text-[13px] text-white/70">{content}</p>
          </div>
        ))}
        <div className="flex flex-wrap gap-1.5">
          {data.slide_09_gtm.primary_channels.map((item, i) => (
            <Chip key={i} className="border-blue-400/20 bg-blue-500/[0.07] text-blue-300/80">{item}</Chip>
          ))}
        </div>
        <Highlight>North Star: {data.slide_09_gtm.north_star}</Highlight>
        <PresenterNote note={data.slide_09_gtm.presenter_note} />
      </div>
    );

    case 9: return (
      <div className="space-y-3">
        <div className="rounded-xl border border-blue-400/15 bg-blue-500/[0.05] px-4 py-4">
          <p className="text-[10px] uppercase tracking-widest text-blue-300/60 mb-1" style={MONO}>Why Us</p>
          <p className="text-sm leading-relaxed text-white/80">{data.slide_10_team.why_us}</p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="text-[10px] uppercase tracking-widest text-white/25 mb-2" style={MONO}>Key Hires Needed</p>
          <div className="flex flex-wrap gap-1.5">
            {data.slide_10_team.key_hires_needed.map((item, i) => (
              <Chip key={i} className="border-amber-400/20 bg-amber-500/[0.07] text-amber-300/80">{item}</Chip>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-white/[0.05] bg-white/[0.015] px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-white/25 mb-1" style={MONO}>Advisors & Supporters</p>
          <p className="text-[12px] text-white/55">{data.slide_10_team.advisors_or_supporters}</p>
        </div>
        <PresenterNote note={data.slide_10_team.presenter_note} />
      </div>
    );

    case 10: return (
      <div className="space-y-3">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-white/70">{data.slide_11_financials.projection_narrative}</div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "ARR",        value: data.slide_11_financials.snapshot.arr_month_12 },
            { label: "MRR",        value: data.slide_11_financials.snapshot.mrr_month_12 },
            { label: "Paid Users", value: String(data.slide_11_financials.snapshot.paid_users_month_12) },
            { label: "Break Even", value: `Month ${data.slide_11_financials.snapshot.break_even_month}` },
          ].map(({ label, value }) => (
            <div key={label} className="relative overflow-hidden rounded-xl border border-amber-400/15 bg-gradient-to-br from-amber-500/[0.07] to-transparent p-4 text-center backdrop-blur-xl">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/25 to-transparent" />
              <p className="text-[10px] uppercase tracking-widest text-amber-300/60 mb-0.5" style={MONO}>{label}</p>
              <p className="text-[17px] font-bold text-amber-200/90" style={MONO}>{value}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {data.slide_11_financials.key_assumptions.map((item, i) => (
            <Chip key={i} className="border-white/[0.07] bg-white/[0.03] text-white/40">{item}</Chip>
          ))}
        </div>
        <PresenterNote note={data.slide_11_financials.presenter_note} />
      </div>
    );

    case 11: return (
      <div className="space-y-3">
        {/* Hero raise amount */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-500/[0.10] via-white/[0.01] to-transparent p-6 backdrop-blur-2xl">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
          <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-amber-500/10 blur-[70px]" />
          <p className="relative z-10 text-[10px] uppercase tracking-widest text-amber-300/60 mb-1" style={MONO}>Raising</p>
          <p className="relative z-10 text-3xl font-bold bg-clip-text text-transparent" style={{ ...MONO, backgroundImage: "linear-gradient(90deg, rgb(253,230,138) 0%, rgba(251,191,36,0.85) 60%, rgba(255,255,255,0.6) 100%)" }}>
            {data.slide_12_ask.raise_amount}
          </p>
          <p className="relative z-10 mt-2 text-[13px] leading-relaxed text-white/55">{data.slide_12_ask.closing_line}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-white/25 mb-2" style={MONO}>Use of Funds</p>
          <div className="flex flex-wrap gap-1.5">
            {data.slide_12_ask.use_of_funds.map((item, i) => (
              <Chip key={i} className="border-white/[0.08] bg-white/[0.03] text-white/55">{item}</Chip>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-white/25 mb-2" style={MONO}>Milestones Unlocked</p>
          <div className="flex flex-wrap gap-1.5">
            {data.slide_12_ask.milestones_unlocked.map((item, i) => (
              <Chip key={i} className="border-emerald-400/20 bg-emerald-500/[0.08] text-emerald-300/90">{item}</Chip>
            ))}
          </div>
        </div>
        <PresenterNote note={data.slide_12_ask.presenter_note} />
      </div>
    );

    default: return null;
  }
}

// ─── Panel ────────────────────────────────────────────────────────────────────
export function PitchPanel({ data }: Props) {
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    { title: data.slide_01_cover.startup_name, subtitle: data.slide_01_cover.tagline },
    { title: data.slide_02_problem.headline,   subtitle: "Problem" },
    { title: data.slide_03_solution.headline,  subtitle: "Solution" },
    { title: data.slide_04_product.headline,   subtitle: "Product" },
    { title: data.slide_05_market.headline,    subtitle: "Market Size" },
    { title: data.slide_06_business.headline,  subtitle: "Business Model" },
    { title: data.slide_07_traction.headline,  subtitle: "Traction" },
    { title: data.slide_08_competition.headline, subtitle: "Competition" },
    { title: data.slide_09_gtm.headline,       subtitle: "Go-To-Market" },
    { title: data.slide_10_team.headline,      subtitle: "Team" },
    { title: data.slide_11_financials.headline, subtitle: "Financials" },
    { title: data.slide_12_ask.headline,       subtitle: "The Ask" },
  ];

  const activeCfg = ACCENT[SLIDE_CONFIG[activeSlide]?.accent ?? "blue"];

  return (
    <div className="space-y-5">
      {/* ── Deck hero ── */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-400/20 bg-gradient-to-br from-blue-500/[0.08] via-white/[0.015] to-transparent p-6 backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />
        <div className="pointer-events-none absolute -top-14 -right-14 h-44 w-44 rounded-full bg-blue-500/10 blur-[80px]" />
        <div className="relative z-10">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/15 ring-1 ring-blue-400/30">
              <Presentation className="h-3 w-3 text-blue-300" />
            </span>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-300/80" style={MONO}>Pitch Deck</p>
          </div>
          <h2
            className="text-2xl font-bold leading-tight bg-clip-text text-transparent"
            style={{ ...MONO, backgroundImage: NEON }}
          >
            {data.deck_title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-white/50">{data.pitch_narrative_summary}</p>
          <div className="mt-3 flex gap-2">
            <Chip className="border-blue-400/20 bg-blue-500/[0.08] text-blue-300">{data.total_slides} slides</Chip>
            <Chip className="border-white/[0.08] bg-white/[0.03] text-white/40">{data.recommended_duration}</Chip>
          </div>
        </div>
      </div>

      {/* ── Slide navigator ── */}
      <div className="grid grid-cols-[200px_1fr] gap-4">
        {/* Slide list */}
        <div className="space-y-0.5 overflow-y-auto max-h-[520px] pr-1">
          {slides.map((slide, i) => {
            const cfg   = SLIDE_CONFIG[i];
            const acc   = ACCENT[cfg?.accent ?? "blue"];
            const isActive = activeSlide === i;
            return (
              <button
                key={i}
                onClick={() => setActiveSlide(i)}
                className={cn(
                  "group relative flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all duration-150",
                  isActive
                    ? cn("border", acc.border, acc.bg)
                    : "border border-transparent text-white/45 hover:bg-white/[0.03] hover:text-white/70",
                )}
              >
                {/* Active left bar */}
                {isActive && (
                  <span className={cn("absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full", acc.dot)} />
                )}

                {/* Slide number */}
                <span className={cn("w-5 shrink-0 text-[10px] font-semibold", isActive ? acc.text : "text-white/20")} style={MONO}>
                  {String(i + 1).padStart(2, "0")}
                </span>

                <div className="min-w-0 flex-1">
                  <p className={cn("truncate text-[11px] font-semibold", isActive ? "text-white/90" : "text-white/55")} style={MONO}>
                    {slide.title}
                  </p>
                  <p className={cn("text-[10px]", isActive ? acc.text : "text-white/25")}>{slide.subtitle}</p>
                </div>

                {isActive && <ChevronRight className={cn("h-3 w-3 shrink-0", acc.text)} />}
              </button>
            );
          })}
        </div>

        {/* Slide content pane */}
        <div className={cn(
          "relative overflow-hidden rounded-2xl border backdrop-blur-2xl p-6",
          activeCfg.border, "bg-white/[0.02]"
        )}>
          {/* Accent top edge glow */}
          <div className={cn("pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent", activeCfg.glow)} />

          {/* Header */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={cn("text-[10px] font-semibold uppercase tracking-widest", activeCfg.text)} style={MONO}>
                Slide {activeSlide + 1} · {SLIDE_CONFIG[activeSlide]?.group}
              </span>
            </div>
            <h2 className="text-xl font-bold bg-clip-text text-transparent mb-0.5" style={{ ...MONO, backgroundImage: NEON }}>
              {slides[activeSlide].title}
            </h2>
            <p className="text-[12px] text-white/35">{slides[activeSlide].subtitle}</p>
          </div>

          {renderSlideDetails(activeSlide, data)}
        </div>
      </div>

      {/* ── Hardest questions + Follow-up email ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Hardest questions — amber warning treatment */}
        <div className="relative overflow-hidden rounded-xl border border-amber-400/15 bg-amber-500/[0.05] p-5 backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/25 to-transparent" />
          <div className="mb-3 flex items-center gap-2">
            <HelpCircle className="h-3.5 w-3.5 text-amber-300/70" />
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-white/30" style={MONO}>Hardest Questions</h3>
          </div>
          <ul className="space-y-2.5">
            {data.hardest_questions.map((q, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[13px] text-white/65">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400/70" />
                {q}
              </li>
            ))}
          </ul>
        </div>

        {/* Follow-up email — looks like an email compose UI */}
        <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/20 to-transparent" />
          <div className="mb-3 flex items-center gap-2">
            <BadgeInfo className="h-3.5 w-3.5 text-blue-300/70" />
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-white/30" style={MONO}>Follow-Up Email</h3>
          </div>
          {/* Email card */}
          <div className="rounded-xl border border-blue-400/10 bg-blue-500/[0.04]">
            <div className="border-b border-white/[0.05] px-4 py-2.5">
              <p className="text-[10px] text-white/25" style={MONO}>To: investor@example.com</p>
            </div>
            <pre className="whitespace-pre-wrap px-4 py-3 text-[11px] leading-relaxed text-white/55 font-sans">
              {data.email_follow_up}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}