"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, KeyRound, Database, ArrowLeft } from "lucide-react";

// Shown instead of auth/dashboard when Supabase env vars aren't set yet.
export default function EnvNotice() {
  return (
    <div className="relative flex min-h-dvh items-center justify-center px-5">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/3 h-[420px] w-[420px] rounded-full bg-accent/12 blur-[130px]" />
        <div className="dotgrid absolute inset-0" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass w-full max-w-md rounded-3xl p-8"
      >
        <span className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-fg">
          <Sparkles size={17} className="text-white" />
        </span>
        <h1 className="font-(family-name:--font-display) text-2xl font-bold tracking-tight">
          Almost there — <span className="serif-it text-accent">connect the backend</span>
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          The dashboard needs Supabase before it can sign you in. Two minutes of setup:
        </p>
        <ol className="mt-5 space-y-3 text-sm">
          <li className="flex gap-3">
            <Database size={15} className="mt-0.5 shrink-0 text-accent" />
            <span>
              Create a free project at <strong>supabase.com</strong>, then run{" "}
              <code className="rounded bg-black/5 px-1.5 py-0.5 font-(family-name:--font-mono) text-[11px]">
                supabase/schema.sql
              </code>{" "}
              in its SQL Editor
            </span>
          </li>
          <li className="flex gap-3">
            <KeyRound size={15} className="mt-0.5 shrink-0 text-accent" />
            <span>
              Copy the project URL + keys into{" "}
              <code className="rounded bg-black/5 px-1.5 py-0.5 font-(family-name:--font-mono) text-[11px]">
                .env.local
              </code>{" "}
              (template in <code className="rounded bg-black/5 px-1.5 py-0.5 font-(family-name:--font-mono) text-[11px]">.env.example</code>), then restart{" "}
              <code className="rounded bg-black/5 px-1.5 py-0.5 font-(family-name:--font-mono) text-[11px]">
                npm run dev
              </code>
            </span>
          </li>
        </ol>
        <Link
          href="/"
          className="mt-7 inline-flex items-center gap-1.5 text-sm font-medium text-fg underline decoration-accent/50 decoration-2 underline-offset-4 transition hover:decoration-accent"
        >
          <ArrowLeft size={13} /> Back to the landing page
        </Link>
      </motion.div>
    </div>
  );
}
