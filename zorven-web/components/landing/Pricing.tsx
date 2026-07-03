"use client";

import {
  IconCheck,
  IconSparkles,
  IconRocket,
  IconBuilding,
} from "@tabler/icons-react";

import { cn } from "@/lib/utils";

const plans = [
  {
    tier: "01",
    name: "Starter",
    price: "₹0",
    period: "/month",
    description:
      "Perfect for students, indie hackers, and first-time founders validating their next big idea.",
    icon: <IconSparkles size={24} className="sm:hidden" />,
    iconLg: <IconSparkles size={28} className="hidden sm:block" />,
    popular: false,
    button: "Start Building",
    features: [
      "3 Startup Generations / month",
      "AI Market Research",
      "Competitor Analysis",
      "Brand & Positioning",
      "MVP Roadmap",
      "Basic Landing Page",
      "Community Support",
    ],
  },
  {
    tier: "02",
    name: "Pro",
    price: "₹999",
    period: "/month",
    description:
      "Everything you need to build, launch, and pitch your startup with AI.",
    icon: <IconRocket size={24} className="sm:hidden" />,
    iconLg: <IconRocket size={28} className="hidden sm:block" />,
    popular: true,
    button: "Upgrade to Pro",
    features: [
      "Unlimited Startup Generations",
      "Everything in Starter",
      "Landing Page Generator",
      "Investor Pitch Deck",
      "Financial Projections",
      "Go-To-Market Strategy",
      "Investor Outreach",
      "Startup Dashboard",
      "Export to PDF & PPTX",
      "Priority AI Models",
    ],
  },
  {
    tier: "03",
    name: "Teams",
    price: "₹2,999",
    period: "/month",
    description:
      "Designed for startups, incubators, accelerators, and growing product teams.",
    icon: <IconBuilding size={24} className="sm:hidden" />,
    iconLg: <IconBuilding size={28} className="hidden sm:block" />,
    popular: false,
    button: "Contact Sales",
    features: [
      "Everything in Pro",
      "Unlimited Team Members",
      "Shared Workspace",
      "Human Approval Workflow",
      "Version History",
      "Collaboration",
      "Admin Dashboard",
      "API Access",
      "Premium Support",
    ],
  },
];

// Cards rise toward the recommended plan, turning the grid into a small
// staircase instead of three flat, same-height boxes.
const liftClass: Record<string, string> = {
  "01": "lg:mt-10",
  "02": "lg:mt-0",
  "03": "lg:mt-5",
};

function PricingCard({ plan }: { plan: (typeof plans)[0] }) {
  return (
    <div
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-background transition-all duration-500",
        liftClass[plan.tier],
        plan.popular
          ? "border-primary/30 shadow-2xl shadow-primary/10 lg:scale-105"
          : "hover:-translate-y-2 hover:border-primary/20"
      )}
    >
      {plan.popular && (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
          <div className="absolute right-5 top-5 rounded-full bg-primary px-3 py-1 text-[10px] font-semibold tracking-wide text-primary-foreground sm:right-6 sm:top-6 sm:px-4 sm:text-xs">
            MOST POPULAR
          </div>
        </>
      )}

      <div className="relative z-10 flex h-full flex-col p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-2xl sm:h-14 sm:w-14",
              plan.popular
                ? "bg-primary text-primary-foreground"
                : "bg-primary/10 text-primary"
            )}
          >
            {plan.icon}
            {plan.iconLg}
          </div>
          <span className="text-xs font-medium tracking-[0.25em] text-muted-foreground/60">
            TIER {plan.tier}
          </span>
        </div>

        <h3 className="mt-5 text-2xl font-bold sm:mt-6 sm:text-3xl">
          {plan.name}
        </h3>

        <div className="mt-4 flex items-end gap-2 sm:mt-6">
          <span className="text-4xl font-bold sm:text-5xl">
            {plan.price}
          </span>
          <span className="pb-1 text-sm text-muted-foreground sm:text-base">
            {plan.period}
          </span>
        </div>

        <p className="mt-4 text-sm leading-6 text-muted-foreground sm:mt-5 sm:text-base sm:leading-7">
          {plan.description}
        </p>

        <button
          className={cn(
            "mt-6 w-full rounded-xl py-3 text-sm font-semibold transition-all duration-300 sm:mt-8 sm:text-base",
            plan.popular
              ? "bg-primary text-primary-foreground hover:opacity-90"
              : "border border-border hover:border-primary hover:bg-primary hover:text-primary-foreground"
          )}
        >
          {plan.button}
        </button>

        <div className="my-6 h-px bg-border sm:my-8" />

        <ul className="space-y-3 sm:space-y-4">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-center gap-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary sm:h-6 sm:w-6">
                <IconCheck size={13} />
              </div>
              <span className="text-sm text-muted-foreground">
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function Pricing() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center sm:mb-20">
          <div className="mb-4 inline-flex rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            Pricing
          </div>

          <h2 className="mb-4 text-3xl font-bold sm:mb-5 sm:text-4xl lg:text-5xl">
            Simple Pricing for Every Founder
          </h2>

          <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg">
            Start building for free and upgrade when you're ready to launch,
            collaborate, and raise funding.
          </p>
        </div>

        <div className="grid items-start gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {plans.map((plan, i) => (
            <div
              key={plan.name}
              className={cn(i === 2 && "sm:col-span-2 lg:col-span-1")}
            >
              <PricingCard plan={plan} />
            </div>
          ))}
        </div>

        {/* Bottom Benefits */}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-3 sm:mt-20 sm:gap-4">
          {[
            "Cancel Anytime",
            "No Hidden Fees",
            "Secure Payments",
            "Export Anytime",
            "New Features Every Month",
          ].map((item) => (
            <div
              key={item}
              className="rounded-full border border-border bg-background px-4 py-2 text-xs text-muted-foreground transition hover:border-primary/30 hover:text-primary sm:px-5 sm:text-sm"
            >
              ✓ {item}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-14 sm:mt-20">
          <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/10 via-background to-primary/10 px-5 py-10 text-center sm:px-8 sm:py-14">
            <div className="absolute left-1/2 top-1/2 -z-10 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[100px] sm:h-80 sm:w-80 sm:blur-[120px]" />

            <p className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-primary sm:text-sm">
              STILL UNSURE?
            </p>

            <h3 className="mb-4 text-2xl font-bold sm:mb-5 sm:text-3xl lg:text-4xl">
              Build Your First Startup Free.
            </h3>

            <p className="mx-auto mb-6 max-w-2xl text-sm leading-7 text-muted-foreground sm:mb-8 sm:text-lg sm:leading-8">
              Experience how Zorven transforms a simple idea into an
              investor-ready startup complete with market research, branding,
              MVP planning, financial projections, landing pages, pitch decks,
              and go-to-market strategy.
            </p>

            <button className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:scale-105 hover:shadow-xl hover:shadow-primary/20 sm:px-8 sm:py-4 sm:text-base">
              Start Building →
            </button>
          </div>
        </div>

        <div className="pointer-events-none absolute left-1/2 top-[42%] -z-10 h-[380px] w-[380px] -translate-x-1/2 rounded-full bg-primary/10 blur-[100px] sm:h-[520px] sm:w-[520px] sm:blur-[140px]" />
      </div>
    </section>
  );
}