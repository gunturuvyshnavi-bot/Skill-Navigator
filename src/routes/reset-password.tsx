import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { passwordProblem } from "@/lib/auth/password";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — SkillBridge AI" },
      { name: "description", content: "Choose a new password for your SkillBridge AI account." },
      { property: "og:title", content: "Reset password — SkillBridge AI" },
      { property: "og:description", content: "Set a new password for your SkillBridge AI account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPasswordPage,
});

type Status = "checking" | "ready" | "invalid" | "done";

function readLinkError(): string | null {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const query = new URLSearchParams(window.location.search);
  const desc = params.get("error_description") ?? query.get("error_description");
  const code = params.get("error_code") ?? query.get("error_code");
  if (!desc && !code) return null;
  if (code === "otp_expired" || /expired/i.test(desc ?? "")) return "This reset link has expired or was already used. Please request a new one.";
  return (desc ?? "This reset link is not valid.").replace(/\+/g, " ");
}

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("checking");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const err = readLinkError();
    if (err) {
      setLinkError(err);
      setStatus("invalid");
      return;
    }
    let settled = false;
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (session && event === "SIGNED_IN")) {
        settled = true;
        setStatus("ready");
      }
    });
    supabase.auth.getSession().then(({ data: s }) => {
      if (s.session) { settled = true; setStatus("ready"); }
    });
    const t = setTimeout(() => {
      if (!settled) {
        setLinkError("This page needs the link from your password reset email. Please request a new one.");
        setStatus("invalid");
      }
    }, 4000);
    return () => { clearTimeout(t); data.subscription.unsubscribe(); };
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const problem = passwordProblem(pw, confirm);
    if (problem) return setError(problem);
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) {
      setError(/same/i.test(error.message) ? "Your new password must be different from the old one." : error.message);
      return;
    }
    setStatus("done");
    toast.success("Password updated. You're signed in.");
    setTimeout(() => navigate({ to: "/dashboard", replace: true }), 1200);
  }

  return (
    <div className="grid min-h-screen bg-background bg-hero place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center"><Brand /></div>
        <div className="rounded-3xl border bg-card p-7 shadow-soft">
          {status === "checking" && (
            <div className="flex flex-col items-center gap-3 py-6 text-sm text-muted-foreground">
              <Loader2 className="size-6 animate-spin" /> Verifying your reset link…
            </div>
          )}
          {status === "invalid" && (
            <div className="text-center">
              <AlertTriangle className="mx-auto size-10 text-destructive" />
              <h1 className="mt-3 text-2xl font-bold">Link not valid</h1>
              <p className="mt-2 text-sm text-muted-foreground">{linkError}</p>
              <Button asChild className="mt-6"><Link to="/auth" search={{ mode: "forgot" }}>Request a new link</Link></Button>
            </div>
          )}
          {status === "done" && (
            <div className="text-center">
              <CheckCircle2 className="mx-auto size-10 text-success" />
              <h1 className="mt-3 text-2xl font-bold">Password updated</h1>
              <p className="mt-2 text-sm text-muted-foreground">Taking you to your dashboard…</p>
            </div>
          )}
          {status === "ready" && (
            <>
              <h1 className="text-center text-2xl font-bold">Set a new password</h1>
              <p className="mt-2 text-center text-sm text-muted-foreground">At least 8 characters with letters and numbers.</p>
              <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
                <div className="space-y-1.5">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input id="confirm-password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                </div>
                {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy && <Loader2 className="mr-2 size-4 animate-spin" />}Update Password
                </Button>
              </form>
            </>
          )}
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground"><Link to="/auth">← Back to login</Link></p>
      </div>
    </div>
  );
}
