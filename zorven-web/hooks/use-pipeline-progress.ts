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
  const [jobId, setJobId]   = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState<string>("");
  const [data, setData]     = useState<PartialResult | null>(null);
  const [status, setStatus] = useState<PipelineStatus>("idle");
  const [error, setError]   = useState<string | null>(null);
  const intervalRef         = useRef<ReturnType<typeof setInterval> | null>(null);
  const savedRef            = useRef(false);

  // Step 1: fetch project row from Supabase to get job_id
  useEffect(() => {
    if (!projectId) return;
    const supabase = createClient();

    supabase
      .from("projects")
      .select("job_id, title, status")
      .eq("id", projectId)
      .single()
      .then(({ data: project, error }) => {
        if (error || !project) {
          setError("Project not found");
          return;
        }
        setJobId(project.job_id);
        setProjectTitle(project.title);

        // If already done in DB, mark as done immediately
        if (project.status === "completed") {
          setStatus("done");
        }
      });
  }, [projectId]);

  // Step 2: poll backend using job_id
  useEffect(() => {
    if (!jobId || status === "done") return;

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

  // Step 3: when done, save results to Supabase
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

    // Upsert in case of re-runs
    supabase
      .from("analysis_results")
      .upsert(inserts, { onConflict: "project_id,agent" })
      .then(() => {
        // Mark project as completed
        supabase
          .from("projects")
          .update({ status: "completed" })
          .eq("id", projectId);
      });
  }, [status, data, projectId]);

  // Which output keys have data — matches what workspace page checks
  const completedAgents: string[] = data
    ? OUTPUT_KEYS.filter((k) => data[k] != null)
    : [];

  return { data, status, error, completedAgents, projectTitle };
}