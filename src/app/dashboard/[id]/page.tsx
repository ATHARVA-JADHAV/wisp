"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Globe,
  FileText,
  Trash2,
  Copy,
  Check,
  MessageSquareText,
  HelpCircle,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { supabaseBrowser, supabaseConfigured } from "@/lib/supabase/client";
import DashboardShell from "@/components/DashboardShell";
import EnvNotice from "@/components/EnvNotice";
import type { Project, Source, Message } from "@/lib/types";

type Tab = "overview" | "sources" | "conversations" | "unanswered" | "widget";
type ConvRow = { id: string; created_at: string; visitor_id: string | null; messages: Message[] };

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "sources", label: "Sources" },
  { id: "conversations", label: "Conversations" },
  { id: "unanswered", label: "Unanswered" },
  { id: "widget", label: "Widget" },
];

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  if (!supabaseConfigured) return <EnvNotice />;
  return <ProjectInner params={params} />;
}

function ProjectInner({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [project, setProject] = useState<Project | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [convs, setConvs] = useState<ConvRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = supabaseBrowser();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      router.replace("/login");
      return;
    }
    const [{ data: proj }, { data: srcs }, { data: conversations }] = await Promise.all([
      supabase.from("projects").select("*").eq("id", id).single(),
      supabase.from("sources").select("*").eq("project_id", id).order("created_at", { ascending: false }),
      supabase
        .from("conversations")
        .select("id, created_at, visitor_id")
        .eq("project_id", id)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    if (!proj) {
      router.replace("/dashboard");
      return;
    }
    setProject(proj as Project);
    setSources((srcs as Source[]) ?? []);

    const convIds = (conversations ?? []).map((c) => c.id);
    let messages: Message[] = [];
    if (convIds.length) {
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .in("conversation_id", convIds)
        .order("created_at", { ascending: true });
      messages = (msgs as Message[]) ?? [];
    }
    setConvs(
      (conversations ?? []).map((c) => ({
        ...c,
        messages: messages.filter((m) => m.conversation_id === c.id),
      }))
    );
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const allMsgs = convs.flatMap((c) => c.messages);
    const answered = allMsgs.filter((m) => m.role === "assistant");
    const grounded = answered.filter((m) => m.grounded);
    return {
      conversations: convs.filter((c) => c.messages.length > 0).length,
      questions: allMsgs.filter((m) => m.role === "user").length,
      answerRate: answered.length ? Math.round((grounded.length / answered.length) * 100) : null,
      chunks: sources.reduce((s, x) => s + x.chunk_count, 0),
    };
  }, [convs, sources]);

  const unanswered = useMemo(() => {
    const out: { question: string; when: string }[] = [];
    for (const c of convs) {
      c.messages.forEach((m, i) => {
        if (m.role === "assistant" && !m.grounded) {
          const q = [...c.messages.slice(0, i)].reverse().find((x) => x.role === "user");
          if (q) out.push({ question: q.content, when: m.created_at });
        }
      });
    }
    return out.sort((a, b) => +new Date(b.when) - +new Date(a.when));
  }, [convs]);

  if (loading || !project) {
    return (
      <DashboardShell>
        <div className="flex justify-center py-32">
          <Loader2 className="animate-spin text-muted" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <Link
        href="/dashboard"
        className="mb-5 inline-flex items-center gap-1.5 text-xs text-muted transition hover:text-fg"
      >
        <ArrowLeft size={12} /> All projects
      </Link>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-md"
            style={{ background: `linear-gradient(135deg, ${project.accent_color}, #22d3ee)` }}
          >
            {project.name.slice(0, 1).toUpperCase()}
          </span>
          <div>
            <h1 className="font-(family-name:--font-display) text-2xl font-bold">{project.name}</h1>
            <p className="font-(family-name:--font-mono) text-[11px] text-muted">{project.public_key}</p>
          </div>
        </div>
        <a
          href={`/embed/${project.public_key}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-1.5 text-xs font-medium shadow-sm transition hover:border-accent/50"
        >
          Preview chat <ExternalLink size={11} />
        </a>
      </div>

      {/* tabs */}
      <div className="mb-8 flex gap-1 overflow-x-auto rounded-full border border-line bg-black/[0.03] p-1 sm:w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative cursor-pointer rounded-full px-4 py-1.5 text-sm whitespace-nowrap transition ${
              tab === t.id ? "font-semibold text-fg" : "text-muted hover:text-fg"
            }`}
          >
            {tab === t.id && (
              <motion.span
                layoutId="tab-pill"
                className="absolute inset-0 rounded-full bg-white shadow-sm"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative">
              {t.label}
              {t.id === "unanswered" && unanswered.length > 0 && (
                <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                  {unanswered.length}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
        >
          {tab === "overview" && (
            <Overview stats={stats} convs={convs} unansweredCount={unanswered.length} goTo={setTab} />
          )}
          {tab === "sources" && (
            <SourcesTab projectId={project.id} sources={sources} refresh={load} />
          )}
          {tab === "conversations" && <ConversationsTab convs={convs} />}
          {tab === "unanswered" && <UnansweredTab items={unanswered} />}
          {tab === "widget" && <WidgetTab project={project} onSaved={load} />}
        </motion.div>
      </AnimatePresence>
    </DashboardShell>
  );
}

/* ── Overview ──────────────────────────────────────────────────────────────── */

function Overview({
  stats,
  convs,
  unansweredCount,
  goTo,
}: {
  stats: { conversations: number; questions: number; answerRate: number | null; chunks: number };
  convs: ConvRow[];
  unansweredCount: number;
  goTo: (t: Tab) => void;
}) {
  const tiles = [
    { label: "Conversations", value: String(stats.conversations) },
    { label: "Questions asked", value: String(stats.questions) },
    { label: "Answer rate", value: stats.answerRate === null ? "—" : `${stats.answerRate}%` },
    { label: "Chunks indexed", value: String(stats.chunks) },
  ];
  const recent = convs.filter((c) => c.messages.length > 0).slice(0, 5);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((t, i) => (
          <motion.div
            key={t.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="glass rounded-2xl p-5"
          >
            <p className="text-xs text-muted">{t.label}</p>
            <p className="mt-1 font-(family-name:--font-display) text-3xl font-bold">{t.value}</p>
          </motion.div>
        ))}
      </div>

      {unansweredCount > 0 && (
        <button
          onClick={() => goTo("unanswered")}
          className="glass flex w-full cursor-pointer items-center gap-3 rounded-2xl border-amber-200/60 p-4 text-left transition hover:border-amber-300"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <HelpCircle size={16} />
          </span>
          <span className="text-sm">
            <strong>{unansweredCount}</strong>{" "}
            {unansweredCount > 1 ? "questions" : "question"} your bot couldn&apos;t answer — see
            what docs to write →
          </span>
        </button>
      )}

      <div className="glass rounded-2xl p-5">
        <p className="mb-3 text-sm font-semibold">Recent conversations</p>
        {recent.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">
            No conversations yet — install the widget and they&apos;ll appear here.
          </p>
        ) : (
          <div className="space-y-2">
            {recent.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-xl bg-black/[0.03] px-3 py-2.5">
                <MessageSquareText size={14} className="shrink-0 text-accent" />
                <p className="flex-1 truncate text-sm">
                  {c.messages.find((m) => m.role === "user")?.content ?? "—"}
                </p>
                <span className="shrink-0 text-[11px] text-muted">
                  {new Date(c.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Sources ───────────────────────────────────────────────────────────────── */

function SourcesTab({
  projectId,
  sources,
  refresh,
}: {
  projectId: string;
  sources: Source[];
  refresh: () => Promise<void>;
}) {
  const [mode, setMode] = useState<"url" | "text">("url");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [found, setFound] = useState<string[] | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());

  async function ingest(payload: Record<string, unknown>): Promise<boolean> {
    const res = await fetch("/api/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, ...payload }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.error ?? "Indexing failed");
      return false;
    }
    return true;
  }

  async function addSingle(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy("single");
    if (mode === "url") await ingest({ type: "url", url });
    else await ingest({ type: "text", text, title: title || "Pasted text" });
    setUrl("");
    setText("");
    setTitle("");
    setBusy(null);
    await refresh();
  }

  async function discover() {
    setError(null);
    setBusy("discover");
    setFound(null);
    const res = await fetch("/api/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, type: "url", url, discover: true }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) {
      setError(json.error ?? "Could not fetch that page");
      return;
    }
    // dedupe: the typed URL usually also appears in the page's own links,
    // and trailing-slash variants would double up too
    const normalize = (l: string) => l.replace(/\/+$/, "");
    const links = Array.from(new Set([url, ...(json.links ?? [])].map(normalize))).slice(0, 15);
    setFound(links);
    setPicked(new Set(links.slice(0, 10)));
  }

  async function indexPicked() {
    setBusy("batch");
    setError(null);
    for (const link of Array.from(picked)) {
      await ingest({ type: "url", url: link });
      await refresh();
    }
    setFound(null);
    setBusy(null);
  }

  async function remove(sourceId: string) {
    await fetch("/api/sources", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceId }),
    });
    await refresh();
  }

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-5">
        <p className="text-sm font-semibold">Add knowledge</p>
        <p className="mt-0.5 mb-4 text-xs text-muted">
          The bot can only answer from what you index here — index a page from your site, or
          paste raw text (FAQ, policies, docs).
        </p>
        <div className="mb-4 flex w-fit rounded-full border border-line bg-black/[0.03] p-1 text-xs">
          {(["url", "text"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`cursor-pointer rounded-full px-4 py-1.5 font-medium transition ${
                mode === m ? "bg-white shadow-sm" : "text-muted hover:text-fg"
              }`}
            >
              {m === "url" ? "From URL" : "Paste text"}
            </button>
          ))}
        </div>

        <form onSubmit={addSingle} className="space-y-3">
          {mode === "url" ? (
            <div className="flex flex-wrap gap-2">
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://yoursite.com/docs"
                className="min-w-60 flex-1 rounded-xl border border-line bg-white px-4 py-2.5 text-sm outline-none transition placeholder:text-muted/60 focus:border-accent"
              />
              <button
                type="submit"
                disabled={!!busy || !url}
                className="cursor-pointer rounded-xl bg-gradient-to-r from-accent to-accent-2 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition disabled:opacity-50"
              >
                {busy === "single" ? <Loader2 size={14} className="animate-spin" /> : "Index page"}
              </button>
              <button
                type="button"
                onClick={discover}
                disabled={!!busy || !url}
                className="cursor-pointer rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-medium shadow-sm transition hover:border-accent/50 disabled:opacity-50"
              >
                {busy === "discover" ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  "Find pages to crawl"
                )}
              </button>
            </div>
          ) : (
            <>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title (e.g. FAQ)"
                className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm outline-none transition placeholder:text-muted/60 focus:border-accent"
              />
              <textarea
                required
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your docs, FAQ, or any content the bot should know…"
                rows={6}
                className="w-full resize-y rounded-xl border border-line bg-white px-4 py-2.5 text-sm outline-none transition placeholder:text-muted/60 focus:border-accent"
              />
              <button
                type="submit"
                disabled={!!busy || text.trim().length < 40}
                className="cursor-pointer rounded-xl bg-gradient-to-r from-accent to-accent-2 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition disabled:opacity-50"
              >
                {busy === "single" ? <Loader2 size={14} className="animate-spin" /> : "Index text"}
              </button>
            </>
          )}
        </form>

        {found && (
          <div className="mt-4 rounded-xl border border-line bg-black/[0.02] p-4">
            <p className="mb-2 text-xs font-semibold">
              Found {found.length} page{found.length > 1 ? "s" : ""} — pick what to index:
            </p>
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {found.map((l) => (
                <label key={l} className="flex cursor-pointer items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={picked.has(l)}
                    onChange={(e) => {
                      const next = new Set(picked);
                      if (e.target.checked) next.add(l);
                      else next.delete(l);
                      setPicked(next);
                    }}
                    className="accent-[#7c5cff]"
                  />
                  <span className="truncate font-(family-name:--font-mono) text-muted">{l}</span>
                </label>
              ))}
            </div>
            <button
              onClick={indexPicked}
              disabled={busy === "batch" || picked.size === 0}
              className="mt-3 flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-accent-2 px-4 py-2 text-xs font-semibold text-white shadow-sm transition disabled:opacity-50"
            >
              {busy === "batch" && <Loader2 size={12} className="animate-spin" />}
              Index {picked.size} page{picked.size !== 1 ? "s" : ""}
            </button>
          </div>
        )}
        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
      </div>

      <div className="space-y-2">
        {sources.length === 0 && (
          <p className="py-8 text-center text-sm text-muted">
            No sources yet — the bot only knows what you index here.
          </p>
        )}
        {sources.map((s) => (
          <div key={s.id} className="glass flex items-center gap-3 rounded-2xl px-4 py-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
              {s.type === "url" ? <Globe size={14} /> : <FileText size={14} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{s.title}</p>
              <p className="truncate font-(family-name:--font-mono) text-[11px] text-muted">
                {s.url ?? `${s.chunk_count} chunks`}
                {s.status === "error" && s.error ? ` · ${s.error}` : ""}
              </p>
            </div>
            <StatusPill status={s.status} count={s.chunk_count} />
            <button
              onClick={() => remove(s.id)}
              className="cursor-pointer rounded-lg p-2 text-muted/60 transition hover:bg-red-50 hover:text-red-500"
              aria-label="Delete source"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusPill({ status, count }: { status: Source["status"]; count: number }) {
  if (status === "indexed")
    return (
      <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
        {count} chunks
      </span>
    );
  if (status === "error")
    return (
      <span className="shrink-0 rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-600">
        error
      </span>
    );
  return (
    <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
      indexing…
    </span>
  );
}

/* ── Conversations ─────────────────────────────────────────────────────────── */

function ConversationsTab({ convs }: { convs: ConvRow[] }) {
  const withMsgs = convs.filter((c) => c.messages.length > 0);
  if (withMsgs.length === 0)
    return (
      <p className="py-12 text-center text-sm text-muted">
        No conversations yet — they&apos;ll appear as soon as visitors start chatting.
      </p>
    );

  // group by anonymous visitor; legacy rows without one stand alone
  const groups = new Map<string, ConvRow[]>();
  for (const c of withMsgs) {
    const key = c.visitor_id ?? `solo-${c.id}`;
    groups.set(key, [...(groups.get(key) ?? []), c]);
  }

  return (
    <div className="space-y-4">
      {Array.from(groups.entries()).map(([key, list]) => (
        <div key={key}>
          <div className="mb-1.5 flex items-center gap-2 px-1">
            <span
              className="h-4 w-4 rounded-full"
              style={{
                background: `linear-gradient(135deg, hsl(${hashHue(key)} 70% 60%), hsl(${(hashHue(key) + 60) % 360} 70% 55%))`,
              }}
            />
            <span className="font-(family-name:--font-mono) text-[11px] font-semibold tracking-wide text-fg/70">
              {key.startsWith("solo-") ? "Anonymous visitor" : `Visitor #${key.slice(0, 4)}`}
            </span>
            <span className="text-[11px] text-muted">
              · {list.length} conversation{list.length > 1 ? "s" : ""}
            </span>
          </div>
          <ConversationList convs={list} />
        </div>
      ))}
    </div>
  );
}

function hashHue(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}

function ConversationList({ convs }: { convs: ConvRow[] }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="space-y-2">
      {convs.map((c) => {
        const first = c.messages.find((m) => m.role === "user");
        const isOpen = open === c.id;
        return (
          <div key={c.id} className="glass overflow-hidden rounded-2xl">
            <button
              onClick={() => setOpen(isOpen ? null : c.id)}
              className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left"
            >
              <MessageSquareText size={14} className="shrink-0 text-accent" />
              <p className="flex-1 truncate text-sm">{first?.content ?? "—"}</p>
              <span className="shrink-0 text-[11px] text-muted">
                {new Date(c.created_at).toLocaleString()}
              </span>
              <ChevronDown
                size={14}
                className={`shrink-0 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </button>
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 border-t border-line bg-black/[0.02] px-4 py-4">
                    {c.messages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                            m.role === "user"
                              ? "bg-accent text-white"
                              : m.grounded
                                ? "border border-line bg-white"
                                : "border border-amber-200 bg-amber-50 text-amber-800"
                          }`}
                        >
                          {m.content}
                          {m.role === "assistant" && !m.grounded && (
                            <p className="mt-1 text-[10px] font-semibold text-amber-600">
                              ⚠ couldn&apos;t answer from your content
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

/* ── Unanswered ────────────────────────────────────────────────────────────── */

function UnansweredTab({ items }: { items: { question: string; when: string }[] }) {
  if (items.length === 0)
    return (
      <div className="glass rounded-2xl py-14 text-center">
        <p className="font-medium">Nothing unanswered 🎉</p>
        <p className="mt-1 text-sm text-muted">
          When the bot can&apos;t answer from your content, the question lands here.
        </p>
      </div>
    );
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Your visitors asked these and the bot had nothing — a ranked to-do list of docs to write.
      </p>
      <div className="space-y-2">
        {items.map((q, i) => (
          <motion.div
            key={`${q.when}-${i}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(i * 0.05, 0.4) }}
            className="glass flex items-center gap-3 rounded-2xl px-4 py-3"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <HelpCircle size={14} />
            </span>
            <p className="flex-1 text-sm">{q.question}</p>
            <span className="shrink-0 text-[11px] text-muted">
              {new Date(q.when).toLocaleDateString()}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ── Widget settings ───────────────────────────────────────────────────────── */

function WidgetTab({ project, onSaved }: { project: Project; onSaved: () => Promise<void> }) {
  const [botName, setBotName] = useState(project.bot_name);
  const [greeting, setGreeting] = useState(project.greeting);
  const [accent, setAccent] = useState(project.accent_color);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  // live preview: pass unsaved drafts to the embed via query params, debounced
  // so the iframe doesn't reload on every keystroke
  const [previewQS, setPreviewQS] = useState("");
  useEffect(() => {
    const t = setTimeout(() => {
      setPreviewQS(
        new URLSearchParams({ pbot: botName, pgreet: greeting, paccent: accent }).toString()
      );
    }, 450);
    return () => clearTimeout(t);
  }, [botName, greeting, accent]);

  const appUrl =
    (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "") ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const snippet = `<script src="${appUrl}/widget.js" data-project="${project.public_key}" async></script>`;

  async function save() {
    setSaving(true);
    await supabaseBrowser()
      .from("projects")
      .update({ bot_name: botName.trim() || "Wisp", greeting: greeting.trim(), accent_color: accent })
      .eq("id", project.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
    await onSaved();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="glass space-y-4 rounded-2xl p-6">
        <p className="text-sm font-semibold">Appearance</p>
        <label className="block text-xs text-muted">
          Bot name
          <input
            value={botName}
            onChange={(e) => setBotName(e.target.value)}
            maxLength={40}
            className="mt-1 w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-fg outline-none transition focus:border-accent"
          />
        </label>
        <label className="block text-xs text-muted">
          Greeting message
          <textarea
            value={greeting}
            onChange={(e) => setGreeting(e.target.value)}
            rows={2}
            maxLength={200}
            className="mt-1 w-full resize-none rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-fg outline-none transition focus:border-accent"
          />
        </label>
        <label className="block text-xs text-muted">
          Accent color
          <span className="mt-1 flex items-center gap-3">
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="h-9 w-14 cursor-pointer rounded-lg border border-line bg-white"
            />
            <code className="font-(family-name:--font-mono) text-xs text-fg">{accent}</code>
          </span>
        </label>
        <button
          onClick={save}
          disabled={saving}
          className="flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-accent-2 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition disabled:opacity-60"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : saved ? <Check size={13} /> : null}
          {saved ? "Saved" : "Save changes"}
        </button>
      </div>

      <div className="space-y-6">
        <div className="glass rounded-2xl p-6">
          <p className="mb-3 text-sm font-semibold">Install on your site</p>
          <p className="mb-3 text-xs text-muted">
            Paste this before the closing <code className="rounded bg-black/5 px-1">&lt;/body&gt;</code>{" "}
            tag — works on any site.
          </p>
          <div className="flex items-start justify-between gap-3 rounded-xl border border-line bg-[#17171c] p-4">
            <code className="font-(family-name:--font-mono) text-[11px] leading-relaxed break-all text-emerald-300">
              {snippet}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(snippet);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="shrink-0 cursor-pointer rounded-lg bg-white/10 p-2 text-white transition hover:bg-white/20"
              aria-label="Copy snippet"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            </button>
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <p className="mb-2 text-sm font-semibold">Live preview</p>
          <p className="mb-3 text-xs text-muted">The exact chat your visitors will see.</p>
          <div className="h-105 overflow-hidden rounded-2xl border border-line shadow-lg">
            <iframe
              key={previewQS}
              src={`/embed/${project.public_key}?${previewQS}`}
              className="h-full w-full"
              title="Widget preview"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
