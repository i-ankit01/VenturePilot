import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import type { ProjectSummary } from "@/lib/investors/types";

export function InvestorProjectCard({ project }: { project: ProjectSummary }) {
  return (
    <Link href={`/investors/${project.id}`}>
      <Card className="group h-full border-border/80 p-5 transition-colors hover:border-primary/40 hover:bg-card/80">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold">{project.title}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{project.idea}</p>
          </div>
          <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {project.industry && (
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
              {project.industry}
            </span>
          )}
          {project.stage && (
            <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
              {project.stage}
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
}