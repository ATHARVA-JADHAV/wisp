import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Liveness check for the pieces Wisp cannot work without.
 *
 * This exists because a deleted Supabase project stayed invisible for weeks:
 * every route swallowed the connection error and returned a tidy 404, the
 * landing-page demo kept working (it is hardcoded and never touches the
 * database), and nothing anywhere said "the backend is gone".
 *
 * GET /api/health -> 200 { ok: true }  when the database answers
 *                    503 { ok: false } with the failing check named
 *
 * Point an uptime monitor at this and it will page you the day it breaks.
 */
export async function GET() {
  const checks: Record<string, { ok: boolean; detail?: string }> = {};

  // env presence — a missing var fails differently from a dead host
  const missing = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ].filter((k) => !process.env[k]);
  checks.env = missing.length
    ? { ok: false, detail: `missing: ${missing.join(", ")}` }
    : { ok: true };

  // can we actually reach the database? head+count transfers no rows.
  if (checks.env.ok) {
    try {
      const { error } = await supabaseAdmin()
        .from("projects")
        .select("id", { count: "exact", head: true });
      checks.database = error
        ? { ok: false, detail: error.message }
        : { ok: true };
    } catch (err) {
      checks.database = {
        ok: false,
        detail: err instanceof Error ? err.message : String(err),
      };
    }
  } else {
    checks.database = { ok: false, detail: "skipped — env incomplete" };
  }

  checks.gemini = process.env.GEMINI_API_KEY
    ? { ok: true }
    : { ok: false, detail: "GEMINI_API_KEY not set" };

  const ok = Object.values(checks).every((c) => c.ok);
  return Response.json({ ok, checks }, { status: ok ? 200 : 503 });
}
