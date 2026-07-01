"use client";

import React from "react";
import {
  IconBulb,
  IconBrain,
  IconClockHour4,
  IconX,
  IconChartBar,
  IconPalette,
  IconRocket,
  IconPresentationAnalytics,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

const roadmap = [
  {
    title: "Just an Idea",
    description:
      "Your startup lives in scattered notes, random thoughts, and endless brainstorming.",
    icon: <IconBulb />,
  },
  {
    title: "Overwhelming Process",
    description:
      "Research, branding, product planning, fundraising, and marketing all require different experts.",
    icon: <IconBrain />,
  },
  {
    title: "Months of Work",
    description:
      "Weeks of planning, expensive consultants, and countless iterations before launch.",
    icon: <IconClockHour4 />,
  },
  {
    title: "Never Ships",
    description:
      "Most startup ideas never become real products because execution is simply too difficult.",
    icon: <IconX />,
  },
  {
    title: "Market Validated",
    description:
      "AI researches competitors, customers, industry trends, and market opportunities instantly.",
    icon: <IconChartBar />,
  },
  {
    title: "Brand & MVP Ready",
    description:
      "Generate your startup name, positioning, roadmap, features, and execution strategy.",
    icon: <IconPalette />,
  },
  {
    title: "Launch Assets Ready",
    description:
      "Landing page, pitch deck, business report, GTM strategy, and financial projections generated automatically.",
    icon: <IconRocket />,
  },
  {
    title: "Investor Ready",
    description:
      "Present with confidence, reach customers faster, and launch your startup in minutes instead of months.",
    icon: <IconPresentationAnalytics />,
  },
];

function RoadmapCard({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}) {
  const isTop = index < 4;

  return (
    <div
      className={cn(
        "group/roadmap relative flex flex-col py-10 lg:border-r border-border",
        (index === 0 || index === 4) && "lg:border-l border-border",
        isTop && "lg:border-b border-border"
      )}
    >
      {isTop ? (
        <div className="absolute inset-0 bg-gradient-to-t from-red-500/5 to-transparent opacity-0 transition duration-300 group-hover/roadmap:opacity-100 pointer-events-none" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent opacity-0 transition duration-300 group-hover/roadmap:opacity-100 pointer-events-none" />
      )}

      <div
        className={cn(
          "absolute right-6 top-6 rounded-full border px-3 py-1 text-xs font-medium",
          isTop
            ? "border-red-500/20 bg-red-500/10 text-red-400"
            : "border-primary/20 bg-primary/10 text-primary"
        )}
      >
        {isTop ? "BEFORE" : "AFTER"}
      </div>

      <div
        className={cn(
          "relative z-10 mb-5 px-10",
          isTop ? "text-red-400" : "text-primary"
        )}
      >
        {icon}
      </div>

      <div className="relative z-10 mb-3 px-10 text-lg font-bold">
        <div
          className={cn(
            "absolute left-0 inset-y-0 w-1 rounded-tr-full rounded-br-full transition-all duration-300 group-hover/roadmap:h-8 h-6",
            isTop ? "bg-red-500/40" : "bg-primary"
          )}
        />

        <span className="inline-block transition duration-300 group-hover/roadmap:translate-x-2">
          {title}
        </span>
      </div>

      <p className="relative z-10 max-w-xs px-10 text-sm text-muted-foreground leading-7">
        {description}
      </p>
    </div>
  );
}

export default function StartupRoadmap() {
  return (
    <section className="bg-background py-24 text-foreground transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <span className="mb-4 inline-flex rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            Before vs After
          </span>

          <h2 className="mb-5 text-4xl font-bold tracking-tight md:text-5xl">
            From Idea to Investor-Ready Startup
          </h2>

          <p className="mx-auto max-w-3xl text-lg text-muted-foreground">
            Most founders spend months researching, planning, and building
            before they ever launch. Zorven compresses the entire startup
            journey into a single AI-powered workflow.
          </p>
        </div>

        <div className="mx-auto grid max-w-7xl grid-cols-1 md:grid-cols-2 lg:grid-cols-4 relative">
          {roadmap
            .slice(0, 4)
            .map((item, index) => (
              <RoadmapCard key={item.title} {...item} index={index} />
            ))}

          {roadmap
            .slice(4)
            .map((item, index) => (
              <RoadmapCard
                key={item.title}
                {...item}
                index={index + 4}
              />
            ))}
        </div>
      </div>
    </section>
  );
}