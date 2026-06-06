import {
  IconTerminal2,
  IconUsers,
  IconRocket,
  IconLock,
  IconWorld,
  IconCode,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

const features = [
  {
    title: "Instant Setup",
    description:
      "No installation needed. Start coding immediately in your browser with zero configuration.",
    icon: <IconTerminal2 />,
  },
  {
    title: "Realtime Collaboration",
    description:
      "Share your workspace, pair program, and review code together with your team in real-time.",
    icon: <IconUsers />,
  },
  {
    title: "One-Click Deploy",
    description:
      "Deploy your applications instantly with a single click. No complex DevOps required.",
    icon: <IconRocket />,
  },
  {
    title: "Secure by Default",
    description:
      "Enterprise-grade security with encrypted connections and isolated environments.",
    icon: <IconLock />,
  },
  {
    title: "Access Anywhere",
    description:
      "Code from any device, anywhere. Your workspace follows you wherever you go.",
    icon: <IconWorld />,
  },
  {
    title: "Full Terminal Access",
    description:
      "Complete command-line access with pre-installed tools and custom environment support.",
    icon: <IconCode />,
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
        index < 3 && "lg:border-b border-border"
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
            Everything you need to build
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground dark:text-muted-foreground">
            A complete development environment in your browser with all the tools and features
            you need to bring your ideas to life.
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
