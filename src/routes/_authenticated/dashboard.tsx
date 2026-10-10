import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Gauge, Brain, Briefcase, Target, Route as RouteIcon, Upload, Database } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getDashboard } from "@/lib/api/insights.functions";
import { PageHeader, StatCard, Panel, EmptyState, SkillChip } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — SkillBridge AI" }, { name: "description", content: "Your career readiness at a glance." }, { property: "og:title", content: "Dashboard — SkillBridge AI" }, { property: "og:description", content: "Your career readiness at a glance." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Dashboard,
});

function Dashboard() {
  const fn = useServerFn(getDashboard);
  const { data, isLoading, error } = useQuery({ queryKey: ["dashboard"], queryFn: () => fn() });

  if (isLoading) return <div className="grid gap-4 md:grid-cols-5">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>;
  if (error || !data) return <EmptyState icon={Database} title="Couldn't load your dashboard" body="Please check your connection and refresh." />;

  if (!data.hasResume)
    return (
      <>
        <PageHeader title="Your Career Dashboard" subtitle="Upload a resume to see your readiness for Indian jobs." />
        <EmptyState icon={Upload} title="No resume yet" body="Upload a PDF or DOCX resume and we'll detect your skills and match you to jobs."
          action={<Button asChild><Link to="/resume">Upload resume</Link></Button>} />
      </>
    );

  const pct = (v: number | null) => (v == null ? "—" : `${Math.round(v)}%`);
  const chart = data.recommendations.map((r: any) => ({ name: r.job?.job_title?.slice(0, 18) ?? "Job", score: r.match_score }));

  return (
    <>
      <PageHeader title="Your Career Dashboard" subtitle={data.targetRole ? `Target role: ${data.targetRole}` : "Based on your latest resume"} />
      {data.jobCount === 0 && (
        <div className="mb-6 rounded-xl border border-warning/50 bg-warning/15 px-4 py-3 text-sm text-warning-foreground">
          The Indian Job Market Dataset hasn't been loaded yet, so job matches, skill gaps and roadmaps will appear once it's imported.
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Career Readiness" value={pct(data.readiness)} icon={Gauge} hint="For your top match" />
        <StatCard label="Skills Detected" value={String(data.skills.length)} icon={Brain} />
        <StatCard label="Matching Jobs" value={String(data.recommendations.length)} icon={Briefcase} />
        <StatCard label="Skill Gaps" value={data.skillGaps == null ? "—" : String(data.skillGaps)} icon={Target} hint="Missing for top match" />
        <StatCard label="Roadmap Progress" value={pct(data.roadmapProgress)} icon={RouteIcon} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel>
          <h2 className="font-semibold">Top job matches</h2>
          {chart.length ? (
            <div className="mt-4 h-64">
              <ResponsiveContainer>
                <BarChart data={chart} layout="vertical" margin={{ left: 10 }}>
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Bar dataKey="score" fill="var(--color-primary)" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No matches yet.</p>
          )}
          {chart.length > 0 && <Button asChild variant="link" className="px-0"><Link to="/jobs" search={{ tab: "recommended" }}>View recommendations →</Link></Button>}
        </Panel>
        <Panel>
          <h2 className="font-semibold">Skills detected</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {data.skills.length ? data.skills.map((s: string) => <SkillChip key={s} name={s} tone="have" />) : <p className="text-sm text-muted-foreground">No skills detected yet.</p>}
          </div>
        </Panel>
      </div>
    </>
  );
}
