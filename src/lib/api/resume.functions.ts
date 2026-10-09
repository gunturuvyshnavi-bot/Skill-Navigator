import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getLatestResume = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("resumes")
      .select("id, file_name, file_size, mime_type, status, error, analyzed_at, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data) return { resume: null, skills: [] as string[] };
    const { data: skills } = await context.supabase.from("user_skills").select("skill_name").eq("resume_id", data.id);
    return { resume: data, skills: (skills ?? []).map((s) => s.skill_name).sort() };
  });

export const registerResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { filePath: string; fileName: string; fileSize: number; mimeType: string }) => d)
  .handler(async ({ data, context }) => {
    const { validateResumeFile } = await import("@/lib/resume/parser");
    const v = validateResumeFile(data.fileName, data.mimeType, data.fileSize);
    if ("error" in v) throw new Error(v.error);
    if (!data.filePath.startsWith(`${context.userId}/`)) throw new Error("Invalid file path.");
    const { data: row, error } = await context.supabase
      .from("resumes")
      .insert({
        user_id: context.userId,
        file_path: data.filePath,
        file_name: data.fileName.slice(0, 200),
        file_size: data.fileSize,
        mime_type: data.mimeType || (v.kind === "pdf" ? "application/pdf" : "application/docx"),
      })
      .select("id")
      .single();
    if (error || !row) throw new Error("Could not save resume.");
    return { id: row.id };
  });

export const analyzeResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { resumeId: string }) => d)
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { data: resume } = await sb.from("resumes").select("*").eq("id", data.resumeId).maybeSingle();
    if (!resume) throw new Error("Resume not found.");
    const parser = await import("@/lib/resume/parser");
    const engine = await import("./engine.server");
    const { extractSkills } = await import("@/lib/ml/skills");
    const fail = async (msg: string) => {
      await sb.from("resumes").update({ status: "error", error: msg }).eq("id", resume.id);
      throw new Error(msg);
    };

    const { data: blob, error: dlErr } = await sb.storage.from("resumes").download(resume.file_path);
    if (dlErr || !blob) return fail("Could not read the uploaded file.");
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const kind = resume.file_name.toLowerCase().endsWith(".pdf") ? "pdf" : "docx";
    let raw = "";
    try {
      raw = kind === "pdf" ? await parser.extractPdfText(bytes) : await parser.extractDocxText(bytes);
    } catch (e) {
      return fail(e instanceof Error ? e.message : "Could not read file.");
    }
    const text = parser.cleanResumeText(raw);
    if (text.length < 30) return fail("No readable text found. Scanned/image resumes aren't supported.");

    const dict = await engine.loadDictionary(sb);
    const skills = extractSkills(text, dict);
    await sb.from("user_skills").delete().eq("resume_id", resume.id);
    if (skills.length) {
      await sb.from("user_skills").insert(skills.map((s) => ({ user_id: context.userId, resume_id: resume.id, skill_name: s })));
    }
    await sb
      .from("resumes")
      .update({ extracted_text: text, status: "analyzed", error: null, analyzed_at: new Date().toISOString() })
      .eq("id", resume.id);

    const recs = await engine.runMatching(sb, context.userId, resume.id, text, skills);
    if (recs[0]) {
      const { data: job } = await sb.from("jobs").select("id, job_title").eq("id", recs[0].job_id).single();
      if (job) await engine.createRoadmap(sb, context.userId, resume.id, job, recs[0].missing_skills);
    }
    return { skills, recommendations: recs.length };
  });

export const getResumeUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { resumeId: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: r } = await context.supabase.from("resumes").select("file_path").eq("id", data.resumeId).maybeSingle();
    if (!r) throw new Error("Resume not found.");
    const { data: s, error } = await context.supabase.storage.from("resumes").createSignedUrl(r.file_path, 300);
    if (error || !s) throw new Error("Could not open resume.");
    return { url: s.signedUrl };
  });

export const deleteResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { resumeId: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: r } = await context.supabase.from("resumes").select("id, file_path").eq("id", data.resumeId).maybeSingle();
    if (!r) throw new Error("Resume not found.");
    await context.supabase.storage.from("resumes").remove([r.file_path]);
    // user_skills, job_recommendations, roadmaps and roadmap_items cascade
    const { error } = await context.supabase.from("resumes").delete().eq("id", r.id);
    if (error) throw new Error("Could not delete resume.");
    return { ok: true };
  });
