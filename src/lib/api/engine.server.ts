// Server-only orchestration: dictionary loading, matching, roadmap persistence.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { buildAliasIndex, mergeDatasetSkills, normalizeSkill, type SkillEntry } from "@/lib/ml/skills";
import { rankBySimilarity } from "@/lib/ml/tfidf";
import { computeGap, weightedScore, round1 } from "@/lib/ml/gap";
import { buildRoadmap } from "@/lib/ml/roadmap";

type DB = SupabaseClient<Database>;
export const TOP_N = 5;

export async function loadDictionary(sb: DB): Promise<SkillEntry[]> {
  const { data: base, error } = await sb.from("skills").select("name, aliases, category, level");
  if (error) throw new Error("Could not load the skill dictionary.");
  const { data: jobs } = await sb.from("jobs").select("required_skills").limit(5000);
  const datasetSkills = (jobs ?? []).flatMap((j) => j.required_skills ?? []);
  return mergeDatasetSkills(base ?? [], datasetSkills);
}

export async function runMatching(sb: DB, userId: string, resumeId: string, resumeText: string, userSkills: string[]) {
  const { data: jobs, error } = await sb
    .from("jobs")
    .select("id, job_title, job_description, required_skills")
    .limit(5000);
  if (error) throw new Error("Could not load jobs.");
  await sb.from("job_recommendations").delete().eq("resume_id", resumeId);
  if (!jobs || jobs.length === 0) return [];

  const dict = await loadDictionary(sb);
  const aliasIdx = buildAliasIndex(dict);
  const sims = rankBySimilarity(
    resumeText,
    jobs.map((j) => `${j.job_title} ${j.job_description} ${(j.required_skills ?? []).join(" ")}`),
  );
  const scored = jobs.map((j, i) => {
    const required = (j.required_skills ?? []).map((s) => normalizeSkill(s, aliasIdx)).filter(Boolean);
    const gap = computeGap(userSkills, required);
    return {
      job_id: j.id,
      tfidf_score: round1((sims[i] ?? 0) * 100),
      overlap_score: round1(gap.overlap * 100),
      match_score: weightedScore(sims[i] ?? 0, gap.overlap, required.length > 0),
      matched_skills: gap.matched,
      missing_skills: gap.missing,
      skill_gap: gap.skillGap,
      readiness: gap.readiness,
    };
  });
  const top = scored
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, TOP_N)
    .filter((s) => s.match_score > 0)
    .map((s, i) => ({ ...s, rank: i + 1, user_id: userId, resume_id: resumeId }));
  if (top.length) {
    const { error: insErr } = await sb.from("job_recommendations").insert(top);
    if (insErr) throw new Error("Could not save recommendations.");
  }
  return top;
}

export async function createRoadmap(
  sb: DB,
  userId: string,
  resumeId: string,
  job: { id: string; job_title: string },
  missing: string[],
) {
  await sb.from("roadmaps").delete().eq("resume_id", resumeId);
  const dict = await loadDictionary(sb);
  const levels = new Map(dict.map((d) => [d.name.toLowerCase(), d.level]));
  const steps = buildRoadmap(job.job_title, missing, (s) => levels.get(s.toLowerCase()) ?? "Intermediate");
  const { data: rm, error } = await sb
    .from("roadmaps")
    .insert({ user_id: userId, resume_id: resumeId, job_id: job.id, target_role: job.job_title })
    .select("id")
    .single();
  if (error || !rm) throw new Error("Could not create roadmap.");
  await sb.from("roadmap_items").insert(steps.map((s) => ({ ...s, roadmap_id: rm.id, user_id: userId })));
  return rm.id;
}
