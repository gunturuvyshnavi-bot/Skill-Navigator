import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Route as RouteIcon, CheckCircle2, Circle, ExternalLink, Hammer, MessagesSquare, BookOpen } from "lucide-react";
import { getRoadmap, setRoadmapItem } from "@/lib/api/insights.functions";
import { PageHeader, Panel, EmptyState } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/roadmap")({
  head: () => ({ meta: [{ title: "Learning Roadmap — SkillBridge AI" }, { name: "description", content: "Your personalized step-by-step learning roadmap." }, { property: "og:title", content: "Learning Roadmap — SkillBridge AI" }, { property: "og:description", content: "Your personalized step-by-step learning roadmap." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: RoadmapPage,
});

function RoadmapPage() {
  const fn = useServerFn(getRoadmap);
  const toggle = useServerFn(setRoadmapItem);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["roadmap"], queryFn: () => fn() });

  if (isLoading) return <Skeleton className="h-96 rounded-2xl" />;
  if (!data?.roadmap)
    return <EmptyState icon={RouteIcon} title="No roadmap yet" body="A roadmap is generated from the missing skills of your best job match after your resume is analyzed."
      action={<Button asChild><Link to="/resume">Go to resume</Link></Button>} />;

  const { roadmap, resources } = data;
  const general = resources.filter((r) => r.skill === "General");

  async function mark(id: string, completed: boolean) {
    try {
      await toggle({ data: { itemId: id, completed } });
      qc.invalidateQueries({ queryKey: ["roadmap"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    } catch {
      toast.error("Could not update this step.");
    }
  }

  return (
    <>
      <PageHeader title="Learning Roadmap" subtitle={`Target role: ${roadmap.target_role}`} />
      <Panel className="mb-6">
        <div className="flex items-center justify-between text-sm"><span className="font-semibold">Roadmap Progress</span><span className="font-display text-xl font-bold">{roadmap.progress}%</span></div>
        <Progress value={roadmap.progress} className="mt-3 h-3" />
      </Panel>
      <ol className="relative space-y-4 border-l-2 border-dashed border-border pl-6">
        {roadmap.roadmap_items.map((item) => {
          const res = item.skill ? resources.filter((r) => r.skill === item.skill) : [];
          const shown = res.length ? res : item.kind === "skill" ? general : [];
          const Icon = item.kind === "project" ? Hammer : item.kind === "interview" ? MessagesSquare : BookOpen;
          return (
            <li key={item.id} className="relative">
              <span className={`absolute -left-[37px] top-5 grid size-6 place-items-center rounded-full ${item.completed ? "bg-success text-success-foreground" : "bg-card border"}`}>
                {item.completed ? <CheckCircle2 className="size-4" /> : <Circle className="size-3 text-muted-foreground" />}
              </span>
              <Panel className={item.completed ? "opacity-70" : ""}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-secondary text-secondary-foreground"><Icon className="size-5" /></span>
                    <div>
                      <div className="text-xs text-muted-foreground">Step {item.step}{item.level ? ` · ${item.level}` : ""}</div>
                      <div className={`font-semibold ${item.completed ? "line-through" : ""}`}>{item.title}</div>
                    </div>
                  </div>
                  <Button size="sm" variant={item.completed ? "outline" : "default"} onClick={() => mark(item.id, !item.completed)}>
                    {item.completed ? "Mark Incomplete" : "Mark Complete"}
                  </Button>
                </div>
                {shown.length > 0 && (
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {shown.map((r) => (
                      <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted px-3 py-2.5">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{r.resource_name}</div>
                          <div className="truncate text-xs text-muted-foreground">{r.description}</div>
                        </div>
                        <Button asChild size="sm" variant="outline">
                          <a href={r.resource_url} target="_blank" rel="noopener noreferrer">Learn Now <ExternalLink className="ml-1 size-3" /></a>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
            </li>
          );
        })}
      </ol>
    </>
  );
}
