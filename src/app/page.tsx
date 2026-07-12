"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Copy, Check, ArrowUp } from "lucide-react";

/* ── shared reveal ─────────────────────────────────────────────────────────── */

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ duration: 0.75, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function openDemoWidget() {
  (document.querySelector("#wisp-btn") as HTMLButtonElement | null)?.click();
}

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function Home() {
  return (
    <div className="relative min-h-dvh w-full overflow-x-clip">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-48 left-1/5 h-[520px] w-[520px] rounded-full bg-accent/10 blur-[150px]" />
        <div className="absolute top-1/4 -right-40 h-[460px] w-[460px] rounded-full bg-accent-2/8 blur-[140px]" />
        <div className="dotgrid absolute inset-0" />
      </div>

      <Nav />
      <Hero />
      <Marquee />
      <HowItWorks />
      <Bento />
      <SnippetShowcase />
      <FinalCta />
      <Footer />

      {/* Wisp demoing Wisp — the real widget, on its own landing page */}
      <Script src="/widget.js" data-project="demo" strategy="afterInteractive" />
    </div>
  );
}

/* ── nav ───────────────────────────────────────────────────────────────────── */

function Nav() {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="glass-ios fixed inset-x-0 top-4 z-50 mx-auto flex w-[min(94%,56rem)] items-center justify-between rounded-full py-2 pr-2 pl-5"
    >
      <Link href="/" className="flex items-center gap-2 font-(family-name:--font-display) text-[17px] font-bold tracking-tight">
        <span className="flex h-6.5 w-6.5 items-center justify-center rounded-lg bg-fg">
          <Sparkles size={12} className="text-white" />
        </span>
        wisp
      </Link>
      <div className="hidden items-center gap-7 text-[13px] font-medium text-muted sm:flex">
        <a href="#how" className="transition hover:text-fg">How it works</a>
        <a href="#features" className="transition hover:text-fg">Features</a>
        <button onClick={openDemoWidget} className="flex cursor-pointer items-center gap-1.5 transition hover:text-fg">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          Live demo
        </button>
      </div>
      <Link
        href="/dashboard"
        className="rounded-full bg-fg px-4.5 py-2 text-[13px] font-semibold text-white transition hover:scale-[1.03] hover:bg-black active:scale-95"
      >
        Dashboard
      </Link>
    </motion.nav>
  );
}

/* ── hero ──────────────────────────────────────────────────────────────────── */

function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-14 px-5 pt-36 pb-20 lg:grid-cols-[1.02fr_0.98fr] lg:gap-8 lg:pt-44">
      <div>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6 flex items-center gap-2 font-(family-name:--font-mono) text-[11px] tracking-[0.18em] text-muted uppercase"
        >
          <span className="inline-block h-px w-8 bg-fg/30" />
          AI support widget · open source
        </motion.p>

        <h1 className="font-(family-name:--font-display) text-[clamp(2.9rem,6.5vw,4.6rem)] leading-[0.98] font-bold tracking-[-0.03em]">
          <Word delay={0.15}>Support</Word> <Word delay={0.22}>that</Word>
          <br />
          <Word delay={0.3}>
            <span className="serif-it pr-1 text-accent">already read</span>
          </Word>
          <br />
          <Word delay={0.4}>your</Word> <Word delay={0.46}>docs.</Word>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.55 }}
          className="mt-6 max-w-md text-[17px] leading-relaxed text-muted"
        >
          One line of code gives your site a chat bubble that answers visitors from{" "}
          <em className="serif-it text-fg">your</em> content — instantly, honestly, and never
          making things up.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.68 }}
          className="mt-9 flex flex-wrap items-center gap-5"
        >
          <Link
            href="/login"
            className="group flex items-center gap-2.5 rounded-full bg-fg px-7 py-3.5 text-[15px] font-semibold text-white shadow-[0_10px_30px_rgba(21,21,26,.22)] transition hover:scale-[1.03] active:scale-95"
          >
            Get your widget
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 transition-transform group-hover:translate-x-0.5">
              <ArrowRight size={11} />
            </span>
          </Link>
          <button
            onClick={openDemoWidget}
            className="group cursor-pointer text-[15px] font-medium text-fg underline decoration-accent/60 decoration-2 underline-offset-[6px] transition hover:decoration-accent"
          >
            Ask the live demo
            <span className="ml-1 inline-block transition-transform group-hover:translate-y-0.5">↘</span>
          </button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.8 }}
          className="mt-8 font-(family-name:--font-mono) text-[11px] tracking-wide text-muted/80"
        >
          5-minute setup ✦ free while in beta ✦ no card
        </motion.p>
      </div>

      <HeroMock />
    </section>
  );
}

function Word({ children, delay }: { children: React.ReactNode; delay: number }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.7, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="inline-block"
    >
      {children}
    </motion.span>
  );
}

/* ── hero mockup: a browser with the widget answering, on loop ────────────── */

type MockMsg = { role: "user" | "bot"; text: string };
const MOCK_SCRIPT: MockMsg[] = [
  { role: "user", text: "Do you ship to India?" },
  { role: "bot", text: "Yes! We ship worldwide 🌍 Orders to India arrive in 4–6 business days, tracked all the way." },
  { role: "user", text: "And returns?" },
  { role: "bot", text: "30 days, no questions asked — the return label is prepaid. Start it from your account page." },
];

function HeroMock() {
  const [msgs, setMsgs] = useState<MockMsg[]>([]);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    let alive = true;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    (async () => {
      await sleep(1400);
      while (alive) {
        setMsgs([]);
        for (const m of MOCK_SCRIPT) {
          if (!alive) return;
          if (m.role === "user") {
            await sleep(950);
            if (!alive) return;
            setMsgs((p) => [...p, m]);
          } else {
            setTyping(true);
            await sleep(1150);
            if (!alive) return;
            setTyping(false);
            setMsgs((p) => [...p, { role: "bot", text: "" }]);
            for (let i = 2; i <= m.text.length; i += 2) {
              if (!alive) return;
              const partial = m.text.slice(0, i);
              setMsgs((p) => [...p.slice(0, -1), { role: "bot", text: partial }]);
              await sleep(17);
            }
            setMsgs((p) => [...p.slice(0, -1), m]);
            await sleep(1600);
          }
        }
        await sleep(3000);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotate: 1.5 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: 1, delay: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="relative mx-auto w-full max-w-[480px]"
    >
      {/* decorations */}
      <div className="absolute -top-10 -right-8 -z-10 h-40 w-40 rounded-full bg-accent/15 blur-3xl" />
      <motion.span
        animate={{ rotate: 360 }}
        transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
        className="absolute -top-5 -left-4 text-2xl text-accent/70"
        aria-hidden
      >
        ✦
      </motion.span>
      <span className="absolute -right-3 bottom-16 text-sm text-accent-2/80" aria-hidden>✦</span>

      {/* browser chrome */}
      <motion.div
        animate={{ y: [0, -7, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_30px_80px_rgba(21,21,26,.16)]"
      >
        <div className="flex items-center gap-2 border-b border-line bg-[#f4f4f1] px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-3 flex-1 rounded-md bg-white px-3 py-1 font-(family-name:--font-mono) text-[10px] text-muted">
            sundaythrift.store
          </span>
        </div>

        {/* fake page behind the widget */}
        <div className="relative h-[380px] bg-[#fbfbf9] p-5">
          <div className="flex items-center justify-between opacity-45">
            <div className="h-3 w-20 rounded bg-fg/70" />
            <div className="flex gap-2">
              <div className="h-2.5 w-10 rounded bg-fg/20" />
              <div className="h-2.5 w-10 rounded bg-fg/20" />
              <div className="h-2.5 w-10 rounded bg-fg/20" />
            </div>
          </div>
          <div className="mt-5 h-24 rounded-xl bg-gradient-to-br from-accent/25 via-accent/10 to-accent-2/20 opacity-60" />
          <div className="mt-4 grid grid-cols-3 gap-3 opacity-45">
            {[0, 1, 2].map((i) => (
              <div key={i}>
                <div className="h-16 rounded-lg bg-fg/8" />
                <div className="mt-1.5 h-2 w-3/4 rounded bg-fg/15" />
                <div className="mt-1 h-2 w-1/3 rounded bg-fg/10" />
              </div>
            ))}
          </div>

          {/* the widget panel */}
          <div className="absolute right-4 bottom-4 flex w-[240px] flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-[0_18px_50px_rgba(21,21,26,.22)]">
            <div className="flex items-center gap-2 border-b border-line px-3 py-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-2">
                <Sparkles size={10} className="text-white" />
              </span>
              <div>
                <p className="text-[11px] leading-tight font-semibold">Sunday Thrift</p>
                <p className="text-[9px] text-emerald-600">● online now</p>
              </div>
            </div>
            <div className="flex h-[190px] flex-col justify-end gap-1.5 overflow-hidden bg-[#fafaf8] p-2.5">
              {msgs.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 26 }}
                  className={`max-w-[85%] rounded-xl px-2.5 py-1.5 text-[10.5px] leading-snug ${
                    m.role === "user"
                      ? "self-end rounded-br-sm bg-fg text-white"
                      : "self-start rounded-bl-sm border border-line bg-white text-fg/85 shadow-sm"
                  }`}
                >
                  {m.text}
                  {m.role === "bot" && i === msgs.length - 1 && (
                    <span className="ml-0.5 inline-block h-2.5 w-[3px] animate-pulse rounded-full bg-accent align-middle" />
                  )}
                </motion.div>
              ))}
              {typing && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex w-fit items-center gap-1 self-start rounded-xl rounded-bl-sm border border-line bg-white px-2.5 py-2 shadow-sm"
                >
                  {[0, 1, 2].map((d) => (
                    <motion.span
                      key={d}
                      animate={{ y: [0, -3, 0], opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: d * 0.13 }}
                      className="h-1 w-1 rounded-full bg-fg/60"
                    />
                  ))}
                </motion.div>
              )}
            </div>
            <div className="flex items-center gap-2 border-t border-line bg-white px-3 py-2">
              <span className="flex-1 text-[10px] text-muted/60">Ask anything…</span>
              <span className="flex h-5.5 w-5.5 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-2">
                <ArrowUp size={9} className="text-white" />
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
        className="mt-4 text-center font-(family-name:--font-mono) text-[10.5px] tracking-wide text-muted/70"
      >
        ↑ your site, five minutes from now
      </motion.p>
    </motion.div>
  );
}

/* ── marquee ───────────────────────────────────────────────────────────────── */

const PLATFORMS = ["Next.js", "React", "WordPress", "Shopify", "Webflow", "Plain HTML", "Framer", "Astro", "Vue"];

function Marquee() {
  const row = [...PLATFORMS, ...PLATFORMS];
  return (
    <section className="border-y border-line bg-white/50 py-5 [mask-image:linear-gradient(to_right,transparent,#000_12%,#000_88%,transparent)]">
      <div className="marquee-track items-center gap-10">
        {row.map((p, i) => (
          <span
            key={i}
            className="flex shrink-0 items-center gap-10 font-(family-name:--font-mono) text-[12px] tracking-[0.22em] text-muted/70 uppercase"
          >
            {p} <span className="text-accent/60">✦</span>
          </span>
        ))}
      </div>
    </section>
  );
}

/* ── how it works ──────────────────────────────────────────────────────────── */

function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-6xl px-5 py-28">
      <Reveal className="mb-16 flex flex-wrap items-end justify-between gap-6">
        <h2 className="font-(family-name:--font-display) text-4xl font-bold tracking-tight sm:text-5xl">
          Live in <span className="serif-it text-accent">five minutes.</span>
        </h2>
        <p className="max-w-xs font-(family-name:--font-mono) text-[11px] leading-relaxed tracking-wide text-muted uppercase">
          No SDKs, no rebuilds, no config files. Three steps.
        </p>
      </Reveal>

      <div className="relative grid gap-5 lg:grid-cols-3">
        <div className="dashline absolute top-10 right-[16%] left-[16%] hidden h-px lg:block" />
        {/* step 1 */}
        <Step n="01" title="Feed it your content" body="Paste text, drop a URL, or crawl your whole site. Wisp chunks and embeds everything into a private knowledge base.">
          <div className="flex flex-wrap gap-2">
            {["docs.yoursite.com", "faq.md", "+ paste anything"].map((c, i) => (
              <span
                key={c}
                className={`rounded-full border px-3 py-1.5 font-(family-name:--font-mono) text-[10.5px] ${
                  i === 2 ? "border-dashed border-fg/30 text-muted" : "border-line bg-white text-fg/80 shadow-sm"
                }`}
              >
                {c}
              </span>
            ))}
          </div>
        </Step>
        {/* step 2 */}
        <Step n="02" title="Paste one line" body="A single async script tag, anywhere HTML lives. ~5KB, never blocks your page, fails silently if we're ever down.">
          <div className="rounded-lg bg-[#17171c] px-3.5 py-3 font-(family-name:--font-mono) text-[10.5px] leading-relaxed text-white/85">
            <span className="text-white/35">&lt;</span>
            <span className="text-cyan-300">script</span>{" "}
            <span className="text-violet-300">src</span>
            <span className="text-white/35">=</span>
            <span className="text-emerald-300">&quot;…/widget.js&quot;</span>
            <span className="text-white/35">&gt;</span>
            <span className="ml-0.5 inline-block h-3 w-[5px] animate-pulse bg-accent align-middle" />
          </div>
        </Step>
        {/* step 3 */}
        <Step n="03" title="Watch it answer" body="Visitors get streamed answers from your content. You get every transcript — and every question it couldn't answer.">
          <div className="space-y-1.5">
            <div className="w-fit self-end rounded-lg rounded-br-sm bg-fg px-2.5 py-1.5 text-[10.5px] text-white">
              How do refunds work?
            </div>
            <div className="w-fit rounded-lg rounded-bl-sm border border-line bg-white px-2.5 py-1.5 text-[10.5px] text-fg/80 shadow-sm">
              Within 30 days, full refund — here&apos;s how ↓
            </div>
          </div>
        </Step>
      </div>
    </section>
  );
}

function Step({
  n,
  title,
  body,
  children,
}: {
  n: string;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <Reveal delay={Number(n) * 0.09}>
      <div className="group relative h-full rounded-2xl border border-line bg-white p-6 shadow-[0_1px_2px_rgba(21,21,26,.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(21,21,26,.09)]">
        <span className="absolute -top-3.5 left-6 rounded-full border border-line bg-bg px-2.5 py-1 font-(family-name:--font-mono) text-[10px] font-semibold text-accent">
          {n}
        </span>
        <div className="mb-5 flex min-h-16 items-center">{children}</div>
        <h3 className="mb-1.5 font-(family-name:--font-display) text-lg font-bold">{title}</h3>
        <p className="text-[13.5px] leading-relaxed text-muted">{body}</p>
      </div>
    </Reveal>
  );
}

/* ── bento features ────────────────────────────────────────────────────────── */

function Bento() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-5 py-24">
      <Reveal className="mb-14">
        <h2 className="font-(family-name:--font-display) text-4xl font-bold tracking-tight sm:text-5xl">
          Small widget. <span className="serif-it text-accent">Serious plumbing.</span>
        </h2>
      </Reveal>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* grounded — wide */}
        <Reveal className="lg:col-span-2">
          <div className="h-full rounded-2xl border border-line bg-white p-7 shadow-[0_1px_2px_rgba(21,21,26,.04)]">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <span className="rounded-lg border border-line bg-bg px-3 py-2 text-xs font-medium shadow-sm">
                &quot;Can I self-host?&quot;
              </span>
              <span className="font-(family-name:--font-mono) text-muted/60">→</span>
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className={`h-8 w-6 rounded-md border ${
                      i === 1 ? "border-accent bg-accent/15 shadow-[0_0_12px_rgba(124,92,255,.35)]" : "border-line bg-fg/4"
                    }`}
                  />
                ))}
              </div>
              <span className="font-(family-name:--font-mono) text-muted/60">→</span>
              <span className="rounded-lg rounded-bl-sm bg-fg px-3 py-2 text-xs font-medium text-white">
                Yes — it&apos;s open source ✦
              </span>
            </div>
            <h3 className="mb-1.5 font-(family-name:--font-display) text-xl font-bold">
              Grounded, <span className="serif-it text-accent">not creative</span>
            </h3>
            <p className="max-w-lg text-sm leading-relaxed text-muted">
              Every answer is retrieved from your indexed content with vector search, then generated
              strictly from those passages. Not in your docs? It says so — honestly — instead of
              inventing something.
            </p>
          </div>
        </Reveal>

        {/* streaming */}
        <Reveal delay={0.08}>
          <div className="h-full rounded-2xl border border-line bg-white p-7 shadow-[0_1px_2px_rgba(21,21,26,.04)]">
            <div className="mb-6 space-y-2">
              <div className="shimmer-line h-2.5 w-full rounded-full" />
              <div className="shimmer-line h-2.5 w-4/5 rounded-full [animation-delay:.2s]" />
              <div className="shimmer-line h-2.5 w-3/5 rounded-full [animation-delay:.4s]" />
            </div>
            <h3 className="mb-1.5 font-(family-name:--font-display) text-xl font-bold">Streams live</h3>
            <p className="text-sm leading-relaxed text-muted">
              Token-by-token answers that feel alive. No spinners, no ten-second waits.
            </p>
          </div>
        </Reveal>

        {/* unanswered report */}
        <Reveal>
          <div className="h-full rounded-2xl border border-line bg-white p-7 shadow-[0_1px_2px_rgba(21,21,26,.04)]">
            <div className="mb-6 space-y-1.5">
              {["Do you have an API?", "Bulk pricing?", "GDPR compliance?"].map((q) => (
                <div key={q} className="flex items-center gap-2 rounded-lg border border-amber-200/70 bg-amber-50/60 px-3 py-1.5">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  <span className="truncate text-[11.5px] text-amber-900/80">{q}</span>
                </div>
              ))}
            </div>
            <h3 className="mb-1.5 font-(family-name:--font-display) text-xl font-bold">The unanswered report</h3>
            <p className="text-sm leading-relaxed text-muted">
              Every question your bot couldn&apos;t answer, collected — a ranked to-do list of docs
              you should write.
            </p>
          </div>
        </Reveal>

        {/* isolation */}
        <Reveal delay={0.08}>
          <div className="h-full rounded-2xl border border-line bg-white p-7 shadow-[0_1px_2px_rgba(21,21,26,.04)]">
            <div className="mb-6 rounded-xl border border-dashed border-fg/25 p-3">
              <p className="mb-2 font-(family-name:--font-mono) text-[9px] tracking-widest text-muted/60 uppercase">their site</p>
              <div className="ml-auto w-2/3 rounded-lg border border-accent/50 bg-accent/8 px-3 py-2 text-center font-(family-name:--font-mono) text-[10px] text-accent">
                wisp iframe ✦
              </div>
            </div>
            <h3 className="mb-1.5 font-(family-name:--font-display) text-xl font-bold">Runs in isolation</h3>
            <p className="text-sm leading-relaxed text-muted">
              Sandboxed in an iframe — host CSS can&apos;t break it, and it can&apos;t slow the page.
              Same pattern Intercom and Stripe use.
            </p>
          </div>
        </Reveal>

        {/* branding */}
        <Reveal delay={0.16}>
          <div className="h-full rounded-2xl border border-line bg-white p-7 shadow-[0_1px_2px_rgba(21,21,26,.04)]">
            <div className="mb-6 flex items-center gap-2.5">
              {["#7c5cff", "#0ea5e9", "#f43f5e", "#10b981", "#f59e0b"].map((c) => (
                <span
                  key={c}
                  className="h-7 w-7 cursor-pointer rounded-full border-2 border-white shadow-md transition-transform hover:scale-110"
                  style={{ background: c }}
                />
              ))}
            </div>
            <h3 className="mb-1.5 font-(family-name:--font-display) text-xl font-bold">Wears your brand</h3>
            <p className="text-sm leading-relaxed text-muted">
              Accent color, bot name, greeting — visitors see your identity, not ours.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── snippet ───────────────────────────────────────────────────────────────── */

function SnippetShowcase() {
  const [copied, setCopied] = useState(false);
  const snippet = `<script src="https://wisp.app/widget.js" data-project="prj_x7f2k9" async></script>`;
  return (
    <section className="mx-auto max-w-3xl px-5 py-24 text-center">
      <Reveal>
        <h2 className="font-(family-name:--font-display) text-4xl font-bold tracking-tight sm:text-5xl">
          One line. <span className="serif-it text-accent">Any site.</span>
        </h2>
      </Reveal>
      <Reveal delay={0.12}>
        <div className="mt-10 overflow-hidden rounded-2xl border border-line bg-[#17171c] text-left shadow-[0_24px_60px_rgba(21,21,26,.25)]">
          <div className="flex items-center justify-between border-b border-white/8 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
              <span className="ml-2 font-(family-name:--font-mono) text-[10.5px] text-white/40">index.html</span>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(snippet);
                setCopied(true);
                setTimeout(() => setCopied(false), 1600);
              }}
              className="flex cursor-pointer items-center gap-1.5 rounded-md bg-white/8 px-2.5 py-1.5 font-(family-name:--font-mono) text-[10.5px] text-white/70 transition hover:bg-white/15 hover:text-white"
            >
              {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
              {copied ? "copied" : "copy"}
            </button>
          </div>
          <div className="overflow-x-auto px-5 py-5 font-(family-name:--font-mono) text-[12.5px] leading-relaxed whitespace-nowrap">
            <span className="mr-4 text-white/25 select-none">1</span>
            <span className="text-white/35">&lt;</span>
            <span className="text-cyan-300">script</span>{" "}
            <span className="text-violet-300">src</span>
            <span className="text-white/35">=</span>
            <span className="text-emerald-300">&quot;https://wisp.app/widget.js&quot;</span>{" "}
            <span className="text-violet-300">data-project</span>
            <span className="text-white/35">=</span>
            <span className="text-emerald-300">&quot;prj_x7f2k9&quot;</span>{" "}
            <span className="text-violet-300">async</span>
            <span className="text-white/35">&gt;&lt;/</span>
            <span className="text-cyan-300">script</span>
            <span className="text-white/35">&gt;</span>
          </div>
        </div>
      </Reveal>
      <Reveal delay={0.2}>
        <p className="mt-5 font-(family-name:--font-mono) text-[11px] tracking-wide text-muted/80">
          works on next.js ✦ wordpress ✦ shopify ✦ anything with html
        </p>
      </Reveal>
    </section>
  );
}

/* ── final cta ─────────────────────────────────────────────────────────────── */

function FinalCta() {
  return (
    <section className="relative mx-auto max-w-4xl px-5 py-32 text-center">
      <motion.span
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="absolute top-16 left-[12%] text-xl text-accent/50"
        aria-hidden
      >
        ✦
      </motion.span>
      <span className="absolute right-[15%] bottom-24 text-sm text-accent-2/60" aria-hidden>✦</span>

      <Reveal>
        <h2 className="font-(family-name:--font-display) text-[clamp(2.4rem,6vw,4.2rem)] leading-[1.02] font-bold tracking-[-0.03em]">
          Your docs already know
          <br />
          the answer. <span className="serif-it text-accent">Let them talk.</span>
        </h2>
      </Reveal>
      <Reveal delay={0.15}>
        <Link
          href="/login"
          className="group mt-10 inline-flex items-center gap-2.5 rounded-full bg-fg px-8 py-4 text-[15px] font-semibold text-white shadow-[0_12px_36px_rgba(21,21,26,.25)] transition hover:scale-[1.04] active:scale-95"
        >
          Create your widget — free
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 transition-transform group-hover:translate-x-0.5">
            <ArrowRight size={11} />
          </span>
        </Link>
      </Reveal>
    </section>
  );
}

/* ── footer ────────────────────────────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="overflow-hidden border-t border-line pt-14">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 pb-10 text-[13px] text-muted">
        <p>
          Built by{" "}
          <a
            href="https://github.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-fg underline decoration-accent/50 decoration-2 underline-offset-4 transition hover:decoration-accent"
          >
            Atharva Jadhav
          </a>
        </p>
        <p className="font-(family-name:--font-mono) text-[11px] tracking-wide">
          next.js 16 ✦ supabase pgvector ✦ gemini
        </p>
      </div>
      <p
        className="outline-text pointer-events-none -mb-8 text-center font-(family-name:--font-display) text-[clamp(6rem,22vw,15rem)] leading-none font-bold select-none"
        aria-hidden
      >
        wisp✦
      </p>
    </footer>
  );
}
