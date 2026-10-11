import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { normalizeEmail, passwordProblem } from "@/lib/auth/password";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { mode?: "signup" | "forgot" } =>
    s["mode"] === "signup" || s["mode"] === "forgot" ? { mode: s["mode"] } : {},
  head: () => ({
    meta: [
      { title: "Login or Sign up — SkillBridge AI" },
      { name: "description", content: "Sign in to SkillBridge AI to analyze your resume against Indian jobs." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "Login — SkillBridge AI" },
      { property: "og:description", content: "Sign in or create your SkillBridge AI account." },
    ],
  }),
  component: AuthPage,
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function friendly(msg: string) {
  if (/invalid login/i.test(msg)) return "Wrong email or password. If you usually use Google, or forgot your password, use \"Forgot password?\" to set one.";
  if (/not confirmed/i.test(msg)) return "Please confirm your email first — check your inbox.";
  if (/already registered/i.test(msg)) return "An account with this email already exists.";
  if (/rate limit|too many/i.test(msg)) return "Too many attempts. Please wait a few minutes and try again.";
  return msg;
}

type Mode = "login" | "signup" | "forgot";

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setModeRaw] = useState<Mode>(search.mode ?? "login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<null | "signup" | "reset">(null);
  const [f, setF] = useState({ name: "", email: "", password: "", confirm: "" });
  const setMode = (m: Mode) => { setError(null); setModeRaw(m); };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const email = normalizeEmail(f.email);
    if (!EMAIL_RE.test(email)) return setError("Please enter a valid email address.");
    if (mode === "signup") {
      if (!f.name.trim()) return setError("Please enter your full name.");
      const problem = passwordProblem(f.password, f.confirm);
      if (problem) return setError(problem);
    }
    if (mode === "login" && !f.password) return setError("Please enter your password.");
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: f.password });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password: f.password,
          options: { emailRedirectTo: window.location.origin + "/auth", data: { full_name: f.name.trim() } },
        });
        if (error) throw error;
        setSent("signup");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (error) throw error;
        setSent("reset");
      }
    } catch (err) {
      setError(friendly(err instanceof Error ? err.message : "Something went wrong."));
    } finally {
      setBusy(false);
    }
  }

  // Google sign-in is brokered by Lovable's hosting layer (/~oauth/*), which only
  // exists on the Lovable preview/published URL — not on a local `npm run dev`.
  const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

  async function google() {
    if (isLocal) {
      toast.error("Google sign-in only works on the published app. Use email and password when running locally.");
      return;
    }
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (res.error) { toast.error("Google sign-in failed. Please try again."); return; }
    if (res.redirected) return;
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="grid min-h-screen bg-background bg-hero place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center"><Brand /></div>
        <div className="rounded-3xl border bg-card p-7 shadow-soft">
          {sent ? (
            <div className="text-center">
              <h1 className="text-2xl font-bold">Check your email</h1>
              {sent === "signup" ? (
                <p className="mt-2 text-sm text-muted-foreground">We sent a confirmation link to <b>{f.email.trim()}</b>. Click it to activate your account.</p>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">If an account exists for <b>{f.email.trim()}</b>, we sent a password reset link. Open it on this device to choose a new password. Check your spam folder if it doesn't arrive within a few minutes.</p>
              )}
              <Button className="mt-6" variant="outline" onClick={() => { setSent(null); setMode("login"); }}>Back to login</Button>
            </div>
          ) : mode === "forgot" ? (
            <>
              <h1 className="text-center text-2xl font-bold">Forgot Password</h1>
              <p className="mt-2 text-center text-sm text-muted-foreground">Enter your account email and we'll send you a link to set a new password.</p>
              <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
                <Field label="Email" id="email" type="email" value={f.email} onChange={(v) => setF({ ...f, email: v })} />
                {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy && <Loader2 className="mr-2 size-4 animate-spin" />}Send Reset Link
                </Button>
              </form>
              <p className="mt-5 text-center text-sm text-muted-foreground">
                Remembered it?{" "}
                <button className="font-semibold text-primary hover:underline" onClick={() => setMode("login")}>Back to login</button>
              </p>
            </>
          ) : (
            <>
              <h1 className="text-center text-2xl font-bold">{mode === "login" ? "Welcome Back" : "Create Account"}</h1>
              <Button type="button" variant="outline" className="mt-6 w-full" onClick={google}>
                <svg viewBox="0 0 24 24" className="mr-2 size-4" aria-hidden><path fill="currentColor" d="M21.35 11.1H12v2.98h5.35c-.23 1.4-1.66 4.1-5.35 4.1-3.22 0-5.85-2.67-5.85-5.96S8.78 6.26 12 6.26c1.83 0 3.06.78 3.76 1.45l2.57-2.47C16.68 3.7 14.55 2.75 12 2.75 6.9 2.75 2.75 6.9 2.75 12S6.9 21.25 12 21.25c5.34 0 8.88-3.75 8.88-9.04 0-.6-.07-1.06-.15-1.51Z"/></svg>
                Continue with Google
              </Button>
              {isLocal && (
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Google sign-in works on the published app only — use email and password on localhost.
                </p>
              )}
              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />OR<span className="h-px flex-1 bg-border" /></div>
              <form onSubmit={submit} className="space-y-4" noValidate>
                {mode === "signup" && (
                  <Field label="Full Name" id="name" value={f.name} onChange={(v) => setF({ ...f, name: v })} />
                )}
                <Field label="Email" id="email" type="email" value={f.email} onChange={(v) => setF({ ...f, email: v })} />
                <Field label="Password" id="password" type="password" value={f.password} onChange={(v) => setF({ ...f, password: v })} />
                {mode === "login" && (
                  <div className="-mt-2 text-right">
                    <button type="button" className="text-xs font-medium text-primary hover:underline" onClick={() => setMode("forgot")}>
                      Forgot password?
                    </button>
                  </div>
                )}
                {mode === "signup" && (
                  <Field label="Confirm Password" id="confirm" type="password" value={f.confirm} onChange={(v) => setF({ ...f, confirm: v })} />
                )}
                {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
                  {mode === "login" ? "Login" : "Create Account"}
                </Button>
              </form>
              <p className="mt-5 text-center text-sm text-muted-foreground">
                {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                <button className="font-semibold text-primary hover:underline" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
                  {mode === "login" ? "Create Account" : "Login"}
                </button>
              </p>
            </>
          )}
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground"><Link to="/">← Back to home</Link></p>
      </div>
    </div>
  );
}

function Field({ label, id, type = "text", value, onChange }: { label: string; id: string; type?: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={type === "password" ? "current-password" : id} />
    </div>
  );
}
