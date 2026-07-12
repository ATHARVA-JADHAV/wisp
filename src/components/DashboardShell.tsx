"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, LogOut } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  async function signOut() {
    await supabaseBrowser().auth.signOut();
    router.push("/");
  }

  return (
    <div className="min-h-dvh bg-bg">
      <header className="glass-ios sticky top-0 z-40 border-x-0 border-t-0">
        <div className="mx-auto flex h-15 max-w-6xl items-center justify-between px-5 py-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-(family-name:--font-display) text-lg font-bold"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-fg">
              <Sparkles size={14} className="text-white" />
            </span>
            wisp
            <span className="ml-1 rounded-md bg-black/[0.04] px-1.5 py-0.5 font-(family-name:--font-mono) text-[10px] font-normal text-muted">
              dashboard
            </span>
          </Link>
          <button
            onClick={signOut}
            className="flex cursor-pointer items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-1.5 text-xs font-medium text-muted shadow-sm transition hover:border-red-300 hover:text-red-500"
          >
            <LogOut size={12} /> Sign out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
    </div>
  );
}
