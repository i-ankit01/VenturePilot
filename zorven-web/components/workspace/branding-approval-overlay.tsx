"use client";

import { useState } from "react";
import { CheckCircle2, RotateCcw, Pencil, Loader2, Palette } from "lucide-react";
import { BrandingReview, BrandingReviewAction } from "@/lib/api";
import { cn } from "@/lib/utils";

const MONO = { fontFamily: "'DM Mono', monospace" };

interface Props {
  review: BrandingReview;
  onSubmit: (action: BrandingReviewAction) => void;
  isSubmitting: boolean;
}

type Section = "recommended_name" | "recommended_tagline" | "color_palette";

const SECTION_LABELS: Record<Section, string> = {
  recommended_name: "Brand Name",
  recommended_tagline: "Tagline",
  color_palette: "Color Palette",
};

export function BrandingApprovalOverlay({ review, onSubmit, isSubmitting }: Props) {
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [editValue, setEditValue] = useState("");

  const { branding_output, approvals } = review;
  const sections: Section[] = ["recommended_name", "recommended_tagline", "color_palette"];
  const allApproved = sections.every((s) => approvals[s]);

  function startEdit(section: Section) {
    setEditingSection(section);
    if (section === "recommended_name") setEditValue(branding_output.recommended_name);
    if (section === "recommended_tagline") setEditValue(branding_output.recommended_tagline);
  }

  function submitEdit(section: Section) {
    onSubmit({ section, action: "edit", value: editValue });
    setEditingSection(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-neutral-950 p-6 shadow-2xl">
        <div className="mb-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-primary/60" style={MONO}>
            Founder Review
          </p>
          <h2 className="text-lg font-bold text-white" style={MONO}>
            Review your brand identity
          </h2>
          <p className="mt-1 text-sm text-white/50">
            Approve each section, edit it directly, or regenerate for a new option.
          </p>
        </div>

        <div className="space-y-3">
          {/* Name */}
          <ReviewRow
            label={SECTION_LABELS.recommended_name}
            approved={approvals.recommended_name}
            isEditing={editingSection === "recommended_name"}
            isSubmitting={isSubmitting}
            onApprove={() => onSubmit({ section: "recommended_name", action: "approve" })}
            onEdit={() => startEdit("recommended_name")}
            onRegenerate={() => onSubmit({ section: "recommended_name", action: "regenerate" })}
            onCancelEdit={() => setEditingSection(null)}
            onSubmitEdit={() => submitEdit("recommended_name")}
          >
            {editingSection === "recommended_name" ? (
              <input
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-primary/50"
                style={MONO}
              />
            ) : (
              <p className="text-lg font-bold text-white" style={MONO}>{branding_output.recommended_name}</p>
            )}
          </ReviewRow>

          {/* Tagline */}
          <ReviewRow
            label={SECTION_LABELS.recommended_tagline}
            approved={approvals.recommended_tagline}
            isEditing={editingSection === "recommended_tagline"}
            isSubmitting={isSubmitting}
            onApprove={() => onSubmit({ section: "recommended_tagline", action: "approve" })}
            onEdit={() => startEdit("recommended_tagline")}
            onRegenerate={() => onSubmit({ section: "recommended_tagline", action: "regenerate" })}
            onCancelEdit={() => setEditingSection(null)}
            onSubmitEdit={() => submitEdit("recommended_tagline")}
          >
            {editingSection === "recommended_tagline" ? (
              <input
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-primary/50"
              />
            ) : (
              <p className="text-sm text-white/70">{branding_output.recommended_tagline}</p>
            )}
          </ReviewRow>

          {/* Color palette — no inline edit, only approve/regenerate */}
          <ReviewRow
            label={SECTION_LABELS.color_palette}
            approved={approvals.color_palette}
            isEditing={false}
            isSubmitting={isSubmitting}
            onApprove={() => onSubmit({ section: "color_palette", action: "approve" })}
            onRegenerate={() => onSubmit({ section: "color_palette", action: "regenerate" })}
            hideEdit
          >
            <div className="flex gap-2">
              {branding_output.color_palette.map((c, i) => (
                <div key={i} className="flex-1 overflow-hidden rounded-md border border-white/10">
                  <div className="h-10 w-full" style={{ backgroundColor: c.hex_code }} />
                  <p className="px-1.5 py-1 text-[9px] text-white/50 truncate" style={MONO}>{c.color_name}</p>
                </div>
              ))}
            </div>
          </ReviewRow>
        </div>

        {allApproved && (
          <div className="mt-5 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            All sections approved — continuing to finance and GTM.
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewRow({
  label, approved, isEditing, isSubmitting, children,
  onApprove, onEdit, onRegenerate, onCancelEdit, onSubmitEdit, hideEdit,
}: {
  label: string;
  approved: boolean;
  isEditing: boolean;
  isSubmitting: boolean;
  children: React.ReactNode;
  onApprove: () => void;
  onEdit?: () => void;
  onRegenerate: () => void;
  onCancelEdit?: () => void;
  onSubmitEdit?: () => void;
  hideEdit?: boolean;
}) {
  return (
    <div className={cn(
      "rounded-xl border p-4 transition-colors",
      approved ? "border-emerald-500/30 bg-emerald-500/5" : "border-white/10 bg-white/[0.02]"
    )}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40" style={MONO}>
          {label}
        </span>
        {approved && (
          <span className="flex items-center gap-1 text-[10px] text-emerald-400" style={MONO}>
            <CheckCircle2 className="h-3 w-3" /> Approved
          </span>
        )}
      </div>

      <div className="mb-3">{children}</div>

      <div className="flex gap-2">
        {isEditing ? (
          <>
            <button
              onClick={onSubmitEdit}
              disabled={isSubmitting}
              className="rounded-md bg-primary/90 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-primary disabled:opacity-50"
              style={MONO}
            >
              Save
            </button>
            <button
              onClick={onCancelEdit}
              className="rounded-md border border-white/10 px-3 py-1.5 text-[11px] text-white/50 hover:text-white/80"
              style={MONO}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onApprove}
              disabled={isSubmitting || approved}
              className="flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-medium text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-40"
              style={MONO}
            >
              <CheckCircle2 className="h-3 w-3" /> Approve
            </button>
            {!hideEdit && onEdit && (
              <button
                onClick={onEdit}
                disabled={isSubmitting}
                className="flex items-center gap-1 rounded-md border border-white/10 px-3 py-1.5 text-[11px] text-white/60 hover:text-white/90 disabled:opacity-40"
                style={MONO}
              >
                <Pencil className="h-3 w-3" /> Edit
              </button>
            )}
            <button
              onClick={onRegenerate}
              disabled={isSubmitting}
              className="flex items-center gap-1 rounded-md border border-white/10 px-3 py-1.5 text-[11px] text-white/60 hover:text-white/90 disabled:opacity-40"
              style={MONO}
            >
              {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
              Regenerate
            </button>
          </>
        )}
      </div>
    </div>
  );
}