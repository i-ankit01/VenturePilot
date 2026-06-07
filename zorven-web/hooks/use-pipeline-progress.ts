"use client";

import { useState, useEffect, useRef } from "react";
import { fetchPartial, PartialResult, PipelineStatus } from "@/lib/api";

export function usePipelineProgress(jobId: string | null) {
  const [data, setData]     = useState<PartialResult | null>(null);
  const [status, setStatus] = useState<PipelineStatus>("idle");
  const [error, setError]   = useState<string | null>(null);
  const intervalRef         = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!jobId) return;

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

  // Which agents have returned data
  const completedAgents = data
    ? ([
        data.planner_output    && "planner",
        data.research_output   && "research",
        data.competitor_output && "competitor",
        data.product_output    && "product",
        data.branding_output   && "branding",
        data.finance_output    && "finance",
        data.gtm_output        && "gtm",
        data.pitch_output      && "pitch",
      ].filter(Boolean) as string[])
    : [];

  return { data, status, error, completedAgents };
}