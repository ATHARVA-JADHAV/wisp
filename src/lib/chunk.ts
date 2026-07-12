// Split cleaned text into ~1800-char chunks (~450 tokens) on paragraph
// boundaries, with one-paragraph overlap so answers spanning a boundary
// still retrieve. Each chunk is prefixed with the source title for context.
const MAX_CHUNK = 1800;

export function chunkText(text: string, title: string): string[] {
  const paragraphs = text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    // a paragraph longer than a whole chunk gets hard-split on sentences
    .flatMap((p) => (p.length <= MAX_CHUNK ? [p] : splitLong(p)));

  const chunks: string[] = [];
  let current: string[] = [];
  let size = 0;

  for (const p of paragraphs) {
    if (size + p.length > MAX_CHUNK && current.length > 0) {
      chunks.push(current.join("\n\n"));
      const overlap = current[current.length - 1];
      current = overlap.length < 400 ? [overlap] : [];
      size = current.reduce((s, x) => s + x.length, 0);
    }
    current.push(p);
    size += p.length;
  }
  if (current.length) chunks.push(current.join("\n\n"));

  return chunks
    .filter((c) => c.length > 40)
    .map((c) => `[${title}]\n${c}`);
}

function splitLong(p: string): string[] {
  const sentences = p.match(/[^.!?]+[.!?]+\s*|[^.!?]+$/g) ?? [p];
  const parts: string[] = [];
  let buf = "";
  for (const s of sentences) {
    if (buf.length + s.length > MAX_CHUNK && buf) {
      parts.push(buf.trim());
      buf = "";
    }
    buf += s;
  }
  if (buf.trim()) parts.push(buf.trim());
  return parts;
}
