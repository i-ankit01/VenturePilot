import { Button } from "@/components/ui/button";
import { Loader2, Radar } from "lucide-react";

interface InvestorEmptyStateProps {
  searching: boolean;
  onSearch: () => void;
}

export function InvestorEmptyState({ searching, onSearch }: InvestorEmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Radar className="size-5" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-medium">No investors matched yet</h3>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          Run a search to surface investors whose focus and recent activity line up with this startup, scored and
          ranked out of 100.
        </p>
      </div>
      <Button onClick={onSearch} disabled={searching}>
        {searching ? <Loader2 className="size-4 animate-spin" /> : <Radar className="size-4" />}
        Find investors
      </Button>
    </div>
  );
}