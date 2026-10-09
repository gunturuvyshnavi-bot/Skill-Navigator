import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-2xl border bg-card p-5 shadow-soft", className)}>{children}</div>;
}

export function StatCard({ label, value, icon: Icon, hint }: { label: string; value: string; icon: LucideIcon; hint?: string }) {
  return (
    <Panel>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        {label}
        <span className="grid size-8 place-items-center rounded-lg bg-secondary text-secondary-foreground">
          <Icon className="size-4" />
        </span>
      </div>
      <div className="mt-3 font-display text-3xl font-bold">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </Panel>
  );
}

export function EmptyState({ icon: Icon, title, body, action }: { icon: LucideIcon; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed bg-card/60 px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-secondary text-secondary-foreground">
        <Icon className="size-5" />
      </span>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function SkillChip({ name, tone }: { name: string; tone: "have" | "partial" | "missing" | "neutral" }) {
  const styles = {
    have: "bg-success/12 text-success border-success/30",
    partial: "bg-warning/20 text-warning-foreground border-warning/50",
    missing: "bg-destructive/10 text-destructive border-destructive/30",
    neutral: "bg-secondary text-secondary-foreground border-transparent",
  }[tone];
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", styles)}>{name}</span>;
}

export function ScoreRing({ value, label, size = 120 }: { value: number; label?: string; size?: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" className="stroke-muted" strokeWidth="9" />
        <circle
          cx="50" cy="50" r={r} fill="none" strokeWidth="9" strokeLinecap="round"
          className="stroke-primary transition-all duration-700"
          strokeDasharray={c} strokeDashoffset={c - (v / 100) * c}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-display text-2xl font-bold">{Math.round(v)}%</div>
        {label && <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>}
      </div>
    </div>
  );
}

export const fmt = (v: string | null | undefined) => (v && v.trim() ? v : "Not Available");
