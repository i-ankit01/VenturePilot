"use client";
// components/pitch/slides/FinancialsSlide.tsx

import { FinancialsSlide as FinancialsSlideData } from "@/types/pitch";
import { SlideShell, SlideLabel, SlideHeading, NeonDivider, StatCard, T, SlideNumber } from "../SlideShell";

interface Props { data: FinancialsSlideData }

export function FinancialsSlide({ data }: Props) {
  const snap = data.snapshot;
  const row1 = [
    { value: snap.arr_month_12, label: "ARR · Month 12", accent: true },
    { value: snap.paid_users_month_12, label: "Paying Users · M12", accent: false },
    { value: snap.ltv_cac, label: "LTV : CAC", accent: true },
    { value: snap.break_even_month, label: "Break-Even", accent: false },
  ];
  const row2 = [
    { value: snap.mrr_month_12, label: "MRR · Month 12" },
    { value: snap.gross_margin, label: "Gross Margin" },
    { value: snap.runway, label: "Runway" },
    { value: snap.raise_amount, label: "Raising" },
  ];

  return (
    <SlideShell>
      <div style={{ padding: "32px 48px 0 24px", display: "flex", flexDirection: "column", height: "100%" }}>
        <SlideLabel>Financials</SlideLabel>
        <div style={{ marginTop: 10, marginBottom: 18 }}>
          <SlideHeading>{data.headline}</SlideHeading>
        </div>
        <NeonDivider />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
          {row1.map((s, i) => (
            <StatCard key={i} value={s.value} label={s.label} accent={s.accent} />
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
          {row2.map((s, i) => (
            <StatCard key={i} value={s.value} label={s.label} />
          ))}
        </div>

        <p style={{
          fontFamily: T.fontBody, fontSize: 13, color: T.gray2,
          lineHeight: 1.6, margin: "0 0 18px", fontStyle: "italic",
        }}>
          {data.projection_narrative}
        </p>

        <div style={{ marginTop: "auto", display: "flex", gap: 10, flexWrap: "wrap" }}>
          {data.key_assumptions.map((a, i) => (
            <div key={i} style={{
              border: `1px solid ${T.border}`, borderRadius: 8,
              padding: "8px 14px", fontFamily: T.fontBody, fontSize: 11, color: T.gray2,
            }}>
              {a}
            </div>
          ))}
        </div>
      </div>
      <SlideNumber n={11} />
    </SlideShell>
  );
}