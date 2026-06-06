import {
  IconTerminal2,
  IconUsers,
  IconRocket,
  IconLock,
  IconWorld,
  IconCode,
  IconChartBar,
  IconTargetArrow,
  IconTrendingUp,
  IconPresentationAnalytics,
  IconPalette,
  IconRoute,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

const features = [
  {
    title: "Market Intelligence",
    description:
      "Discover market opportunities, customer pain points, industry trends, and TAM/SAM/SOM analysis powered by AI research.",
    icon: <IconChartBar />,
  },
  {
    title: "Competitor Analysis",
    description:
      "Analyze competitors, pricing strategies, market positioning, and uncover opportunities to differentiate your startup.",
    icon: <IconTargetArrow />,
  },
  {
    title: "Brand & Positioning",
    description:
      "Generate startup names, taglines, value propositions, messaging frameworks, and a complete brand identity.",
    icon: <IconPalette />,
  },
  {
    title: "MVP Planning",
    description:
      "Define core features, prioritize development, and generate execution-ready product roadmaps and milestones.",
    icon: <IconRoute />,
  },
  {
    title: "Go-To-Market Strategy",
    description:
      "Receive launch plans, acquisition channels, growth loops, content ideas, and customer acquisition strategies.",
    icon: <IconTrendingUp />,
  },
  {
    title: "Investor-Ready Assets",
    description:
      "Generate pitch decks, business reports, financial projections, and startup dashboards ready for demos and fundraising.",
    icon: <IconPresentationAnalytics />,
  },
];

const Feature = ({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}) => {
  return (
    <div
      className={cn(
        "flex flex-col lg:border-r py-10 relative group/feature border-border",
        (index === 0 || index === 3) && "lg:border-l border-border",
        index < 3 && "lg:border-b border-border",
      )}
    >
      {index < 3 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-muted to-transparent dark:from-muted/40 pointer-events-none" />
      )}
      {index >= 3 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-b from-muted to-transparent dark:from-muted/40 pointer-events-none" />
      )}
      <div className="mb-4 relative z-10 px-10 text-muted-foreground dark:text-muted-foreground">
        {icon}
      </div>
      <div className="text-lg font-bold mb-2 relative z-10 px-10">
        <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-muted dark:bg-muted/60 group-hover/feature:bg-primary transition-all duration-200 origin-center" />
        <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-foreground dark:text-foreground">
          {title}
        </span>
      </div>
      <p className="text-sm text-muted-foreground dark:text-muted-foreground max-w-xs relative z-10 px-10">
        {description}
      </p>
    </div>
  );
};

const Features = () => {
  return (
    <section className="py-20 md:py-32 bg-background text-foreground dark:bg-background dark:text-foreground transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center animate-fade-in">
          <h2 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
            Everything You Need To Launch
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground dark:text-muted-foreground">
            From idea validation to go-to-market strategy, Zorven generates
            every critical component needed to build and launch a startup.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 relative z-10 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <Feature key={feature.title} {...feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
