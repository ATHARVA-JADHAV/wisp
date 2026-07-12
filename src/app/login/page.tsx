"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";
import { supabaseBrowser, supabaseConfigured } from "@/lib/supabase/client";
import EnvNotice from "@/components/EnvNotice";

export default function LoginPage() {
  if (!supabaseConfigured) return <EnvNotice />;
  return <LoginInner />;
}

function LoginInner() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: "error" | "info"; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    const supabase = supabaseBrowser();
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!data.session) {
          setNotice({ kind: "info", text: "Check your email to confirm your account, then sign in." });
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      router.push("/dashboard");
    } catch (err) {
      setNotice({ kind: "error", text: err instanceof Error ? err.message : "Something went wrong" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center px-5">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/3 h-[420px] w-[420px] rounded-full bg-accent/12 blur-[130px]" />
        <div className="absolute -right-24 bottom-0 h-[360px] w-[360px] rounded-full bg-accent-2/10 blur-[120px]" />
        <div className="dotgrid absolute inset-0" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="glass w-full max-w-sm rounded-3xl p-8"
      >
        <Link href="/" className="mb-8 flex items-center justify-center gap-2 font-(family-name:--font-display) text-xl font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-fg">
            <Sparkles size={15} className="text-white" />
          </span>
          wisp
        </Link>

        <div className="mb-6 flex rounded-full border border-line bg-black/[0.03] p-1 text-sm">
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 cursor-pointer rounded-full py-1.5 font-medium transition ${
                mode === m ? "bg-white text-fg shadow-sm" : "text-muted hover:text-fg"
              }`}
            >
              {m === "signin" ? "Sign in" : "Sign up"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm outline-none transition placeholder:text-muted/60 focus:border-accent"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (6+ characters)"
            className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm outline-none transition placeholder:text-muted/60 focus:border-accent"
          />
          {notice && (
            <p
              className={`rounded-lg px-3 py-2 text-xs ${
                notice.kind === "error" ? "bg-red-50 text-red-600" : "bg-cyan-50 text-cyan-700"
              }`}
            >
              {notice.text}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent to-accent-2 py-2.5 text-sm font-semibold text-white shadow-[0_6px_24px_rgba(124,92,255,.35)] transition hover:shadow-[0_6px_32px_rgba(124,92,255,.5)] disabled:opacity-60"
          >
            {busy && <Loader2 size={14} className="animate-spin" />}
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted">
          Free while in beta · no card needed
        </p>
      </motion.div>
    </div>
  );
}
