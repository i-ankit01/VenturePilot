"use client";

import { useState, useCallback } from "react";
import {
  Check, RefreshCw, Pencil, ChevronRight, Sparkles,
  Palette, Type, ImageIcon, Loader2, AlertCircle,
  CheckCircle2, X, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  BrandingSuggestions, ColorSwatch,
  approveBranding, regenerateBrandingSection,
} from "@/lib/api";

const MONO = { fontFamily: "var(--font-mono)" };

interface Props {
  jobId: string;
  suggestions: BrandingSuggestions;
  onApproved: () => void;
}

type SectionKey = "name" | "tagline" | "colors" | "logo_direction";

interface SectionState<T> {
  value: T;
  approved: boolean;
  editing: boolean;
  loading: boolean;
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function SectionCard({
  label, icon: Icon, approved, step, children,
}: {
  label: string; icon: React.ElementType; approved: boolean; step: number; children: React.ReactNode;
}) {
  return (
    <div className={cn(
      "relative rounded-2xl border p-6 transition-all duration-500",
      approved
        ? "border-primary/30 bg-primary/5 shadow-[0_0_0_1px_hsl(var(--primary)/0.15),0_4px_24px_hsl(var(--primary)/0.08)]"
        : "border-border bg-card shadow-sm"
    )}>
      {/* Step number */}
      <div className={cn(
        "absolute -top-3 -left-3 flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-bold transition-all duration-300",
        approved
          ? "border-primary/40 bg-primary text-primary-foreground shadow-[0_0_12px_hsl(var(--primary)/0.4)]"
          : "border-border bg-background text-muted-foreground"
      )} style={MONO}>
        {approved ? <Check className="h-3.5 w-3.5" /> : step}
      </div>

      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "flex h-8 w-8 items-center justify-center rounded-xl transition-all",
            approved ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
          )}>
            <Icon className="h-4 w-4" />
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground" style={MONO}>
            {label}
          </span>
        </div>
        {approved && (
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-[10px]" style={MONO}>
            <CheckCircle2 className="h-3 w-3 mr-1" /> Approved
          </Badge>
        )}
      </div>
      {children}
    </div>
  );
}

// ── Action row ────────────────────────────────────────────────────────────────
function ActionRow({
  onEdit, onRegenerate, onApprove,
  loading, editing, approved, noEdit = false,
}: {
  onEdit?: () => void; onRegenerate: () => void; onApprove: () => void;
  loading: boolean; editing: boolean; approved: boolean; noEdit?: boolean;
}) {
  if (approved) {
    return (
      <div className="mt-4 flex items-center gap-2">
        {!noEdit && onEdit && (
          <Button variant="ghost" size="sm" onClick={onEdit}
            className="h-8 text-[11px] text-muted-foreground hover:text-foreground" style={MONO}>
            <Pencil className="h-3 w-3 mr-1.5" /> Edit
          </Button>
        )}
      </div>
    );
  }
  return (
    <div className="mt-5 flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={onRegenerate} disabled={loading || editing}
        className="h-8 text-[11px] gap-1.5 border-border hover:border-primary/30 hover:bg-primary/5" style={MONO}>
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
        Regenerate
      </Button>
      {!noEdit && onEdit && (
        <Button variant="outline" size="sm" onClick={onEdit} disabled={loading}
          className="h-8 text-[11px] gap-1.5 border-border hover:border-primary/30 hover:bg-primary/5" style={MONO}>
          <Pencil className="h-3 w-3" />
          {editing ? "Cancel" : "Edit"}
        </Button>
      )}
      <Button size="sm" onClick={onApprove} disabled={loading}
        className="h-8 text-[11px] gap-1.5 ml-auto bg-primary hover:bg-primary/90 shadow-[0_0_12px_hsl(var(--primary)/0.3)]" style={MONO}>
        <Check className="h-3 w-3" /> Approve
      </Button>
    </div>
  );
}

// ── Main overlay ──────────────────────────────────────────────────────────────
export function BrandingReviewOverlay({ jobId, suggestions, onApproved }: Props) {
  const [name, setName] = useState<SectionState<typeof suggestions.name_suggestion>>({
    value: suggestions.name_suggestion, approved: false, editing: false, loading: false,
  });
  const [tagline, setTagline] = useState<SectionState<string>>({
    value: suggestions.tagline, approved: false, editing: false, loading: false,
  });
  const [colors, setColors] = useState<SectionState<ColorSwatch[]>>({
    value: suggestions.color_palette, approved: false, editing: false, loading: false,
  });
  const [logoDir, setLogoDir] = useState<SectionState<string>>({
    value: suggestions.logo_direction, approved: false, editing: false, loading: false,
  });

  const [editName, setEditName] = useState(suggestions.name_suggestion.name);
  const [editTagline, setEditTagline] = useState(suggestions.tagline);
  const [editLogoDir, setEditLogoDir] = useState(suggestions.logo_direction);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const allApproved = name.approved && tagline.approved && colors.approved && logoDir.approved;
  const approvedCount = [name, tagline, colors, logoDir].filter(s => s.approved).length;

  // ── Name ─────────────────────────────────────────────────────────────────
  const handleNameRegenerate = useCallback(async () => {
    setName(s => ({ ...s, loading: true }));
    try {
      const res = await regenerateBrandingSection(jobId, "name");
      if (res.name_suggestion) {
        setName(s => ({ ...s, value: res.name_suggestion!, loading: false, editing: false }));
        setEditName(res.name_suggestion.name);
      }
    } catch { setName(s => ({ ...s, loading: false })); }
  }, [jobId]);

  // ── Tagline ───────────────────────────────────────────────────────────────
  const handleTaglineRegenerate = useCallback(async () => {
    setTagline(s => ({ ...s, loading: true }));
    try {
      const res = await regenerateBrandingSection(jobId, "tagline");
      if (res.tagline) { setTagline(s => ({ ...s, value: res.tagline!, loading: false })); setEditTagline(res.tagline); }
    } catch { setTagline(s => ({ ...s, loading: false })); }
  }, [jobId]);

  // ── Colors ────────────────────────────────────────────────────────────────
  const handleColorsRegenerate = useCallback(async () => {
    setColors(s => ({ ...s, loading: true }));
    try {
      const res = await regenerateBrandingSection(jobId, "colors");
      if (res.color_palette) setColors(s => ({ ...s, value: res.color_palette!, loading: false }));
    } catch { setColors(s => ({ ...s, loading: false })); }
  }, [jobId]);

  // ── Logo dir ──────────────────────────────────────────────────────────────
  const handleLogoDirRegenerate = useCallback(async () => {
    setLogoDir(s => ({ ...s, loading: true }));
    try {
      const res = await regenerateBrandingSection(jobId, "logo_direction");
      if (res.logo_direction) { setLogoDir(s => ({ ...s, value: res.logo_direction!, loading: false })); setEditLogoDir(res.logo_direction); }
    } catch { setLogoDir(s => ({ ...s, loading: false })); }
  }, [jobId]);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleApproveAll = async () => {
    if (!allApproved) return;
    setSubmitLoading(true);
    setSubmitError(null);
    try {
      await approveBranding(jobId, {
        approved_name: name.value.name,
        approved_tagline: tagline.value,
        approved_color_palette: colors.value,
        approved_logo_direction: logoDir.value,
      });
      onApproved();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Approval failed");
      setSubmitLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Subtle gradient top bar */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      {/* ── Header ── */}
      <div className="relative z-10 flex items-center justify-between border-b border-border/60 bg-background/95 px-8 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
            <Sparkles className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground" style={MONO}>
              Brand Review
            </p>
            <h1 className="text-[15px] font-semibold text-foreground tracking-tight">
              Review your brand identity
            </h1>
          </div>
        </div>

        {/* Progress pills */}
        <div className="flex items-center gap-2">
          {(["Name", "Tagline", "Colors", "Logo"] as const).map((label, i) => {
            const approved = [name.approved, tagline.approved, colors.approved, logoDir.approved][i];
            return (
              <div key={label} className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-semibold transition-all duration-300",
                approved
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border bg-muted/50 text-muted-foreground"
              )} style={MONO}>
                {approved && <CheckCircle2 className="h-2.5 w-2.5" />}
                {label}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl space-y-6 px-8 py-10">

          {/* ── Name ── */}
          <SectionCard label="Brand Name" icon={Sparkles} approved={name.approved} step={1}>
            {name.editing ? (
              <div className="space-y-3">
                <Input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="text-xl font-bold h-12 border-primary/30 bg-primary/5 focus-visible:ring-primary/30"
                  style={MONO}
                  autoFocus
                />
                <p className="text-[12px] text-muted-foreground">Edit the name, then approve.</p>
              </div>
            ) : (
              <div>
                <div className="flex items-baseline gap-3 mb-3">
                  <h2 className="text-4xl font-bold tracking-tight text-foreground" style={MONO}>
                    {name.value.name}
                  </h2>
                  {name.loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  {name.value.rationale}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-[11px]" style={MONO}>
                    {name.value.domain_available}
                  </Badge>
                  <Badge variant="outline" className="text-[11px] italic border-primary/20 text-primary/80">
                    "{name.value.tagline_fit}"
                  </Badge>
                </div>
              </div>
            )}
            <ActionRow
              onEdit={() => {
                if (name.editing) { setEditName(name.value.name); setName(s => ({ ...s, editing: false })); }
                else setName(s => ({ ...s, editing: true }));
              }}
              onRegenerate={handleNameRegenerate}
              onApprove={() => {
                const val = name.editing ? { ...name.value, name: editName } : name.value;
                setName({ value: val, approved: true, editing: false, loading: false });
              }}
              loading={name.loading} editing={name.editing} approved={name.approved}
            />
          </SectionCard>

          {/* ── Tagline ── */}
          <SectionCard label="Tagline" icon={Type} approved={tagline.approved} step={2}>
            {tagline.editing ? (
              <div className="space-y-2">
                <Input
                  value={editTagline}
                  onChange={e => setEditTagline(e.target.value)}
                  className="text-lg italic border-primary/30 bg-primary/5 focus-visible:ring-primary/30"
                  placeholder="Under 10 words…"
                  autoFocus
                />
                <p className="text-[12px] text-muted-foreground">Keep it punchy — under 10 words.</p>
              </div>
            ) : (
              <p className="text-2xl font-medium italic text-foreground/80 leading-snug">
                "{tagline.value}"
              </p>
            )}
            <ActionRow
              onEdit={() => {
                if (tagline.editing) { setEditTagline(tagline.value); setTagline(s => ({ ...s, editing: false })); }
                else setTagline(s => ({ ...s, editing: true }));
              }}
              onRegenerate={handleTaglineRegenerate}
              onApprove={() => {
                const val = tagline.editing ? editTagline : tagline.value;
                setTagline({ value: val, approved: true, editing: false, loading: false });
              }}
              loading={tagline.loading} editing={tagline.editing} approved={tagline.approved}
            />
          </SectionCard>

          {/* ── Colors ── */}
          <SectionCard label="Color Palette" icon={Palette} approved={colors.approved} step={3}>
            {colors.loading ? (
              <div className="flex items-center gap-2.5 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Generating new palette…
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-5 gap-2">
                  {colors.value.map((swatch, i) => (
                    <div key={i} className="group overflow-hidden rounded-xl border border-border/60 transition-transform hover:scale-[1.02]">
                      <div className="h-14 w-full" style={{ backgroundColor: swatch.hex_code }} />
                      <div className="bg-card/80 p-2">
                        <p className="text-[10px] font-semibold text-foreground truncate" style={MONO}>{swatch.color_name}</p>
                        <p className="text-[9px] text-muted-foreground" style={MONO}>{swatch.hex_code}</p>
                        <p className="text-[9px] uppercase tracking-wider text-muted-foreground/60 mt-0.5" style={MONO}>{swatch.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[12px] text-muted-foreground leading-relaxed">
                  {suggestions.color_palette_rationale}
                </p>
              </div>
            )}
            <div className="mt-5 flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleColorsRegenerate}
                disabled={colors.loading || colors.approved}
                className="h-8 text-[11px] gap-1.5 border-border hover:border-primary/30 hover:bg-primary/5" style={MONO}>
                {colors.loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                Regenerate
              </Button>
              {!colors.approved && (
                <Button size="sm" onClick={() => setColors(s => ({ ...s, approved: true }))}
                  disabled={colors.loading}
                  className="h-8 text-[11px] gap-1.5 ml-auto bg-primary hover:bg-primary/90 shadow-[0_0_12px_hsl(var(--primary)/0.3)]" style={MONO}>
                  <Check className="h-3 w-3" /> Approve
                </Button>
              )}
            </div>
          </SectionCard>

          {/* ── Logo direction ── */}
          <SectionCard label="Logo Direction" icon={ImageIcon} approved={logoDir.approved} step={4}>
            <div className="mb-3 flex items-start gap-2.5 rounded-xl border border-primary/15 bg-primary/5 px-3.5 py-2.5">
              <Sparkles className="h-3.5 w-3.5 text-primary/70 mt-0.5 shrink-0" />
              <p className="text-[12px] text-primary/70 leading-relaxed">
                After approval, we'll generate your logo — black on white, high quality — using this direction.
              </p>
            </div>
            {logoDir.editing ? (
              <Textarea
                value={editLogoDir}
                onChange={e => setEditLogoDir(e.target.value)}
                rows={4}
                className="resize-none border-primary/30 bg-primary/5 text-sm focus-visible:ring-primary/30"
                autoFocus
              />
            ) : (
              <p className="text-sm text-foreground/80 leading-relaxed">{logoDir.value}</p>
            )}
            <ActionRow
              onEdit={() => {
                if (logoDir.editing) { setEditLogoDir(logoDir.value); setLogoDir(s => ({ ...s, editing: false })); }
                else setLogoDir(s => ({ ...s, editing: true }));
              }}
              onRegenerate={handleLogoDirRegenerate}
              onApprove={() => {
                const val = logoDir.editing ? editLogoDir : logoDir.value;
                setLogoDir({ value: val, approved: true, editing: false, loading: false });
              }}
              loading={logoDir.loading} editing={logoDir.editing} approved={logoDir.approved}
            />
          </SectionCard>

        </div>
      </div>

      {/* ── Footer ── */}
      <div className="relative z-10 border-t border-border/60 bg-background/95 px-8 py-5 backdrop-blur-xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {/* Progress bar */}
              <div className="h-1.5 w-32 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500 shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
                  style={{ width: `${(approvedCount / 4) * 100}%` }}
                />
              </div>
              <span className="text-[11px] text-muted-foreground" style={MONO}>
                {approvedCount}/4 approved
              </span>
            </div>
            {submitError && (
              <p className="flex items-center gap-1.5 text-[12px] text-destructive">
                <AlertCircle className="h-3 w-3" /> {submitError}
              </p>
            )}
            {allApproved && !submitError && (
              <p className="text-[12px] text-muted-foreground">
                All approved — pipeline will generate your logo and continue.
              </p>
            )}
          </div>

          <Button
            onClick={handleApproveAll}
            disabled={!allApproved || submitLoading}
            size="lg"
            className={cn(
              "gap-2.5 text-[13px] font-semibold transition-all duration-300",
              allApproved && !submitLoading
                ? "bg-primary hover:bg-primary/90 shadow-[0_0_24px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_32px_hsl(var(--primary)/0.5)]"
                : "opacity-40"
            )}
            style={MONO}
          >
            {submitLoading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Starting pipeline…</>
            ) : (
              <>Approve All & Continue <ArrowRight className="h-4 w-4" /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}