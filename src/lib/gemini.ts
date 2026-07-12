import { GoogleGenAI } from "@google/genai";

// GEMINI_API_KEY supports comma-separated keys from different accounts.
// On a quota error (429 / RESOURCE_EXHAUSTED) we rotate to the next key,
// so stacking free-tier keys raises the effective daily limit.
const keys = (process.env.GEMINI_API_KEY ?? "")
  .split(",")
  .map((k) => k.trim())
  .filter(Boolean);

let activeKey = 0;

export const hasGemini = keys.length > 0;

// Model fallback chain. Verified 2026-07-13: fresh accounts get 404 "no longer
// available to new users" on gemini-2.5-flash; 3.1-flash-lite works and lite
// tiers carry the generous free quotas (3.5-flash free tier is ~20/day).
// Quotas are PER MODEL, so on quota exhaustion the next model is a real fallback.
const CHAT_MODELS = [
  process.env.GEMINI_CHAT_MODEL,
  "gemini-3.1-flash-lite",
  "gemini-flash-lite-latest",
  "gemini-flash-latest",
  "gemini-2.5-flash",
].filter((m): m is string => Boolean(m));
let activeModel = 0;

const EMBED_MODEL = "gemini-embedding-001";
export const EMBED_DIMS = 768;

function isModelUnavailable(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /404|NOT_FOUND|no longer available|not found/i.test(msg);
}

function isQuotaError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /429|RESOURCE_EXHAUSTED|quota/i.test(msg);
}

async function withRotation<T>(fn: (ai: GoogleGenAI) => Promise<T>): Promise<T> {
  if (!keys.length) throw new Error("GEMINI_API_KEY is not set");
  let lastErr: unknown;
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const idx = (activeKey + attempt) % keys.length;
    try {
      const result = await fn(new GoogleGenAI({ apiKey: keys[idx] }));
      activeKey = idx;
      return result;
    } catch (err) {
      lastErr = err;
      if (!isQuotaError(err)) throw err;
    }
  }
  throw lastErr;
}

// Vectors truncated below the model's native 3072 dims must be re-normalized
// for cosine distance to be meaningful.
function normalize(v: number[]): number[] {
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / norm);
}

export async function embedTexts(
  texts: string[],
  taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY"
): Promise<number[][]> {
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += 100) {
    const batch = texts.slice(i, i + 100);
    const res = await withRotation((ai) =>
      ai.models.embedContent({
        model: EMBED_MODEL,
        contents: batch,
        config: { outputDimensionality: EMBED_DIMS, taskType },
      })
    );
    for (const e of res.embeddings ?? []) out.push(normalize(e.values ?? []));
  }
  return out;
}

export type ChatMessage = { role: "user" | "assistant"; content: string };

export async function streamChat(opts: { system: string; messages: ChatMessage[] }) {
  const contents = opts.messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  let lastErr: unknown;
  for (let attempt = 0; attempt < CHAT_MODELS.length; attempt++) {
    const idx = (activeModel + attempt) % CHAT_MODELS.length;
    const model = CHAT_MODELS[idx];
    try {
      const stream = await withRotation((ai) =>
        ai.models.generateContentStream({
          model,
          config: {
            systemInstruction: opts.system,
            maxOutputTokens: 2048,
            temperature: 0.4,
            // 2.5-series thinking is ON by default and silently eats output
            // tokens; 3.x models don't accept thinkingBudget the same way.
            ...(model.startsWith("gemini-2")
              ? { thinkingConfig: { thinkingBudget: 0 } }
              : {}),
          },
          contents,
        })
      );
      activeModel = idx;
      return stream;
    } catch (err) {
      lastErr = err;
      // unavailable model or fully quota-exhausted (all keys) → next model
      if (!isModelUnavailable(err) && !isQuotaError(err)) throw err;
    }
  }
  throw lastErr;
}
