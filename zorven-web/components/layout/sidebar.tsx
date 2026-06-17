"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Zap } from "lucide-react";
import { Handshake } from "lucide-react";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  { label: "Find Investors", href: "/investors", icon: Handshake },
];

const MONO = { fontFamily: "'DM Mono', monospace" };

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="relative flex h-full w-[220px] shrink-0 flex-col overflow-hidden border-r border-white/[0.06] bg-[#0A0A0B]">
      {/* Ambient glow, matches the new-project page's blue wash */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -left-10 h-48 w-48 rounded-full bg-blue-600/10 blur-[100px]" />
        <div className="absolute bottom-0 -left-10 h-40 w-40 rounded-full bg-sky-500/10 blur-[90px]" />
      </div>

      {/* Vertical accent line */}
      <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-blue-400/20 to-transparent" />

      {/* Logo */}
      <div className="relative z-10 flex h-16 items-center gap-2.5 border-b border-white/[0.06] px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.5)]">
          <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col leading-none">
          <span
            className="text-[13px] font-semibold tracking-tight text-white/90"
            style={MONO}
          >
            Zorven.ai
          </span>
          <span className="text-[10px] text-white/30 tracking-widest uppercase">
            AI Builder
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex flex-1 flex-col gap-0.5 px-3 py-4">
        <p
          className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/25"
          style={MONO}
        >
          Navigation
        </p>

        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-all duration-150 backdrop-blur-xl",
                isActive
                  ? "bg-blue-500/10 text-blue-300"
                  : "text-white/50 hover:bg-white/[0.05] hover:text-white/80",
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.8)]" />
              )}
              <item.icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive
                    ? "text-blue-300"
                    : "text-white/40 group-hover:text-white/80",
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className="font-medium"
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "12.5px",
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="relative z-10 border-t border-white/[0.06] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.05] text-xs font-bold text-white/60 ring-1 ring-white/[0.08]">
            VP
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[11px] font-medium text-white/80">
              Founder
            </span>
            <span className="text-[10px] text-white/30">Free plan</span>
          </div>
          <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_#34d399]" />
        </div>
      </div>
    </aside>
  );
}