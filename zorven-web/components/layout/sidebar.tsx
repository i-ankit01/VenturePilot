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

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="relative flex h-full w-[220px] shrink-0 flex-col border-r border-border/60 bg-sidebar">
      {/* Vertical accent line */}
      <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-primary/20 to-transparent" />

      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b border-border/60 px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary shadow-[0_0_12px_rgba(0,0,0,0.3)]">
          <Zap className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col leading-none">
          <span
            className="text-[13px] font-semibold tracking-tight text-foreground"
            style={{ fontFamily: "'DM Mono', 'Fira Code', monospace" }}
          >
            VenturePilot
          </span>
          <span className="text-[10px] text-muted-foreground tracking-widest uppercase">
            AI Builder
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4">
        <p
          className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60"
          style={{ fontFamily: "'DM Mono', monospace" }}
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
                "group relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-all duration-150",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-sidebar-foreground/70 hover:bg-accent hover:text-accent-foreground",
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_6px_var(--color-primary)]" />
              )}
              <item.icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-foreground",
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
      <div className="border-t border-border/60 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground ring-1 ring-border">
            VP
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[11px] font-medium text-foreground">
              Founder
            </span>
            <span className="text-[10px] text-muted-foreground">Free plan</span>
          </div>
          <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_#34d399]" />
        </div>
      </div>
    </aside>
  );
}
