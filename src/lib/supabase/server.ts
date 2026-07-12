import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabaseUrl } from "./url";

// Cookie-authenticated client for API routes — used to verify the calling
// user owns the project they're mutating. RLS does the actual enforcement.
export async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    supabaseUrl(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => {
          try {
            list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // called from a Server Component — safe to ignore, middleware not needed for API routes
          }
        },
      },
    }
  );
}
