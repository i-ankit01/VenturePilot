"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarClock, ExternalLink, Loader2, Video } from "lucide-react";
import type { InvestorRecord } from "@/lib/investors/types";
import { formatDateTime } from "@/lib/investors/utils";

interface MeetingSchedulerProps {
  investor: InvestorRecord;
  scheduling: boolean;
  onSchedule: (payload: { start_time: string; end_time: string }) => void;
}

export function MeetingScheduler({ investor, scheduling, onSchedule }: MeetingSchedulerProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  if (investor.meeting_scheduled) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[oklch(0.78_0.16_85)]/25 bg-[oklch(0.78_0.16_85)]/8 p-3.5">
        <div className="flex items-center gap-2 text-sm">
          <CalendarClock className="size-4 text-[oklch(0.78_0.16_85)]" />
          <span className="font-medium">{formatDateTime(investor.meeting_time)}</span>
        </div>
        {investor.meet_link && (
          <Button asChild size="sm" variant="secondary">
            <a href={investor.meet_link} target="_blank" rel="noreferrer">
              <Video className="size-4" />
              Join meet
              <ExternalLink className="size-3" />
            </a>
          </Button>
        )}
      </div>
    );
  }

  const handleSchedule = () => {
    if (!date || !time) return;
    const start = new Date(`${date}T${time}`);
    const end = new Date(start.getTime() + 30 * 60000);
    onSchedule({ start_time: start.toISOString(), end_time: end.toISOString() });
  };

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-muted/20 p-3.5">
      <div className="space-y-1.5">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Date</Label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Time</Label>
        <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-32" />
      </div>
      <Button onClick={handleSchedule} disabled={scheduling || !date || !time} className="ml-auto">
        {scheduling ? <Loader2 className="size-4 animate-spin" /> : <CalendarClock className="size-4" />}
        Schedule 30-min call
      </Button>
    </div>
  );
}