"use client";
// components/pitch/slides/TeamSlide.tsx

import { TeamSlide as TeamSlideData } from "@/types/pitch";
import { SlideShell, SlideLabel, SlideHeading, NeonDivider, GlassCard, T, SlideNumber } from "../SlideShell";

interface Props { data: TeamSlideData }

export function TeamSlide({ data }: Props) {
  return (
    <SlideShell>
      <div style={{ padding: "32px 48px 0 24px", display: "flex", flexDirection: "column", height: "100%" }}>
        <SlideLabel>Team</SlideLabel>
        <div style={{ marginTop: 10, marginBottom: 18 }}>
          <SlideHeading>{data.headline}</SlideHeading>
        </div>
        <NeonDivider />

        {/* Why us */}
        <div style={{
          background: T.bgCard,
          border: `1px solid ${T.borderAccent}`,
          borderRadius: 12,
          padding: "20px 24px",
          marginBottom: 22,
          boxShadow: T.neonGlow,
        }}>
          <p style={{
            fontFamily: T.fontHead, fontSize: 16, fontStyle: "italic",
            fontWeight: 500, color: T.white, margin: 0, lineHeight: 1.6,
          }}>
            {data.why_us}
          </p>
        </div>

        {/* Key hires */}
        <div style={{ marginBottom: 22 }}>
          <div style={{
            fontFamily: T.fontBody, fontSize: 10, fontWeight: 700,
            letterSpacing: "0.15em", textTransform: "uppercase",
            color: T.gray2, marginBottom: 12,
          }}>
            Key Hires Needed
          </div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${data.key_hires_needed.length}, 1fr)`, gap: 12 }}>
            {data.key_hires_needed.map((hire, i) => (
              <GlassCard key={i}>
                <p style={{ fontFamily: T.fontBody, fontSize: 13, color: T.gray1, margin: 0, lineHeight: 1.5 }}>
                  {hire}
                </p>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Advisors */}
        <div style={{ marginTop: "auto" }}>
          <div style={{
            background: "rgba(255,255,255,0.02)",
            borderRadius: 12,
            padding: "14px 20px",
            border: `1px solid ${T.border}`,
          }}>
            <span style={{
              fontFamily: T.fontBody, fontSize: 10, fontWeight: 700,
              letterSpacing: "0.15em", textTransform: "uppercase", color: T.gray3,
            }}>
              Advisors —{" "}
            </span>
            <span style={{ fontFamily: T.fontBody, fontSize: 12, color: T.gray2, fontStyle: "italic" }}>
              {data.advisors_or_supporters}
            </span>
          </div>
        </div>
      </div>
      <SlideNumber n={10} />
    </SlideShell>
  );
}