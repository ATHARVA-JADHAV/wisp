// Supabase's dashboard makes it easy to copy the REST endpoint
// (https://x.supabase.co/rest/v1/) instead of the bare project URL, which
// breaks auth requests. Normalize to the origin so either paste works.
export function supabaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  try {
    return new URL(raw).origin;
  } catch {
    return raw;
  }
}
