import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export function Brand({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2 font-display text-lg font-bold ${className}`}>
      <span className="grid size-8 place-items-center rounded-lg bg-accent text-accent-foreground">
        <Sparkles className="size-4" />
      </span>
      SkillBridge<span className="text-accent">AI</span>
    </Link>
  );
}
