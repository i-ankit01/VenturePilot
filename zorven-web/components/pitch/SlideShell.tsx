// components/pitch/SlideShell.tsx

import React from "react";

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
      {/* Ambient radial — top right */}
      <div
        style={{
          position: "absolute",
          top: -160,
          right: -100,
          width: 600,
          height: 600,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(56,189,248,0.09) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Second ambient — bottom left */}
      <div
        style={{
          position: "absolute",
          bottom: -180,
          left: -80,
          width: 480,
          height: 480,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(56,189,248,0.05) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Subtle grid texture */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
          pointerEvents: "none",
        }}
      />

      {/* Left accent bar — tapered glow */}
      {leftBar && (
        <>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: 3,
              height: "100%",
              background: `linear-gradient(180deg, transparent 0%, ${T.neon} 20%, ${T.neon} 80%, transparent 100%)`,
              boxShadow: `4px 0 24px rgba(56,189,248,0.4)`,
            }}
          />
          {/* Glow halo on bar */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: "20%",
              width: 60,
              height: "60%",
              background:
                "radial-gradient(ellipse at left, rgba(56,189,248,0.08) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />
        </>
      )}

      <div
        style={{
          paddingLeft: leftBar ? 36 : 0,
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ── Label ─────────────────────────────────────────────────────────────────────

export function SlideLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: T.fontBody,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: T.neon,
      }}
    >
      {/* Leading tick */}
      <span
        style={{
          display: "inline-block",
          width: 16,
          height: 1.5,
          background: T.neon,
          borderRadius: 2,
          boxShadow: `0 0 6px ${T.neon}`,
        }}
      />
      {children}
    </span>
  );
}

// ── Heading ───────────────────────────────────────────────────────────────────

export function SlideHeading({
  children,
  size = 32,
}: {
  children: React.ReactNode;
  size?: number;
}) {
  return (
    <h2
      style={{
        fontFamily: T.fontHead,
        fontSize: size,
        fontWeight: 700,
        color: T.white,
        margin: 0,
        lineHeight: 1.12,
        letterSpacing: "-0.025em",
      }}
    >
      {children}
    </h2>
  );
}

// ── Glass card ────────────────────────────────────────────────────────────────

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
        position: "relative",
        background: accent
          ? "rgba(56,189,248,0.06)"
          : "rgba(255,255,255,0.035)",
        border: `1px solid ${accent ? T.borderAccent : T.border}`,
        borderRadius: 16,
        padding: "18px 22px",
        boxShadow: accent
          ? `0 0 28px rgba(56,189,248,0.18), inset 0 1px 0 rgba(255,255,255,0.06)`
          : `inset 0 1px 0 rgba(255,255,255,0.05)`,
        overflow: "hidden",
        ...style,
      }}
    >
      {/* Top shimmer line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "10%",
          width: "80%",
          height: 1,
          background: accent
            ? `linear-gradient(90deg, transparent, rgba(56,189,248,0.6), transparent)`
            : `linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)`,
          borderRadius: 1,
        }}
      />
      {children}
    </div>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────

export function NeonDivider() {
  return (
    <div style={{ position: "relative", marginBottom: 22, height: 1 }}>
      <div
        style={{
          height: 1,
          background: `linear-gradient(90deg, ${T.neon} 0%, rgba(56,189,248,0.2) 50%, transparent 100%)`,
          borderRadius: 1,
        }}
      />
      {/* Glow dot at start */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: -2,
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: T.neon,
          boxShadow: `0 0 8px ${T.neon}`,
        }}
      />
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

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
        position: "relative",
        background: accent ? "rgba(56,189,248,0.08)" : T.bgCard,
        border: `1px solid ${accent ? T.borderAccent : T.border}`,
        borderRadius: 14,
        padding: "22px 18px",
        textAlign: "center",
        overflow: "hidden",
        boxShadow: accent
          ? `0 0 32px rgba(56,189,248,0.2), inset 0 1px 0 rgba(255,255,255,0.07)`
          : `inset 0 1px 0 rgba(255,255,255,0.04)`,
        ...style,
      }}
    >
      {/* Corner accent arc (accent cards only) */}
      {accent && (
        <div
          style={{
            position: "absolute",
            top: -30,
            right: -30,
            width: 80,
            height: 80,
            borderRadius: "50%",
            border: `1px solid rgba(56,189,248,0.25)`,
            pointerEvents: "none",
          }}
        />
      )}

      <div
        style={{
          fontFamily: T.fontHead,
          fontSize: 30,
          fontWeight: 700,
          color: accent ? T.neon : T.white,
          lineHeight: 1,
          marginBottom: 8,
          letterSpacing: "-0.02em",
          textShadow: accent ? `0 0 20px rgba(56,189,248,0.5)` : "none",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: T.fontBody,
          fontSize: 10,
          fontWeight: 600,
          color: T.gray2,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
    </div>
  );
}

// ── Bullet row ────────────────────────────────────────────────────────────────

let _bulletIndex = 0;

export function BulletRow({
  headline,
  supporting,
  index,
}: {
  headline: string;
  supporting: string;
  index?: number;
}) {
  const n = index !== undefined ? index : ++_bulletIndex;

  return (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
      {/* Numbered ring badge */}
      <div
        style={{
          flexShrink: 0,
          width: 28,
          height: 28,
          borderRadius: "50%",
          border: `1px solid ${T.borderAccent}`,
          background: "rgba(56,189,248,0.08)",
          boxShadow: `0 0 10px rgba(56,189,248,0.2), inset 0 1px 0 rgba(255,255,255,0.06)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: T.fontHead,
          fontSize: 11,
          fontWeight: 700,
          color: T.neon,
          letterSpacing: "-0.01em",
          marginTop: 1,
        }}
      >
        {String(n).padStart(2, "0")}
      </div>

      <div style={{ flex: 1 }}>
        <div
          style={{
            fontFamily: T.fontHead,
            fontSize: 15,
            fontWeight: 600,
            color: T.white,
            marginBottom: 4,
            letterSpacing: "-0.01em",
          }}
        >
          {headline}
        </div>
        <div
          style={{
            fontFamily: T.fontBody,
            fontSize: 12,
            color: T.gray2,
            lineHeight: 1.55,
          }}
        >
          {supporting}
        </div>
      </div>
    </div>
  );
}

// ── Slide number ──────────────────────────────────────────────────────────────

export function SlideNumber({ n }: { n: number }) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 22,
        right: 30,
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontFamily: T.fontBody,
        fontSize: 10,
        color: T.gray3,
        fontWeight: 500,
        letterSpacing: "0.1em",
      }}
    >
      <span style={{ color: T.neon, fontWeight: 700 }}>
        {String(n).padStart(2, "0")}
      </span>
      <span style={{ opacity: 0.4 }}>/</span>
      <span>12</span>
    </div>
  );
}