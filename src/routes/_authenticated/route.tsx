import { createFileRoute, redirect, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, FileText, Briefcase, Target, Route as RouteIcon, LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AppShell,
});

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/resume", label: "Resume", icon: FileText },
  { to: "/jobs", label: "Indian Jobs", icon: Briefcase },
  { to: "/skill-gap", label: "Skill Gap", icon: Target },
  { to: "/roadmap", label: "Roadmap", icon: RouteIcon },
] as const;

function AppShell() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const name = (user.user_metadata?.full_name as string | undefined) ?? user.email;

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const nav = (
    <nav className="flex flex-col gap-1">
      {NAV.map((n) => (
        <Link
          key={n.to}
          to={n.to}
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          activeProps={{ className: "bg-sidebar-accent !text-sidebar-primary font-semibold" }}
        >
          <n.icon className="size-4" />
          {n.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background md:grid md:grid-cols-[240px_1fr]">
      <aside className="hidden flex-col gap-8 bg-sidebar p-5 text-sidebar-foreground md:flex md:sticky md:top-0 md:h-screen">
        <Brand className="text-sidebar-foreground" />
        {nav}
        <div className="mt-auto border-t border-sidebar-border pt-4 text-sm">
          <div className="truncate font-medium">{name}</div>
          <button onClick={signOut} className="mt-2 flex items-center gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground">
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      </aside>
      <header className="flex items-center justify-between bg-sidebar px-4 py-3 text-sidebar-foreground md:hidden">
        <Brand className="text-sidebar-foreground" />
        <Button size="icon" variant="ghost" onClick={() => setOpen((o) => !o)} aria-label="Menu">
          <Menu className="size-5" />
        </Button>
      </header>
      {open && (
        <div className="space-y-3 bg-sidebar px-4 pb-4 md:hidden">
          {nav}
          <button onClick={signOut} className="flex items-center gap-2 px-3 text-sm text-sidebar-foreground/80">
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      )}
      <main className="mx-auto w-full max-w-6xl p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
