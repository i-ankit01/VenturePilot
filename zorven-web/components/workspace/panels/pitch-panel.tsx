import { PartialResult } from "@/lib/api";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Presentation, CheckCircle2, XCircle, HelpCircle, Mail, ChevronRight } from "lucide-react";

interface Props { data: NonNullable<PartialResult["pitch_output"]> }

export function PitchPanel({ data }: Props) {
  const [activeSlide, setActiveSlide] = useState(0);
  const slide = data.slides[activeSlide];

  return (
    <div className="space-y-5">
      {/* Slide deck */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Presentation className="h-4 w-4 text-primary/70" />
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>
            Pitch Deck — {data.slides.length} slides
          </h3>
        </div>

        <div className="grid grid-cols-[200px_1fr] gap-4">
          {/* Slide list */}
          <div className="space-y-1 overflow-y-auto max-h-96">
            {data.slides.map((s, i) => (
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
                <span className="truncate">{s.title}</span>
                {activeSlide === i && <ChevronRight className="ml-auto h-3 w-3 shrink-0" />}
              </button>
            ))}
          </div>

          {/* Slide content */}
          <div className="rounded-xl border border-border/50 bg-card p-6">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-primary/60" style={{ fontFamily: "'DM Mono', monospace" }}>
              Slide {activeSlide + 1}
            </p>
            <h2 className="mb-4 text-xl font-bold text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{slide.title}</h2>
            <p className="mb-5 text-sm leading-relaxed text-foreground">{slide.content}</p>
            <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50" style={{ fontFamily: "'DM Mono', monospace" }}>Presenter Notes</p>
              <p className="text-[12px] leading-relaxed text-muted-foreground italic">{slide.presenter_notes}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Competitor matrix */}
      {data.competitor_matrix.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border/50">
          <div className="border-b border-border/50 bg-muted/30 px-5 py-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>Competitor Matrix</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground/60">Feature</th>
                  <th className="px-4 py-2.5 text-center text-[10px] font-semibold uppercase text-primary">Us</th>
                  {Object.keys(data.competitor_matrix[0]?.competitors ?? {}).map((name) => (
                    <th key={name} className="px-4 py-2.5 text-center text-[10px] font-semibold uppercase text-muted-foreground/60">{name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.competitor_matrix.map((row, i) => (
                  <tr key={i} className="border-b border-border/20 hover:bg-muted/10">
                    <td className="px-4 py-2.5 text-[12px] text-foreground">{row.feature}</td>
                    <td className="px-4 py-2.5 text-center">
                      {row.us ? <CheckCircle2 className="inline h-4 w-4 text-emerald-400" /> : <XCircle className="inline h-4 w-4 text-muted-foreground/30" />}
                    </td>
                    {Object.values(row.competitors).map((has, j) => (
                      <td key={j} className="px-4 py-2.5 text-center">
                        {has ? <CheckCircle2 className="inline h-4 w-4 text-muted-foreground/40" /> : <XCircle className="inline h-4 w-4 text-muted-foreground/20" />}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Investor Q&As */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <HelpCircle className="h-4 w-4 text-primary/70" />
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>Investor Q&A</h3>
        </div>
        {data.investor_qas.map((qa, i) => (
          <div key={i} className="rounded-lg border border-border/50 bg-card p-4">
            <p className="mb-2 text-[13px] font-semibold text-foreground">Q: {qa.question}</p>
            <p className="text-[12px] leading-relaxed text-muted-foreground">A: {qa.answer}</p>
          </div>
        ))}
      </div>

      {/* Follow-up email */}
      <div className="rounded-xl border border-border/50 bg-card p-5">
        <div className="mb-3 flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary/70" />
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60" style={{ fontFamily: "'DM Mono', monospace" }}>Follow-Up Email Template</h3>
        </div>
        <pre className="whitespace-pre-wrap rounded-lg border border-border/40 bg-muted/20 p-4 text-[12px] leading-relaxed text-foreground font-sans">{data.follow_up_email}</pre>
      </div>
    </div>
  );
}