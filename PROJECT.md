# Wisp — Embeddable AI Support Widget

> **One-liner:** A site owner feeds Wisp their docs/FAQ (or just a URL), gets one line of code to paste, and their visitors get a beautiful AI chat bubble that answers questions **grounded only in that site's content** — while the owner gets a dashboard showing every conversation and, crucially, every question the bot *couldn't* answer.

**Positioning:** "Chatbase / Intercom Fin for indie devs" — free-tier-friendly, 5-minute onboarding, self-demonstrating (the widget runs on its own landing page).

---

## 1. Why this project (portfolio strategy)

It stacks four hiring signals most junior portfolios lack, in one product:

| Signal | Where it shows up |
|---|---|
| **RAG** (embeddings, vector search, grounding) | Ingestion pipeline + pgvector similarity search + grounded prompting |
| **Streaming UIs** | Token-by-token answer streaming from API route → widget |
| **Embeddable SDK design** | `widget.js` — a ~5KB vanilla script that injects an iframe on *any* host site without breaking it |
| **Multi-tenant SaaS architecture** | Orgs/projects, public API keys, per-tenant data isolation, usage metering |

It is differentiated from Strategist Hub (generation) — this proves **retrieval, grounding, and product engineering around AI**. It is dogfoodable: drop it on the portfolio site and Influencer Shop as their live support widget.

---

## 2. Product flows

### Owner (customer) journey
1. Sign up (Supabase auth, email + password)
2. Create a project → gets a public key `prj_xxxxxxxx`
3. Add knowledge sources — three methods:
   - Paste raw text / markdown (ships first, trivial)
   - Add a single URL → crawler fetches, strips nav/footer, extracts content
   - "Crawl my site" → follows same-origin links, capped (~10 pages free tier)
4. Watch indexing status ("14/20 pages indexed")
5. Customize widget: accent color, greeting, bot name
6. Copy snippet, paste before `</body>`:
   ```html
   <script src="https://<app-domain>/widget.js" data-project="prj_xxxxxxxx" async></script>
   ```

### Visitor journey
Click bubble → panel springs open → ask question → answer **streams** in with grounding. If the bot doesn't know, it says so, and the question is flagged **unanswered** in the owner's dashboard.

---

## 3. Architecture

```
Owner adds source ──▶ /api/sources ──▶ fetch page ──▶ clean text ──▶ chunk (~500 tokens, overlap,
                                                                      headings kept with sections)
                                        ──▶ Gemini embeddings (gemini-embedding-001, 768 dims,
                                             re-normalized) ──▶ Supabase pgvector `chunks` table

Visitor asks ──▶ widget iframe ──▶ POST /api/chat { projectKey, messages }
              ──▶ embed question ──▶ pgvector similarity search (top 5, THIS project only)
              ──▶ Gemini 2.5 Flash (thinkingBudget: 0) with strict grounded system prompt
              ──▶ streamed Response ──▶ token-by-token UI
              ──▶ conversation + messages logged (fire-and-forget), unanswered flagged
```

### The widget (`public/widget.js`)
- Tiny vanilla script; reads `data-project` off its own `<script>` tag; derives app base URL from its own `src`
- Injects a floating glowing button + an **iframe** pointing at `/embed/<projectKey>` — chat runs inside the iframe so the host page's CSS can't break it and the host can't read conversations (same pattern as Intercom/Crisp/Stripe embeds)
- `postMessage` contract:
  - iframe → parent: `{ type: "wisp:close" }`, `{ type: "wisp:ready" }`
  - parent → iframe: `{ type: "wisp:open" }`
- Safe to paste blindly: `async`, never blocks page load, fails silently if the server is down, no leaked globals
- Mobile: expands near-fullscreen

### Demo mode
`data-project="demo"` needs **zero database** — the chat API answers from a built-in knowledge blurb about Wisp itself. With no `GEMINI_API_KEY` it falls back to canned scripted answers with fake streaming, so the landing-page demo always works.

---

## 4. Data model (see `supabase/schema.sql`)

| Table | Purpose |
|---|---|
| `projects` | tenant; owner, name, `public_key` (prj_…), bot_name, greeting, accent_color |
| `sources` | a URL or text blob; status pending → indexed / error, chunk_count |
| `chunks` | content + `embedding vector(768)`; HNSW cosine index; **no client access (RLS)** |
| `conversations` | one visitor chat session per project |
| `messages` | role, content, `grounded` flag (false ⇒ shows in Unanswered tab) |

RPC `match_chunks(project, query_embedding, count)` does the cosine similarity search server-side. RLS: owners see only their rows; chunks are service-role-only (the widget goes through API routes).

Multi-tenant isolation is enforced **in the vector search filter** — a security-critical line.

---

## 5. LLM details (hard-won from Strategist Hub)

- Chat model: `gemini-2.5-flash` (free tier ~1,500 req/day; 3.5-flash free tier is ~20/day — avoid)
- **Always set `thinkingConfig: { thinkingBudget: 0 }`** — 2.5-series thinking is on by default and silently eats output tokens
- Free RPM = 10 → per-project rate limiting on /api/chat
- Embeddings: `gemini-embedding-001` at `outputDimensionality: 768` — vectors must be **re-normalized** when truncated below 3072
- Grounding contract: system prompt instructs the model to answer ONLY from context and to prefix `[[unanswered]]` when it can't — the API strips the token and sets `grounded=false`

## 6. Site map

| Route | What |
|---|---|
| `/` | Landing: animated wisp orb hero, features, how-it-works, snippet showcase, **live demo widget on itself** |
| `/login` | Auth (sign in / sign up) |
| `/dashboard` | Projects grid + create |
| `/dashboard/[id]` | Tabs: **Overview** (stat tiles), **Sources**, **Conversations**, **Unanswered** (the killer feature — tells owners what docs to write), **Widget** (appearance + embed snippet) |
| `/embed/[projectKey]` | The chat UI that lives inside the iframe |
| `/api/chat` | Streaming RAG answers + logging |
| `/api/sources` | Crawl → chunk → embed → store |
| `/api/widget-config` | Public widget appearance config |

## 7. Design language

Dark, cinematic, fun — shared DNA with the portfolio site:
- bg `#07070b`, fg `#f0efec`, violet accent `#8b5cf6`, cyan accent-2 `#22d3ee`
- Fonts: Space Grotesk (display), Inter (body), JetBrains Mono (code/snippets)
- Framer Motion everywhere: scroll reveals, spring-mounted chat bubbles, floating glow orb, magnetic hover on CTAs
- The wisp orb = brand: a blurred gradient blob that drifts/breathes; the widget button carries the same glow

## 8. Build milestones

1. ✅ Scaffold (Next.js App Router, TS, Tailwind v4)
2. RAG core: chunk → embed → match → grounded streamed answer
3. Multi-tenancy: auth, projects, sources pipeline with status
4. Embeddable widget: script + iframe + postMessage + theming
5. Dashboard: conversations log, unanswered report, usage
6. Polish, deploy to Vercel, dogfood on portfolio + Influencer Shop

## 9. Runtime requirements (env)

| Key | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | supabase.com → project → Settings → API (bare URL, no `/rest/v1/`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same page |
| `SUPABASE_SERVICE_ROLE_KEY` | same page (server-only) |
| `GEMINI_API_KEY` | aistudio.google.com → Get API key (free) |
| `NEXT_PUBLIC_APP_URL` | the deployed URL (used in embed snippets) |

Runs at ₹0: Vercel free + Supabase free + Gemini free tier.
