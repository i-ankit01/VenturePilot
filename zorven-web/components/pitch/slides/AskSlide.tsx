"use client";
// components/pitch/slides/AskSlide.tsx

import { AskSlide as AskSlideData } from "@/types/pitch";
import { T } from "../SlideShell";

interface Props { data: AskSlideData }

export function AskSlide({ data }: Props) {
  return (
    <div
      style={{
        width: "1280px",
        height: "720px",
        background: T.bg,
        position: "relative",
        overflow: "hidden",
        fontFamily: T.fontBody,
        display: "flex",
        flexDirection: "column",
        padding: "40px 56px",
      }}
    >
      {/* Ambient glow */}
      <div style={{
        position: "absolute", top: -180, right: -150,
        width: 600, height: 600, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(56,189,248,0.1) 0%, transparent 65%)",
        pointerEvents: "none",
      }} />

      {/* Left accent bar */}
      <div style={{
        position: "absolute", left: 0, top: 0,
        width: 6, height: "100%",
        background: `linear-gradient(180deg, ${T.neon} 0%, rgba(56,189,248,0.2) 100%)`,
        boxShadow: `6px 0 30px rgba(56,189,248,0.4)`,
      }} />

      {/* Bottom strip */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        height: 3,
        background: `linear-gradient(90deg, ${T.neon}, transparent)`,
        opacity: 0.5,
      }} />

      <div style={{ paddingLeft: 32, display: "flex", flexDirection: "column", height: "100%" }}>
        <span style={{
          fontFamily: T.fontBody, fontSize: 10, fontWeight: 700,
          letterSpacing: "0.18em", textTransform: "uppercase",
          color: T.neon, opacity: 0.8, marginBottom: 12,
        }}>
          The Ask
        </span>

        <h2 style={{
          fontFamily: T.fontHead, fontSize: 30, fontWeight: 700,
          color: T.white, margin: "0 0 8px", lineHeight: 1.2, maxWidth: 1000,
        }}>
          {data.headline}
        </h2>

        <div style={{
          fontFamily: T.fontHead, fontSize: 48, fontWeight: 800,
          color: T.amber, marginBottom: 28, letterSpacing: "-0.02em",
        }}>
          {data.raise_amount}
        </div>

        {/* Use of funds */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, marginBottom: 24 }}>
          {data.use_of_funds.map((item, i) => (
            <div key={i} style={{
              background: i % 2 === 0 ? T.neonDim : "rgba(255,255,255,0.04)",
              border: `1px solid ${i % 2 === 0 ? T.borderAccent : T.border}`,
              borderRadius: 12,
              padding: "16px 16px",
              minHeight: 80,
            }}>
              <p style={{ fontFamily: T.fontBody, fontSize: 12, color: T.gray1, margin: 0, lineHeight: 1.5 }}>
                {item}
              </p>
            </div>
          ))}
        </div>

        {/* Milestones */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            fontFamily: T.fontBody, fontSize: 10, fontWeight: 700,
            letterSpacing: "0.15em", textTransform: "uppercase",
            color: T.gray2, marginBottom: 12,
          }}>
            Milestones This Unlocks
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {data.milestones_unlocked.map((m, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{
                  width: 5, height: 5, borderRadius: "50%",
                  background: T.amber, flexShrink: 0,
                  boxShadow: `0 0 8px ${T.amber}`,
                }} />
                <span style={{ fontFamily: T.fontBody, fontSize: 13, color: T.gray1 }}>{m}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Closing line */}
        <div style={{
          marginTop: "auto",
          background: T.neonDim,
          border: `1px solid ${T.borderAccent}`,
          borderRadius: 16,
          padding: "22px 32px",
          textAlign: "center",
          boxShadow: T.neonGlow,
        }}>
          <p style={{
            fontFamily: T.fontHead, fontSize: 18, fontWeight: 600,
            fontStyle: "italic", color: T.white, margin: 0, lineHeight: 1.5,
          }}>
            {data.closing_line}
          </p>
        </div>
      </div>

      <div style={{
        position: "absolute", bottom: 20, right: 36,
        fontFamily: T.fontBody, fontSize: 11, color: T.gray3,
        fontWeight: 500, letterSpacing: "0.08em",
      }}>
        12 / 12
      </div>
    </div>
  );
}