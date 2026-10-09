import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { progressPercent } from "@/lib/ml/roadmap";

async function latestResumeId(sb: any, userId: string): Promise<string | null> {
  const { data } = await sb
    .from("resumes")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

const JOB_COLS = "id, job_title, company, location, state, city, salary, experience, employment_type, required_skills";

export const getRecommendations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const rid = await latestResumeId(context.supabase, context.userId);
    if (!rid) return [];
    const { data } = await context.supabase
      .from("job_recommendations")
      .select(`*, job:jobs(${JOB_COLS})`)
      .eq("resume_id", rid)
      .order("rank");
    return data ?? [];
  });

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const { count: jobCount } = await sb.from("jobs").select("id", { count: "exact", head: true });
    const rid = await latestResumeId(sb, context.userId);
    if (!rid) return { hasResume: false, jobCount: jobCount ?? 0 } as const;
    const [{ data: skills }, { data: recs }, { data: rm }] = await Promise.all([
      sb.from("user_skills").select("skill_name").eq("resume_id", rid),
      sb.from("job_recommendations").select(`*, job:jobs(job_title, company)`).eq("resume_id", rid).order("rank"),
      sb.from("roadmaps").select("id, target_role, roadmap_items(completed)").eq("resume_id", rid).maybeSingle(),
    ]);
    const top = recs?.[0];
    return {
      hasResume: true,
      jobCount: jobCount ?? 0,
      skills: (skills ?? []).map((s) => s.skill_name),
      recommendations: recs ?? [],
      readiness: top ? top.readiness : null,
      skillGaps: top ? top.missing_skills.length : null,
      roadmapProgress: rm ? progressPercent(rm.roadmap_items ?? []) : null,
      targetRole: rm?.target_role ?? null,
    } as const;
  });

export const getSkillGap = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { jobId?: string }) => d)
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const rid = await latestResumeId(sb, context.userId);
    if (!rid) return null;
    const { data: skills } = await sb.from("user_skills").select("skill_name").eq("resume_id", rid);
    const userSkills = (skills ?? []).map((s) => s.skill_name);
    let q = sb.from("job_recommendations").select(`*, job:jobs(${JOB_COLS})`).eq("resume_id", rid);
    q = data.jobId ? q.eq("job_id", data.jobId) : q.order("rank").limit(1);
    const { data: rec } = await q.maybeSingle();
    const { data: dict } = await sb.from("skills").select("name, category, level");
    return { userSkills, rec, dict: dict ?? [] };
  });

export const getRoadmap = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const rid = await latestResumeId(sb, context.userId);
    if (!rid) return null;
    const { data: rm } = await sb
      .from("roadmaps")
      .select("id, target_role, job_id, roadmap_items(*)")
      .eq("resume_id", rid)
      .maybeSingle();
    if (!rm) return { roadmap: null, resources: [] };
    const items = [...(rm.roadmap_items ?? [])].sort((a, b) => a.step - b.step);
    const skillNames = items.map((i) => i.skill).filter(Boolean) as string[];
    const { data: resources } = await sb
      .from("learning_resources")
      .select("*")
      .in("skill", [...skillNames, "General"]);
    return { roadmap: { ...rm, roadmap_items: items, progress: progressPercent(items) }, resources: resources ?? [] };
  });

export const setRoadmapItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { itemId: string; completed: boolean }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("roadmap_items")
      .update({ completed: data.completed, completed_at: data.completed ? new Date().toISOString() : null })
      .eq("id", data.itemId);
    if (error) throw new Error("Could not update roadmap item.");
    return { ok: true };
  });

export const generateRoadmapForJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { jobId: string }) => d)
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const rid = await latestResumeId(sb, context.userId);
    if (!rid) throw new Error("Upload a resume first.");
    const { data: rec } = await sb
      .from("job_recommendations")
      .select("missing_skills, job:jobs(id, job_title)")
      .eq("resume_id", rid)
      .eq("job_id", data.jobId)
      .maybeSingle();
    if (!rec?.job) throw new Error("This job isn't in your recommendations.");
    const { createRoadmap } = await import("./engine.server");
    await createRoadmap(sb, context.userId, rid, rec.job as any, rec.missing_skills);
    return { ok: true };
  });
