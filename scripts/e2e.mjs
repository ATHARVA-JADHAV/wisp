// End-to-end smoke test: user → project → ingest → RAG chat → dashboard data.
// Run from wisp/: `node scripts/e2e.mjs` (needs dev server on :3000 + .env keys)
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

const env = Object.fromEntries(
  fs
    .readFileSync(".env", "utf8")
    .split(/\r?\n/)
    .filter((l) => /^[A-Z]/.test(l))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1).trim()];
    })
);
const SUPA = env.NEXT_PUBLIC_SUPABASE_URL;
const BASE = "http://localhost:3000";
const EMAIL = "e2e-test@wisp-e2e.dev";
const PASS = "wisp-e2e-Pass123!";

const admin = createClient(SUPA, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const anon = createClient(SUPA, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });

// 1. test user (idempotent)
const created = await admin.auth.admin.createUser({ email: EMAIL, password: PASS, email_confirm: true });
if (created.error && !/already/i.test(created.error.message)) throw created.error;

const { data: signin, error: se } = await anon.auth.signInWithPassword({ email: EMAIL, password: PASS });
if (se) throw se;
const session = signin.session;
console.log("1. signed in as", session.user.id);

// 2. project (through RLS as the user)
const userClient = createClient(SUPA, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  global: { headers: { Authorization: `Bearer ${session.access_token}` } },
  auth: { persistSession: false },
});
const { data: proj, error: pe } = await userClient
  .from("projects")
  .insert({ name: "E2E Test Store", owner: session.user.id })
  .select("*")
  .single();
if (pe) throw pe;
console.log("2. project created:", proj.public_key);

// 3. auth cookie in @supabase/ssr format so /api/sources sees the session
const ref = new URL(SUPA).hostname.split(".")[0];
const raw = "base64-" + Buffer.from(JSON.stringify(session)).toString("base64url");
const CHUNK = 3180;
const cookie =
  raw.length <= CHUNK
    ? `sb-${ref}-auth-token=${raw}`
    : Array.from({ length: Math.ceil(raw.length / CHUNK) }, (_, i) =>
        `sb-${ref}-auth-token.${i}=${raw.slice(i * CHUNK, (i + 1) * CHUNK)}`
      ).join("; ");

// 4. ingest pasted text
const FAQ = `Shipping

We ship worldwide. Orders to India arrive in 4 to 6 business days. Shipping is free on orders over 2000 rupees.

Returns

You can return any item within 30 days, no questions asked. Refunds are processed to the original payment method within 5 business days.

Support hours

Our human team replies between 10am and 7pm IST, Monday to Saturday.`;

let r = await fetch(`${BASE}/api/sources`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: cookie },
  body: JSON.stringify({ projectId: proj.id, type: "text", text: FAQ, title: "Store FAQ" }),
});
let j = await r.json();
console.log("4. ingest text:", r.status, j.source?.status, `${j.source?.chunk_count} chunks`, j.error ?? "");

// 5. ingest a URL
r = await fetch(`${BASE}/api/sources`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: cookie },
  body: JSON.stringify({ projectId: proj.id, type: "url", url: "https://example.com" }),
});
j = await r.json();
console.log("5. ingest url :", r.status, j.source?.status, `${j.source?.chunk_count} chunks`, j.error ?? "");

// 6. chat — answerable, then unanswerable
async function chat(q) {
  const res = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectKey: proj.public_key, messages: [{ role: "user", content: q }] }),
  });
  return { conv: res.headers.get("x-conversation-id"), text: await res.text() };
}
const a1 = await chat("How long do orders to India take?");
console.log("6a. answerable  :", a1.text.trim().slice(0, 140));
const a2 = await chat("Do you offer a lifetime warranty on electronics?");
console.log("6b. unanswerable:", a2.text.trim().slice(0, 140));

// 7. verify what the dashboard would read
const convIds = [a1.conv, a2.conv].filter(Boolean);
const { data: msgs } = await admin
  .from("messages")
  .select("role,grounded,content")
  .in("conversation_id", convIds)
  .order("id");
console.log(
  "7. logged messages:",
  msgs.map((m) => `${m.role}${m.role === "assistant" ? (m.grounded ? " (grounded)" : " (UNANSWERED)") : ""}`).join(", ")
);

// 8. cleanup (cascades project → sources → chunks → conversations → messages)
await admin.auth.admin.deleteUser(session.user.id);
console.log("8. test user + all data cleaned up ✓");
