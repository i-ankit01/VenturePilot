"use client";

import { useState, useEffect, useRef } from "react";
import {
  fetchPartial,
  PartialResult,
  PipelineStatus,
  BrandingSuggestions,
} from "@/lib/api";
import { createClient } from "@/lib/supabase/client";

const OUTPUT_KEYS = [
  "planner_output",
  "research_output",
  "competitor_output",
  "product_output",
  "branding_output",
  "finance_output",
  "gtm_output",
  "pitch_output",
] as const;
type OutputKey = (typeof OUTPUT_KEYS)[number];

export function usePipelineProgress(projectId: string | null) {
  const [jobId, setJobId]                         = useState<string | null>(null);
  const [projectTitle, setProjectTitle]           = useState<string>("");
  const [data, setData]                           = useState<PartialResult | null>(null);
  const [status, setStatus]                       = useState<PipelineStatus>("idle");
  const [error, setError]                         = useState<string | null>(null);
  const [brandingSuggestions, setBrandingSuggestions] = useState<BrandingSuggestions | null>(null);
  const [logoImageUrl, setLogoImageUrl]           = useState<string | null>(null);

  const intervalRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const savedRef         = useRef(false);
  const skipPollingRef   = useRef(false);
  const lastDataRef      = useRef<PartialResult | null>(null);

  // ── Step 1: resolve project → job_id ────────────────────────────────────
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

        if (project.status === "completed") {
          const { data: rows, error: rowsError } = await supabase
            .from("analysis_results")
            .select("agent, output")
            .eq("project_id", projectId);

          if (rowsError || !rows || rows.length === 0) {
            setJobId(project.job_id);
            return;
          }

          const restored: Partial<PartialResult> = {};
          for (const row of rows) {
            const key = `${row.agent}_output` as OutputKey;
            if (OUTPUT_KEYS.includes(key)) {
              (restored as any)[key] = row.output;
            }
          }

          skipPollingRef.current = true;
          savedRef.current       = true;
          lastDataRef.current    = restored as PartialResult;
          setData(restored as PartialResult);
          setStatus("done");
          setJobId(project.job_id);
          return;
        }

        setJobId(project.job_id);
      });
  }, [projectId]);

  // ── Step 2: poll /api/partial/:jobId ────────────────────────────────────
  useEffect(() => {
    if (!jobId || skipPollingRef.current) return;

    setStatus("running");

    intervalRef.current = setInterval(async () => {
      try {
        const json = await fetchPartial(jobId);

        // Never overwrite good data with empty response
        if (json.partial && Object.keys(json.partial).length > 0) {
          lastDataRef.current = json.partial;
          setData(json.partial);
        } else if (lastDataRef.current) {
          setData(lastDataRef.current);
        }

        setStatus(json.status);

        // HITL: branding suggestions arrived
        if (json.branding_suggestions) {
          setBrandingSuggestions(json.branding_suggestions);
        }

        // Logo generated in phase 2
        if (json.logo_image_url) {
          setLogoImageUrl(json.logo_image_url);
        }

        // Stop polling on terminal states
        if (
          json.status === "done" ||
          json.status === "error" ||
          json.status === "awaiting_branding_approval"
        ) {
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

  // ── Step 2b: resume polling after branding approval ─────────────────────
  // Called from the workspace page after approveBranding() returns.
  function resumePollingAfterApproval() {
    if (!jobId) return;

    setStatus("running");
    savedRef.current = false; // allow saving again when phase 2 done

    intervalRef.current = setInterval(async () => {
      try {
        const json = await fetchPartial(jobId);

        if (json.partial && Object.keys(json.partial).length > 0) {
          lastDataRef.current = json.partial;
          setData(json.partial);
        } else if (lastDataRef.current) {
          setData(lastDataRef.current);
        }

        setStatus(json.status);

        if (json.logo_image_url) {
          setLogoImageUrl(json.logo_image_url);
        }

        if (json.status === "done" || json.status === "error") {
          clearInterval(intervalRef.current!);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setStatus("error");
        clearInterval(intervalRef.current!);
      }
    }, 3000);
  }

  // ── Step 3: persist to Supabase when done ───────────────────────────────
  useEffect(() => {
    if (status !== "done" || !data || !projectId || savedRef.current) return;
    savedRef.current = true;

    const supabase = createClient();

    const agentMap: Record<string, OutputKey> = {
      planner:    "planner_output",
      research:   "research_output",
      competitor: "competitor_output",
      product:    "product_output",
      branding:   "branding_output",
      finance:    "finance_output",
      gtm:        "gtm_output",
      pitch:      "pitch_output",
    };

    const inserts = Object.entries(agentMap)
      .filter(([, outputKey]) => data[outputKey] != null)
      .map(([agent, outputKey]) => ({
        project_id: projectId,
        agent,
        output: data[outputKey],
      }));

    supabase
      .from("analysis_results")
      .upsert(inserts, { onConflict: "project_id,agent" })
      .then(() => {
        supabase
          .from("projects")
          .update({ status: "completed" })
          .eq("id", projectId);
      });
  }, [status, data, projectId]);

  const completedAgents: string[] = data
    ? OUTPUT_KEYS.filter((k) => data[k] != null)
    : [];

  return {
    data,
    status,
    error,
    completedAgents,
    projectTitle,
    jobId,
    brandingSuggestions,
    logoImageUrl,
    resumePollingAfterApproval,
  };
}