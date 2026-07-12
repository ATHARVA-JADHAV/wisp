import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./url";

// Service-role client — bypasses RLS. Server-only: used by /api/chat (widget
// visitors have no Supabase session) and by the ingestion pipeline to write
// chunks. NEVER import from client components.
export function supabaseAdmin() {
  return createClient(supabaseUrl(), process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
