# ✦ Wisp — AI support that already read your docs

An embeddable AI support widget. Feed it your site's content (paste text, a URL, or crawl the whole site), paste **one script tag**, and visitors get a chat bubble that answers questions grounded **only** in your content — streamed token-by-token, with every conversation (and every question it *couldn't* answer) logged in your dashboard.

```html
<script src="https://your-wisp.app/widget.js" data-project="prj_xxxxxxxx" async></script>
```

Full product/architecture spec: [PROJECT.md](./PROJECT.md)

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · Tailwind 4 · Framer Motion · Supabase (auth + Postgres + **pgvector**) · Gemini (`gemini-embedding-001` embeddings at 768 dims; chat runs a model fallback chain starting at `gemini-3.1-flash-lite` — see `src/lib/gemini.ts`)

## How it works

Content in → chunks → 768-dim embeddings → pgvector. A question in → embed the
question → cosine-similarity search for the top 5 chunks over **that project
only** → drop anything below 0.35 similarity → build a system prompt that
permits nothing outside that context → stream the answer back as plain text.

When the model can't answer from the content it emits a sentinel token, which
the server strips before the visitor sees it and records as `grounded = false`
on the message row. Every one of those becomes a line in the owner's
**Unanswered** report — which is the actual product: a list of the questions
your documentation fails to answer.

## Setup

1. **Install & env**
   ```bash
   npm install
   cp .env.example .env.local   # then fill it in
   ```

2. **Supabase** (free tier)
   - Create a project at [supabase.com/dashboard](https://supabase.com/dashboard)
   - Project Settings → API → copy the **bare** project URL (`https://xxxx.supabase.co`), the anon key, and the service_role key into `.env.local`
   - SQL Editor → paste and run [`supabase/schema.sql`](./supabase/schema.sql) (enables pgvector, creates tables + RLS + the `match_chunks` RPC)
   - For local dev, optionally turn off email confirmation: Authentication → Providers → Email → disable "Confirm email"

   > **Upgrading an existing database** created before visitor grouping shipped?
   > `schema.sql` is idempotent so re-running it is safe, but the one column it
   > cannot add retroactively is on `conversations`. Run this once:
   > ```sql
   > alter table conversations add column if not exists visitor_id text;
   > ```
   > Without it chat still answers, but nothing is logged to the dashboard.

3. **Gemini** (free tier)
   - Get a key at [aistudio.google.com](https://aistudio.google.com)
   - `GEMINI_API_KEY` supports **multiple comma-separated keys** from different accounts — Wisp auto-rotates to the next key on quota errors (429), so stacking free keys raises your daily limit

4. **Run**
   ```bash
   npm run dev
   ```
   - `http://localhost:3000` — landing page, with the demo widget live in the corner (works with **zero env vars**: without a Gemini key the demo falls back to canned answers, with a key it does real RAG over Wisp's own docs)
   - Sign up → create a project → index a URL or paste text → Widget tab → copy your snippet

## How the pieces fit

| Piece | File(s) |
|---|---|
| Widget loader (script tag → button + iframe) | `public/widget.js` |
| Chat UI inside the iframe | `src/app/embed/[projectKey]/page.tsx` |
| Streaming RAG chat API | `src/app/api/chat/route.ts` |
| Ingestion (fetch → chunk → embed → store) | `src/app/api/sources/route.ts`, `src/lib/{crawl,chunk}.ts` |
| Gemini client (key rotation, thinking off) | `src/lib/gemini.ts` |
| Dashboard (sources, conversations, unanswered, widget settings) | `src/app/dashboard/**` |
| DB schema + RLS + vector search RPC | `supabase/schema.sql` |

## Deploying

Vercel free tier works out of the box (`maxDuration = 60` is set on the heavy routes). Set the same env vars in the Vercel project, plus `NEXT_PUBLIC_APP_URL=https://<your-domain>` so dashboard embed snippets point at production.
