// The landing page's own widget runs against project key "demo" — no database
// needed. With a GEMINI_API_KEY it answers from this knowledge blurb via the
// normal grounded prompt; with no key at all it falls back to canned answers
// with fake streaming, so the demo never breaks.

export const DEMO_CONFIG = {
  bot_name: "Wisp",
  greeting: "Hey! I'm Wisp — this very widget is the product. Ask me how it works, what it costs, or how to add it to your site ✨",
  accent_color: "#8b5cf6",
};

export const DEMO_KNOWLEDGE = `
[What is Wisp]
Wisp is an embeddable AI support widget. A site owner feeds Wisp their docs, FAQ, or just their website URL, and gets a single script tag to paste into their site. Visitors then see a chat bubble that answers questions using ONLY that site's content — no hallucinated answers about other products. The widget you are talking to right now is Wisp itself, answering from its own docs.

[How installation works]
Installation takes under five minutes: 1) Sign up and create a project. 2) Add knowledge sources — paste text, add a URL, or let Wisp crawl your site. 3) Copy the one-line script tag from the dashboard and paste it before the closing body tag of your site. It works on any website: plain HTML, React, Next.js, WordPress, Webflow, Shopify — anything that can include a script tag. The script is async, about 5KB, never blocks page load, and fails silently if the server is ever down.

[How it works under the hood]
Wisp uses RAG (retrieval-augmented generation). Your content is split into chunks and embedded into vectors stored in Postgres with pgvector. When a visitor asks a question, Wisp embeds the question, finds the most similar chunks from YOUR content only, and has Gemini answer strictly from that context. If the answer isn't in your content, Wisp says it doesn't know instead of making something up — and logs the question so you can see what docs to write.

[The dashboard]
The dashboard shows every conversation visitors have had, an Unanswered Questions report (the questions your bot couldn't answer — a ranked to-do list of docs to write), your indexed sources with re-crawl controls, and widget appearance settings: accent color, bot name, and greeting message.

[Pricing]
Wisp is currently free while in beta. It runs on generous free infrastructure tiers, and the project is open source — built by Atharva Jadhav as a portfolio flagship.

[Privacy and security]
The chat runs inside an iframe, so the host page cannot read conversations and the host page's CSS cannot break the widget. Each project's content is isolated — the vector search is always filtered to a single project, so one customer's bot can never leak another customer's content.
`.trim();

export const DEMO_CANNED: { match: RegExp; answer: string }[] = [
  {
    match: /install|add|embed|setup|set up|integrate|script|snippet|website|my site|shopify|wordpress|react|next/i,
    answer:
      "Adding Wisp takes under 5 minutes: create a project, add your content (paste text, a URL, or crawl your whole site), then paste one script tag before </body>:\n\n<script src=\"https://your-wisp.app/widget.js\" data-project=\"prj_xxx\" async></script>\n\nIt works on any site — HTML, React, Next.js, WordPress, Webflow, Shopify — and it's async, ~5KB, and never blocks your page.",
  },
  {
    match: /price|pricing|cost|free|pay|plan/i,
    answer:
      "Wisp is free while in beta ✨ It runs on generous free infrastructure tiers (Vercel + Supabase + Gemini), and it's an open-source portfolio project by Atharva Jadhav.",
  },
  {
    match: /how.*(work|answer)|rag|embed|vector|ai|model|hallucinat|accurate/i,
    answer:
      "Wisp uses RAG — retrieval-augmented generation. Your content gets chunked and embedded into vectors (pgvector in Postgres). When a visitor asks something, Wisp finds the most similar chunks from YOUR content only and has Gemini answer strictly from that context. If the answer isn't in your docs, Wisp says so instead of making something up — and logs the question in your Unanswered report.",
  },
  {
    match: /dashboard|analytics|conversation|unanswered|report/i,
    answer:
      "The dashboard shows every visitor conversation, your indexed sources, widget appearance settings, and — the best part — an Unanswered Questions report: a ranked list of things visitors asked that your bot couldn't answer. It's basically a to-do list of docs you should write.",
  },
  {
    match: /secur|privacy|iframe|isolat|leak/i,
    answer:
      "The chat runs inside an iframe, so the host page can't read conversations and its CSS can't break the widget. Every project's content is isolated — vector search is always filtered to one project, so one customer's bot can never leak another's content.",
  },
];

export const DEMO_FALLBACK =
  "I'm the live demo of Wisp — an embeddable AI support widget that answers from your site's own content. Try asking me how installation works, what it costs, how the AI stays accurate, or what the dashboard shows!";
