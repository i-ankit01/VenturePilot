// components/workspace/stuck-banner.tsx
// Drop this inside the workspace page when isStuck === true

"use client";

import { AlertTriangle, RefreshCw, Loader2 } from "lucide-react";
import { useState } from "react";

const MONO = { fontFamily: "var(--font-mono)" };

interface Props {
  onResume: () => Promise<void>;
}

export function StuckBanner({ onResume }: Props) {
  const [loading, setLoading] = useState(false);

  async function handle() {
    setLoading(true);
    await onResume();
    setLoading(false);
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-amber-500/25 bg-amber-500/8 px-4 py-3 mb-4">
      <div className="flex items-center gap-2.5">
        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
        <div>
          <p className="text-[12px] font-semibold text-amber-600 dark:text-amber-400" style={MONO}>
            Pipeline interrupted
          </p>
          <p className="text-[11px] text-amber-600/70 dark:text-amber-400/70">
            Server restarted mid-run. Click Resume to continue from where it left off.
          </p>
        </div>
      </div>
      <button
        onClick={handle}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-all disabled:opacity-50"
        style={MONO}
      >
        {loading
          ? <><Loader2 className="h-3 w-3 animate-spin" /> Resuming…</>
          : <><RefreshCw className="h-3 w-3" /> Resume</>
        }
      </button>
    </div>
  );
}