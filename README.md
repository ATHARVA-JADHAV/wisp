# ✦ Wisp — AI support that already read your docs

An embeddable AI support widget. Feed it your site's content (paste text, a URL, or crawl the whole site), paste **one script tag**, and visitors get a chat bubble that answers questions grounded **only** in your content — streamed token-by-token, with every conversation (and every question it *couldn't* answer) logged in your dashboard.

```html
<script src="https://your-wisp.app/widget.js" data-project="prj_xxxxxxxx" async></script>
```

Full product/architecture spec: [PROJECT.md](./PROJECT.md)

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · Tailwind 4 · Framer Motion · Supabase (auth + Postgres + **pgvector**) · Gemini (`gemini-2.5-flash` chat, `gemini-embedding-001` embeddings)

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
