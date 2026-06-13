"use client";

import { useState, useEffect, useRef } from "react";
import { fetchPartial, PartialResult, PipelineStatus } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";

const OUTPUT_KEYS = [
  "planner_output", "research_output", "competitor_output", "product_output",
  "branding_output", "finance_output", "gtm_output", "pitch_output",
] as const;
type OutputKey = typeof OUTPUT_KEYS[number];

export function usePipelineProgress(projectId: string | null) {
  const [jobId, setJobId]               = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState<string>("");
  const [data, setData]                 = useState<PartialResult | null>(null);
  const [status, setStatus]             = useState<PipelineStatus>("idle");
  const [error, setError]               = useState<string | null>(null);
  const intervalRef                     = useRef<ReturnType<typeof setInterval> | null>(null);
  const savedRef                        = useRef(false);
  const skipPollingRef                  = useRef(false); // ← NEW

  // ── Step 1 ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!projectId) return;
    const supabase = createClient();

    supabase
      .from("projects")
      .select("job_id, title, status")
      .eq("id", projectId)
      .single()
      .then(async ({ data: project, error: projError }) => {
        if (projError || !project) {
          setError("Project not found");
          return;
        }

        setProjectTitle(project.title ?? project.job_id);
        console.log("[Step1] project.status =", project.status); // debug

        if (project.status === "completed") {
          const { data: rows, error: rowsError } = await supabase
            .from("analysis_results")
            .select("agent, output")
            .eq("project_id", projectId);

          if (rowsError || !rows || rows.length === 0) {
            // No saved rows — fall through to polling
            setJobId(project.job_id);
            return;
          }

          console.log("[Step1] restored rows:", rows.length); // debug

          const restored: Partial<PartialResult> = {};
          for (const row of rows) {
            const key = `${row.agent}_output` as OutputKey;
            if (OUTPUT_KEYS.includes(key)) {
              (restored as any)[key] = row.output;
            }
          }

          // ── ORDER MATTERS: set skipPollingRef BEFORE setJobId ──
          skipPollingRef.current = true; // ← tells Step 2 not to poll
          savedRef.current = true;
          setData(restored as PartialResult);
          setStatus("done");
          setJobId(project.job_id); // ← triggers Step 2, but ref guards it
          return;
        }

        // Not completed — let Step 2 poll
        setJobId(project.job_id);
      });
  }, [projectId]);

  // ── Step 2 ───────────────────────────────────────────────────────────────
  useEffect(() => {
    console.log("[Step2] fired — jobId:", jobId, "skipPolling:", skipPollingRef.current); // debug
    
    if (!jobId || skipPollingRef.current) return; // ← ref is always current, no stale closure

    setStatus("running");

    intervalRef.current = setInterval(async () => {
      try {
        const json = await fetchPartial(jobId);
        setData(json.partial);
        setStatus(json.status);

        if (json.status === "done" || json.status === "error") {
          clearInterval(intervalRef.current!);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setStatus("error");
        clearInterval(intervalRef.current!);
      }
    }, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [jobId]);

  // ── Step 3 (unchanged) ────────────────────────────────────────────────────
  useEffect(() => {
    if (status !== "done" || !data || !projectId || savedRef.current) return;
    savedRef.current = true;
    // ... rest of your save logic unchanged
  }, [status, data, projectId]);

  const completedAgents: string[] = data
    ? OUTPUT_KEYS.filter((k) => data[k] != null)
    : [];

  return { data, status, error, completedAgents, projectTitle };
}