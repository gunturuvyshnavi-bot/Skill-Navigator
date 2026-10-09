import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Target } from "lucide-react";
import { getSkillGap, generateRoadmapForJob } from "@/lib/api/insights.functions";
import { PageHeader, Panel, EmptyState, SkillChip, ScoreRing } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/skill-gap")({
  validateSearch: (s: Record<string, unknown>) => ({ jobId: typeof s.jobId === "string" ? s.jobId : undefined }),
  head: () => ({ meta: [{ title: "Your Skill Gap — SkillBridge AI" }, { name: "description", content: "Skills you have, skills you need and your job readiness." }] }),
  component: SkillGapPage,
});

const LEVEL: Record<string, number> = { Beginner: 0, Intermediate: 1, Advanced: 2 };

function SkillGapPage() {
  const { jobId } = Route.useSearch();
  const fn = useServerFn(getSkillGap);
  const gen = useServerFn(generateRoadmapForJob);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ["gap", jobId], queryFn: () => fn({ data: { jobId } }) });

  if (isLoading) return <Skeleton className="h-80 rounded-2xl" />;
  if (!data) return <EmptyState icon={Target} title="No resume analyzed" body="Upload your resume to see your skill gap." action={<Button asChild><Link to="/resume">Upload resume</Link></Button>} />;
  const rec: any = data.rec;
  if (!rec) return <EmptyState icon={Target} title="No job selected" body="Skill gaps are calculated against your recommended jobs, which appear once the job dataset is loaded." action={<Button asChild variant="outline"><Link to="/jobs" search={{ tab: "recommended" }}>See recommendations</Link></Button>} />;

  const dict = new Map(data.dict.map((d) => [d.name.toLowerCase(), d]));
  const userCats = new Set(data.userSkills.map((s) => dict.get(s.toLowerCase())?.category).filter(Boolean));
  const missing: string[] = rec.missing_skills;
  const partial = missing.filter((s) => { const c = dict.get(s.toLowerCase())?.category; return c && userCats.has(c); });
  const priority = [...missing].sort((a, b) => (LEVEL[dict.get(a.toLowerCase())?.level ?? "Intermediate"] ?? 1) - (LEVEL[dict.get(b.toLowerCase())?.level ?? "Intermediate"] ?? 1));
  const hasReq = rec.matched_skills.length + missing.length > 0;

  async function buildRoadmap() {
    try {
      await gen({ data: { jobId: rec.job_id } });
      await qc.invalidateQueries();
      toast.success("Roadmap updated for " + rec.job.job_title);
      navigate({ to: "/roadmap" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not build roadmap.");
    }
  }

  return (
    <>
      <PageHeader title="Your Skill Gap" subtitle={`For ${rec.job.job_title}${rec.job.company ? " · " + rec.job.company : ""}`}
        action={<Button onClick={buildRoadmap}>Build roadmap for this job</Button>} />
      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <Panel className="flex flex-col items-center justify-center gap-4">
          <ScoreRing value={hasReq ? rec.readiness : 0} label="Job readiness" size={150} />
          <div className="text-center"><div className="text-sm text-muted-foreground">Skill Gap</div><div className="font-display text-3xl font-bold text-destructive">{hasReq ? `${rec.skill_gap}%` : "N/A"}</div></div>
          <p className="text-center text-xs text-muted-foreground">Gap = missing ÷ required × 100 · Readiness = 100 − gap</p>
        </Panel>
        <div className="space-y-4">
          <Panel>
            <h2 className="font-semibold">Skills You Have <span className="text-muted-foreground">({rec.matched_skills.length})</span></h2>
            <div className="mt-3 flex flex-wrap gap-1.5">{rec.matched_skills.length ? rec.matched_skills.map((s: string) => <SkillChip key={s} name={`✓ ${s}`} tone="have" />) : <span className="text-sm text-muted-foreground">None of the required skills were found in your resume.</span>}</div>
          </Panel>
          <Panel>
            <h2 className="font-semibold">Skills You Need <span className="text-muted-foreground">({missing.length})</span></h2>
            <div className="mt-3 flex flex-wrap gap-1.5">{missing.length ? missing.map((s) => <SkillChip key={s} name={s} tone={partial.includes(s) ? "partial" : "missing"} />) : <span className="text-sm text-muted-foreground">You have every required skill 🎉</span>}</div>
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-success" />Available</span>
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-warning" />Related skill in same area</span>
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-destructive" />Missing</span>
            </div>
          </Panel>
          {priority.length > 0 && (
            <Panel>
              <h2 className="font-semibold">Learning Priority</h2>
              <ol className="mt-3 space-y-2">
                {priority.map((s, i) => (
                  <li key={s} className="flex items-center gap-3 text-sm">
                    <span className="grid size-6 place-items-center rounded-full bg-secondary text-xs font-semibold">{i + 1}</span>
                    {s}<span className="text-xs text-muted-foreground">{dict.get(s.toLowerCase())?.level ?? "Intermediate"}</span>
                  </li>
                ))}
              </ol>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}
