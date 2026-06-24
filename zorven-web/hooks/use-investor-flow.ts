"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as investorApi from "@/lib/investors/api";
import type { InvestorOverview, InvestorMessage } from "@/lib/investors/types";

const REPLY_POLL_INTERVAL_MS = 30000;

export function useInvestorFlow(projectId: string) {
  const [investors, setInvestors] = useState<InvestorOverview[]>([]);
  // sent messages per investor (is_draft=false), oldest→newest
  const [threads, setThreads] = useState<Map<string, InvestorMessage[]>>(
    new Map(),
  );
  // one pending outbound draft per investor (is_draft=true)
  const [drafts, setDrafts] = useState<Map<string, InvestorMessage>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [generatingEmails, setGeneratingEmails] = useState(false);
  const [pendingActions, setPendingActions] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── helpers ───────────────────────────────────────────────────────────────

  const setPending = (key: string, on: boolean) =>
    setPendingActions((prev) => {
      const next = new Set(prev);
      on ? next.add(key) : next.delete(key);
      return next;
    });

  const isPending = (investorId: string, action: string) =>
    pendingActions.has(`${investorId}:${action}`);

  const putThread = (investorId: string, messages: InvestorMessage[]) =>
    setThreads((prev) => new Map(prev).set(investorId, messages));

  const addToThread = (msg: InvestorMessage) =>
    setThreads((prev) => {
      const next = new Map(prev);
      const existing = next.get(msg.investor_id) ?? [];
      if (existing.some((m) => m.id === msg.id)) return prev;
      const merged = [...existing, msg].sort((a, b) => {
        const ta = new Date(a.sent_at ?? a.created_at ?? 0).getTime();
        const tb = new Date(b.sent_at ?? b.created_at ?? 0).getTime();
        return ta - tb;
      });
      return next.set(msg.investor_id, merged);
    });

  const putDraft = (investorId: string, draft: InvestorMessage | null) =>
    setDrafts((prev) => {
      const next = new Map(prev);
      draft ? next.set(investorId, draft) : next.delete(investorId);
      return next;
    });

  const refreshOverview = async () => {
    const { investors: updated } = await investorApi.getInvestors(projectId);
    setInvestors(updated);
    return updated;
  };

  // ─── initial load ──────────────────────────────────────────────────────────

  const refresh = useCallback(async () => {
    try {
      const { investors: overview } = await investorApi.getInvestors(projectId);
      setInvestors(overview);

      await Promise.all(
        overview.map(async (inv) => {
          const tasks: Promise<void>[] = [];

          if (inv.has_draft) {
            tasks.push(
              investorApi
                .getInvestorDraft(projectId, inv.id)
                .then(({ draft }) => {
                  putDraft(inv.id, draft);
                }),
            );
          }

          if (inv.last_inbound_at !== null) {
            tasks.push(
              investorApi
                .getInvestorMessages(projectId, inv.id)
                .then(({ messages }) => {
                  putThread(inv.id, messages);
                }),
            );
          }

          await Promise.all(tasks);
        }),
      );

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load investors");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // ─── reply polling ─────────────────────────────────────────────────────────

  useEffect(() => {
    const awaiting = investors.some(
      (inv) => inv.email_sent && inv.last_inbound_at === null,
    );

    if (!awaiting) {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      return;
    }
    if (pollRef.current) return;

    pollRef.current = setInterval(async () => {
      try {
        const { new_messages } = await investorApi.checkReplies(projectId);
        if (new_messages.length > 0) {
          new_messages.forEach(addToThread);
          await refreshOverview();
        }
      } catch {
        // silent — retried on next tick
      }
    }, REPLY_POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [investors, projectId]);

  // ─── actions ───────────────────────────────────────────────────────────────

  const searchInvestors = useCallback(async () => {
    setSearching(true);
    setError(null);
    try {
      await investorApi.searchInvestors(projectId);
      setThreads(new Map());
      setDrafts(new Map());
      await refreshOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setSearching(false);
    }
  }, [projectId]);

  const generateEmails = useCallback(async () => {
    setGeneratingEmails(true);
    setError(null);
    try {
      const { drafts: newDrafts } = await investorApi.generateEmails(projectId);
      setDrafts((prev) => {
        const next = new Map(prev);
        newDrafts.forEach((d) => next.set(d.investor_id, d));
        return next;
      });
      await refreshOverview(); // flips has_draft → true on the overview rows
    } catch (err) {
      setError(err instanceof Error ? err.message : "Email generation failed");
    } finally {
      setGeneratingEmails(false);
    }
  }, [projectId]);

  const sendEmail = useCallback(
    async (investorId: string, override: { subject: string; body: string }) => {
      const key = `${investorId}:send-email`;
      setPending(key, true);
      setError(null);
      try {
        const sent = await investorApi.sendInvestorEmail(
          projectId,
          investorId,
          override,
        );
        putDraft(investorId, null);
        addToThread(sent);
        await refreshOverview();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send email");
      } finally {
        setPending(key, false);
      }
    },
    [projectId],
  );

  const generateReply = useCallback(
    async (investorId: string) => {
      const key = `${investorId}:generate-reply`;
      setPending(key, true);
      setError(null);
      try {
        const result = await investorApi.generateReply(projectId, investorId);

        if (result.auto_scheduled) {
          // LLM detected a concrete time → meeting booked + confirmation sent automatically
          addToThread(result.message);
          await refreshOverview();
        } else {
          // normal path: draft surfaced for human review
          putDraft(investorId, result.message);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to draft reply");
      } finally {
        setPending(key, false);
      }
    },
    [projectId],
  );

  const sendReply = useCallback(
    async (investorId: string, body: string) => {
      const key = `${investorId}:send-reply`;
      setPending(key, true);
      setError(null);
      try {
        const sent = await investorApi.sendInvestorReply(
          projectId,
          investorId,
          body,
        );
        putDraft(investorId, null);
        addToThread(sent);
        await refreshOverview();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send reply");
      } finally {
        setPending(key, false);
      }
    },
    [projectId],
  );

  const scheduleMeeting = useCallback(
    async (
      investorId: string,
      payload: { start_time: string; end_time: string },
    ) => {
      const key = `${investorId}:schedule-meeting`;
      setPending(key, true);
      setError(null);
      try {
        await investorApi.scheduleMeeting(projectId, investorId, payload);
        await refreshOverview();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to schedule meeting",
        );
      } finally {
        setPending(key, false);
      }
    },
    [projectId],
  );

  const checkRepliesNow = useCallback(async () => {
    try {
      const { new_messages } = await investorApi.checkReplies(projectId);
      if (new_messages.length > 0) {
        new_messages.forEach(addToThread);
        await refreshOverview();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check replies");
    }
  }, [projectId]);

  // ─── derived per-investor selectors ────────────────────────────────────────
  // These are called per-render in the workspace map — no useMemo needed since
  // Map.get is O(1) and investors is at most 10 items.

  // The pending outbound draft for the initial email (stage = "drafted")
  const getDraft = (investorId: string): InvestorMessage | null =>
    threads.get(investorId)?.some((m) => m.direction === "inbound")
      ? null
      : (drafts.get(investorId) ?? null);

  // The investor's latest inbound message (for ReplyPanel)
  const getLatestInbound = (investorId: string): InvestorMessage | null => {
    const msgs = threads.get(investorId) ?? [];
    return [...msgs].reverse().find((m) => m.direction === "inbound") ?? null;
  };

  // The pending reply draft, only once we have an inbound (stage = "replied")
  const getReplyDraft = (investorId: string): InvestorMessage | null =>
    getLatestInbound(investorId) !== null
      ? (drafts.get(investorId) ?? null)
      : null;

  return {
    investors,
    loading,
    searching,
    generatingEmails,
    error,
    isPending,
    getDraft,
    getLatestInbound,
    getReplyDraft,
    searchInvestors,
    generateEmails,
    sendEmail,
    generateReply,
    sendReply,
    scheduleMeeting,
    checkRepliesNow,
  };
}
