
// components/pitch/SlideShell.tsx
// The shared 1280×720 frame every slide renders inside.
// Also exports the design tokens used across all slide components.

import React from "react";

// ── Design tokens ─────────────────────────────────────────────────────────────
export const T = {
  bg: "#050507",
  bgCard: "rgba(255,255,255,0.04)",
  bgCardHover: "rgba(255,255,255,0.07)",
  border: "rgba(255,255,255,0.08)",
  borderAccent: "rgba(56,189,248,0.35)",
  neon: "#38bdf8",
  neonDim: "rgba(56,189,248,0.15)",
  neonGlow: "0 0 20px rgba(56,189,248,0.25)",
  white: "#ffffff",
  gray1: "#f0f4f8",
  gray2: "#94a3b8",
  gray3: "#475569",
  gray4: "#1e293b",
  amber: "#f59e0b",
  green: "#34d399",
  red: "#f87171",
  fontHead: "'Space Grotesk', sans-serif",
  fontBody: "'Plus Jakarta Sans', sans-serif",
} as const;

// ── Slide shell ───────────────────────────────────────────────────────────────
interface SlideShellProps {
  children: React.ReactNode;
  variant?: "dark" | "light";
  leftBar?: boolean;
}

export function SlideShell({ children, leftBar = true }: SlideShellProps) {
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
      }}
    >
      {/* Ambient radial glow top-right */}
      <div
        style={{
          position: "absolute",
          top: -120,
          right: -80,
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(56,189,248,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Left accent bar */}
      {leftBar && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 4,
            height: "100%",
            background: `linear-gradient(180deg, ${T.neon} 0%, rgba(56,189,248,0.3) 100%)`,
            boxShadow: `4px 0 20px rgba(56,189,248,0.3)`,
          }}
        />
      )}

      <div style={{ paddingLeft: leftBar ? 32 : 0, flex: 1, display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    </div>
  );
}

// ── Reusable primitives ───────────────────────────────────────────────────────

export function SlideLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontFamily: T.fontBody,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: T.neon,
        opacity: 0.7,
      }}
    >
      {children}
    </span>
  );
}

export function SlideHeading({ children, size = 32 }: { children: React.ReactNode; size?: number }) {
  return (
    <h2
      style={{
        fontFamily: T.fontHead,
        fontSize: size,
        fontWeight: 700,
        color: T.white,
        margin: 0,
        lineHeight: 1.15,
        letterSpacing: "-0.02em",
      }}
    >
      {children}
    </h2>
  );
}

export function GlassCard({
  children,
  style,
  accent,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        background: T.bgCard,
        border: `1px solid ${accent ? T.borderAccent : T.border}`,
        borderRadius: 12,
        padding: "16px 20px",
        boxShadow: accent ? T.neonGlow : "none",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function NeonDivider() {
  return (
    <div
      style={{
        height: 1,
        background: `linear-gradient(90deg, ${T.neon} 0%, transparent 60%)`,
        opacity: 0.3,
        marginBottom: 20,
      }}
    />
  );
}

export function StatCard({
  value,
  label,
  accent,
  style,
}: {
  value: string;
  label: string;
  accent?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: accent ? T.neonDim : T.bgCard,
        border: `1px solid ${accent ? T.borderAccent : T.border}`,
        borderRadius: 12,
        padding: "20px 16px",
        textAlign: "center",
        boxShadow: accent ? T.neonGlow : "none",
        ...style,
      }}
    >
      <div
        style={{
          fontFamily: T.fontHead,
          fontSize: 26,
          fontWeight: 700,
          color: accent ? T.neon : T.white,
          lineHeight: 1,
          marginBottom: 8,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: T.fontBody,
          fontSize: 11,
          fontWeight: 500,
          color: T.gray2,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
    </div>
  );
}

export function BulletRow({
  headline,
  supporting,
}: {
  headline: string;
  supporting: string;
}) {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: T.neon,
          marginTop: 7,
          flexShrink: 0,
          boxShadow: `0 0 8px ${T.neon}`,
        }}
      />
      <div>
        <div
          style={{
            fontFamily: T.fontHead,
            fontSize: 15,
            fontWeight: 600,
            color: T.white,
            marginBottom: 3,
          }}
        >
          {headline}
        </div>
        <div
          style={{
            fontFamily: T.fontBody,
            fontSize: 12,
            color: T.gray2,
            lineHeight: 1.5,
          }}
        >
          {supporting}
        </div>
      </div>
    </div>
  );
}

export function SlideNumber({ n }: { n: number }) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 20,
        right: 28,
        fontFamily: T.fontBody,
        fontSize: 11,
        color: T.gray3,
        fontWeight: 500,
        letterSpacing: "0.08em",
      }}
    >
      {String(n).padStart(2, "0")} / 12
    </div>
  );
}