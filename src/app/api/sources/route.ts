import { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { fetchPage } from "@/lib/crawl";
import { chunkText } from "@/lib/chunk";
import { embedTexts } from "@/lib/gemini";

export const maxDuration = 60;

const MAX_TEXT = 200_000;
const MAX_CHUNKS_PER_SOURCE = 120;

// POST { projectId, type: "url" | "text", url?, text?, title?, discover? }
//  - discover: true  → just fetch the URL and return same-origin links (site crawl step 1)
//  - otherwise       → create the source, chunk + embed + store, return the indexed source
export async function POST(req: NextRequest) {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return Response.json({ error: "not signed in" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.projectId || !["url", "text"].includes(body?.type)) {
    return Response.json({ error: "projectId and type are required" }, { status: 400 });
  }

  // RLS-scoped read doubles as the ownership check
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", body.projectId)
    .single();
  if (!project) return Response.json({ error: "project not found" }, { status: 404 });

  if (body.discover && body.type === "url") {
    try {
      const page = await fetchPage(String(body.url));
      return Response.json({ title: page.title, links: page.links.slice(0, 30) });
    } catch (err) {
      return Response.json(
        { error: err instanceof Error ? err.message : "fetch failed" },
        { status: 422 }
      );
    }
  }

  // create the source row first so the UI can show "pending" if embedding is slow
  const title =
    (body.title as string)?.slice(0, 120) ||
    (body.type === "url" ? String(body.url) : "Pasted text");
  const { data: source, error: insertErr } = await supabase
    .from("sources")
    .insert({
      project_id: project.id,
      type: body.type,
      url: body.type === "url" ? String(body.url) : null,
      title,
    })
    .select("*")
    .single();
  if (insertErr || !source) {
    return Response.json({ error: insertErr?.message ?? "insert failed" }, { status: 500 });
  }

  const admin = supabaseAdmin();
  try {
    let text: string;
    let resolvedTitle = title;
    if (body.type === "url") {
      const page = await fetchPage(String(body.url));
      // dashboards/apps behind auth serve their login screen to the crawler —
      // indexing that silently poisons the knowledge base
      if (/\b(log ?in|sign ?in|sign ?up)\b/i.test(page.title)) {
        throw new Error(
          "That page shows a login screen to visitors — Wisp can only read public pages. Use your site's public URL instead."
        );
      }
      text = page.text;
      resolvedTitle = page.title || title;
    } else {
      text = String(body.text ?? "");
    }
    text = text.slice(0, MAX_TEXT);
    if (text.trim().length < 40) throw new Error("No readable content found on that page");

    const chunks = chunkText(text, resolvedTitle).slice(0, MAX_CHUNKS_PER_SOURCE);
    if (!chunks.length) throw new Error("Content too short to index");

    const embeddings = await embedTexts(chunks, "RETRIEVAL_DOCUMENT");
    const { error: chunkErr } = await admin.from("chunks").insert(
      chunks.map((content, i) => ({
        project_id: project.id,
        source_id: source.id,
        content,
        embedding: embeddings[i],
      }))
    );
    if (chunkErr) throw new Error(chunkErr.message);

    const { data: updated } = await admin
      .from("sources")
      .update({ status: "indexed", chunk_count: chunks.length, title: resolvedTitle, error: null })
      .eq("id", source.id)
      .select("*")
      .single();
    return Response.json({ source: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "indexing failed";
    const { data: failed } = await admin
      .from("sources")
      .update({ status: "error", error: message.slice(0, 300) })
      .eq("id", source.id)
      .select("*")
      .single();
    return Response.json({ source: failed, error: message }, { status: 422 });
  }
}

// DELETE { sourceId } — chunks cascade
export async function DELETE(req: NextRequest) {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return Response.json({ error: "not signed in" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.sourceId) return Response.json({ error: "sourceId required" }, { status: 400 });

  const { error } = await supabase.from("sources").delete().eq("id", body.sourceId);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
