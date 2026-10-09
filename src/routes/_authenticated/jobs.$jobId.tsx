import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Briefcase } from "lucide-react";
import { getJob } from "@/lib/api/jobs.functions";
import { Panel, EmptyState, SkillChip, ScoreRing, fmt } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/jobs/$jobId")({
  head: () => ({ meta: [{ title: "Job details — SkillBridge AI" }, { name: "description", content: "Job details with your match score and skill gap." }] }),
  component: JobDetail,
});

function JobDetail() {
  const { jobId } = Route.useParams();
  const fn = useServerFn(getJob);
  const { data, isLoading, error } = useQuery({ queryKey: ["job", jobId], queryFn: () => fn({ data: { jobId } }), retry: false });
  if (isLoading) return <Skeleton className="h-96 rounded-2xl" />;
  if (error || !data) return <EmptyState icon={Briefcase} title="Job not found" body="This job doesn't exist or the link is invalid." action={<Button asChild><Link to="/jobs" search={{}}>Back to jobs</Link></Button>} />;
  const { job, analysis } = data;
  const hasReq = job.required_skills.length > 0;

  return (
    <>
      <Link to="/jobs" search={{}} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />All jobs</Link>
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Panel>
          <h1 className="text-2xl font-bold">{job.job_title}</h1>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            {[["Company", job.company], ["Location", job.location ?? job.city], ["State", job.state], ["Salary", job.salary], ["Experience", job.experience], ["Type", job.employment_type]].map(([k, v]) => (
              <div key={k} className="rounded-lg bg-muted px-3 py-2"><dt className="text-xs text-muted-foreground">{k}</dt><dd className="font-medium">{fmt(v)}</dd></div>
            ))}
          </dl>
          <h2 className="mt-6 font-semibold">Required Skills</h2>
          <div className="mt-2 flex flex-wrap gap-1.5">{hasReq ? job.required_skills.map((s) => <SkillChip key={s} name={s} tone="neutral" />) : <span className="text-sm text-muted-foreground">Not Available</span>}</div>
          <h2 className="mt-6 font-semibold">Job Description</h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{job.job_description}</p>
        </Panel>
        <Panel className="h-fit">
          {!analysis ? (
            <p className="text-sm text-muted-foreground">Upload your resume to see your match score and skill gap. <Link to="/resume" className="text-primary underline">Upload</Link></p>
          ) : (
            <>
              <div className="flex items-center justify-around">
                <ScoreRing value={analysis.matchScore ?? 0} label="match" size={100} />
                <ScoreRing value={hasReq ? analysis.readiness : 0} label="readiness" size={100} />
              </div>
              {analysis.matchScore == null && <p className="mt-2 text-center text-xs text-muted-foreground">Not in your top 5 — match score not calculated.</p>}
              <div className="mt-4 text-center text-sm">Skill Gap: <b>{hasReq ? `${analysis.skillGap}%` : "Not Available"}</b></div>
              <h3 className="mt-5 text-sm font-semibold">Your Skills</h3>
              <div className="mt-2 flex flex-wrap gap-1.5">{analysis.matched.length ? analysis.matched.map((s) => <SkillChip key={s} name={s} tone="have" />) : <span className="text-xs text-muted-foreground">None of the required skills found.</span>}</div>
              <h3 className="mt-4 text-sm font-semibold">Missing Skills</h3>
              <div className="mt-2 flex flex-wrap gap-1.5">{analysis.missing.length ? analysis.missing.map((s) => <SkillChip key={s} name={s} tone="missing" />) : <span className="text-xs text-muted-foreground">None 🎉</span>}</div>
              {analysis.recommended && <Button asChild className="mt-6 w-full"><Link to="/skill-gap" search={{ jobId: job.id }}>View Skill Gap</Link></Button>}
            </>
          )}
        </Panel>
      </div>
    </>
  );
}
