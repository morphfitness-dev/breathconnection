import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const adminEmails = (process.env.ADMIN_EMAIL ?? "").split(",").map((e) => e.trim());
  if (!adminEmails.includes(user.email ?? "")) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-[#F5F3EE]">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-[#085041] text-white flex flex-col">
        <div className="px-6 py-5 border-b border-[#1D9E75]">
          <span className="text-lg font-semibold tracking-tight">Admin</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <Link
            href="/admin/videos"
            className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-[#1D9E75] transition-colors"
          >
            Videos
          </Link>
          <Link
            href="/admin/exercises"
            className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-[#1D9E75] transition-colors"
          >
            Exercises
          </Link>
          <Link
            href="/admin/programmes"
            className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-[#1D9E75] transition-colors"
          >
            Programmes
          </Link>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
