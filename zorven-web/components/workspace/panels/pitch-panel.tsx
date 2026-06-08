import { PartialResult } from "@/lib/api";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Presentation, CheckCircle2, XCircle, HelpCircle, ChevronRight, BadgeInfo } from "lucide-react";

interface Props { data: NonNullable<PartialResult["pitch_output"]> }

export function PitchPanel({ data }: Props) {
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    { title: data.slide_01_cover.startup_name, subtitle: data.slide_01_cover.tagline },
    { title: data.slide_02_problem.headline, subtitle: "Problem" },
    { title: data.slide_03_solution.headline, subtitle: "Solution" },
    { title: data.slide_04_product.headline, subtitle: "Product" },
    { title: data.slide_05_market.headline, subtitle: "Market Size" },
    { title: data.slide_06_business.headline, subtitle: "Business Model" },
    { title: data.slide_07_traction.headline, subtitle: "Traction" },
    { title: data.slide_08_competition.headline, subtitle: "Competition" },
    { title: data.slide_09_gtm.headline, subtitle: "Go-To-Market" },
    { title: data.slide_10_team.headline, subtitle: "Team" },
    { title: data.slide_11_financials.headline, subtitle: "Financials" },
    { title: data.slide_12_ask.headline, subtitle: "The Ask" },
  ];

  function renderSlideDetails(index: number) {
    switch (index) {
      case 0:
        return (
          <div className="space-y-3">
            <div className="rounded-lg border border-border/40 bg-muted/20 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>Cover</p>
              <p className="mt-1 text-sm text-foreground">{data.slide_01_cover.one_liner}</p>
            </div>
            <p className="rounded-lg border border-border/40 bg-card p-4 text-[12px] leading-relaxed text-muted-foreground">{data.slide_01_cover.presenter_note}</p>
          </div>
        );
      case 1:
        return (
          <div className="space-y-3">
            {data.slide_02_problem.pain_points.map((point, i) => (
              <div key={i} className="rounded-lg border border-border/40 bg-card p-4">
                <p className="font-semibold text-foreground">{point.headline}</p>
                <p className="mt-1 text-[12px] text-muted-foreground">{point.supporting}</p>
              </div>
            ))}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-foreground">{data.slide_02_problem.emotional_hook}</div>
            <p className="rounded-lg border border-border/40 bg-muted/20 p-4 text-[12px] leading-relaxed text-muted-foreground">{data.slide_02_problem.presenter_note}</p>
          </div>
        );
      case 2:
        return (
          <div className="space-y-3">
            {data.slide_03_solution.solution_bullets.map((point, i) => (
              <div key={i} className="rounded-lg border border-border/40 bg-card p-4">
                <p className="font-semibold text-foreground">{point.headline}</p>
                <p className="mt-1 text-[12px] text-muted-foreground">{point.supporting}</p>
              </div>
            ))}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-foreground">{data.slide_03_solution.aha_moment}</div>
            <p className="rounded-lg border border-border/40 bg-muted/20 p-4 text-[12px] leading-relaxed text-muted-foreground">{data.slide_03_solution.presenter_note}</p>
          </div>
        );
      case 3:
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {data.slide_04_product.core_features.map((feature, i) => (
                <div key={i} className="rounded-lg border border-border/40 bg-card p-4 text-sm text-foreground">{feature}</div>
              ))}
            </div>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-foreground">{data.slide_04_product.demo_flow}</div>
            <div className="rounded-lg border border-border/40 bg-muted/20 p-4 text-[12px] text-muted-foreground">{data.slide_04_product.tech_differentiator}</div>
            <p className="rounded-lg border border-border/40 bg-muted/20 p-4 text-[12px] leading-relaxed text-muted-foreground">{data.slide_04_product.presenter_note}</p>
          </div>
        );
      case 4:
        return (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border/40 bg-card p-4 text-sm text-foreground">TAM: {data.slide_05_market.tam}</div>
            <div className="rounded-lg border border-border/40 bg-card p-4 text-sm text-foreground">SAM: {data.slide_05_market.sam}</div>
            <div className="rounded-lg border border-border/40 bg-card p-4 text-sm text-foreground">SOM: {data.slide_05_market.som}</div>
            <div className="sm:col-span-3 rounded-lg border border-border/40 bg-muted/20 p-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>Tailwinds</p>
              <div className="flex flex-wrap gap-1.5">
                {data.slide_05_market.market_tailwinds.map((item, i) => (
                  <span key={i} className="rounded-sm border border-border/40 bg-card px-2 py-0.5 text-[11px] text-muted-foreground">{item}</span>
                ))}
              </div>
              <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">{data.slide_05_market.presenter_note}</p>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-3">
            <p className="rounded-lg border border-border/40 bg-card p-4 text-sm text-foreground">{data.slide_06_business.model_description}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border/40 bg-muted/20 p-4">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>Pricing</p>
                <div className="space-y-2">
                  {data.slide_06_business.pricing_tiers.map((tier, i) => <div key={i} className="rounded-md border border-border/40 bg-card p-3 text-[12px] text-foreground">{tier}</div>)}
                </div>
              </div>
              <div className="rounded-lg border border-border/40 bg-muted/20 p-4">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>Unit Economics</p>
                <div className="space-y-2">
                  {data.slide_06_business.unit_economics.map((item, i) => <div key={i} className="rounded-md border border-border/40 bg-card p-3 text-[12px] text-foreground">{item}</div>)}
                </div>
              </div>
            </div>
            <p className="rounded-lg border border-border/40 bg-muted/20 p-4 text-[12px] leading-relaxed text-muted-foreground">{data.slide_06_business.presenter_note}</p>
          </div>
        );
      case 6:
        return (
          <div className="space-y-3">
            {data.slide_07_traction.traction_points.map((point, i) => (
              <div key={i} className="rounded-lg border border-border/40 bg-card p-4">
                <p className="font-semibold text-foreground">{point.headline}</p>
                <p className="mt-1 text-[12px] text-muted-foreground">{point.supporting}</p>
              </div>
            ))}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-foreground">{data.slide_07_traction.validation_quote}</div>
            <div className="flex flex-wrap gap-1.5">
              {data.slide_07_traction.next_milestones.map((item, i) => <span key={i} className="rounded-sm border border-border/40 bg-muted/20 px-2 py-0.5 text-[11px] text-muted-foreground">{item}</span>)}
            </div>
            <p className="rounded-lg border border-border/40 bg-muted/20 p-4 text-[12px] leading-relaxed text-muted-foreground">{data.slide_07_traction.presenter_note}</p>
          </div>
        );
      case 7:
        return (
          <div className="space-y-3">
            <div className="rounded-lg border border-border/40 bg-card p-4 text-sm text-foreground">{data.slide_08_competition.our_moat}</div>
            <div className="overflow-hidden rounded-xl border border-border/50">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30 bg-muted/20">
                    <th className="px-4 py-2 text-left text-[10px] uppercase text-muted-foreground/60">Competitor</th>
                    <th className="px-4 py-2 text-center text-[10px] uppercase text-muted-foreground/60">Us</th>
                    <th className="px-4 py-2 text-center text-[10px] uppercase text-muted-foreground/60">WhatsApp</th>
                    <th className="px-4 py-2 text-center text-[10px] uppercase text-muted-foreground/60">GST</th>
                    <th className="px-4 py-2 text-center text-[10px] uppercase text-muted-foreground/60">Auto</th>
                    <th className="px-4 py-2 text-center text-[10px] uppercase text-muted-foreground/60">Freelancer</th>
                    <th className="px-4 py-2 text-center text-[10px] uppercase text-muted-foreground/60">Affordable</th>
                  </tr>
                </thead>
                <tbody>
                  {data.slide_08_competition.competitor_matrix.map((row, i) => (
                    <tr key={i} className="border-b border-border/20">
                      <td className="px-4 py-2 text-[12px] text-foreground">{row.competitor_name}</td>
                      {[row.is_us, row.whatsapp_native, row.gst_compliant, row.auto_reminders, row.freelancer_focused, row.affordable_inr].map((value, j) => (
                        <td key={j} className="px-4 py-2 text-center">{value ? <CheckCircle2 className="inline h-4 w-4 text-emerald-400" /> : <XCircle className="inline h-4 w-4 text-muted-foreground/30" />}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="rounded-lg border border-border/40 bg-muted/20 p-4 text-[12px] leading-relaxed text-muted-foreground">{data.slide_08_competition.presenter_note}</p>
          </div>
        );
      case 8:
        return (
          <div className="space-y-3">
            <p className="rounded-lg border border-border/40 bg-card p-4 text-sm text-foreground">{data.slide_09_gtm.phase_1}</p>
            <p className="rounded-lg border border-border/40 bg-card p-4 text-sm text-foreground">{data.slide_09_gtm.phase_2}</p>
            <p className="rounded-lg border border-border/40 bg-card p-4 text-sm text-foreground">{data.slide_09_gtm.phase_3}</p>
            <div className="flex flex-wrap gap-1.5">
              {data.slide_09_gtm.primary_channels.map((item, i) => <span key={i} className="rounded-sm border border-border/40 bg-muted/20 px-2 py-0.5 text-[11px] text-muted-foreground">{item}</span>)}
            </div>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-foreground">North star: {data.slide_09_gtm.north_star}</div>
            <p className="rounded-lg border border-border/40 bg-muted/20 p-4 text-[12px] leading-relaxed text-muted-foreground">{data.slide_09_gtm.presenter_note}</p>
          </div>
        );
      case 9:
        return (
          <div className="space-y-3">
            <p className="rounded-lg border border-border/40 bg-card p-4 text-sm text-foreground">{data.slide_10_team.why_us}</p>
            <div className="flex flex-wrap gap-1.5">
              {data.slide_10_team.key_hires_needed.map((item, i) => <span key={i} className="rounded-sm border border-border/40 bg-muted/20 px-2 py-0.5 text-[11px] text-muted-foreground">{item}</span>)}
            </div>
            <p className="rounded-lg border border-border/40 bg-muted/20 p-4 text-[12px] text-muted-foreground">{data.slide_10_team.advisors_or_supporters}</p>
            <p className="rounded-lg border border-border/40 bg-muted/20 p-4 text-[12px] leading-relaxed text-muted-foreground">{data.slide_10_team.presenter_note}</p>
          </div>
        );
      case 10:
        return (
          <div className="space-y-3">
            <p className="rounded-lg border border-border/40 bg-card p-4 text-sm text-foreground">{data.slide_11_financials.projection_narrative}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border/40 bg-card p-4 text-sm text-foreground">ARR: {data.slide_11_financials.snapshot.arr_month_12}</div>
              <div className="rounded-lg border border-border/40 bg-card p-4 text-sm text-foreground">MRR: {data.slide_11_financials.snapshot.mrr_month_12}</div>
              <div className="rounded-lg border border-border/40 bg-card p-4 text-sm text-foreground">Paid users: {data.slide_11_financials.snapshot.paid_users_month_12}</div>
              <div className="rounded-lg border border-border/40 bg-card p-4 text-sm text-foreground">Break even: {data.slide_11_financials.snapshot.break_even_month}</div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {data.slide_11_financials.key_assumptions.map((item, i) => <span key={i} className="rounded-sm border border-border/40 bg-muted/20 px-2 py-0.5 text-[11px] text-muted-foreground">{item}</span>)}
            </div>
            <p className="rounded-lg border border-border/40 bg-muted/20 p-4 text-[12px] leading-relaxed text-muted-foreground">{data.slide_11_financials.presenter_note}</p>
          </div>
        );
      case 11:
        return (
          <div className="space-y-3">
            <p className="rounded-lg border border-border/40 bg-card p-4 text-sm text-foreground">{data.slide_12_ask.headline}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border/40 bg-muted/20 p-4 text-sm text-foreground">Raise: {data.slide_12_ask.raise_amount}</div>
              <div className="rounded-lg border border-border/40 bg-muted/20 p-4 text-sm text-foreground">{data.slide_12_ask.closing_line}</div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {data.slide_12_ask.use_of_funds.map((item, i) => <span key={i} className="rounded-sm border border-border/40 bg-card px-2 py-0.5 text-[11px] text-muted-foreground">{item}</span>)}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {data.slide_12_ask.milestones_unlocked.map((item, i) => <span key={i} className="rounded-sm border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] text-primary">{item}</span>)}
            </div>
            <p className="rounded-lg border border-border/40 bg-muted/20 p-4 text-[12px] leading-relaxed text-muted-foreground">{data.slide_12_ask.presenter_note}</p>
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-primary/60" style={{ fontFamily: "'DM Mono', monospace" }}>Deck</p>
        <h2 className="mt-1 text-2xl font-bold text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{data.deck_title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{data.pitch_narrative_summary}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-primary/70">
          <span className="rounded-sm border border-primary/20 bg-background/50 px-2 py-0.5">{data.total_slides} slides</span>
          <span className="rounded-sm border border-primary/20 bg-background/50 px-2 py-0.5">{data.recommended_duration}</span>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <Presentation className="h-4 w-4 text-primary/70" />
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>
            Pitch Deck — {slides.length} slides
          </h3>
        </div>

        <div className="grid grid-cols-[200px_1fr] gap-4">
          <div className="space-y-1 overflow-y-auto max-h-96">
            {slides.map((slide, i) => (
              <button
                key={i}
                onClick={() => setActiveSlide(i)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[12px] transition-all",
                  activeSlide === i
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
                )}
              >
                <span className="w-5 shrink-0 text-[10px] text-muted-foreground/40" style={{ fontFamily: "'DM Mono', monospace" }}>{i + 1}</span>
                <span className="truncate">{slide.title}</span>
                {activeSlide === i && <ChevronRight className="ml-auto h-3 w-3 shrink-0" />}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-border/50 bg-card p-6">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-primary/60" style={{ fontFamily: "'DM Mono', monospace" }}>
              Slide {activeSlide + 1}
            </p>
            <h2 className="mb-1 text-xl font-bold text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{slides[activeSlide].title}</h2>
            <p className="mb-4 text-[12px] text-muted-foreground">{slides[activeSlide].subtitle}</p>
            {renderSlideDetails(activeSlide)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
          <div className="mb-2 flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-primary/70" />
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>Hardest Questions</h3>
          </div>
          <ul className="space-y-2">
            {data.hardest_questions.map((question, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                {question}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
          <div className="mb-2 flex items-center gap-2">
            <BadgeInfo className="h-4 w-4 text-primary/70" />
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>Follow-Up Email</h3>
          </div>
          <pre className="whitespace-pre-wrap rounded-lg border border-border/40 bg-card p-4 text-[12px] leading-relaxed text-foreground font-sans">{data.email_follow_up}</pre>
        </div>
      </div>
    </div>
  );
}
