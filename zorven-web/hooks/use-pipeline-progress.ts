"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { fetchPartial, PartialResult, PipelineStatus, BrandingSuggestions } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const OUTPUT_KEYS = [
  "planner_output", "research_output", "competitor_output", "product_output",
  "branding_output", "finance_output", "gtm_output", "pitch_output",
] as const;
type OutputKey = typeof OUTPUT_KEYS[number];

export function usePipelineProgress(projectId: string | null) {
  const [jobId, setJobId]                         = useState<string | null>(null);
  const [projectTitle, setProjectTitle]           = useState<string>("");
  const [data, setData]                           = useState<PartialResult | null>(null);
  const [status, setStatus]                       = useState<PipelineStatus>("idle");
  const [error, setError]                         = useState<string | null>(null);
  const [brandingSuggestions, setBrandingSuggestions] = useState<BrandingSuggestions | null>(null);
  const [logoImageUrl, setLogoImageUrl]           = useState<string | null>(null);
  const [isStuck, setIsStuck]                     = useState(false); // job running but no progress

  const intervalRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const savedRef       = useRef(false);
  const skipPollingRef = useRef(false);
  const lastDataRef    = useRef<PartialResult | null>(null);
  const stuckTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resumeCalledRef = useRef(false); // prevents double-resume on load

  // ── Polling core ──────────────────────────────────────────────────────────
  function startPolling(jId: string) {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(async () => {
      try {
        const json = await fetchPartial(jId);

        if (json.partial && Object.keys(json.partial).length > 0) {
          lastDataRef.current = json.partial;
          setData(json.partial);
          // Got new data — not stuck
          setIsStuck(false);
          if (stuckTimerRef.current) clearTimeout(stuckTimerRef.current);
        } else if (lastDataRef.current) {
          setData(lastDataRef.current);
        }

        setStatus(json.status);

        if (json.branding_suggestions) setBrandingSuggestions(json.branding_suggestions);
        if (json.logo_image_url) setLogoImageUrl(json.logo_image_url);

        // Stop polling on terminal / pause states
        if (
          json.status === "done" ||
          json.status === "error" ||
          json.status === "awaiting_branding_approval"
        ) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
        }

        // If status is still "running" after 30s with no new agent output,
        // the background task was likely killed. Surface a resume prompt.
        if (json.status === "running") {
          if (stuckTimerRef.current) clearTimeout(stuckTimerRef.current);
          stuckTimerRef.current = setTimeout(() => {
            setIsStuck(true);
          }, 120_000);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setStatus("error");
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
      }
    }, 3000);
  }

  // ── Step 1: resolve project → job_id ─────────────────────────────────────
  useEffect(() => {
    if (!projectId) return;
    const supabase = createClient();

    supabase
      .from("projects")
      .select("job_id, title, status")
      .eq("id", projectId)
      .single()
      .then(async ({ data: project, error: projError }) => {
        if (projError || !project) { setError("Project not found"); return; }
        setProjectTitle(project.title ?? project.job_id);

        // ── Case 1: fully completed — restore from analysis_results ──────────
        if (project.status === "completed") {
          const { data: rows, error: rowsError } = await supabase
            .from("analysis_results")
            .select("agent, output")
            .eq("project_id", projectId);

          if (rowsError || !rows || rows.length === 0) {
            // Marked completed but no rows yet — fall through to polling
            setJobId(project.job_id);
            return;
          }

          const restored: Partial<PartialResult> = {};
          for (const row of rows) {
            const key = `${row.agent}_output` as OutputKey;
            if (OUTPUT_KEYS.includes(key)) (restored as any)[key] = row.output;
          }

          skipPollingRef.current = true;
          savedRef.current       = true;
          lastDataRef.current    = restored as PartialResult;
          setData(restored as PartialResult);
          setStatus("done");
          setJobId(project.job_id);
          return;
        }

        // ── Case 2: not completed — check the jobs table for real status ─────
        // The project might be "building" but the background task was killed
        // (--reload, network drop, etc). We check jobs table to decide whether
        // to just poll (pipeline is actively running) or auto-resume (it died).
        const jobId = project.job_id;

        const { data: jobRow } = await supabase
          .from("jobs")
          .select("status, partial, branding_suggestions")
          .eq("id", jobId)
          .single();

        // Restore any partial data we already have so the UI isn't blank
        if (jobRow?.partial && Object.keys(jobRow.partial).length > 0) {
          lastDataRef.current = jobRow.partial as PartialResult;
          setData(jobRow.partial as PartialResult);
        }

        if (jobRow?.branding_suggestions) {
          setBrandingSuggestions(jobRow.branding_suggestions);
        }

        const jobStatus = jobRow?.status ?? "pending";

        if (jobStatus === "awaiting_branding_approval") {
          // Pipeline paused at HITL — stop polling, show the overlay immediately.
          // branding_suggestions was already set above from jobRow.
          skipPollingRef.current = true;  // prevents Step 2 from overwriting status
          setStatus("awaiting_branding_approval");
          setJobId(jobId);
          return;
        }

        if (jobStatus === "done") {
          // Jobs table says done but projects table wasn't updated yet
          setStatus("done");
          skipPollingRef.current = false;
          setJobId(jobId);
          return;
        }

        if (jobStatus === "running" || jobStatus === "error" || jobStatus === "pending") {
          // "running" means the background task was killed mid-run (reload/crash).
          // "error" means it crashed. "pending" means it never started.
          // In all three cases: auto-resume from the Redis checkpoint.
          console.log(`[hook] Job ${jobId} status="${jobStatus}" — auto-resuming from checkpoint`);
          setStatus("running");
          setJobId(jobId); // triggers Step 2 polling
          // Call resume endpoint immediately — don't wait for isStuck timer.
          // Guard prevents double-call if component re-renders.
          if (!resumeCalledRef.current) {
            resumeCalledRef.current = true;
            try {
              await fetch(`${API_URL}/api/resume/${jobId}`, { method: "POST" });
              console.log(`[hook] Resume called for job ${jobId}`);
            } catch (e) {
              console.error("[hook] Resume call failed:", e);
            }
          }
          return;
        }

        // "branding_approved" — phase 2 is running, just poll normally
        setJobId(jobId);
      });
  }, [projectId]);

  // ── Step 2: start polling when jobId resolves ─────────────────────────────
  useEffect(() => {
    if (!jobId || skipPollingRef.current) return;
    setStatus("running");
    startPolling(jobId);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (stuckTimerRef.current) clearTimeout(stuckTimerRef.current);
    };
  }, [jobId]);

  // ── Resume after branding approval ────────────────────────────────────────
  function resumePollingAfterApproval() {
    if (!jobId) return;
    savedRef.current       = false;
    skipPollingRef.current = false; // was set to true during HITL pause — re-enable
    setStatus("running");
    setIsStuck(false);
    startPolling(jobId);
  }

  // ── Resume a stuck job via the /api/resume endpoint ───────────────────────
  const resumeStuckJob = useCallback(async () => {
    if (!jobId) return;
    try {
      setIsStuck(false);
      await fetch(`${API_URL}/api/resume/${jobId}`, { method: "POST" });
      setStatus("running");
      startPolling(jobId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Resume failed");
    }
  }, [jobId]);

  // ── Step 3: backend handles project completion and analysis_results ─────────
  // The server's _update_project_completed() now writes analysis_results and
  // sets projects.status = "completed" when the pipeline finishes.
  // The frontend only needs to do this as a fallback for edge cases where
  // the page was open and caught the "done" status live.
  useEffect(() => {
    if (status !== "done" || !data || !projectId || savedRef.current) return;
    savedRef.current = true;

    // Verify backend already marked it — if not (race condition), do it here too
    const supabase = createClient();
    supabase
      .from("projects")
      .select("status")
      .eq("id", projectId)
      .single()
      .then(({ data: proj }) => {
        if (proj?.status !== "completed") {
          // Backend didn't update yet — do it from frontend as fallback
          const agentMap: Record<string, OutputKey> = {
            planner: "planner_output", research: "research_output",
            competitor: "competitor_output", product: "product_output",
            branding: "branding_output", finance: "finance_output",
            gtm: "gtm_output", pitch: "pitch_output",
          };
          const inserts = Object.entries(agentMap)
            .filter(([, key]) => data[key] != null)
            .map(([agent, key]) => ({ project_id: projectId, agent, output: data[key] }));

          supabase
            .from("analysis_results")
            .upsert(inserts, { onConflict: "project_id,agent" })
            .then(() => {
              supabase.from("projects").update({ status: "completed" }).eq("id", projectId);
            });
        }
      });
  }, [status, data, projectId]);

  const completedAgents = data ? OUTPUT_KEYS.filter(k => data[k] != null) : [];

  return {
    data, status, error, completedAgents, projectTitle,
    jobId, brandingSuggestions, logoImageUrl,
    isStuck, resumeStuckJob,
    resumePollingAfterApproval,
  };
}