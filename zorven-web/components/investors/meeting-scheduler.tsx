"use client";

import { useState } from "react";
import { CalendarClock, ExternalLink, Loader2, Video } from "lucide-react";
import type { InvestorOverview } from "@/lib/investors/types";
import { formatDateTime } from "@/lib/investors/utils";

const MONO = { fontFamily: "'DM Mono', monospace" };

interface MeetingSchedulerProps {
  investor: InvestorOverview;
  scheduling: boolean;
  onSchedule: (payload: { start_time: string; end_time: string }) => void;
}

export function MeetingScheduler({ investor, scheduling, onSchedule }: MeetingSchedulerProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  if (investor.meeting_scheduled) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 ring-1 ring-amber-400/20">
            <CalendarClock className="h-4 w-4 text-amber-300" />
          </span>
          <div>
            <p className="text-[11px] uppercase tracking-widest text-amber-300/70" style={MONO}>Confirmed</p>
            <p className="text-[13px] font-semibold text-white/85" style={MONO}>
              {formatDateTime(investor.upcoming_meeting_time)}
            </p>
          </div>
        </div>
        {investor.upcoming_meet_link && (
          <a
            href={investor.upcoming_meet_link}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-lg border border-amber-400/20 bg-amber-500/[0.08] px-3 py-2 text-[12px] font-medium text-amber-300 transition-all hover:border-amber-400/40 hover:bg-amber-500/15"
            style={MONO}
          >
            <Video className="h-3.5 w-3.5" />
            Join meet
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    );
  }

  const handleSchedule = () => {
    if (!date || !time) return;
    const start = new Date(`${date}T${time}`);
    const end   = new Date(start.getTime() + 30 * 60000);
    onSchedule({ start_time: start.toISOString(), end_time: end.toISOString() });
  };

  const inputCls = "rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] text-white/80 placeholder:text-white/20 backdrop-blur-xl transition-colors focus:border-blue-400/40 focus:outline-none focus:ring-1 focus:ring-blue-400/30 [color-scheme:dark]";

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="space-y-1.5">
        <label className="text-[10px] font-semibold uppercase tracking-widest text-white/30" style={MONO}>
          Date
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={`${inputCls} w-40`}
          style={MONO}
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-semibold uppercase tracking-widest text-white/30" style={MONO}>
          Time
        </label>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className={`${inputCls} w-32`}
          style={MONO}
        />
      </div>
      <button
        onClick={handleSchedule}
        disabled={scheduling || !date || !time}
        className="ml-auto flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-[13px] font-medium text-[#0A0A0B] shadow-lg shadow-blue-400/15 transition-all hover:bg-white/90 disabled:opacity-40"
        style={MONO}
      >
        {scheduling ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarClock className="h-4 w-4" />}
        Schedule 30-min call
      </button>
    </div>
  );
}