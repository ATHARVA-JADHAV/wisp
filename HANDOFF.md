# HANDOFF — Wisp (embeddable AI support widget)

> For the next Claude session (or future me). Read this + `PROJECT.md` and you can resume immediately.
> Last updated: 2026-07-12.

## What this is

**Wisp** = Atharva's portfolio flagship: a "chatbase for indie devs." Site owners feed it their content (paste text / URL / crawl), paste **one script tag**, and visitors get a chat bubble answering questions grounded ONLY in that site's content (RAG over pgvector), streamed token-by-token. Owners get a dashboard with conversations + an **Unanswered Questions report**. Chosen to add 4 resume signals: RAG, streaming UIs, embeddable SDK design, multi-tenant SaaS. Full product/architecture rationale: `PROJECT.md`.

## Current status: END-TO-END TESTED AND WORKING (2026-07-13)

- `npm run build` passes clean (Next.js 16.2.10, Turbopack, TS strict).
- User runs `npm run dev` on **localhost:3000** (a server is usually already running — don't start a second one; it hot-reloads env + code).
- Keys are in **`wisp/.env`** (not .env.local): Supabase URL/anon/service_role + `GEMINI_API_KEY` — all verified working.
- **E2E smoke test passed** (`node scripts/e2e.mjs` — rerunnable, cleans up after itself): signup → RLS project create → text ingestion (chunk→embed→pgvector) → URL ingestion (example.com) → grounded RAG answer streamed correctly → unanswerable question refused politely + logged `grounded=false` → conversations/messages rows verified → test user deleted.
- Demo widget on the landing page now does REAL Gemini RAG (was canned before keys existed).
- Missing-env UX handled: `/dashboard`, `/login` render `EnvNotice` instead of crashing.

## Immediate next steps (in order)

1. **User does a manual pass**: sign up in the UI → create a real project → index his portfolio/docs → play with the widget → check dashboard tabs fill up. (The scripted e2e passed; human pass pending.)
2. Test the widget on a real external page (plain HTML file with the script tag pointing at `localhost:3000/widget.js`).
3. Deploy to Vercel (set all envs + `NEXT_PUBLIC_APP_URL=<prod url>`). Then dogfood: add the widget to his portfolio site (`BS1/portfolio`) and Influencer Shop.
4. Later: GitHub repo + polished README screenshots/GIF, resume bullet, maybe a `@wisp/react` npm wrapper (extra resume line).
5. Scaling roadmap discussed with user (not yet built, in rough priority): public "chat with any URL" playground; job queue for ingestion (pg_cron/Inngest); Upstash Redis rate limiting + usage metering; answer caching by question hash; human handoff (email capture on unanswered); hybrid search (pgvector + FTS); thumbs up/down feedback; auto re-crawl; AI-suggested FAQ drafts from unanswered clusters; `@wisp/react-native` WebView wrapper (mobile tier 2 — tier 1 = plain WebView of `/embed/<key>`, works today, just needs docs).

## What's built (file map)

| Piece | Where | Notes |
|---|---|---|
| Widget loader | `public/widget.js` | Vanilla IIFE ~5KB. Reads `data-project` + derives base URL from own `src`. Button + iframe panel, postMessage (`wisp:open`/`wisp:close`), pulse ring, mobile styles, fetches accent color from `/api/widget-config`. |
| Embed chat UI | `src/app/embed/[projectKey]/page.tsx` | Light theme, framer-motion bubbles, typing dots, streaming reader, demo chips for key `demo`, markdown-lite rendering. |
| Chat API | `src/app/api/chat/route.ts` | Streams plain text. RAG: embed query → `match_chunks` RPC (similarity > 0.35, top 5) → grounded system prompt. `[[unanswered]]` token buffered/stripped → `grounded=false` logged. In-memory rate limit 20/min/project. `X-Conversation-Id` header. Demo mode: canned (no key) or RAG over `src/lib/demo.ts`. |
| Ingestion API | `src/app/api/sources/route.ts` | POST (auth via cookie, RLS ownership check): `discover:true` returns links; else create source → fetch → chunk → embed → insert chunks (admin client) → status. DELETE removes source (chunks cascade). Caps: 200k chars, 120 chunks/source. |
| Widget config API | `src/app/api/widget-config/route.ts` | Public: bot_name/greeting/accent by public_key. |
| Gemini client | `src/lib/gemini.ts` | **Model fallback chain** (env `GEMINI_CHAT_MODEL` → `gemini-3.1-flash-lite` → `flash-lite-latest` → `flash-latest` → `2.5-flash`), rotates on 404/quota. NOTE: fresh accounts get 404 "no longer available to new users" on 2.5-flash — that's why the chain exists. `thinkingBudget: 0` applied to 2.x models only. `gemini-embedding-001` @768 dims **re-normalized**. Comma-separated key rotation on 429. |
| Chunking / crawling | `src/lib/chunk.ts`, `src/lib/crawl.ts` | ~1800 chars, paragraph boundaries, 1-para overlap, title prefix. Crawler is regex-based html→text, same-origin links, no deps. |
| Supabase | `src/lib/supabase/{client,server,admin}.ts`, `supabase/schema.sql` | Tables: projects (public_key `prj_…`), sources, chunks (vector(768), HNSW), conversations, messages (grounded flag). RLS owner-scoped; chunks service-role-only; `match_chunks` RPC. No middleware — client-side auth guards. |
| Dashboard | `src/app/dashboard/page.tsx`, `src/app/dashboard/[id]/page.tsx` | Projects grid + create; project page tabs: Overview (stat tiles), Sources (URL/text/crawl-picker), Conversations (expandable transcripts, amber = ungrounded), Unanswered, Widget (settings + snippet + live preview iframe). All client components, RLS via browser client. |
| Auth | `src/app/login/page.tsx` | Email+password sign in/up. Handles email-confirmation case with a notice. |
| Landing | `src/app/page.tsx` | See design notes below. Demo widget loaded via `<Script src="/widget.js" data-project="demo">`. |
| Shell/notices | `src/components/{DashboardShell,EnvNotice}.tsx` | |

## Design language (user-driven — IMPORTANT, learned through feedback)

- **LIGHT palette only** — user rejected dark. Tokens in `globals.css`: bg `#fafaf8`, fg `#15151a`, accent `#7c5cff`, accent-2 `#06b6d4`. Fonts: Space Grotesk (display) + Inter (body) + JetBrains Mono + **Instrument Serif italic** accents (`.serif-it` on key words, usually in accent color).
- User called the first version "basic AI created" → rebuilt to editorial style: split hero with **animated fake-browser mockup running a scripted widget conversation on loop** (`HeroMock`), bento features with mini-visuals (NO icon-grid cards), black pill CTAs (violet is an accent, not button color), marquee, giant outline-text footer wordmark (`wisp✦`).
- **iOS frosted glass**: `.glass-ios` (nav, dashboard header) and `.glass` (cards) — blur+saturate with inset white top highlight.
- **Rejected & removed — do NOT re-suggest:** film grain overlay, scroll-following orb, scroll-drawn thread line. User dislikes scroll-follower gimmicks; keep the animations that exist.

## Gotchas for the next session

- **User pasted the Supabase REST endpoint** (`…/rest/v1/`) as the URL — auth broke with "Invalid path specified in request URL" while PostgREST failures looked like clean 404s. Fixed in `.env` AND hardened: `src/lib/supabase/url.ts` normalizes any pasted URL to its origin.
- `scripts/e2e.mjs` shows how to forge an `@supabase/ssr` auth cookie (`sb-<ref>-auth-token` = `base64-` + base64url(session JSON), chunked at 3180 chars) for cookie-authed API testing.

- **Next 16**: `params`/`cookies()` are async (handled everywhere). Scaffold's `AGENTS.md` says read `node_modules/next/dist/docs/` before assuming APIs. No middleware used (Next 16 renamed it `proxy.ts` — avoided entirely).
- PowerShell `Set-Content` writes BOM — use Write tool for files.
- Multiple `next dev` instances error ("Another next dev server is already running") — user's own server owns port 3000.
- `maxDuration = 60` set on chat + sources routes for Vercel.
- Chat streaming is plain text (no SSE framing) — the embed page just reads the body stream. Conversation id travels via `X-Conversation-Id` response header.
- Memory files exist at the project memory dir: `wisp-status.md`, `free-llm-tier-gotchas.md` (Gemini quota traps), `portfolio-site-status.md`.

## Related context

- User: Atharva Jadhav, game dev (Luau/Roblox at IGD Studios) + full-stack (Next.js/Supabase/Gemini), building portfolio for web-dev jobs. Resume at `Downloads/Atharva Jadhav Resume.pdf`.
- Sibling projects in `BS1/`: `strategist-hub` (AI content pipeline, on resume), `portfolio` (dark cinematic portfolio site — Wisp should eventually be embedded there as dogfood + linked as a project).
