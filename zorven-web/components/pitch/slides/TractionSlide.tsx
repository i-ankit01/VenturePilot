"use client";
// components/pitch/slides/TractionSlide.tsx

import { TractionSlide as TractionSlideData } from "@/types/pitch";
import { SlideShell, SlideLabel, SlideHeading, NeonDivider, BulletRow, T, SlideNumber } from "../SlideShell";

interface Props { data: TractionSlideData }

export function TractionSlide({ data }: Props) {
  return (
    <SlideShell>
      <div style={{ padding: "32px 48px 0 24px", display: "flex", flexDirection: "column", height: "100%" }}>
        <SlideLabel>Traction</SlideLabel>
        <div style={{ marginTop: 10, marginBottom: 18 }}>
          <SlideHeading>{data.headline}</SlideHeading>
        </div>
        <NeonDivider />

        <div style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 22 }}>
          {data.traction_points.map((p, i) => (
            <BulletRow key={i} headline={p.headline} supporting={p.supporting} />
          ))}
        </div>

        {/* Quote */}
        <div style={{
          background: T.neonDim,
          border: `1px solid ${T.borderAccent}`,
          borderRadius: 12,
          padding: "16px 22px",
          marginBottom: 16,
          boxShadow: T.neonGlow,
        }}>
          <p style={{
            fontFamily: T.fontHead, fontSize: 15, fontStyle: "italic",
            fontWeight: 500, color: T.white, margin: 0, lineHeight: 1.5,
          }}>
            &ldquo;{data.validation_quote}&rdquo;
          </p>
        </div>

        {/* Milestones */}
        <div style={{ marginTop: "auto", display: "flex", gap: 12, flexWrap: "wrap" }}>
          {data.next_milestones.map((m, i) => (
            <div key={i} style={{
              border: `1px solid ${T.border}`,
              borderRadius: 20,
              padding: "6px 16px",
              fontFamily: T.fontBody, fontSize: 11, color: T.gray2,
            }}>
              {m}
            </div>
          ))}
        </div>
      </div>
      <SlideNumber n={7} />
    </SlideShell>
  );
}