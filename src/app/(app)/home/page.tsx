import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const displayName =
    user.user_metadata?.name ??
    user.email?.split("@")[0] ??
    "there";

  return (
    <div className="min-h-screen bg-[#F5F3EE]">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-[#085041]">
            Welcome back, {displayName}
          </h1>
          <p className="text-[#085041]/60 mt-2">
            Your breathwork journey continues here.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#1D9E75]/10 p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-[#1D9E75] animate-pulse" />
            <span className="text-sm font-medium text-[#1D9E75]">
              Loading
            </span>
          </div>
          <p className="text-[#085041]/70 text-sm">
            Your programme is loading...
          </p>
        </div>
      </div>
    </div>
  );
}
