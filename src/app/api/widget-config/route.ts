import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { DEMO_CONFIG } from "@/lib/demo";

// Public: the embed iframe fetches its appearance config by project key.
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key") ?? "";
  if (key === "demo") return Response.json(DEMO_CONFIG);

  const { data: project, error } = await supabaseAdmin()
    .from("projects")
    .select("bot_name, greeting, accent_color")
    .eq("public_key", key)
    .single();

  // PGRST116 = no row matched (unknown key → 404). Anything else is the database
  // being unreachable, which must NOT be reported as a 404 — see the note in
  // api/chat/route.ts for why that distinction matters.
  if (error && error.code !== "PGRST116") {
    console.error("widget-config: project lookup failed —", error.message);
    return Response.json({ error: "backend unavailable" }, { status: 503 });
  }
  if (!project) return Response.json({ error: "unknown project" }, { status: 404 });
  return Response.json(project);
}
