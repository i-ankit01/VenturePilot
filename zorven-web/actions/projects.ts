"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function createProject(fields: {
  idea: string;
  industry: string;
  target_market: string;
  budget: string;
  stage: string;
  job_id: string;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  // Derive a title from the first sentence or first 60 chars of the idea
  const title = fields.idea.split(/[.!?]/)[0].slice(0, 60).trim();

  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      title,
      idea: fields.idea,
      industry: fields.industry,
      target_market: fields.target_market,
      budget: fields.budget,
      stage: fields.stage,
      status: "building",
      job_id: fields.job_id,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data.id as string;
}