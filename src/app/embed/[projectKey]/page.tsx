"use client";

import { use, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, X, Sparkles } from "lucide-react";
import { renderMarkdownLite } from "@/lib/markdown";

type Msg = { role: "user" | "assistant"; content: string };
type Config = { bot_name: string; greeting: string; accent_color: string };

const DEMO_CHIPS = ["How do I install it?", "How does the AI stay accurate?", "What does it cost?"];

// anonymous visitor id so the dashboard can group a visitor's return chats
function getVisitorId(): string | null {
  try {
    let v = localStorage.getItem("wisp_vid");
    if (!v) {
      v = Array.from(crypto.getRandomValues(new Uint8Array(6)))
        .map((b) => b.toString(36).padStart(2, "0"))
        .join("")
        .slice(0, 10);
      localStorage.setItem("wisp_vid", v);
    }
    return v;
  } catch {
    return null; // storage blocked (some embedded contexts) — stay anonymous
  }
}

export default function EmbedPage({ params }: { params: Promise<{ projectKey: string }> }) {
  const { projectKey } = use(params);
  const [config, setConfig] = useState<Config | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const conversationId = useRef<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // dashboard live-preview can override config with unsaved drafts via query params
    const qs = new URLSearchParams(window.location.search);
    const overrides: Partial<Config> = {};
    if (qs.get("pbot")) overrides.bot_name = qs.get("pbot")!;
    if (qs.get("pgreet")) overrides.greeting = qs.get("pgreet")!;
    if (qs.get("paccent")) overrides.accent_color = qs.get("paccent")!;

    const fallback: Config = { bot_name: "Wisp", greeting: "Hi! How can I help?", accent_color: "#7c5cff" };
    fetch(`/api/widget-config?key=${encodeURIComponent(projectKey)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((cfg) => setConfig({ ...(cfg?.bot_name ? cfg : fallback), ...overrides }))
      .catch(() => setConfig({ ...fallback, ...overrides }));
  }, [projectKey]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, streaming]);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === "wisp:open") inputRef.current?.focus();
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  async function send(text: string) {
    const question = text.trim();
    if (!question || streaming) return;
    setInput("");
    const history: Msg[] = [...messages, { role: "user", content: question }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setStreaming(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectKey,
          messages: history,
          conversationId: conversationId.current,
          visitorId: getVisitorId(),
        }),
      });
      const convId = res.headers.get("X-Conversation-Id");
      if (convId) conversationId.current = convId;
      if (!res.ok || !res.body) throw new Error("request failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const current = acc;
        setMessages([...history, { role: "assistant", content: current }]);
      }
      if (!acc.trim()) throw new Error("empty response");
    } catch {
      setMessages([
        ...history,
        { role: "assistant", content: "Hmm, something went wrong — please try again in a moment." },
      ]);
    } finally {
      setStreaming(false);
      inputRef.current?.focus();
    }
  }

  const accent = config?.accent_color ?? "#7c5cff";
  const lastMsg = messages[messages.length - 1];
  const showTyping = streaming && lastMsg?.role === "assistant" && !lastMsg.content;

  if (!config) {
    return (
      <div className="flex h-dvh items-center justify-center bg-white">
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 blur-[2px]"
        />
      </div>
    );
  }

  return (
    <div
      className="flex h-dvh flex-col bg-white text-[#17171c]"
      style={{ ["--wa" as string]: accent }}
    >
      {/* header */}
      <div className="flex items-center gap-3 border-b border-black/8 bg-white/80 px-4 py-3 backdrop-blur">
        <div className="relative">
          <motion.div
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            className="flex h-9 w-9 items-center justify-center rounded-full shadow-md"
            style={{ background: `linear-gradient(135deg, ${accent}, #22d3ee)` }}
          >
            <Sparkles size={16} className="text-white" />
          </motion.div>
          <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{config.bot_name}</p>
          <p className="text-[11px] text-black/45">AI · answers from this site&apos;s docs</p>
        </div>
        <button
          onClick={() => window.parent?.postMessage({ type: "wisp:close" }, "*")}
          className="rounded-lg p-1.5 text-black/40 transition hover:bg-black/5 hover:text-black"
          aria-label="Close chat"
        >
          <X size={16} />
        </button>
      </div>

      {/* messages */}
      <div className="flex-1 space-y-3 overflow-y-auto bg-[#fafaf8] px-4 py-4">
        <Bubble role="assistant" accent={accent} content={config.greeting} />
        <AnimatePresence initial={false}>
          {messages.map((m, i) =>
            m.content || m.role === "user" ? (
              <Bubble key={i} role={m.role} accent={accent} content={m.content} />
            ) : null
          )}
        </AnimatePresence>

        {showTyping && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex w-fit items-center gap-1.5 rounded-2xl rounded-bl-md border border-black/5 bg-white px-4 py-3 shadow-sm"
          >
            {[0, 1, 2].map((d) => (
              <motion.span
                key={d}
                animate={{ y: [0, -4, 0], opacity: [0.35, 1, 0.35] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: d * 0.15 }}
                className="h-1.5 w-1.5 rounded-full bg-black/50"
              />
            ))}
          </motion.div>
        )}

        {/* demo quick-start chips */}
        {projectKey === "demo" && messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="flex flex-wrap gap-2 pt-1"
          >
            {DEMO_CHIPS.map((c) => (
              <button
                key={c}
                onClick={() => send(c)}
                className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs text-black/60 shadow-sm transition hover:border-[var(--wa)] hover:text-black"
              >
                {c}
              </button>
            ))}
          </motion.div>
        )}
        <div ref={endRef} />
      </div>

      {/* input */}
      <div className="border-t border-black/8 bg-white px-3 pt-3 pb-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2 rounded-2xl border border-black/10 bg-[#fafaf8] px-4 py-1.5 transition focus-within:border-[var(--wa)]"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question…"
            maxLength={2000}
            className="h-9 flex-1 bg-transparent text-sm outline-none placeholder:text-black/35"
          />
          <motion.button
            type="submit"
            disabled={!input.trim() || streaming}
            whileTap={{ scale: 0.88 }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition disabled:opacity-30"
            style={{ background: `linear-gradient(135deg, ${accent}, #22d3ee)` }}
            aria-label="Send"
          >
            <ArrowUp size={15} />
          </motion.button>
        </form>
        <p className="pt-1.5 text-center text-[10px] text-black/30">
          Powered by <span className="font-semibold text-black/45">✦ Wisp</span>
        </p>
      </div>
    </div>
  );
}

function Bubble({
  role,
  content,
  accent,
}: {
  role: "user" | "assistant";
  content: string;
  accent: string;
}) {
  const isUser = role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      {isUser ? (
        <div
          className="max-w-[82%] rounded-2xl rounded-br-md px-4 py-2.5 text-sm leading-relaxed text-white shadow-md"
          style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}
        >
          {content}
        </div>
      ) : (
        <div
          className="wisp-md max-w-[86%] rounded-2xl rounded-bl-md border border-black/5 bg-white px-4 py-2.5 text-sm leading-relaxed text-[#26262c] shadow-sm"
          dangerouslySetInnerHTML={{ __html: renderMarkdownLite(content) }}
        />
      )}
    </motion.div>
  );
}
