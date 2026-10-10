import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState, type DragEvent } from "react";
import { toast } from "sonner";
import { UploadCloud, FileText, Trash2, Eye, Loader2, CheckCircle2, XCircle, Sparkles, Circle } from "lucide-react";
import { getLatestResume, registerResume, analyzeResume, deleteResume, getResumeUrl } from "@/lib/api/resume.functions";
import { validateResumeFile } from "@/lib/resume/parser";
import { uploadResumeFile } from "@/lib/resume/upload";
import { PageHeader, Panel, SkillChip } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/resume")({
  head: () => ({ meta: [{ title: "Resume — SkillBridge AI" }, { name: "description", content: "Upload, analyze or delete your resume." }, { property: "og:title", content: "Resume — SkillBridge AI" }, { property: "og:description", content: "Upload, analyze or delete your resume." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: ResumePage,
});

const PIPELINE = ["Resume Upload", "Text Extraction", "Text Cleaning", "Skill Extraction", "TF-IDF Matching", "Skill Gap", "Roadmap"];

type Phase = { kind: "idle" } | { kind: "uploading"; pct: number } | { kind: "processing" } | { kind: "success"; skills: number; recs: number } | { kind: "error"; message: string };

function ResumePage() {
  const qc = useQueryClient();
  const latest = useServerFn(getLatestResume);
  const register = useServerFn(registerResume);
  const analyze = useServerFn(analyzeResume);
  const remove = useServerFn(deleteResume);
  const openUrl = useServerFn(getResumeUrl);
  const { data, isLoading } = useQuery({ queryKey: ["resume"], queryFn: () => latest() });
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const refresh = () => qc.invalidateQueries();

  async function runAnalysis(resumeId: string) {
    setPhase({ kind: "processing" });
    try {
      const r = await analyze({ data: { resumeId } });
      setPhase({ kind: "success", skills: r.skills.length, recs: r.recommendations });
      toast.success(r.skills.length ? `Found ${r.skills.length} skills in your resume` : "Resume analyzed — no known skills detected");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Analysis failed.";
      setPhase({ kind: "error", message });
      toast.error(message);
    } finally {
      refresh();
    }
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const v = validateResumeFile(file.name, file.type, file.size);
    if ("error" in v) {
      setPhase({ kind: "error", message: v.error });
      toast.error(v.error);
      return;
    }
    setPhase({ kind: "uploading", pct: 0 });
    try {
      const path = await uploadResumeFile(file, (pct) => setPhase({ kind: "uploading", pct }));
      const { id } = await register({ data: { filePath: path, fileName: file.name, fileSize: file.size, mimeType: file.type } });
      await refresh();
      await runAnalysis(id);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Upload failed.";
      setPhase({ kind: "error", message });
      toast.error(message);
    }
  }

  async function onDelete(id: string) {
    try {
      await remove({ data: { resumeId: id } });
      setPhase({ kind: "idle" });
      toast.success("Resume and its analysis were deleted");
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed.");
    }
  }

  async function onView(id: string) {
    try {
      const { url } = await openUrl({ data: { resumeId: id } });
      window.open(url, "_blank", "noopener");
    } catch {
      toast.error("Could not open the resume.");
    }
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    handleFile(e.dataTransfer.files[0]);
  };

  if (isLoading) return <Skeleton className="h-72 rounded-2xl" />;
  const resume = data?.resume;
  const busy = phase.kind === "uploading" || phase.kind === "processing";

  return (
    <>
      <PageHeader title="Your Resume" subtitle="PDF or DOCX, up to 5 MB. Only you can see your resume." />
      {!resume || phase.kind === "uploading" ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          onClick={() => !busy && input.current?.click()}
          className={`cursor-pointer rounded-3xl border-2 border-dashed p-10 text-center transition-colors ${drag ? "border-primary bg-secondary" : "border-border bg-card hover:border-primary/50"}`}
        >
          <input ref={input} type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden"
            onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ""; }} />
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-secondary text-secondary-foreground"><UploadCloud className="size-6" /></span>
          {phase.kind === "uploading" ? (
            <div className="mx-auto mt-5 max-w-sm">
              <p className="font-semibold">Uploading… {phase.pct}%</p>
              <Progress value={phase.pct} className="mt-3" />
            </div>
          ) : (
            <>
              <p className="mt-4 text-lg font-semibold">Drag & drop your resume here</p>
              <p className="text-sm text-muted-foreground">or click to browse · PDF / DOCX · max 5 MB</p>
            </>
          )}
          {phase.kind === "error" && (
            <p className="mx-auto mt-5 flex max-w-md items-center justify-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <XCircle className="size-4" /> {phase.message}
            </p>
          )}
        </div>
      ) : (
        <Panel>
          <div className="flex flex-wrap items-center gap-4">
            <span className="grid size-12 place-items-center rounded-xl bg-secondary text-secondary-foreground"><FileText className="size-5" /></span>
            <div className="min-w-0 flex-1">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Uploaded Resume</div>
              <div className="truncate font-semibold">{resume.file_name}</div>
              <div className="text-xs text-muted-foreground">{(resume.file_size / 1024).toFixed(0)} KB · {new Date(resume.created_at).toLocaleDateString("en-IN")}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => onView(resume.id)}><Eye className="mr-1.5 size-4" />View</Button>
              <Button onClick={() => runAnalysis(resume.id)} disabled={busy}>
                {phase.kind === "processing" ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Sparkles className="mr-1.5 size-4" />}
                Analyze Resume
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-destructive" disabled={busy}><Trash2 className="mr-1.5 size-4" />Delete Resume</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Resume?</AlertDialogTitle>
                    <AlertDialogDescription>This will permanently remove your uploaded resume and its extracted analysis.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => onDelete(resume.id)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <div className="mt-6 grid gap-2 sm:grid-cols-7">
            {PIPELINE.map((step, i) => {
              const done = phase.kind === "success" || (phase.kind !== "processing" && resume.status === "analyzed");
              const failed = phase.kind === "error" || (phase.kind === "idle" && resume.status === "error");
              const running = phase.kind === "processing" && i > 0;
              return (
                <div key={step} className="flex items-center gap-2 rounded-lg bg-muted px-2.5 py-2 text-xs sm:flex-col sm:text-center">
                  {i === 0 || done ? <CheckCircle2 className="size-4 text-success" /> : running ? <Loader2 className="size-4 animate-spin text-primary" /> : failed ? <XCircle className="size-4 text-destructive" /> : <Circle className="size-4 text-muted-foreground" />}
                  {step}
                </div>
              );
            })}
          </div>

          {phase.kind === "processing" && <p className="mt-4 text-sm text-muted-foreground">Processing your resume…</p>}
          {(phase.kind === "error" || (phase.kind === "idle" && resume.status === "error")) && (
            <p className="mt-4 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <XCircle className="size-4" />{phase.kind === "error" ? phase.message : resume.error}
            </p>
          )}
          {phase.kind === "success" && (
            <p className="mt-4 flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
              <CheckCircle2 className="size-4" /> Analysis complete — {phase.skills} skills detected, {phase.recs} job matches.
            </p>
          )}

          {resume.status === "analyzed" && (
            <div className="mt-6">
              <h3 className="font-semibold">Skills detected</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {data?.skills.length ? data?.skills.map((s) => <SkillChip key={s} name={s} tone="have" />) : (
                  <p className="text-sm text-muted-foreground">No known skills were detected. Make sure your resume lists your technical skills.</p>
                )}
              </div>
              <div className="mt-5 flex gap-2">
                <Button asChild variant="outline"><Link to="/jobs" search={{ tab: "recommended" }}>See job matches</Link></Button>
                <Button asChild variant="outline"><Link to="/skill-gap" search={{}}>See skill gap</Link></Button>
              </div>
            </div>
          )}
        </Panel>
      )}
    </>
  );
}
