import { Button } from "@/components/ui/button";
import { IconArrowRight } from "@tabler/icons-react";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-start px-6 py-20 md:py-24 animate-fade-in">
      <aside className="mb-8 inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-700 bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm max-w-full">
        <span className="text-xs text-center whitespace-nowrap text-gray-600 dark:text-gray-400">
          New version of template is out!
        </span>
        <a
          href="#new-version"
          className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-all active:scale-95 whitespace-nowrap"
          aria-label="Read more about the new version"
        >
          Read more
          <IconArrowRight size={12} />
        </a>
      </aside>

      <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium text-center max-w-3xl px-6 leading-tight mb-6 bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent tracking-tight">
        Give your big idea <br />
        the website it deserves
      </h1>

      <p className="text-sm md:text-base text-center max-w-2xl px-6 mb-10 text-gray-600 dark:text-gray-400">
        Landing page kit template with React, Shadcn/ui and Tailwind <br />
        that you can copy/paste into your project.
      </p>

      <div className="flex items-center gap-4 relative z-10 mb-16">
        <Link
          href={"/dashboard"}
          type="button"
          className="rounded-lg h-9 w-32 bg:black dark:bg-white text-white dark:text-black flex items-center justify-center font-medium"
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
          <img
            src="https://i.postimg.cc/Ss6yShGy/glows.png"
            alt=""
            className="w-full h-auto"
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
