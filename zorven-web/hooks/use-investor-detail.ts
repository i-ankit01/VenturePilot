"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as investorApi from "@/lib/investors/api";
import type { InvestorOverview, InvestorMessage } from "@/lib/investors/types";

const POLL_MS = 30_000;

export function useInvestorDetail(projectId: string, investorId: string) {
  const [investor, setInvestor] = useState<InvestorOverview | null>(null);
  const [thread, setThread]     = useState<InvestorMessage[]>([]);
  const [draft, setDraft]       = useState<InvestorMessage | null>(null);
  const [loading, setLoading]   = useState(true);
  const [autoScheduledBanner, setAutoScheduledBanner] = useState(false);
  const [pendingActions, setPendingActions] = useState<Set<string>>(new Set());
  const [error, setError]       = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const setPending = (key: string, on: boolean) =>
    setPendingActions((prev) => {
      const next = new Set(prev);
      on ? next.add(key) : next.delete(key);
      return next;
    });

  const isPending = (action: string) => pendingActions.has(action);

  const refreshInvestor = useCallback(async () => {
    const { investors } = await investorApi.getInvestors(projectId);
    const found = investors.find((i) => i.id === investorId) ?? null;
    if (found) setInvestor(found);
    return found;
  }, [projectId, investorId]);

  const load = useCallback(async () => {
    try {
      const [inv, { messages }, { draft: d }] = await Promise.all([
        refreshInvestor(),
        investorApi.getInvestorMessages(projectId, investorId),
        investorApi.getInvestorDraft(projectId, investorId),
      ]);
      if (!inv) throw new Error("Investor not found");
      setThread(messages);
      setDraft(d);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load investor");
    } finally {
      setLoading(false);
    }
  }, [projectId, investorId, refreshInvestor]);

  useEffect(() => { load(); }, [load]);

  // Poll for replies while email is sent but no inbound yet
  useEffect(() => {
    if (!investor) return;
    const awaiting = investor.email_sent && investor.last_inbound_at === null;

    if (!awaiting) {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      return;
    }
    if (pollRef.current) return;

    pollRef.current = setInterval(async () => {
      try {
        const { new_messages } = await investorApi.checkReplies(projectId);
        const mine = new_messages.filter((m) => m.investor_id === investorId);
        if (mine.length > 0) {
          setThread((prev) => {
            const ids = new Set(prev.map((m) => m.id));
            return [...prev, ...mine.filter((m) => !ids.has(m.id))].sort(
              (a, b) => new Date(a.sent_at ?? 0).getTime() - new Date(b.sent_at ?? 0).getTime()
            );
          });
          await refreshInvestor();
        }
      } catch { /* silent */ }
    }, POLL_MS);

    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    };
  }, [investor, projectId, investorId, refreshInvestor]);

  const sendEmail = useCallback(async (override: { subject: string; body: string }) => {
    setPending("send-email", true);
    setError(null);
    try {
      const sent = await investorApi.sendInvestorEmail(projectId, investorId, override);
      setDraft(null);
      setThread((prev) => [...prev, sent]);
      await refreshInvestor();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setPending("send-email", false);
    }
  }, [projectId, investorId, refreshInvestor]);

  const generateReply = useCallback(async () => {
    setPending("generate-reply", true);
    setError(null);
    try {
      const result = await investorApi.generateReply(projectId, investorId);
      if (result.auto_scheduled) {
        setThread((prev) => [...prev, result.message]);
        setAutoScheduledBanner(true);
        setTimeout(() => setAutoScheduledBanner(false), 6000);
        await refreshInvestor();
      } else {
        setDraft(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to draft reply");
    } finally {
      setPending("generate-reply", false);
    }
  }, [projectId, investorId, refreshInvestor]);

  const sendReply = useCallback(async (body: string) => {
    setPending("send-reply", true);
    setError(null);
    try {
      const sent = await investorApi.sendInvestorReply(projectId, investorId, body);
      setDraft(null);
      setThread((prev) => [...prev, sent]);
      await refreshInvestor();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reply");
    } finally {
      setPending("send-reply", false);
    }
  }, [projectId, investorId, refreshInvestor]);

  const scheduleMeeting = useCallback(async (payload: { start_time: string; end_time: string }) => {
    setPending("schedule-meeting", true);
    setError(null);
    try {
      await investorApi.scheduleMeeting(projectId, investorId, payload);
      await refreshInvestor();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to schedule meeting");
    } finally {
      setPending("schedule-meeting", false);
    }
  }, [projectId, investorId, refreshInvestor]);

  const sentThread  = thread.filter((m) => !m.is_draft);
  const latestInbound = [...sentThread].reverse().find((m) => m.direction === "inbound") ?? null;
  const initialDraft  = latestInbound ? null : draft;   // first-touch email draft
  const replyDraft    = latestInbound ? draft : null;   // reply draft

  return {
    investor,
    thread: sentThread,
    draft: initialDraft,
    replyDraft,
    latestInbound,
    loading,
    error,
    autoScheduledBanner,
    isPending,
    sendEmail,
    generateReply,
    sendReply,
    scheduleMeeting,
  };
}