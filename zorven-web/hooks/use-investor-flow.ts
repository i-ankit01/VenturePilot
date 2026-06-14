"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as investorApi from "@/lib/investors/api";
import type { InvestorRecord } from "@/lib/investors/types";

const REPLY_POLL_INTERVAL_MS = 30000;

export function useInvestorFlow(projectId: string) {
  const [investors, setInvestors] = useState<InvestorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [generatingEmails, setGeneratingEmails] = useState(false);
  const [pendingActions, setPendingActions] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const setPending = (key: string, on: boolean) => {
    setPendingActions((prev) => {
      const next = new Set(prev);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const isPending = (investorId: string, action: string) =>
    pendingActions.has(`${investorId}:${action}`);

  const mergeInvestor = (updated: InvestorRecord) =>
    setInvestors((prev) => prev.map((inv) => (inv.id === updated.id ? updated : inv)));

  const refresh = useCallback(async () => {
    try {
      const { investors: data } = await investorApi.getInvestors(projectId);
      setInvestors(data);
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

  // Poll for replies while any investor has a sent email with no reply yet
  useEffect(() => {
    const awaiting = investors.some((inv) => inv.email_sent && !inv.reply_received);

    if (!awaiting) {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      return;
    }
    if (pollRef.current) return;

    pollRef.current = setInterval(async () => {
      try {
        const { updated } = await investorApi.checkReplies(projectId);
        updated.forEach(mergeInvestor);
      } catch {
        // silent — retried on the next interval
      }
    }, REPLY_POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [investors, projectId]);

  const searchInvestors = useCallback(async () => {
    setSearching(true);
    setError(null);
    try {
      const { investors: data } = await investorApi.searchInvestors(projectId);
      setInvestors(data);
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
      const { investors: data } = await investorApi.generateEmails(projectId);
      setInvestors(data);
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
        mergeInvestor(await investorApi.sendInvestorEmail(projectId, investorId, override));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send email");
      } finally {
        setPending(key, false);
      }
    },
    [projectId]
  );

  const generateReply = useCallback(
    async (investorId: string) => {
      const key = `${investorId}:generate-reply`;
      setPending(key, true);
      setError(null);
      try {
        mergeInvestor(await investorApi.generateReply(projectId, investorId));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to draft reply");
      } finally {
        setPending(key, false);
      }
    },
    [projectId]
  );

  const sendReply = useCallback(
    async (investorId: string, body: string) => {
      const key = `${investorId}:send-reply`;
      setPending(key, true);
      setError(null);
      try {
        mergeInvestor(await investorApi.sendInvestorReply(projectId, investorId, body));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send reply");
      } finally {
        setPending(key, false);
      }
    },
    [projectId]
  );

  const scheduleMeeting = useCallback(
    async (investorId: string, payload: { start_time: string; end_time: string }) => {
      const key = `${investorId}:schedule-meeting`;
      setPending(key, true);
      setError(null);
      try {
        mergeInvestor(await investorApi.scheduleMeeting(projectId, investorId, payload));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to schedule meeting");
      } finally {
        setPending(key, false);
      }
    },
    [projectId]
  );

  const checkRepliesNow = useCallback(async () => {
    try {
      const { updated } = await investorApi.checkReplies(projectId);
      updated.forEach(mergeInvestor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check replies");
    }
  }, [projectId]);

  return {
    investors,
    loading,
    searching,
    generatingEmails,
    error,
    isPending,
    searchInvestors,
    generateEmails,
    sendEmail,
    generateReply,
    sendReply,
    scheduleMeeting,
    checkRepliesNow,
  };
}