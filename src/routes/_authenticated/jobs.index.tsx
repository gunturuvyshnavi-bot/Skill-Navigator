import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Briefcase, MapPin, IndianRupee, Clock, Search, Database, Sparkles } from "lucide-react";
import { listJobs, type JobFilters } from "@/lib/api/jobs.functions";
import { getRecommendations } from "@/lib/api/insights.functions";
import { PageHeader, Panel, EmptyState, SkillChip, ScoreRing, fmt } from "@/components/common";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/jobs/")({
  validateSearch: (s: Record<string, unknown>) => ({ ...(s['tab'] === "recommended" ? { tab: "recommended" as const } : {}) }),
  head: () => ({ meta: [{ title: "Explore Indian Jobs — SkillBridge AI" }, { name: "description", content: "Browse and filter Indian job postings." }, { property: "og:title", content: "Explore Indian Jobs — SkillBridge AI" }, { property: "og:description", content: "Browse and filter Indian job postings." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: JobsPage,
});

function JobsPage() {
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <>
      <PageHeader title="Explore Indian Jobs" subtitle="Recommendations are calculated from your resume using TF-IDF and skill overlap." />
      <Tabs value={tab ?? "explore"} onValueChange={(v) => navigate({ search: { tab: v === "recommended" ? "recommended" : undefined } })}>
        <TabsList className="mb-5">
          <TabsTrigger value="explore">All jobs</TabsTrigger>
          <TabsTrigger value="recommended">Top 5 for you</TabsTrigger>
        </TabsList>
      </Tabs>
      {tab === "recommended" ? <Recommended /> : <Explore />}
    </>
  );
}

function Recommended() {
  const fn = useServerFn(getRecommendations);
  const { data, isLoading } = useQuery({ queryKey: ["recs"], queryFn: () => fn() });
  if (isLoading) return <Skeleton className="h-60 rounded-2xl" />;
  if (!data?.length)
    return <EmptyState icon={Sparkles} title="No matching jobs yet" body="Upload and analyze your resume. Matches appear once the Indian job dataset is loaded."
      action={<Button asChild><Link to="/resume">Go to resume</Link></Button>} />;
  return (
    <div className="space-y-4">
      {data.map((r: any) => (
        <Panel key={r.id} className="flex flex-col gap-5 md:flex-row md:items-center">
          <ScoreRing value={r.match_score} label="match" size={96} />
          <div className="min-w-0 flex-1">
            <div className="text-xs text-muted-foreground">#{r.rank} · TF-IDF {r.tfidf_score}% · Skill overlap {r.overlap_score}%</div>
            <h3 className="text-lg font-semibold">{r.job?.job_title}</h3>
            <JobMeta job={r.job} />
            <div className="mt-3 flex flex-wrap gap-1.5">
              {r.matched_skills.map((s: string) => <SkillChip key={s} name={s} tone="have" />)}
              {r.missing_skills.map((s: string) => <SkillChip key={s} name={s} tone="missing" />)}
            </div>
          </div>
          <div className="flex gap-2 md:flex-col">
            <Button asChild><Link to="/jobs/$jobId" params={{ jobId: r.job_id }}>Details</Link></Button>
            <Button asChild variant="outline"><Link to="/skill-gap" search={{ jobId: r.job_id }}>View Skill Gap</Link></Button>
          </div>
        </Panel>
      ))}
    </div>
  );
}

function Explore() {
  const fn = useServerFn(listJobs);
  const [draft, setDraft] = useState<JobFilters>({});
  const [filters, setFilters] = useState<JobFilters>({ page: 0 });
  const { data, isLoading, error } = useQuery({ queryKey: ["jobs", filters], queryFn: () => fn({ data: filters }) });

  return (
    <>
      <form className="mb-5 grid gap-2 rounded-2xl border bg-card p-3 sm:grid-cols-2 lg:grid-cols-6" onSubmit={(e) => { e.preventDefault(); setFilters({ ...draft, page: 0 }); }}>
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input placeholder="Search title, company…" className="pl-9" value={draft.search ?? ""} onChange={(e) => setDraft({ ...draft, search: e.target.value })} />
        </div>
        <Input placeholder="City / location" value={draft.location ?? ""} onChange={(e) => setDraft({ ...draft, location: e.target.value })} />
        <Input placeholder="State" value={draft.state ?? ""} onChange={(e) => setDraft({ ...draft, state: e.target.value })} />
        <Input placeholder="Skill (e.g. Python)" value={draft.skill ?? ""} onChange={(e) => setDraft({ ...draft, skill: e.target.value })} />
        <div className="flex gap-2">
          <Input placeholder="Experience" value={draft.experience ?? ""} onChange={(e) => setDraft({ ...draft, experience: e.target.value })} />
          <Button type="submit">Go</Button>
        </div>
      </form>
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}</div>
      ) : error ? (
        <EmptyState icon={Database} title="Couldn't load jobs" body="Please try again in a moment." />
      ) : !data?.total ? (
        <EmptyState icon={Briefcase} title={Object.values(filters).some((v) => v) ? "No jobs match these filters" : "Job dataset pending"}
          body={Object.values(filters).some((v) => v) ? "Try a broader search." : "The Indian Job Market Dataset 2025–2026 hasn't been imported yet. Jobs will appear here once it is."} />
      ) : (
        <>
          <p className="mb-3 text-sm text-muted-foreground">{data.total} jobs</p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.jobs.map((j) => (
              <Link key={j.id} to="/jobs/$jobId" params={{ jobId: j.id }} className="rounded-2xl border bg-card p-5 shadow-soft transition hover:border-primary/50">
                <h3 className="font-semibold">{j.job_title}</h3>
                <JobMeta job={j} />
                <div className="mt-3 flex flex-wrap gap-1.5">{j.required_skills.slice(0, 5).map((s) => <SkillChip key={s} name={s} tone="neutral" />)}</div>
              </Link>
            ))}
          </div>
          <div className="mt-6 flex justify-center gap-2">
            <Button variant="outline" disabled={!filters.page} onClick={() => setFilters({ ...filters, page: (filters.page ?? 0) - 1 })}>Previous</Button>
            <Button variant="outline" disabled={((filters.page ?? 0) + 1) * data.pageSize >= data.total} onClick={() => setFilters({ ...filters, page: (filters.page ?? 0) + 1 })}>Next</Button>
          </div>
        </>
      )}
    </>
  );
}

export function JobMeta({ job }: { job: any }) {
  if (!job) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
      {job.company && <span className="flex items-center gap-1"><Briefcase className="size-3.5" />{job.company}</span>}
      <span className="flex items-center gap-1"><MapPin className="size-3.5" />{fmt(job.location ?? job.city)}</span>
      {job.salary && <span className="flex items-center gap-1"><IndianRupee className="size-3.5" />{job.salary}</span>}
      {job.experience && <span className="flex items-center gap-1"><Clock className="size-3.5" />{job.experience}</span>}
    </div>
  );
}
