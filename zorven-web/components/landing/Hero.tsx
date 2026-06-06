import { Button } from "@/components/ui/button";
import { IconArrowRight } from "@tabler/icons-react";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-start px-6 py-20 md:py-24 animate-fade-in">
      <aside className="mb-8 inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-full border border-gray-700 bg-gray-800/50 backdrop-blur-sm max-w-full">
        <span className="text-xs text-center whitespace-nowrap text-gray-600 dark:text-gray-400">
          The AI Startup Studio!
        </span>
        <a
          href="#new-version"
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-all active:scale-95 whitespace-nowrap"
          aria-label="Read more about the new version"
        >
          Read more
          <IconArrowRight size={12} />
        </a>
      </aside>

      <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium text-center max-w-3xl px-6 leading-tight mb-6 bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent tracking-tight">
        Zorven.ai <br />
        Your AI Co-Founder
      </h1>

      <p className="text-sm md:text-base text-center max-w-2xl px-6 mb-10 text-gray-600 dark:text-gray-400">
        Research markets, analyze competitors, define your MVP, build your
        brand, and generate investor-ready assets. All in one AI-powered
        workflow.
      </p>

      <div className="flex items-center gap-4 relative z-10 mb-16">
        <Link
          href={"/dashboard"}
          type="button"
          className="rounded-lg h-9 w-32 bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-medium"
          aria-label="Get started with the template"
        >
          Get started
        </Link>
      </div>

      <div className="w-full max-w-5xl relative pb-20">
        <div
          className="absolute left-1/2 w-[90%] pointer-events-none z-0 -top-[23%] -translate-x-1/2"
          aria-hidden="true"
        >
          <div className="absolute inset-0 -top-16 flex items-center justify-center pointer-events-none">
            <div
              style={{
                background:
                  "radial-gradient(circle at 50% 30%, rgba(8, 50, 189, 0.75) 0%, rgba(3, 72, 234, 0.5) 18%, rgba(6, 44, 197, 0.63) 40%, rgba(17, 10, 230, 0.78) 75%)",
              }}
              className="w-full max-w-6xl h-72 rounded-full blur-3xl opacity-80 transform scale-110"
            />
          </div>
          <img
            src="https://i.postimg.cc/Ss6yShGy/glows.png"
            alt=""
            className="w-full h-auto mix-blend-screen opacity-30"
            loading="eager"
          />
        </div>

        <div className="relative z-10">
          <img
            src="https://i.postimg.cc/SKcdVTr1/Dashboard2.png"
            alt="Dashboard preview showing analytics and metrics interface"
            className="w-full h-auto rounded-lg shadow-2xl"
            loading="eager"
          />
        </div>
      </div>
    </section>
  );
}
