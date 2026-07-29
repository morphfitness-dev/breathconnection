"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded border border-off-white/20 px-3 py-1.5 text-sm font-body text-off-white/80 transition hover:border-iron-orange hover:text-iron-orange"
    >
      Log Out
    </button>
  );
}
