import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ClientDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users_profile")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "client") {
    redirect("/login");
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl">Your Programme</h1>
      <p className="mt-4 font-body text-off-white/70">
        Welcome back, {profile.full_name}.
      </p>
    </main>
  );
}
