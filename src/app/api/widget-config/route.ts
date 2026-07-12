import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { DEMO_CONFIG } from "@/lib/demo";

// Public: the embed iframe fetches its appearance config by project key.
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key") ?? "";
  if (key === "demo") return Response.json(DEMO_CONFIG);

  const { data: project } = await supabaseAdmin()
    .from("projects")
    .select("bot_name, greeting, accent_color")
    .eq("public_key", key)
    .single();

  if (!project) return Response.json({ error: "unknown project" }, { status: 404 });
  return Response.json(project);
}
