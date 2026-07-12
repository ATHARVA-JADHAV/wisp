"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, ArrowRight, Loader2, FolderOpen } from "lucide-react";
import { supabaseBrowser, supabaseConfigured } from "@/lib/supabase/client";
import DashboardShell from "@/components/DashboardShell";
import EnvNotice from "@/components/EnvNotice";
import type { Project } from "@/lib/types";

export default function DashboardPage() {
  if (!supabaseConfigured) return <EnvNotice />;
  return <DashboardInner />;
}

function DashboardInner() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = supabaseBrowser();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/login");
        return;
      }
      supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false })
        .then(({ data: rows }) => setProjects((rows as Project[]) ?? []));
    });
  }, [router]);

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError(null);
    const supabase = supabaseBrowser();
    const { data: auth } = await supabase.auth.getUser();
    const { data, error: err } = await supabase
      .from("projects")
      .insert({ name: name.trim(), owner: auth.user!.id })
      .select("*")
      .single();
    setCreating(false);
    if (err || !data) {
      setError(err?.message ?? "Could not create project");
      return;
    }
    router.push(`/dashboard/${data.id}`);
  }

  return (
    <DashboardShell>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-(family-name:--font-display) text-3xl font-bold tracking-tight">
            Your <span className="serif-it text-accent">projects</span>
          </h1>
          <p className="mt-1 text-sm text-muted">One project per site the widget lives on.</p>
        </div>
        <form onSubmit={createProject} className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New project name…"
            maxLength={60}
            className="w-52 rounded-xl border border-line bg-white px-4 py-2 text-sm shadow-sm outline-none transition placeholder:text-muted/60 focus:border-accent"
          />
          <button
            type="submit"
            disabled={creating || !name.trim()}
            className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-gradient-to-r from-accent to-accent-2 px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(124,92,255,.3)] transition hover:shadow-[0_4px_24px_rgba(124,92,255,.45)] disabled:opacity-50"
          >
            {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Create
          </button>
        </form>
      </div>
      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}

      {!projects ? (
        <div className="flex justify-center py-24">
          <Loader2 className="animate-spin text-muted" />
        </div>
      ) : projects.length === 0 ? (
        <div className="glass flex flex-col items-center rounded-3xl py-20 text-center">
          <FolderOpen className="mb-3 text-muted/50" size={36} />
          <p className="font-medium">No projects yet</p>
          <p className="mt-1 text-sm text-muted">Create one above — it takes a few seconds.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.45 }}
            >
              <Link
                href={`/dashboard/${p.id}`}
                className="glass group block rounded-2xl p-5 transition-colors hover:border-accent/40"
              >
                <div className="flex items-start justify-between">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white shadow-md"
                    style={{ background: `linear-gradient(135deg, ${p.accent_color}, #22d3ee)` }}
                  >
                    {p.name.slice(0, 1).toUpperCase()}
                  </span>
                  <ArrowRight
                    size={15}
                    className="text-muted/50 transition-all group-hover:translate-x-1 group-hover:text-accent"
                  />
                </div>
                <p className="mt-3 font-(family-name:--font-display) font-semibold">{p.name}</p>
                <p className="mt-0.5 font-(family-name:--font-mono) text-[11px] text-muted">
                  {p.public_key}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
