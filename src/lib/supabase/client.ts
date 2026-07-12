"use client";
import { createBrowserClient } from "@supabase/ssr";
import { supabaseUrl } from "./url";

// NEXT_PUBLIC_* vars are inlined at build time — when they're missing (fresh
// clone, no .env.local yet) pages show a setup notice instead of crashing.
export const supabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export function supabaseBrowser() {
  return createBrowserClient(supabaseUrl(), process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
