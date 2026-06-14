import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

interface GmailConnectBannerProps {
  connectUrl: string;
}

export function GmailConnectBanner({ connectUrl }: GmailConnectBannerProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Mail className="size-4" />
        </div>
        <div>
          <p className="text-sm font-medium">Connect Gmail to send outreach</p>
          <p className="text-xs text-muted-foreground">
            Emails are sent from your own inbox so replies land where you&apos;ll see them.
          </p>
        </div>
      </div>
      <Button asChild size="sm">
        <a href={connectUrl}>Connect Gmail</a>
      </Button>
    </div>
  );
}