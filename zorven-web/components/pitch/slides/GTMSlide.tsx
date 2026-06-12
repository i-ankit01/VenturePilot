"use client";
// components/pitch/slides/GTMSlide.tsx

import { GTMSlide as GTMSlideData } from "@/types/pitch";
import { SlideShell, SlideLabel, SlideHeading, NeonDivider, GlassCard, T, SlideNumber } from "../SlideShell";

interface Props { data: GTMSlideData }

export function GTMSlide({ data }: Props) {
  const phases = [
    { label: "Phase 1 · 0 → 100", text: data.phase_1 },
    { label: "Phase 2 · 100 → 1K", text: data.phase_2 },
    { label: "Phase 3 · 1K → 10K", text: data.phase_3 },
  ];

  return (
    <SlideShell>
      <div style={{ padding: "32px 48px 0 24px", display: "flex", flexDirection: "column", height: "100%" }}>
        <SlideLabel>Go-To-Market</SlideLabel>
        <div style={{ marginTop: 10, marginBottom: 18 }}>
          <SlideHeading>{data.headline}</SlideHeading>
        </div>
        <NeonDivider />

        {/* 3 phase columns */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20, height: 240 }}>
          {phases.map((p, i) => (
            <div key={i} style={{
              border: `1px solid ${i === 0 ? T.borderAccent : T.border}`,
              borderRadius: 12,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              boxShadow: i === 0 ? T.neonGlow : "none",
            }}>
              <div style={{
                background: i === 0 ? T.neon : "rgba(255,255,255,0.06)",
                padding: "10px 16px",
                fontFamily: T.fontHead, fontSize: 12, fontWeight: 700,
                color: i === 0 ? "#031018" : T.white,
              }}>
                {p.label}
              </div>
              <div style={{ padding: "14px 16px", flex: 1, background: T.bgCard }}>
                <p style={{ fontFamily: T.fontBody, fontSize: 12, color: T.gray1, lineHeight: 1.6, margin: 0 }}>
                  {p.text}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Channels */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
          <span style={{
            fontFamily: T.fontBody, fontSize: 10, fontWeight: 700,
            letterSpacing: "0.15em", textTransform: "uppercase", color: T.gray2,
          }}>
            Channels
          </span>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {data.primary_channels.map((c, i) => (
              <span key={i} style={{
                border: `1px solid ${T.border}`, borderRadius: 20,
                padding: "5px 14px", fontFamily: T.fontBody, fontSize: 11, color: T.gray2,
              }}>
                {c}
              </span>
            ))}
          </div>
        </div>

        {/* North star */}
        <div style={{ marginTop: "auto" }}>
          <GlassCard style={{ background: "rgba(245,158,11,0.08)", border: `1px solid rgba(245,158,11,0.3)` }}>
            <span style={{ fontFamily: T.fontHead, fontSize: 11, fontWeight: 700, color: T.amber, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              ★ North Star —{" "}
            </span>
            <span style={{ fontFamily: T.fontBody, fontSize: 13, color: T.gray1 }}>
              {data.north_star}
            </span>
          </GlassCard>
        </div>
      </div>
      <SlideNumber n={9} />
    </SlideShell>
  );
}