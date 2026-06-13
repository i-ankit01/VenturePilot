
// components/pitch/slides/CoverSlide.tsx

import { CoverSlide as CoverSlideData } from "@/types/pitch";
import { T, SlideNumber } from "../SlideShell";

interface Props { data: CoverSlideData }

export function CoverSlide({ data }: Props) {
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
        justifyContent: "center",
        paddingLeft: 80,
      }}
    >
      {/* Large ambient glow */}
      <div style={{
        position: "absolute", top: -200, right: -200,
        width: 700, height: 700, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(56,189,248,0.1) 0%, transparent 65%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: -150, left: -100,
        width: 500, height: 500, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(56,189,248,0.05) 0%, transparent 65%)",
        pointerEvents: "none",
      }} />

      {/* Left accent bar — thicker on cover */}
      <div style={{
        position: "absolute", left: 0, top: 0,
        width: 6, height: "100%",
        background: `linear-gradient(180deg, ${T.neon} 0%, rgba(56,189,248,0.2) 100%)`,
        boxShadow: `6px 0 30px rgba(56,189,248,0.4)`,
      }} />

      {/* Bottom neon strip */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        height: 3,
        background: `linear-gradient(90deg, ${T.neon}, transparent)`,
        opacity: 0.5,
      }} />

      {/* ZORVEN watermark label */}
      <div style={{
        position: "absolute", top: 28, right: 36,
        fontFamily: T.fontHead, fontSize: 11, fontWeight: 700,
        color: T.neon, opacity: 0.4, letterSpacing: "0.2em",
        textTransform: "uppercase",
      }}>
        Zorven · Pitch Deck
      </div>

      {/* Startup name */}
      <h1 style={{
        fontFamily: T.fontHead,
        fontSize: 84,
        fontWeight: 800,
        color: T.white,
        margin: "0 0 8px",
        lineHeight: 0.95,
        letterSpacing: "-0.04em",
        maxWidth: 900,
      }}>
        {data.startup_name}
      </h1>

      {/* Tagline */}
      <div style={{
        fontFamily: T.fontHead,
        fontSize: 22,
        fontWeight: 500,
        color: T.neon,
        marginBottom: 28,
        letterSpacing: "-0.01em",
      }}>
        {data.tagline}
      </div>

      {/* Divider */}
      <div style={{
        width: 60, height: 2,
        background: T.neon,
        marginBottom: 28,
        boxShadow: `0 0 12px ${T.neon}`,
      }} />

      {/* One-liner */}
      <p style={{
        fontFamily: T.fontBody,
        fontSize: 16,
        color: T.gray2,
        maxWidth: 680,
        lineHeight: 1.6,
        margin: 0,
      }}>
        {data.one_liner}
      </p>

      <SlideNumber n={1} />
    </div>
  );
}