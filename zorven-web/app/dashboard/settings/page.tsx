import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";
import Link from "next/link";

const MONO = { fontFamily: "'DM Mono', monospace" };

export default function DashboardSettingsPage() {
  return (
    <AppShell>
      <div className="relative min-h-full w-full overflow-hidden bg-[#0A0A0B] text-white">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 h-72 w-72 rounded-full bg-blue-600/10 blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-sky-500/10 blur-[120px]" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-full max-w-4xl flex-col px-8 py-10">
          <div className="mb-8">
            <div className="mb-2 flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-blue-300" />
              <span
                className="text-[11px] font-semibold uppercase tracking-[0.15em] text-blue-300"
                style={MONO}
              >
                Workspace Settings
              </span>
            </div>
            <h1
              className="text-[28px] font-bold leading-tight tracking-tight bg-clip-text pb-1 text-transparent bg-gradient-to-r from-white/95 to-white/40"
              style={MONO}
            >
              Settings
            </h1>
            <p className="mt-1 text-sm text-white/40">
              Workspace preferences and account controls will live here.
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-6 backdrop-blur-2xl">
            <h2 className="mb-2 text-base font-semibold text-white/90" style={MONO}>
              Coming soon
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-white/40">
              This section is reserved for workspace-level settings, profile details, and
              notification preferences.
            </p>
            <div className="mt-6">
              <Link href="/dashboard">
                <Button className="bg-white text-[#0A0A0B] shadow-lg shadow-blue-400/15 hover:bg-white/90">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}