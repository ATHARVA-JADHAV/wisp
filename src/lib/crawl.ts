// Minimal dependency-free page fetcher: pulls a URL, extracts readable text
// and same-origin links. Good enough for docs/marketing pages, which is the
// target content for a support widget.

const ENTITIES: Record<string, string> = {
  "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'",
  "&apos;": "'", "&nbsp;": " ", "&mdash;": "—", "&ndash;": "–",
  "&hellip;": "…", "&rsquo;": "'", "&lsquo;": "'", "&rdquo;": '"', "&ldquo;": '"',
};

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&[a-z]+;/gi, (m) => ENTITIES[m.toLowerCase()] ?? " ");
}

export type CrawledPage = { title: string; text: string; links: string[] };

export async function fetchPage(url: string): Promise<CrawledPage> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  let html: string;
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; WispBot/1.0; +https://wisp.chat)",
        Accept: "text/html",
      },
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
    const type = res.headers.get("content-type") ?? "";
    if (!type.includes("text/html") && !type.includes("text/plain")) {
      throw new Error(`Not an HTML page (${type})`);
    }
    html = await res.text();
  } finally {
    clearTimeout(timer);
  }

  const title =
    decodeEntities(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").trim() ||
    new URL(url).hostname;

  // strip non-content blocks before tag removal
  let body = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");

  // keep paragraph structure: block-level closers become double newlines
  body = body
    .replace(/<\/(p|div|section|article|li|h[1-6]|tr|blockquote|pre)>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ");

  const text = decodeEntities(body)
    .split("\n")
    .map((l) => l.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const origin = new URL(url).origin;
  const links = Array.from(
    new Set(
      Array.from(html.matchAll(/<a[^>]+href=["']([^"'#]+)["']/gi))
        .map((m) => {
          try {
            return new URL(m[1], url).toString().split("#")[0];
          } catch {
            return null;
          }
        })
        .filter((l): l is string => !!l && l.startsWith(origin))
        .filter((l) => !/\.(png|jpe?g|gif|webp|svg|ico|pdf|zip|mp4|css|js|xml|json)(\?|$)/i.test(l))
    )
  );

  return { title, text, links };
}
