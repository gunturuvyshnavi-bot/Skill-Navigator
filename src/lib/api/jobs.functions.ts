import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type JobFilters = { search?: string; location?: string; state?: string; experience?: string; skill?: string; page?: number };
const PAGE = 24;
const clean = (s?: string) => (s ?? "").replace(/[%,()]/g, " ").trim().slice(0, 80);

export const listJobs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: JobFilters) => d)
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("jobs")
      .select("id, job_title, company, location, state, city, salary, experience, required_skills", { count: "exact" });
    const s = clean(data.search);
    if (s) q = q.or(`job_title.ilike.%${s}%,company.ilike.%${s}%,job_description.ilike.%${s}%`);
    if (clean(data.location)) q = q.or(`location.ilike.%${clean(data.location)}%,city.ilike.%${clean(data.location)}%`);
    if (clean(data.state)) q = q.ilike("state", `%${clean(data.state)}%`);
    if (clean(data.experience)) q = q.ilike("experience", `%${clean(data.experience)}%`);
    if (clean(data.skill)) q = q.contains("required_skills", [clean(data.skill)]);
    const page = Math.max(0, data.page ?? 0);
    const { data: jobs, count, error } = await q.order("job_title").range(page * PAGE, page * PAGE + PAGE - 1);
    if (error) throw new Error("Could not load jobs.");
    return { jobs: jobs ?? [], total: count ?? 0, pageSize: PAGE };
  });

export const getJob = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { jobId: string }) => d)
  .handler(async ({ data, context }) => {
    if (!/^[0-9a-f-]{36}$/i.test(data.jobId)) throw new Error("Invalid job ID.");
    const sb = context.supabase;
    const { data: job } = await sb.from("jobs").select("*").eq("id", data.jobId).maybeSingle();
    if (!job) throw new Error("Job not found.");
    const { data: resume } = await sb
      .from("resumes")
      .select("id")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    let analysis = null;
    if (resume) {
      const { data: skills } = await sb.from("user_skills").select("skill_name").eq("resume_id", resume.id);
      const { data: rec } = await sb
        .from("job_recommendations")
        .select("match_score, tfidf_score")
        .eq("resume_id", resume.id)
        .eq("job_id", job.id)
        .maybeSingle();
      const { computeGap } = await import("@/lib/ml/gap");
      const { buildAliasIndex, normalizeSkill } = await import("@/lib/ml/skills");
      const { loadDictionary } = await import("./engine.server");
      const idx = buildAliasIndex(await loadDictionary(sb));
      const required = job.required_skills.map((s) => normalizeSkill(s, idx));
      const userSkills = (skills ?? []).map((s) => s.skill_name);
      analysis = { ...computeGap(userSkills, required), userSkills, matchScore: rec?.match_score ?? null, recommended: !!rec };
    }
    return { job, analysis };
  });
