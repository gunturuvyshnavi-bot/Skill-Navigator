import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Brain, Briefcase, Percent, Target, Route as RouteIcon, ArrowRight, ArrowDown } from "lucide-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SkillBridge AI — Turn Your Resume Into Your Career Roadmap" },
      { name: "description", content: "Analyze your resume, discover suitable Indian jobs, identify skill gaps and build a personalized learning path." },
      { property: "og:title", content: "SkillBridge AI — Indian Resume-Based Job Recommendations" },
      { property: "og:description", content: "Resume → skills → Indian jobs → match score → skill gap → learning roadmap." },
    ],
  }),
  component: Landing,
});

const FLOW = [
  { icon: FileText, label: "Resume", body: "Upload PDF or DOCX" },
  { icon: Brain, label: "Skills", body: "Auto-detected from text" },
  { icon: Briefcase, label: "Indian Jobs", body: "Matched against Indian postings" },
  { icon: Percent, label: "Job Match", body: "TF-IDF + skill overlap" },
  { icon: Target, label: "Skill Gap", body: "What you have vs. need" },
  { icon: RouteIcon, label: "Learning Roadmap", body: "Step-by-step plan" },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background bg-hero">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Brand />
        <div className="flex gap-2">
          <Button asChild variant="ghost"><Link to="/auth">Login</Link></Button>
          <Button asChild><Link to="/auth" search={{ mode: "signup" }}>Create account</Link></Button>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-10 md:grid-cols-[1.2fr_1fr] md:pt-20">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            Built for the Indian job market 🇮🇳
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-[1.05] md:text-6xl">
            Turn Your Resume Into Your <span className="text-primary">Career Roadmap</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Analyze your resume, discover suitable Indian jobs, identify your skill gaps, and build a personalized learning path.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg"><Link to="/resume">Analyze My Resume <ArrowRight className="ml-1 size-4" /></Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/jobs">Explore Indian Jobs</Link></Button>
          </div>
        </div>

        <div className="rounded-3xl border bg-card/80 p-5 shadow-soft backdrop-blur">
          {FLOW.map((f, i) => (
            <div key={f.label}>
              <div className="flex items-center gap-4 rounded-xl px-3 py-2.5">
                <span className={`grid size-10 place-items-center rounded-xl ${i === FLOW.length - 1 ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground"}`}>
                  <f.icon className="size-5" />
                </span>
                <div>
                  <div className="font-semibold">{f.label}</div>
                  <div className="text-xs text-muted-foreground">{f.body}</div>
                </div>
              </div>
              {i < FLOW.length - 1 && <ArrowDown className="ml-8 size-3.5 text-muted-foreground/60" />}
            </div>
          ))}
        </div>
      </section>

      <section className="border-t bg-card/60">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 py-14 md:grid-cols-3">
          {[
            ["TF-IDF matching", "Your resume and each job description become term-importance vectors; cosine similarity measures how close they are."],
            ["Weighted score", "Final match = 0.6 × text similarity + 0.4 × share of required skills you already have."],
            ["Honest results", "Skills are only marked as yours when found in your resume. Nothing is hardcoded."],
          ].map(([t, b]) => (
            <div key={t}>
              <h3 className="text-lg font-semibold">{t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{b}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
